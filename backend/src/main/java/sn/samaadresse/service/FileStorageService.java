package sn.samaadresse.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import sn.samaadresse.exception.InvalidImageException;
import sn.samaadresse.security.HashUtils;
import sn.samaadresse.security.ImageMagicBytesValidator;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

public class FileStorageService implements PhotoStorage {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    protected final ImageMagicBytesValidator magicBytesValidator;
    private Path rootPath;

    public FileStorageService(ImageMagicBytesValidator magicBytesValidator) {
        this("./uploads", magicBytesValidator);
    }

    public FileStorageService(String uploadDir, ImageMagicBytesValidator magicBytesValidator) {
        this.uploadDir = uploadDir;
        this.magicBytesValidator = magicBytesValidator;
        init();
    }

    @PostConstruct
    public void init() {
        try {
            this.rootPath = Paths.get(uploadDir != null ? uploadDir : "./uploads").toAbsolutePath().normalize();
            Files.createDirectories(this.rootPath);
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'initialiser le répertoire de stockage des images : " + uploadDir, e);
        }
    }

    public record ProcessedImage(byte[] bytes, String extension, String contentType) {}

    public ProcessedImage validateAndProcessImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Le fichier d'image est vide ou absent.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidImageException("La taille du fichier dépasse la limite maximale de 5 Mo (taille actuelle: " + (file.getSize() / (1024 * 1024)) + " Mo).");
        }

        byte[] rawBytes;
        try {
            rawBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidImageException("Erreur lors de la lecture du fichier d'image.");
        }

        if (rawBytes.length < 12) {
            throw new InvalidImageException("Le fichier est trop petit pour être une image valide.");
        }

        byte[] headerBytes = new byte[12];
        System.arraycopy(rawBytes, 0, headerBytes, 0, 12);

        String extension = magicBytesValidator.detectExtensionFromMagicBytes(headerBytes);
        if (extension == null) {
            throw new InvalidImageException("Format d'image non valide ou contenu falsifié. Seuls les formats JPEG, PNG et WebP sont autorisés.");
        }

        String contentType = contentTypeForExtension(extension);

        try (InputStream in = new ByteArrayInputStream(rawBytes)) {
            java.awt.image.BufferedImage original = javax.imageio.ImageIO.read(in);
            if (original != null && original.getWidth() > 800) {
                int newWidth = 800;
                int newHeight = (int) Math.round(((double) original.getHeight() / original.getWidth()) * newWidth);
                java.awt.image.BufferedImage resized = new java.awt.image.BufferedImage(
                        newWidth,
                        newHeight,
                        original.getType() == 0 ? java.awt.image.BufferedImage.TYPE_INT_RGB : original.getType()
                );
                java.awt.Graphics2D g2d = resized.createGraphics();
                g2d.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g2d.drawImage(original, 0, 0, newWidth, newHeight, null);
                g2d.dispose();

                String formatName = extension.replace(".", "").toLowerCase();
                if ("jpg".equals(formatName)) {
                    formatName = "jpeg";
                }
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                boolean written = javax.imageio.ImageIO.write(resized, formatName, baos);
                if (written && baos.size() > 0) {
                    return new ProcessedImage(baos.toByteArray(), extension, contentType);
                }
            }
        } catch (Exception ignored) {
            // Repli sur les octets d'origine si le redimensionnement ImageIO échoue
        }

        return new ProcessedImage(rawBytes, extension, contentType);
    }

    public static String contentTypeForExtension(String ext) {
        if (ext == null) return "image/jpeg";
        String lower = ext.toLowerCase();
        if (lower.endsWith("png")) return "image/png";
        if (lower.endsWith("webp")) return "image/webp";
        return "image/jpeg";
    }

    @Override
    public String storeFile(MultipartFile file) {
        ProcessedImage processed = validateAndProcessImage(file);
        String uniqueFilename = UUID.randomUUID() + processed.extension();
        Path targetLocation = this.rootPath.resolve(uniqueFilename).normalize();
        try {
            Files.write(targetLocation, processed.bytes());
            return "/uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur d'écriture du fichier d'image sur le disque.", e);
        }
    }

    @Override
    public String storeSeedPhoto(UUID id, byte[] data, String contentType) {
        String filename = id.toString() + ".jpg";
        Path targetLocation = this.rootPath.resolve(filename).normalize();
        try {
            if (!Files.exists(targetLocation)) {
                Files.write(targetLocation, data);
            }
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur d'écriture de l'image de démo sur le disque.", e);
        }
    }

    @Override
    public void deleteFile(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return;
        }
        String filename = extractSafeFilename(photoUrl);
        if (filename == null) {
            return;
        }
        Path targetLocation = this.rootPath.resolve(filename).normalize();
        if (!targetLocation.startsWith(this.rootPath)) {
            return;
        }
        try {
            Files.deleteIfExists(targetLocation);
        } catch (IOException ignored) {
        }
    }

    @Override
    public Optional<PhotoResource> loadPhoto(String filename) {
        String safe = extractSafeFilename(filename);
        if (safe == null) {
            return Optional.empty();
        }
        Path targetLocation = this.rootPath.resolve(safe).normalize();
        if (!targetLocation.startsWith(this.rootPath) || !Files.exists(targetLocation)) {
            return Optional.empty();
        }
        try {
            byte[] data = Files.readAllBytes(targetLocation);
            String contentType = contentTypeForExtension(safe);
            String etag = HashUtils.hashSha256(safe + ":" + data.length).substring(0, 32);
            return Optional.of(new PhotoResource(data, contentType, etag));
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public static String extractSafeFilename(String pathOrName) {
        if (pathOrName == null || pathOrName.isBlank()) {
            return null;
        }
        String filename = pathOrName.startsWith("/uploads/")
                ? pathOrName.substring("/uploads/".length())
                : pathOrName;
        if (filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        return filename;
    }

    public Path getRootPath() {
        return rootPath;
    }
}

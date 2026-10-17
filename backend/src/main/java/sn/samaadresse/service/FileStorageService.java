package sn.samaadresse.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import sn.samaadresse.exception.InvalidImageException;
import sn.samaadresse.security.ImageMagicBytesValidator;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private final ImageMagicBytesValidator magicBytesValidator;
    private Path rootPath;

    public FileStorageService(ImageMagicBytesValidator magicBytesValidator) {
        this("./uploads", magicBytesValidator);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public FileStorageService(@Value("${upload.dir:./uploads}") String uploadDir, ImageMagicBytesValidator magicBytesValidator) {
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

    /**
     * Valide et stocke une image d'adresse.
     *
     * @param file Le fichier multipart reçu
     * @return L'URL relative du fichier stocké (ex: "/uploads/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg")
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Le fichier d'image est vide ou absent.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidImageException("La taille du fichier dépasse la limite maximale de 5 Mo (taille actuelle: " + (file.getSize() / (1024 * 1024)) + " Mo).");
        }

        // Inspection binaire stricte des magic bytes
        byte[] headerBytes = new byte[12];
        try (InputStream inputStream = file.getInputStream()) {
            int bytesRead = inputStream.read(headerBytes, 0, 12);
            if (bytesRead < 12) {
                throw new InvalidImageException("Le fichier est trop petit pour être une image valide.");
            }
        } catch (IOException e) {
            throw new InvalidImageException("Erreur lors de la lecture des en-têtes du fichier d'image.");
        }

        String extension = magicBytesValidator.detectExtensionFromMagicBytes(headerBytes);
        if (extension == null) {
            throw new InvalidImageException("Format d'image non valide ou contenu falsifié. Seuls les formats JPEG, PNG et WebP sont autorisés.");
        }

        // Génération d'un nom unique sécurisé (zéro utilisation du nom fourni par le client)
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        Path targetLocation = this.rootPath.resolve(uniqueFilename).normalize();

        try {
            // Optimisation serveur : si image > 800px, redimensionner à largeur max 800px
            try (InputStream in = file.getInputStream()) {
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
                    boolean written = javax.imageio.ImageIO.write(resized, formatName, targetLocation.toFile());
                    if (written) {
                        return "/uploads/" + uniqueFilename;
                    }
                }
            } catch (Exception ignored) {
                // Repli direct sur copie standard si décodage ImageIO échoue
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur d'écriture du fichier d'image sur le disque.", e);
        }
    }

    /**
     * Supprime le fichier photo du disque s'il existe.
     *
     * @param photoUrl L'URL relative (ex: "/uploads/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg")
     */
    public void deleteFile(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return;
        }
        String filename = photoUrl.startsWith("/uploads/")
                ? photoUrl.substring("/uploads/".length())
                : photoUrl;
        if (filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return;
        }
        Path targetLocation = this.rootPath.resolve(filename).normalize();
        if (!targetLocation.startsWith(this.rootPath)) {
            return;
        }
        try {
            Files.deleteIfExists(targetLocation);
        } catch (IOException ignored) {
            // Ignoré silencieusement si le fichier n'est plus accessible
        }
    }

    public Path getRootPath() {
        return rootPath;
    }
}

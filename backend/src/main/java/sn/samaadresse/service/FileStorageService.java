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
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur d'écriture du fichier d'image sur le disque.", e);
        }
    }

    public Path getRootPath() {
        return rootPath;
    }
}

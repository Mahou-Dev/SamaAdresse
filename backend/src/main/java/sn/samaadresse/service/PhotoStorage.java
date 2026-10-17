package sn.samaadresse.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

/**
 * Abstraction du stockage des photos de façade :
 * - DiskPhotoStorage (STORAGE_TYPE=disk, profil dev/e2e)
 * - DbPhotoStorage   (STORAGE_TYPE=db, profil prod)
 */
public interface PhotoStorage {

    record PhotoResource(byte[] data, String contentType, String etag) {}

    /**
     * Valide (magic bytes, <= 5 Mo), redimensionne (max 800 px) et stocke une image.
     *
     * @param file Fichier multipart reçu
     * @return URL relative de la forme "/uploads/{uuid}.jpg"
     */
    String storeFile(MultipartFile file);

    /**
     * Stocke de manière idempotente une photo à partir d'octets bruts avec un UUID déterministe (seeder).
     */
    String storeSeedPhoto(UUID id, byte[] data, String contentType);

    /**
     * Supprime une photo à partir de son URL relative ("/uploads/{uuid}.jpg").
     */
    void deleteFile(String photoUrl);

    /**
     * Charge les octets, le type MIME et l'ETag d'une photo à partir de son nom de fichier ("{uuid}.jpg").
     */
    Optional<PhotoResource> loadPhoto(String filename);
}

package sn.samaadresse.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sn.samaadresse.domain.entity.PhotoBlob;
import sn.samaadresse.repository.PhotoBlobRepository;
import sn.samaadresse.security.HashUtils;
import sn.samaadresse.security.ImageMagicBytesValidator;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Implémentation base de données (PostgreSQL bytea) de PhotoStorage (STORAGE_TYPE=db, production Render).
 */
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "db")
public class DbPhotoStorage extends FileStorageService {

    private final PhotoBlobRepository photoBlobRepository;

    @Autowired
    public DbPhotoStorage(
            PhotoBlobRepository photoBlobRepository,
            ImageMagicBytesValidator magicBytesValidator
    ) {
        super(magicBytesValidator);
        this.photoBlobRepository = photoBlobRepository;
    }

    @Override
    @Transactional
    public String storeFile(MultipartFile file) {
        ProcessedImage processed = validateAndProcessImage(file);
        UUID id = UUID.randomUUID();
        PhotoBlob blob = PhotoBlob.builder()
                .id(id)
                .data(processed.bytes())
                .contentType(processed.contentType())
                .sizeBytes(processed.bytes().length)
                .createdAt(Instant.now())
                .build();
        photoBlobRepository.save(blob);
        return "/uploads/" + id + ".jpg";
    }

    @Override
    @Transactional
    public String storeSeedPhoto(UUID id, byte[] data, String contentType) {
        if (!photoBlobRepository.existsById(id)) {
            PhotoBlob blob = PhotoBlob.builder()
                    .id(id)
                    .data(data)
                    .contentType(contentType != null ? contentType : "image/jpeg")
                    .sizeBytes(data.length)
                    .createdAt(Instant.now())
                    .build();
            photoBlobRepository.save(blob);
        }
        return "/uploads/" + id + ".jpg";
    }

    @Override
    @Transactional
    public void deleteFile(String photoUrl) {
        UUID id = extractUuid(photoUrl);
        if (id != null && photoBlobRepository.existsById(id)) {
            photoBlobRepository.deleteById(id);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PhotoResource> loadPhoto(String filename) {
        UUID id = extractUuid(filename);
        if (id == null) {
            return Optional.empty();
        }
        return photoBlobRepository.findById(id).map(blob -> {
            String etag = HashUtils.hashSha256(blob.getId().toString() + ":" + blob.getSizeBytes()).substring(0, 32);
            return new PhotoResource(blob.getData(), blob.getContentType(), etag);
        });
    }

    public static UUID extractUuid(String pathOrFilename) {
        String safe = extractSafeFilename(pathOrFilename);
        if (safe == null) {
            return null;
        }
        int dotIdx = safe.indexOf('.');
        String uuidPart = dotIdx > 0 ? safe.substring(0, dotIdx) : safe;
        try {
            return UUID.fromString(uuidPart);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

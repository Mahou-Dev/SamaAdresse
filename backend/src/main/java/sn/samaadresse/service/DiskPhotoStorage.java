package sn.samaadresse.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import sn.samaadresse.security.ImageMagicBytesValidator;

/**
 * Implémentation disque de PhotoStorage (STORAGE_TYPE=disk, défaut en dev/e2e).
 */
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "disk", matchIfMissing = true)
public class DiskPhotoStorage extends FileStorageService {

    public DiskPhotoStorage(ImageMagicBytesValidator magicBytesValidator) {
        super(magicBytesValidator);
    }

    @Autowired
    public DiskPhotoStorage(
            @Value("${upload.dir:./uploads}") String uploadDir,
            ImageMagicBytesValidator magicBytesValidator
    ) {
        super(uploadDir, magicBytesValidator);
    }
}

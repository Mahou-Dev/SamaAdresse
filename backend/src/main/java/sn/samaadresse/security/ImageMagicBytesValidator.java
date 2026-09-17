package sn.samaadresse.security;

import org.springframework.stereotype.Component;

@Component
public class ImageMagicBytesValidator {

    /**
     * Inspecte les premiers octets (magic bytes) du contenu du fichier pour détecter son type d'image réel.
     * NE FAIT PAS CONFIANCE au Content-Type déclaré ni à l'extension du fichier.
     *
     * @param bytes Les premiers octets du fichier (au moins 12 octets requis)
     * @return L'extension déduite du type MIME binaire (".jpg", ".png", ".webp") ou null si non valide.
     */
    public String detectExtensionFromMagicBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return null;
        }

        // 1. Vérification JPEG : FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return ".jpg";
        }

        // 2. Vérification PNG : 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
            return ".png";
        }

        // 3. Vérification WebP : RIFF (0-3) ... WEBP (8-11)
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
            bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return ".webp";
        }

        return null;
    }
}

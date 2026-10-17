package sn.samaadresse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.samaadresse.repository.AddressRepository;

import java.security.SecureRandom;

/**
 * Service de génération de code d'adresse court au format ZONE-QUARTIER-XXXX.
 *
 * JUSTIFICATION DU CHOIX ALGORITHMIQUE (TIRAGE ALEATOIRE VS HASH DETERMINISTE) :
 * -----------------------------------------------------------------------------
 * 1. Confidencialité & Imprévisibilité : Un compteur séquentiel (0001, 0002) permettrait
 *    d'énumérer l'intégralité du registre d'adresses du Sénégal. Un hash déterministe des
 *    coordonnées permettrait de calculer le code d'une adresse physique sans autorisation.
 * 2. Tolérance aux imprécisions GPS : Deux mesures GPS successives de la même concession
 *    (ex: 12.573841 vs 12.573842) produiraient deux hashes différents, générant des doublons.
 * 3. Solution retenue : Tirage aléatoire de 4 chiffres (1000 à 9999) via SecureRandom avec
 *    vérification d'unicité en base de données (retry loop en cas d'éventuelle collision).
 *    Le code est fixé de manière immuable dès sa première génération.
 */
@Service
public class AddressCodeGenerator {

    private final AddressRepository addressRepository;
    private final sn.samaadresse.repository.ReservedCodeRepository reservedCodeRepository;
    private final SecureRandom random = new SecureRandom();
    private static final int MAX_RETRY_ATTEMPTS = 50;

    public AddressCodeGenerator(AddressRepository addressRepository) {
        this(addressRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AddressCodeGenerator(AddressRepository addressRepository,
                                sn.samaadresse.repository.ReservedCodeRepository reservedCodeRepository) {
        this.addressRepository = addressRepository;
        this.reservedCodeRepository = reservedCodeRepository;
    }

    public String generateCode(String zoneCode, String quartierCode) {
        for (int attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
            int suffixNumber = 1000 + random.nextInt(9000); // Génère un nombre entre 1000 et 9999
            String code = String.format("%s-%s-%04d", zoneCode, quartierCode, suffixNumber);

            boolean addressExists = addressRepository.existsByCode(code);
            boolean reservedExists = reservedCodeRepository != null && reservedCodeRepository.existsByCode(code);

            if (!addressExists && !reservedExists) {
                return code;
            }
        }
        throw new IllegalStateException("Impossible de générer un code d'adresse unique après plusieurs tentatives (saturation de la sous-zone)");
    }
}

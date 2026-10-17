package sn.samaadresse.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.service.AddressService;

import java.time.Instant;
import java.util.List;

/**
 * Seeder de données de démonstration actif UNIQUEMENT sous les profils 'dev' et 'e2e'.
 * Initialise : 1 administrateur, 2 utilisateurs, 12 adresses Ziguinchor réalistes (3 photos, 2 listées dans l'annuaire).
 * Ne s'exécute JAMAIS sous le profil prod.
 */
@Slf4j
@Component
@Profile({"dev", "e2e"})
public class DemoDataSeeder implements ApplicationRunner {

    public static final String DEMO_OWNER_EMAIL = "demo@samaadresse.sn";
    public static final String DEMO_FATOU_EMAIL = "fatou@samaadresse.sn";
    public static final String DEMO_ADMIN_EMAIL = "admin@samaadresse.sn";
    public static final String DEMO_PASSWORD    = "Password123!";

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, null, passwordEncoder);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public DemoDataSeeder(UserRepository userRepository, AddressRepository addressRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("[SEED-DEMO] Initialisation des comptes et adresses de démonstration (dev/e2e)...");

        // 1. Administrateur
        User admin = userRepository.findByEmail(DEMO_ADMIN_EMAIL).orElseGet(() -> {
            User u = User.builder()
                    .fullName("Admin SamaAdresse")
                    .email(DEMO_ADMIN_EMAIL)
                    .phoneNumber("+221770000000")
                    .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });

        // 2. Utilisateurs (Mamadou et Fatou)
        User mamadou = userRepository.findByEmail(DEMO_OWNER_EMAIL).orElseGet(() -> {
            User u = User.builder()
                    .fullName("Mamadou Diallo")
                    .email(DEMO_OWNER_EMAIL)
                    .phoneNumber("+221771234567")
                    .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                    .role(Role.PROPRIETAIRE)
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });

        User fatou = userRepository.findByEmail(DEMO_FATOU_EMAIL).orElseGet(() -> {
            User u = User.builder()
                    .fullName("Fatou Ndiaye")
                    .email(DEMO_FATOU_EMAIL)
                    .phoneNumber("+221772345678")
                    .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                    .role(Role.PROPRIETAIRE)
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });

        // 3. 12 adresses Ziguinchor réalistes
        seedAddressesIfAbsent(mamadou, fatou);
        log.info("[SEED-DEMO] Données de démonstration initialisées avec succès.");
    }

    private void seedAddressesIfAbsent(User mamadou, User fatou) {
        if (addressRepository == null) {
            return;
        }
        record DemoAddrDef(
                String code, Double lat, Double lon, String zone, String quartier,
                LocationType type, String desc, String photo, boolean listed, boolean showOwner, User owner
        ) {}

        List<DemoAddrDef> defs = List.of(
                // 1. Listée avec nom affiché + photo (Maison Mamadou)
                new DemoAddrDef("ZIG-KBG-4271", 12.5738, -16.2650, "ZIG", "KBG",
                        LocationType.MAISON, "Maison familiale au portail vert face à la grande mosquée",
                        "/uploads/demo-facade-1.jpg", true, true, mamadou),

                // 2. Listée sans nom affiché + photo (Pharmacie Fatou)
                new DemoAddrDef("ZIG-ESC-1042", 12.5852, -16.2684, "ZIG", "ESC",
                        LocationType.COMMERCE, "Pharmacie de l'Escale et cabinet de soins",
                        "/uploads/demo-facade-2.jpg", true, false, fatou),

                // 3. Non listée avec photo (Commerce Mamadou)
                new DemoAddrDef("ZIG-TIL-3015", 12.5654, -16.2948, "ZIG", "TIL",
                        LocationType.COMMERCE, "Boutique d'alimentation générale et dépôt de gaz",
                        "/uploads/demo-facade-3.jpg", false, false, mamadou),

                // 4. Non listée (Maison Fatou)
                new DemoAddrDef("ZIG-KND-5012", 12.5542, -16.2731, "ZIG", "KND",
                        LocationType.MAISON, "Grande concession familiale avec manguier dans la cour",
                        null, false, false, fatou),

                // 5. Non listée (Institution Mamadou)
                new DemoAddrDef("ZIG-NEM-6021", 12.5583, -16.2455, "ZIG", "NEM",
                        LocationType.INSTITUTION, "Poste de santé communautaire de Néma Kadialang",
                        null, false, false, mamadou),

                // 6. Non listée (Commerce Fatou)
                new DemoAddrDef("ZIG-KBG-4272", 12.5715, -16.2680, "ZIG", "KBG",
                        LocationType.COMMERCE, "Atelier de menuiserie métallique et ferronnerie",
                        null, false, false, fatou),

                // 7. Non listée (Maison Mamadou)
                new DemoAddrDef("ZIG-ESC-1088", 12.5880, -16.2645, "ZIG", "ESC",
                        LocationType.MAISON, "Résidence fleurie près du débarcadère",
                        null, false, false, mamadou),

                // 8. Non listée (Maison Fatou)
                new DemoAddrDef("ZIG-TIL-3040", 12.5620, -16.2980, "ZIG", "TIL",
                        LocationType.MAISON, "Maison familiale avec véranda bleue",
                        null, false, false, fatou),

                // 9. Non listée (Commerce Mamadou)
                new DemoAddrDef("ZIG-KND-5080", 12.5480, -16.2800, "ZIG", "KND",
                        LocationType.COMMERCE, "Quincaillerie générale et matériaux de construction",
                        null, false, false, mamadou),

                // 10. Non listée (Maison Fatou)
                new DemoAddrDef("ZIG-NEM-6055", 12.5510, -16.2520, "ZIG", "NEM",
                        LocationType.MAISON, "Concession avec puits et portail en fer forgé",
                        null, false, false, fatou),

                // 11. Non listée (Institution Mamadou)
                new DemoAddrDef("ZIG-KBG-4300", 12.5780, -16.2620, "ZIG", "KBG",
                        LocationType.INSTITUTION, "École élémentaire publique de Boucotte",
                        null, false, false, mamadou),

                // 12. Non listée (Maison Fatou)
                new DemoAddrDef("ZIG-TIL-3099", 12.5690, -16.2890, "ZIG", "TIL",
                        LocationType.MAISON, "Maison à étage crépie ocre face au grand baobab",
                        null, false, false, fatou)
        );

        for (DemoAddrDef def : defs) {
            if (!addressRepository.existsByCode(def.code())) {
                String search = AddressService.computeSearchText(
                        def.desc(), def.quartier(), def.showOwner(), def.owner().getFullName()
                );
                Address addr = Address.builder()
                        .code(def.code())
                        .latitude(def.lat())
                        .longitude(def.lon())
                        .zone(def.zone())
                        .quartier(def.quartier())
                        .locationType(def.type())
                        .description(def.desc())
                        .photoUrl(def.photo())
                        .status(AddressStatus.ACTIVE)
                        .listed(def.listed())
                        .showOwnerName(def.showOwner())
                        .searchText(search)
                        .owner(def.owner())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();
                addressRepository.save(addr);
                log.info("[SEED-DEMO] Adresse de démonstration créée : {}", def.code());
            }
        }
    }
}

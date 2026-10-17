package sn.samaadresse.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.service.AddressService;
import sn.samaadresse.service.PhotoStorage;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Seeder idempotent des données de démonstration.
 * <p>
 * Actif uniquement lorsque DEMO_SEED=true (ou en profil dev/e2e lorsque DEMO_PASSWORD est fourni).
 * Ne contient aucun mot de passe codé en dur dans le dépôt : DEMO_PASSWORD est lu depuis l'environnement.
 * Stocke les photos de démonstration via l'interface PhotoStorage (disque en dev, bytea en prod).
 */
@Slf4j
@Component
@ConditionalOnExpression("${demo.seed:false} or '${spring.profiles.active:dev}' == 'dev' or '${spring.profiles.active:dev}' == 'e2e'")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String DEMO_OWNER_EMAIL = "demo@samaadresse.sn";
    public static final String DEMO_FATOU_EMAIL = "fatou@samaadresse.sn";
    public static final String DEMO_ADMIN_EMAIL = "admin@samaadresse.sn";

    public static final UUID DEMO_PHOTO_1_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    public static final UUID DEMO_PHOTO_2_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");
    public static final UUID DEMO_PHOTO_3_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhotoStorage photoStorage;

    @Value("${demo.seed:false}")
    private boolean demoSeedExplicit;

    @Value("${demo.password:}")
    private String demoPassword;

    public DemoDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, null, passwordEncoder, null);
    }

    @Autowired
    public DemoDataSeeder(
            UserRepository userRepository,
            @Autowired(required = false) AddressRepository addressRepository,
            PasswordEncoder passwordEncoder,
            @Autowired(required = false) PhotoStorage photoStorage
    ) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
        this.photoStorage = photoStorage;
    }

    public void setDemoPassword(String demoPassword) {
        this.demoPassword = demoPassword;
    }

    public void setDemoSeedExplicit(boolean demoSeedExplicit) {
        this.demoSeedExplicit = demoSeedExplicit;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(demoPassword)) {
            if (demoSeedExplicit) {
                throw new IllegalStateException("DEMO_PASSWORD est obligatoire lorsque DEMO_SEED=true.");
            }
            log.info("[SEED-DEMO] Variable DEMO_PASSWORD non renseignée : seeding automatique ignoré.");
            return;
        }

        log.info("[SEED-DEMO] Initialisation idempotente des comptes et adresses de démonstration...");
        String encodedPass = passwordEncoder.encode(demoPassword.trim());

        // 1. Administrateur de démo (si non existant)
        userRepository.findByEmail(DEMO_ADMIN_EMAIL).orElseGet(() -> {
            User u = User.builder()
                    .fullName("Admin SamaAdresse")
                    .email(DEMO_ADMIN_EMAIL)
                    .phoneNumber("+221770000000")
                    .passwordHash(encodedPass)
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });

        // 2. Utilisateurs de démo (Mamadou et Fatou)
        User mamadou = userRepository.findByEmail(DEMO_OWNER_EMAIL).orElseGet(() -> {
            User u = User.builder()
                    .fullName("Mamadou Diallo")
                    .email(DEMO_OWNER_EMAIL)
                    .phoneNumber("+221771234567")
                    .passwordHash(encodedPass)
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
                    .passwordHash(encodedPass)
                    .role(Role.PROPRIETAIRE)
                    .enabled(true)
                    .build();
            return userRepository.save(u);
        });

        // 3. Photos et 12 adresses Ziguinchor réalistes
        seedAddressesIfAbsent(mamadou, fatou);
        log.info("[SEED-DEMO] Données de démonstration initialisées avec succès.");
    }

    private void seedAddressesIfAbsent(User mamadou, User fatou) {
        if (addressRepository == null) {
            return;
        }

        String photoUrl1 = storeDemoPhoto(DEMO_PHOTO_1_ID, "demo-photos/demo-facade-1.jpg", new Color(27, 94, 32));
        String photoUrl2 = storeDemoPhoto(DEMO_PHOTO_2_ID, "demo-photos/demo-facade-2.jpg", new Color(29, 82, 143));
        String photoUrl3 = storeDemoPhoto(DEMO_PHOTO_3_ID, "demo-photos/demo-facade-3.jpg", new Color(180, 83, 9));

        record DemoAddrDef(
                String code, Double lat, Double lon, String zone, String quartier,
                LocationType type, String desc, String photo, boolean listed, boolean showOwner, User owner
        ) {}

        List<DemoAddrDef> defs = List.of(
                new DemoAddrDef("ZIG-KBG-4271", 12.5738, -16.2650, "ZIG", "KBG",
                        LocationType.MAISON, "Maison familiale au portail vert face à la grande mosquée",
                        photoUrl1, true, true, mamadou),
                new DemoAddrDef("ZIG-ESC-1042", 12.5852, -16.2684, "ZIG", "ESC",
                        LocationType.COMMERCE, "Pharmacie de l'Escale et cabinet de soins",
                        photoUrl2, true, false, fatou),
                new DemoAddrDef("ZIG-TIL-3015", 12.5654, -16.2948, "ZIG", "TIL",
                        LocationType.COMMERCE, "Boutique d'alimentation générale et dépôt de gaz",
                        photoUrl3, false, false, mamadou),
                new DemoAddrDef("ZIG-KND-5012", 12.5542, -16.2731, "ZIG", "KND",
                        LocationType.MAISON, "Grande concession familiale avec manguier dans la cour",
                        null, false, false, fatou),
                new DemoAddrDef("ZIG-NEM-6021", 12.5583, -16.2455, "ZIG", "NEM",
                        LocationType.INSTITUTION, "Poste de santé communautaire de Néma Kadialang",
                        null, false, false, mamadou),
                new DemoAddrDef("ZIG-KBG-4272", 12.5715, -16.2680, "ZIG", "KBG",
                        LocationType.COMMERCE, "Atelier de menuiserie métallique et ferronnerie",
                        null, false, false, fatou),
                new DemoAddrDef("ZIG-ESC-1088", 12.5880, -16.2645, "ZIG", "ESC",
                        LocationType.MAISON, "Résidence fleurie près du débarcadère",
                        null, false, false, mamadou),
                new DemoAddrDef("ZIG-TIL-3040", 12.5620, -16.2980, "ZIG", "TIL",
                        LocationType.MAISON, "Maison familiale avec véranda bleue",
                        null, false, false, fatou),
                new DemoAddrDef("ZIG-KND-5080", 12.5480, -16.2800, "ZIG", "KND",
                        LocationType.COMMERCE, "Quincaillerie générale et matériaux de construction",
                        null, false, false, mamadou),
                new DemoAddrDef("ZIG-NEM-6055", 12.5510, -16.2520, "ZIG", "NEM",
                        LocationType.MAISON, "Concession avec puits et portail en fer forgé",
                        null, false, false, fatou),
                new DemoAddrDef("ZIG-KBG-4300", 12.5780, -16.2620, "ZIG", "KBG",
                        LocationType.INSTITUTION, "École élémentaire publique de Boucotte",
                        null, false, false, mamadou),
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

    private String storeDemoPhoto(UUID id, String classpathLocation, Color fallbackColor) {
        if (photoStorage == null) {
            return "/uploads/" + id + ".jpg";
        }
        byte[] bytes = loadClasspathPhotoOrGenerate(classpathLocation, fallbackColor);
        return photoStorage.storeSeedPhoto(id, bytes, "image/jpeg");
    }

    private byte[] loadClasspathPhotoOrGenerate(String classpathLocation, Color fallbackColor) {
        try {
            ClassPathResource res = new ClassPathResource(classpathLocation);
            if (res.exists()) {
                try (InputStream in = res.getInputStream()) {
                    return in.readAllBytes();
                }
            }
        } catch (Exception ignored) {
        }
        try {
            BufferedImage img = new BufferedImage(400, 300, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setColor(fallbackColor);
            g.fillRect(0, 0, 400, 300);
            g.dispose();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "jpeg", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Impossible de générer l'image de démo", e);
        }
    }
}

package sn.samaadresse.config;

import com.sun.net.httpserver.HttpServer;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import sn.samaadresse.controller.PhotoController;
import sn.samaadresse.domain.entity.PhotoBlob;
import sn.samaadresse.domain.model.GeoGridData;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.domain.model.GeoZone;
import sn.samaadresse.repository.PhotoBlobRepository;
import sn.samaadresse.security.ClientIpResolver;
import sn.samaadresse.security.ImageMagicBytesValidator;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.DbPhotoStorage;
import sn.samaadresse.service.DiskPhotoStorage;
import sn.samaadresse.service.GeoGridService;
import sn.samaadresse.service.PhotoStorage;
import sn.samaadresse.sms.PhoneMasker;
import sn.samaadresse.sms.SmsProperties;
import sn.samaadresse.sms.SmsProviderException;
import sn.samaadresse.sms.SmsResult;
import sn.samaadresse.sms.TwilioSmsProvider;

import javax.imageio.ImageIO;
import javax.sql.DataSource;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration et unitaires couvrant les exigences de production du Lot 8 (Parties A1 à A7).
 */
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
@AutoConfigureMockMvc
class ProductionFeaturesTest {

    @org.springframework.test.context.DynamicPropertySource
    static void configureDataSource(org.springframework.test.context.DynamicPropertyRegistry registry) {
        if (!isPostgresReachable()) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:samaadresse_prod_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        }
    }

    static boolean isPostgresReachable() {
        try (java.net.Socket s = new java.net.Socket()) {
            s.connect(new InetSocketAddress("127.0.0.1", 5434), 200);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private PhotoBlobRepository photoBlobRepository;

    @Autowired
    private GeoGridService geoGridService;

    // =========================================================================
    // A1 & A5 — Repli SPA, En-têtes de sécurité, En-têtes de cache et IP Client
    // =========================================================================

    @Test
    @DisplayName("A1 + A5 : Repli SPA vers index.html, en-têtes de sécurité et Cache-Control no-cache")
    void spaFallback_and_securityHeaders() throws Exception {
        // 1. Une URL SPA profonde renvoie index.html (200) + Cache-Control: no-cache + en-têtes de sécurité
        mockMvc.perform(get("/a/ZIG-KBG-4271"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Permissions-Policy", "geolocation=(self), camera=(self)"))
                .andExpect(header().string("Content-Security-Policy-Report-Only", SecurityConfig.CSP_REPORT_ONLY_VALUE))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<div id=\"root\"></div>")));

        // 2. Une URL inconnue sans extension renvoie aussi index.html (repli SPA)
        mockMvc.perform(get("/une-page-inconnue/profonde"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<div id=\"root\"></div>")));

        // 3. Une URL /api/** non publique ne renvoie PAS index.html (401 Unauthorized)
        mockMvc.perform(get("/api/route-inconnue"))
                .andExpect(status().isUnauthorized());

        // 4. Une URL /uploads/** inexistante renvoie 404 Not Found
        mockMvc.perform(get("/uploads/00000000-0000-4000-8000-999999999999.jpg"))
                .andExpect(status().isNotFound());

        // 5. GET /api/health renvoie {"status":"UP"} avec 200 OK
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("A1 : Extraction de l'IP réelle du client derrière le proxy Render (CF-Connecting-IP / X-Forwarded-For)")
    void clientIpResolver_extractsVisitorIpBehindProxy() {
        ClientIpResolver.setConfiguredHops(1);
        try {
            // 1. En-tête X-Forwarded-For : extrait l'IP insérée par le dernier proxy de confiance (et non la tête falsifiable)
            MockHttpServletRequest reqXff = new MockHttpServletRequest();
            reqXff.setRemoteAddr("10.0.0.1");
            reqXff.addHeader("X-Forwarded-For", "fake.ip.1, fake.ip.2, 41.82.100.12");
            assertThat(ClientIpResolver.resolve(reqXff)).isEqualTo("41.82.100.12");

            // 2. En-tête CF-Connecting-IP prioritaire (Cloudflare / Render) et True-Client-IP ignoré
            MockHttpServletRequest reqCf = new MockHttpServletRequest();
            reqCf.setRemoteAddr("10.0.0.1");
            reqCf.addHeader("True-Client-IP", "1.1.1.1"); // Ignoré car falsifiable
            reqCf.addHeader("CF-Connecting-IP", "154.65.22.10");
            reqCf.addHeader("X-Forwarded-For", "fake.ip.3, 154.65.22.10");
            assertThat(ClientIpResolver.resolve(reqCf)).isEqualTo("154.65.22.10");

            // 3. Deux visiteurs distincts derrière le même proxy (même remoteAddr) ont des quotas indépendants
            RateLimiterService limiter = new RateLimiterService();
            for (int i = 0; i < 5; i++) {
                limiter.checkRateLimit("proxy_test", ClientIpResolver.resolve(reqXff), 5);
            }
            assertThatThrownBy(() -> limiter.checkRateLimit("proxy_test", ClientIpResolver.resolve(reqXff), 5))
                    .isInstanceOf(sn.samaadresse.exception.RateLimitExceededException.class);
            // Le second visiteur derrière le même proxy n'est pas bloqué
            limiter.checkRateLimit("proxy_test", ClientIpResolver.resolve(reqCf), 5);
        } finally {
            ClientIpResolver.setConfiguredHops(0);
        }
    }

    // =========================================================================
    // A2 — Conversion DATABASE_URL, Validation JWT_SECRET >= 32 octets, Flyway
    // =========================================================================

    @Test
    @DisplayName("A2 : Conversion DATABASE_URL postgres://user:pass@host/db?sslmode=require vers JDBC")
    void databaseUrlConverter_convertsNeonPostgresUrlToJdbc() {
        var details = DatabaseUrlConverter.convert(
                "postgres://neondb_owner:Secr3t%21Pass@ep-cool-fog-123456.eu-central-1.aws.neon.tech:5432/samaadresse?sslmode=require"
        );
        assertThat(details.jdbcUrl()).isEqualTo(
                "jdbc:postgresql://ep-cool-fog-123456.eu-central-1.aws.neon.tech:5432/samaadresse?sslmode=require"
        );
        assertThat(details.username()).isEqualTo("neondb_owner");
        assertThat(details.password()).isEqualTo("Secr3t!Pass");

        var noPort = DatabaseUrlConverter.convert("postgresql://u:p@ep-test.neon.tech/db?sslmode=require");
        assertThat(noPort.jdbcUrl()).isEqualTo("jdbc:postgresql://ep-test.neon.tech/db?sslmode=require");
        assertThat(noPort.username()).isEqualTo("u");
        assertThat(noPort.password()).isEqualTo("p");

        var alreadyJdbc = DatabaseUrlConverter.convert("jdbc:postgresql://localhost:5434/samaadresse");
        assertThat(alreadyJdbc.jdbcUrl()).isEqualTo("jdbc:postgresql://localhost:5434/samaadresse");

        assertThatThrownBy(() -> DatabaseUrlConverter.convert("mysql://localhost/db"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("A2 : JwtProvider refuse un secret < 32 octets ou vide en profil prod")
    void jwtProvider_enforcesMinimum32BytesSecret() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        assertThatThrownBy(() -> new JwtProvider("trop-court-16-oc", 900000L, prodEnv))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 octets");

        assertThatThrownBy(() -> new JwtProvider("", 900000L, prodEnv))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("obligatoire");

        JwtProvider valid = new JwtProvider("0123456789abcdef0123456789abcdef", 900000L, prodEnv);
        assertThat(valid.getAccessTokenExpirationMs()).isEqualTo(900000L);
    }

    @Test
    @DisplayName("A2 : Migration Flyway V1 + V2 sur schéma vide et vérification des tables + colonne bytea")
    void flyway_migratesEmptySchemaSuccessfully() throws Exception {
        String testSchema = "test_flyway_lot8";
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("DROP SCHEMA IF EXISTS " + testSchema + " CASCADE");
            stmt.execute("CREATE SCHEMA " + testSchema);
        }

        try {
            Flyway flyway = Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(testSchema)
                    .defaultSchema(testSchema)
                    .locations("classpath:db/migration")
                    .load();

            var result = flyway.migrate();
            assertThat(result.migrationsExecuted).isEqualTo(2);

            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery(
                        "SELECT data_type FROM information_schema.columns " +
                        "WHERE LOWER(table_schema) = '" + testSchema + "' AND LOWER(table_name) = 'photo_blobs' AND LOWER(column_name) = 'data'"
                );
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1).toLowerCase()).isIn("bytea", "binary varying", "varbinary");
            }
        } finally {
            try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
                stmt.execute("DROP SCHEMA IF EXISTS " + testSchema + " CASCADE");
            }
        }
    }

    // =========================================================================
    // A3 — Stockage des photos : DiskPhotoStorage et DbPhotoStorage + Suppression
    // =========================================================================

    @Test
    @DisplayName("A3 : DiskPhotoStorage et DbPhotoStorage (validation, redimensionnement 800 px, ETag, suppression)")
    void photoStorage_diskAndDbImplementations(@TempDir Path tempDir) throws Exception {
        ImageMagicBytesValidator validator = new ImageMagicBytesValidator();

        // Créer une image JPEG de 1200x600 px (> 800 px pour tester le redimensionnement automatique)
        BufferedImage wideImg = new BufferedImage(1200, 600, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = wideImg.createGraphics();
        g.setColor(new Color(29, 82, 143));
        g.fillRect(0, 0, 1200, 600);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(wideImg, "jpeg", baos);
        byte[] jpegBytes = baos.toByteArray();

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file", "facade.jpg", "image/jpeg", jpegBytes
        );

        // 1. Test DiskPhotoStorage
        DiskPhotoStorage diskStorage = new DiskPhotoStorage(tempDir.toString(), validator);
        String diskUrl = diskStorage.storeFile(multipartFile);
        assertThat(diskUrl).startsWith("/uploads/");
        String diskFilename = diskUrl.substring("/uploads/".length());
        assertThat(Files.exists(tempDir.resolve(diskFilename))).isTrue();

        Optional<PhotoStorage.PhotoResource> diskLoaded = diskStorage.loadPhoto(diskFilename);
        assertThat(diskLoaded).isPresent();
        assertThat(diskLoaded.get().contentType()).isEqualTo("image/jpeg");
        assertThat(diskLoaded.get().etag()).isNotBlank();
        BufferedImage resizedDisk = ImageIO.read(new ByteArrayInputStream(diskLoaded.get().data()));
        assertThat(resizedDisk.getWidth()).isEqualTo(800);
        assertThat(resizedDisk.getHeight()).isEqualTo(400);

        diskStorage.deleteFile(diskUrl);
        assertThat(Files.exists(tempDir.resolve(diskFilename))).isFalse();
        assertThat(diskStorage.loadPhoto(diskFilename)).isEmpty();

        // 2. Test DbPhotoStorage + PhotoController (Cache-Control immutable + ETag + suppression en base)
        DbPhotoStorage dbStorage = new DbPhotoStorage(photoBlobRepository, validator);
        String dbUrl = dbStorage.storeFile(multipartFile);
        assertThat(dbUrl).startsWith("/uploads/").endsWith(".jpg");
        String dbFilename = dbUrl.substring("/uploads/".length());
        UUID blobId = DbPhotoStorage.extractUuid(dbUrl);
        assertThat(blobId).isNotNull();
        assertThat(photoBlobRepository.existsById(blobId)).isTrue();

        Optional<PhotoBlob> savedBlob = photoBlobRepository.findById(blobId);
        assertThat(savedBlob).isPresent();
        BufferedImage resizedDb = ImageIO.read(new ByteArrayInputStream(savedBlob.get().getData()));
        assertThat(resizedDb.getWidth()).isEqualTo(800);

        PhotoController photoController = new PhotoController(dbStorage);
        MockHttpServletRequest getReq = new MockHttpServletRequest("GET", dbUrl);
        var resp200 = photoController.servePhoto(dbFilename, new org.springframework.web.context.request.ServletWebRequest(getReq));
        assertThat(resp200.getStatusCode().value()).isEqualTo(200);
        assertThat(resp200.getHeaders().getCacheControl()).contains("max-age=31536000", "immutable");
        String etag = resp200.getHeaders().getETag();
        assertThat(etag).isNotBlank();

        // Requête conditionnelle avec If-None-Match -> 304 Not Modified
        MockHttpServletRequest condReq = new MockHttpServletRequest("GET", dbUrl);
        condReq.addHeader(HttpHeaders.IF_NONE_MATCH, etag);
        var resp304 = photoController.servePhoto(dbFilename, new org.springframework.web.context.request.ServletWebRequest(condReq));
        assertThat(resp304.getStatusCode().value()).isEqualTo(304);

        // Suppression de la photo -> suppression en base de données
        dbStorage.deleteFile(dbUrl);
        assertThat(photoBlobRepository.existsById(blobId)).isFalse();
        assertThat(dbStorage.loadPhoto(dbFilename)).isEmpty();
    }

    // =========================================================================
    // A6 — TwilioSmsProvider avec serveur HTTP simulé (201, 4xx/5xx, numéro invalide)
    // =========================================================================

    @Test
    @DisplayName("A6 : TwilioSmsProvider avec serveur HTTP simulé (succès 201, erreur 4xx/5xx, numéro invalide, masquage)")
    void twilioSmsProvider_withMockHttpServer() throws Exception {
        AtomicReference<String> receivedAuth = new AtomicReference<>();
        AtomicReference<String> receivedBody = new AtomicReference<>();
        AtomicReference<Integer> statusToReturn = new AtomicReference<>(201);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/2010-04-01/Accounts/AC_TEST_123/Messages.json", exchange -> {
            receivedAuth.set(exchange.getRequestHeaders().getFirst("Authorization"));
            receivedBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            int code = statusToReturn.get();
            byte[] resp = code == 201
                    ? "{\"sid\":\"SM_MOCK_999\",\"status\":\"queued\"}".getBytes(StandardCharsets.UTF_8)
                    : "{\"message\":\"Twilio error\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(code, resp.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(resp);
            }
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            SmsProperties props = new SmsProperties();
            props.setProvider("twilio");
            props.setTimeout(Duration.ofSeconds(3));
            props.getTwilio().setAccountSid("AC_TEST_123");
            props.getTwilio().setAuthToken("token_secret_xyz");
            props.getTwilio().setFromNumber("+15005550006");
            props.getTwilio().setApiBaseUrl("http://127.0.0.1:" + port);

            TwilioSmsProvider provider = new TwilioSmsProvider(props);

            // 1. Succès 201 avec authentification Basic et paramètres form-urlencoded
            SmsResult ok = provider.send("+221771234567", "SamaAdresse ZIG-KBG-4271");
            assertThat(ok.providerMessageId()).isEqualTo("SM_MOCK_999");
            assertThat(receivedAuth.get()).startsWith("Basic ");
            assertThat(receivedBody.get()).contains("To=%2B221771234567").contains("From=%2B15005550006");

            // 2. Erreur 400 Bad Request -> SmsProviderException
            statusToReturn.set(400);
            assertThatThrownBy(() -> provider.send("+221771234567", "Test 400"))
                    .isInstanceOf(SmsProviderException.class)
                    .hasMessageContaining("HTTP 400");

            // 3. Erreur 500 Internal Server Error -> SmsProviderException
            statusToReturn.set(500);
            assertThatThrownBy(() -> provider.send("+221771234567", "Test 500"))
                    .isInstanceOf(SmsProviderException.class)
                    .hasMessageContaining("HTTP 500");

            // 4. Numéro invalide -> rejet immédiat sans exposer de numéro non masqué
            assertThatThrownBy(() -> provider.send("00221-invalide", "Test"))
                    .isInstanceOf(SmsProviderException.class)
                    .hasMessageContaining("E.164");

            assertThat(PhoneMasker.mask("+221771234567")).doesNotContain("12345");
        } finally {
            server.stop(0);
        }
    }

    // =========================================================================
    // A7 — Inclusion de chaque zone de quartier dans sa zone de ville
    // =========================================================================

    @Test
    @DisplayName("A7 : Chaque boîte englobante de quartier est incluse dans la boîte englobante de sa ville")
    void geoGrid_everyQuartierIsContainedInsideItsParentZone() {
        Map<String, GeoZone> zonesByCode = geoGridService.getAllZones().stream()
                .collect(Collectors.toMap(GeoZone::getCode, z -> z));

        assertThat(geoGridService.getAllQuartiers()).isNotEmpty();

        for (GeoQuartier q : geoGridService.getAllQuartiers()) {
            GeoZone parent = zonesByCode.get(q.getZoneCode());
            assertThat(parent)
                    .withFailMessage("Zone parente introuvable pour le quartier %s (%s)", q.getCode(), q.getZoneCode())
                    .isNotNull();

            assertThat(q.getLatMin())
                    .withFailMessage("Quartier %s : latMin (%s) < zone %s latMin (%s)", q.getCode(), q.getLatMin(), parent.getCode(), parent.getLatMin())
                    .isGreaterThanOrEqualTo(parent.getLatMin());
            assertThat(q.getLatMax())
                    .withFailMessage("Quartier %s : latMax (%s) > zone %s latMax (%s)", q.getCode(), q.getLatMax(), parent.getCode(), parent.getLatMax())
                    .isLessThanOrEqualTo(parent.getLatMax());
            assertThat(q.getLonMin())
                    .withFailMessage("Quartier %s : lonMin (%s) < zone %s lonMin (%s)", q.getCode(), q.getLonMin(), parent.getCode(), parent.getLonMin())
                    .isGreaterThanOrEqualTo(parent.getLonMin());
            assertThat(q.getLonMax())
                    .withFailMessage("Quartier %s : lonMax (%s) > zone %s lonMax (%s)", q.getCode(), q.getLonMax(), parent.getCode(), parent.getLonMax())
                    .isLessThanOrEqualTo(parent.getLonMax());
        }
    }
}

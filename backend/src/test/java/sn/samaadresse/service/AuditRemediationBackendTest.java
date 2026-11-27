package sn.samaadresse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestClient;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.controller.HealthController;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.AdminAction;
import sn.samaadresse.domain.entity.ReservedCode;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.ReservedCodeStatus;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.*;
import sn.samaadresse.exception.*;
import sn.samaadresse.repository.*;
import sn.samaadresse.security.ImageMagicBytesValidator;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;

import javax.imageio.ImageIO;
import javax.sql.DataSource;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuditRemediationBackendTest {

    @org.springframework.test.context.DynamicPropertySource
    static void configureDataSource(org.springframework.test.context.DynamicPropertyRegistry registry) {
        try (java.net.Socket s = new java.net.Socket()) {
            s.connect(new InetSocketAddress("127.0.0.1", 5434), 200);
        } catch (Exception e) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:samaadresse_audit_remediation;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GeoGridService geoGridService;

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("SEC-01 : Le cookie refreshToken utilise Path=/api/auth et logout révoque bien en base")
    void sec01_cookiePathAndLogoutRevocation() {
        UserRepository userRepo = mock(UserRepository.class);
        RefreshTokenRepository tokenRepo = mock(RefreshTokenRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        JwtProvider jwt = new JwtProvider("audit-remediation-secret-key-at-least-32-bytes-ok!", 900000);
        RateLimiterService limiter = new RateLimiterService();
        AuthService authService = new AuthService(userRepo, tokenRepo, encoder, jwt, limiter);

        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Awa Diop")
                .email("awa@samaadresse.sn")
                .phoneNumber("+221771112233")
                .passwordHash(encoder.encode("Secret123!"))
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();
        when(userRepo.findByEmail("awa@samaadresse.sn")).thenReturn(Optional.of(user));

        MockHttpServletResponse loginResp = new MockHttpServletResponse();
        authService.login(LoginRequest.builder().email("awa@samaadresse.sn").password("Secret123!").build(), "10.0.0.5", loginResp);
        String setCookie = loginResp.getHeader("Set-Cookie");
        assertThat(setCookie).contains("Path=/api/auth;").doesNotContain("Path=/api/auth/refresh");

        clearInvocations(tokenRepo);
        MockHttpServletResponse logoutResp = new MockHttpServletResponse();
        authService.logout("some-refresh-token", "awa@samaadresse.sn", logoutResp);
        verify(tokenRepo).deleteByTokenHash(anyString());
        verify(tokenRepo).deleteByUser(user);
        assertThat(logoutResp.getHeaders("Set-Cookie")).hasSize(2);
    }

    @Test
    @DisplayName("SEC-04 : Inscription insensible à la casse et limitée en débit par IP")
    void sec04_registerCaseInsensitiveAndRateLimited() {
        UserRepository userRepo = mock(UserRepository.class);
        RefreshTokenRepository tokenRepo = mock(RefreshTokenRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        JwtProvider jwt = new JwtProvider("audit-remediation-secret-key-at-least-32-bytes-ok!", 900000);
        RateLimiterService limiter = new RateLimiterService();
        AuthService authService = new AuthService(userRepo, tokenRepo, encoder, jwt, limiter);

        RegisterRequest req = RegisterRequest.builder()
                .fullName("Moussa Sow")
                .email("  Moussa.Sow@SamaAdresse.SN ")
                .phoneNumber("+221771234567")
                .password("Secret123!")
                .build();

        when(userRepo.existsByEmail("moussa.sow@samaadresse.sn")).thenReturn(true);
        assertThatThrownBy(() -> authService.register(req, "198.51.100.88"))
                .isInstanceOf(EmailAlreadyExistsException.class);

        when(userRepo.existsByEmail("moussa.sow@samaadresse.sn")).thenReturn(false);
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        for (int i = 0; i < 9; i++) {
            authService.register(req, "198.51.100.88");
        }
        assertThatThrownBy(() -> authService.register(req, "198.51.100.88"))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    @DisplayName("P2-03 : Changement de mot de passe vérifie l'ancien, rejette l'identique et révoque les refresh tokens")
    void changePassword_validatesAndRevokes() {
        UserRepository userRepo = mock(UserRepository.class);
        RefreshTokenRepository tokenRepo = mock(RefreshTokenRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        JwtProvider jwt = new JwtProvider("audit-remediation-secret-key-at-least-32-bytes-ok!", 900000);
        RateLimiterService limiter = new RateLimiterService();
        AuthService authService = new AuthService(userRepo, tokenRepo, encoder, jwt, limiter);

        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Awa Diop")
                .email("awa@samaadresse.sn")
                .phoneNumber("+221771112233")
                .passwordHash(encoder.encode("OldPass123"))
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();
        when(userRepo.findByEmail("awa@samaadresse.sn")).thenReturn(Optional.of(user));

        MockHttpServletResponse resp = new MockHttpServletResponse();
        assertThatThrownBy(() -> authService.changePassword("awa@samaadresse.sn",
                ChangePasswordRequest.builder().currentPassword("WrongPass1").newPassword("NewPass123").build(), resp))
                .isInstanceOf(InvalidCredentialsException.class);

        assertThatThrownBy(() -> authService.changePassword("awa@samaadresse.sn",
                ChangePasswordRequest.builder().currentPassword("OldPass123").newPassword("OldPass123").build(), resp))
                .isInstanceOf(InvalidAddressOperationException.class);

        authService.changePassword("awa@samaadresse.sn",
                ChangePasswordRequest.builder().currentPassword("OldPass123").newPassword("NewPass456").build(), resp);

        assertThat(encoder.matches("NewPass456", user.getPasswordHash())).isTrue();
        verify(tokenRepo).deleteByUser(user);
        verify(tokenRepo).save(any());
        assertThat(resp.getHeader("Set-Cookie")).contains("Path=/api/auth;");
    }

    @Test
    @DisplayName("SEC-06 : Validation PNG 8 octets, ré-encodage systématique (purge EXIF <= 800 px) et extension PNG en DB")
    void sec06_png8BytesAndExifStripOnSmallImages(@TempDir Path tempDir) throws Exception {
        ImageMagicBytesValidator validator = new ImageMagicBytesValidator();
        // Faux PNG avec seulement 4 octets corrects
        byte[] fakePng = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0};
        assertThat(validator.detectExtensionFromMagicBytes(fakePng)).isNull();

        // Vrai petit PNG 200x150 (< 800 px)
        BufferedImage img = new BufferedImage(200, 150, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 200, 150);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);

        MockMultipartFile pngFile = new MockMultipartFile("file", "small.png", "image/png", baos.toByteArray());
        DiskPhotoStorage diskStorage = new DiskPhotoStorage(tempDir.toString(), validator);
        FileStorageService.ProcessedImage processed = diskStorage.validateAndProcessImage(pngFile);
        assertThat(processed.extension()).isEqualTo(".png");
        assertThat(processed.contentType()).isEqualTo("image/png");

        PhotoBlobRepository blobRepo = mock(PhotoBlobRepository.class);
        DbPhotoStorage dbStorage = new DbPhotoStorage(blobRepo, validator);
        String url = dbStorage.storeFile(pngFile);
        assertThat(url).startsWith("/uploads/").endsWith(".png");
    }

    @Test
    @DisplayName("P1-01 + P2-01 + P2-03 : Résolution nom de quartier -> code, coords annuaire, ownerName public et motif suspension")
    void p101_quartierNameResolutionAndDtoEnrichments() {
        AddressRepository addrRepo = mock(AddressRepository.class);
        ReservedCodeRepository resRepo = mock(ReservedCodeRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        AddressCodeGenerator gen = mock(AddressCodeGenerator.class);
        FileStorageService storage = mock(FileStorageService.class);
        AddressService service = new AddressService(addrRepo, resRepo, userRepo, geoGridService, gen, storage);

        assertThat(service.resolveQuartierFilterCode("Boucotte")).isEqualTo("KBG");
        assertThat(service.resolveQuartierFilterCode("Médina")).isEqualTo("MED");
        assertThat(service.resolveQuartierFilterCode("Medina")).isEqualTo("MED");
        assertThat(service.resolveQuartierFilterCode("Kandé")).isEqualTo("KND");
        assertThat(service.resolveQuartierFilterCode("KBG")).isEqualTo("KBG");
        assertThat(service.resolveQuartierFilterCode("   ")).isNull();

        User owner = User.builder()
                .id(UUID.randomUUID())
                .fullName("Fatou Ndiaye")
                .email("fatou@samaadresse.sn")
                .phoneNumber("+221770000001")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        Address addr = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-5555")
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .description("Maison test")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.SUSPENDED)
                .suspendedReason("Coordonnées fausses confirmées")
                .listed(true)
                .showOwnerName(true)
                .owner(owner)
                .createdAt(Instant.now())
                .build();

        DirectoryItemResponse dirItem = service.mapToDirectoryItem(addr);
        assertThat(dirItem.getLatitude()).isEqualTo(12.5738);
        assertThat(dirItem.getLongitude()).isEqualTo(-16.2650);

        PublicAddressResponse pubVisible = service.mapToPublicAddressResponse(addr);
        assertThat(pubVisible.getOwnerName()).isEqualTo("Fatou Ndiaye");

        addr.setShowOwnerName(false);
        assertThat(service.mapToPublicAddressResponse(addr).getOwnerName()).isNull();

        AddressResponse ownerResp = service.mapToAddressResponse(addr);
        assertThat(ownerResp.getModerationNotice()).isEqualTo("Suspendue par la modération");
    }

    @Test
    @DisplayName("P1-02 : ReservedCodeService supporte la zone SL (Saint-Louis) et AddressService retente sur collision UNIQUE")
    void p102_reservedCodesSupportsSaintLouisAndCollisionRetry() {
        ReservedCodeRepository resRepo = mock(ReservedCodeRepository.class);
        AddressCodeGenerator gen = mock(AddressCodeGenerator.class);
        RateLimiterService limiter = new RateLimiterService();
        ReservedCodeService resService = new ReservedCodeService(resRepo, gen, geoGridService, limiter);

        User user = User.builder().id(UUID.randomUUID()).email("sl@samaadresse.sn").fullName("Ndèye").role(Role.PROPRIETAIRE).enabled(true).build();
        when(resRepo.findByUserAndStatusAndExpiresAtAfter(eq(user), eq(ReservedCodeStatus.RESERVED), any())).thenReturn(Collections.emptyList());
        when(resRepo.countByUserAndStatusAndExpiresAtAfter(eq(user), eq(ReservedCodeStatus.RESERVED), any())).thenReturn(0L);
        when(resRepo.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(eq(user), eq("SL"), eq("NDR"), eq(ReservedCodeStatus.RESERVED), any())).thenReturn(0L);
        when(gen.generateCode("SL", "NDR")).thenReturn("SL-NDR-1111", "SL-NDR-2222", "SL-NDR-3333");

        resService.topUpReservations(user, "SL");
        verify(resRepo, times(3)).save(any(ReservedCode.class));

        // Retry sur collision UNIQUE lors de createAddress
        AddressRepository addrRepo = mock(AddressRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        FileStorageService storage = mock(FileStorageService.class);
        AddressService addrService = new AddressService(addrRepo, resRepo, userRepo, geoGridService, gen, storage);

        when(gen.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-1001", "ZIG-KBG-1002");
        when(addrRepo.save(any(Address.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"))
                .thenAnswer(inv -> {
                    Address a = inv.getArgument(0);
                    a.setId(UUID.randomUUID());
                    a.setCreatedAt(Instant.now());
                    return a;
                });

        CreateAddressRequest createReq = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison collision test")
                .locationType(LocationType.MAISON)
                .listed(false)
                .build();

        AddressResponse created = addrService.createAddress(createReq, user);
        assertThat(created.getCode()).isEqualTo("ZIG-KBG-1002");
        verify(addrRepo, times(2)).save(any(Address.class));
    }

    @Test
    @DisplayName("P0-02 : RouteService marque explicitement approximateFallback=true avec segment direct sur erreur ORS 403")
    void p002_routeFallbackMarkedExplicitly() {
        AddressRepository addrRepo = mock(AddressRepository.class);
        Address dest = Address.builder().code("ZIG-KBG-4271").latitude(12.5738).longitude(-16.2650).status(AddressStatus.ACTIVE).build();
        when(addrRepo.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE)).thenReturn(Optional.of(dest));

        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        RouteService routeService = new RouteService(addrRepo, builder, new ObjectMapper(), "fake-key", "https://api.openrouteservice.org");

        server.expect(requestTo("https://api.openrouteservice.org/v2/directions/driving-car/geojson"))
                .andRespond(withStatus(HttpStatus.FORBIDDEN));

        RouteResponse res = routeService.calculateRoute(12.5605, -16.2735, "ZIG-KBG-4271", "driving-car");
        assertThat(res.isApproximateFallback()).isTrue();
        assertThat(res.getGeometry().getCoordinates()).hasSize(2);
        assertThat(res.getSteps()).hasSize(1);
    }

    @Test
    @DisplayName("P2-03 + P3-02 + SEC-02/SEC-07 : Endpoints /health/ready, /admin/actions, /admin/addresses, CSP enforcing et 401 JSON sûr")
    @WithMockUser(username = "admin@samaadresse.sn", roles = {"ADMIN"})
    void endpointsSecurityHeadersReadinessAndAdminAudit() throws Exception {
        // Readiness OK
        mockMvc.perform(get("/api/health/ready"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Security-Policy", SecurityConfig.CSP_ENFORCING_VALUE))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"));

        // Readiness DOWN sans DataSource
        HealthController brokenHealth = new HealthController(null);
        assertThat(brokenHealth.readinessCheck().getStatusCode().value()).isEqualTo(503);

        // Nouveaux endpoints admin
        mockMvc.perform(get("/api/admin/actions?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        mockMvc.perform(get("/api/admin/addresses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // ModerationService mapping actions & addresses
        AdminActionRepository actionRepo = mock(AdminActionRepository.class);
        AddressRepository addrRepo = mock(AddressRepository.class);
        AddressReportRepository reportRepo = mock(AddressReportRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        sn.samaadresse.security.ReportRateLimiter reportLimiter = mock(sn.samaadresse.security.ReportRateLimiter.class);
        AddressService addrService = mock(AddressService.class);
        ModerationService modService = new ModerationService(addrRepo, reportRepo, actionRepo, userRepo, reportLimiter, addrService);

        AdminAction action = AdminAction.builder()
                .id(UUID.randomUUID()).adminEmail("admin@samaadresse.sn").action("SUSPEND_ADDRESS")
                .addressId(UUID.randomUUID()).addressCode("ZIG-KBG-4271").reason("Test").createdAt(Instant.now()).build();
        when(actionRepo.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(action)));

        Page<AdminActionResponse> actionsPage = modService.getAdminActions(0, 20);
        assertThat(actionsPage.getTotalElements()).isEqualTo(1);
        assertThat(actionsPage.getContent().get(0).getAction()).isEqualTo("SUSPEND_ADDRESS");
    }

    @Test
    @DisplayName("SEC-07 + SEC-10 : /api/addresses/mine anonyme renvoie 401 JSON valide")
    void anonymousMineReturnsValidJson401() throws Exception {
        mockMvc.perform(get("/api/addresses/mine"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/addresses/mine"));

        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"a\",\"newPassword\":\"Secret123\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"));

        mockMvc.perform(get("/api/public/route?fromLat=48.85&fromLon=2.35&code=ZIG-KBG-4271"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/public/directory?quartier=Boucotte"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // Vérifie que GlobalExceptionHandler gère DataIntegrityViolationException -> 409 et Exception -> 500
        GlobalExceptionHandler geh = new GlobalExceptionHandler();
        org.springframework.mock.web.MockHttpServletRequest fakeReq = new org.springframework.mock.web.MockHttpServletRequest("POST", "/api/auth/register");
        assertThat(geh.handleDataIntegrityViolation(new DataIntegrityViolationException("dup"), fakeReq).getStatusCode().value()).isEqualTo(409);
        assertThat(geh.handleGenericException(new RuntimeException("boom"), fakeReq).getStatusCode().value()).isEqualTo(500);
    }
}

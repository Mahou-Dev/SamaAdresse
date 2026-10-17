package sn.samaadresse.service;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.boot.context.annotation.UserConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.AddressReport;
import sn.samaadresse.domain.entity.AdminAction;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.ReportReason;
import sn.samaadresse.domain.enums.ReportStatus;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.*;
import sn.samaadresse.exception.AddressUnavailableException;
import sn.samaadresse.exception.InvalidAddressOperationException;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.repository.AddressReportRepository;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.AdminActionRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.ImageMagicBytesValidator;
import sn.samaadresse.security.ReportRateLimiter;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressLifecycleAndModerationTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressReportRepository reportRepository;

    @Mock
    private AdminActionRepository adminActionRepository;

    @Mock
    private GeoGridService geoGridService;

    @Mock
    private AddressCodeGenerator addressCodeGenerator;

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;
    private AddressService addressService;
    private ReportRateLimiter reportRateLimiter;
    private ModerationService moderationService;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private Address activeAddress;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir.toString(), new ImageMagicBytesValidator());
        addressService = new AddressService(addressRepository, userRepository, geoGridService, addressCodeGenerator, fileStorageService);
        reportRateLimiter = new ReportRateLimiter();
        moderationService = new ModerationService(
                addressRepository,
                reportRepository,
                adminActionRepository,
                userRepository,
                reportRateLimiter,
                addressService
        );

        ownerUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("owner@samaadresse.sn")
                .phoneNumber("+221771234567")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Awa Ndiaye")
                .email("other@samaadresse.sn")
                .phoneNumber("+221779998877")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        adminUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Admin SamaAdresse")
                .email("admin@samaadresse.sn")
                .phoneNumber("+221770000000")
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        activeAddress = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .description("Maison familiale près de l'école")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.ACTIVE)
                .owner(ownerUser)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 0.1 QR Code ZXing + FRONTEND_BASE_URL obligatoire en prod
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("1. [0.1] Décodage ZXing du QR généré vaut exactement FRONTEND_BASE_URL + '/a/' + code")
    void qrCode_decodedByZxing_equalsFrontendBaseUrlPlusCode() throws Exception {
        String customBaseUrl = "https://samaadresse.sn";
        QrCodeService qrService = new QrCodeService(addressRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(qrService, "frontendBaseUrl", customBaseUrl);
        qrService.validateFrontendBaseUrl();

        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        byte[] pngBytes = qrService.generateAddressQrCode("ZIG-KBG-4271");
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(pngBytes));
        Result result = new MultiFormatReader().decode(
                new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(img)))
        );

        System.out.println("[ZXING-DECODE-PROOF] URL décodée = " + result.getText());
        assertEquals("https://samaadresse.sn/a/ZIG-KBG-4271", result.getText());
    }

    @Test
    @DisplayName("2. [0.1] En prod, le démarrage échoue si FRONTEND_BASE_URL est absent ou vide")
    void prodStartup_failsWhenFrontendBaseUrlMissing() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(AddressRepository.class, () -> mock(AddressRepository.class))
                .withUserConfiguration(QrCodeService.class)
                .withPropertyValues("spring.profiles.active=prod", "frontend.base.url=${FRONTEND_BASE_URL}");

        runner.run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).isInstanceOf(BeanCreationException.class);
        });

        QrCodeService emptyQr = new QrCodeService(addressRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(emptyQr, "frontendBaseUrl", "   ");
        assertThrows(IllegalStateException.class, emptyQr::validateFrontendBaseUrl);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. PATCH /api/addresses/{id} : propriétaire, 403 inter-user, immuabilité
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("3. PATCH description et type par le propriétaire conserve code et position intacts")
    void updateAddress_ownerUpdatesDescriptionAndType_keepsCodeAndPosition() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateAddressRequest req = UpdateAddressRequest.builder()
                .description("Portail bleu en face de la boulangerie")
                .locationType(LocationType.COMMERCE)
                .build();

        AddressResponse updated = addressService.updateAddress(activeAddress.getId(), req, ownerUser.getEmail());

        assertEquals("ZIG-KBG-4271", updated.getCode());
        assertEquals(12.5738, updated.getLatitude());
        assertEquals(-16.2650, updated.getLongitude());
        assertEquals("Portail bleu en face de la boulangerie", updated.getDescription());
        assertEquals(LocationType.COMMERCE, updated.getLocationType());
    }

    @Test
    @DisplayName("4. PATCH par un autre utilisateur -> 403 AccessDeniedException")
    void updateAddress_otherUser_throws403() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        UpdateAddressRequest req = UpdateAddressRequest.builder()
                .description("Tentative de modification non autorisée")
                .build();

        assertThrows(AccessDeniedException.class,
                () -> addressService.updateAddress(activeAddress.getId(), req, otherUser.getEmail()));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Immuabilité du code : tentative de modifier code dans PATCH -> 400 InvalidAddressOperationException")
    void updateAddress_attemptToChangeCode_throws400() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));

        UpdateAddressRequest req = UpdateAddressRequest.builder()
                .code("ZIG-KBG-9999")
                .description("Nouvelle description")
                .build();

        InvalidAddressOperationException ex = assertThrows(InvalidAddressOperationException.class,
                () -> addressService.updateAddress(activeAddress.getId(), req, ownerUser.getEmail()));
        assertTrue(ex.getMessage().contains("immuables"));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Immuabilité de la position : tentative de modifier latitude/longitude dans PATCH -> 400")
    void updateAddress_attemptToChangePosition_throws400() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));

        UpdateAddressRequest req = UpdateAddressRequest.builder()
                .latitude(14.6928)
                .longitude(-17.4467)
                .build();

        assertThrows(InvalidAddressOperationException.class,
                () -> addressService.updateAddress(activeAddress.getId(), req, ownerUser.getEmail()));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. PATCH sur une adresse ARCHIVED ou SUSPENDED -> 400")
    void updateAddress_archivedOrSuspended_throws400() {
        activeAddress.setStatus(AddressStatus.ARCHIVED);
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));

        UpdateAddressRequest req = UpdateAddressRequest.builder()
                .description("Modif sur adresse archivée")
                .build();

        assertThrows(InvalidAddressOperationException.class,
                () -> addressService.updateAddress(activeAddress.getId(), req, ownerUser.getEmail()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Photo : suppression du disque (DELETE et remplacement) + 403 inter-user
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("8. Remplacement puis suppression de photo supprime effectivement les fichiers du disque")
    void photoLifecycle_replaceAndDelete_removesFilesFromDisk() {
        byte[] validJpegBytes = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48
        };
        MockMultipartFile file1 = new MockMultipartFile("file", "one.jpg", "image/jpeg", validJpegBytes);
        MockMultipartFile file2 = new MockMultipartFile("file", "two.jpg", "image/jpeg", validJpegBytes);

        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1er upload
        AddressResponse res1 = addressService.uploadAddressPhoto(activeAddress.getId(), file1, ownerUser.getEmail());
        String firstFilename = res1.getPhotoUrl().substring("/uploads/".length());
        Path firstPath = tempDir.resolve(firstFilename);
        assertTrue(Files.exists(firstPath), "Le 1er fichier photo doit exister sur le disque");

        // 2e upload (remplacement) -> le 1er fichier est supprimé du disque
        AddressResponse res2 = addressService.uploadAddressPhoto(activeAddress.getId(), file2, ownerUser.getEmail());
        String secondFilename = res2.getPhotoUrl().substring("/uploads/".length());
        Path secondPath = tempDir.resolve(secondFilename);
        assertFalse(Files.exists(firstPath), "L'ancien fichier photo doit être supprimé lors du remplacement");
        assertTrue(Files.exists(secondPath), "Le nouveau fichier photo doit exister sur le disque");

        // Suppression DELETE -> le 2e fichier est supprimé du disque et photoUrl devient null
        AddressResponse res3 = addressService.deleteAddressPhoto(activeAddress.getId(), ownerUser.getEmail());
        assertNull(res3.getPhotoUrl());
        assertFalse(Files.exists(secondPath), "Le fichier photo doit être supprimé du disque après DELETE");
    }

    @Test
    @DisplayName("9. DELETE photo par un autre utilisateur -> 403 AccessDeniedException")
    void deletePhoto_otherUser_throws403() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class,
                () -> addressService.deleteAddressPhoto(activeAddress.getId(), otherUser.getEmail()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Archivage, restauration, 410 Gone public, interdiction restore si SUSPENDED
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("10. Archive par un autre utilisateur -> 403 AccessDeniedException")
    void archiveAddress_otherUser_throws403() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class,
                () -> addressService.archiveAddress(activeAddress.getId(), otherUser.getEmail()));
    }

    @Test
    @DisplayName("11. Fiche publique et QR code d'une adresse ARCHIVED renvoient 410 Gone ('Cette adresse n'est plus disponible.')")
    void publicAddressAndQr_whenArchived_throws410AddressUnavailable() {
        activeAddress.setStatus(AddressStatus.ARCHIVED);
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE)).thenReturn(Optional.empty());
        when(addressRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(activeAddress));

        AddressUnavailableException ex1 = assertThrows(AddressUnavailableException.class,
                () -> addressService.getPublicAddressByCode("ZIG-KBG-4271"));
        assertEquals("Cette adresse n'est plus disponible.", ex1.getMessage());

        QrCodeService qrService = new QrCodeService(addressRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(qrService, "frontendBaseUrl", "http://localhost:5173");
        AddressUnavailableException ex2 = assertThrows(AddressUnavailableException.class,
                () -> qrService.generateAddressQrCode("ZIG-KBG-4271"));
        assertEquals("Cette adresse n'est plus disponible.", ex2.getMessage());
    }

    @Test
    @DisplayName("12. Fiche publique d'une adresse SUSPENDED renvoie 410 Gone avec le même message neutre sans révéler le motif")
    void publicAddress_whenSuspended_throws410WithIdenticalMessage() {
        activeAddress.setStatus(AddressStatus.SUSPENDED);
        activeAddress.setSuspendedReason("Signalement vérifié par admin");
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE)).thenReturn(Optional.empty());
        when(addressRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(activeAddress));

        AddressUnavailableException ex = assertThrows(AddressUnavailableException.class,
                () -> addressService.getPublicAddressByCode("ZIG-KBG-4271"));
        assertEquals("Cette adresse n'est plus disponible.", ex.getMessage());
        assertFalse(ex.getMessage().contains("Signalement"));
    }

    @Test
    @DisplayName("13. Restore sur une adresse ARCHIVED la réactive, mais restore sur une adresse SUSPENDED est interdit (400)")
    void restoreAddress_archivedSucceeds_suspendedThrows400() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

        // Archive puis restore
        AddressResponse archived = addressService.archiveAddress(activeAddress.getId(), ownerUser.getEmail());
        assertEquals(AddressStatus.ARCHIVED, archived.getStatus());

        AddressResponse restored = addressService.restoreAddress(activeAddress.getId(), ownerUser.getEmail());
        assertEquals(AddressStatus.ACTIVE, restored.getStatus());

        // Si suspendue par un admin -> restore interdit
        activeAddress.setStatus(AddressStatus.SUSPENDED);
        assertThrows(InvalidAddressOperationException.class,
                () -> addressService.restoreAddress(activeAddress.getId(), ownerUser.getEmail()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Signalements anonymes et limitation de débit (1/adresse/IP/24h et 3/h/IP)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("14. Limitation de débit : 2e signalement sur la même adresse par la même IP sous 24h -> 429")
    void createPublicReport_sameAddressSameIpTwice_throws429() {
        when(addressRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(activeAddress));
        when(reportRepository.save(any(AddressReport.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateReportRequest req = CreateReportRequest.builder()
                .reason(ReportReason.POSITION_INCORRECTE)
                .comment("Le point est décalé de deux rues")
                .build();

        ReportCreatedResponse first = moderationService.createPublicReport("ZIG-KBG-4271", req, "196.207.12.34");
        assertEquals("ACCEPTED", first.getStatus());

        // Vérifier que l'IP est stockée hachée en SHA-256 (64 hex chars), jamais en clair
        ArgumentCaptor<AddressReport> reportCaptor = ArgumentCaptor.forClass(AddressReport.class);
        verify(reportRepository).save(reportCaptor.capture());
        assertEquals(64, reportCaptor.getValue().getIpHash().length());
        assertNotEquals("196.207.12.34", reportCaptor.getValue().getIpHash());

        // 2e signalement sur la même adresse par la même IP -> 429
        assertThrows(RateLimitExceededException.class,
                () -> moderationService.createPublicReport("ZIG-KBG-4271", req, "196.207.12.34"));
    }

    @Test
    @DisplayName("15. Limitation de débit : 4e signalement dans l'heure par la même IP sur des adresses distinctes -> 429")
    void createPublicReport_fourReportsInOneHourSameIp_throws429() {
        when(addressRepository.findByCode(anyString())).thenAnswer(inv -> {
            String code = inv.getArgument(0);
            return Optional.of(Address.builder()
                    .id(UUID.randomUUID())
                    .code(code)
                    .status(AddressStatus.ACTIVE)
                    .owner(ownerUser)
                    .build());
        });

        CreateReportRequest req = CreateReportRequest.builder()
                .reason(ReportReason.CONTENU_INAPPROPRIE)
                .build();

        String ip = "41.82.100.55";
        moderationService.createPublicReport("ZIG-KBG-0001", req, ip);
        moderationService.createPublicReport("ZIG-KBG-0002", req, ip);
        moderationService.createPublicReport("ZIG-KBG-0003", req, ip);

        // 4e signalement dans la même heure -> 429
        assertThrows(RateLimitExceededException.class,
                () -> moderationService.createPublicReport("ZIG-KBG-0004", req, ip));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Modération admin, vue propriétaire et journal d'audit admin_actions
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("16. Suspension admin : motif obligatoire, passage en SUSPENDED, mention propriétaire et écriture dans admin_actions")
    void suspendAddress_requiresReason_updatesStatusAndWritesAuditLog() {
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(userRepository.findByEmail(adminUser.getEmail())).thenReturn(Optional.of(adminUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reportRepository.findByAddressIdAndStatus(activeAddress.getId(), ReportStatus.OPEN)).thenReturn(List.of());

        // Motif vide -> 400
        assertThrows(InvalidAddressOperationException.class,
                () -> moderationService.suspendAddress(
                        activeAddress.getId(),
                        SuspendAddressRequest.builder().reason("  ").build(),
                        adminUser.getEmail()
                ));

        // Motif valide -> SUSPENDED + moderationNotice + écriture dans admin_actions
        AddressResponse suspended = moderationService.suspendAddress(
                activeAddress.getId(),
                SuspendAddressRequest.builder().reason("Photo inappropriée confirmée").build(),
                adminUser.getEmail()
        );

        assertEquals(AddressStatus.SUSPENDED, suspended.getStatus());
        assertEquals("Suspendue par la modération", suspended.getModerationNotice());

        ArgumentCaptor<AdminAction> auditCaptor = ArgumentCaptor.forClass(AdminAction.class);
        verify(adminActionRepository, times(1)).save(auditCaptor.capture());
        AdminAction action = auditCaptor.getValue();
        assertEquals("SUSPEND_ADDRESS", action.getAction());
        assertEquals("admin@samaadresse.sn", action.getAdminEmail());
        assertEquals("ZIG-KBG-4271", action.getAddressCode());
        assertEquals("Photo inappropriée confirmée", action.getReason());
    }

    @Test
    @DisplayName("17. Classement sans suite et réactivation écrivent tous deux dans le journal d'audit admin_actions")
    void dismissReportAndReinstate_writeAuditActions() {
        AddressReport openReport = AddressReport.builder()
                .id(UUID.randomUUID())
                .address(activeAddress)
                .reason(ReportReason.AUTRE)
                .comment("Test")
                .ipHash("abc")
                .status(ReportStatus.OPEN)
                .build();

        when(reportRepository.findById(openReport.getId())).thenReturn(Optional.of(openReport));
        when(reportRepository.save(any(AddressReport.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByEmail(adminUser.getEmail())).thenReturn(Optional.of(adminUser));
        when(addressRepository.findById(activeAddress.getId())).thenReturn(Optional.of(activeAddress));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Classer sans suite
        AdminReportResponse dismissed = moderationService.updateReportStatus(
                openReport.getId(),
                UpdateReportStatusRequest.builder().status(ReportStatus.DISMISSED).reason("RAS").build(),
                adminUser.getEmail()
        );
        assertEquals(ReportStatus.DISMISSED, dismissed.getStatus());

        // 2. Réactiver l'adresse
        activeAddress.setStatus(AddressStatus.SUSPENDED);
        AddressResponse reinstated = moderationService.reinstateAddress(
                activeAddress.getId(),
                "Après vérification terrain",
                adminUser.getEmail()
        );
        assertEquals(AddressStatus.ACTIVE, reinstated.getStatus());
        assertNull(reinstated.getModerationNotice());

        // 3. Pagination des signalements
        when(reportRepository.findByStatusOrderByCreatedAtDesc(eq(ReportStatus.DISMISSED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(openReport)));
        Page<AdminReportResponse> page = moderationService.getReports(ReportStatus.DISMISSED, 0, 10);
        assertEquals(1, page.getTotalElements());

        verify(adminActionRepository, times(2)).save(any(AdminAction.class));
    }
}

package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.ReservedCode;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.ReservedCodeStatus;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.CreateAddressRequest;
import sn.samaadresse.dto.ReservedCodeResponse;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.ReservedCodeRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.RateLimiterService;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReservedCodeAndIdempotenceTest {

    @Mock
    private ReservedCodeRepository reservedCodeRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Spy
    private GeoGridService geoGridService = new GeoGridService();

    @Mock
    private AddressCodeGenerator addressCodeGenerator;

    @Spy
    private RateLimiterService rateLimiterService = new RateLimiterService();

    private ReservedCodeService reservedCodeService;
    private AddressService addressService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        geoGridService.initGeoGridData();
        reservedCodeService = new ReservedCodeService(reservedCodeRepository, addressCodeGenerator, geoGridService, rateLimiterService);
        addressService = new AddressService(addressRepository, reservedCodeRepository, userRepository, geoGridService, addressCodeGenerator, fileStorageService);

        user1 = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        user2 = User.builder()
                .id(UUID.randomUUID())
                .fullName("Fatou Ndiaye")
                .email("fatou@samaadresse.sn")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();
    }

    // -------------------------------------------------------------
    // PARTIE 1.1 : Tests de réservations de codes
    // -------------------------------------------------------------

    @Test
    @DisplayName("1. Complétion à 3 codes par quartier pour une zone (ex: ZIG)")
    void testTopUpReservations_completesTo3PerQuartier() {
        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(0L);
        when(reservedCodeRepository.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(eq(user1), eq("ZIG"), anyString(), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(0L);

        when(addressCodeGenerator.generateCode(eq("ZIG"), anyString()))
                .thenAnswer(inv -> "ZIG-" + inv.getArgument(1) + "-1234");

        List<ReservedCodeResponse> result = reservedCodeService.topUpReservations(user1, "ZIG");

        // ZIG has 5 quartiers (KBG, ESC, TIL, KND, NEM) -> 5 * 3 = 15 codes created
        verify(reservedCodeRepository, times(15)).save(any(ReservedCode.class));
    }

    @Test
    @DisplayName("2. Idempotence : un second appel immédiat ne génère aucun nouveau code")
    void testTopUpReservations_secondCallIsIdempotent() {
        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        // Déjà 15 réservations actives
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(15L);
        // Déjà 3 actives par quartier
        when(reservedCodeRepository.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(eq(user1), eq("ZIG"), anyString(), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(3L);

        List<ReservedCodeResponse> result = reservedCodeService.topUpReservations(user1, "ZIG");

        // Aucun code supplémentaire sauvegardé
        verify(reservedCodeRepository, never()).save(any(ReservedCode.class));
    }

    @Test
    @DisplayName("3. Plafonnement strict à 40 réservations actives par utilisateur")
    void testTopUpReservations_capsAt40() {
        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        // L'utilisateur a déjà 38 réservations actives
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(38L);
        when(reservedCodeRepository.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(eq(user1), eq("ZIG"), anyString(), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(0L);

        when(addressCodeGenerator.generateCode(eq("ZIG"), anyString())).thenReturn("ZIG-KBG-9999");

        reservedCodeService.topUpReservations(user1, "ZIG");

        // Ne doit générer que 2 codes supplémentaires pour atteindre 40
        verify(reservedCodeRepository, times(2)).save(any(ReservedCode.class));
    }

    @Test
    @DisplayName("4. Durée de validité des codes réservés égale à 30 jours")
    void testTopUpReservations_validates30DaysExpiry() {
        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(39L);
        when(reservedCodeRepository.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(eq(user1), eq("ZIG"), anyString(), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(0L);
        when(addressCodeGenerator.generateCode(eq("ZIG"), anyString())).thenReturn("ZIG-KBG-1111");

        Instant before = Instant.now();
        reservedCodeService.topUpReservations(user1, "ZIG");

        ArgumentCaptor<ReservedCode> captor = ArgumentCaptor.forClass(ReservedCode.class);
        verify(reservedCodeRepository).save(captor.capture());

        ReservedCode saved = captor.getValue();
        assertEquals(ReservedCodeStatus.RESERVED, saved.getStatus());
        Duration duration = Duration.between(saved.getCreatedAt(), saved.getExpiresAt());
        assertEquals(30, duration.toDays());
    }

    @Test
    @DisplayName("5. Limitation de débit à 5 appels par heure par utilisateur (429)")
    void testTopUpReservations_rateLimiting5PerHour() {
        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(40L);

        // 5 appels successifs autorisés
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(() -> reservedCodeService.topUpReservations(user1, "ZIG"));
        }

        // Le 6e appel doit échouer avec RateLimitExceededException
        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                reservedCodeService.topUpReservations(user1, "ZIG")
        );
        assertTrue(ex.getMessage().contains("Limite de réservations"));
    }

    @Test
    @DisplayName("6. Rejet immédiat si zone inconnue (doit être ZIG ou DKR)")
    void testTopUpReservations_invalidZoneRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                reservedCodeService.topUpReservations(user1, "PARIS")
        );
        assertTrue(ex.getMessage().contains("Zone géographique non couverte"));
    }

    @Test
    @DisplayName("7. Nettoyage proactif des réservations expirées")
    void testTopUpReservations_cleansUpExpiredReservations() {
        ReservedCode expiredCode = ReservedCode.builder()
                .code("ZIG-KBG-0001")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now().minus(Duration.ofDays(35)))
                .expiresAt(Instant.now().minus(Duration.ofDays(5)))
                .build();

        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(List.of(expiredCode));
        when(reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(40L);

        reservedCodeService.topUpReservations(user1, "ZIG");

        assertEquals(ReservedCodeStatus.EXPIRED, expiredCode.getStatus());
        verify(reservedCodeRepository).save(expiredCode);
    }

    // -------------------------------------------------------------
    // PARTIE 1.2 : Tests de création avec code réservé et idempotence
    // -------------------------------------------------------------

    @Test
    @DisplayName("8. Création avec reservedCode cohérent : code utilisé, status USED, address_id renseigné, codeChanged = false")
    void testCreateAddress_matchingReservedCode_isConsumed() {
        // Boucotte centre : lat 12.5738, lon -16.2650 -> quartier KBG
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison Boucotte")
                .locationType(LocationType.MAISON)
                .reservedCode("ZIG-KBG-4271")
                .build();

        ReservedCode reservation = ReservedCode.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofDays(30)))
                .build();

        when(reservedCodeRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(reservation));
        when(addressRepository.existsByCode("ZIG-KBG-4271")).thenReturn(false);
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-KBG-4271", resp.getCode());
        assertFalse(resp.getCodeChanged());
        assertNull(resp.getPreviousCode());
        assertEquals(ReservedCodeStatus.USED, reservation.getStatus());
        assertNotNull(reservation.getAddressId());
        verify(reservedCodeRepository).save(reservation);
    }

    @Test
    @DisplayName("9. Création avec reservedCode incohérent (quartier différent) : nouveau code généré, codeChanged = true, previousCode renseigné")
    void testCreateAddress_incoherentReservedCode_generatesNewCode() {
        // Coordonnées Escale (ESC) : lat 12.5852, lon -16.2684
        // Mais reservedCode appartient au quartier Boucotte (KBG)
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5852)
                .longitude(-16.2684)
                .description("Pharmacie Escale")
                .locationType(LocationType.COMMERCE)
                .reservedCode("ZIG-KBG-4271")
                .build();

        ReservedCode reservation = ReservedCode.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofDays(30)))
                .build();

        when(reservedCodeRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(reservation));
        when(addressCodeGenerator.generateCode("ZIG", "ESC")).thenReturn("ZIG-ESC-9999");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-ESC-9999", resp.getCode());
        assertTrue(resp.getCodeChanged());
        assertEquals("ZIG-KBG-4271", resp.getPreviousCode());
        // La réservation n'est pas marquée USED car préfixe non cohérent
        assertEquals(ReservedCodeStatus.RESERVED, reservation.getStatus());
    }

    @Test
    @DisplayName("10. Création avec reservedCode d'un autre utilisateur : nouveau code généré avec codeChanged = true")
    void testCreateAddress_otherUserReservedCode_generatesNewCode() {
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison")
                .locationType(LocationType.MAISON)
                .reservedCode("ZIG-KBG-4271")
                .build();

        // Appartient à user2
        ReservedCode reservation = ReservedCode.builder()
                .code("ZIG-KBG-4271")
                .user(user2)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofDays(30)))
                .build();

        when(reservedCodeRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(reservation));
        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-8888");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-KBG-8888", resp.getCode());
        assertTrue(resp.getCodeChanged());
        assertEquals("ZIG-KBG-4271", resp.getPreviousCode());
    }

    @Test
    @DisplayName("11. Création avec reservedCode déjà utilisé : nouveau code généré avec codeChanged = true")
    void testCreateAddress_alreadyUsedReservedCode_generatesNewCode() {
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison")
                .locationType(LocationType.MAISON)
                .reservedCode("ZIG-KBG-4271")
                .build();

        ReservedCode reservation = ReservedCode.builder()
                .code("ZIG-KBG-4271")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.USED) // Déjà utilisé
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofDays(30)))
                .build();

        when(reservedCodeRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(reservation));
        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-7777");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-KBG-7777", resp.getCode());
        assertTrue(resp.getCodeChanged());
        assertEquals("ZIG-KBG-4271", resp.getPreviousCode());
    }

    @Test
    @DisplayName("12. Création avec reservedCode expiré : nouveau code généré avec codeChanged = true")
    void testCreateAddress_expiredReservedCode_generatesNewCode() {
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison")
                .locationType(LocationType.MAISON)
                .reservedCode("ZIG-KBG-4271")
                .build();

        ReservedCode reservation = ReservedCode.builder()
                .code("ZIG-KBG-4271")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now().minus(Duration.ofDays(35)))
                .expiresAt(Instant.now().minus(Duration.ofDays(5))) // Expiré
                .build();

        when(reservedCodeRepository.findByCode("ZIG-KBG-4271")).thenReturn(Optional.of(reservation));
        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-6666");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-KBG-6666", resp.getCode());
        assertTrue(resp.getCodeChanged());
        assertEquals("ZIG-KBG-4271", resp.getPreviousCode());
    }

    @Test
    @DisplayName("13. Idempotence : deux POST avec le même clientRequestId retournent le même ID, statut replay 200, zéro doublon")
    void testCreateAddress_idempotentSecondPostReturnsSameAddress() {
        UUID clientRequestId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();

        Address existingAddress = Address.builder()
                .id(addressId)
                .code("ZIG-KBG-4271")
                .clientRequestId(clientRequestId)
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .description("Maison")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.ACTIVE)
                .owner(user1)
                .build();

        // Premier appel (non présent)
        when(addressRepository.findByOwnerAndClientRequestId(user1, clientRequestId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(existingAddress));

        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-4271");
        when(addressRepository.save(any(Address.class))).thenReturn(existingAddress);

        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison")
                .locationType(LocationType.MAISON)
                .clientRequestId(clientRequestId)
                .build();

        // 1er appel : création effective
        AddressResponse resp1 = addressService.createAddress(req, user1);
        assertEquals(addressId, resp1.getId());
        assertFalse(resp1.isIdempotentReplay());

        // 2e appel : replay idempotent
        AddressResponse resp2 = addressService.createAddress(req, user1);
        assertEquals(addressId, resp2.getId());
        assertEquals("ZIG-KBG-4271", resp2.getCode());
        assertTrue(resp2.isIdempotentReplay());

        // Un seul save a été exécuté
        verify(addressRepository, times(1)).save(any(Address.class));
    }

    @Test
    @DisplayName("14. Idempotence : isolation par utilisateur (même clientRequestId pour deux utilisateurs distincts)")
    void testCreateAddress_idempotentDifferentUsers_isolated() {
        UUID sharedRequestId = UUID.randomUUID();

        when(addressRepository.findByOwnerAndClientRequestId(user2, sharedRequestId))
                .thenReturn(Optional.empty());
        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-5555");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison user 2")
                .locationType(LocationType.MAISON)
                .clientRequestId(sharedRequestId)
                .build();

        AddressResponse resp = addressService.createAddress(req, user2);
        assertNotNull(resp.getId());
        assertFalse(resp.isIdempotentReplay());
    }

    @Test
    @DisplayName("15. Création standard sans code réservé : comportement nominal")
    void testCreateAddress_withoutReservedCode_normalGeneration() {
        CreateAddressRequest req = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison")
                .locationType(LocationType.MAISON)
                .build();

        when(addressCodeGenerator.generateCode("ZIG", "KBG")).thenReturn("ZIG-KBG-3333");
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AddressResponse resp = addressService.createAddress(req, user1);

        assertEquals("ZIG-KBG-3333", resp.getCode());
        assertFalse(resp.getCodeChanged());
        assertNull(resp.getPreviousCode());
    }

    @Test
    @DisplayName("16. getActiveReservations renvoie uniquement les réservations actives non expirées")
    void testGetActiveReservations_returnsOnlyActiveNonExpired() {
        ReservedCode active = ReservedCode.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-1111")
                .user(user1)
                .zone("ZIG")
                .quartier("KBG")
                .status(ReservedCodeStatus.RESERVED)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofDays(30)))
                .build();

        when(reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(eq(user1), eq(ReservedCodeStatus.RESERVED), any(Instant.class)))
                .thenReturn(List.of(active));

        List<ReservedCodeResponse> list = reservedCodeService.getActiveReservations(user1);

        assertEquals(1, list.size());
        assertEquals("ZIG-KBG-1111", list.get(0).getCode());
        assertEquals(ReservedCodeStatus.RESERVED, list.get(0).getStatus());
    }
}

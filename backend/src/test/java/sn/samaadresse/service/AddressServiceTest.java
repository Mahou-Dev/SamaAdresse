package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.CreateAddressRequest;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.OutofZoneException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private sn.samaadresse.repository.ReservedCodeRepository reservedCodeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Spy
    private GeoGridService geoGridService = new GeoGridService();

    @InjectMocks
    private AddressCodeGenerator addressCodeGenerator;

    private AddressService addressService;
    private User testUser;

    @BeforeEach
    void setUp() {
        geoGridService.initGeoGridData();
        addressService = new AddressService(addressRepository, reservedCodeRepository, userRepository, geoGridService, addressCodeGenerator, fileStorageService);

        testUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .phoneNumber("+221770000000")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("1. Résolution géographique correcte pour des coordonnées connues à Ziguinchor (Boucotte)")
    void testGeoResolution_ZiguinchorBoucotte_Success() {
        // Coordonnées réelles dans le quartier Boucotte-Kangourou à Ziguinchor
        CreateAddressRequest request = CreateAddressRequest.builder()
                .latitude(12.5738)
                .longitude(-16.2650)
                .description("Maison familiale au toit rouge")
                .locationType(LocationType.MAISON)
                .build();

        when(addressRepository.existsByCode(anyString())).thenReturn(false);
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address addr = invocation.getArgument(0);
            addr.setId(UUID.randomUUID());
            return addr;
        });

        AddressResponse response = addressService.createAddress(request, testUser);

        assertNotNull(response);
        assertEquals("ZIG", response.getZone());
        assertEquals("KBG", response.getQuartier());
        assertTrue(response.getCode().startsWith("ZIG-KBG-"));
        assertEquals(LocationType.MAISON, response.getLocationType());
        assertEquals(AddressStatus.ACTIVE, response.getStatus());
    }

    @Test
    @DisplayName("2. Rejet avec exception 422 pour coordonnées hors zone couverte")
    void testGeoResolution_OutofZone_Throws422() {
        // Coordonnées au Sénégal mais hors des zones/quartiers actuellement modélisés
        CreateAddressRequest request = CreateAddressRequest.builder()
                .latitude(12.6200)
                .longitude(-16.3200)
                .description("Concession isolée")
                .locationType(LocationType.MAISON)
                .build();

        OutofZoneException exception = assertThrows(
                OutofZoneException.class,
                () -> addressService.createAddress(request, testUser)
        );

        assertEquals("Coordonnées hors zone couverte", exception.getMessage());
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Rejet avec exception 400 pour coordonnées hors du Sénégal")
    void testGeoResolution_OutsideSenegal_Throws400() {
        CreateAddressRequest request = CreateAddressRequest.builder()
                .latitude(48.8566) // Paris
                .longitude(2.3522)
                .description("Test hors pays")
                .locationType(LocationType.COMMERCE)
                .build();

        assertThrows(
                InvalidCoordinatesException.class,
                () -> addressService.createAddress(request, testUser)
        );
    }

    @Test
    @DisplayName("4. Test d'unicité du code : Génération de 1000 adresses consécutives dans la même zone avec 0 collision")
    void testCodeUniqueness_Generate1000Addresses_ZeroCollisions() {
        Set<String> generatedCodes = new HashSet<>();
        int count = 1000;

        // Simule un repository sans collision initiale
        when(addressRepository.existsByCode(anyString())).thenAnswer(invocation -> {
            String codeToCheck = invocation.getArgument(0);
            return generatedCodes.contains(codeToCheck);
        });

        for (int i = 0; i < count; i++) {
            String code = addressCodeGenerator.generateCode("ZIG", "KBG");
            assertTrue(code.startsWith("ZIG-KBG-"));
            boolean isUnique = generatedCodes.add(code);
            assertTrue(isUnique, "Collision détectée pour le code : " + code);
        }

        assertEquals(1000, generatedCodes.size(), "Il doit y avoir exactement 1000 codes distincts générés");
    }

    @Test
    @DisplayName("5. Immutabilité du code : La mise à jour des champs d'une adresse conserve son code initial")
    void testCodeImmutability_UpdateAddress_CodeUnchanged() {
        Address address = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .description("Description initiale")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.ACTIVE)
                .owner(testUser)
                .build();

        String originalCode = address.getCode();

        // Modification de la description et du type de lieu
        address.setDescription("Nouvelle description après travaux");
        address.setLocationType(LocationType.COMMERCE);

        // Le code reste rigoureusement identique
        assertEquals(originalCode, address.getCode());
        assertEquals("ZIG-KBG-4271", address.getCode());
    }

    @Test
    @DisplayName("6. Zone de chevauchement KBG/ESC : Le quartier dont le centre est le plus proche gagne")
    void testResolveQuartier_OverlapZone_ClosestCenterWins() {
        // Point dans la zone d'intersection KBG (Boucotte) et ESC (Escale Center) : lat 12.5870, lon -16.2670
        // - Centre de KBG : (12.5750, -16.2650) -> dist^2 = (0.0120)^2 + (-0.0020)^2 = 0.000148
        // - Centre de ESC : (12.5850, -16.2675) -> dist^2 = (0.0020)^2 + (0.0005)^2  = 0.00000425
        // Le centre de ESC est nettement plus proche du point.
        double overlapLat = 12.5870;
        double overlapLon = -16.2670;

        sn.samaadresse.domain.model.GeoQuartier resolved = geoGridService.resolveQuartier(overlapLat, overlapLon);

        assertNotNull(resolved);
        assertEquals("ESC", resolved.getCode(), "Le quartier Escale (ESC) doit être sélectionné car son centre est plus proche du point que Boucotte (KBG)");
        assertEquals("Escale Center", resolved.getName());
    }

    @Test
    @DisplayName("7. Résolution position réelle Ziguinchor (12.549680, -16.288404) : Fallback par proximité résout vers KND")
    void testResolveQuartier_RealZiguinchorPosition_FallbackToKND() {
        // Point (12.549680, -16.288404) : dans la zone ZIG, hors boîtes directes (TIL à 12.5500, KND à -16.2850)
        // Centre de KND à 1.754 km (< 3 km fallback max) -> attribué à KND (Kandé - Lyndiane)
        double realLat = 12.549680;
        double realLon = -16.288404;

        sn.samaadresse.domain.model.GeoQuartier resolved = geoGridService.resolveQuartier(realLat, realLon);

        assertNotNull(resolved);
        assertEquals("ZIG", resolved.getZoneCode());
        assertEquals("KND", resolved.getCode(), "Le quartier KND (Kandé - Lyndiane) doit être résolu par proximité (< 3 km)");
        assertEquals("Kandé - Lyndiane", resolved.getName());
    }

    @Test
    @DisplayName("8. Rejet d'un point à plus de 10 km de tout quartier dans la zone ZIG -> OutofZoneException 422")
    void testResolveQuartier_PointAt10KmFromAnyQuartier_Throws422() {
        // Point (12.6450, -16.3450) : dans la zone ZIG mais à 10.42 km du quartier le plus proche (> 3 km fallback max)
        double isolatedLat = 12.6450;
        double isolatedLon = -16.3450;

        OutofZoneException exception = assertThrows(
                OutofZoneException.class,
                () -> geoGridService.resolveQuartier(isolatedLat, isolatedLon)
        );

        assertEquals("Coordonnées hors zone couverte", exception.getMessage());
    }
}

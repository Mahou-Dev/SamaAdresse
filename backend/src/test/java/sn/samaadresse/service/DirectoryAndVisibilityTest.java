package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.DirectoryItemResponse;
import sn.samaadresse.dto.UpdateVisibilityRequest;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.InvalidAddressOperationException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectoryAndVisibilityTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GeoGridService geoGridService;

    @Mock
    private AddressCodeGenerator addressCodeGenerator;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AddressService addressService;

    private User owner1;
    private User owner2;
    private Address address1;

    @BeforeEach
    void setUp() {
        owner1 = User.builder()
                .id(UUID.randomUUID())
                .email("mamadou@samaadresse.sn")
                .fullName("Mamadou Diallo")
                .phoneNumber("+221771234567")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        owner2 = User.builder()
                .id(UUID.randomUUID())
                .email("fatou@samaadresse.sn")
                .fullName("Fatou Ndiaye")
                .phoneNumber("+221772345678")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        address1 = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .locationType(LocationType.MAISON)
                .description("Maison familiale au portail vert")
                .status(AddressStatus.ACTIVE)
                .listed(true)
                .showOwnerName(false)
                .searchText("maison familiale au portail vert kbg")
                .owner(owner1)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("1. normalizeText supprime les accents et convertit en minuscules")
    void normalizeText_removesAccentsAndLowercases() {
        assertEquals("hopital regional de ziguinchor", AddressService.normalizeText("Hôpital Régional de Ziguinchor"));
        assertEquals("boucotte - kangourou", AddressService.normalizeText("BOUCOTTE - KANGOUROU"));
        assertEquals("", AddressService.normalizeText("   "));
        assertEquals("", AddressService.normalizeText(null));
    }

    @Test
    @DisplayName("2. computeSearchText n'inclut JAMAIS le nom du propriétaire si showOwnerName est faux (protection vie privée)")
    void computeSearchText_hidesOwnerNameWhenNotAuthorized() {
        String search = AddressService.computeSearchText("Concession familiale", "KBG", false, "Mamadou Diallo");
        assertTrue(search.contains("concession familiale"));
        assertTrue(search.contains("kbg"));
        assertFalse(search.contains("mamadou"));
        assertFalse(search.contains("diallo"));
    }

    @Test
    @DisplayName("3. computeSearchText inclut le nom du propriétaire uniquement si showOwnerName est vrai")
    void computeSearchText_includesOwnerNameWhenAuthorized() {
        String search = AddressService.computeSearchText("Concession familiale", "KBG", true, "Mamadou Diallo");
        assertTrue(search.contains("concession familiale"));
        assertTrue(search.contains("kbg"));
        assertTrue(search.contains("mamadou diallo"));
    }

    @Test
    @DisplayName("4. searchDirectory rejette un terme de recherche < 2 caractères si aucun filtre n'est actif")
    void searchDirectory_rejectsShortQueryWithoutFilter() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                addressService.searchDirectory("a", null, null, 0, 10));
        assertTrue(ex.getMessage().contains("au moins 2 caractères"));
    }

    @Test
    @DisplayName("5. searchDirectory accepte un terme vide ou court si un filtre quartier ou type est actif")
    void searchDirectory_acceptsShortQueryWithFilter() {
        Page<Address> emptyPage = new PageImpl<>(List.of());
        when(addressRepository.searchDirectory(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(emptyPage);

        Page<DirectoryItemResponse> res1 = addressService.searchDirectory("a", "KBG", null, 0, 10);
        assertNotNull(res1);

        Page<DirectoryItemResponse> res2 = addressService.searchDirectory("", null, LocationType.COMMERCE, 0, 10);
        assertNotNull(res2);
    }

    @Test
    @DisplayName("6. searchDirectory mappe correctement les champs et tronque la description à 120 caractères max")
    void searchDirectory_mapsFieldsAndTruncatesDescription() {
        String longDesc = "A".repeat(150);
        Address addr = Address.builder()
                .code("ZIG-ESC-1000")
                .zone("ZIG")
                .quartier("ESC")
                .locationType(LocationType.COMMERCE)
                .description(longDesc)
                .photoUrl("/uploads/photo.jpg")
                .createdAt(Instant.now())
                .status(AddressStatus.ACTIVE)
                .listed(true)
                .showOwnerName(true)
                .owner(owner1)
                .build();

        when(addressRepository.searchDirectory(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(addr)));

        Page<DirectoryItemResponse> res = addressService.searchDirectory("commerce", null, null, 0, 10);
        assertEquals(1, res.getContent().size());
        DirectoryItemResponse item = res.getContent().get(0);
        assertEquals("ZIG-ESC-1000", item.getCode());
        assertTrue(item.getDescription().length() <= 120);
        assertTrue(item.getDescription().endsWith("..."));
        assertEquals("Mamadou Diallo", item.getOwnerName());
    }

    @Test
    @DisplayName("7. searchDirectory masque le nom du propriétaire si showOwnerName est faux")
    void searchDirectory_masksOwnerNameWhenShowOwnerNameIsFalse() {
        when(addressRepository.searchDirectory(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(address1)));

        Page<DirectoryItemResponse> res = addressService.searchDirectory("maison", null, null, 0, 10);
        assertEquals(1, res.getContent().size());
        assertNull(res.getContent().get(0).getOwnerName());
    }

    @Test
    @DisplayName("8. updateVisibility met à jour listed et showOwnerName et recalcule le searchText")
    void updateVisibility_updatesOptionsAndRecomputesSearchText() {
        when(addressRepository.findById(address1.getId())).thenReturn(Optional.of(address1));
        when(userRepository.findByEmail(owner1.getEmail())).thenReturn(Optional.of(owner1));
        when(addressRepository.save(any(Address.class))).thenAnswer(i -> i.getArgument(0));

        UpdateVisibilityRequest req = UpdateVisibilityRequest.builder()
                .listed(true)
                .showOwnerName(true)
                .build();

        AddressResponse res = addressService.updateVisibility(address1.getId(), req, owner1.getEmail());

        assertTrue(res.getListed());
        assertTrue(res.getShowOwnerName());
        assertTrue(address1.getSearchText().contains("mamadou diallo"));
    }

    @Test
    @DisplayName("9. updateVisibility refuse la modification par un tiers (AccessDeniedException 403)")
    void updateVisibility_deniesNonOwner() {
        when(addressRepository.findById(address1.getId())).thenReturn(Optional.of(address1));
        when(userRepository.findByEmail(owner2.getEmail())).thenReturn(Optional.of(owner2));

        UpdateVisibilityRequest req = UpdateVisibilityRequest.builder().listed(true).build();

        assertThrows(AccessDeniedException.class, () ->
                addressService.updateVisibility(address1.getId(), req, owner2.getEmail()));
    }

    @Test
    @DisplayName("10. updateVisibility échoue si l'adresse est introuvable (AddressNotFoundException 404)")
    void updateVisibility_throwsNotFound() {
        UUID randomId = UUID.randomUUID();
        when(addressRepository.findById(randomId)).thenReturn(Optional.empty());

        UpdateVisibilityRequest req = UpdateVisibilityRequest.builder().listed(true).build();

        assertThrows(AddressNotFoundException.class, () ->
                addressService.updateVisibility(randomId, req, owner1.getEmail()));
    }

    @Test
    @DisplayName("11. updateVisibility refuse la modification si l'adresse est archivée ou suspendue (400)")
    void updateVisibility_rejectsArchivedOrSuspendedAddress() {
        address1.setStatus(AddressStatus.ARCHIVED);
        when(addressRepository.findById(address1.getId())).thenReturn(Optional.of(address1));
        when(userRepository.findByEmail(owner1.getEmail())).thenReturn(Optional.of(owner1));

        UpdateVisibilityRequest req = UpdateVisibilityRequest.builder().listed(true).build();

        assertThrows(InvalidAddressOperationException.class, () ->
                addressService.updateVisibility(address1.getId(), req, owner1.getEmail()));
    }

    @Test
    @DisplayName("12. mapToAddressResponse inclut les drapeaux listed et showOwnerName")
    void mapToAddressResponse_includesVisibilityFlags() {
        address1.setListed(true);
        address1.setShowOwnerName(true);

        AddressResponse res = addressService.mapToAddressResponse(address1);
        assertTrue(res.getListed());
        assertTrue(res.getShowOwnerName());
    }
}

package sn.samaadresse.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.UpdateVisibilityRequest;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.ReservedCodeRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.AddressCodeGenerator;
import sn.samaadresse.service.AddressService;
import sn.samaadresse.service.FileStorageService;
import sn.samaadresse.service.GeoGridService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {DirectoryController.class})
@Import({AddressService.class, GlobalExceptionHandler.class, SecurityConfig.class})
@AutoConfigureMockMvc(addFilters = false)
class DirectoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AddressService addressService;

    @MockBean
    private AddressRepository addressRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private GeoGridService geoGridService;

    @MockBean
    private AddressCodeGenerator addressCodeGenerator;

    @MockBean
    private FileStorageService fileStorageService;

    @MockBean
    private ReservedCodeRepository reservedCodeRepository;

    @MockBean
    private RateLimiterService rateLimiterService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtProvider jwtProvider;

    private final List<Address> dbAddresses = new ArrayList<>();
    private User ownerMamadou;

    @BeforeEach
    void setUp() {
        dbAddresses.clear();

        ownerMamadou = User.builder()
                .id(UUID.randomUUID())
                .email("mamadou@samaadresse.sn")
                .fullName("Mamadou Diallo")
                .phoneNumber("+221771234567")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        when(userRepository.findByEmail(ownerMamadou.getEmail())).thenReturn(Optional.of(ownerMamadou));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address saved = inv.getArgument(0);
            dbAddresses.removeIf(a -> a.getId().equals(saved.getId()));
            dbAddresses.add(saved);
            return saved;
        });
        when(addressRepository.findById(any(UUID.class))).thenAnswer(inv -> {
            UUID id = inv.getArgument(0);
            return dbAddresses.stream().filter(a -> a.getId().equals(id)).findFirst();
        });

        // Implémentation fidèle de la requête JPQL AddressRepository.searchDirectory
        when(addressRepository.searchDirectory(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenAnswer(inv -> {
                    String qRaw = inv.getArgument(0);
                    String qNorm = inv.getArgument(1);
                    String quartier = inv.getArgument(3);
                    LocationType type = inv.getArgument(4);
                    Pageable pageable = inv.getArgument(5);

                    List<Address> matches = dbAddresses.stream()
                            .filter(a -> a.getStatus() == AddressStatus.ACTIVE)
                            .filter(Address::isListed)
                            .filter(a -> quartier == null || quartier.equals(a.getQuartier()))
                            .filter(a -> type == null || type == a.getLocationType())
                            .filter(a -> {
                                if (qNorm == null || qNorm.isEmpty()) return true;
                                boolean codeMatch = qRaw != null && a.getCode().toLowerCase().contains(qRaw.toLowerCase());
                                boolean textMatch = a.getSearchText() != null && a.getSearchText().toLowerCase().contains(qNorm.toLowerCase());
                                return codeMatch || textMatch;
                            })
                            .toList();

                    return new PageImpl<>(matches, pageable, matches.size());
                });
    }

    @Test
    @DisplayName("1a. Adresse avec showOwnerName=false : introuvable par nom du propriétaire et ownerName absent du JSON")
    void directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable() throws Exception {
        UUID addrId = UUID.randomUUID();
        Address addr = Address.builder()
                .id(addrId)
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
                .searchText(AddressService.computeSearchText("Maison familiale au portail vert", "KBG", false, ownerMamadou.getFullName()))
                .owner(ownerMamadou)
                .createdAt(Instant.now())
                .build();
        dbAddresses.add(addr);

        // showOwnerName = false -> recherche par "Mamadou" retourne 0 résultat
        mockMvc.perform(get("/api/public/directory").param("q", "Mamadou"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(content().string(not(containsString("Mamadou Diallo"))));

        // showOwnerName = false -> recherche par description retourne la fiche mais ownerName n'apparaît PAS dans le JSON
        mockMvc.perform(get("/api/public/directory").param("q", "portail vert"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].code").value("ZIG-KBG-4271"))
                .andExpect(jsonPath("$.content[0].ownerName").doesNotExist())
                .andExpect(content().string(not(containsString("Mamadou Diallo"))));
    }

    @Test
    @DisplayName("1b. Adresse avec showOwnerName=true : trouvable par nom du propriétaire et ownerName présent dans le JSON")
    void directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable() throws Exception {
        UUID addrId = UUID.randomUUID();
        Address addr = Address.builder()
                .id(addrId)
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
                .searchText(AddressService.computeSearchText("Maison familiale au portail vert", "KBG", false, ownerMamadou.getFullName()))
                .owner(ownerMamadou)
                .createdAt(Instant.now())
                .build();
        dbAddresses.add(addr);

        // Passage à showOwnerName = true -> trouvable par "Mamadou" et ownerName apparaît dans le JSON
        addressService.updateVisibility(
                addrId,
                UpdateVisibilityRequest.builder().listed(true).showOwnerName(true).build(),
                ownerMamadou.getEmail()
        );

        mockMvc.perform(get("/api/public/directory").param("q", "Mamadou"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].code").value("ZIG-KBG-4271"))
                .andExpect(jsonPath("$.content[0].ownerName").value("Mamadou Diallo"));
    }

    @Test
    @DisplayName("2. Adresse avec listed=false : n'apparaît jamais dans /api/public/directory, même en cherchant son code exact")
    void directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode() throws Exception {
        Address unlisted = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-TIL-3015")
                .latitude(12.5654)
                .longitude(-16.2948)
                .zone("ZIG")
                .quartier("TIL")
                .locationType(LocationType.COMMERCE)
                .description("Boutique d'alimentation générale")
                .status(AddressStatus.ACTIVE)
                .listed(false)
                .showOwnerName(true)
                .searchText(AddressService.computeSearchText("Boutique d'alimentation générale", "TIL", true, ownerMamadou.getFullName()))
                .owner(ownerMamadou)
                .createdAt(Instant.now())
                .build();
        dbAddresses.add(unlisted);

        // Recherche par code exact
        mockMvc.perform(get("/api/public/directory").param("q", "ZIG-TIL-3015"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());

        // Recherche par filtre quartier TIL
        mockMvc.perform(get("/api/public/directory").param("quartier", "TIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @DisplayName("3. Adresse archivée ou suspendue : disparaît de /api/public/directory")
    void directory_archivedOrSuspendedAddress_disappearsFromDirectory() throws Exception {
        UUID addrId = UUID.randomUUID();
        Address addr = Address.builder()
                .id(addrId)
                .code("ZIG-ESC-1042")
                .latitude(12.5852)
                .longitude(-16.2684)
                .zone("ZIG")
                .quartier("ESC")
                .locationType(LocationType.COMMERCE)
                .description("Pharmacie de l'Escale")
                .status(AddressStatus.ACTIVE)
                .listed(true)
                .showOwnerName(false)
                .searchText(AddressService.computeSearchText("Pharmacie de l'Escale", "ESC", false, ownerMamadou.getFullName()))
                .owner(ownerMamadou)
                .createdAt(Instant.now())
                .build();
        dbAddresses.add(addr);

        // Active et listée -> présente
        mockMvc.perform(get("/api/public/directory").param("q", "ZIG-ESC-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        // Archivage -> disparaît immédiatement
        addressService.archiveAddress(addrId, ownerMamadou.getEmail());
        mockMvc.perform(get("/api/public/directory").param("q", "ZIG-ESC-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());

        // Restauration puis suspension -> disparaît immédiatement
        addressService.restoreAddress(addrId, ownerMamadou.getEmail());
        mockMvc.perform(get("/api/public/directory").param("q", "ZIG-ESC-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        addr.setStatus(AddressStatus.SUSPENDED);
        mockMvc.perform(get("/api/public/directory").param("q", "ZIG-ESC-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }
}

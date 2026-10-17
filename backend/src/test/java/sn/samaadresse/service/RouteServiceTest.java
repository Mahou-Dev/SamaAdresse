package sn.samaadresse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.dto.RouteResponse;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.NoRouteFoundException;
import sn.samaadresse.exception.RoutingServiceUnavailableException;
import sn.samaadresse.repository.AddressRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private AddressRepository addressRepository;

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;
    private RouteService routeService;

    private Address activeAddress;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        objectMapper = new ObjectMapper();

        activeAddress = Address.builder()
                .code("ZIG-KBG-4271")
                .latitude(12.5738)
                .longitude(-16.2650)
                .status(AddressStatus.ACTIVE)
                .build();

        routeService = new RouteService(
                addressRepository,
                restClientBuilder,
                objectMapper,
                "test-api-key-123",
                "https://api.openrouteservice.org"
        );
    }

    @Test
    @DisplayName("1. Cas nominal : calcul d'itinéraire réussi avec distance, durée, GeoJSON LineString et étapes")
    void calculateRoute_nominalSuccess() {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        String orsGeoJsonResponse = """
                {
                  "type": "FeatureCollection",
                  "features": [
                    {
                      "type": "Feature",
                      "geometry": {
                        "type": "LineString",
                        "coordinates": [
                          [-16.2735, 12.5638],
                          [-16.2700, 12.5680],
                          [-16.2650, 12.5738]
                        ]
                      },
                      "properties": {
                        "summary": {
                          "distance": 3250.0,
                          "duration": 650.0
                        },
                        "segments": [
                          {
                            "distance": 3250.0,
                            "duration": 650.0,
                            "steps": [
                              {
                                "distance": 1200.0,
                                "duration": 240.0,
                                "instruction": "Prendre vers le nord sur Boulevard des 50 mètres"
                              },
                              {
                                "distance": 2050.0,
                                "duration": 410.0,
                                "instruction": "Tourner à droite vers la grande mosquée de Boucotte"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        mockServer.expect(requestTo("https://api.openrouteservice.org/v2/directions/driving-car/geojson"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "test-api-key-123"))
                .andRespond(withSuccess(orsGeoJsonResponse, MediaType.APPLICATION_JSON));

        RouteResponse response = routeService.calculateRoute(12.5638, -16.2735, "ZIG-KBG-4271", "driving-car");

        assertNotNull(response);
        assertEquals(3250.0, response.getDistance());
        assertEquals(650.0, response.getDuration());
        assertNotNull(response.getGeometry());
        assertEquals("LineString", response.getGeometry().getType());
        assertEquals(3, response.getGeometry().getCoordinates().size());
        assertEquals(2, response.getSteps().size());
        assertEquals("Prendre vers le nord sur Boulevard des 50 mètres", response.getSteps().get(0).getInstruction());

        mockServer.verify();
    }

    @Test
    @DisplayName("2. Cache mémoire 5 min : un second appel identique ne déclenche aucun appel HTTP amont")
    void calculateRoute_usesMemoryCacheOnRepeatedRequest() {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        String orsGeoJsonResponse = """
                {
                  "type": "FeatureCollection",
                  "features": [
                    {
                      "type": "Feature",
                      "geometry": { "type": "LineString", "coordinates": [[-16.27, 12.56], [-16.26, 12.57]] },
                      "properties": {
                        "summary": { "distance": 1500.0, "duration": 300.0 },
                        "segments": [{ "distance": 1500.0, "duration": 300.0, "steps": [] }]
                      }
                    }
                  ]
                }
                """;

        // Un seul appel HTTP attendu
        mockServer.expect(requestTo("https://api.openrouteservice.org/v2/directions/driving-car/geojson"))
                .andRespond(withSuccess(orsGeoJsonResponse, MediaType.APPLICATION_JSON));

        // Premier appel (met en cache)
        RouteResponse r1 = routeService.calculateRoute(12.56381, -16.27351, "ZIG-KBG-4271", "driving-car");
        assertNotNull(r1);

        // Deuxième appel avec coords arrondies identiques (12.564, -16.274)
        RouteResponse r2 = routeService.calculateRoute(12.56384, -16.27353, "ZIG-KBG-4271", "driving-car");
        assertNotNull(r2);
        assertEquals(r1.getDistance(), r2.getDistance());

        mockServer.verify();
    }

    @Test
    @DisplayName("3. Rejet 400 si les coordonnées de départ sont hors du Sénégal")
    void calculateRoute_rejectsCoordinatesOutsideSenegal() {
        // Coordonnées à Paris (48.85, 2.35)
        InvalidCoordinatesException ex1 = assertThrows(InvalidCoordinatesException.class, () ->
                routeService.calculateRoute(48.8566, 2.3522, "ZIG-KBG-4271", "driving-car"));
        assertTrue(ex1.getMessage().contains("Sénégal"));

        // Coordonnées nulles
        assertThrows(InvalidCoordinatesException.class, () ->
                routeService.calculateRoute(null, -16.27, "ZIG-KBG-4271", "driving-car"));
    }

    @Test
    @DisplayName("4. Rejet 400 si le profil de déplacement est invalide")
    void calculateRoute_rejectsInvalidProfile() {
        InvalidCoordinatesException ex = assertThrows(InvalidCoordinatesException.class, () ->
                routeService.calculateRoute(12.56, -16.27, "ZIG-KBG-4271", "flying-plane"));
        assertTrue(ex.getMessage().contains("driving-car"));
    }

    @Test
    @DisplayName("5. Erreur 404 si l'adresse de destination est introuvable ou inactive")
    void calculateRoute_throwsNotFoundForInactiveAddress() {
        when(addressRepository.findByCodeAndStatus("ZIG-INCONNU-9999", AddressStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(AddressNotFoundException.class, () ->
                routeService.calculateRoute(12.56, -16.27, "ZIG-INCONNU-9999", "driving-car"));
    }

    @Test
    @DisplayName("6. Erreur 422 si OpenRouteService renvoie 404/422 ou aucun itinéraire possible")
    void calculateRoute_translatesTo422WhenNoRouteFound() {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        mockServer.expect(requestTo("https://api.openrouteservice.org/v2/directions/driving-car/geojson"))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY));

        assertThrows(NoRouteFoundException.class, () ->
                routeService.calculateRoute(12.56, -16.27, "ZIG-KBG-4271", "driving-car"));
    }

    @Test
    @DisplayName("7. Erreur 503 si la clé API ORS_API_KEY est absente")
    void calculateRoute_throws503WhenApiKeyMissing() {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        RouteService noKeyService = new RouteService(
                addressRepository,
                restClientBuilder,
                objectMapper,
                "", // Clé absente
                "https://api.openrouteservice.org"
        );

        RoutingServiceUnavailableException ex = assertThrows(RoutingServiceUnavailableException.class, () ->
                noKeyService.calculateRoute(12.56, -16.27, "ZIG-KBG-4271", "driving-car"));
        assertTrue(ex.getMessage().contains("indisponible"));
    }

    @Test
    @DisplayName("8. Erreur 503 si OpenRouteService est en panne (500 Internal Server Error)")
    void calculateRoute_translatesTo503WhenOrsIsDown() {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        mockServer.expect(requestTo("https://api.openrouteservice.org/v2/directions/driving-car/geojson"))
                .andRespond(withServerError());

        assertThrows(RoutingServiceUnavailableException.class, () ->
                routeService.calculateRoute(12.56, -16.27, "ZIG-KBG-4271", "driving-car"));
    }
}

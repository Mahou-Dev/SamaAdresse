package sn.samaadresse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.dto.GeoJsonLineString;
import sn.samaadresse.dto.RouteResponse;
import sn.samaadresse.dto.RouteStep;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.NoRouteFoundException;
import sn.samaadresse.exception.RoutingServiceUnavailableException;
import sn.samaadresse.repository.AddressRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RouteService {

    // Limites géographiques du Sénégal (latitude [12.0, 17.0], longitude [-17.6, -11.3])
    private static final double MIN_LAT = 12.0;
    private static final double MAX_LAT = 17.0;
    private static final double MIN_LON = -17.6;
    private static final double MAX_LON = -11.3;

    private static final Set<String> ALLOWED_PROFILES = Set.of("driving-car", "foot-walking");

    private final AddressRepository addressRepository;
    private final RestClient restClient;
    private final String orsApiKey;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedRoute> routeCache = new ConcurrentHashMap<>();

    public RouteService(
            AddressRepository addressRepository,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${ors.api-key:}") String orsApiKey,
            @Value("${ors.base-url:https://api.openrouteservice.org}") String orsBaseUrl
    ) {
        this.addressRepository = addressRepository;
        this.objectMapper = objectMapper;
        this.orsApiKey = orsApiKey != null ? orsApiKey.trim() : "";

        this.restClient = restClientBuilder
                .baseUrl(orsBaseUrl)
                .build();
    }

    public RouteResponse calculateRoute(Double fromLat, Double fromLon, String code, String profile) {
        // 1. Validation des coordonnées de départ (strictement au Sénégal)
        if (fromLat == null || fromLon == null) {
            throw new InvalidCoordinatesException("Les coordonnées de départ (fromLat et fromLon) sont obligatoires.");
        }
        if (fromLat < MIN_LAT || fromLat > MAX_LAT || fromLon < MIN_LON || fromLon > MAX_LON) {
            throw new InvalidCoordinatesException("Les coordonnées de départ doivent être situées au Sénégal (latitude entre 12.0 et 17.0, longitude entre -17.6 et -11.3).");
        }

        // 2. Validation du profil
        String cleanProfile = (profile == null || profile.isBlank()) ? "driving-car" : profile.trim();
        if (!ALLOWED_PROFILES.contains(cleanProfile)) {
            throw new InvalidCoordinatesException("Profil d'itinéraire invalide : doit être 'driving-car' ou 'foot-walking'.");
        }

        // 3. Résolution de l'adresse de destination (ACTIVE uniquement, sinon 404)
        if (code == null || code.isBlank()) {
            throw new AddressNotFoundException("Le code d'adresse de destination est obligatoire.");
        }
        String cleanCode = code.trim().toUpperCase();
        Address destAddress = addressRepository.findByCodeAndStatus(cleanCode, AddressStatus.ACTIVE)
                .orElseThrow(() -> new AddressNotFoundException("Adresse non trouvée ou inactive : " + cleanCode));

        // 4. Respect strict de la vie privée : aucun journal ne contient les coordonnées de départ
        log.info("Calcul d'itinéraire vers code {} avec profil {}", cleanCode, cleanProfile);

        // 5. Cache mémoire 5 minutes basé sur coordonnées arrondies à 3 décimales, code et profil
        double roundedLat = Math.round(fromLat * 1000.0) / 1000.0;
        double roundedLon = Math.round(fromLon * 1000.0) / 1000.0;
        String cacheKey = String.format(Locale.ROOT, "%.3f:%.3f:%s:%s", roundedLat, roundedLon, cleanCode, cleanProfile);

        CachedRoute cached = routeCache.get(cacheKey);
        if (cached != null && Instant.now().isBefore(cached.expiresAt)) {
            log.debug("Itinéraire servi depuis le cache mémoire pour {}", cleanCode);
            return cached.response;
        }

        // 6. Vérification de la clé API ORS
        if (this.orsApiKey.isBlank()) {
            log.warn("Clé ORS_API_KEY non configurée pour le calcul d'itinéraire.");
            throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
        }

        // 7. Appel OpenRouteService Directions v2
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("coordinates", List.of(
                List.of(fromLon, fromLat),
                List.of(destAddress.getLongitude(), destAddress.getLatitude())
        ));
        requestBody.put("language", "fr");

        RouteResponse response;
        try {
            String rawJson = restClient.post()
                    .uri("/v2/directions/{profile}/geojson", cleanProfile)
                    .header(HttpHeaders.AUTHORIZATION, this.orsApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON, MediaType.parseMediaType("application/geo+json"))
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            response = parseOrsResponse(rawJson);
        } catch (HttpClientErrorException.NotFound | HttpClientErrorException.UnprocessableEntity ex) {
            throw new NoRouteFoundException("Aucun itinéraire routier n'a pu être trouvé pour cette destination.");
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode().value() == 404 || ex.getStatusCode().value() == 422) {
                throw new NoRouteFoundException("Aucun itinéraire routier n'a pu être trouvé pour cette destination.");
            }
            log.error("Erreur client ORS (code HTTP {})", ex.getStatusCode().value());
            throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            log.error("Service OpenRouteService injoignable ou en erreur : {}", ex.getMessage());
            throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
        } catch (Exception ex) {
            if (ex instanceof NoRouteFoundException || ex instanceof RoutingServiceUnavailableException) {
                throw ex;
            }
            log.error("Erreur inattendue lors de l'appel d'itinéraire : {}", ex.getMessage());
            throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
        }

        // 8. Mise en cache mémoire pour 5 minutes
        routeCache.put(cacheKey, new CachedRoute(response, Instant.now().plus(Duration.ofMinutes(5))));

        return response;
    }

    public void clearCache() {
        routeCache.clear();
    }

    private RouteResponse parseOrsResponse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);

            // Vérification d'erreur dans le corps de réponse ORS
            if (root.has("error")) {
                JsonNode err = root.path("error");
                int code = err.path("code").asInt();
                if (code == 2007 || code == 2010 || code == 2099) {
                    throw new NoRouteFoundException("Aucun itinéraire routier n'a pu être trouvé pour cette destination.");
                }
                throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
            }

            Double distance = null;
            Double duration = null;
            List<List<Double>> coords = new ArrayList<>();
            List<RouteStep> steps = new ArrayList<>();

            // Format GeoJSON standard (features[0])
            if (root.has("features") && root.path("features").isArray() && !root.path("features").isEmpty()) {
                JsonNode feature = root.path("features").path(0);

                // Géométrie LineString
                JsonNode geomNode = feature.path("geometry");
                JsonNode coordsNode = geomNode.path("coordinates");
                if (coordsNode.isArray()) {
                    for (JsonNode pt : coordsNode) {
                        if (pt.isArray() && pt.size() >= 2) {
                            coords.add(List.of(pt.get(0).asDouble(), pt.get(1).asDouble()));
                        }
                    }
                }

                // Propriétés : summary et segments
                JsonNode props = feature.path("properties");
                JsonNode summary = props.path("summary");
                if (!summary.isMissingNode()) {
                    distance = summary.path("distance").asDouble();
                    duration = summary.path("duration").asDouble();
                }

                JsonNode segments = props.path("segments");
                if (segments.isArray() && !segments.isEmpty()) {
                    JsonNode seg = segments.path(0);
                    if (distance == null) {
                        distance = seg.path("distance").asDouble();
                    }
                    if (duration == null) {
                        duration = seg.path("duration").asDouble();
                    }
                    JsonNode stepsNode = seg.path("steps");
                    if (stepsNode.isArray()) {
                        int count = 0;
                        for (JsonNode s : stepsNode) {
                            if (count >= 15) break;
                            String inst = s.path("instruction").asText();
                            double d = s.path("distance").asDouble();
                            double dur = s.path("duration").asDouble();
                            steps.add(RouteStep.builder()
                                    .instruction(inst)
                                    .distance(d)
                                    .duration(dur)
                                    .build());
                            count++;
                        }
                    }
                }
            } else if (root.has("routes") && root.path("routes").isArray() && !root.path("routes").isEmpty()) {
                // Format routes JSON
                JsonNode routeNode = root.path("routes").path(0);
                JsonNode summary = routeNode.path("summary");
                distance = summary.path("distance").asDouble();
                duration = summary.path("duration").asDouble();

                JsonNode segments = routeNode.path("segments");
                if (segments.isArray() && !segments.isEmpty()) {
                    JsonNode stepsNode = segments.path(0).path("steps");
                    if (stepsNode.isArray()) {
                        int count = 0;
                        for (JsonNode s : stepsNode) {
                            if (count >= 15) break;
                            steps.add(RouteStep.builder()
                                    .instruction(s.path("instruction").asText())
                                    .distance(s.path("distance").asDouble())
                                    .duration(s.path("duration").asDouble())
                                    .build());
                            count++;
                        }
                    }
                }
            }

            if (distance == null || coords.isEmpty()) {
                throw new NoRouteFoundException("Aucun itinéraire routier n'a pu être trouvé pour cette destination.");
            }

            GeoJsonLineString geometry = GeoJsonLineString.builder()
                    .type("LineString")
                    .coordinates(coords)
                    .build();

            return RouteResponse.builder()
                    .distance(distance)
                    .duration(duration)
                    .geometry(geometry)
                    .steps(steps)
                    .build();

        } catch (NoRouteFoundException | RoutingServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur de parsing de la réponse ORS : {}", e.getMessage());
            throw new RoutingServiceUnavailableException("Service d'itinéraire temporairement indisponible.");
        }
    }

    private static class CachedRoute {
        final RouteResponse response;
        final Instant expiresAt;

        CachedRoute(RouteResponse response, Instant expiresAt) {
            this.response = response;
            this.expiresAt = expiresAt;
        }
    }
}

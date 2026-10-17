package sn.samaadresse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import sn.samaadresse.domain.model.GeoGridData;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.domain.model.GeoZone;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.OutofZoneException;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class GeoGridService {

    private final ObjectMapper objectMapper;
    private final double fallbackMaxDistanceKm;

    private final List<GeoZone> zones = new ArrayList<>();
    private final List<GeoQuartier> quartiers = new ArrayList<>();

    public GeoGridService() {
        this(new ObjectMapper(), 3.0);
    }

    @Autowired
    public GeoGridService(
            @Autowired(required = false) ObjectMapper objectMapper,
            @Value("${geo.fallback-max-distance-km:3.0}") double fallbackMaxDistanceKm
    ) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.fallbackMaxDistanceKm = fallbackMaxDistanceKm;
    }

    @PostConstruct
    public void initGeoGridData() {
        try {
            ClassPathResource resource = new ClassPathResource("geo-grid.json");
            try (InputStream is = resource.getInputStream()) {
                GeoGridData data = objectMapper.readValue(is, GeoGridData.class);
                zones.clear();
                if (data.getZones() != null) {
                    zones.addAll(data.getZones());
                }
                quartiers.clear();
                if (data.getQuartiers() != null) {
                    quartiers.addAll(data.getQuartiers());
                }
                log.info("[GEO-GRID] Grille géographique chargée : {} zones, {} quartiers (fallback max distance: {} km)",
                        zones.size(), quartiers.size(), fallbackMaxDistanceKm);
            }
        } catch (Exception e) {
            log.error("[GEO-GRID] Erreur lors du chargement de geo-grid.json", e);
            throw new IllegalStateException("Impossible de charger les données géographiques depuis geo-grid.json", e);
        }
    }

    public void validatePlausibleSenegalCoordinates(double lat, double lon) {
        if (lat < 12.0 || lat > 17.0 || lon < -17.6 || lon > -11.0) {
            throw new InvalidCoordinatesException("Coordonnées géographiques hors de la plage plausible du Sénégal (12-17°N, -17/-11°O)");
        }
    }

    /**
     * Résout le quartier géographique d'un point (lat, lon) selon la règle en 3 paliers :
     * ----------------------------------------------------------------------------------
     * (a) Hors de la boîte d'une zone couverte : OutofZoneException (422) "Coordonnées hors zone couverte".
     * (b) Dans la boîte d'un ou plusieurs quartiers de la zone :
     *     - 1 quartier : retour immédiat.
     *     - Plusieurs quartiers (chevauchement) : le quartier au centre le plus proche l'emporte.
     * (c) Dans la boîte de la zone mais dans aucun quartier :
     *     - On cherche le quartier de cette zone dont le centre est le plus proche.
     *     - Si la distance est <= fallbackMaxDistanceKm (défaut 3.0 km) : attribué à ce quartier.
     *     - Si la distance est > fallbackMaxDistanceKm : OutofZoneException (422) "Coordonnées hors zone couverte".
     */
    public GeoQuartier resolveQuartier(double lat, double lon) {
        validatePlausibleSenegalCoordinates(lat, lon);

        // (a) Recherche de la zone englobante
        GeoZone matchingZone = zones.stream()
                .filter(z -> z.contains(lat, lon))
                .findFirst()
                .orElse(null);

        if (matchingZone == null) {
            throw new OutofZoneException("Coordonnées hors zone couverte");
        }

        // (b) Recherche des quartiers de cette zone contenant le point
        List<GeoQuartier> candidates = new ArrayList<>();
        for (GeoQuartier q : quartiers) {
            if (q.getZoneCode().equalsIgnoreCase(matchingZone.getCode()) && q.contains(lat, lon)) {
                candidates.add(q);
            }
        }

        if (candidates.size() == 1) {
            return candidates.get(0);
        }

        if (candidates.size() > 1) {
            // Chevauchement : le centre le plus proche gagne
            return findClosestQuartierByCenter(candidates, lat, lon);
        }

        // (c) Dans la boîte de la zone mais dans aucun quartier : fallback par proximité (< fallbackMaxDistanceKm)
        List<GeoQuartier> zoneQuartiers = quartiers.stream()
                .filter(q -> q.getZoneCode().equalsIgnoreCase(matchingZone.getCode()))
                .toList();

        if (zoneQuartiers.isEmpty()) {
            throw new OutofZoneException("Coordonnées hors zone couverte");
        }

        GeoQuartier closest = null;
        double minDistanceKm = Double.MAX_VALUE;

        for (GeoQuartier q : zoneQuartiers) {
            double centerLat = (q.getLatMin() + q.getLatMax()) / 2.0;
            double centerLon = (q.getLonMin() + q.getLonMax()) / 2.0;
            double distanceKm = haversineDistanceKm(lat, lon, centerLat, centerLon);

            if (distanceKm < minDistanceKm) {
                minDistanceKm = distanceKm;
                closest = q;
            }
        }

        if (minDistanceKm <= fallbackMaxDistanceKm) {
            log.info("[GEO-GRID] Coordonnées ({}, {}) résolues par fallback au quartier {} (distance centre: {} km)",
                    lat, lon, closest.getCode(), String.format("%.3f", minDistanceKm));
            return closest;
        }

        throw new OutofZoneException("Coordonnées hors zone couverte");
    }

    private GeoQuartier findClosestQuartierByCenter(List<GeoQuartier> candidates, double lat, double lon) {
        GeoQuartier bestCandidate = null;
        double minDistanceKm = Double.MAX_VALUE;

        for (GeoQuartier candidate : candidates) {
            double centerLat = (candidate.getLatMin() + candidate.getLatMax()) / 2.0;
            double centerLon = (candidate.getLonMin() + candidate.getLonMax()) / 2.0;
            double distanceKm = haversineDistanceKm(lat, lon, centerLat, centerLon);

            if (distanceKm < minDistanceKm) {
                minDistanceKm = distanceKm;
                bestCandidate = candidate;
            }
        }

        return bestCandidate;
    }

    /**
     * Calcul de la distance orthodromique (Haversine) entre deux points géodésiques en kilomètres.
     */
    public static double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0; // Rayon moyen terrestre en km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return R * c;
    }

    public List<GeoZone> getAllZones() {
        return List.copyOf(zones);
    }

    public List<GeoQuartier> getAllQuartiers() {
        return List.copyOf(quartiers);
    }

    public double getFallbackMaxDistanceKm() {
        return fallbackMaxDistanceKm;
    }
}

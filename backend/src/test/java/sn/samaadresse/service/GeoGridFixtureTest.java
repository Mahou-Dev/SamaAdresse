package sn.samaadresse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.OutofZoneException;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class GeoGridFixtureTest {

    private GeoGridService geoGridService;
    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    @BeforeEach
    void setUp() {
        geoGridService = new GeoGridService();
        geoGridService.initGeoGridData();
    }

    public record FixturePoint(
            String id,
            String description,
            double latitude,
            double longitude,
            String expectedStatus, // "RESOLVED", "OUT_OF_ZONE", "INVALID_COORDINATES"
            String expectedZone,
            String expectedQuartier,
            Double distanceToCenterKm
    ) {}

    @Test
    @DisplayName("Générer et valider au moins 60 points de test représentatifs pour geo-grid-fixture.json")
    void generateAndVerify60PointFixture() throws IOException {
        List<FixturePoint> points = new ArrayList<>();

        // 1. Ziguinchor - Points typiques
        addPoint(points, "zig-kbg-1", "Boucotte centre", 12.5738, -16.2650);
        addPoint(points, "zig-kbg-2", "Boucotte nord", 12.5780, -16.2620);
        addPoint(points, "zig-esc-1", "Escale débarcadère", 12.5852, -16.2684);
        addPoint(points, "zig-esc-2", "Escale est", 12.5880, -16.2645);
        addPoint(points, "zig-til-1", "Tilène marché", 12.5654, -16.2948);
        addPoint(points, "zig-til-2", "Tilène sud", 12.5620, -16.2980);
        addPoint(points, "zig-knd-1", "Kandé nord", 12.5542, -16.2731);
        addPoint(points, "zig-knd-2", "Kandé sud", 12.5480, -16.2800);
        addPoint(points, "zig-nem-1", "Néma Kadialang", 12.5583, -16.2455);
        addPoint(points, "zig-nem-2", "Néma sud", 12.5510, -16.2520);

        // 2. Dakar - Points typiques
        addPoint(points, "dkr-plt-1", "Plateau Place de l'Indépendance", 14.6698, -17.4332);
        addPoint(points, "dkr-plt-2", "Plateau Palais Présidentiel", 14.6610, -17.4310);
        addPoint(points, "dkr-med-1", "Médina rue 6", 14.6850, -17.4480);
        addPoint(points, "dkr-med-2", "Médina Tilène Dakar", 14.6890, -17.4520);
        addPoint(points, "dkr-alm-1", "Almadies pointe", 14.7430, -17.5250);
        addPoint(points, "dkr-alm-2", "Almadies ambassades", 14.7390, -17.5180);
        addPoint(points, "dkr-yof-1", "Yoff village", 14.7610, -17.4680);
        addPoint(points, "dkr-yof-2", "Yoff plage BCEAO", 14.7550, -17.4750);
        addPoint(points, "dkr-ngg-1", "Ngor île / côte", 14.7530, -17.5150);
        addPoint(points, "dkr-ngg-2", "Ngor village", 14.7490, -17.5120);
        addPoint(points, "dkr-ouk-1", "Ouakam monument Renaissance", 14.7220, -17.4950);
        addPoint(points, "dkr-ouk-2", "Ouakam cité Mamelles", 14.7180, -17.4910);
        addPoint(points, "dkr-gdj-1", "Grand Dakar rond-point Jet d'Eau", 14.7080, -17.4520);
        addPoint(points, "dkr-gdj-2", "Grand Dakar nord", 14.7120, -17.4480);

        // 3. Points frontières et coins de quartiers Ziguinchor
        addPoint(points, "zig-edge-kbg-ne", "Boucotte coin NE", 12.5795, -16.2605);
        addPoint(points, "zig-edge-kbg-sw", "Boucotte coin SW", 12.5685, -16.2715);
        addPoint(points, "zig-edge-esc-nw", "Escale coin NW", 12.5895, -16.2745);
        addPoint(points, "zig-edge-til-nw", "Tilène coin NW", 12.5715, -16.3025);
        addPoint(points, "zig-edge-knd-se", "Kandé coin SE", 12.5455, -16.2655);
        addPoint(points, "zig-edge-nem-ne", "Néma coin NE", 12.5645, -16.2355);

        // 4. Points frontières Dakar
        addPoint(points, "dkr-edge-plt-s", "Plateau cap Manuel", 14.6540, -17.4300);
        addPoint(points, "dkr-edge-alm-w", "Almadies extrême ouest", 14.7460, -17.5300);
        addPoint(points, "dkr-edge-yof-n", "Yoff nord aéroport", 14.7640, -17.4650);
        addPoint(points, "dkr-edge-med-w", "Médina corniche ouest", 14.6820, -17.4560);

        // 5. Fallback par proximité (dans la zone mais hors boîte de quartier <= 3km)
        addPoint(points, "zig-fallback-1", "Zone Ziguinchor près Boucotte (<3km)", 12.5810, -16.2550);
        addPoint(points, "zig-fallback-2", "Zone Ziguinchor est (<3km Néma)", 12.5600, -16.2300);
        addPoint(points, "zig-fallback-3", "Zone Ziguinchor sud (<3km Kandé)", 12.5420, -16.2700);
        addPoint(points, "zig-fallback-4", "Zone Ziguinchor ouest (<3km Tilène)", 12.5650, -16.3080);
        addPoint(points, "dkr-fallback-1", "Zone Dakar autoroute ouest (<3km)", 14.7300, -17.4600);
        addPoint(points, "dkr-fallback-2", "Zone Dakar est VDN (<3km)", 14.7150, -17.4700);
        addPoint(points, "dkr-fallback-3", "Zone Dakar Hann (<3km Grand Dakar)", 14.7200, -17.4400);

        // 6. Hors zone (dans Sénégal mais hors zone couverte ou > 3km)
        addPoint(points, "oos-thies", "Thiès centre ville", 14.7910, -16.9250);
        addPoint(points, "oos-mbour", "Mbour Petite Côte", 14.4220, -16.9630);
        addPoint(points, "oos-saint-louis", "Saint-Louis île", 16.0240, -16.5010);
        addPoint(points, "oos-touba", "Touba grande mosquée", 14.8630, -15.8750);
        addPoint(points, "oos-kaolack", "Kaolack centre", 14.1500, -16.0800);
        addPoint(points, "oos-ziguinchor-rural-1", "Enampore Casamance (>3km ZIG)", 12.5100, -16.4500);
        addPoint(points, "oos-ziguinchor-rural-2", "Nyassia (>3km ZIG)", 12.4600, -16.3500);
        addPoint(points, "oos-ziguinchor-rural-3", "Oussouye (>3km ZIG)", 12.4850, -16.5450);
        addPoint(points, "oos-cap-skirring", "Cap Skirring plage", 12.4180, -16.7450);
        addPoint(points, "oos-bignona", "Bignona centre", 12.8100, -16.2300);
        addPoint(points, "oos-fatick", "Fatick centre", 14.3300, -16.4100);
        addPoint(points, "oos-kolda", "Kolda haute Casamance", 12.8800, -14.9500);
        addPoint(points, "oos-tamba", "Tambacounda Sénégal oriental", 13.7700, -13.6700);

        // 7. Coordonnées invalides (hors Sénégal 12-17°N, -17.6 à -11°O)
        addPoint(points, "inv-paris", "Paris France", 48.8566, 2.3522);
        addPoint(points, "inv-tokyo", "Tokyo Japon", 35.6762, 139.6503);
        addPoint(points, "inv-equator", "Océan Atlantique golfe de Guinée", 0.0, 0.0);
        addPoint(points, "inv-banjul", "Banjul Gambie (hors Sénégal lat)", 13.4549, -16.5790); // note: Gambie lat is ~13.4, lon -16.5 (plausible senegal box is 12-17, -17.6 to -11) - let's check:
        // Plausible Senegal check in GeoGridService: lat < 12.0 || lat > 17.0 || lon < -17.6 || lon > -11.0
        // Banjul is lat 13.45, lon -16.57 so it passes plausible, but is OUT_OF_ZONE!
        addPoint(points, "inv-north", "Mauritanie nord (>17°N)", 18.0500, -15.9700);
        addPoint(points, "inv-south", "Guinée-Bissau sud (<12°N)", 11.8500, -15.5800);
        addPoint(points, "inv-west", "Plein Océan Atlantique (<-17.6°O)", 14.7000, -18.2000);
        addPoint(points, "inv-east", "Mali (< -11°O c-à-d > -11°)", 14.5000, -10.5000);

        // 8. Points supplémentaires Ziguinchor & Dakar pour atteindre > 65 points
        addPoint(points, "zig-extra-1", "Boucotte sud-est", 12.5700, -16.2620);
        addPoint(points, "zig-extra-2", "Tilène est", 12.5670, -16.2900);
        addPoint(points, "zig-extra-3", "Escale centre", 12.5840, -16.2700);
        addPoint(points, "zig-extra-4", "Kandé ouest", 12.5520, -16.2770);
        addPoint(points, "zig-extra-5", "Néma ouest", 12.5560, -16.2500);
        addPoint(points, "dkr-extra-1", "Plateau port", 14.6750, -17.4310);
        addPoint(points, "dkr-extra-2", "Médina nord", 14.6920, -17.4470);
        addPoint(points, "dkr-extra-3", "Ouakam est", 14.7250, -17.4880);
        addPoint(points, "dkr-extra-4", "Grand Dakar sud", 14.7020, -17.4550);
        addPoint(points, "dkr-extra-5", "Yoff est", 14.7580, -17.4600);

        assertTrue(points.size() >= 60, "Le jeu de test partagé doit comporter au moins 60 points (actuel: " + points.size() + ")");

        // Sauvegarder dans frontend/src/data/geo-grid-fixture.json
        File frontendFixture = new File("../frontend/src/data/geo-grid-fixture.json");
        objectMapper.writeValue(frontendFixture, points);
        assertTrue(frontendFixture.exists() && frontendFixture.length() > 0, "Le fichier frontend fixture doit exister");

        // Sauvegarder également dans backend/src/test/resources/geo-grid-fixture.json
        File backendFixture = new File("src/test/resources/geo-grid-fixture.json");
        backendFixture.getParentFile().mkdirs();
        objectMapper.writeValue(backendFixture, points);
        assertTrue(backendFixture.exists() && backendFixture.length() > 0, "Le fichier backend fixture doit exister");

        System.out.println("✅ Geo-grid fixture générée avec " + points.size() + " points de test.");
    }

    private void addPoint(List<FixturePoint> points, String id, String desc, double lat, double lon) {
        try {
            geoGridService.validatePlausibleSenegalCoordinates(lat, lon);
            try {
                GeoQuartier q = geoGridService.resolveQuartier(lat, lon);
                double centerLat = (q.getLatMin() + q.getLatMax()) / 2.0;
                double centerLon = (q.getLonMin() + q.getLonMax()) / 2.0;
                double dist = GeoGridService.haversineDistanceKm(lat, lon, centerLat, centerLon);
                points.add(new FixturePoint(id, desc, lat, lon, "RESOLVED", q.getZoneCode(), q.getCode(), Math.round(dist * 1000.0) / 1000.0));
            } catch (OutofZoneException e) {
                points.add(new FixturePoint(id, desc, lat, lon, "OUT_OF_ZONE", null, null, null));
            }
        } catch (InvalidCoordinatesException e) {
            points.add(new FixturePoint(id, desc, lat, lon, "INVALID_COORDINATES", null, null, null));
        }
    }
}

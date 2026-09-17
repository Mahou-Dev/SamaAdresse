package sn.samaadresse.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.domain.model.GeoZone;
import sn.samaadresse.exception.InvalidCoordinatesException;
import sn.samaadresse.exception.OutofZoneException;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeoGridService {

    private final List<GeoZone> zones = new ArrayList<>();
    private final List<GeoQuartier> quartiers = new ArrayList<>();

    @PostConstruct
    public void initGeoGridData() {
        // Zone 1: Ziguinchor (ZIG)
        zones.add(GeoZone.builder()
                .code("ZIG")
                .name("Ziguinchor")
                .latMin(12.5000).latMax(12.6500)
                .lonMin(-16.3500).lonMax(-16.2000)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("KBG")
                .name("Boucotte - Kangourou")
                .zoneCode("ZIG")
                .latMin(12.5600).latMax(12.5900)
                .lonMin(-16.2800).lonMax(-16.2500)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("ESC")
                .name("Escale Center")
                .zoneCode("ZIG")
                .latMin(12.5750).latMax(12.5950)
                .lonMin(-16.2750).lonMax(-16.2600)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("KND")
                .name("Kandé - Lyndiane")
                .zoneCode("ZIG")
                .latMin(12.5400).latMax(12.5650)
                .lonMin(-16.2850).lonMax(-16.2600)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("TIL")
                .name("Tilène")
                .zoneCode("ZIG")
                .latMin(12.5500).latMax(12.5800)
                .lonMin(-16.3100).lonMax(-16.2800)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("NEM")
                .name("Nema - Kadialang")
                .zoneCode("ZIG")
                .latMin(12.5450).latMax(12.5700)
                .lonMin(-16.2600).lonMax(-16.2300)
                .build());

        // Zone 2: Dakar (DKR)
        zones.add(GeoZone.builder()
                .code("DKR")
                .name("Dakar")
                .latMin(14.6000).latMax(14.8500)
                .lonMin(-17.5500).lonMax(-17.2500)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("MED")
                .name("Médina")
                .zoneCode("DKR")
                .latMin(14.6700).latMax(14.6950)
                .lonMin(-17.4600).lonMax(-17.4400)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("PLT")
                .name("Dakar Plateau")
                .zoneCode("DKR")
                .latMin(14.6550).latMax(14.6750)
                .lonMin(-17.4450).lonMax(-17.4250)
                .build());

        // Zone 3: Saint-Louis (SL)
        zones.add(GeoZone.builder()
                .code("SL")
                .name("Saint-Louis")
                .latMin(15.9500).latMax(16.1000)
                .lonMin(-16.5500).lonMax(-16.4000)
                .build());

        quartiers.add(GeoQuartier.builder()
                .code("NDR")
                .name("Île de Ndar")
                .zoneCode("SL")
                .latMin(16.0150).latMax(16.0350)
                .lonMin(-16.5050).lonMax(-16.4900)
                .build());
    }

    public void validatePlausibleSenegalCoordinates(double lat, double lon) {
        if (lat < 12.0 || lat > 17.0 || lon < -17.6 || lon > -11.0) {
            throw new InvalidCoordinatesException("Coordonnées géographiques hors de la plage plausible du Sénégal (12-17°N, -17/-11°O)");
        }
    }

    public GeoQuartier resolveQuartier(double lat, double lon) {
        validatePlausibleSenegalCoordinates(lat, lon);

        for (GeoQuartier q : quartiers) {
            if (q.contains(lat, lon)) {
                return q;
            }
        }

        throw new OutofZoneException("Coordonnées hors zone couverte");
    }

    public List<GeoZone> getAllZones() {
        return List.copyOf(zones);
    }

    public List<GeoQuartier> getAllQuartiers() {
        return List.copyOf(quartiers);
    }
}

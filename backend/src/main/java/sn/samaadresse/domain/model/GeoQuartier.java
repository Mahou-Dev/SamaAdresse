package sn.samaadresse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoQuartier {
    private String code;       // ex: KBG
    private String name;       // ex: Boucotte - Kangourou
    private String zoneCode;   // ex: ZIG
    private double latMin;
    private double latMax;
    private double lonMin;
    private double lonMax;

    public boolean contains(double lat, double lon) {
        return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
    }
}

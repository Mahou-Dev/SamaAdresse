package sn.samaadresse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZone {
    private String code;       // ex: ZIG
    private String name;       // ex: Ziguinchor
    private double latMin;
    private double latMax;
    private double lonMin;
    private double lonMax;

    public boolean contains(double lat, double lon) {
        return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
    }
}

package sn.samaadresse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoGridData {
    @Builder.Default
    private List<GeoZone> zones = new ArrayList<>();

    @Builder.Default
    private List<GeoQuartier> quartiers = new ArrayList<>();
}

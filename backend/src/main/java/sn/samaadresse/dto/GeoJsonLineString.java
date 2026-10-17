package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Géométrie GeoJSON LineString pour le tracé cartographique")
public class GeoJsonLineString {

    @Schema(description = "Type GeoJSON", example = "LineString")
    @Builder.Default
    private String type = "LineString";

    @Schema(description = "Liste ordonnée de coordonnées [longitude, latitude]")
    private List<List<Double>> coordinates;
}

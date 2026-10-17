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
@Schema(description = "Réponse d'itinéraire calculé depuis la position de l'utilisateur")
public class RouteResponse {

    @Schema(description = "Distance totale en mètres", example = "3420.5")
    private Double distance;

    @Schema(description = "Durée estimée en secondes", example = "720.0")
    private Double duration;

    @Schema(description = "Tracé géographique GeoJSON LineString")
    private GeoJsonLineString geometry;

    @Schema(description = "Étapes textuelles de l'itinéraire (max 15)")
    private List<RouteStep> steps;
}

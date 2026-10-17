package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Étape textuelle d'un itinéraire")
public class RouteStep {

    @Schema(description = "Instruction de navigation", example = "Prendre à droite sur Rue du Commerce")
    private String instruction;

    @Schema(description = "Distance du tronçon en mètres", example = "250.0")
    private Double distance;

    @Schema(description = "Durée estimée du tronçon en secondes", example = "45.0")
    private Double duration;
}

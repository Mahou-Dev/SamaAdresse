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
@Schema(description = "Demande de modification de la visibilité d'une adresse dans l'annuaire")
public class UpdateVisibilityRequest {

    @Schema(description = "Indique si l'adresse doit figurer dans l'annuaire public", example = "true")
    private Boolean listed;

    @Schema(description = "Indique si le nom du propriétaire doit être affiché publiquement", example = "false")
    private Boolean showOwnerName;
}

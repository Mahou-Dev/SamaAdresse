package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.ReportReason;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de signalement anonyme d'une adresse publique")
public class CreateReportRequest {

    @NotNull(message = "Le motif du signalement est obligatoire.")
    @Schema(description = "Motif du signalement", example = "POSITION_INCORRECTE")
    private ReportReason reason;

    @Size(max = 300, message = "Le commentaire ne peut pas dépasser 300 caractères.")
    @Schema(description = "Commentaire optionnel (max 300 caractères)")
    private String comment;
}

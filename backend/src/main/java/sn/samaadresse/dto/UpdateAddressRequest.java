package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.LocationType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de mise à jour partielle d'une adresse (description et type de lieu uniquement ; code et position immuables)")
public class UpdateAddressRequest {

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères.")
    @Schema(description = "Nouvelle description / repère visuel (max 500 caractères)")
    private String description;

    @Schema(description = "Nouveau type de lieu (MAISON, COMMERCE, INSTITUTION)")
    private LocationType locationType;

    @Schema(description = "Indique si l'adresse figure dans l'annuaire public", example = "true")
    private Boolean listed;

    @Schema(description = "Indique si le nom du propriétaire est affiché publiquement", example = "false")
    private Boolean showOwnerName;

    // Champs immuables : s'ils sont fournis dans la requête PATCH, l'opération est rejetée en 400 Bad Request
    @Schema(hidden = true)
    private String code;

    @Schema(hidden = true)
    private Double latitude;

    @Schema(hidden = true)
    private Double longitude;

    @Schema(hidden = true)
    private String zone;

    @Schema(hidden = true)
    private String quartier;
}

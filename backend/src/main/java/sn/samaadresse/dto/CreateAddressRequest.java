package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Schema(description = "Requête de création d'adresse géolocalisée")
public class CreateAddressRequest {

    @NotNull(message = "La latitude est obligatoire")
    @Min(value = -90, message = "La latitude minimale est -90")
    @Max(value = 90, message = "La latitude maximale est 90")
    @Schema(description = "Latitude GPS (ex: 12.5738 pour Boucotte Ziguinchor)", example = "12.5738")
    private Double latitude;

    @NotNull(message = "La longitude est obligatoire")
    @Min(value = -180, message = "La longitude minimale est -180")
    @Max(value = 180, message = "La longitude maximale est 180")
    @Schema(description = "Longitude GPS (ex: -16.2650 pour Boucotte Ziguinchor)", example = "-16.2650")
    private Double longitude;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 500, message = "La description ne peut dépasser 500 caractères")
    @Schema(description = "Repère visuel ou description humaine de la concession", example = "Maison familiale au toit rouge, 3e concession à gauche après la Grande Mosquée")
    private String description;

    @NotNull(message = "Le type de lieu est obligatoire")
    @Schema(description = "Type de lieu", example = "MAISON")
    private LocationType locationType;
}

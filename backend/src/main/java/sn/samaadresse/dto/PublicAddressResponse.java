package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.LocationType;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Représentation publique minimale d'une adresse géolocalisée")
public class PublicAddressResponse {

    @Schema(description = "Code court d'adresse géolocalisée", example = "ZIG-KBG-4271")
    private String code;

    @Schema(description = "Latitude GPS", example = "12.5738")
    private Double latitude;

    @Schema(description = "Longitude GPS", example = "-16.2650")
    private Double longitude;

    @Schema(description = "Code de la zone géographique", example = "ZIG")
    private String zone;

    @Schema(description = "Code du quartier résolu", example = "KBG")
    private String quartier;

    @Schema(description = "Description / repère visuel", example = "Maison familiale au toit rouge, 3e concession après la mosquée")
    private String description;

    @Schema(description = "Type de lieu", example = "MAISON")
    private LocationType locationType;

    @Schema(description = "URL de la photo de façade de l'adresse", example = "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg")
    private String photoUrl;

    @Schema(description = "Date de création")
    private Instant createdAt;
}

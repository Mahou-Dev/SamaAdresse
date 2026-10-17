package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Représentation complète d'une adresse géolocalisée")
public class AddressResponse {

    @Schema(description = "ID unique de l'adresse")
    private UUID id;

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

    @Schema(description = "URL de la photo (si présente)", example = "null")
    private String photoUrl;

    @Schema(description = "Type de lieu", example = "MAISON")
    private LocationType locationType;

    @Schema(description = "Statut de modération", example = "ACTIVE")
    private AddressStatus status;

    @Schema(description = "Indique si l'adresse figure dans l'annuaire public", example = "true")
    private Boolean listed;

    @Schema(description = "Indique si le nom du propriétaire est affiché publiquement", example = "false")
    private Boolean showOwnerName;

    @Schema(description = "Mention de modération affichée au propriétaire si l'adresse est suspendue", example = "Suspendue par la modération")
    private String moderationNotice;

    @Schema(description = "Date de création")
    private Instant createdAt;

    @Schema(description = "Propriétaire de l'adresse")
    private UserProfileResponse owner;
}

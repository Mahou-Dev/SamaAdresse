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
@Schema(description = "Entrée publique de l'annuaire SamaAdresse")
public class DirectoryItemResponse {

    @Schema(description = "Code court de la plaque", example = "ZIG-KBG-4271")
    private String code;

    @Schema(description = "Code de zone géographique", example = "ZIG")
    private String zone;

    @Schema(description = "Code ou nom de quartier", example = "KBG")
    private String quartier;

    @Schema(description = "Type de lieu", example = "COMMERCE")
    private LocationType locationType;

    @Schema(description = "Description résumée (max 120 caractères)", example = "Boutique d'alimentation générale face à la pharmacie")
    private String description;

    @Schema(description = "URL de la photo de façade", example = "/uploads/façade.jpg")
    private String photoUrl;

    @Schema(description = "Date d'enregistrement")
    private Instant createdAt;

    @Schema(description = "Nom du propriétaire (uniquement si explicitement autorisé par ce dernier)", example = "Mamadou Diallo")
    private String ownerName;
}

package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.ReservedCodeStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Réponse représentant un code d'adresse réservé pour création hors ligne")
public class ReservedCodeResponse {

    @Schema(description = "Identifiant unique de la réservation")
    private UUID id;

    @Schema(description = "Code réservé au format ZONE-QUARTIER-XXXX", example = "ZIG-KBG-1234")
    private String code;

    @Schema(description = "Zone géographique", example = "ZIG")
    private String zone;

    @Schema(description = "Quartier géographique", example = "KBG")
    private String quartier;

    @Schema(description = "Statut de la réservation", example = "RESERVED")
    private ReservedCodeStatus status;

    @Schema(description = "Date et heure de création de la réservation")
    private Instant createdAt;

    @Schema(description = "Date et heure d'expiration (30 jours)")
    private Instant expiresAt;
}

package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Demande d'envoi par SMS du lien de la fiche adresse")
public class ShareSmsRequest {

    /** Mobiles sénégalais uniquement (70, 75, 76, 77, 78). Le 33 (fixe) ne reçoit pas de SMS. */
    public static final String SENEGAL_MOBILE_REGEX = "^\\+221(70|75|76|77|78)[0-9]{7}$";

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(
            regexp = SENEGAL_MOBILE_REGEX,
            message = "Le numéro doit être un mobile sénégalais (ex: +221771234567)"
    )
    @Schema(description = "Numéro mobile sénégalais au format E.164", example = "+221771234503")
    private String phoneNumber;
}

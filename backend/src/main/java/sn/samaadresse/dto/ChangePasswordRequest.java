package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Requête de changement de mot de passe de l'utilisateur connecté")
public class ChangePasswordRequest {

    @NotBlank(message = "Le mot de passe actuel est obligatoire")
    @Schema(description = "Mot de passe actuel de l'utilisateur")
    private String currentPassword;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[A-Z]).{8,}$",
        message = "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre"
    )
    @Schema(description = "Nouveau mot de passe (min 8 car., 1 majuscule, 1 chiffre)")
    private String newPassword;
}

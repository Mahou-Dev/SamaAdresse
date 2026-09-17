package sn.samaadresse.dto;

import jakarta.validation.constraints.Email;
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
public class RegisterRequest {

    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Le format de l'adresse email est invalide")
    private String email;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(
        regexp = "^\\+221(70|75|76|77|78|33)[0-9]{7}$",
        message = "Le numéro de téléphone doit suivre le format sénégalais (ex: +221770000000)"
    )
    private String phoneNumber;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[A-Z]).{8,}$",
        message = "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre"
    )
    private String password;
}

package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.ShareSmsRequest;
import sn.samaadresse.dto.ShareSmsResponse;
import sn.samaadresse.service.AddressShareService;

/**
 * Partage d'adresse. Contrôleur séparé d'AddressController pour isoler ses dépendances.
 */
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Tag(name = "Partage d'adresse", description = "Envoi du lien de la fiche adresse par SMS")
public class AddressShareController {

    private final AddressShareService addressShareService;

    @PostMapping(value = "/{code}/share/sms", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Envoyer le lien d'une adresse par SMS",
            description = """
                    Envoie au destinataire un SMS (GSM-7, < 160 caractères, sans donnée personnelle) :
                    `SamaAdresse : adresse ZIG-KBG-4271. Voir la fiche et l'itinéraire : {FRONTEND_BASE_URL}/a/ZIG-KBG-4271`.

                    Réservé aux utilisateurs connectés (chaque SMS est payant). Limites anti-fraude :
                    5 SMS / heure / utilisateur, 3 SMS / 24 h / numéro destinataire, plafond global quotidien (SMS_DAILY_CAP).
                    Le numéro destinataire n'est jamais enregistré."""
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "SMS accepté par le fournisseur",
                    content = @Content(schema = @Schema(implementation = ShareSmsResponse.class),
                            examples = @ExampleObject(value = "{\"status\":\"SENT\",\"maskedPhone\":\"+221 77 *** ** 03\"}"))),
            @ApiResponse(responseCode = "400", description = "Numéro absent, mal formé ou non sénégalais",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\":\"2026-10-14T18:00:00Z\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Erreur de validation des champs\",\"path\":\"/api/addresses/ZIG-KBG-4271/share/sms\",\"fieldErrors\":{\"phoneNumber\":\"Le numéro doit être un mobile sénégalais (ex: +221771234567)\"}}"))),
            @ApiResponse(responseCode = "401", description = "Non authentifié",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\":\"2026-10-14T18:00:00Z\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentification requise\",\"path\":\"/api/addresses/ZIG-KBG-4271/share/sms\"}"))),
            @ApiResponse(responseCode = "404", description = "Adresse inexistante ou non active",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\":\"2026-10-14T18:00:00Z\",\"status\":404,\"error\":\"Not Found\",\"message\":\"Adresse non trouvée ou inactive : ZIG-KBG-0000\",\"path\":\"/api/addresses/ZIG-KBG-0000/share/sms\"}"))),
            @ApiResponse(responseCode = "429", description = "Limite d'envoi atteinte (utilisateur, destinataire ou plafond global)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\":\"2026-10-14T18:00:00Z\",\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Limite atteinte : vous pouvez envoyer 5 SMS par heure. Réessayez plus tard ou partagez via WhatsApp.\",\"path\":\"/api/addresses/ZIG-KBG-4271/share/sms\"}"))),
            @ApiResponse(responseCode = "502", description = "Fournisseur SMS en échec ou sans réponse sous 5 s",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class),
                            examples = @ExampleObject(value = "{\"timestamp\":\"2026-10-14T18:00:00Z\",\"status\":502,\"error\":\"Bad Gateway\",\"message\":\"Le service SMS est momentanément indisponible. Veuillez réessayer plus tard.\",\"path\":\"/api/addresses/ZIG-KBG-4271/share/sms\"}")))
    })
    public ResponseEntity<ShareSmsResponse> shareBySms(
            @Parameter(description = "Code d'adresse", example = "ZIG-KBG-4271") @PathVariable String code,
            @Valid @RequestBody ShareSmsRequest request,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        if (email == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                email = auth.getName();
            }
        }
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Authentification requise");
        }
        ShareSmsResponse response = addressShareService.shareBySms(code, request.getPhoneNumber(), email);
        return ResponseEntity.ok(response);
    }
}

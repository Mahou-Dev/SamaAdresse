package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.security.ReportRateLimiter;

import java.util.Map;

/**
 * Endpoint de réinitialisation des limiteurs de débit, strictement restreint aux profils dev et e2e.
 */
@Profile({"dev", "e2e"})
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Tag(name = "Administration & Modération", description = "Endpoints réservés aux administrateurs (ROLE_ADMIN)")
public class AdminDevController {

    private final RateLimiterService rateLimiterService;
    private final ReportRateLimiter reportRateLimiter;

    @PostMapping({"/reset-rate-limits", "/system/reset-rate-limits"})
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Réinitialiser les limiteurs de débit", description = "Vide le cache des limiteurs de débit en mémoire (profils dev et e2e uniquement).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Limiteurs de débit réinitialisés"),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, String>> resetRateLimits() {
        rateLimiterService.reset();
        reportRateLimiter.reset();
        return ResponseEntity.ok(Map.of("message", "Limiteurs de débit réinitialisés."));
    }
}

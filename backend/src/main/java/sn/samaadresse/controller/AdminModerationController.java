package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.domain.enums.ReportStatus;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.AdminReportResponse;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.SuspendAddressRequest;
import sn.samaadresse.dto.UpdateReportStatusRequest;
import sn.samaadresse.service.ModerationService;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Tag(name = "Administration & Modération", description = "Endpoints réservés aux administrateurs (ROLE_ADMIN)")
public class AdminModerationController {

    private final ModerationService moderationService;
    private final sn.samaadresse.security.RateLimiterService rateLimiterService;
    private final sn.samaadresse.security.ReportRateLimiter reportRateLimiter;

    @PostMapping("/reset-rate-limits")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Réinitialiser les limiteurs de débit", description = "Vide le cache des limiteurs de débit en mémoire.")
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

    @GetMapping("/reports")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lister les signalements d'adresses (paginé)", description = "Filtrable par statut OPEN, RESOLVED ou DISMISSED.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page de signalements retournée"),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Page<AdminReportResponse>> getReports(
            @Parameter(description = "Statut du signalement (OPEN, RESOLVED, DISMISSED)") @RequestParam(required = false) ReportStatus status,
            @Parameter(description = "Index de page (base 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminReportResponse> reports = moderationService.getReports(status, page, size);
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/addresses/{id}/suspend")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Suspendre une adresse (motif obligatoire)", description = "Passe l'adresse en SUSPENDED (410 Gone en public) et écrit une entrée dans admin_actions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Adresse suspendue", content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Motif manquant ou invalide", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse introuvable", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> suspendAddress(
            @Parameter(description = "Identifiant UUID de l'adresse") @PathVariable UUID id,
            @Valid @RequestBody SuspendAddressRequest request,
            Principal principal
    ) {
        String adminEmail = currentEmail(principal);
        AddressResponse suspended = moderationService.suspendAddress(id, request, adminEmail);
        return ResponseEntity.ok(suspended);
    }

    @PostMapping("/addresses/{id}/reinstate")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Réactiver une adresse suspendue", description = "Repasse l'adresse en ACTIVE et écrit une entrée dans admin_actions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Adresse réactivée", content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Opération invalide sur le statut actuel", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse introuvable", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> reinstateAddress(
            @Parameter(description = "Identifiant UUID de l'adresse") @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal
    ) {
        String adminEmail = currentEmail(principal);
        String reason = body != null ? body.get("reason") : null;
        AddressResponse reinstated = moderationService.reinstateAddress(id, reason, adminEmail);
        return ResponseEntity.ok(reinstated);
    }

    @PatchMapping("/reports/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mettre à jour le statut d'un signalement (RESOLVED ou DISMISSED)", description = "Met à jour le signalement et écrit une entrée dans admin_actions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Signalement mis à jour", content = @Content(schema = @Schema(implementation = AdminReportResponse.class))),
            @ApiResponse(responseCode = "400", description = "Statut invalide", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Signalement introuvable", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AdminReportResponse> updateReportStatus(
            @Parameter(description = "Identifiant UUID du signalement") @PathVariable UUID id,
            @Valid @RequestBody UpdateReportStatusRequest request,
            Principal principal
    ) {
        String adminEmail = currentEmail(principal);
        AdminReportResponse updated = moderationService.updateReportStatus(id, request, adminEmail);
        return ResponseEntity.ok(updated);
    }

    private String currentEmail(Principal principal) {
        if (principal != null) {
            return principal.getName();
        }
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

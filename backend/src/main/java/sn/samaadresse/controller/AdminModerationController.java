package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
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

    @GetMapping("/reports")
    @Operation(summary = "Lister les signalements d'adresses (paginé)", description = "Filtrable par statut OPEN, RESOLVED ou DISMISSED.")
    public ResponseEntity<Page<AdminReportResponse>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminReportResponse> reports = moderationService.getReports(status, page, size);
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/addresses/{id}/suspend")
    @Operation(summary = "Suspendre une adresse (motif obligatoire)", description = "Passe l'adresse en SUSPENDED (410 Gone en public) et écrit une entrée dans admin_actions.")
    public ResponseEntity<AddressResponse> suspendAddress(
            @PathVariable UUID id,
            @Valid @RequestBody SuspendAddressRequest request,
            Principal principal
    ) {
        String adminEmail = currentEmail(principal);
        AddressResponse suspended = moderationService.suspendAddress(id, request, adminEmail);
        return ResponseEntity.ok(suspended);
    }

    @PostMapping("/addresses/{id}/reinstate")
    @Operation(summary = "Réactiver une adresse suspendue", description = "Repasse l'adresse en ACTIVE et écrit une entrée dans admin_actions.")
    public ResponseEntity<AddressResponse> reinstateAddress(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal
    ) {
        String adminEmail = currentEmail(principal);
        String reason = body != null ? body.get("reason") : null;
        AddressResponse reinstated = moderationService.reinstateAddress(id, reason, adminEmail);
        return ResponseEntity.ok(reinstated);
    }

    @PatchMapping("/reports/{id}")
    @Operation(summary = "Mettre à jour le statut d'un signalement (RESOLVED ou DISMISSED)", description = "Met à jour le signalement et écrit une entrée dans admin_actions.")
    public ResponseEntity<AdminReportResponse> updateReportStatus(
            @PathVariable UUID id,
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

package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.dto.CreateReportRequest;
import sn.samaadresse.dto.ReportCreatedResponse;
import sn.samaadresse.service.ModerationService;

@RestController
@RequestMapping("/api/public/addresses")
@RequiredArgsConstructor
@Tag(name = "Signalements Publics", description = "Signalement anonyme de problèmes sur une adresse publique")
public class PublicReportController {

    private final ModerationService moderationService;

    @PostMapping("/{code}/reports")
    @Operation(summary = "Signaler un problème sur une adresse publique (anonyme)", description = "Limité à 3 signalements/heure/IP et 1 signalement par adresse par IP par 24 h (clé = hash SHA-256 en mémoire). Renvoie 202 Accepted.")
    public ResponseEntity<ReportCreatedResponse> reportAddress(
            @PathVariable String code,
            @Valid @RequestBody CreateReportRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        ReportCreatedResponse response = moderationService.createPublicReport(code, request, clientIp);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "0.0.0.0";
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "0.0.0.0";
    }
}

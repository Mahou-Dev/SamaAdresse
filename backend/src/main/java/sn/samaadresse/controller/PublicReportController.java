package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.dto.CreateReportRequest;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.ReportCreatedResponse;
import sn.samaadresse.service.ModerationService;

@RestController
@RequestMapping("/api/public/addresses")
@RequiredArgsConstructor
@Tag(name = "Signalements Publics", description = "Signalement anonyme de problèmes sur une adresse publique")
public class PublicReportController {

    private final ModerationService moderationService;

    @PostMapping("/{code}/reports")
    @Operation(
            summary = "Signaler un problème sur une adresse publique (anonyme)",
            description = "Limité à 3 signalements/heure/IP et 1 signalement par adresse par IP par 24 h (clé = hash SHA-256 en mémoire). Renvoie 202 Accepted."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Signalement enregistré pour modération",
                    content = @Content(schema = @Schema(implementation = ReportCreatedResponse.class),
                            examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-abcd-ef1234567890\",\"status\":\"OPEN\",\"message\":\"Signalement pris en compte.\"}"))),
            @ApiResponse(responseCode = "400", description = "Motif invalide ou commentaire trop long",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse introuvable ou inactive",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de signalements atteinte (doublon 24h ou > 3/h/IP)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ReportCreatedResponse> reportAddress(
            @Parameter(description = "Code court de l'adresse signalée", example = "ZIG-KBG-4271")
            @PathVariable String code,
            @Valid @RequestBody CreateReportRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        ReportCreatedResponse response = moderationService.createPublicReport(code, request, clientIp);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        return sn.samaadresse.security.ClientIpResolver.resolve(request);
    }
}

package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.dto.DirectoryItemResponse;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.AddressService;

@RestController
@RequestMapping("/api/public/directory")
@RequiredArgsConstructor
@Tag(name = "Annuaire Public", description = "Consultation et recherche publique des adresses et établissements répertoriés")
public class DirectoryController {

    private final AddressService addressService;
    private final RateLimiterService rateLimiterService;

    @GetMapping
    @Operation(
        summary = "Consulter et rechercher dans l'annuaire public",
        description = "Recherche par texte libre (description, quartier, nom si autorisé) ou par code, avec filtrage par quartier et type de lieu. Limité à 30 requêtes par minute par IP."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Page de résultats de l'annuaire"),
        @ApiResponse(responseCode = "400", description = "Terme de recherche invalide (< 2 caractères sans filtre)",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "429", description = "Limite de débit dépassée (30 req/min/IP)",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Page<DirectoryItemResponse>> searchDirectory(
            @Parameter(description = "Terme de recherche (code ou mots-clés, min 2 caractères sauf si un filtre est actif)")
            @RequestParam(required = false) String q,
            @Parameter(description = "Code ou nom de quartier (ex: KBG, BOUCOTTE)")
            @RequestParam(required = false) String quartier,
            @Parameter(description = "Type de lieu (MAISON, COMMERCE, INSTITUTION)")
            @RequestParam(required = false) LocationType type,
            @Parameter(description = "Index de page (base 0, défaut 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page (défaut 12, max 50)")
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        rateLimiterService.checkRateLimit("directory_search", clientIp, 30);

        Page<DirectoryItemResponse> results = addressService.searchDirectory(q, quartier, type, page, size);
        return ResponseEntity.ok(results);
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

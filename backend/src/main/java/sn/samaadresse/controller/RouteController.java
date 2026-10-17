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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.RouteResponse;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.RouteService;

@RestController
@RequestMapping("/api/public/route")
@RequiredArgsConstructor
@Tag(name = "Itinéraire Public", description = "Calcul d'itinéraire GPS vers une adresse via OpenRouteService (proxy sécurisé)")
public class RouteController {

    private final RouteService routeService;
    private final RateLimiterService rateLimiterService;

    @GetMapping
    @Operation(
        summary = "Calculer un itinéraire vers une adresse géolocalisée",
        description = "Proxy vers OpenRouteService. Destination résolue depuis le code. Coordonnées de départ strictement au Sénégal. Limité à 20 requêtes par minute par IP. Aucune coordonnée journalisée."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Itinéraire calculé avec succès",
                content = @Content(schema = @Schema(implementation = RouteResponse.class))),
        @ApiResponse(responseCode = "400", description = "Coordonnées de départ invalides ou hors Sénégal",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "404", description = "Adresse de destination introuvable ou inactive",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "422", description = "Aucun itinéraire routier trouvé pour cette destination",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "429", description = "Limite de débit dépassée (20 req/min/IP)",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "503", description = "Service d'itinéraire temporairement indisponible",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RouteResponse> getRoute(
            @Parameter(description = "Latitude GPS du point de départ (au Sénégal)", required = true, example = "12.5638")
            @RequestParam Double fromLat,
            @Parameter(description = "Longitude GPS du point de départ (au Sénégal)", required = true, example = "-16.2735")
            @RequestParam Double fromLon,
            @Parameter(description = "Code court de l'adresse de destination", required = true, example = "ZIG-KBG-4271")
            @RequestParam String code,
            @Parameter(description = "Profil de déplacement (driving-car ou foot-walking, défaut driving-car)", example = "driving-car")
            @RequestParam(defaultValue = "driving-car") String profile,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        rateLimiterService.checkRateLimit("route_calculation", clientIp, 20);

        RouteResponse response = routeService.calculateRoute(fromLat, fromLon, code, profile);
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        return sn.samaadresse.security.ClientIpResolver.resolve(request);
    }
}

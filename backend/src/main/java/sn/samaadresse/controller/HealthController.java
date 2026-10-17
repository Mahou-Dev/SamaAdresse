package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Santé", description = "Contrôle de disponibilité léger (sans accès à la base de données)")
public class HealthController {

    @GetMapping("/health")
    @Operation(
            summary = "Vérifier la disponibilité du service",
            description = "Renvoie {\"status\":\"UP\"} immédiatement sans interroger PostgreSQL, afin que le contrôle de santé de Render ne réveille pas l'instance Neon au repos."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Service opérationnel",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"status\":\"UP\"}"))
            )
    })
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}

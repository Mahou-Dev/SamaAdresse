package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Santé", description = "Contrôle de disponibilité léger (liveness) et vérification base de données (readiness)")
public class HealthController {

    private final DataSource dataSource;

    @Autowired
    public HealthController(@Autowired(required = false) DataSource dataSource) {
        this.dataSource = dataSource;
    }

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

    @GetMapping("/health/ready")
    @Operation(
            summary = "Vérifier la disponibilité complète du service et de PostgreSQL (readiness)",
            description = "Exécute une requête légère SELECT 1 sur la base de données pour confirmer la connectivité PostgreSQL."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Service et base de données opérationnels",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"status\":\"UP\",\"database\":\"UP\"}"))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "Base de données indisponible",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"status\":\"DOWN\",\"database\":\"DOWN\"}"))
            )
    })
    public ResponseEntity<Map<String, String>> readinessCheck() {
        if (dataSource == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("status", "DOWN", "database", "UNCONFIGURED"));
        }
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            return ResponseEntity.ok(Map.of("status", "UP", "database", "UP"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("status", "DOWN", "database", "DOWN"));
        }
    }
}

package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.ReservedCodeResponse;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.service.ReservedCodeService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/address-codes/reservations")
@RequiredArgsConstructor
@Tag(name = "Réservations de codes d'adresse", description = "Endpoints de pré-réservation de codes pour la capture hors ligne")
public class ReservedCodeController {

    private final ReservedCodeService reservedCodeService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Compléter le stock de codes réservés pour une zone",
            description = "Complète à 3 codes actifs par quartier pour la zone demandée (ZIG ou DKR), dans la limite de 40 réservations actives par utilisateur. Limité à 5 appels par heure.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock de réservations actives mis à jour",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReservedCodeResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Paramètre zone invalide",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de débit horaire atteinte (5 appels/h)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ReservedCodeResponse>> topUpReservations(
            @Parameter(description = "Code de zone (ZIG ou DKR)", required = true, example = "ZIG")
            @RequestParam("zone") String zone,
            Principal principal
    ) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable"));
        List<ReservedCodeResponse> reservations = reservedCodeService.topUpReservations(user, zone);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtenir les réservations actives de l'utilisateur",
            description = "Renvoie la liste de tous les codes réservés actifs et non expirés de l'utilisateur connecté.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des réservations actives",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReservedCodeResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Non authentifié",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ReservedCodeResponse>> getActiveReservations(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable"));
        List<ReservedCodeResponse> reservations = reservedCodeService.getActiveReservations(user);
        return ResponseEntity.ok(reservations);
    }
}

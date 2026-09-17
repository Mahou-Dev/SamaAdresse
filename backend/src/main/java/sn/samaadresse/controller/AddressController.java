package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.CreateAddressRequest;
import sn.samaadresse.dto.ErrorResponse;
import sn.samaadresse.dto.PublicAddressResponse;
import sn.samaadresse.service.AddressService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Tag(name = "Adresses Géolocalisées", description = "Endpoints de création, résolution publique et consultation d'adresses géolocalisées")
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer une nouvelle adresse géolocalisée", description = "Résout automatiquement la zone et le quartier à partir des coordonnées GPS, puis génère un code court immuable (ex: ZIG-KBG-4271).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Adresse créée avec succès",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Coordonnées invalides ou données de formulaire incorrectes",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "422", description = "Coordonnées hors zone couverte par la grille géographique",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> createAddress(
            @Valid @RequestBody CreateAddressRequest request,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse created = addressService.createAddressByEmail(request, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{code}")
    @Operation(summary = "Résoudre une adresse publique par son code court", description = "Endpoint public sans authentification. Renvoie la fiche adresse si elle existe et est active.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Adresse trouvée",
                    content = @Content(schema = @Schema(implementation = PublicAddressResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse non trouvée ou inactive",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PublicAddressResponse> getPublicAddressByCode(@PathVariable String code) {
        PublicAddressResponse address = addressService.getPublicAddressByCode(code.toUpperCase());
        return ResponseEntity.ok(address);
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lister les adresses du propriétaire connecté", description = "Renvoie toutes les adresses créées par l'utilisateur connecté.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste d'adresses de l'utilisateur",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<AddressResponse>> getMyAddresses(Principal principal) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        List<AddressResponse> addresses = addressService.getUserAddressesByEmail(currentUserEmail);
        return ResponseEntity.ok(addresses);
    }
}

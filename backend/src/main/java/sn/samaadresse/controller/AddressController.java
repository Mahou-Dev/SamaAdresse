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
    private final sn.samaadresse.service.QrCodeService qrCodeService;
    private final sn.samaadresse.security.RateLimiterService rateLimiterService;

    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer une nouvelle adresse géolocalisée (JSON)", description = "Résout automatiquement la zone et le quartier à partir des coordonnées GPS, puis génère un code court immuable (ex: ZIG-KBG-4271).")
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

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer une nouvelle adresse avec photo optionnelle (Multipart)", description = "Permet de créer l'adresse et d'uploader sa photo de façade en une seule requête multipart.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Adresse créée avec succès",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données ou image invalide",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "422", description = "Coordonnées hors zone couverte",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> createAddressMultipart(
            @Valid @ModelAttribute CreateAddressRequest request,
            @RequestParam(value = "photo", required = false) org.springframework.web.multipart.MultipartFile photo,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse created = addressService.createAddressWithPhoto(request, photo, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/{id}/photo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Uploader une photo de façade pour une adresse existante", description = "Associe une photo de façade à une adresse existante (owner ou ADMIN). Validations : JPEG/PNG/WebP, max 5 Mo.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Photo uploadée et adresse mise à jour",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Fichier invalide ou non image (magic bytes) ou taille > 5 Mo",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé - vous n'êtes pas le propriétaire de cette adresse",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse non trouvée",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> uploadAddressPhoto(
            @PathVariable java.util.UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse updated = addressService.uploadAddressPhoto(id, file, currentUserEmail);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{code}")
    @Operation(summary = "Résoudre une adresse publique par son code court", description = "Endpoint public sans authentification. Renvoie la fiche adresse si elle existe et est active.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Adresse trouvée",
                    content = @Content(schema = @Schema(implementation = PublicAddressResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse non trouvée ou inactive",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requêtes dépassée (60 req/min/IP)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PublicAddressResponse> getPublicAddressByCode(
            @PathVariable String code,
            jakarta.servlet.http.HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        rateLimiterService.checkRateLimit("public_address", clientIp, 60);
        PublicAddressResponse address = addressService.getPublicAddressByCode(code.toUpperCase());
        return ResponseEntity.ok(address);
    }

    @GetMapping("/{code}/qrcode")
    @Operation(summary = "Générer le QR code d'une adresse publique", description = "Génère à la volée une image PNG du QR Code (300x300 px) encodant l'URL publique complète de la fiche adresse.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image PNG du QR code générée",
                    content = @Content(mediaType = "image/png")),
            @ApiResponse(responseCode = "404", description = "Adresse non trouvée ou inactive",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<byte[]> getAddressQrCode(@PathVariable String code) {
        String cleanCode = code.toUpperCase();
        byte[] qrBytes = qrCodeService.generateAddressQrCode(cleanCode);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.IMAGE_PNG);
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition.inline()
                        .filename("samaadresse-" + cleanCode + ".png")
                        .build()
        );
        headers.setCacheControl(org.springframework.http.CacheControl.maxAge(java.time.Duration.ofDays(1)).cachePublic());

        return new ResponseEntity<>(qrBytes, headers, HttpStatus.OK);
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

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mettre à jour la description ou le type d'une adresse (propriétaire uniquement)", description = "Le code et la position sont immuables (400 si fournis ou si l'adresse est archivée/suspendue).")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody sn.samaadresse.dto.UpdateAddressRequest request,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse updated = addressService.updateAddress(id, request, currentUserEmail);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Modifier la visibilité d'une adresse dans l'annuaire (propriétaire uniquement)", description = "Réservé au propriétaire de l'adresse (403 sinon). Met à jour les options de publication dans l'annuaire.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Visibilité mise à jour avec succès",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé - vous n'êtes pas le propriétaire",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Adresse non trouvée",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> updateVisibility(
            @PathVariable java.util.UUID id,
            @RequestBody sn.samaadresse.dto.UpdateVisibilityRequest request,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse updated = addressService.updateVisibility(id, request, currentUserEmail);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer la photo de façade d'une adresse (propriétaire uniquement)", description = "Retire la photo de l'adresse et supprime le fichier du disque.")
    public ResponseEntity<AddressResponse> deleteAddressPhoto(
            @PathVariable java.util.UUID id,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse updated = addressService.deleteAddressPhoto(id, currentUserEmail);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Archiver une adresse (propriétaire uniquement)", description = "Passe le statut de l'adresse à ARCHIVED. La fiche publique et le QR code renvoient alors 410 Gone.")
    public ResponseEntity<AddressResponse> archiveAddress(
            @PathVariable java.util.UUID id,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse archived = addressService.archiveAddress(id, currentUserEmail);
        return ResponseEntity.ok(archived);
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Restaurer une adresse archivée (propriétaire uniquement)", description = "Réactive une adresse ARCHIVED vers ACTIVE. Interdit (400) si l'adresse est SUSPENDED.")
    public ResponseEntity<AddressResponse> restoreAddress(
            @PathVariable java.util.UUID id,
            Principal principal
    ) {
        String currentUserEmail = principal != null ? principal.getName() : SecurityContextHolder.getContext().getAuthentication().getName();
        AddressResponse restored = addressService.restoreAddress(id, currentUserEmail);
        return ResponseEntity.ok(restored);
    }

    private String extractClientIp(jakarta.servlet.http.HttpServletRequest request) {
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

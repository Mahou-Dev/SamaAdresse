package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import sn.samaadresse.dto.*;
import sn.samaadresse.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, connexion, rafraîchissement JWT et profil")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Inscription d'un nouvel utilisateur (Rôle PROPRIETAIRE par défaut)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Compte créé avec succès", content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "Adresse email déjà utilisée", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<UserProfileResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserProfileResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Connexion utilisateur", description = "Retourne l'Access Token dans le corps et pose un Refresh Token en Cookie HTTP-Only. Limité à 5 essais/min.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Connexion réussie", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "401", description = "Identifiants invalides", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "429", description = "Trop de tentatives (Rate Limit)", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String clientIp = extractClientIp(httpRequest);
        AuthResponse response = authService.login(request, clientIp, httpResponse);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Rafraîchissement silencieux de l'Access Token via Cookie Refresh Token")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Nouveau token généré avec succès", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "401", description = "Refresh Token absent ou expiré", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
        @CookieValue(name = "refreshToken", required = false) String refreshToken,
        HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.refreshToken(refreshToken, response);
        return ResponseEntity.ok(authResponse);
    }

    @Operation(summary = "Déconnexion utilisateur", description = "Révoque le Refresh Token et efface le cookie")
    @ApiResponse(responseCode = "200", description = "Déconnexion effectuée")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
        @CookieValue(name = "refreshToken", required = false) String refreshToken,
        HttpServletResponse response
    ) {
        authService.logout(refreshToken, response);
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }

    @Operation(summary = "Profil de l'utilisateur connecté", description = "Route protégée nécessitant le header Authorization Bearer")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profil récupéré", content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
        @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserProfileResponse profile = authService.getProfileByEmail(email);
        return ResponseEntity.ok(profile);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

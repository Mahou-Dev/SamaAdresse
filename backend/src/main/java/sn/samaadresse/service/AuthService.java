package sn.samaadresse.service;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.RefreshToken;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.*;
import sn.samaadresse.exception.*;
import sn.samaadresse.repository.RefreshTokenRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.HashUtils;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RateLimiterService rateLimiterService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.security.login-rate-limit:5}")
    private int loginRateLimit = 5;

    private static final int MAX_GRACE_CACHE_ENTRIES = 2_000;
    private static final int REGISTER_RATE_LIMIT_PER_MIN = 10;
    private final Map<String, CachedRefreshResponse> rotationGracePeriodCache = new java.util.concurrent.ConcurrentHashMap<>();

    private record CachedRefreshResponse(String accessToken, String newRawRefreshToken, User user, Instant expiry) {}

    public void setLoginRateLimit(int loginRateLimit) {
        this.loginRateLimit = loginRateLimit;
    }

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        return register(request, null);
    }

    @Transactional
    public UserProfileResponse register(RegisterRequest request, String ipAddress) {
        if (StringUtils.hasText(ipAddress)) {
            rateLimiterService.checkRateLimit("register", ipAddress, REGISTER_RATE_LIMIT_PER_MIN);
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Cette adresse email est déjà associée à un compte.");
        }

        User user = User.builder()
            .fullName(request.getFullName().trim())
            .email(normalizedEmail)
            .phoneNumber(request.getPhoneNumber().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(Role.PROPRIETAIRE)
            .enabled(true)
            .build();

        User savedUser = userRepository.save(user);
        return mapToProfileResponse(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, HttpServletResponse response) {
        rateLimiterService.checkRateLimit("login", ipAddress, loginRateLimit);

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new InvalidCredentialsException("Adresse email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Adresse email ou mot de passe incorrect");
        }

        if (!user.isEnabled()) {
            throw new UserDisabledException("Votre compte est désactivé. Veuillez contacter un administrateur.");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String rawRefreshToken = generateRawRefreshToken();
        String tokenHash = HashUtils.hashSha256(rawRefreshToken);

        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
            .tokenHash(tokenHash)
            .user(user)
            .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
            .revoked(false)
            .build();

        refreshTokenRepository.save(refreshTokenEntity);

        setRefreshTokenCookie(response, rawRefreshToken, 7 * 24 * 60 * 60);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .tokenType("Bearer")
            .expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
            .user(mapToProfileResponse(user))
            .build();
    }

    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken, HttpServletResponse response) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            throw new TokenRefreshException("Refresh token absent");
        }

        String tokenHash = HashUtils.hashSha256(rawRefreshToken);

        // Période de grâce de 30 secondes pour les requêtes concurrentes / rechargement rapide de page
        CachedRefreshResponse cached = rotationGracePeriodCache.get(tokenHash);
        if (cached != null && cached.expiry().isAfter(Instant.now())) {
            setRefreshTokenCookie(response, cached.newRawRefreshToken(), 7 * 24 * 60 * 60);
            return AuthResponse.builder()
                .accessToken(cached.accessToken())
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
                .user(mapToProfileResponse(cached.user()))
                .build();
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> {
                clearRefreshTokenCookie(response);
                return new TokenRefreshException("Refresh token invalide");
            });

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            clearRefreshTokenCookie(response);
            throw new TokenRefreshException("Refresh token expiré ou révoqué");
        }

        User user = refreshToken.getUser();
        if (!user.isEnabled()) {
            refreshTokenRepository.delete(refreshToken);
            clearRefreshTokenCookie(response);
            throw new UserDisabledException("Compte désactivé");
        }

        refreshTokenRepository.delete(refreshToken);

        String newRawRefreshToken = generateRawRefreshToken();
        String newTokenHash = HashUtils.hashSha256(newRawRefreshToken);

        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
            .tokenHash(newTokenHash)
            .user(user)
            .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
            .revoked(false)
            .build();

        refreshTokenRepository.save(newRefreshTokenEntity);
        setRefreshTokenCookie(response, newRawRefreshToken, 7 * 24 * 60 * 60);

        String newAccessToken = jwtProvider.generateAccessToken(user);

        // Mettre en cache de grâce pour 30s et nettoyer les entrées expirées (cache borné)
        rotationGracePeriodCache.entrySet().removeIf(e -> e.getValue().expiry().isBefore(Instant.now()));
        if (rotationGracePeriodCache.size() >= MAX_GRACE_CACHE_ENTRIES) {
            rotationGracePeriodCache.clear();
        }
        rotationGracePeriodCache.put(tokenHash, new CachedRefreshResponse(
            newAccessToken, newRawRefreshToken, user, Instant.now().plusSeconds(30)
        ));

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .tokenType("Bearer")
            .expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
            .user(mapToProfileResponse(user))
            .build();
    }

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        logout(rawRefreshToken, null, response);
    }

    @Transactional
    public void logout(String rawRefreshToken, String authenticatedEmail, HttpServletResponse response) {
        if (StringUtils.hasText(rawRefreshToken)) {
            String tokenHash = HashUtils.hashSha256(rawRefreshToken);
            rotationGracePeriodCache.remove(tokenHash);
            refreshTokenRepository.deleteByTokenHash(tokenHash);
        }
        if (StringUtils.hasText(authenticatedEmail)) {
            userRepository.findByEmail(authenticatedEmail.trim().toLowerCase())
                .ifPresent(refreshTokenRepository::deleteByUser);
            rotationGracePeriodCache.entrySet().removeIf(
                e -> e.getValue().user().getEmail().equalsIgnoreCase(authenticatedEmail.trim())
            );
        }
        clearRefreshTokenCookie(response);
    }

    @Transactional
    public void changePassword(String authenticatedEmail, ChangePasswordRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(authenticatedEmail.trim().toLowerCase())
            .orElseThrow(() -> new InvalidCredentialsException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Le mot de passe actuel est incorrect.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new InvalidAddressOperationException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Révoque tous les refresh tokens existants après changement de mot de passe
        refreshTokenRepository.deleteByUser(user);
        rotationGracePeriodCache.entrySet().removeIf(
            e -> e.getValue().user().getId().equals(user.getId())
        );

        // Émet un nouveau couple cookie refresh pour la session en cours
        String newRawRefresh = generateRawRefreshToken();
        RefreshToken refreshEntity = RefreshToken.builder()
            .tokenHash(HashUtils.hashSha256(newRawRefresh))
            .user(user)
            .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
            .revoked(false)
            .build();
        refreshTokenRepository.save(refreshEntity);
        if (response != null) {
            setRefreshTokenCookie(response, newRawRefresh, 7 * 24 * 60 * 60);
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new InvalidCredentialsException("Utilisateur non trouvé"));
        return mapToProfileResponse(user);
    }

    private String generateRawRefreshToken() {
        return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String value, int maxAgeSeconds) {
        // Path=/api/auth garantit que le navigateur envoie le cookie à /api/auth/refresh ET /api/auth/logout
        String cookieHeader = String.format(
            "refreshToken=%s; Max-Age=%d; Path=/api/auth; HttpOnly; SameSite=Strict%s",
            value,
            maxAgeSeconds,
            cookieSecure ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", cookieHeader);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        setRefreshTokenCookie(response, "", 0);
        // Nettoie aussi un éventuel ancien cookie posé sur l'ancien chemin /api/auth/refresh
        String legacyClear = String.format(
            "refreshToken=; Max-Age=0; Path=/api/auth/refresh; HttpOnly; SameSite=Strict%s",
            cookieSecure ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", legacyClear);
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .createdAt(user.getCreatedAt())
            .build();
    }
}

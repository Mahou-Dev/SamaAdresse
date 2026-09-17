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

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("L'adresse email '" + request.getEmail() + "' est déjà utilisée");
        }

        User user = User.builder()
            .fullName(request.getFullName().trim())
            .email(request.getEmail().trim().toLowerCase())
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
        if (!rateLimiterService.tryConsume(ipAddress)) {
            throw new RateLimitExceededException("Trop de tentatives de connexion. Veuillez patienter 1 minute.");
        }

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

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .tokenType("Bearer")
            .expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
            .user(mapToProfileResponse(user))
            .build();
    }

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        if (StringUtils.hasText(rawRefreshToken)) {
            String tokenHash = HashUtils.hashSha256(rawRefreshToken);
            refreshTokenRepository.deleteByTokenHash(tokenHash);
        }
        clearRefreshTokenCookie(response);
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
        String cookieHeader = String.format(
            "refreshToken=%s; Max-Age=%d; Path=/api/auth/refresh; HttpOnly; SameSite=Strict%s",
            value,
            maxAgeSeconds,
            cookieSecure ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", cookieHeader);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        setRefreshTokenCookie(response, "", 0);
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

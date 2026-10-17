package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.samaadresse.config.DemoDataSeeder;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthAndSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private PasswordEncoder passwordEncoder;
    private JwtProvider jwtProvider;
    private RateLimiterService rateLimiterService;
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        jwtProvider = new JwtProvider("samaadresse-secret-key-must-be-at-least-256-bits-long-for-hmac-sha-signing!", 900000);
        rateLimiterService = new RateLimiterService();
        authService = new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtProvider, rateLimiterService);

        testUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .phoneNumber("+221771234567")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("1. JwtProvider génère, valide et extrait email, userId et role")
    void jwtProvider_generateAndValidate() {
        String token = jwtProvider.generateAccessToken(testUser);
        assertTrue(jwtProvider.validateToken(token));
        assertFalse(jwtProvider.validateToken("invalid.token.here"));
        assertEquals("mamadou@samaadresse.sn", jwtProvider.getEmailFromToken(token));
        assertEquals(testUser.getId(), jwtProvider.getUserIdFromToken(token));
        assertEquals("PROPRIETAIRE", jwtProvider.getRoleFromToken(token));
        assertEquals(900000L, jwtProvider.getAccessTokenExpirationMs());
    }

    @Test
    @DisplayName("2. AuthService register : succès et rejet EmailAlreadyExistsException")
    void authService_register() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .phoneNumber("+221771234567")
                .password("Secret123!")
                .build();

        when(userRepository.existsByEmail("mamadou@samaadresse.sn")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserProfileResponse res = authService.register(req);
        assertEquals("mamadou@samaadresse.sn", res.getEmail());

        when(userRepository.existsByEmail("mamadou@samaadresse.sn")).thenReturn(true);
        assertThrows(EmailAlreadyExistsException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("3. AuthService login, refresh et logout : cycle complet et erreurs")
    void authService_loginRefreshLogout() {
        LoginRequest loginReq = LoginRequest.builder()
                .email("mamadou@samaadresse.sn")
                .password("Secret123!")
                .build();

        when(userRepository.findByEmail("mamadou@samaadresse.sn")).thenReturn(Optional.of(testUser));
        MockHttpServletResponse response = new MockHttpServletResponse();

        AuthResponse authRes = authService.login(loginReq, "127.0.0.1", response);
        assertNotNull(authRes.getAccessToken());
        assertNotNull(response.getHeader("Set-Cookie"));

        // Mauvais mot de passe
        LoginRequest badReq = LoginRequest.builder()
                .email("mamadou@samaadresse.sn")
                .password("WrongPass")
                .build();
        assertThrows(InvalidCredentialsException.class, () -> authService.login(badReq, "127.0.0.1", response));

        // Refresh valide
        String rawRefresh = "raw-refresh-token-123";
        RefreshToken tokenEntity = RefreshToken.builder()
                .tokenHash(HashUtils.hashSha256(rawRefresh))
                .user(testUser)
                .expiryDate(Instant.now().plus(1, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        when(refreshTokenRepository.findByTokenHash(HashUtils.hashSha256(rawRefresh))).thenReturn(Optional.of(tokenEntity));

        AuthResponse refreshed = authService.refreshToken(rawRefresh, response);
        assertNotNull(refreshed.getAccessToken());

        // Refresh absent ou expiré
        assertThrows(TokenRefreshException.class, () -> authService.refreshToken("", response));
        tokenEntity.setRevoked(true);
        assertThrows(TokenRefreshException.class, () -> authService.refreshToken(rawRefresh, response));

        // Logout et profil
        authService.logout(rawRefresh, response);
        UserProfileResponse profile = authService.getProfileByEmail("mamadou@samaadresse.sn");
        assertEquals("Mamadou Diallo", profile.getFullName());
    }

    @Test
    @DisplayName("4. DemoDataSeeder initialise les comptes de démo s'ils sont absents")
    void demoDataSeeder_createsDemoAccounts() {
        when(userRepository.findByEmail(anyString())).thenReturn(java.util.Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        DemoDataSeeder seeder = new DemoDataSeeder(userRepository, passwordEncoder);
        seeder.setDemoPassword("UnitTestDemoPass123!");
        seeder.run(new DefaultApplicationArguments());
        verify(userRepository, atLeast(2)).save(any(User.class));
    }
}

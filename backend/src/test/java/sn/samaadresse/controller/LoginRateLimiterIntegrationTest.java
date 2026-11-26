package sn.samaadresse.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.LoginRequest;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.repository.RefreshTokenRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.ClientIpResolver;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.AuthService;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, AuthService.class, RateLimiterService.class})
@AutoConfigureMockMvc(addFilters = false)
class LoginRateLimiterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RefreshTokenRepository refreshTokenRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private int originalHops;

    @BeforeEach
    void setUp() {
        originalHops = ClientIpResolver.getConfiguredHops();

        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .phoneNumber("+221771234567")
                .passwordHash("hashedPassword")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        // Mot de passe incorrect pour déclencher InvalidCredentialsException (401)
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        ClientIpResolver.setConfiguredHops(originalHops);
    }

    @Test
    @DisplayName("a) 5 POST /api/auth/login autorisés, le 6e renvoie HTTP 429 avec Retry-After > 0")
    void loginRateLimiter_5Allowed_6thReturns429() throws Exception {
        ClientIpResolver.setConfiguredHops(0);
        String testIp = "198.51.100.22";

        LoginRequest req = LoginRequest.builder()
                .email("mamadou@samaadresse.sn")
                .password("MauvaisMotDePasse")
                .build();
        String jsonBody = objectMapper.writeValueAsString(req);

        // Les 5 premières requêtes sont traitées par le service (identifiants invalides -> 401)
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonBody)
                            .with(request -> {
                                request.setRemoteAddr(testIp);
                                return request;
                            }))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }

        // La 6e requête est bloquée par le rate limiter HTTP 429 avec en-tête Retry-After > 0
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(request -> {
                            request.setRemoteAddr(testIp);
                            return request;
                        }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andReturn();

        String retryAfter = result.getResponse().getHeader(HttpHeaders.RETRY_AFTER);
        int retryAfterSeconds = Integer.parseInt(retryAfter);
        assertTrue(retryAfterSeconds > 0, "L'en-tête Retry-After doit être strictement supérieur à 0");
    }

    @Test
    @DisplayName("b) Test avec X-Forwarded-For usurpé : la limite reste liée à l'IP réelle (TRUSTED_PROXY_HOPS=1)")
    void loginRateLimiter_spoofedXForwardedFor_bindsToRealIp() throws Exception {
        ClientIpResolver.setConfiguredHops(1);
        String realClientIp = "196.207.215.10";

        LoginRequest req = LoginRequest.builder()
                .email("mamadou@samaadresse.sn")
                .password("MauvaisMotDePasse")
                .build();
        String jsonBody = objectMapper.writeValueAsString(req);

        // Le client tente de fausser son identité en envoyant des IP forgées différentes en tête de X-Forwarded-For
        for (int i = 1; i <= 5; i++) {
            String spoofedXff = "10.0.0." + i + ", " + realClientIp;
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonBody)
                            .header("X-Forwarded-For", spoofedXff))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }

        // 6e requête : même avec une nouvelle IP forgée en préfixe, le proxy hops=1 extrait l'IP réelle 196.207.215.10
        String finalSpoofedXff = "10.0.0.99, " + realClientIp;
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .header("X-Forwarded-For", finalSpoofedXff))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.status").value(429))
                .andReturn();

        String retryAfter = result.getResponse().getHeader(HttpHeaders.RETRY_AFTER);
        int retryAfterSeconds = Integer.parseInt(retryAfter);
        assertTrue(retryAfterSeconds > 0, "L'en-tête Retry-After doit être strictement positif");

        // Vérification d'isolation : un autre client avec une IP réelle différente n'est pas bloqué
        String differentClientXff = "10.0.0.1, 196.207.215.20";
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .header("X-Forwarded-For", differentClientXff))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}

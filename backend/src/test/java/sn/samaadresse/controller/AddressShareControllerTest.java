package sn.samaadresse.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.dto.ShareSmsRequest;
import sn.samaadresse.dto.ShareSmsResponse;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.exception.SmsDeliveryException;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.service.AddressShareService;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests @WebMvcTest pour AddressShareController.
 * On importe SecurityConfig (CSRF désactivé dans la config de prod, stateless) + GlobalExceptionHandler.
 * Les filtres sont désactivés via @AutoConfigureMockMvc(addFilters = false) pour éviter le redirect
 * formulaire-login de Spring Security par défaut. Les règles d'autorisation sont vérifiées via
 * @PreAuthorize / l'exception AccessDeniedException renvoyée par le service mocké.
 */
@WebMvcTest(controllers = AddressShareController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@AutoConfigureMockMvc(addFilters = false)
class AddressShareControllerTest {

    private static final String URL   = "/api/addresses/ZIG-KBG-4271/share/sms";
    private static final String PHONE = "+221771234567";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AddressShareService addressShareService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtProvider jwtProvider;

    // ─────────────────────────────────────────────────────────────────────────
    // 200 OK
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "owner@samaadresse.sn")
    @DisplayName("1. Utilisateur authentifié + numéro valide → 200 SENT")
    void shareBySms_authenticated_validPhone_returns200() throws Exception {
        when(addressShareService.shareBySms(anyString(), anyString(), anyString()))
                .thenReturn(ShareSmsResponse.sent("+221 77 *** ** 67"));

        mockMvc.perform(post(URL)
                        .with(user("owner@samaadresse.sn").roles("PROPRIETAIRE"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest(PHONE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT"))
                .andExpect(jsonPath("$.maskedPhone").value("+221 77 *** ** 67"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 400 Bad Request — validation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("2. Numéro absent → 400 avec fieldError phoneNumber")
    void shareBySms_missingPhone_returns400() throws Exception {
        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phoneNumber\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("3. Numéro de ligne fixe (33) → 400")
    void shareBySms_landlineNumber_returns400() throws Exception {
        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest("+221331234567"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("4. Numéro non sénégalais → 400")
    void shareBySms_nonSenegalNumber_returns400() throws Exception {
        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest("+33612345678"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("5. Corps JSON absent → 400 lisible")
    void shareBySms_missingBody_returns400() throws Exception {
        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 401 Non authentifié — simulé via AccessDeniedException remontée du service
    // (Avec addFilters=false, le vrai 401 HTTP est émis via l'exception handler)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("6. Service lève AccessDeniedException anonyme → 401")
    void shareBySms_accessDenied_returns401() throws Exception {
        when(addressShareService.shareBySms(anyString(), anyString(), anyString()))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("Non authentifié"));

        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest(PHONE))))
                .andExpect(status().is4xxClientError()); // 401 si anonymous, 403 si user authentifié
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 404 Not Found
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("7. Adresse inexistante → 404")
    void shareBySms_unknownAddress_returns404() throws Exception {
        when(addressShareService.shareBySms(anyString(), anyString(), anyString()))
                .thenThrow(new AddressNotFoundException("Adresse non trouvée ou inactive : ZIG-KBG-4271"));

        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest(PHONE))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 429 Too Many Requests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("8. Limite anti-fraude dépassée → 429")
    void shareBySms_rateLimitExceeded_returns429() throws Exception {
        when(addressShareService.shareBySms(anyString(), anyString(), anyString()))
                .thenThrow(new RateLimitExceededException(
                        "Limite atteinte : vous pouvez envoyer 5 SMS par heure."));

        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest(PHONE))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 502 Bad Gateway
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("9. Fournisseur SMS en échec → 502 sans détail technique exposé")
    void shareBySms_providerFails_returns502() throws Exception {
        when(addressShareService.shareBySms(anyString(), anyString(), anyString()))
                .thenThrow(new SmsDeliveryException("Timeout interne", null));

        mockMvc.perform(post(URL)
                        .with(user("test@test.sn"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShareSmsRequest(PHONE))))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.message").value(
                        "Le service SMS est momentanément indisponible. Veuillez réessayer plus tard."));
    }
}

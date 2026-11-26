package sn.samaadresse.controller;

import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import sn.samaadresse.config.JsonErrorReportValve;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.security.RateLimiterService;
import sn.samaadresse.service.AddressService;
import sn.samaadresse.service.AuthService;
import sn.samaadresse.service.PhotoStorage;

import java.io.CharArrayWriter;
import java.io.PrintWriter;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AuthController.class, PhotoController.class, AddressController.class})
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class HttpErrorHandlingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private AddressService addressService;

    @MockBean
    private sn.samaadresse.service.QrCodeService qrCodeService;

    @MockBean
    private PhotoStorage photoStorage;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimiterService rateLimiterService;

    @Test
    @DisplayName("1. 404 Not Found — Route API inconnue renvoie ErrorResponse JSON et non une page HTML")
    void test404_UnknownRoute_ReturnsJson() throws Exception {
        mockMvc.perform(get("/api/public/route-inconnue-totalement")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/api/public/route-inconnue-totalement"));
    }

    @Test
    @DisplayName("2. 405 Method Not Allowed — Méthode non supportée (GET sur route POST /api/auth/login) renvoie ErrorResponse JSON")
    void test405_MethodNotAllowed_ReturnsJson() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("3. 415 Unsupported Media Type — Content-Type non supporté (text/plain) renvoie ErrorResponse JSON")
    void test415_UnsupportedMediaType_ReturnsJson() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("donnees non json"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(415))
                .andExpect(jsonPath("$.error").value("Unsupported Media Type"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("4. 400 Bad Request — Corps JSON malformé ou invalide renvoie ErrorResponse JSON")
    void test400_MalformedBody_ReturnsJson() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"corps_invalide_non_ferme"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Corps de requête absent ou JSON invalide"));
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(username = "owner@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("5. 413 Payload Too Large — Upload dépassant la limite renvoie ErrorResponse JSON 413")
    void test413_PayloadTooLarge_ReturnsJson() throws Exception {
        java.util.UUID addressId = java.util.UUID.randomUUID();
        when(addressService.uploadAddressPhoto(org.mockito.ArgumentMatchers.eq(addressId), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new org.springframework.web.multipart.MaxUploadSizeExceededException(5 * 1024 * 1024));

        MockMultipartFile file = new MockMultipartFile("file", "facade.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/addresses/{id}/photo", addressId)
                        .file(file))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(413))
                .andExpect(jsonPath("$.error").value("Payload Too Large"))
                .andExpect(jsonPath("$.message").value("Le fichier dépasse la taille maximale autorisée de 5 Mo."))
                .andExpect(jsonPath("$.path").value("/api/addresses/" + addressId + "/photo"));
    }

    @Test
    @DisplayName("6. 400 Tomcat Bad Request — JsonErrorReportValve intercepte l'URL malformée et produit du JSON pur")
    void test400_TomcatMalformedUrl_JsonValveGeneratesJson() throws Exception {
        JsonErrorReportValve valve = new JsonErrorReportValve();

        Request request = mock(Request.class);
        Response response = mock(Response.class);

        when(request.getRequestURI()).thenReturn("/api/%");
        when(response.getStatus()).thenReturn(400);
        when(response.isError()).thenReturn(true);
        when(response.getContentWritten()).thenReturn(0L);

        CharArrayWriter charWriter = new CharArrayWriter();
        PrintWriter printWriter = new PrintWriter(charWriter);
        when(response.getReporter()).thenReturn(printWriter);

        Method reportMethod = JsonErrorReportValve.class.getDeclaredMethod("report", Request.class, Response.class, Throwable.class);
        reportMethod.setAccessible(true);
        reportMethod.invoke(valve, request, response, new IllegalArgumentException("Invalid URI: /api/%"));

        printWriter.flush();
        String output = charWriter.toString();

        assertTrue(output.contains("\"status\":400"), "La valve doit émettre status 400 dans le JSON");
        assertTrue(output.contains("\"error\":\"Bad Request\""), "La valve doit émettre Bad Request");
        assertTrue(output.contains("\"path\":\"/api/%\""), "La valve doit inclure le chemin malformé");
        assertTrue(output.startsWith("{") && output.endsWith("}"), "La sortie doit être un objet JSON valide, pas du HTML");
    }

    @Test
    @DisplayName("7. GET /uploads/ renvoie HTTP 404 JSON (listage de répertoire interdit)")
    void test404_UploadsDirectory_ReturnsJson() throws Exception {
        mockMvc.perform(get("/uploads/"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Le listage du répertoire /uploads/ est interdit ou introuvable."))
                .andExpect(jsonPath("$.path").value("/uploads/"));
    }
}

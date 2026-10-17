package sn.samaadresse.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.ReportReason;
import sn.samaadresse.domain.enums.ReportStatus;
import sn.samaadresse.dto.*;
import sn.samaadresse.exception.AddressUnavailableException;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.exception.InvalidAddressOperationException;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.service.AddressService;
import sn.samaadresse.service.ModerationService;
import sn.samaadresse.service.QrCodeService;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {
        AdminModerationController.class,
        PublicReportController.class,
        AddressController.class
})
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@AutoConfigureMockMvc(addFilters = false)
class AdminAndReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ModerationService moderationService;

    @MockBean
    private AddressService addressService;

    @MockBean
    private QrCodeService qrCodeService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private sn.samaadresse.security.RateLimiterService rateLimiterService;

    @Test
    @DisplayName("1. GET /api/admin/reports sans jeton (anonyme) -> 401 Unauthorized")
    void adminReports_anonymous_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/reports"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(username = "user@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("2. GET /api/admin/reports avec rôle PROPRIETAIRE (USER simple) -> 403 Forbidden")
    void adminReports_nonAdminUser_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/reports"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(username = "user@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("3. POST /api/admin/addresses/{id}/suspend avec rôle PROPRIETAIRE -> 403 Forbidden")
    void adminSuspend_nonAdminUser_returns403() throws Exception {
        mockMvc.perform(post("/api/admin/addresses/{id}/suspend", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Tentative non admin\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(username = "admin@samaadresse.sn", roles = {"ADMIN"})
    @DisplayName("4. GET /api/admin/reports avec rôle ADMIN -> 200 OK paginé")
    void adminReports_withAdminRole_returns200() throws Exception {
        AdminReportResponse item = AdminReportResponse.builder()
                .id(UUID.randomUUID())
                .reason(ReportReason.POSITION_INCORRECTE)
                .status(ReportStatus.OPEN)
                .addressCode("ZIG-KBG-4271")
                .build();

        when(moderationService.getReports(eq(ReportStatus.OPEN), eq(0), eq(20)))
                .thenReturn(new PageImpl<>(List.of(item)));

        mockMvc.perform(get("/api/admin/reports").param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].addressCode").value("ZIG-KBG-4271"));
    }

    @Test
    @WithMockUser(username = "admin@samaadresse.sn", roles = {"ADMIN"})
    @DisplayName("5. POST /api/admin/addresses/{id}/suspend sans motif -> 400 Bad Request")
    void adminSuspend_missingReason_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/addresses/{id}/suspend", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("6. POST /api/public/addresses/{code}/reports -> 202 Accepted avec message neutre")
    void publicReport_validRequest_returns202() throws Exception {
        when(moderationService.createPublicReport(eq("ZIG-KBG-4271"), any(CreateReportRequest.class), anyString()))
                .thenReturn(new ReportCreatedResponse("ACCEPTED", "Merci, votre signalement a été transmis."));

        mockMvc.perform(post("/api/public/addresses/ZIG-KBG-4271/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"POSITION_INCORRECTE\",\"comment\":\"Position décalée\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.message").value("Merci, votre signalement a été transmis."));
    }

    @Test
    @DisplayName("7. POST /api/public/addresses/{code}/reports dépassant la limite -> 429 Too Many Requests")
    void publicReport_rateLimited_returns429() throws Exception {
        when(moderationService.createPublicReport(eq("ZIG-KBG-4271"), any(CreateReportRequest.class), anyString()))
                .thenThrow(new RateLimitExceededException("Trop de signalements, réessayez plus tard"));

        mockMvc.perform(post("/api/public/addresses/ZIG-KBG-4271/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"AUTRE\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("Trop de signalements, réessayez plus tard"));
    }

    @Test
    @DisplayName("8. GET /api/addresses/{code} sur adresse archivée ou suspendue -> 410 Gone avec message neutre")
    void getPublicAddress_archivedOrSuspended_returns410() throws Exception {
        when(addressService.getPublicAddressByCode("ZIG-KBG-4271"))
                .thenThrow(new AddressUnavailableException("Cette adresse n'est plus disponible."));

        mockMvc.perform(get("/api/addresses/ZIG-KBG-4271"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.status").value(410))
                .andExpect(jsonPath("$.message").value("Cette adresse n'est plus disponible."))
                .andExpect(jsonPath("$.code").doesNotExist())
                .andExpect(jsonPath("$.owner").doesNotExist());
    }

    @Test
    @WithMockUser(username = "owner@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("9. PATCH /api/addresses/{id} tentant de modifier le code -> 400 Bad Request")
    void patchAddress_immutableCode_returns400() throws Exception {
        UUID id = UUID.randomUUID();
        when(addressService.updateAddress(eq(id), any(UpdateAddressRequest.class), eq("owner@samaadresse.sn")))
                .thenThrow(new InvalidAddressOperationException("Le code et la position sont immuables et ne peuvent pas être modifiés."));

        mockMvc.perform(patch("/api/addresses/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"ZIG-KBG-0000\",\"description\":\"Test\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "owner@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("10. PATCH, DELETE photo, archive et restore sur /api/addresses/{id} -> 200 OK")
    void addressLifecycleEndpoints_owner_return200() throws Exception {
        UUID id = UUID.randomUUID();
        AddressResponse resp = AddressResponse.builder()
                .id(id)
                .code("ZIG-KBG-4271")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.ACTIVE)
                .build();

        when(addressService.updateAddress(eq(id), any(UpdateAddressRequest.class), eq("owner@samaadresse.sn"))).thenReturn(resp);
        when(addressService.deleteAddressPhoto(eq(id), eq("owner@samaadresse.sn"))).thenReturn(resp);
        when(addressService.archiveAddress(eq(id), eq("owner@samaadresse.sn"))).thenReturn(resp);
        when(addressService.restoreAddress(eq(id), eq("owner@samaadresse.sn"))).thenReturn(resp);

        mockMvc.perform(patch("/api/addresses/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Nouveau repère\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/addresses/{id}/photo", id))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/addresses/{id}/archive", id))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/addresses/{id}/restore", id))
                .andExpect(status().isOk());
    }
}

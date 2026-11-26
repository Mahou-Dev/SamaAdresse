package sn.samaadresse.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import sn.samaadresse.config.SecurityConfig;
import sn.samaadresse.exception.GlobalExceptionHandler;
import sn.samaadresse.security.JwtAuthenticationFilter;
import sn.samaadresse.security.JwtProvider;
import sn.samaadresse.service.AddressService;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AddressController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@AutoConfigureMockMvc(addFilters = false)
class AddressPhotoMaxUploadSizeTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AddressService addressService;

    @MockBean
    private sn.samaadresse.service.QrCodeService qrCodeService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtProvider jwtProvider;

    @MockBean
    private sn.samaadresse.security.RateLimiterService rateLimiterService;

    @Test
    @WithMockUser(username = "owner@samaadresse.sn", roles = {"PROPRIETAIRE"})
    @DisplayName("Upload d'un fichier surdimensionné (>5 Mo) capturé par MaxUploadSizeExceededException renvoie HTTP 400 Bad Request et non 500")
    void testUploadPhoto_ExceedsMaxSize_Returns400BadRequest() throws Exception {
        byte[] oversizedContent = new byte[6 * 1024 * 1024];
        oversizedContent[0] = (byte) 0xFF;
        oversizedContent[1] = (byte) 0xD8;
        oversizedContent[2] = (byte) 0xFF;

        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "oversized.jpg",
                "image/jpeg",
                oversizedContent
        );

        UUID addressId = UUID.randomUUID();

        when(addressService.uploadAddressPhoto(eq(addressId), any(), any()))
                .thenThrow(new MaxUploadSizeExceededException(5 * 1024 * 1024));

        mockMvc.perform(multipart("/api/addresses/{id}/photo", addressId)
                .file(oversizedFile))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.status").value(413))
                .andExpect(jsonPath("$.error").value("Payload Too Large"))
                .andExpect(jsonPath("$.message").value("Le fichier dépasse la taille maximale autorisée de 5 Mo."))
                .andExpect(jsonPath("$.path").value("/api/addresses/" + addressId + "/photo"));
    }
}

package sn.samaadresse.service;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.repository.AddressRepository;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QrCodeServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @InjectMocks
    private QrCodeService qrCodeService;

    private Address testAddress;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(qrCodeService, "frontendBaseUrl", "http://localhost:5173");

        User owner = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("mamadou@samaadresse.sn")
                .role(Role.PROPRIETAIRE)
                .build();

        testAddress = Address.builder()
                .id(UUID.randomUUID())
                .code("ZIG-KBG-4271")
                .latitude(12.5738)
                .longitude(-16.2650)
                .zone("ZIG")
                .quartier("KBG")
                .description("Maison familiale")
                .locationType(LocationType.MAISON)
                .status(AddressStatus.ACTIVE)
                .owner(owner)
                .build();
    }

    @Test
    @DisplayName("1. Génération de QR code réussie : Décodage ZXing et vérification de l'URL contenue")
    void testGenerateAddressQrCode_SuccessAndDecode() throws Exception {
        when(addressRepository.findByCodeAndStatus("ZIG-KBG-4271", AddressStatus.ACTIVE))
                .thenReturn(Optional.of(testAddress));

        byte[] qrBytes = qrCodeService.generateAddressQrCode("ZIG-KBG-4271");

        assertNotNull(qrBytes);
        assertTrue(qrBytes.length > 0, "Le tableau d'octets du QR Code PNG ne doit pas être vide");

        // Décodage réel du QR Code PNG généré à l'aide de ZXing
        BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(qrBytes));
        assertNotNull(bufferedImage, "L'image PNG doit être lisible par ImageIO");

        BufferedImageLuminanceSource source = new BufferedImageLuminanceSource(bufferedImage);
        BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
        Result decodedResult = new MultiFormatReader().decode(bitmap);

        assertNotNull(decodedResult);
        assertEquals("http://localhost:5173/a/ZIG-KBG-4271", decodedResult.getText(), "Le QR Code doit encoder l'URL exacte de la fiche publique");
    }

    @Test
    @DisplayName("2. Rejet 404 : Tentative de génération de QR Code pour une adresse inexistante ou inactive")
    void testGenerateAddressQrCode_NotFound_ThrowsAddressNotFoundException() {
        when(addressRepository.findByCodeAndStatus("INEXISTANT-1234", AddressStatus.ACTIVE))
                .thenReturn(Optional.empty());

        AddressNotFoundException exception = assertThrows(
                AddressNotFoundException.class,
                () -> qrCodeService.generateAddressQrCode("INEXISTANT-1234")
        );

        assertTrue(exception.getMessage().contains("Adresse non trouvée ou inactive"));
    }
}

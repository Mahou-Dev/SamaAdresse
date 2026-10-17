package sn.samaadresse.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.AddressUnavailableException;
import sn.samaadresse.repository.AddressRepository;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QrCodeService {

    private final AddressRepository addressRepository;

    @Value("${frontend.base.url}")
    private String frontendBaseUrl;

    @PostConstruct
    public void validateFrontendBaseUrl() {
        if (!StringUtils.hasText(frontendBaseUrl) || frontendBaseUrl.contains("${")) {
            throw new IllegalStateException("FRONTEND_BASE_URL doit être défini pour générer les QR codes.");
        }
        this.frontendBaseUrl = frontendBaseUrl.trim().replaceAll("/+$", "");
    }

    /**
     * Génère un QR code PNG encodant l'URL publique complète de l'adresse (ex: http://localhost:5173/a/ZIG-KBG-4271)
     *
     * @param code Le code court d'adresse géolocalisée (ex: ZIG-KBG-4271)
     * @return Les octets de l'image PNG (300x300 px)
     */
    @Transactional(readOnly = true)
    public byte[] generateAddressQrCode(String code) {
        String upperCode = code.toUpperCase();
        Optional<Address> activeOpt = addressRepository.findByCodeAndStatus(upperCode, AddressStatus.ACTIVE);
        if (activeOpt.isEmpty()) {
            Optional<Address> anyOpt = addressRepository.findByCode(upperCode);
            if (anyOpt.isPresent() && (anyOpt.get().getStatus() == AddressStatus.ARCHIVED || anyOpt.get().getStatus() == AddressStatus.SUSPENDED)) {
                throw new AddressUnavailableException("Cette adresse n'est plus disponible.");
            }
            throw new AddressNotFoundException("Adresse non trouvée ou inactive : " + upperCode);
        }

        String targetUrl = frontendBaseUrl.replaceAll("/+$", "") + "/a/" + upperCode;

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 4);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

            BitMatrix bitMatrix = qrCodeWriter.encode(targetUrl, BarcodeFormat.QR_CODE, 300, 300, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du QR Code pour l'adresse : " + upperCode, e);
        }
    }
}

package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.exception.InvalidImageException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.ImageMagicBytesValidator;

import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressPhotoTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private sn.samaadresse.repository.ReservedCodeRepository reservedCodeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GeoGridService geoGridService;

    @Mock
    private AddressCodeGenerator addressCodeGenerator;

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;
    private AddressService addressService;

    private User ownerUser;
    private User otherUser;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        ImageMagicBytesValidator magicBytesValidator = new ImageMagicBytesValidator();
        fileStorageService = new FileStorageService(tempDir.toString(), magicBytesValidator);
        addressService = new AddressService(addressRepository, reservedCodeRepository, userRepository, geoGridService, addressCodeGenerator, fileStorageService);

        ownerUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Mamadou Diallo")
                .email("owner@samaadresse.sn")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Awa Ndiaye")
                .email("other@samaadresse.sn")
                .role(Role.PROPRIETAIRE)
                .enabled(true)
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
                .owner(ownerUser)
                .build();
    }

    @Test
    @DisplayName("1. Upload réussi avec une vraie image JPEG valide (magic bytes FF D8 FF)")
    void testUploadPhoto_ValidJpeg_Success() {
        // En-tête Magic Bytes d'un vrai fichier JPEG (au moins 12 octets)
        byte[] validJpegBytes = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48
        };
        MockMultipartFile file = new MockMultipartFile("file", "facade.jpg", "image/jpeg", validJpegBytes);

        when(addressRepository.findById(testAddress.getId())).thenReturn(Optional.of(testAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddressResponse response = addressService.uploadAddressPhoto(testAddress.getId(), file, ownerUser.getEmail());

        assertNotNull(response);
        assertNotNull(response.getPhotoUrl());
        assertTrue(response.getPhotoUrl().startsWith("/uploads/"));
        assertTrue(response.getPhotoUrl().endsWith(".jpg"));
        verify(addressRepository, times(1)).save(testAddress);
    }

    @Test
    @DisplayName("2. Rejet d'un fichier non-image camouflé en .jpg (échec validation magic bytes)")
    void testUploadPhoto_FakeImageTextFile_ThrowsInvalidImageException() {
        // Contenu texte "Ceci est un fichier texte malveillant" renommé en .jpg avec Content-Type déclaré "image/jpeg"
        byte[] textBytes = "Ceci est un fichier texte malveillant qui tente de contourner le filtre.".getBytes();
        MockMultipartFile fakeFile = new MockMultipartFile("file", "malicious.jpg", "image/jpeg", textBytes);

        when(addressRepository.findById(testAddress.getId())).thenReturn(Optional.of(testAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));

        InvalidImageException exception = assertThrows(
                InvalidImageException.class,
                () -> addressService.uploadAddressPhoto(testAddress.getId(), fakeFile, ownerUser.getEmail())
        );

        assertTrue(exception.getMessage().contains("Format d'image non valide"));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Rejet d'un fichier trop volumineux (> 5 Mo)")
    void testUploadPhoto_FileTooLarge_ThrowsInvalidImageException() {
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1]; // 5Mo + 1 octet
        // Mettre les magic bytes JPEG au début
        largeBytes[0] = (byte) 0xFF;
        largeBytes[1] = (byte) 0xD8;
        largeBytes[2] = (byte) 0xFF;

        MockMultipartFile largeFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeBytes);

        when(addressRepository.findById(testAddress.getId())).thenReturn(Optional.of(testAddress));
        when(userRepository.findByEmail(ownerUser.getEmail())).thenReturn(Optional.of(ownerUser));

        InvalidImageException exception = assertThrows(
                InvalidImageException.class,
                () -> addressService.uploadAddressPhoto(testAddress.getId(), largeFile, ownerUser.getEmail())
        );

        assertTrue(exception.getMessage().contains("5 Mo"));
        verify(addressRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. Rejet 403 : Un utilisateur ne peut pas modifier la photo d'un autre utilisateur")
    void testUploadPhoto_UnauthorizedUser_ThrowsAccessDeniedException() {
        byte[] validJpegBytes = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48
        };
        MockMultipartFile file = new MockMultipartFile("file", "facade.jpg", "image/jpeg", validJpegBytes);

        when(addressRepository.findById(testAddress.getId())).thenReturn(Optional.of(testAddress));
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> addressService.uploadAddressPhoto(testAddress.getId(), file, otherUser.getEmail())
        );

        assertEquals("Vous n'êtes pas autorisé à modifier la photo de cette adresse.", exception.getMessage());
        verify(addressRepository, never()).save(any());
    }
}

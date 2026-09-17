package sn.samaadresse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.dto.AddressResponse;
import sn.samaadresse.dto.CreateAddressRequest;
import sn.samaadresse.dto.PublicAddressResponse;
import sn.samaadresse.dto.UserProfileResponse;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final GeoGridService geoGridService;
    private final AddressCodeGenerator addressCodeGenerator;

    @Transactional
    public AddressResponse createAddress(CreateAddressRequest request, User currentUser) {
        // 1. Résolution de la zone et du quartier via les coordonnées GPS
        GeoQuartier quartier = geoGridService.resolveQuartier(request.getLatitude(), request.getLongitude());

        // 2. Génération du code court unique immuable ZONE-QUARTIER-XXXX
        String generatedCode = addressCodeGenerator.generateCode(quartier.getZoneCode(), quartier.getCode());

        // 3. Construction et enregistrement de l'entité
        Address address = Address.builder()
                .code(generatedCode)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .zone(quartier.getZoneCode())
                .quartier(quartier.getCode())
                .description(request.getDescription())
                .locationType(request.getLocationType())
                .status(AddressStatus.ACTIVE)
                .owner(currentUser)
                .build();

        Address savedAddress = addressRepository.save(address);

        return mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AddressResponse createAddressByEmail(CreateAddressRequest request, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));
        return createAddress(request, user);
    }

    @Transactional(readOnly = true)
    public PublicAddressResponse getPublicAddressByCode(String code) {
        Address address = addressRepository.findByCodeAndStatus(code, AddressStatus.ACTIVE)
                .orElseThrow(() -> new AddressNotFoundException("Adresse non trouvée ou inactive : " + code));

        return mapToPublicAddressResponse(address);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(User currentUser) {
        List<Address> addresses = addressRepository.findByOwnerOrderByCreatedAtDesc(currentUser);
        return addresses.stream()
                .map(this::mapToAddressResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddressesByEmail(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));
        return getUserAddresses(user);
    }

    public AddressResponse mapToAddressResponse(Address address) {
        UserProfileResponse ownerProfile = UserProfileResponse.builder()
                .id(address.getOwner().getId())
                .fullName(address.getOwner().getFullName())
                .email(address.getOwner().getEmail())
                .phoneNumber(address.getOwner().getPhoneNumber())
                .role(address.getOwner().getRole())
                .enabled(address.getOwner().isEnabled())
                .createdAt(address.getOwner().getCreatedAt())
                .build();

        return AddressResponse.builder()
                .id(address.getId())
                .code(address.getCode())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .zone(address.getZone())
                .quartier(address.getQuartier())
                .description(address.getDescription())
                .photoUrl(address.getPhotoUrl())
                .locationType(address.getLocationType())
                .status(address.getStatus())
                .createdAt(address.getCreatedAt())
                .owner(ownerProfile)
                .build();
    }

    public PublicAddressResponse mapToPublicAddressResponse(Address address) {
        return PublicAddressResponse.builder()
                .code(address.getCode())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .zone(address.getZone())
                .quartier(address.getQuartier())
                .description(address.getDescription())
                .locationType(address.getLocationType())
                .createdAt(address.getCreatedAt())
                .build();
    }
}

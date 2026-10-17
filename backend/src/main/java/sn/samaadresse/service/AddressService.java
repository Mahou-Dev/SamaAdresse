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
import sn.samaadresse.dto.UpdateAddressRequest;
import sn.samaadresse.dto.UserProfileResponse;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.AddressUnavailableException;
import sn.samaadresse.exception.InvalidAddressOperationException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final GeoGridService geoGridService;
    private final AddressCodeGenerator addressCodeGenerator;
    private final FileStorageService fileStorageService;

    @Transactional
    public AddressResponse createAddress(CreateAddressRequest request, User currentUser) {
        // 1. Résolution de la zone et du quartier via les coordonnées GPS
        GeoQuartier quartier = geoGridService.resolveQuartier(request.getLatitude(), request.getLongitude());

        // 2. Génération du code court unique immuable ZONE-QUARTIER-XXXX
        String generatedCode = addressCodeGenerator.generateCode(quartier.getZoneCode(), quartier.getCode());

        boolean listed = Boolean.TRUE.equals(request.getListed());
        boolean showOwnerName = Boolean.TRUE.equals(request.getShowOwnerName());
        String searchText = computeSearchText(request.getDescription(), quartier.getCode(), showOwnerName, currentUser.getFullName());

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
                .listed(listed)
                .showOwnerName(showOwnerName)
                .searchText(searchText)
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

    @Transactional
    public AddressResponse createAddressWithPhoto(CreateAddressRequest request, org.springframework.web.multipart.MultipartFile photo, String currentUserEmail) {
        AddressResponse response = createAddressByEmail(request, currentUserEmail);
        if (photo != null && !photo.isEmpty()) {
            return uploadAddressPhoto(response.getId(), photo, currentUserEmail);
        }
        return response;
    }

    @Transactional
    public AddressResponse uploadAddressPhoto(UUID addressId, org.springframework.web.multipart.MultipartFile file, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        boolean isOwner = address.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == sn.samaadresse.domain.enums.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à modifier la photo de cette adresse.");
        }

        if (address.getStatus() == AddressStatus.ARCHIVED || address.getStatus() == AddressStatus.SUSPENDED) {
            throw new InvalidAddressOperationException("Impossible de modifier la photo d'une adresse archivée ou suspendue.");
        }

        String oldPhotoUrl = address.getPhotoUrl();
        String newPhotoUrl = fileStorageService.storeFile(file);
        if (oldPhotoUrl != null && !oldPhotoUrl.equals(newPhotoUrl)) {
            fileStorageService.deleteFile(oldPhotoUrl);
        }

        address.setPhotoUrl(newPhotoUrl);
        Address savedAddress = addressRepository.save(address);

        return mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AddressResponse deleteAddressPhoto(UUID addressId, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        if (!address.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à supprimer la photo de cette adresse.");
        }

        if (address.getStatus() != AddressStatus.ACTIVE) {
            throw new InvalidAddressOperationException("Impossible de modifier la photo d'une adresse archivée ou suspendue.");
        }

        if (address.getPhotoUrl() != null) {
            fileStorageService.deleteFile(address.getPhotoUrl());
            address.setPhotoUrl(null);
            address = addressRepository.save(address);
        }

        return mapToAddressResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(UUID addressId, UpdateAddressRequest request, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        if (!address.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas le propriétaire de cette adresse.");
        }

        if (address.getStatus() != AddressStatus.ACTIVE) {
            throw new InvalidAddressOperationException("Impossible de modifier une adresse archivée ou suspendue.");
        }

        // Vérification stricte de l'immuabilité du code et de la position
        if (request.getCode() != null || request.getLatitude() != null || request.getLongitude() != null
                || request.getZone() != null || request.getQuartier() != null) {
            throw new InvalidAddressOperationException("Le code et la position sont immuables et ne peuvent pas être modifiés.");
        }

        if (request.getDescription() != null) {
            String trimmed = request.getDescription().trim();
            if (trimmed.length() > 500) {
                throw new InvalidAddressOperationException("La description ne peut pas dépasser 500 caractères.");
            }
            address.setDescription(trimmed);
        }

        if (request.getLocationType() != null) {
            address.setLocationType(request.getLocationType());
        }

        if (request.getListed() != null) {
            address.setListed(request.getListed());
        }

        if (request.getShowOwnerName() != null) {
            address.setShowOwnerName(request.getShowOwnerName());
        }

        address.setSearchText(computeSearchText(
                address.getDescription(),
                address.getQuartier(),
                address.isShowOwnerName(),
                currentUser.getFullName()
        ));

        Address savedAddress = addressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AddressResponse archiveAddress(UUID addressId, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        if (!address.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas le propriétaire de cette adresse.");
        }

        if (address.getStatus() == AddressStatus.SUSPENDED) {
            throw new InvalidAddressOperationException("Impossible d'archiver une adresse suspendue par la modération.");
        }

        address.setStatus(AddressStatus.ARCHIVED);
        address.setArchivedAt(Instant.now());
        Address savedAddress = addressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AddressResponse restoreAddress(UUID addressId, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        if (!address.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas le propriétaire de cette adresse.");
        }

        if (address.getStatus() == AddressStatus.SUSPENDED) {
            throw new InvalidAddressOperationException("Impossible de restaurer une adresse suspendue par la modération.");
        }

        address.setStatus(AddressStatus.ACTIVE);
        address.setArchivedAt(null);
        Address savedAddress = addressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    @Transactional(readOnly = true)
    public PublicAddressResponse getPublicAddressByCode(String code) {
        Optional<Address> activeOpt = addressRepository.findByCodeAndStatus(code, AddressStatus.ACTIVE);
        if (activeOpt.isEmpty()) {
            Optional<Address> anyOpt = addressRepository.findByCode(code);
            if (anyOpt.isPresent() && (anyOpt.get().getStatus() == AddressStatus.ARCHIVED || anyOpt.get().getStatus() == AddressStatus.SUSPENDED)) {
                throw new AddressUnavailableException("Cette adresse n'est plus disponible.");
            }
            throw new AddressNotFoundException("Adresse non trouvée ou inactive : " + code);
        }

        return mapToPublicAddressResponse(activeOpt.get());
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

    @Transactional
    public AddressResponse updateVisibility(UUID addressId, sn.samaadresse.dto.UpdateVisibilityRequest request, String currentUserEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable pour l'email : " + currentUserEmail));

        if (!address.getOwner().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas le propriétaire de cette adresse.");
        }

        if (address.getStatus() != AddressStatus.ACTIVE) {
            throw new InvalidAddressOperationException("Impossible de modifier la visibilité d'une adresse archivée ou suspendue.");
        }

        if (request != null) {
            if (request.getListed() != null) {
                address.setListed(request.getListed());
            }
            if (request.getShowOwnerName() != null) {
                address.setShowOwnerName(request.getShowOwnerName());
            }
        }

        address.setSearchText(computeSearchText(
                address.getDescription(),
                address.getQuartier(),
                address.isShowOwnerName(),
                currentUser.getFullName()
        ));

        Address savedAddress = addressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<sn.samaadresse.dto.DirectoryItemResponse> searchDirectory(
            String q, String quartier, sn.samaadresse.domain.enums.LocationType type, int page, int size
    ) {
        int pageIndex = Math.max(0, page);
        int pageSize = (size <= 0 || size > 50) ? 12 : size;

        String trimmedQ = (q != null) ? q.trim() : "";
        boolean hasFilter = (quartier != null && !quartier.isBlank()) || (type != null);

        if (!trimmedQ.isEmpty() && trimmedQ.length() < 2 && !hasFilter) {
            throw new IllegalArgumentException("Le terme de recherche doit comporter au moins 2 caractères.");
        }

        String qRaw = trimmedQ.isEmpty() ? null : trimmedQ;
        String qNorm = trimmedQ.isEmpty() ? null : normalizeText(trimmedQ);
        String exactCode = trimmedQ.isEmpty() ? "" : trimmedQ.toUpperCase();
        String filterQuartier = (quartier != null && !quartier.isBlank()) ? quartier.trim().toUpperCase() : null;

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(pageIndex, pageSize);
        org.springframework.data.domain.Page<Address> addressPage = addressRepository.searchDirectory(
                qRaw, qNorm, exactCode, filterQuartier, type, pageable
        );

        return addressPage.map(this::mapToDirectoryItem);
    }

    public sn.samaadresse.dto.DirectoryItemResponse mapToDirectoryItem(Address address) {
        String desc = address.getDescription();
        if (desc != null && desc.length() > 120) {
            desc = desc.substring(0, 117) + "...";
        }
        String ownerName = null;
        if (address.isShowOwnerName() && address.getOwner() != null) {
            ownerName = address.getOwner().getFullName();
        }

        return sn.samaadresse.dto.DirectoryItemResponse.builder()
                .code(address.getCode())
                .zone(address.getZone())
                .quartier(address.getQuartier())
                .locationType(address.getLocationType())
                .description(desc)
                .photoUrl(address.getPhotoUrl())
                .createdAt(address.getCreatedAt())
                .ownerName(ownerName)
                .build();
    }

    public static String normalizeText(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase(java.util.Locale.ROOT).trim();
    }

    public static String computeSearchText(String description, String quartier, boolean showOwnerName, String ownerName) {
        StringBuilder sb = new StringBuilder();
        if (description != null && !description.isBlank()) {
            sb.append(normalizeText(description)).append(" ");
        }
        if (quartier != null && !quartier.isBlank()) {
            sb.append(normalizeText(quartier)).append(" ");
        }
        if (showOwnerName && ownerName != null && !ownerName.isBlank()) {
            sb.append(normalizeText(ownerName)).append(" ");
        }
        return sb.toString().trim();
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
                .listed(address.isListed())
                .showOwnerName(address.isShowOwnerName())
                .moderationNotice(address.getStatus() == AddressStatus.SUSPENDED ? "Suspendue par la modération" : null)
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
                .photoUrl(address.getPhotoUrl())
                .locationType(address.getLocationType())
                .createdAt(address.getCreatedAt())
                .build();
    }
}

package sn.samaadresse.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.AddressReport;
import sn.samaadresse.domain.entity.AdminAction;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.ReportStatus;
import sn.samaadresse.dto.*;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.AddressUnavailableException;
import sn.samaadresse.exception.InvalidAddressOperationException;
import sn.samaadresse.repository.AddressReportRepository;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.AdminActionRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.security.ReportRateLimiter;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final AddressRepository addressRepository;
    private final AddressReportRepository reportRepository;
    private final AdminActionRepository adminActionRepository;
    private final UserRepository userRepository;
    private final ReportRateLimiter reportRateLimiter;
    private final AddressService addressService;

    @Transactional
    public ReportCreatedResponse createPublicReport(String rawCode, CreateReportRequest request, String clientIp) {
        if (request == null || request.getReason() == null) {
            throw new InvalidAddressOperationException("Le motif du signalement est obligatoire.");
        }
        if (request.getComment() != null && request.getComment().length() > 300) {
            throw new InvalidAddressOperationException("Le commentaire ne peut pas dépasser 300 caractères.");
        }

        String cleanCode = rawCode.trim().toUpperCase();
        Address address = addressRepository.findByCode(cleanCode)
                .orElseThrow(() -> new AddressNotFoundException("Adresse non trouvée : " + cleanCode));

        if (address.getStatus() == AddressStatus.ARCHIVED || address.getStatus() == AddressStatus.SUSPENDED) {
            throw new AddressUnavailableException("Cette adresse n'est plus disponible.");
        }

        String ipHash = reportRateLimiter.checkAndConsume(clientIp, cleanCode);

        AddressReport report = AddressReport.builder()
                .address(address)
                .reason(request.getReason())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .ipHash(ipHash)
                .status(ReportStatus.OPEN)
                .build();

        reportRepository.save(report);

        return ReportCreatedResponse.builder()
                .status("ACCEPTED")
                .message("Merci, votre signalement a été transmis.")
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AdminReportResponse> getReports(ReportStatus status, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<AddressReport> reportsPage = (status != null)
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);

        return reportsPage.map(this::mapToAdminReportResponse);
    }

    @Transactional
    public AddressResponse suspendAddress(UUID addressId, SuspendAddressRequest request, String adminEmail) {
        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new InvalidAddressOperationException("Le motif de suspension est obligatoire.");
        }
        String cleanReason = request.getReason().trim();
        if (cleanReason.length() > 500) {
            throw new InvalidAddressOperationException("Le motif ne peut pas dépasser 500 caractères.");
        }

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);

        address.setStatus(AddressStatus.SUSPENDED);
        address.setSuspendedReason(cleanReason);
        address.setSuspendedAt(Instant.now());
        Address savedAddress = addressRepository.save(address);

        // Résoudre automatiquement les signalements ouverts sur cette adresse
        List<AddressReport> openReports = reportRepository.findByAddressIdAndStatus(addressId, ReportStatus.OPEN);
        Instant now = Instant.now();
        for (AddressReport openReport : openReports) {
            openReport.setStatus(ReportStatus.RESOLVED);
            openReport.setResolvedAt(now);
            reportRepository.save(openReport);
        }

        // Écriture dans le journal d'audit admin_actions
        AdminAction audit = AdminAction.builder()
                .adminId(adminOpt.map(User::getId).orElse(null))
                .adminEmail(adminEmail)
                .action("SUSPEND_ADDRESS")
                .addressId(address.getId())
                .addressCode(address.getCode())
                .reason(cleanReason)
                .build();
        adminActionRepository.save(audit);

        return addressService.mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AddressResponse reinstateAddress(UUID addressId, String reason, String adminEmail) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException("Adresse introuvable avec l'ID : " + addressId));

        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);

        address.setStatus(AddressStatus.ACTIVE);
        address.setSuspendedReason(null);
        address.setSuspendedAt(null);
        Address savedAddress = addressRepository.save(address);

        String cleanReason = StringUtils.hasText(reason) ? reason.trim() : "Réactivation par l'administrateur";

        AdminAction audit = AdminAction.builder()
                .adminId(adminOpt.map(User::getId).orElse(null))
                .adminEmail(adminEmail)
                .action("REINSTATE_ADDRESS")
                .addressId(address.getId())
                .addressCode(address.getCode())
                .reason(cleanReason)
                .build();
        adminActionRepository.save(audit);

        return addressService.mapToAddressResponse(savedAddress);
    }

    @Transactional
    public AdminReportResponse updateReportStatus(UUID reportId, UpdateReportStatusRequest request, String adminEmail) {
        if (request == null || request.getStatus() == null) {
            throw new InvalidAddressOperationException("Le statut est obligatoire.");
        }
        if (request.getStatus() == ReportStatus.OPEN) {
            throw new InvalidAddressOperationException("Le statut cible doit être RESOLVED ou DISMISSED.");
        }

        AddressReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AddressNotFoundException("Signalement introuvable avec l'ID : " + reportId));

        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);

        report.setStatus(request.getStatus());
        report.setResolvedAt(Instant.now());
        AddressReport savedReport = reportRepository.save(report);

        String actionName = request.getStatus() == ReportStatus.DISMISSED ? "DISMISS_REPORT" : "RESOLVE_REPORT";
        String auditReason = StringUtils.hasText(request.getReason())
                ? request.getReason().trim()
                : (request.getStatus() == ReportStatus.DISMISSED ? "Classé sans suite" : "Signalement traité");

        AdminAction audit = AdminAction.builder()
                .adminId(adminOpt.map(User::getId).orElse(null))
                .adminEmail(adminEmail)
                .action(actionName)
                .addressId(report.getAddress().getId())
                .addressCode(report.getAddress().getCode())
                .reportId(report.getId())
                .reason(auditReason)
                .build();
        adminActionRepository.save(audit);

        return mapToAdminReportResponse(savedReport);
    }

    public AdminReportResponse mapToAdminReportResponse(AddressReport report) {
        Address addr = report.getAddress();
        return AdminReportResponse.builder()
                .id(report.getId())
                .reason(report.getReason())
                .comment(report.getComment())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .addressId(addr.getId())
                .addressCode(addr.getCode())
                .addressZone(addr.getZone())
                .addressQuartier(addr.getQuartier())
                .addressLocationType(addr.getLocationType())
                .addressDescription(addr.getDescription())
                .addressPhotoUrl(addr.getPhotoUrl())
                .addressStatus(addr.getStatus())
                .build();
    }
}

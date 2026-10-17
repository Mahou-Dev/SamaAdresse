package sn.samaadresse.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.samaadresse.domain.entity.ReservedCode;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.ReservedCodeStatus;
import sn.samaadresse.domain.model.GeoQuartier;
import sn.samaadresse.dto.ReservedCodeResponse;
import sn.samaadresse.repository.ReservedCodeRepository;
import sn.samaadresse.security.RateLimiterService;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservedCodeService {

    private static final int MAX_ACTIVE_RESERVATIONS_PER_USER = 40;
    private static final int TARGET_ACTIVE_PER_QUARTIER = 3;
    private static final int HOURLY_RATE_LIMIT = 5;
    private static final Set<String> ALLOWED_ZONES = Set.of("ZIG", "DKR");

    private final ReservedCodeRepository reservedCodeRepository;
    private final AddressCodeGenerator addressCodeGenerator;
    private final GeoGridService geoGridService;
    private final RateLimiterService rateLimiterService;

    @Transactional
    public List<ReservedCodeResponse> topUpReservations(User user, String zoneParam) {
        if (zoneParam == null || zoneParam.isBlank()) {
            throw new IllegalArgumentException("Le paramètre zone est obligatoire (ZIG ou DKR).");
        }
        String zone = zoneParam.trim().toUpperCase();
        if (!ALLOWED_ZONES.contains(zone)) {
            throw new IllegalArgumentException("Zone géographique non couverte : " + zone + " (doit être ZIG ou DKR).");
        }

        // 1. Limitation de débit (5 appels par heure par utilisateur)
        rateLimiterService.checkHourlyRateLimit("res-codes", user.getId().toString(), HOURLY_RATE_LIMIT);

        Instant now = Instant.now();

        // 2. Nettoyage proactif des réservations expirées pour cet utilisateur
        List<ReservedCode> userReservations = reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(
                user, ReservedCodeStatus.RESERVED, Instant.EPOCH);
        for (ReservedCode r : userReservations) {
            if (r.getStatus() == ReservedCodeStatus.RESERVED && r.getExpiresAt().isBefore(now)) {
                r.setStatus(ReservedCodeStatus.EXPIRED);
                reservedCodeRepository.save(r);
            }
        }

        // 3. Calcul du plafond global de l'utilisateur (max 40 actives)
        long currentTotalActive = reservedCodeRepository.countByUserAndStatusAndExpiresAtAfter(
                user, ReservedCodeStatus.RESERVED, now);

        // 4. Liste des quartiers pour la zone demandée
        List<GeoQuartier> zoneQuartiers = geoGridService.getAllQuartiers().stream()
                .filter(q -> q.getZoneCode().equalsIgnoreCase(zone))
                .toList();

        List<ReservedCode> newlyCreated = new ArrayList<>();

        for (GeoQuartier q : zoneQuartiers) {
            if (currentTotalActive >= MAX_ACTIVE_RESERVATIONS_PER_USER) {
                log.info("[RESERVATION] Plafond global atteint pour l'utilisateur {} ({} actives)",
                        user.getId(), currentTotalActive);
                break;
            }

            long currentQuartierCount = reservedCodeRepository.countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(
                    user, zone, q.getCode(), ReservedCodeStatus.RESERVED, now);

            if (currentQuartierCount < TARGET_ACTIVE_PER_QUARTIER) {
                int toGenerate = (int) (TARGET_ACTIVE_PER_QUARTIER - currentQuartierCount);
                for (int i = 0; i < toGenerate; i++) {
                    if (currentTotalActive >= MAX_ACTIVE_RESERVATIONS_PER_USER) {
                        break;
                    }

                    String code = addressCodeGenerator.generateCode(zone, q.getCode());
                    ReservedCode reservation = ReservedCode.builder()
                            .code(code)
                            .user(user)
                            .zone(zone)
                            .quartier(q.getCode())
                            .status(ReservedCodeStatus.RESERVED)
                            .createdAt(now)
                            .expiresAt(now.plus(Duration.ofDays(30)))
                            .build();

                    reservedCodeRepository.save(reservation);
                    newlyCreated.add(reservation);
                    currentTotalActive++;
                }
            }
        }

        log.info("[RESERVATION] {} nouveaux codes réservés générés pour l'utilisateur {} dans la zone {} (Total actif : {})",
                newlyCreated.size(), user.getId(), zone, currentTotalActive);

        return getActiveReservations(user);
    }

    @Transactional(readOnly = true)
    public List<ReservedCodeResponse> getActiveReservations(User user) {
        Instant now = Instant.now();
        List<ReservedCode> active = reservedCodeRepository.findByUserAndStatusAndExpiresAtAfter(
                user, ReservedCodeStatus.RESERVED, now);

        return active.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ReservedCodeResponse mapToResponse(ReservedCode entity) {
        return ReservedCodeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .zone(entity.getZone())
                .quartier(entity.getQuartier())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .build();
    }
}

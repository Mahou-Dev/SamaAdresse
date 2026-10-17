package sn.samaadresse.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.ReservedCode;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.ReservedCodeStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservedCodeRepository extends JpaRepository<ReservedCode, UUID> {

    List<ReservedCode> findByUserAndStatusAndExpiresAtAfter(User user, ReservedCodeStatus status, Instant now);

    List<ReservedCode> findByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(
            User user, String zone, String quartier, ReservedCodeStatus status, Instant now);

    long countByUserAndStatusAndExpiresAtAfter(User user, ReservedCodeStatus status, Instant now);

    long countByUserAndZoneAndQuartierAndStatusAndExpiresAtAfter(
            User user, String zone, String quartier, ReservedCodeStatus status, Instant now);

    Optional<ReservedCode> findByCode(String code);

    boolean existsByCode(String code);

    List<ReservedCode> findByStatusAndExpiresAtBefore(ReservedCodeStatus status, Instant now);
}

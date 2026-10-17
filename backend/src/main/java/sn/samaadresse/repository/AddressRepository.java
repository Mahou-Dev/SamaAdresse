package sn.samaadresse.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    boolean existsByCode(String code);

    Optional<Address> findByCode(String code);

    Optional<Address> findByCodeAndStatus(String code, AddressStatus status);

    List<Address> findByOwnerOrderByCreatedAtDesc(User owner);

    @Query(
        value = "SELECT a FROM Address a " +
                "WHERE a.status = sn.samaadresse.domain.enums.AddressStatus.ACTIVE " +
                "AND a.listed = true " +
                "AND (:quartier IS NULL OR a.quartier = :quartier) " +
                "AND (:type IS NULL OR a.locationType = :type) " +
                "AND (" +
                "   :qNorm IS NULL OR :qNorm = '' " +
                "   OR LOWER(a.code) LIKE LOWER(CONCAT('%', :qRaw, '%')) " +
                "   OR LOWER(a.searchText) LIKE LOWER(CONCAT('%', :qNorm, '%'))" +
                ") " +
                "ORDER BY " +
                "   CASE WHEN UPPER(a.code) = UPPER(:exactCode) THEN 0 ELSE 1 END, " +
                "   a.createdAt DESC",
        countQuery = "SELECT COUNT(a) FROM Address a " +
                "WHERE a.status = sn.samaadresse.domain.enums.AddressStatus.ACTIVE " +
                "AND a.listed = true " +
                "AND (:quartier IS NULL OR a.quartier = :quartier) " +
                "AND (:type IS NULL OR a.locationType = :type) " +
                "AND (" +
                "   :qNorm IS NULL OR :qNorm = '' " +
                "   OR LOWER(a.code) LIKE LOWER(CONCAT('%', :qRaw, '%')) " +
                "   OR LOWER(a.searchText) LIKE LOWER(CONCAT('%', :qNorm, '%'))" +
                ")"
    )
    Page<Address> searchDirectory(
            @Param("qRaw") String qRaw,
            @Param("qNorm") String qNorm,
            @Param("exactCode") String exactCode,
            @Param("quartier") String quartier,
            @Param("type") LocationType type,
            Pageable pageable
    );
}

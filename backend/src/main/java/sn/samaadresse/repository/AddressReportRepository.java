package sn.samaadresse.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.AddressReport;
import sn.samaadresse.domain.enums.ReportStatus;

import java.util.List;
import java.util.UUID;

@Repository
public interface AddressReportRepository extends JpaRepository<AddressReport, UUID> {

    Page<AddressReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AddressReport> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    List<AddressReport> findByAddressIdAndStatus(UUID addressId, ReportStatus status);
}

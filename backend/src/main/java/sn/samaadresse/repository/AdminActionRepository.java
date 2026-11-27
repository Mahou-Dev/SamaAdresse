package sn.samaadresse.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.AdminAction;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdminActionRepository extends JpaRepository<AdminAction, UUID> {

    List<AdminAction> findByAddressIdOrderByCreatedAtDesc(UUID addressId);

    Page<AdminAction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

package sn.samaadresse.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.AddressStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    boolean existsByCode(String code);

    Optional<Address> findByCode(String code);

    Optional<Address> findByCodeAndStatus(String code, AddressStatus status);

    List<Address> findByOwnerOrderByCreatedAtDesc(User owner);
}

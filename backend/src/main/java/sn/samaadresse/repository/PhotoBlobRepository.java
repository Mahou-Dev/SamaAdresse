package sn.samaadresse.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.PhotoBlob;

import java.util.UUID;

@Repository
public interface PhotoBlobRepository extends JpaRepository<PhotoBlob, UUID> {
}

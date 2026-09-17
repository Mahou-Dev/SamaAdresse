package sn.samaadresse.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import sn.samaadresse.domain.entity.RefreshToken;
import sn.samaadresse.domain.entity.User;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    void deleteByUser(User user);

    @Modifying
    void deleteByTokenHash(String tokenHash);
}

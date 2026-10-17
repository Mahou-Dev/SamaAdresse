package sn.samaadresse.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.samaadresse.domain.enums.ReservedCodeStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reserved_codes", indexes = {
        @Index(name = "idx_reserved_codes_code", columnList = "code", unique = true),
        @Index(name = "idx_reserved_codes_user_status", columnList = "user_id, status"),
        @Index(name = "idx_reserved_codes_user_zq", columnList = "user_id, zone, quartier, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservedCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String zone;

    @Column(nullable = false, length = 10)
    private String quartier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReservedCodeStatus status = ReservedCodeStatus.RESERVED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "address_id")
    private UUID addressId;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.expiresAt == null) {
            this.expiresAt = this.createdAt.plus(java.time.Duration.ofDays(30));
        }
        if (this.status == null) {
            this.status = ReservedCodeStatus.RESERVED;
        }
    }
}

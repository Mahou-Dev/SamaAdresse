package sn.samaadresse.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_actions", indexes = {
        @Index(name = "idx_admin_action_address", columnList = "address_id"),
        @Index(name = "idx_admin_action_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "admin_id")
    private UUID adminId;

    @Column(name = "admin_email", nullable = false, length = 150)
    private String adminEmail;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "address_id", nullable = false)
    private UUID addressId;

    @Column(name = "address_code", nullable = false, length = 20)
    private String addressCode;

    @Column(name = "report_id")
    private UUID reportId;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}

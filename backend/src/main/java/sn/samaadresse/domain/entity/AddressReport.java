package sn.samaadresse.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.samaadresse.domain.enums.ReportReason;
import sn.samaadresse.domain.enums.ReportStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "address_reports", indexes = {
        @Index(name = "idx_report_address", columnList = "address_id"),
        @Index(name = "idx_report_status", columnList = "status"),
        @Index(name = "idx_report_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ReportReason reason;

    @Column(length = 300)
    private String comment;

    @Column(name = "ip_hash", nullable = false, length = 64)
    private String ipHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.status == null) {
            this.status = ReportStatus.OPEN;
        }
    }
}

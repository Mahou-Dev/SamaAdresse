package sn.samaadresse.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "addresses", indexes = {
        @Index(name = "idx_address_code", columnList = "code", unique = true),
        @Index(name = "idx_address_owner", columnList = "owner_id"),
        @Index(name = "idx_address_status", columnList = "status"),
        @Index(name = "idx_address_directory", columnList = "status, listed")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, updatable = false, length = 20)
    private String code;

    @Column(nullable = false, updatable = false)
    private Double latitude;

    @Column(nullable = false, updatable = false)
    private Double longitude;

    @Column(nullable = false, updatable = false, length = 20)
    private String zone;

    @Column(nullable = false, updatable = false, length = 20)
    private String quartier;

    @Column(length = 500)
    private String description;

    @Column(name = "photo_url")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 30)
    private LocationType locationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AddressStatus status = AddressStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private boolean listed = false;

    @Column(name = "show_owner_name", nullable = false)
    @Builder.Default
    private boolean showOwnerName = false;

    @Column(name = "search_text", length = 1000)
    private String searchText;

    @Column(name = "suspended_reason", length = 500)
    private String suspendedReason;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = AddressStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}

package sn.samaadresse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.domain.enums.LocationType;
import sn.samaadresse.domain.enums.ReportReason;
import sn.samaadresse.domain.enums.ReportStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportResponse {
    private UUID id;
    private ReportReason reason;
    private String comment;
    private ReportStatus status;
    private Instant createdAt;
    private Instant resolvedAt;

    private UUID addressId;
    private String addressCode;
    private String addressZone;
    private String addressQuartier;
    private LocationType addressLocationType;
    private String addressDescription;
    private String addressPhotoUrl;
    private AddressStatus addressStatus;
}

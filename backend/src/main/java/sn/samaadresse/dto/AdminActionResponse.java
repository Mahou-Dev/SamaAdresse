package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Entrée du journal d'audit administratif (admin_actions)")
public class AdminActionResponse {

    private UUID id;
    private UUID adminId;
    private String adminEmail;
    private String action;
    private UUID addressId;
    private String addressCode;
    private UUID reportId;
    private String reason;
    private Instant createdAt;
}

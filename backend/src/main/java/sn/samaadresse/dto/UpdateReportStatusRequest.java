package sn.samaadresse.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sn.samaadresse.domain.enums.ReportStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateReportStatusRequest {

    @NotNull(message = "Le statut est obligatoire.")
    private ReportStatus status;

    @Size(max = 500, message = "Le motif ne peut pas dépasser 500 caractères.")
    private String reason;
}

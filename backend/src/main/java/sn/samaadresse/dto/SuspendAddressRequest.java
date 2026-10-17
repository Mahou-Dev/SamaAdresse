package sn.samaadresse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuspendAddressRequest {

    @NotBlank(message = "Le motif de suspension est obligatoire.")
    @Size(max = 500, message = "Le motif ne peut pas dépasser 500 caractères.")
    private String reason;
}

package sn.samaadresse.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Résultat de l'envoi du SMS de partage")
public record ShareSmsResponse(
        @Schema(example = "SENT") String status,
        @Schema(example = "+221 77 *** ** 03") String maskedPhone
) {
    public static ShareSmsResponse sent(String maskedPhone) {
        return new ShareSmsResponse("SENT", maskedPhone);
    }
}

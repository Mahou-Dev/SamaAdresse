package sn.samaadresse.sms;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Configuration du partage SMS (préfixe {@code sms.*} dans application.yml).
 * Toutes les valeurs sensibles proviennent de variables d'environnement : aucun secret en dur.
 */
@Data
@Component
@ConfigurationProperties(prefix = "sms")
public class SmsProperties {

    /** mock | twilio | sendflash (variable SMS_PROVIDER, défaut : mock). */
    private String provider = "mock";

    /** Délai maximal d'attente de la réponse du fournisseur. */
    private Duration timeout = Duration.ofSeconds(5);

    /** SMS maximum par utilisateur connecté et par heure. */
    private int userHourlyLimit = 5;

    /** SMS maximum vers un même numéro destinataire par 24 h. */
    private int recipientDailyLimit = 3;

    /** Plafond global de SMS envoyés par la plateforme par 24 h (variable SMS_DAILY_CAP). */
    private int dailyCap = 200;

    private Twilio twilio = new Twilio();

    private SendFlash sendflash = new SendFlash();

    @Data
    public static class Twilio {
        private String accountSid;
        private String authToken;
        private String fromNumber;
        private String apiBaseUrl = "https://api.twilio.com";
    }

    @Data
    public static class SendFlash {
        private String apiUrl;
        private String apiKey;
        private String senderId;
    }
}

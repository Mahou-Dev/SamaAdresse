package sn.samaadresse.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Fournisseur SendFlash — SQUELETTE.
 * <p>
 * La configuration est lue (SENDFLASH_API_URL, SENDFLASH_API_KEY, SENDFLASH_SENDER_ID),
 * mais l'appel HTTP n'est PAS implémenté : le format de l'API SendFlash n'est pas documenté
 * dans ce projet et ne doit pas être deviné.
 * <p>
 * Tant que ce n'est pas complété, tout envoi lève {@link SmsProviderException}
 * (« SendFlash non configuré »), converti en HTTP 502 côté client.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sms.provider", havingValue = "sendflash")
public class SendFlashSmsProvider implements SmsProvider {

    private final SmsProperties.SendFlash config;

    public SendFlashSmsProvider(SmsProperties properties) {
        this.config = properties.getSendflash();
        if (!StringUtils.hasText(config.getApiUrl())
                || !StringUtils.hasText(config.getApiKey())
                || !StringUtils.hasText(config.getSenderId())) {
            log.warn("SMS_PROVIDER=sendflash : SENDFLASH_API_URL, SENDFLASH_API_KEY ou SENDFLASH_SENDER_ID manquant.");
        }
        log.warn("SMS_PROVIDER=sendflash : intégration non implémentée, tous les envois échoueront (502).");
    }

    @Override
    public SmsResult send(String toE164, String message) {
        // TODO(SendFlash) : implémenter l'appel HTTP une fois la documentation officielle fournie :
        //   1. URL exacte de l'endpoint d'envoi et méthode HTTP (base : config.getApiUrl())
        //   2. Mode d'authentification (en-tête, nom du header, format de config.getApiKey())
        //   3. Format du corps (JSON / form) : noms des champs destinataire, expéditeur
        //      (config.getSenderId()), message ; format du numéro attendu (E.164 avec ou sans '+')
        //   4. Format de la réponse : champ identifiant du message, codes d'erreur
        //   5. Utiliser un RestClient avec les mêmes timeouts que TwilioSmsProvider
        throw new SmsProviderException("SendFlash non configuré");
    }

    @Override
    public String name() {
        return "sendflash";
    }
}

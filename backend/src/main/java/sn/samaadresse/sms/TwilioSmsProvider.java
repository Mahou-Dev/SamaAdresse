package sn.samaadresse.sms;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.regex.Pattern;

/**
 * Envoi via l'API REST Twilio (Programmable Messaging).
 * <p>
 * POST {apiBaseUrl}/2010-04-01/Accounts/{AccountSid}/Messages.json
 * (form-urlencoded : To, From ou MessagingServiceSid, Body ; authentification Basic AccountSid:AuthToken).
 * <p>
 * Variables requises : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (ou TWILIO_FROM_NUMBER).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sms.provider", havingValue = "twilio")
public class TwilioSmsProvider implements SmsProvider {

    private static final Pattern E164_PATTERN = Pattern.compile("^\\+[1-9]\\d{7,14}$");

    private final SmsProperties.Twilio config;
    private final RestClient restClient;

    public TwilioSmsProvider(SmsProperties properties) {
        this.config = properties.getTwilio();
        if (!StringUtils.hasText(config.getAccountSid())
                || !StringUtils.hasText(config.getAuthToken())
                || !StringUtils.hasText(config.getFromNumber())) {
            throw new IllegalStateException(
                    "SMS_PROVIDER=twilio mais TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_FROM est manquant.");
        }

        Duration timeout = properties.getTimeout();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(Math.min(3, timeout.toSeconds())));
        requestFactory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(config.getApiBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeaders(h -> h.setBasicAuth(config.getAccountSid(), config.getAuthToken()))
                .build();
    }

    @Override
    public SmsResult send(String toE164, String message) {
        String maskedTo = PhoneMasker.mask(toE164);
        if (toE164 == null || !E164_PATTERN.matcher(toE164.trim()).matches()) {
            log.warn("[SMS-TWILIO] Numéro destinataire invalide refusé ({})", maskedTo);
            throw new SmsProviderException("Numéro destinataire invalide (format E.164 requis)");
        }
        if (!StringUtils.hasText(message)) {
            throw new SmsProviderException("Le corps du SMS ne peut pas être vide");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", toE164.trim());
        String fromOrService = config.getFromNumber().trim();
        if (fromOrService.startsWith("MG")) {
            form.add("MessagingServiceSid", fromOrService);
        } else {
            form.add("From", fromOrService);
        }
        form.add("Body", message);

        try {
            JsonNode body = restClient.post()
                    .uri("/2010-04-01/Accounts/{sid}/Messages.json", config.getAccountSid())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);

            String sid = body != null && body.hasNonNull("sid") ? body.get("sid").asText() : null;
            log.info("[SMS-TWILIO] SMS accepté vers {} (sid={})", maskedTo, sid);
            return SmsResult.accepted(sid);
        } catch (RestClientResponseException e) {
            log.warn("[SMS-TWILIO] Échec d'envoi vers {} (HTTP {})", maskedTo, e.getStatusCode().value());
            throw new SmsProviderException("Twilio a refusé l'envoi (HTTP " + e.getStatusCode().value() + ")", e);
        } catch (RestClientException e) {
            log.warn("[SMS-TWILIO] Erreur réseau vers {} ({})", maskedTo, e.getClass().getSimpleName());
            throw new SmsProviderException("Twilio injoignable : " + e.getClass().getSimpleName(), e);
        }
    }

    @Override
    public String name() {
        return "twilio";
    }
}

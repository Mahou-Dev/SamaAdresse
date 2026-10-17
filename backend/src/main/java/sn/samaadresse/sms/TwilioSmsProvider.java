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

/**
 * Envoi via l'API REST Twilio (Programmable Messaging).
 * <p>
 * POST {apiBaseUrl}/2010-04-01/Accounts/{AccountSid}/Messages.json
 * (form-urlencoded : To, From, Body ; authentification Basic AccountSid:AuthToken).
 * <p>
 * Variables requises : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sms.provider", havingValue = "twilio")
public class TwilioSmsProvider implements SmsProvider {

    private final SmsProperties.Twilio config;
    private final RestClient restClient;

    public TwilioSmsProvider(SmsProperties properties) {
        this.config = properties.getTwilio();
        if (!StringUtils.hasText(config.getAccountSid())
                || !StringUtils.hasText(config.getAuthToken())
                || !StringUtils.hasText(config.getFromNumber())) {
            throw new IllegalStateException(
                    "SMS_PROVIDER=twilio mais TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_FROM_NUMBER est manquant.");
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
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", toE164);
        form.add("From", config.getFromNumber());
        form.add("Body", message);

        try {
            JsonNode body = restClient.post()
                    .uri("/2010-04-01/Accounts/{sid}/Messages.json", config.getAccountSid())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);

            String sid = body != null && body.hasNonNull("sid") ? body.get("sid").asText() : null;
            return SmsResult.accepted(sid);
        } catch (RestClientResponseException e) {
            // Le corps de la réponse Twilio peut contenir des détails : logs serveur uniquement
            throw new SmsProviderException("Twilio a refusé l'envoi (HTTP " + e.getStatusCode().value() + ")", e);
        } catch (RestClientException e) {
            throw new SmsProviderException("Twilio injoignable : " + e.getClass().getSimpleName(), e);
        }
    }

    @Override
    public String name() {
        return "twilio";
    }
}

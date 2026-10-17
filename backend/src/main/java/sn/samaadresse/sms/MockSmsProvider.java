package sn.samaadresse.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fournisseur factice (mode par défaut en dev et en tests).
 * N'envoie rien : journalise le message avec le numéro MASQUÉ.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sms.provider", havingValue = "mock", matchIfMissing = true)
public class MockSmsProvider implements SmsProvider {

    @Override
    public SmsResult send(String toE164, String message) {
        String id = "mock-" + UUID.randomUUID();
        log.info("[SMS-MOCK] to={} len={} id={} message=\"{}\"",
                PhoneMasker.mask(toE164), message.length(), id, message);
        return SmsResult.accepted(id);
    }

    @Override
    public String name() {
        return "mock";
    }
}

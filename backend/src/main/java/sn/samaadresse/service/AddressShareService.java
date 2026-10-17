package sn.samaadresse.service;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.dto.ShareSmsResponse;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.SmsDeliveryException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.sms.GsmCharset;
import sn.samaadresse.sms.PhoneMasker;
import sn.samaadresse.sms.SmsProperties;
import sn.samaadresse.sms.SmsProvider;
import sn.samaadresse.sms.SmsRateLimiter;
import sn.samaadresse.sms.SmsResult;

import java.time.Duration;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Partage d'une adresse par SMS.
 * <ul>
 *   <li>le numéro destinataire n'est jamais persisté ; il n'apparaît que masqué dans les logs</li>
 *   <li>le message ne contient aucune donnée du propriétaire</li>
 *   <li>l'appel fournisseur est borné par {@code sms.timeout} (5 s) ; tout échec → 502</li>
 * </ul>
 */
@Slf4j
@Service
public class AddressShareService {

    /** Code le plus long possible (zone 3 + quartier 3 + 4 chiffres), pour la vérification au démarrage. */
    private static final String LONGEST_CODE_SAMPLE = "AAA-AAA-0000";

    private final AddressRepository addressRepository;
    private final SmsProvider smsProvider;
    private final SmsRateLimiter rateLimiter;
    private final Duration timeout;
    private final String frontendBaseUrl;
    private final ExecutorService executor;

    public AddressShareService(
            AddressRepository addressRepository,
            SmsProvider smsProvider,
            SmsRateLimiter rateLimiter,
            SmsProperties smsProperties,
            @Value("${frontend.base.url}") String frontendBaseUrl
    ) {
        if (!StringUtils.hasText(frontendBaseUrl)) {
            throw new IllegalStateException("FRONTEND_BASE_URL doit être défini pour construire les liens de partage.");
        }
        this.addressRepository = addressRepository;
        this.smsProvider = smsProvider;
        this.rateLimiter = rateLimiter;
        this.timeout = smsProperties.getTimeout();
        this.frontendBaseUrl = frontendBaseUrl.trim().replaceAll("/+$", "");

        String sample = buildMessage(LONGEST_CODE_SAMPLE);
        if (!GsmCharset.fitsInSingleSms(sample)) {
            throw new IllegalStateException(
                    "FRONTEND_BASE_URL produit un SMS non conforme (> 160 caractères ou hors GSM-7) : " + sample.length() + " caractères.");
        }

        AtomicInteger threadIndex = new AtomicInteger();
        this.executor = new ThreadPoolExecutor(
                2, 8, 60, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(50),
                r -> {
                    Thread t = new Thread(r, "sms-sender-" + threadIndex.incrementAndGet());
                    t.setDaemon(true);
                    return t;
                },
                new ThreadPoolExecutor.AbortPolicy()
        );
    }

    public ShareSmsResponse shareBySms(String rawCode, String phoneE164, String currentUserEmail) {
        String code = rawCode.trim().toUpperCase();
        String masked = PhoneMasker.mask(phoneE164);

        addressRepository.findByCodeAndStatus(code, AddressStatus.ACTIVE)
                .orElseThrow(() -> new AddressNotFoundException("Adresse non trouvée ou inactive : " + code));

        // Quota consommé avant l'appel fournisseur et non remboursé en cas d'échec (anti-abus)
        rateLimiter.checkAndConsume(currentUserEmail, phoneE164);

        String message = buildMessage(code);
        if (!GsmCharset.fitsInSingleSms(message)) {
            throw new IllegalStateException("Message SMS non conforme pour le code " + code);
        }

        SmsResult result = sendWithTimeout(phoneE164, message, masked, code);
        log.info("[SMS-SHARE] provider={} code={} to={} id={}",
                smsProvider.name(), code, masked, result.providerMessageId());
        return ShareSmsResponse.sent(masked);
    }

    /** Message GSM-7, une ligne, sans emoji ni donnée personnelle. */
    public String buildMessage(String code) {
        return "SamaAdresse : adresse " + code
                + ". Voir la fiche et l'itinéraire : " + frontendBaseUrl + "/a/" + code;
    }

    private SmsResult sendWithTimeout(String phoneE164, String message, String masked, String code) {
        CompletableFuture<SmsResult> future;
        try {
            future = CompletableFuture.supplyAsync(() -> smsProvider.send(phoneE164, message), executor);
        } catch (RejectedExecutionException e) {
            log.error("[SMS-SHARE] file d'envoi saturée code={} to={}", code, masked);
            throw new SmsDeliveryException("File d'envoi SMS saturée", e);
        }

        try {
            SmsResult result = future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (result == null || !result.success()) {
                throw new SmsDeliveryException("Le fournisseur n'a pas accepté le message", null);
            }
            return result;
        } catch (TimeoutException e) {
            future.cancel(true);
            log.error("[SMS-SHARE] timeout fournisseur={} après {} ms code={} to={}",
                    smsProvider.name(), timeout.toMillis(), code, masked);
            throw new SmsDeliveryException("Timeout du fournisseur SMS", e);
        } catch (ExecutionException e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            log.error("[SMS-SHARE] échec fournisseur={} code={} to={} cause={}",
                    smsProvider.name(), code, masked, cause.getMessage());
            throw new SmsDeliveryException("Échec du fournisseur SMS", cause);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            future.cancel(true);
            throw new SmsDeliveryException("Envoi SMS interrompu", e);
        }
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }
}

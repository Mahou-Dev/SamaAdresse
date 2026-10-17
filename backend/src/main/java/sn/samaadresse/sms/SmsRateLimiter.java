package sn.samaadresse.sms;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.security.HashUtils;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Limites anti-fraude du partage SMS (en mémoire uniquement, Bucket4j) :
 * <ol>
 *   <li>par utilisateur connecté : {@code sms.user-hourly-limit} SMS / heure (défaut 5)</li>
 *   <li>par numéro destinataire : {@code sms.recipient-daily-limit} SMS / 24 h (défaut 3) —
 *       la clé est le SHA-256 du numéro, jamais le numéro en clair</li>
 *   <li>plafond global plateforme : {@code sms.daily-cap} SMS / 24 h (SMS_DAILY_CAP, défaut 200)</li>
 * </ol>
 * Les trois limites sont vérifiées et consommées de manière atomique sous verrou dédié (ReentrantLock)
 * pour éviter tout dépassement sous requêtes concurrentes.
 */
@Component
public class SmsRateLimiter {

    static final String USER_LIMIT_MESSAGE =
            "Limite atteinte : vous pouvez envoyer %d SMS par heure. Réessayez plus tard ou partagez via WhatsApp.";
    static final String RECIPIENT_LIMIT_MESSAGE =
            "Ce numéro a déjà reçu le nombre maximal de SMS SamaAdresse pour aujourd'hui (%d par 24 h).";
    static final String GLOBAL_LIMIT_MESSAGE =
            "Le quota quotidien d'envoi de SMS de la plateforme est atteint. Réessayez demain ou partagez via WhatsApp.";

    private final SmsProperties properties;
    private final Map<String, Bucket> userBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> recipientBuckets = new ConcurrentHashMap<>();
    private final Bucket globalBucket;
    private final ReentrantLock lock = new ReentrantLock(true);

    public SmsRateLimiter(SmsProperties properties) {
        this.properties = properties;
        this.globalBucket = newBucket(properties.getDailyCap(), Duration.ofDays(1));
    }

    /**
     * Vérifie et consomme un jeton sur les trois limites de façon strictement atomique,
     * ou lève {@link RateLimitExceededException}.
     */
    public void checkAndConsume(String userKey, String recipientE164) {
        lock.lock();
        try {
            Bucket user = userBuckets.computeIfAbsent(userKey,
                    k -> newBucket(properties.getUserHourlyLimit(), Duration.ofHours(1)));
            Bucket recipient = recipientBuckets.computeIfAbsent(HashUtils.hashSha256(recipientE164),
                    k -> newBucket(properties.getRecipientDailyLimit(), Duration.ofDays(1)));

            if (user.getAvailableTokens() < 1) {
                throw new RateLimitExceededException(USER_LIMIT_MESSAGE.formatted(properties.getUserHourlyLimit()));
            }
            if (recipient.getAvailableTokens() < 1) {
                throw new RateLimitExceededException(RECIPIENT_LIMIT_MESSAGE.formatted(properties.getRecipientDailyLimit()));
            }
            if (globalBucket.getAvailableTokens() < 1) {
                throw new RateLimitExceededException(GLOBAL_LIMIT_MESSAGE);
            }

            user.tryConsume(1);
            recipient.tryConsume(1);
            globalBucket.tryConsume(1);
        } finally {
            lock.unlock();
        }
    }

    private static Bucket newBucket(int capacity, Duration period) {
        int safeCapacity = Math.max(1, capacity);
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(safeCapacity)
                        .refillIntervally(safeCapacity, period)
                        .build())
                .build();
    }
}

package sn.samaadresse.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;
import sn.samaadresse.exception.RateLimitExceededException;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Limitation de débit pour les signalements anonymes d'adresses (en mémoire, Bucket4j, clés hachées en SHA-256) :
 * <ul>
 *   <li>3 signalements maximum par heure et par adresse IP</li>
 *   <li>1 signalement maximum par adresse géolocalisée, par adresse IP et par 24 heures</li>
 * </ul>
 */
@Component
public class ReportRateLimiter {

    public static final String RATE_LIMIT_MESSAGE = "Trop de signalements, réessayez plus tard";

    private final Map<String, Bucket> ipHourlyBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> ipAddressDailyBuckets = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock(true);

    /**
     * Vérifie et consomme un jeton pour (clientIp, addressCode) de manière atomique,
     * et renvoie le hash SHA-256 de l'adresse IP.
     */
    public String checkAndConsume(String clientIp, String addressCode) {
        String safeIp = (clientIp == null || clientIp.isBlank()) ? "0.0.0.0" : clientIp.trim();
        String ipHash = HashUtils.hashSha256(safeIp);
        String ipAddressKey = HashUtils.hashSha256(safeIp + ":" + addressCode.trim().toUpperCase());

        lock.lock();
        try {
            Bucket ipBucket = ipHourlyBuckets.computeIfAbsent(ipHash,
                    k -> newBucket(3, Duration.ofHours(1)));
            Bucket addrBucket = ipAddressDailyBuckets.computeIfAbsent(ipAddressKey,
                    k -> newBucket(1, Duration.ofDays(1)));

            if (addrBucket.getAvailableTokens() < 1 || ipBucket.getAvailableTokens() < 1) {
                throw new RateLimitExceededException(RATE_LIMIT_MESSAGE);
            }

            addrBucket.tryConsume(1);
            ipBucket.tryConsume(1);
            return ipHash;
        } finally {
            lock.unlock();
        }
    }

    public void reset() {
        lock.lock();
        try {
            ipHourlyBuckets.clear();
            ipAddressDailyBuckets.clear();
        } finally {
            lock.unlock();
        }
    }

    private static Bucket newBucket(int capacity, Duration period) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillIntervally(capacity, period)
                        .build())
                .build();
    }
}

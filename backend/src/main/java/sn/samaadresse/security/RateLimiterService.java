package sn.samaadresse.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.stereotype.Service;
import sn.samaadresse.exception.RateLimitExceededException;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public boolean tryConsume(String key) {
        Bucket bucket = cache.computeIfAbsent(key, this::createNewBucket);
        return bucket.tryConsume(1);
    }

    public void checkRateLimit(String prefix, String clientIp, int requestsPerMinute) {
        String safeIp = (clientIp == null || clientIp.isBlank()) ? "0.0.0.0" : clientIp.trim();
        String key = prefix + ":" + HashUtils.hashSha256(safeIp);

        Bucket bucket = cache.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(requestsPerMinute)
                        .refillIntervally(requestsPerMinute, Duration.ofMinutes(1))
                        .build())
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfter = Math.max(1L, (probe.getNanosToWaitForRefill() + 999_999_999L) / 1_000_000_000L);
            throw new RateLimitExceededException("Trop de requêtes. Veuillez patienter avant de réessayer.", retryAfter);
        }
    }

    public void checkHourlyRateLimit(String prefix, String identifier, int requestsPerHour) {
        String safeId = (identifier == null || identifier.isBlank()) ? "anonymous" : identifier.trim();
        String key = prefix + ":" + safeId;

        Bucket bucket = cache.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(requestsPerHour)
                        .refillIntervally(requestsPerHour, Duration.ofHours(1))
                        .build())
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfter = Math.max(1L, (probe.getNanosToWaitForRefill() + 999_999_999L) / 1_000_000_000L);
            throw new RateLimitExceededException("Limite de réservations atteinte (" + requestsPerHour + " par heure). Veuillez patienter avant de renouveler vos codes.", retryAfter);
        }
    }

    public void reset() {
        cache.clear();
    }

    private Bucket createNewBucket(String key) {
        Bandwidth limit = Bandwidth.builder()
            .capacity(100)
            .refillIntervally(100, Duration.ofMinutes(1))
            .build();

        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
}

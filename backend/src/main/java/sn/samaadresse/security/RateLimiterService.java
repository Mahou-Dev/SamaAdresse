package sn.samaadresse.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

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

    private Bucket createNewBucket(String key) {
        Bandwidth limit = Bandwidth.builder()
            .capacity(5)
            .refillIntervally(5, Duration.ofMinutes(1))
            .build();

        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
}

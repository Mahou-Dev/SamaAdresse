package sn.samaadresse.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenExpirationMs;

    public JwtProvider(String secret, long accessTokenExpirationMs) {
        this(secret, accessTokenExpirationMs, null);
    }

    @Autowired
    public JwtProvider(
        @Value("${jwt.secret:}") String secret,
        @Value("${jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
        Environment environment
    ) {
        boolean isProd = environment != null && environment.acceptsProfiles(Profiles.of("prod"));
        if (StringUtils.hasText(secret)) {
            byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
            if (secretBytes.length < 32) {
                throw new IllegalStateException("JWT_SECRET doit contenir au moins 32 octets (256 bits).");
            }
            this.key = Keys.hmacShaKeyFor(secretBytes);
        } else if (isProd) {
            throw new IllegalStateException("JWT_SECRET est obligatoire en profil prod et doit contenir au moins 32 octets.");
        } else {
            // Clé éphémère aléatoire en mémoire pour les tests ou le développement sans JWT_SECRET défini
            this.key = Jwts.SIG.HS256.key().build();
        }
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getId().toString())
            .claim("role", user.getRole().name())
            .claim("fullName", user.getFullName())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getSubject();
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return UUID.fromString(claims.get("userId", String.class));
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}

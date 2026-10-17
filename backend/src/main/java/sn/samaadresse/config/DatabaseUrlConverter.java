package sn.samaadresse.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Convertisseur d'URL de base de données (ex: Neon / Render postgres://user:pass@host:port/db?sslmode=require)
 * vers les propriétés JDBC Spring Boot (jdbc:postgresql://host:port/db?sslmode=require + username + password).
 */
public final class DatabaseUrlConverter {

    private DatabaseUrlConverter() {
    }

    public record JdbcConnectionDetails(String jdbcUrl, String username, String password) {}

    public static JdbcConnectionDetails convert(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("DATABASE_URL ne peut pas être vide.");
        }
        String trimmed = rawUrl.trim();
        if (trimmed.startsWith("jdbc:postgresql://")) {
            return new JdbcConnectionDetails(trimmed, null, null);
        }
        if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) {
            throw new IllegalArgumentException("Schéma DATABASE_URL non supporté (attendu postgres://, postgresql:// ou jdbc:postgresql://)");
        }

        URI uri = URI.create(trimmed);
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Hôte manquant dans DATABASE_URL");
        }
        int port = uri.getPort();
        String path = uri.getRawPath();
        if (path == null || path.isBlank() || "/".equals(path)) {
            throw new IllegalArgumentException("Nom de base de données manquant dans DATABASE_URL");
        }
        String query = uri.getRawQuery();

        String username = null;
        String password = null;
        String rawUserInfo = uri.getRawUserInfo();
        if (rawUserInfo != null && !rawUserInfo.isEmpty()) {
            int colonIdx = rawUserInfo.indexOf(':');
            if (colonIdx >= 0) {
                username = URLDecoder.decode(rawUserInfo.substring(0, colonIdx), StandardCharsets.UTF_8);
                password = URLDecoder.decode(rawUserInfo.substring(colonIdx + 1), StandardCharsets.UTF_8);
            } else {
                username = URLDecoder.decode(rawUserInfo, StandardCharsets.UTF_8);
            }
        }

        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(host);
        if (port != -1) {
            jdbc.append(':').append(port);
        }
        jdbc.append(path);
        if (query != null && !query.isBlank()) {
            jdbc.append('?').append(query);
        }

        return new JdbcConnectionDetails(jdbc.toString(), username, password);
    }
}

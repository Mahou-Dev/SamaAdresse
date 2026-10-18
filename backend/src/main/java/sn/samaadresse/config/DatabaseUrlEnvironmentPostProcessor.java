package sn.samaadresse.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.Profiles;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 1. En environnement hors prod (dev/e2e/tests), charge automatiquement les variables du fichier .env local
 *    (non suivi par Git) si elles ne sont pas déjà définies dans l'environnement système.
 * 2. Intercepte la variable DATABASE_URL (format postgres://user:pass@host:port/db?sslmode=require)
 *    pour la convertir en propriétés JDBC Spring Boot (spring.datasource.url/username/password).
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> props = new HashMap<>();

        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        if (!isProd) {
            loadDotEnvIfPresent(environment, props);
        }

        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (!StringUtils.hasText(databaseUrl) && props.containsKey("DATABASE_URL")) {
            databaseUrl = String.valueOf(props.get("DATABASE_URL"));
        }

        if (StringUtils.hasText(databaseUrl)) {
            DatabaseUrlConverter.JdbcConnectionDetails details = DatabaseUrlConverter.convert(databaseUrl);
            props.put("spring.datasource.url", details.jdbcUrl());
            props.put("DB_URL", details.jdbcUrl());
            if (StringUtils.hasText(details.username())) {
                props.put("spring.datasource.username", details.username());
                props.put("DB_USERNAME", details.username());
                props.put("DB_USER", details.username());
            }
            if (details.password() != null) {
                props.put("spring.datasource.password", details.password());
                props.put("DB_PASSWORD", details.password());
            }
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("samaAdresseEnvProperties", props));
        }
    }

    private void loadDotEnvIfPresent(ConfigurableEnvironment environment, Map<String, Object> props) {
        for (String candidate : List.of(".env", "../.env")) {
            Path path = Paths.get(candidate).toAbsolutePath().normalize();
            if (Files.exists(path) && Files.isRegularFile(path)) {
                try {
                    for (String line : Files.readAllLines(path)) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }
                        int eq = trimmed.indexOf('=');
                        if (eq <= 0) {
                            continue;
                        }
                        String key = trimmed.substring(0, eq).trim();
                        String value = trimmed.substring(eq + 1).trim();
                        if (!value.isEmpty() && !StringUtils.hasText(environment.getProperty(key))) {
                            props.put(key, value);
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}

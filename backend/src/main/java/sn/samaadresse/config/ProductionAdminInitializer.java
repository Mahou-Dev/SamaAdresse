package sn.samaadresse.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.repository.UserRepository;

/**
 * Initialiseur d'administrateur et validateur de configuration en production (profil !dev).
 * <p>
 * - Vérifie que FRONTEND_BASE_URL commence par https:// (ou http://localhost pour le test Docker local).
 * - Si ADMIN_EMAIL et ADMIN_PASSWORD sont définis, exige ADMIN_PASSWORD >= 12 caractères
 *   et crée l'administrateur de manière idempotente sans jamais écraser un compte existant.
 */
@Slf4j
@Component
@Profile("!dev")
@RequiredArgsConstructor
public class ProductionAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${frontend.base.url:}")
    private String frontendBaseUrl;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        validateFrontendBaseUrl(frontendBaseUrl);

        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.info("[ADMIN-INIT] Variables ADMIN_EMAIL ou ADMIN_PASSWORD non définies. Aucun administrateur initial créé.");
            return;
        }

        String trimmedPassword = adminPassword.trim();
        if (trimmedPassword.length() < 12) {
            throw new IllegalStateException("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.info("[ADMIN-INIT] L'administrateur initial '{}' existe déjà en base de données (non écrasé).", normalizedEmail);
            return;
        }

        User admin = User.builder()
                .fullName("Administrateur")
                .email(normalizedEmail)
                .phoneNumber("+221700000000")
                .passwordHash(passwordEncoder.encode(trimmedPassword))
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        userRepository.save(admin);
        log.info("[ADMIN-INIT] Administrateur initial de production créé avec succès pour : {}", normalizedEmail);
    }

    public static void validateFrontendBaseUrl(String url) {
        if (url == null || url.isBlank()) {
            return; // Géré par Spring si injecté en tant que requis
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("https://")
                || trimmed.startsWith("http://localhost:")
                || trimmed.equals("http://localhost")
                || trimmed.startsWith("http://127.0.0.1:")) {
            return;
        }
        throw new IllegalStateException("En production, FRONTEND_BASE_URL doit commencer par https:// (reçu : " + trimmed + ")");
    }
}

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
 * Initialiseur d'administrateur en production (profil !dev).
 * <p>
 * En environnement de production, l'administrateur initial est configuré
 * STRICTEMENT via les variables d'environnement ADMIN_EMAIL et ADMIN_PASSWORD,
 * SANS AUCUNE VALEUR PAR DÉFAUT.
 * Si l'une des deux variables est absente ou vide, aucun administrateur n'est créé.
 * </p>
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

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.info("[ADMIN-INIT] Variables ADMIN_EMAIL ou ADMIN_PASSWORD non définies. Aucun administrateur initial créé.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.info("[ADMIN-INIT] L'administrateur initial '{}' existe déjà en base de données.", normalizedEmail);
            return;
        }

        User admin = User.builder()
                .fullName("Administrateur")
                .email(normalizedEmail)
                .phoneNumber("+221700000000")
                .passwordHash(passwordEncoder.encode(adminPassword.trim()))
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        userRepository.save(admin);
        log.info("[ADMIN-INIT] Administrateur initial de production créé avec succès pour : {}", normalizedEmail);
    }
}

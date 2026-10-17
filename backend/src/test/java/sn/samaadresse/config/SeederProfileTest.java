package sn.samaadresse.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.repository.UserRepository;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests de validation de la sécurité des seeders selon le profil d'exécution (dev vs prod).
 */
class SeederProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(UserRepository.class, () -> mock(UserRepository.class))
            .withBean(sn.samaadresse.repository.AddressRepository.class, () -> mock(sn.samaadresse.repository.AddressRepository.class))
            .withBean(PasswordEncoder.class, () -> new BCryptPasswordEncoder(4))
            .withUserConfiguration(DemoDataSeeder.class, ProductionAdminInitializer.class);

    @Test
    @DisplayName("1. Profil prod : DemoDataSeeder n'est PAS actif ni instancié")
    void demoDataSeeder_notActiveUnderProdProfile() {
        contextRunner
                .withPropertyValues("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DemoDataSeeder.class);
                    assertThat(context).hasSingleBean(ProductionAdminInitializer.class);
                });
    }

    @Test
    @DisplayName("2. Profil dev : DemoDataSeeder EST actif, ProductionAdminInitializer est inactif")
    void demoDataSeeder_activeUnderDevProfile() {
        contextRunner
                .withPropertyValues("spring.profiles.active=dev")
                .run(context -> {
                    assertThat(context).hasSingleBean(DemoDataSeeder.class);
                    assertThat(context).doesNotHaveBean(ProductionAdminInitializer.class);
                });
    }

    @Test
    @DisplayName("3. Profil prod sans ADMIN_EMAIL/ADMIN_PASSWORD : aucun admin n'est créé")
    void productionAdminInitializer_missingCredentials_doesNotCreateAdmin() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

        ProductionAdminInitializer initializer = new ProductionAdminInitializer(userRepository, passwordEncoder);

        initializer.run(new DefaultApplicationArguments());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("4. Profil prod avec ADMIN_EMAIL/ADMIN_PASSWORD : crée l'admin avec rôle ADMIN")
    void productionAdminInitializer_withCredentials_createsAdmin() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
        when(userRepository.existsByEmail("prod-admin@samaadresse.sn")).thenReturn(false);

        ProductionAdminInitializer initializer = new ProductionAdminInitializer(userRepository, passwordEncoder);

        Field emailField = ProductionAdminInitializer.class.getDeclaredField("adminEmail");
        emailField.setAccessible(true);
        emailField.set(initializer, "prod-admin@samaadresse.sn");

        Field passField = ProductionAdminInitializer.class.getDeclaredField("adminPassword");
        passField.setAccessible(true);
        passField.set(initializer, "SuperSecretProdPass2026!");

        initializer.run(new DefaultApplicationArguments());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());

        User created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo("prod-admin@samaadresse.sn");
        assertThat(created.getRole()).isEqualTo(Role.ADMIN);
        assertThat(created.isEnabled()).isTrue();
        assertThat(passwordEncoder.matches("SuperSecretProdPass2026!", created.getPasswordHash())).isTrue();
    }
}

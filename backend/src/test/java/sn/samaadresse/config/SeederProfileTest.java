package sn.samaadresse.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.entity.User;
import sn.samaadresse.domain.enums.Role;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.repository.UserRepository;
import sn.samaadresse.service.PhotoStorage;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests de validation de la sécurité des seeders et de l'initialisation admin en production (A2, A4).
 */
class SeederProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(UserRepository.class, () -> mock(UserRepository.class))
            .withBean(AddressRepository.class, () -> mock(AddressRepository.class))
            .withBean(PhotoStorage.class, () -> mock(PhotoStorage.class))
            .withBean(PasswordEncoder.class, () -> new BCryptPasswordEncoder(4))
            .withUserConfiguration(DemoDataSeeder.class, ProductionAdminInitializer.class);

    @Test
    @DisplayName("1. Profil prod par défaut (DEMO_SEED=false) : DemoDataSeeder n'est PAS actif ni instancié")
    void demoDataSeeder_notActiveUnderProdProfileByDefault() {
        contextRunner
                .withPropertyValues("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DemoDataSeeder.class);
                    assertThat(context).hasSingleBean(ProductionAdminInitializer.class);
                });
    }

    @Test
    @DisplayName("2. Profil prod avec DEMO_SEED=true : DemoDataSeeder EST instancié")
    void demoDataSeeder_activeUnderProdWhenDemoSeedTrue() {
        contextRunner
                .withPropertyValues("spring.profiles.active=prod", "demo.seed=true", "demo.password=StrongDemoPass2026!")
                .run(context -> {
                    assertThat(context).hasSingleBean(DemoDataSeeder.class);
                    assertThat(context).hasSingleBean(ProductionAdminInitializer.class);
                });
    }

    @Test
    @DisplayName("3. Profil dev : DemoDataSeeder EST actif, ProductionAdminInitializer est inactif")
    void demoDataSeeder_activeUnderDevProfile() {
        contextRunner
                .withPropertyValues("spring.profiles.active=dev")
                .run(context -> {
                    assertThat(context).hasSingleBean(DemoDataSeeder.class);
                    assertThat(context).doesNotHaveBean(ProductionAdminInitializer.class);
                });
    }

    @Test
    @DisplayName("4. DEMO_SEED=true sans DEMO_PASSWORD : lève IllegalStateException")
    void demoDataSeeder_whenDemoSeedTrueWithoutPassword_throwsIllegalStateException() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
        DemoDataSeeder seeder = new DemoDataSeeder(userRepository, null, passwordEncoder, null);
        seeder.setDemoSeedExplicit(true);
        seeder.setDemoPassword("");

        assertThatThrownBy(() -> seeder.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEMO_PASSWORD");
    }

    @Test
    @DisplayName("5. DEMO_SEED=true avec DEMO_PASSWORD : crée les comptes, adresses (ZIG-KBG-4271, ZIG-ESC-1042 listées) et photos via PhotoStorage")
    void demoDataSeeder_withPasswordAndPhotoStorage_seedsIdempotently() {
        UserRepository userRepository = mock(UserRepository.class);
        AddressRepository addressRepository = mock(AddressRepository.class);
        PhotoStorage photoStorage = mock(PhotoStorage.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(addressRepository.existsByCode(anyString())).thenReturn(false);
        when(photoStorage.storeSeedPhoto(any(UUID.class), any(byte[].class), anyString()))
                .thenAnswer(inv -> "/uploads/" + inv.getArgument(0) + ".jpg");

        DemoDataSeeder seeder = new DemoDataSeeder(userRepository, addressRepository, passwordEncoder, photoStorage);
        seeder.setDemoSeedExplicit(true);
        seeder.setDemoPassword("DemoSecure2026!");

        seeder.run(new DefaultApplicationArguments());

        verify(userRepository, times(3)).save(any(User.class));
        verify(photoStorage, times(3)).storeSeedPhoto(any(UUID.class), any(byte[].class), eq("image/jpeg"));

        ArgumentCaptor<Address> addrCaptor = ArgumentCaptor.forClass(Address.class);
        verify(addressRepository, times(12)).save(addrCaptor.capture());

        assertThat(addrCaptor.getAllValues())
                .filteredOn(Address::isListed)
                .extracting(Address::getCode)
                .containsExactlyInAnyOrder("ZIG-KBG-4271", "ZIG-ESC-1042");
    }

    @Test
    @DisplayName("6. Profil prod sans ADMIN_EMAIL/ADMIN_PASSWORD : aucun admin n'est créé")
    void productionAdminInitializer_missingCredentials_doesNotCreateAdmin() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

        ProductionAdminInitializer initializer = new ProductionAdminInitializer(userRepository, passwordEncoder);
        initializer.run(new DefaultApplicationArguments());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("7. Profil prod avec ADMIN_PASSWORD < 12 caractères : lève IllegalStateException")
    void productionAdminInitializer_shortPassword_throwsIllegalStateException() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

        ProductionAdminInitializer initializer = new ProductionAdminInitializer(userRepository, passwordEncoder);
        setField(initializer, "adminEmail", "prod-admin@samaadresse.sn");
        setField(initializer, "adminPassword", "Short123!");

        assertThatThrownBy(() -> initializer.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("12 caractères");
    }

    @Test
    @DisplayName("8. Profil prod avec ADMIN_EMAIL/ADMIN_PASSWORD >= 12 car. : crée l'admin et n'écrase jamais s'il existe déjà")
    void productionAdminInitializer_withCredentials_createsAdminOnceAndNeverOverwrites() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
        when(userRepository.existsByEmail("prod-admin@samaadresse.sn")).thenReturn(false, true);

        ProductionAdminInitializer initializer = new ProductionAdminInitializer(userRepository, passwordEncoder);
        setField(initializer, "adminEmail", "prod-admin@samaadresse.sn");
        setField(initializer, "adminPassword", "SuperSecretProdPass2026!");
        setField(initializer, "frontendBaseUrl", "https://samaadresse.onrender.com");

        initializer.run(new DefaultApplicationArguments());
        initializer.run(new DefaultApplicationArguments()); // Second appel idempotent

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());

        User created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo("prod-admin@samaadresse.sn");
        assertThat(created.getRole()).isEqualTo(Role.ADMIN);
        assertThat(created.isEnabled()).isTrue();
        assertThat(passwordEncoder.matches("SuperSecretProdPass2026!", created.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("9. Validation FRONTEND_BASE_URL en production : exige https:// (sauf localhost test Docker)")
    void validateFrontendBaseUrl_enforcesHttpsInProd() {
        ProductionAdminInitializer.validateFrontendBaseUrl("https://samaadresse.onrender.com");
        ProductionAdminInitializer.validateFrontendBaseUrl("http://localhost:8082");

        assertThatThrownBy(() -> ProductionAdminInitializer.validateFrontendBaseUrl("http://samaadresse.onrender.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("https://");
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}

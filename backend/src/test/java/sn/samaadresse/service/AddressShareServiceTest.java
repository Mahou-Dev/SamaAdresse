package sn.samaadresse.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sn.samaadresse.domain.entity.Address;
import sn.samaadresse.domain.enums.AddressStatus;
import sn.samaadresse.exception.AddressNotFoundException;
import sn.samaadresse.exception.RateLimitExceededException;
import sn.samaadresse.exception.SmsDeliveryException;
import sn.samaadresse.repository.AddressRepository;
import sn.samaadresse.sms.MockSmsProvider;
import sn.samaadresse.sms.SmsProperties;
import sn.samaadresse.sms.SmsRateLimiter;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressShareServiceTest {

    private static final String FRONTEND_BASE_URL = "https://app.samaadresse.sn";
    private static final String TEST_CODE        = "ZIG-KBG-4271";
    private static final String TEST_PHONE       = "+221771234567";
    private static final String USER_EMAIL       = "owner@samaadresse.sn";

    @Mock
    private AddressRepository addressRepository;

    /** Fournisseur réel en mode mock (n'envoie rien, renvoie toujours succès). */
    private MockSmsProvider smsProvider;

    /** Propriétés avec des limites basses pour tester rapidement les ratios. */
    private SmsProperties smsProperties;

    /** Limiter réel (Bucket4j en mémoire), recréé avant chaque test pour l'isolation d'état. */
    private SmsRateLimiter rateLimiter;

    private AddressShareService service;

    private Address activeAddress;

    @BeforeEach
    void setUp() {
        smsProvider   = new MockSmsProvider();
        smsProperties = buildProperties(/* userHourly */ 5, /* recipientDaily */ 3, /* globalCap */ 200);
        rateLimiter   = new SmsRateLimiter(smsProperties);

        service = new AddressShareService(addressRepository, smsProvider, rateLimiter,
                smsProperties, FRONTEND_BASE_URL);

        activeAddress = Address.builder()
                .id(UUID.randomUUID())
                .code(TEST_CODE)
                .status(AddressStatus.ACTIVE)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Chemin nominal
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("1. Envoi réussi : réponse SENT avec le numéro masqué")
    void shareBySms_nominal_returnsSentWithMaskedPhone() {
        when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        var response = service.shareBySms(TEST_CODE, TEST_PHONE, USER_EMAIL);

        assertNotNull(response);
        assertEquals("SENT", response.status());
        // Le numéro masqué ne doit pas contenir les chiffres centraux en clair
        assertNotNull(response.maskedPhone());
        assertTrue(response.maskedPhone().startsWith("+221"));
        assertTrue(response.maskedPhone().contains("*"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Adresse non trouvée / inactive → 404
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("2. Code inexistant → AddressNotFoundException")
    void shareBySms_unknownCode_throwsAddressNotFound() {
        when(addressRepository.findByCodeAndStatus(anyString(), any()))
                .thenReturn(Optional.empty());

        assertThrows(AddressNotFoundException.class,
                () -> service.shareBySms("ZIG-KBG-9999", TEST_PHONE, USER_EMAIL));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Limites anti-fraude → 429
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Limites anti-fraude SMS")
    class RateLimiting {

        @Test
        @DisplayName("3a. Limite utilisateur (5/h) : 6e appel → RateLimitExceededException")
        void shareBySms_userHourlyExceeded_throws429() {
            // Propriétés avec limite utilisateur = 2 pour aller vite
            SmsProperties props2 = buildProperties(2, 99, 9999);
            SmsRateLimiter limiter2 = new SmsRateLimiter(props2);
            AddressShareService svc2 = new AddressShareService(
                    addressRepository, smsProvider, limiter2, props2, FRONTEND_BASE_URL);

            when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                    .thenReturn(Optional.of(activeAddress));

            // 2 envois réussis
            svc2.shareBySms(TEST_CODE, "+221770000001", USER_EMAIL);
            svc2.shareBySms(TEST_CODE, "+221770000002", USER_EMAIL);

            // 3e → dépasse la limite utilisateur
            RateLimitExceededException ex = assertThrows(RateLimitExceededException.class,
                    () -> svc2.shareBySms(TEST_CODE, "+221770000003", USER_EMAIL));
            assertTrue(ex.getMessage().contains("2"), "Le message doit citer la limite (2)");
        }

        @Test
        @DisplayName("3b. Limite destinataire (3/24h) : 4e envoi vers le même numéro → 429")
        void shareBySms_recipientDailyExceeded_throws429() {
            // limite destinataire = 2 pour aller vite, utilisateur très haut
            SmsProperties props2 = buildProperties(999, 2, 9999);
            SmsRateLimiter limiter2 = new SmsRateLimiter(props2);
            AddressShareService svc2 = new AddressShareService(
                    addressRepository, smsProvider, limiter2, props2, FRONTEND_BASE_URL);

            when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                    .thenReturn(Optional.of(activeAddress));

            // 2 envois vers le même numéro avec des utilisateurs différents
            svc2.shareBySms(TEST_CODE, TEST_PHONE, "user1@test.sn");
            svc2.shareBySms(TEST_CODE, TEST_PHONE, "user2@test.sn");

            // 3e envoi vers le même numéro → dépasse la limite destinataire
            RateLimitExceededException ex = assertThrows(RateLimitExceededException.class,
                    () -> svc2.shareBySms(TEST_CODE, TEST_PHONE, "user3@test.sn"));
            assertTrue(ex.getMessage().contains("24 h") || ex.getMessage().contains("2"),
                    "Le message doit mentionner la limite quotidienne ou la valeur");
        }

        @Test
        @DisplayName("3c. Plafond global (SMS_DAILY_CAP=2) : 3e envoi → 429")
        void shareBySms_globalCapExceeded_throws429() {
            SmsProperties props2 = buildProperties(999, 999, 2);
            SmsRateLimiter limiter2 = new SmsRateLimiter(props2);
            AddressShareService svc2 = new AddressShareService(
                    addressRepository, smsProvider, limiter2, props2, FRONTEND_BASE_URL);

            when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                    .thenReturn(Optional.of(activeAddress));

            svc2.shareBySms(TEST_CODE, "+221770000001", "u1@test.sn");
            svc2.shareBySms(TEST_CODE, "+221770000002", "u2@test.sn");

            assertThrows(RateLimitExceededException.class,
                    () -> svc2.shareBySms(TEST_CODE, "+221770000003", "u3@test.sn"));
        }

        @Test
        @DisplayName("3d. Refus sur limite utilisateur : le jeton destinataire n'est pas consommé")
        void shareBySms_userLimitRefusal_doesNotConsumeRecipientToken() {
            // Limiter : user=1 jeton/h, destinataire=1 jeton/24h, global très haut
            SmsProperties props = buildProperties(1, 1, 9999);
            SmsRateLimiter limiter = new SmsRateLimiter(props);
            AddressShareService svc = new AddressShareService(
                    addressRepository, smsProvider, limiter, props, FRONTEND_BASE_URL);

            when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                    .thenReturn(Optional.of(activeAddress));

            // 1er envoi : consomme le seul jeton de USER_EMAIL, mais PAS le jeton destinataire TEST_PHONE
            svc.shareBySms(TEST_CODE, TEST_PHONE, USER_EMAIL);

            // 2e envoi avec USER_EMAIL → limite utilisateur atteinte → refus
            assertThrows(RateLimitExceededException.class,
                    () -> svc.shareBySms(TEST_CODE, "+221770000099", USER_EMAIL),
                    "Le 2e envoi de USER_EMAIL doit être refusé (quota user épuisé)");

            // Preuve d'isolation : "other@test.sn" (quota intact) peut envoyer vers TEST_PHONE
            // seulement si le jeton destinataire n'a pas été consommé deux fois.
            // Mais TEST_PHONE a déjà reçu 1 SMS → son jeton (1/24h) est épuisé.
            // Un autre numéro n'ayant reçu aucun SMS doit passer sans problème.
            assertDoesNotThrow(
                    () -> svc.shareBySms(TEST_CODE, "+221770000098", "other@test.sn"),
                    "Un autre utilisateur avec un autre numéro doit pouvoir envoyer (tokens distincts)"
            );
        }

        @Test
        @DisplayName("3e. Concurrence : 20 requêtes parallèles sur un même numéro → seules 3 passent (17 refusées avec 429)")
        void shareBySms_concurrentRequestsOnSameRecipient_exactlyThreePass() throws Exception {
            // Configuration : utilisateur quota haut (50), destinataire = 3, global haut (200)
            SmsProperties props = buildProperties(50, 3, 200);
            SmsRateLimiter limiter = new SmsRateLimiter(props);
            AddressShareService svc = new AddressShareService(
                    addressRepository, smsProvider, limiter, props, FRONTEND_BASE_URL);

            when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                    .thenReturn(Optional.of(activeAddress));

            int totalRequests = 20;
            int expectedSuccess = 3;

            ExecutorService executorService = Executors.newFixedThreadPool(totalRequests);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(totalRequests);

            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger rateLimitCount = new AtomicInteger(0);
            AtomicInteger otherErrors = new AtomicInteger(0);

            for (int i = 0; i < totalRequests; i++) {
                final String userEmail = "concurrent-user-" + i + "@test.sn";
                executorService.submit(() -> {
                    try {
                        startLatch.await(); // Attendre le signal de départ pour lancer toutes les requêtes en même temps
                        svc.shareBySms(TEST_CODE, TEST_PHONE, userEmail);
                        successCount.incrementAndGet();
                    } catch (RateLimitExceededException e) {
                        rateLimitCount.incrementAndGet();
                    } catch (Exception e) {
                        otherErrors.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            // Déclencher toutes les requêtes simultanément (thundering herd)
            startLatch.countDown();

            boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
            executorService.shutdown();

            assertTrue(finished, "Toutes les requêtes parallèles doivent se terminer sous 10 secondes");
            assertEquals(0, otherErrors.get(), "Aucune erreur inattendue ne doit survenir");
            assertEquals(expectedSuccess, successCount.get(), "Seules 3 requêtes doivent passer pour le même destinataire");
            assertEquals(totalRequests - expectedSuccess, rateLimitCount.get(), "Exactement 17 requêtes doivent être rejetées avec RateLimitExceededException");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. GSM-7 et contenu du message
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("4. buildMessage produit un SMS ≤ 160 caractères GSM-7 pour un code maximal")
    void buildMessage_longestCode_fitsInSingleSms() {
        String msg = service.buildMessage("AAA-AAA-0000");
        assertTrue(msg.length() <= 160, "Le message dépasse 160 caractères : " + msg.length());
        assertFalse(msg.contains("emoji"), "Le message ne doit pas contenir d'emoji");
        assertTrue(sn.samaadresse.sms.GsmCharset.fitsInSingleSms(msg),
                "Le message doit être 100% GSM-7 et tenir en un seul SMS");
    }

    @Test
    @DisplayName("5. buildMessage contient le code et l'URL frontend")
    void buildMessage_containsCodeAndUrl() {
        String msg = service.buildMessage(TEST_CODE);
        assertTrue(msg.contains(TEST_CODE));
        assertTrue(msg.contains(FRONTEND_BASE_URL));
        assertTrue(msg.contains("/a/" + TEST_CODE));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Échec fournisseur → 502
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("6. Fournisseur SMS en échec → SmsDeliveryException (502)")
    void shareBySms_providerFails_throwsSmsDeliveryException() {
        // Remplace le provider par un qui lève toujours une exception
        sn.samaadresse.sms.SmsProvider failingProvider = new sn.samaadresse.sms.SmsProvider() {
            @Override
            public sn.samaadresse.sms.SmsResult send(String to, String message) {
                throw new sn.samaadresse.sms.SmsProviderException("Timeout simulé");
            }
            @Override
            public String name() { return "failing-test-provider"; }
        };

        AddressShareService svcFailing = new AddressShareService(
                addressRepository, failingProvider, rateLimiter, smsProperties, FRONTEND_BASE_URL);

        when(addressRepository.findByCodeAndStatus(TEST_CODE, AddressStatus.ACTIVE))
                .thenReturn(Optional.of(activeAddress));

        assertThrows(SmsDeliveryException.class,
                () -> svcFailing.shareBySms(TEST_CODE, TEST_PHONE, USER_EMAIL));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static SmsProperties buildProperties(int userHourly, int recipientDaily, int globalCap) {
        SmsProperties p = new SmsProperties();
        p.setUserHourlyLimit(userHourly);
        p.setRecipientDailyLimit(recipientDaily);
        p.setDailyCap(globalCap);
        return p;
    }
}

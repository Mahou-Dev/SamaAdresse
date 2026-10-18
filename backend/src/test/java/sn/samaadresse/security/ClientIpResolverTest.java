package sn.samaadresse.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import sn.samaadresse.exception.RateLimitExceededException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ClientIpResolverTest {

    @AfterEach
    void resetHops() {
        ClientIpResolver.setConfiguredHops(0);
    }

    @Test
    @DisplayName("Test (a) : Un en-tête True-Client-IP falsifié est strictement ignoré")
    void testA_falsifiedTrueClientIpIsIgnored() {
        ClientIpResolver.setConfiguredHops(1);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("True-Client-IP", "198.51.100.99");
        request.addHeader("X-Forwarded-For", "41.82.100.12");

        // L'IP renvoyée doit provenir de X-Forwarded-For (dernier proxy de confiance) et ignorer True-Client-IP
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("41.82.100.12");
        assertThat(ClientIpResolver.resolve(request)).isNotEqualTo("198.51.100.99");
    }

    @Test
    @DisplayName("Test (b) : Un X-Forwarded-For avec une fausse IP en tête ne change pas la clé du limiteur")
    void testB_xForwardedForFakeHeadDoesNotAlterLimiterKey() {
        ClientIpResolver.setConfiguredHops(1);

        MockHttpServletRequest legitRequest = new MockHttpServletRequest();
        legitRequest.setRemoteAddr("10.0.0.1");
        legitRequest.addHeader("X-Forwarded-For", "41.82.100.12");

        MockHttpServletRequest spoofedRequest = new MockHttpServletRequest();
        spoofedRequest.setRemoteAddr("10.0.0.1");
        // Le client injecte une fausse IP en tête de chaîne : "1.2.3.4, 41.82.100.12"
        spoofedRequest.addHeader("X-Forwarded-For", "1.2.3.4, 41.82.100.12");

        String keyLegit = ClientIpResolver.resolve(legitRequest);
        String keySpoofed = ClientIpResolver.resolve(spoofedRequest);

        // L'IP résolue doit être identique (l'IP légitime ajoutée par le proxy), pas la fausse IP "1.2.3.4"
        assertThat(keyLegit).isEqualTo("41.82.100.12");
        assertThat(keySpoofed).isEqualTo("41.82.100.12");
        assertThat(keySpoofed).isNotEqualTo("1.2.3.4");
    }

    @Test
    @DisplayName("Test (c) : Deux adresses IP différentes ont chacune leur propre quota")
    void testC_differentIpsHaveIndependentQuotas() {
        ClientIpResolver.setConfiguredHops(1);

        RateLimiterService limiter = new RateLimiterService();

        MockHttpServletRequest client1 = new MockHttpServletRequest();
        client1.setRemoteAddr("10.0.0.1");
        client1.addHeader("X-Forwarded-For", "196.207.200.1");

        MockHttpServletRequest client2 = new MockHttpServletRequest();
        client2.setRemoteAddr("10.0.0.1");
        client2.addHeader("X-Forwarded-For", "196.207.200.2");

        String ip1 = ClientIpResolver.resolve(client1);
        String ip2 = ClientIpResolver.resolve(client2);

        assertThat(ip1).isEqualTo("196.207.200.1");
        assertThat(ip2).isEqualTo("196.207.200.2");

        // Consommer le quota du client 1 (limite = 3 requêtes)
        for (int i = 0; i < 3; i++) {
            limiter.checkRateLimit("route_test", ip1, 3);
        }

        // Le client 1 doit être bloqué au 4ème appel
        assertThatThrownBy(() -> limiter.checkRateLimit("route_test", ip1, 3))
                .isInstanceOf(RateLimitExceededException.class);

        // Le client 2 ne doit pas être bloqué car il a son propre quota
        limiter.checkRateLimit("route_test", ip2, 3);
    }

    @Test
    @DisplayName("Test (d) : Sans proxy (hops=0), l'adresse distante directe getRemoteAddr() est utilisée")
    void testD_withoutProxyRemoteAddrIsUsed() {
        ClientIpResolver.setConfiguredHops(0);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");
        // Même si un client envoie des en-têtes forgés, ils doivent être ignorés sans proxy configuré
        request.addHeader("X-Forwarded-For", "8.8.8.8, 9.9.9.9");
        request.addHeader("CF-Connecting-IP", "1.1.1.1");
        request.addHeader("True-Client-IP", "2.2.2.2");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("192.168.1.50");
    }

    @Test
    @DisplayName("Vérification CF-Connecting-IP lorsque hops > 0")
    void testCfConnectingIpWhenBehindProxy() {
        ClientIpResolver.setConfiguredHops(1);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("CF-Connecting-IP", "154.65.22.10");
        request.addHeader("X-Forwarded-For", "1.2.3.4, 154.65.22.10");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("154.65.22.10");
    }
}

package sn.samaadresse.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

/**
 * Extraction sécurisée de l'adresse IP cliente derrière un proxy inverse (Render / Cloudflare).
 * <p>
 * Règles de sécurité (Lot 8b) :
 * 1. L'en-tête {@code True-Client-IP} est <b>strictement ignoré</b> car falsifiable par le client.
 * 2. Le premier élément de {@code X-Forwarded-For} n'est <b>jamais utilisé directement</b>, car un client
 *    malveillant peut préfixer cet en-tête d'adresses arbitraires pour contourner le rate limiting.
 * 3. En production derrière Render (infrastructure Cloudflare + Render Load Balancer) :
 *    - Si {@code CF-Connecting-IP} est présent (injecté et garanti par Cloudflare Edge), il est utilisé.
 *    - Sinon, l'adresse insérée par le dernier proxy de confiance dans {@code X-Forwarded-For} est extraite :
 *      élément à l'index {@code (taille - TRUSTED_PROXY_HOPS)}.
 * 4. Sans proxy (développement local, {@code TRUSTED_PROXY_HOPS <= 0}), l'adresse distante directe
 *    {@code request.getRemoteAddr()} est utilisée.
 * <p>
 * Référence documentation Render : <a href="https://render.com/docs/load-balancers">Render Load Balancers & Headers</a>
 */
@Component
public final class ClientIpResolver {

    private static volatile int configuredHops = initDefaultHops();

    public ClientIpResolver(@Value("${app.security.trusted-proxy-hops:0}") int hops) {
        configuredHops = hops;
    }

    private static int initDefaultHops() {
        String env = System.getenv("TRUSTED_PROXY_HOPS");
        if (env != null && !env.isBlank()) {
            try {
                return Integer.parseInt(env.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return 0;
    }

    public static void setConfiguredHops(int hops) {
        configuredHops = hops;
    }

    public static int getConfiguredHops() {
        return configuredHops;
    }

    public static String resolve(HttpServletRequest request) {
        return resolve(request, configuredHops);
    }

    public static String resolve(HttpServletRequest request, int trustedHops) {
        if (request == null) {
            return "0.0.0.0";
        }

        // Si aucun proxy de confiance n'est configuré (ex: dev local, trustedHops <= 0),
        // on ne fait confiance à AUCUN en-tête client : seule la socket distante fait foi.
        if (trustedHops <= 0) {
            String remoteAddr = request.getRemoteAddr();
            return StringUtils.hasText(remoteAddr) ? remoteAddr.trim() : "0.0.0.0";
        }

        // 1. CF-Connecting-IP : injecté par Cloudflare Edge sur Render
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (StringUtils.hasText(cfConnectingIp)) {
            return cfConnectingIp.trim();
        }

        // 2. X-Forwarded-For : client_forged, proxy1, client_real, render_proxy
        // L'élément ajouté par le dernier proxy de confiance se trouve à (taille - trustedHops)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            List<String> parts = Arrays.stream(xForwardedFor.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .toList();
            if (!parts.isEmpty()) {
                int targetIndex = Math.max(0, parts.size() - trustedHops);
                return parts.get(targetIndex);
            }
        }

        // Fallback si aucun en-tête proxy
        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr.trim() : "0.0.0.0";
    }
}

package sn.samaadresse.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * Extraction de l'adresse IP cliente derrière le proxy inverse de Render (Cloudflare + Render Load Balancer).
 * <p>
 * Hypothèse documentée (README) :
 * 1. Si l'en-tête {@code True-Client-IP} ou {@code CF-Connecting-IP} est fourni par la couche Cloudflare de Render,
 *    il contient directement l'adresse IP publique du visiteur.
 * 2. Sinon, l'en-tête standard {@code X-Forwarded-For} est inspecté : le premier élément valide de la liste
 *    (format {@code client, proxy1, proxy2}) est extrait.
 * 3. En dernier recours (connexion directe en développement local), {@code request.getRemoteAddr()} est utilisé.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return "0.0.0.0";
        }

        String trueClientIp = request.getHeader("True-Client-IP");
        if (StringUtils.hasText(trueClientIp)) {
            return sanitizeIp(trueClientIp);
        }

        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (StringUtils.hasText(cfConnectingIp)) {
            return sanitizeIp(cfConnectingIp);
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            String[] parts = xForwardedFor.split(",");
            for (String part : parts) {
                String candidate = sanitizeIp(part);
                if (!candidate.isEmpty()) {
                    return candidate;
                }
            }
        }

        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr.trim() : "0.0.0.0";
    }

    private static String sanitizeIp(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim();
    }
}

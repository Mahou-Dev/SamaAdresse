package sn.samaadresse.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import sn.samaadresse.security.JwtAuthenticationFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    public static final String CSP_REPORT_ONLY_VALUE =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; " +
            "connect-src 'self'; " +
            "worker-src 'self'; " +
            "manifest-src 'self'; " +
            "frame-ancestors 'none'";

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final Environment environment;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean isDev = environment.acceptsProfiles(Profiles.of("dev", "e2e"));
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));

        http
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> {
                headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::deny);
                headers.contentTypeOptions(withDefaults -> {});
                if (!isProd) {
                    headers.httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable);
                }
            })
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentification requise\",\"path\":\"" + request.getRequestURI() + "\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Accès refusé : privilèges insuffisants\",\"path\":\"" + request.getRequestURI() + "\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    AntPathRequestMatcher.antMatcher("/api/health"),
                    AntPathRequestMatcher.antMatcher("/api/auth/register"),
                    AntPathRequestMatcher.antMatcher("/api/auth/login"),
                    AntPathRequestMatcher.antMatcher("/api/auth/refresh"),
                    AntPathRequestMatcher.antMatcher("/api/auth/logout"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/addresses/*"),
                    AntPathRequestMatcher.antMatcher("/api/addresses/*/qrcode"),
                    AntPathRequestMatcher.antMatcher("/api/public/**"),
                    AntPathRequestMatcher.antMatcher("/uploads/**"),
                    AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                    AntPathRequestMatcher.antMatcher("/v3/api-docs"),
                    AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                    AntPathRequestMatcher.antMatcher("/swagger-ui.html")
                ).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher("/api/admin/**")).hasRole("ADMIN")
                .requestMatchers(AntPathRequestMatcher.antMatcher("/api/**")).authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(securityAndCacheHeadersFilter(isProd), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        if (isDev) {
            http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        } else {
            http.cors(AbstractHttpConfigurer::disable);
        }

        return http.build();
    }

    private OncePerRequestFilter securityAndCacheHeadersFilter(boolean isProd) {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                response.setHeader("X-Content-Type-Options", "nosniff");
                response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
                response.setHeader("Permissions-Policy", "geolocation=(self), camera=(self)");
                response.setHeader("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY_VALUE);
                if (isProd) {
                    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
                }

                String uri = request.getRequestURI();
                if (uri != null) {
                    if (uri.startsWith("/assets/")) {
                        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                    } else if (isNoCacheStaticOrSpaRoute(uri)) {
                        response.setHeader("Cache-Control", "no-cache");
                    }
                }

                filterChain.doFilter(request, response);
            }
        };
    }

    public static boolean isNoCacheStaticOrSpaRoute(String uri) {
        if ("/".equals(uri)
                || "/index.html".equals(uri)
                || "/sw.js".equals(uri)
                || "/registerSW.js".equals(uri)
                || "/manifest.webmanifest".equals(uri)
                || (uri.startsWith("/workbox-") && uri.endsWith(".js"))) {
            return true;
        }
        if (uri.startsWith("/api/") || uri.equals("/api")
                || uri.startsWith("/uploads/")
                || uri.startsWith("/assets/")
                || uri.startsWith("/icons/")
                || uri.startsWith("/v3/api-docs")
                || uri.startsWith("/swagger-ui")) {
            return false;
        }
        String lastSegment = uri.contains("/") ? uri.substring(uri.lastIndexOf('/') + 1) : uri;
        return !lastSegment.contains(".");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

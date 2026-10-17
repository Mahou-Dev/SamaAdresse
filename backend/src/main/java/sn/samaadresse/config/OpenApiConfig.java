package sn.samaadresse.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "SamaAdresse API",
                version = "1.0.0",
                description = "API REST de la plateforme citoyenne d'adressage numérique par géolocalisation GPS et QR Code (Ziguinchor, Dakar, Saint-Louis).",
                contact = @Contact(name = "Projet SamaAdresse", email = "contact@samaadresse.sn")
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Jeton d'accès JWT obtenu via POST /api/auth/login ou POST /api/auth/refresh"
)
public class OpenApiConfig {
}

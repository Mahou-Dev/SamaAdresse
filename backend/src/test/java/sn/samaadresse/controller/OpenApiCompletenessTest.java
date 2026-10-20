package sn.samaadresse.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test de complétude OpenAPI (Lot 8 — Partie B3) :
 * Parcourt tous les handlers Spring (hors error et springdoc) et échoue si un endpoint
 * est absent de /v3/api-docs ou dépourvu de résumé (summary) ou de réponses (responses).
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiCompletenessTest {

    @org.springframework.test.context.DynamicPropertySource
    static void configureDataSource(org.springframework.test.context.DynamicPropertyRegistry registry) {
        try (java.net.Socket s = new java.net.Socket()) {
            s.connect(new java.net.InetSocketAddress("127.0.0.1", 5434), 200);
        } catch (Exception e) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:samaadresse_openapi_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Test
    @DisplayName("B3 : Tous les endpoints Spring sont présents dans /v3/api-docs avec un résumé et des réponses documentées")
    void allSpringControllerEndpointsAreDocumentedInOpenApi() throws Exception {
        String apiDocsJson = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        String apiDocsYaml = mockMvc.perform(get("/v3/api-docs.yaml"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        java.nio.file.Path apiDir = java.nio.file.Paths.get("..", "docs", "api").toAbsolutePath().normalize();
        java.nio.file.Files.createDirectories(apiDir);
        java.nio.file.Files.writeString(apiDir.resolve("openapi.yaml"), apiDocsYaml, java.nio.charset.StandardCharsets.UTF_8);
        java.nio.file.Files.writeString(apiDir.resolve("openapi.json"), apiDocsJson, java.nio.charset.StandardCharsets.UTF_8);

        JsonNode root = objectMapper.readTree(apiDocsJson);
        JsonNode pathsNode = root.get("paths");
        assertThat(pathsNode).isNotNull();

        List<String> errors = new ArrayList<>();
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = handlerMapping.getHandlerMethods();

        int checkedCount = 0;
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
            HandlerMethod handlerMethod = entry.getValue();
            String packageName = handlerMethod.getBeanType().getPackageName();
            if (!packageName.startsWith("sn.samaadresse")
                    || org.springframework.boot.web.servlet.error.ErrorController.class.isAssignableFrom(handlerMethod.getBeanType())
                    || handlerMethod.getBeanType().isAnnotationPresent(io.swagger.v3.oas.annotations.Hidden.class)
                    || handlerMethod.hasMethodAnnotation(io.swagger.v3.oas.annotations.Hidden.class)) {
                continue;
            }

            RequestMappingInfo info = entry.getKey();
            Set<String> patterns = info.getPatternValues();
            Set<RequestMethod> methods = info.getMethodsCondition().getMethods();

            for (String rawPattern : patterns) {
                // Normaliser les expressions regex de path variable (ex: /uploads/{filename:.+} -> /uploads/{filename})
                String openApiPath = rawPattern.replaceAll("\\{([^:}]+):[^}]+}", "{$1}");
                JsonNode pathItem = pathsNode.get(openApiPath);
                if (pathItem == null) {
                    errors.add("Endpoint absent de /v3/api-docs : " + openApiPath + " (" + handlerMethod.getShortLogMessage() + ")");
                    continue;
                }

                for (RequestMethod method : methods) {
                    checkedCount++;
                    String httpVerb = method.name().toLowerCase();
                    JsonNode operation = pathItem.get(httpVerb);
                    if (operation == null) {
                        errors.add("Méthode HTTP " + method + " absente sur " + openApiPath);
                        continue;
                    }

                    String summary = operation.path("summary").asText("");
                    if (summary.isBlank()) {
                        errors.add("Résumé (summary) manquant pour " + method + " " + openApiPath);
                    }

                    JsonNode responses = operation.get("responses");
                    if (responses == null || responses.isEmpty()) {
                        errors.add("Aucune réponse documentée pour " + method + " " + openApiPath);
                    }
                }
            }
        }

        assertThat(checkedCount).isGreaterThanOrEqualTo(18);
        assertThat(errors)
                .withFailMessage("Incomplétudes OpenAPI détectées :\n- " + String.join("\n- ", errors))
                .isEmpty();
    }
}

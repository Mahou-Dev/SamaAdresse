package sn.samaadresse.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Configuration MVC pour le service mono-origine en production :
 * - /assets/** servi avec Cache-Control: public, max-age=31536000, immutable
 * - Fichiers statiques de la PWA (sw.js, manifest.webmanifest, workbox-*.js, icons/**)
 * - Repli SPA vers index.html pour toutes les routes clientes (hors /api/**, /uploads/**, /v3/api-docs*, /swagger-ui*)
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        if (resourcePath.startsWith("api/") || "api".equals(resourcePath)
                                || resourcePath.startsWith("uploads/") || "uploads".equals(resourcePath)
                                || resourcePath.startsWith("v3/api-docs")
                                || resourcePath.startsWith("swagger-ui")) {
                            return null;
                        }

                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }

                        String lastSegment = resourcePath.contains("/")
                                ? resourcePath.substring(resourcePath.lastIndexOf('/') + 1)
                                : resourcePath;
                        if (lastSegment.contains(".")) {
                            return null;
                        }

                        Resource indexHtml = new ClassPathResource("static/index.html");
                        if (indexHtml.exists() && indexHtml.isReadable()) {
                            return indexHtml;
                        }
                        return null;
                    }
                });
    }
}

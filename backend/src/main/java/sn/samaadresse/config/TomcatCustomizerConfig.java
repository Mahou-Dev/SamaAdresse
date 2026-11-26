package sn.samaadresse.config;

import org.apache.catalina.Host;
import org.apache.catalina.core.StandardHost;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatCustomizerConfig {

    @Bean
    public TomcatServletWebServerFactory tomcatServletWebServerFactory() {
        return new TomcatServletWebServerFactory() {
            @Override
            protected void prepareContext(Host host, ServletContextInitializer[] initializers) {
                if (host instanceof StandardHost standardHost) {
                    standardHost.setErrorReportValveClass(JsonErrorReportValve.class.getName());
                }
                super.prepareContext(host, initializers);
            }
        };
    }
}

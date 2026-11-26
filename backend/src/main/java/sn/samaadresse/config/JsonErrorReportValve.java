package sn.samaadresse.config;

import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.apache.catalina.valves.ErrorReportValve;
import org.springframework.http.HttpStatus;

import java.io.Writer;
import java.time.Instant;

/**
 * Valve de rapport d'erreur Tomcat personnalisée pour retourner systématiquement
 * du JSON normalisé et supprimer toute page HTML d'erreur générée par Tomcat
 * (ex: code 400 sur URL malformée avec encodage % invalide).
 */
public class JsonErrorReportValve extends ErrorReportValve {

    public JsonErrorReportValve() {
        super();
        setShowReport(false);
        setShowServerInfo(false);
    }

    @Override
    protected void report(Request request, Response response, Throwable throwable) {
        int status = response.getStatus();
        if (status < 400 || response.getContentWritten() > 0 || !response.isError()) {
            return;
        }

        try {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Writer writer = response.getReporter();
            if (writer != null) {
                HttpStatus httpStatus = HttpStatus.resolve(status);
                String errorReason = (httpStatus != null) ? httpStatus.getReasonPhrase() : "Error";
                String message = (status == 400) ? "Requête invalide ou URL malformée" : errorReason;
                String path = request.getRequestURI() != null ? request.getRequestURI() : "";

                String json = String.format(
                        "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                        Instant.now(),
                        status,
                        errorReason,
                        message,
                        path
                );
                writer.write(json);
                writer.flush();
            }
        } catch (Exception ignored) {
        }
    }
}

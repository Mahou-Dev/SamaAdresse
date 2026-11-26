package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.samaadresse.dto.ErrorResponse;

import java.time.Instant;

/**
 * Contrôleur d'erreur personnalisé gérant les erreurs au niveau conteneur Tomcat / Servlet
 * pour garantir que toute réponse d'erreur soit formatée en JSON standardisé sans exposer
 * la page HTML par défaut de Tomcat.
 */
@Hidden
@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping(value = "/error", produces = {MediaType.APPLICATION_JSON_VALUE, "*/*"})
    public ResponseEntity<ErrorResponse> handleError(HttpServletRequest request) {
        Object statusObj = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        if (statusObj != null) {
            try {
                statusCode = Integer.parseInt(statusObj.toString());
            } catch (NumberFormatException ignored) {}
        }

        HttpStatus status = HttpStatus.resolve(statusCode);
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        Object uriObj = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String path = uriObj != null ? uriObj.toString() : request.getRequestURI();

        Object messageObj = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        String message = (messageObj != null && !messageObj.toString().isBlank())
                ? messageObj.toString()
                : status.getReasonPhrase();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .build();

        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(errorResponse);
    }
}

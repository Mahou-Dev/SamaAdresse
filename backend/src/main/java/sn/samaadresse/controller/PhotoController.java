package sn.samaadresse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;
import sn.samaadresse.service.PhotoStorage;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Photos", description = "Service de restitution des photos de façade avec cache HTTP immuable et ETag")
public class PhotoController {

    private final PhotoStorage photoStorage;

    @Operation(
            summary = "Accès au répertoire des téléversements (interdit/introuvable)",
            description = "Empêche le listage du répertoire /uploads/ et renvoie 404 Not Found."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "404", description = "Répertoire introuvable ou listage interdit")
    })
    @GetMapping(value = {"/uploads", "/uploads/"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<sn.samaadresse.dto.ErrorResponse> uploadsDirectory() {
        sn.samaadresse.dto.ErrorResponse response = sn.samaadresse.dto.ErrorResponse.builder()
                .timestamp(java.time.Instant.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message("Le listage du répertoire /uploads/ est interdit ou introuvable.")
                .path("/uploads/")
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @Operation(
            summary = "Récupérer une photo de façade",
            description = "Sert l'image stockée sur disque (dev) ou en base PostgreSQL bytea (prod) avec Cache-Control: public, max-age=31536000, immutable et ETag."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Photo trouvée et retournée"),
            @ApiResponse(responseCode = "304", description = "Photo non modifiée (ETag valide)"),
            @ApiResponse(responseCode = "404", description = "Photo introuvable")
    })
    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<byte[]> servePhoto(
            @Parameter(description = "Nom du fichier photo (ex: 00000000-0000-4000-8000-000000000001.jpg)")
            @PathVariable String filename,
            WebRequest webRequest
    ) {
        Optional<PhotoStorage.PhotoResource> opt = photoStorage.loadPhoto(filename);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        PhotoStorage.PhotoResource resource = opt.get();
        if (webRequest.checkNotModified(resource.etag())) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                    .eTag(resource.etag())
                    .build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .eTag(resource.etag())
                .contentType(MediaType.parseMediaType(resource.contentType()))
                .body(resource.data());
    }
}

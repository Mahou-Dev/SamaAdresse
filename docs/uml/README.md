# Documentation UML de SamaAdresse

Diagrammes PlantUML confrontés au code source final (sources dans `src/`, rendus PNG et SVG dans `rendus/`, rapport de vérification dans `VERIFICATION.md`).

| Fichier | Contenu |
|---|---|
| `01-cas-utilisation` | Acteurs (Visiteur, Propriétaire, Administrateur, OpenRouteService, fournisseur SMS) et cas d'utilisation |
| `02-classes-domaine` | Modèle du domaine (entités JPA, énumérations, relations) |
| `03a-classes-controleurs-services` | Contrôleurs REST, services et sécurité |
| `03b-classes-services-infrastructure` | Services, infrastructure (SMS, stockage des photos disque/base, limitation de débit) et dépôts JPA |
| `04-seq-creation-en-ligne` | Création d'une adresse en ligne |
| `05-seq-creation-hors-ligne` | Création hors ligne (codes réservés, file d'attente) et synchronisation |
| `06-seq-qr-vers-fiche` | QR code vers fiche publique, avec le cache hors ligne |
| `07-seq-itineraire` | Itinéraire depuis la position courante (OpenRouteService) |
| `08-seq-partage-sms` | Partage de la fiche par SMS |
| `09-seq-signalement-moderation` | Signalement public puis modération |
| `10-seq-authentification` | Connexion, jeton d'accès, rotation du jeton de rafraîchissement |
| `11-seq-annuaire` | Recherche dans l'annuaire |

## Régénérer les rendus

```bash
java -DPLANTUML_LIMIT_SIZE=12000 -jar plantuml.jar -charset UTF-8 -tpng -tsvg -o ../rendus src/*.puml
```
(Graphviz `dot` doit être installé. Le fichier `src/_style.puml` est inclus par chaque diagramme.)

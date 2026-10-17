# Documentation UML de SamaAdresse

Diagrammes PlantUML (sources dans `src/`, rendus PNG et SVG dans `rendus/`).

| Fichier | Contenu |
|---|---|
| `01-cas-utilisation` | Acteurs (Visiteur, Propriétaire, Administrateur, OpenRouteService, fournisseur SMS) et cas d'utilisation |
| `02-classes-domaine` | Modèle du domaine (entités, énumérations, relations) |
| `03a-classes-controleurs-services` | Contrôleurs REST et services |
| `03b-classes-services-infrastructure` | Services, infrastructure (SMS, stockage des photos, limitation de débit, OpenRouteService) et dépôts JPA |
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
java -jar plantuml.jar -charset UTF-8 -tpng -tsvg -o ../rendus src/*.puml
```
(Graphviz `dot` doit être installé. Le fichier `src/_style.puml` est inclus par chaque diagramme.)

## État de validation
Les diagrammes ont été rédigés d'après la conception du projet. Les éléments marqués `<<à confirmer>>`
(annuaire, itinéraire OpenRouteService, codes réservés, stockage des photos en base) dépendent des
derniers lots. Chaque nom de classe, d'attribut et de route doit être confronté au code avant le rendu final.

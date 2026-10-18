#!/usr/bin/env python3
"""
scripts/generate-palette-comparison.py
Génère docs/audit/palette/avant-apres.md présentant les captures avant (Lot 6/7)
et après (Lot 9 — Palette Plus Forte) côte à côte.
"""

import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT_DIR / "docs" / "audit" / "palette" / "avant-apres.md"

PAIRS = [
    {
        "name": "Page d'accueil (Bandeau bleu nuit, bague crème, fond sable doré)",
        "before_360": "../lot6/accueil_360x780.png",
        "after_360": "accueil_360x780.png",
        "before_1440": "../lot6/accueil_1440x900.png",
        "after_1440": "accueil_1440x900.png",
        "notes": "En-tête bleu nuit #12304F, bague crème #FBF7EF autour de la plaque d'adresse, fond de page sable doré #EADFC8.",
    },
    {
        "name": "Connexion (Carte crème, bordure #766B5B, bouton ocre #B84A24)",
        "before_360": "../lot6/connexion_360x780.png",
        "after_360": "connexion_360x780.png",
        "before_1440": "../lot6/connexion_1440x900.png",
        "after_1440": "connexion_1440x900.png",
        "notes": "Formulaire sur carte crème #FBF7EF avec bordure #766B5B, bouton d'action en ocre #B84A24 avec texte blanc pur.",
    },
    {
        "name": "Mes Adresses (Cartes crème, statut bleu, navigation crème)",
        "before_360": "../lot6/mes_adresses_360x780.png",
        "after_360": "mes_adresses_360x780.png",
        "before_1440": "../lot6/mes_adresses_1440x900.png",
        "after_1440": "mes_adresses_1440x900.png",
        "notes": "Cartes des adresses sur fond crème #FBF7EF, barre de navigation basse en crème avec bordure supérieure #766B5B et onglet actif bleu #1D528F.",
    },
    {
        "name": "Fiche Publique (Plaque Terre & Enseigne inchangée, fond sable doré, sections crème)",
        "before_360": "../lot6/fiche_360x780.png",
        "after_360": "fiche_publique_360x780.png",
        "before_1440": "../lot6/fiche_1440x900.png",
        "after_1440": "fiche_publique_1440x900.png",
        "notes": "Plaque réglementaire bleue préservée à l'identique, sections d'informations en crème #FBF7EF sur sable doré #EADFC8.",
    },
    {
        "name": "Annuaire Public (Barre de recherche sans double croix, filtres crème)",
        "before_360": "../lot6/annuaire_360x780.png",
        "after_360": "annuaire_360x780.png",
        "before_1440": "../lot6/annuaire_1440x900.png",
        "after_1440": "annuaire_1440x900.png",
        "notes": "Champs de filtres et résultats en crème #FBF7EF, suppression de l'icône native de réinitialisation WebKit sous WebKit/Blink.",
    },
    {
        "name": "Assistant de création — Étape 2 Détails (Saisie sur carte crème)",
        "before_360": "../lot7/wizard_hors_ligne_validation_360x780.png",
        "after_360": "assistant_etape2_360x780.png",
        "before_1440": "../lot7/wizard_hors_ligne_validation_1440x900.png",
        "after_1440": "assistant_etape2_1440x900.png",
        "notes": "Étapes de création d'adresse avec contraste élevé sur fond crème #FBF7EF et bordures #766B5B.",
    },
    {
        "name": "Plaque Hors Ligne (Mention « Enregistrée sur cet appareil »)",
        "before_360": "../lot7/plaque_hors_ligne_avec_code_reserve_360x780.png",
        "after_360": "plaque_hors_ligne_360x780.png",
        "before_1440": "../lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png",
        "after_1440": "plaque_hors_ligne_1440x900.png",
        "notes": "Affichage immédiat (< 3 s) de la plaque avec code réservé ou provisoire, fond sable doré.",
    },
    {
        "name": "Modale d'avertissement de déconnexion (Alerte sur brouillons non synchronisés)",
        "before_360": "../lot7/modale_avertissement_deconnexion_360x780.png",
        "after_360": "modale_deconnexion_360x780.png",
        "before_1440": "../lot7/modale_avertissement_deconnexion_1440x900.png",
        "after_1440": "modale_deconnexion_1440x900.png",
        "notes": "Modale crème #FBF7EF avec fond de rideau assombri, boutons d'action conformes.",
    },
]

lines = [
    "# Comparatif Avant / Après — Lot 9 (Palette Plus Forte)",
    "",
    "Ce document présente la comparaison visuelle systématique entre l'ancienne palette (Lot 6/7) et la nouvelle identité visuelle renforcée (Lot 9) pour les 8 vues clés de l'application SamaAdresse, aux résolutions 360×780 (mobile) et 1440×900 (desktop).",
    "",
    "## Synthèse des Principes de la Palette Plus Forte",
    "",
    "- **Fond de page :** Sable doré `#EADFC8` (remplace l'ancien fond blanc cassé).",
    "- **Cartes & Conteneurs :** Crème `#FBF7EF` avec bordure `#766B5B` nette (remplace les ombres décoratives lourdes et le blanc pur).",
    "- **En-tête :** Bleu nuit `#12304F` avec logo et typographies en crème `#FBF7EF`.",
    "- **Bandeau d'accueil :** Bleu nuit `#12304F` avec bague crème `#FBF7EF` entourant la plaque pour détacher le bleu de l'enseigne.",
    "- **Boutons principaux :** Ocre `#B84A24` avec texte blanc pur `#FFFFFF` sur fond clair ; jaune soleil `#F2B233` avec texte encre `#231A15` sur fond sombre.",
    "- **Barre de navigation :** Fond crème `#FBF7EF`, bordure supérieure `#766B5B`, onglet actif bleu `#1D528F`.",
    "- **Aucun blanc pur résiduel** dans l'interface, hors texte des boutons ocre et fond du QR code réglementaire.",
    "",
    "---",
    "",
]

for idx, p in enumerate(PAIRS, 1):
    lines.extend([
        f"### {idx}. {p['name']}",
        "",
        f"> **Évolutions visuelles :** {p['notes']}",
        "",
        "#### Vue Mobile (360×780)",
        "",
        "| Avant (Lot 6/7) | Après (Lot 9 Palette Plus Forte) |",
        "|:---:|:---:|",
        f"| ![{p['name']} Avant (360x780)]({p['before_360']}) | ![{p['name']} Après (360x780)]({p['after_360']}) |",
        "",
        "#### Vue Desktop (1440×900)",
        "",
        "| Avant (Lot 6/7) | Après (Lot 9 Palette Plus Forte) |",
        "|:---:|:---:|",
        f"| ![{p['name']} Avant (1440x900)]({p['before_1440']}) | ![{p['name']} Après (1440x900)]({p['after_1440']}) |",
        "",
        "---",
        ""
    ])

OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Page comparative générée avec succès : {OUT_FILE}")

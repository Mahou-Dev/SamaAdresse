#!/usr/bin/env python3
"""
scripts/check-contrast.py
Calcul automatique des contrastes WCAG 2.1 pour les jetons de design du Lot 9.
Génère docs/audit/contrastes.md et échoue si un ratio est non atteint.
"""

import sys
from pathlib import Path
from datetime import datetime

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(hex_code):
    hex_code = hex_code.lstrip('#')
    r, g, b = [int(hex_code[i:i+2], 16) for i in (0, 2, 4)]
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)

def contrast_ratio(c1, c2):
    l1, l2 = relative_luminance(c1), relative_luminance(c2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# Paires déclarées dans le système visuel SamaAdresse (Lot 9 - Palette Plus Forte)
DECLARED_PAIRS = [
    {
        "role": "Texte principal sur fond de page",
        "fg_name": "Encre",
        "fg_hex": "#231A15",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte principal sur carte",
        "fg_name": "Encre",
        "fg_hex": "#231A15",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte principal sur bandeau secondaire",
        "fg_name": "Encre",
        "fg_hex": "#231A15",
        "bg_name": "Sienne",
        "bg_hex": "#F2ECE1",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte secondaire sur fond de page",
        "fg_name": "Texte secondaire",
        "fg_hex": "#5C4D44",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte secondaire sur carte",
        "fg_name": "Texte secondaire",
        "fg_hex": "#5C4D44",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte secondaire sur bandeau secondaire",
        "fg_name": "Texte secondaire",
        "fg_hex": "#5C4D44",
        "bg_name": "Sienne",
        "bg_hex": "#F2ECE1",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte d'accent sur fond clair",
        "fg_name": "Ocre accent",
        "fg_hex": "#8A3112",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte d'accent sur carte",
        "fg_name": "Ocre accent",
        "fg_hex": "#8A3112",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Texte d'accent sur bandeau secondaire",
        "fg_name": "Ocre accent",
        "fg_hex": "#8A3112",
        "bg_name": "Sienne",
        "bg_hex": "#F2ECE1",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bouton principal sur fond clair",
        "fg_name": "Blanc pur",
        "fg_hex": "#FFFFFF",
        "bg_name": "Bouton ocre",
        "bg_hex": "#B84A24",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Titre et logo de l'en-tête",
        "fg_name": "Carte crème",
        "fg_hex": "#FBF7EF",
        "bg_name": "Bleu nuit",
        "bg_hex": "#12304F",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Sous-titre de l'en-tête",
        "fg_name": "Sable doré",
        "fg_hex": "#EADFC8",
        "bg_name": "Bleu nuit",
        "bg_hex": "#12304F",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bouton inversé sur fond sombre",
        "fg_name": "Encre",
        "fg_hex": "#231A15",
        "bg_name": "Jaune soleil",
        "bg_hex": "#F2B233",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bouton jaune soleil sur fond bleu nuit (Composant UI)",
        "fg_name": "Jaune soleil",
        "fg_hex": "#F2B233",
        "bg_name": "Bleu nuit",
        "bg_hex": "#12304F",
        "type": "Composant UI",
        "min_ratio": 3.0,
    },
    {
        "role": "Onglet actif et liens de navigation",
        "fg_name": "Bleu",
        "fg_hex": "#1D528F",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Liens et navigation sur fond de page",
        "fg_name": "Bleu",
        "fg_hex": "#1D528F",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bouton secondaire d'action",
        "fg_name": "Blanc pur",
        "fg_hex": "#FFFFFF",
        "bg_name": "Bleu",
        "bg_hex": "#1D528F",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Statut actif / succès sur carte",
        "fg_name": "Vert",
        "fg_hex": "#2A6B44",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Statut actif / succès sur fond de page",
        "fg_name": "Vert",
        "fg_hex": "#2A6B44",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bouton d'envoi SMS / messagerie",
        "fg_name": "Blanc pur",
        "fg_hex": "#FFFFFF",
        "bg_name": "Vert",
        "bg_hex": "#2A6B44",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Pied de page : texte",
        "fg_name": "Carte crème",
        "fg_hex": "#FBF7EF",
        "bg_name": "Encre",
        "bg_hex": "#231A15",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Pied de page : liens",
        "fg_name": "Jaune soleil",
        "fg_hex": "#F2B233",
        "bg_name": "Encre",
        "bg_hex": "#231A15",
        "type": "Texte normal",
        "min_ratio": 4.5,
    },
    {
        "role": "Bordure de carte sur fond de page",
        "fg_name": "Bordure",
        "fg_hex": "#766B5B",
        "bg_name": "Sable doré",
        "bg_hex": "#EADFC8",
        "type": "Composant UI",
        "min_ratio": 3.0,
    },
    {
        "role": "Bordure de champ sur carte crème",
        "fg_name": "Bordure",
        "fg_hex": "#766B5B",
        "bg_name": "Carte crème",
        "bg_hex": "#FBF7EF",
        "type": "Composant UI",
        "min_ratio": 3.0,
    },
    {
        "role": "Bordure sur bandeau sienne",
        "fg_name": "Bordure",
        "fg_hex": "#766B5B",
        "bg_name": "Sienne",
        "bg_hex": "#F2ECE1",
        "type": "Composant UI",
        "min_ratio": 3.0,
    },
]

def main():
    root = Path(__file__).resolve().parent.parent
    output_path = root / "docs" / "audit" / "contrastes.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    has_failure = False
    rows = []

    for item in DECLARED_PAIRS:
        ratio = contrast_ratio(item["fg_hex"], item["bg_hex"])
        passed = ratio >= item["min_ratio"]
        if not passed:
            has_failure = True
        status = "Atteint" if passed else "NON ATTEINT"
        
        # Niveau WCAG (AA ou AAA)
        if item["type"] == "Composant UI":
            level = "Composant UI (>= 3.0:1)"
        else:
            level = "AAA (>= 7.0:1)" if ratio >= 7.0 else "AA (>= 4.5:1)"

        rows.append({
            "role": item["role"],
            "fg": f"{item['fg_name']} (`{item['fg_hex']}`)",
            "bg": f"{item['bg_name']} (`{item['bg_hex']}`)",
            "ratio": f"{ratio:.2f}:1",
            "req": f"{item['min_ratio']:.1f}:1",
            "level": level,
            "status": status,
        })

    # Génération du fichier Markdown
    md_lines = [
        "# Audit des Contrastes WCAG 2.1 — Lot 9 (Palette Plus Forte)",
        "",
        "> Ce fichier est **généré automatiquement** par `scripts/check-contrast.py` lors de l'exécution de `verify-all`.",
        "> Aucune valeur n'est écrite à la main.",
        "",
        "## Règle d'Accessibilité",
        "- **Texte standard** : Ratio de contraste $\\ge 4.5:1$ (WCAG AA).",
        "- **Grand texte & Composants d'interface (UI)** : Ratio de contraste $\\ge 3.0:1$ (WCAG AA).",
        "",
        "## Mesures Calculées par Paire Déclarée",
        "",
        "| Rôle & Usage | Couleur Texte / Avant-plan | Couleur Fond | Ratio Mesuré | Seuil Requis | Niveau | Statut |",
        "| :--- | :--- | :--- | :---: | :---: | :---: | :---: |",
    ]

    for r in rows:
        md_lines.append(
            f"| {r['role']} | {r['fg']} | {r['bg']} | **{r['ratio']}** | {r['req']} | {r['level']} | **{r['status']}** |"
        )

    md_lines.extend([
        "",
        "## Synthèse",
        f"- **Nombre de paires testées** : {len(rows)}",
        f"- **Paires conformes (Atteint)** : {sum(1 for r in rows if r['status'] == 'Atteint')}",
        f"- **Paires non conformes (NON ATTEINT)** : {sum(1 for r in rows if r['status'] == 'NON ATTEINT')}",
        f"- **Résultat global** : {'CONFORME' if not has_failure else 'NON ATTEINT'}",
        "",
        f"_Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}_",
    ])

    output_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")
    print(f"Rapport de contrastes écrit dans {output_path}")

    if has_failure:
        print("ERREUR : Certaines paires n'atteignent pas le seuil requis de contraste !", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"SUCCÈS : Les {len(rows)} paires respectent strictement les seuils WCAG (Atteint).")
        sys.exit(0)

if __name__ == "__main__":
    main()

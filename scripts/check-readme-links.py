#!/usr/bin/env python3
"""
scripts/check-readme-links.py
Vérifie qu'aucun lien interne du README.md n'utilise file:// ou un chemin absolu,
et vérifie que chaque fichier cible relatif existe réellement.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"

def main():
    content = README.read_text(encoding="utf-8")
    
    # 1. Détection de file:// ou de chemin absolu (/home/...)
    bad_links = re.findall(r'\[([^\]]+)\]\((file://[^\)]+|/[^\)]+)\)', content)
    # Ignorer les ancres relatives au document #... et les URLs http:// / https://
    absolute_matches = []
    for text, link in bad_links:
        if link.startswith("file://") or (link.startswith("/") and not link.startswith(("/v3", "/api", "/assets", "/swagger-ui"))):
            absolute_matches.append((text, link))

    # 2. Détection de tous les liens relatifs locaux
    local_links = re.findall(r'\[([^\]]+)\]\((?!https?://|#|mailto:)(.+?)\)', content)

    missing_targets = []
    for text, link in local_links:
        clean_target = link.split("#")[0].strip()
        if not clean_target:
            continue
        target_path = ROOT / clean_target
        if not target_path.exists():
            missing_targets.append((text, clean_target))

    errors = []
    if absolute_matches:
        errors.append(f"Liens absolus ou 'file://' détectés : {absolute_matches}")
    if missing_targets:
        errors.append(f"Fichiers cibles relatifs introuvables : {missing_targets}")

    print(f"Total liens relatifs vérifiés : {len(local_links)}")
    if errors:
        for err in errors:
            print(f"ECHEC : {err}")
        return 1
    else:
        print("Tous les liens du README.md sont relatifs et pointent vers des fichiers existants — Atteint")
        return 0

if __name__ == "__main__":
    sys.exit(main())

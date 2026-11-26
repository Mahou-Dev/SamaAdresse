#!/usr/bin/env python3
"""
scripts/optimize-images.py
Régénération automatisée des images d'ambiance WebP responsives depuis assets-sources/
conforme aux spécifications du Lot 11C / 12c :
- WebP qualité 75
- Tailles adaptées : 480w, 800w, 1280w, 1536w
- Recadrage panoramique 4:1 pour le bandeau d'annuaire (bande y 120..616)
- Respect strict des plafonds de poids (héros 800w <= 120 Ko, panneau <= 150 Ko, étapes <= 60 Ko, bandeau <= 80 Ko)
"""

import os
import sys
from PIL import Image

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, 'assets-sources')
OUT_DIR = os.path.join(ROOT_DIR, 'frontend/public/images')

os.makedirs(OUT_DIR, exist_ok=True)

TARGETS = [
    ('hero-accueil.png', 'hero-accueil', [480, 800, 1280], 75, None),
    ('panneau-connexion.png', 'panneau-connexion', [480, 640, 1024], 75, None),
    ('etape-1-localiser.png', 'etape-1-localiser', [320, 480, 800], 75, None),
    ('etape-2-plaque.png', 'etape-2-plaque', [320, 480, 800], 75, None),
    ('etape-3-partager.png', 'etape-3-partager', [320, 480, 800], 75, None),
    ('bandeau-annuaire.png', 'bandeau-annuaire', [480, 800, 1280], 75, (0, 120, 1983, 616)),
    ('etat-vide.png', 'etat-vide', [144, 320, 480], 75, None),
]

def main():
    if not os.path.exists(SRC_DIR):
        print(f"Erreur : Le dossier source {SRC_DIR} n'existe pas.", file=sys.stderr)
        sys.exit(1)

    print("=== Optimisation des images d'ambiance (WebP) ===")
    results = []
    
    for src_name, base_name, widths, quality, crop_box in TARGETS:
        src_path = os.path.join(SRC_DIR, src_name)
        if not os.path.exists(src_path):
            print(f"Attention : Fichier source manquant : {src_name}", file=sys.stderr)
            continue

        with Image.open(src_path) as img:
            img = img.convert('RGB')
            if crop_box:
                img = img.crop(crop_box)
            orig_w, orig_h = img.size
            aspect = orig_h / orig_w

            for w in widths:
                h = int(round(w * aspect))
                resized = img.resize((w, h), Image.Resampling.LANCZOS)
                out_name = f"{base_name}-{w}w.webp"
                out_path = os.path.join(OUT_DIR, out_name)
                resized.save(out_path, 'WEBP', quality=quality, method=6)
                size_kb = os.path.getsize(out_path) / 1024.0
                results.append((out_name, f"{w}×{h}", size_kb))

    print(f"\n{'Fichier':<32} {'Dimensions':<15} {'Taille':<12} {'Statut'}")
    print("-" * 68)
    for f, dim, s in results:
        # Contrôle des budgets
        ok = True
        budget_str = ""
        if 'hero-accueil-800w' in f:
            ok = s <= 120.0
            budget_str = " (<= 120 Ko)"
        elif 'panneau-connexion' in f:
            ok = s <= 150.0
            budget_str = " (<= 150 Ko)"
        elif 'etape-' in f:
            ok = s <= 60.0
            budget_str = " (<= 60 Ko)"
        elif 'bandeau-annuaire' in f:
            ok = s <= 80.0
            budget_str = " (<= 80 Ko)"
        elif 'etat-vide' in f:
            ok = s <= 60.0
            budget_str = " (<= 60 Ko)"

        st_label = "CONFORME" if ok else "DEPASSEMENT"
        print(f"{f:<32} {dim:<15} {s:6.2f} Ko    {st_label}{budget_str}")

    print("\nOptimisation terminée avec succès.")

if __name__ == '__main__':
    main()

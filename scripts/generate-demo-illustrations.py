#!/usr/bin/env python3
"""
Générateur d'illustrations architecturales 1200x800 pour les adresses de démonstration SamaAdresse.
Produit 4 visuels distincts (Maison, Pharmacie, Épicerie, Atelier) sans personnes ni façades réelles privées.
Respecte la palette de couleurs du projet (Sable, Crème, Bleu nuit, Ocre, Vert, Jaune soleil).
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "backend/src/main/resources/demo-photos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Palette SamaAdresse
C_SABLE = (234, 223, 200)
C_CREME = (251, 247, 239)
C_BLEU_NUIT = (18, 48, 79)
C_BLEU = (29, 82, 143)
C_ENCRE = (35, 26, 21)
C_TEXTE_SEC = (92, 77, 68)
C_BORDURE = (118, 107, 91)
C_OCRE = (184, 74, 36)
C_OCRE_SOMBRE = (138, 49, 18)
C_VERT = (42, 107, 68)
C_VERT_CLAIR = (74, 155, 104)
C_JAUNE_SOLEIL = (242, 178, 51)
C_ROUGE_TOIT = (168, 58, 30)
C_TERRE = (189, 142, 104)
C_CIEL = (245, 238, 225)
C_CIEL_DORE = (255, 243, 219)

def draw_sky_and_ground(draw, ground_color=(218, 201, 176)):
    # Ciel doux dégradé simple
    draw.rectangle([0, 0, 1200, 520], fill=C_CIEL)
    draw.rectangle([0, 0, 1200, 200], fill=C_CIEL_DORE)
    # Soleil doux
    draw.ellipse([950, 60, 1090, 200], fill=C_JAUNE_SOLEIL, outline=C_OCRE, width=2)
    # Sol / Trottoir
    draw.rectangle([0, 520, 1200, 800], fill=ground_color)
    # Ligne d'horizon
    draw.line([0, 520, 1200, 520], fill=C_BORDURE, width=3)
    # Pavements / lignes de perspective
    for x in range(100, 1200, 180):
        draw.line([x, 520, x - 60, 800], fill=(200, 184, 160), width=2)

def generate_facade_1():
    """1. Maison familiale au portail vert (Ziguinchor Boucotte)"""
    im = Image.new("RGB", (1200, 800), C_CIEL)
    d = ImageDraw.Draw(im)
    draw_sky_and_ground(d)

    # Arbre manguier à gauche
    d.ellipse([40, 240, 260, 480], fill=C_VERT)
    d.ellipse([100, 200, 320, 460], fill=C_VERT_CLAIR)
    d.rectangle([160, 420, 200, 540], fill=C_TEXTE_SEC)

    # Corps de maison (villa ziguinchoroise)
    d.rectangle([280, 280, 960, 550], fill=C_SABLE, outline=C_BORDURE, width=4)

    # Toit en pente tuiles terre cuite
    d.polygon([(240, 280), (620, 140), (1000, 280)], fill=C_ROUGE_TOIT, outline=C_ENCRE)
    for y in range(160, 280, 24):
        d.line([(240 + (y-140)*2, y), (1000 - (y-140)*2, y)], fill=C_OCRE_SOMBRE, width=2)

    # Fenêtres
    for wx in [350, 780]:
        d.rectangle([wx, 340, wx + 120, 450], fill=C_CREME, outline=C_BORDURE, width=3)
        # Volets bois verts
        d.rectangle([wx - 25, 340, wx, 450], fill=C_VERT, outline=C_BORDURE, width=2)
        d.rectangle([wx + 120, 340, wx + 145, 450], fill=C_VERT, outline=C_BORDURE, width=2)
        d.line([wx + 60, 340, wx + 60, 450], fill=C_BORDURE, width=2)
        d.line([wx, 395, wx + 120, 395], fill=C_BORDURE, width=2)

    # Mur de clôture bas avec pilastres
    d.rectangle([200, 480, 1040, 590], fill=C_CREME, outline=C_BORDURE, width=3)
    # Pilastres d'entrée
    d.rectangle([510, 420, 560, 600], fill=C_SABLE, outline=C_BORDURE, width=3)
    d.rectangle([680, 420, 730, 600], fill=C_SABLE, outline=C_BORDURE, width=3)

    # Portail double vert en fer forgé
    d.rectangle([560, 440, 680, 595], fill=C_VERT, outline=C_ENCRE, width=3)
    for bx in range(575, 680, 18):
        d.line([bx, 440, bx, 595], fill=C_ENCRE, width=2)
    d.arc([560, 400, 680, 480], start=0, end=180, fill=C_VERT, width=3)

    # Plaque stylisée sur pilastre
    d.rectangle([520, 460, 550, 495], fill=C_BLEU_NUIT, outline=C_CREME, width=2)

    im.save(os.path.join(OUTPUT_DIR, "demo-facade-1.jpg"), quality=92)
    print("Généré : demo-facade-1.jpg")

def generate_facade_2():
    """2. Pharmacie de l'Escale (Ziguinchor Escale)"""
    im = Image.new("RGB", (1200, 800), C_CIEL)
    d = ImageDraw.Draw(im)
    draw_sky_and_ground(d, ground_color=(205, 195, 180))

    # Bâtiment commercial R+1
    d.rectangle([220, 160, 980, 550], fill=C_CREME, outline=C_BORDURE, width=4)
    d.rectangle([220, 160, 980, 200], fill=C_BLEU_NUIT)

    # Fenêtres 1er étage
    for fx in [290, 480, 670, 840]:
        d.rectangle([fx, 230, fx + 100, 310], fill=C_BLEU_NUIT, outline=C_BORDURE, width=2)
        d.line([fx + 50, 230, fx + 50, 310], fill=C_CREME, width=2)

    # Bandeau Pharmacie
    d.rectangle([220, 340, 980, 420], fill=C_BLEU_NUIT, outline=C_BORDURE, width=3)
    # Caducée / Croix verte stylisée
    cx, cy = 300, 380
    cw = 18
    d.rectangle([cx - cw, cy - 28, cx + cw, cy + 28], fill=C_VERT_CLAIR)
    d.rectangle([cx - 28, cy - cw, cx + 28, cy + cw], fill=C_VERT_CLAIR)

    # Texte enseigne
    d.rectangle([350, 355, 930, 405], fill=C_BLEU, outline=C_CREME, width=2)
    # Enseigne symbolique
    d.rectangle([380, 368, 700, 392], fill=C_CREME)

    # Vitrine et entrée
    d.rectangle([270, 440, 570, 550], fill=(210, 225, 238), outline=C_BLEU_NUIT, width=3)
    d.line([370, 440, 370, 550], fill=C_BLEU_NUIT, width=2)
    d.line([470, 440, 470, 550], fill=C_BLEU_NUIT, width=2)

    # Porte vitrée double
    d.rectangle([610, 430, 770, 550], fill=C_CREME, outline=C_BLEU_NUIT, width=3)
    d.rectangle([630, 450, 680, 535], fill=(210, 225, 238), outline=C_BLEU_NUIT, width=2)
    d.rectangle([700, 450, 750, 535], fill=(210, 225, 238), outline=C_BLEU_NUIT, width=2)

    # Vitrine droite
    d.rectangle([800, 440, 940, 550], fill=(210, 225, 238), outline=C_BLEU_NUIT, width=3)

    # Auvent bleu au-dessus
    d.polygon([(200, 430), (1000, 430), (980, 420), (220, 420)], fill=C_BLEU, outline=C_ENCRE)

    im.save(os.path.join(OUTPUT_DIR, "demo-facade-2.jpg"), quality=92)
    print("Généré : demo-facade-2.jpg")

def generate_facade_3():
    """3. Épicerie et boutique d'alimentation générale (Ziguinchor Tilène)"""
    im = Image.new("RGB", (1200, 800), C_CIEL)
    d = ImageDraw.Draw(im)
    draw_sky_and_ground(d, ground_color=(220, 198, 165))

    # Corps de boutique ocre / jaune soleil
    d.rectangle([240, 260, 960, 550], fill=(245, 228, 195), outline=C_BORDURE, width=4)

    # Toit en tôle ondulée
    d.polygon([(200, 260), (600, 180), (1000, 260)], fill=C_BORDURE, outline=C_ENCRE)

    # Grand auvent rayé jaune soleil et crème
    d.rectangle([210, 310, 990, 370], fill=C_JAUNE_SOLEIL, outline=C_ENCRE, width=2)
    for sx in range(210, 990, 60):
        d.rectangle([sx, 310, sx + 30, 370], fill=C_CREME)
    d.line([210, 370, 990, 370], fill=C_OCRE, width=4)

    # Enseigne au-dessus de l'auvent
    d.rectangle([340, 270, 860, 310], fill=C_OCRE, outline=C_ENCRE, width=2)
    d.rectangle([360, 278, 840, 302], fill=C_CREME)

    # Devanture boutique : porte centrale et étals
    d.rectangle([480, 380, 720, 550], fill=C_ENCRE) # Entrée sombre
    # Étagères visibles à l'intérieur
    d.line([510, 430, 690, 430], fill=C_JAUNE_SOLEIL, width=3)
    d.line([510, 470, 690, 470], fill=C_CREME, width=3)

    # Fenêtre / guichet gauche
    d.rectangle([280, 390, 440, 490], fill=C_CREME, outline=C_BORDURE, width=3)
    d.rectangle([290, 400, 430, 480], fill=(180, 150, 110))

    # Caisses de produits devant à gauche
    for cx in [270, 335, 400]:
        d.rectangle([cx, 510, cx + 55, 560], fill=C_TEXTE_SEC, outline=C_BORDURE, width=2)
        # Fruits / légumes colorés
        d.ellipse([cx + 10, 495, cx + 45, 520], fill=C_JAUNE_SOLEIL)

    # Fenêtre / panneau droit
    d.rectangle([760, 390, 920, 490], fill=C_CREME, outline=C_BORDURE, width=3)
    d.rectangle([775, 405, 905, 475], fill=C_OCRE, outline=C_ENCRE, width=2)

    # Banc traditionnel devant à droite
    d.rectangle([760, 520, 910, 545], fill=C_TEXTE_SEC, outline=C_ENCRE, width=2)
    d.rectangle([775, 545, 795, 570], fill=C_TEXTE_SEC)
    d.rectangle([875, 545, 895, 570], fill=C_TEXTE_SEC)

    im.save(os.path.join(OUTPUT_DIR, "demo-facade-3.jpg"), quality=92)
    print("Généré : demo-facade-3.jpg")

def generate_facade_4():
    """4. Atelier de menuiserie métallique et ferronnerie (Ziguinchor Boucotte)"""
    im = Image.new("RGB", (1200, 800), C_CIEL)
    d = ImageDraw.Draw(im)
    draw_sky_and_ground(d, ground_color=(190, 180, 168))

    # Structure atelier industriel léger (Briques de terre ocre + structure métallique)
    d.rectangle([230, 220, 970, 550], fill=(212, 168, 130), outline=C_BORDURE, width=4)

    # Toit en shedding industriel ou auvent incliné
    d.polygon([(200, 220), (580, 130), (1000, 220)], fill=(140, 130, 120), outline=C_ENCRE)

    # Poutres métalliques IPN bleues
    for px in [230, 450, 750, 970]:
        d.rectangle([px - 8, 220, px + 8, 550], fill=C_BLEU_NUIT)

    # Enseigne atelier métallique
    d.rectangle([340, 240, 860, 295], fill=C_BLEU_NUIT, outline=C_CREME, width=3)
    d.rectangle([360, 252, 840, 283], fill=C_JAUNE_SOLEIL)

    # Grande porte coulissante atelier (tôle ondulée)
    d.rectangle([470, 310, 730, 550], fill=(160, 155, 150), outline=C_ENCRE, width=3)
    for ly in range(320, 550, 15):
        d.line([470, ly, 730, ly], fill=(120, 115, 110), width=2)

    # Porte piétonne découpée
    d.rectangle([540, 390, 660, 550], fill=C_BLEU, outline=C_ENCRE, width=2)
    d.ellipse([640, 470, 650, 480], fill=C_JAUNE_SOLEIL)

    # Fenêtres atelier hautes avec grilles
    for wx in [270, 790]:
        d.rectangle([wx, 330, wx + 130, 440], fill=(225, 235, 245), outline=C_ENCRE, width=3)
        # Grilles de ferronnerie
        for gx in range(wx + 20, wx + 130, 22):
            d.line([gx, 330, gx, 440], fill=C_ENCRE, width=2)
        d.line([wx, 385, wx + 130, 385], fill=C_ENCRE, width=2)

    # Pièces de ferronnerie artisanale appuyées contre le mur
    # Grille décorative à volutes
    d.rectangle([810, 460, 920, 560], fill=None, outline=C_ENCRE, width=3)
    d.line([810, 460, 920, 560], fill=C_ENCRE, width=2)
    d.line([810, 560, 920, 460], fill=C_ENCRE, width=2)
    d.ellipse([845, 490, 885, 530], fill=None, outline=C_ENCRE, width=2)

    # Tubes et profilés acier à gauche
    for tx in [280, 295, 310, 325]:
        d.line([tx, 550, tx + 25, 450], fill=C_TEXTE_SEC, width=4)

    im.save(os.path.join(OUTPUT_DIR, "demo-facade-4.jpg"), quality=92)
    print("Généré : demo-facade-4.jpg")

if __name__ == "__main__":
    generate_facade_1()
    generate_facade_2()
    generate_facade_3()
    generate_facade_4()

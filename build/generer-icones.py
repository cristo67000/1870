"""Dessine les icônes de 1870 : le millésime en capitales sur fond bleu nuit,
souligné d'un trait bleu et rouge.   python build/generer-icones.py"""
import os
from PIL import Image, ImageDraw, ImageFont

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUIT, PAPIER, BLEU, ROUGE = (28, 37, 54), (243, 240, 232), (63, 111, 181), (179, 48, 58)
POLICES = [r'C:\Windows\Fonts\georgiab.ttf', r'C:\Windows\Fonts\timesbd.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf']


def police(taille):
    for chemin in POLICES:
        if os.path.exists(chemin):
            return ImageFont.truetype(chemin, taille)
    return ImageFont.load_default()


def dessiner(cote, marge, arrondi):
    """marge : part du côté laissée vide autour du motif (icône « maskable »)."""
    k = 4
    c = cote * k
    image = Image.new('RGBA', (c, c), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.rounded_rectangle([0, 0, c - 1, c - 1], radius=int(c * arrondi), fill=NUIT)
    utile = c * (1 - 2 * marge)
    taille = int(utile * 0.36)
    f = police(taille)
    boite = d.textbbox((0, 0), '1870', font=f)
    while boite[2] - boite[0] > utile * 0.86:
        taille -= 4
        f = police(taille)
        boite = d.textbbox((0, 0), '1870', font=f)
    l, h = boite[2] - boite[0], boite[3] - boite[1]
    x = (c - l) / 2 - boite[0]
    y = c / 2 - h * 0.72 - boite[1]
    d.text((x, y), '1870', font=f, fill=PAPIER)
    trait_y = c / 2 + h * 0.55
    ep = max(4, int(utile * 0.055))
    d.rectangle([c / 2 - l / 2, trait_y, c / 2, trait_y + ep], fill=BLEU)
    d.rectangle([c / 2, trait_y, c / 2 + l / 2, trait_y + ep], fill=ROUGE)
    return image.resize((cote, cote), Image.LANCZOS)


os.makedirs(os.path.join(RACINE, 'icons'), exist_ok=True)
dessiner(192, 0.06, 0.22).save(os.path.join(RACINE, 'icons', 'icon-192.png'))
dessiner(512, 0.06, 0.22).save(os.path.join(RACINE, 'icons', 'icon-512.png'))
dessiner(512, 0.16, 0.0).save(os.path.join(RACINE, 'icons', 'icon-maskable-512.png'))
print('icônes écrites')

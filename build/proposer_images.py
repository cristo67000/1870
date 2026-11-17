"""
Propose les illustrations des articles et les ajoute à build/choix-images.txt,
que relisent ensuite build/assembler_illustrations.py puis build/illustrer.py.

    python -I build/proposer_images.py              propose pour les articles qui n'ont encore rien
    python -I build/proposer_images.py --essai      affiche sans rien écrire

Pour chaque article : l'image principale des pages Wikipédia qu'il cite
(« lien: wp », « de », « en »), et celle de ses pages dans les autres langues ;
une image pour un personnage ou une notion, deux pour une bataille, un siège ou
un article pivot. PageImages ne donne que des images libres ; on revérifie sur
Commons (licence acceptée par illustrer.py, fichier présent sur Commons et pas
seulement sur une Wikipédia). Les cartes, drapeaux, blasons et signatures sont
écartés : l'application a ses propres cartes.

La légende vient du titre ou de la description de l'image sur Commons quand
ils sont en français ; sinon, c'est le nom de l'article, suivi de « (à revoir) »
et de la description étrangère en commentaire : relisez le fichier, une ligne
se corrige ou se supprime à la main, et une ligne retouchée n'est jamais
réécrite (le script ne touche qu'aux articles absents du fichier).
"""
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verifier_commons import lot  # la même règle de licence que illustrer.py

ICI = os.path.dirname(os.path.abspath(__file__))
CHOIX = os.path.join(ICI, 'choix-images.txt')
AGENT = {'User-Agent': 'encyclopedie-1870-hors-ligne/1.0 (projet personnel; usage modere)'}
sys.stdout.reconfigure(encoding='utf-8')

ECARTER = re.compile(r'(koninkrijk|kingdom|königreich|map_of|map of|collage|flag|drapeau|flagge|blason|wappen|'
                     r'coat[_ ]of[_ ]arms|armoiries|signature|unterschrift|logo|icon|locator|localisation|karte|carte |'
                     r'carte_|map[_ .]|plan[_ ]|\.svg$|\.gif$|stamp|timbre|briefmarke|ribbon|ruban|disambig|question_book)', re.I)
DEUX = {'batailles', 'sieges'}
PIVOTS = {'guerre-de-1870', 'causes-de-la-guerre', 'alsace-lorraine', 'traite-de-francfort', 'siege-de-paris',
          'armee-francaise-en-1870', 'armee-allemande-en-1870', 'fusil-chassepot', 'canon-krupp', 'commune-de-paris'}
EN = re.compile(r'\b(the|of|and|with|by|from|in|at|during|his|her|was|painting|portrait of)\b', re.I)
FR = re.compile(r'\b(le|la|les|des|du|de|et|à|au|aux|en|par|sur|une|un|pendant|vers|après|avant)\b', re.I)
LANGUE = re.compile(r'^(français|french|allemand|german|deutsch|anglais|english|italien|italian|néerlandais|dutch|'
                    r'espagnol|spanish)\s*:\s*', re.I)
NOM_DE_FICHIER = re.compile(r'\.(jpe?g|png|tiff?)\b|crop|IMG|\bP\d{3,}|\d{4,}-\d|_', re.I)


def obtenir(langue, params):
    url = 'https://%s.wikipedia.org/w/api.php?' % langue + urllib.parse.urlencode(dict(params, format='json', formatversion='2'))
    for essai in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=60) as r:
                d = json.loads(r.read().decode('utf-8'))
            if 'error' not in d:
                return d
        except Exception:
            pass
        time.sleep(3 * (essai + 1))
    raise SystemExit('Wikipédia (%s) ne répond pas' % langue)


def articles():
    sortie = []
    dossier = os.path.join(ICI, 'articles')
    for f in sorted(os.listdir(dossier)):
        if not f.endswith('.txt'):
            continue
        a = None
        for ligne in io.open(os.path.join(dossier, f), encoding='utf-8').read().splitlines():
            if ligne.startswith('@ '):
                a = {'id': ligne[2:].strip(), 'cat': '', 'nom': '', 'liens': []}
                sortie.append(a)
            elif a is not None:
                m = re.match(r'^(cat|nom|lien):\s?(.*)$', ligne)
                if not m:
                    continue
                if m.group(1) == 'lien':
                    l = re.match(r'^(wp|de|en|it) (.+?)\s*$', m.group(2))
                    if l:
                        a['liens'].append(('fr' if l.group(1) == 'wp' else l.group(1), l.group(2)))
                else:
                    a[m.group(1)] = m.group(2).strip()
    return sortie


def deja():
    if not os.path.exists(CHOIX):
        return set()
    vus = set()
    for l in io.open(CHOIX, encoding='utf-8').read().splitlines():
        if l.strip() and not l.startswith('#'):
            for a in l.split(' | ')[0].split(','):
                vus.add(a.strip())
        m = re.match(r'^# sans image : (.+)$', l)
        if m:
            vus.update(x.strip() for x in m.group(1).split(','))
    return vus


def images_principales(langue, titres):
    """titre → (image principale, {langue: titre de la même page})"""
    res = {}
    for i in range(0, len(titres), 40):
        lot_t = titres[i:i + 40]
        d = obtenir(langue, {'action': 'query', 'prop': 'pageimages|langlinks', 'piprop': 'name', 'pilicense': 'free',
                             'redirects': 1, 'titles': '|'.join(lot_t), 'lllimit': 'max'})
        q = d.get('query', {})
        vers = {n['from']: n['to'] for n in q.get('normalized', [])}
        redir = {n['from']: n['to'] for n in q.get('redirects', [])}
        pages = {p['title']: p for p in q.get('pages', [])}
        for t in lot_t:
            c = vers.get(t, t)
            c = redir.get(c, c)
            p = pages.get(c, {})
            autres = {l['lang']: l['title'] for l in p.get('langlinks', []) if l['lang'] in ('fr', 'de', 'en')}
            res[t] = (p.get('pageimage'), autres)
        time.sleep(0.8)
    return res


def descriptions(fichiers):
    """fichier → (titre de l'œuvre, description), en français quand Commons les a."""
    res = {}
    propre = lambda v: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', str(v or ''))).strip(' .;:,')
    for i in range(0, len(fichiers), 40):
        lot_f = fichiers[i:i + 40]
        url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
            'action': 'query', 'titles': '|'.join('File:' + f for f in lot_f), 'prop': 'imageinfo', 'iiprop': 'extmetadata',
            'iiextmetadatalanguage': 'fr', 'iiextmetadatafilter': 'ObjectName|ImageDescription', 'format': 'json', 'formatversion': '2'})
        d = {}
        for essai in range(8):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=60) as r:
                    d = json.loads(r.read().decode('utf-8'))
                break
            except Exception:
                time.sleep(5 * (essai + 1))
        q = d.get('query', {})
        vers = {n['from']: n['to'] for n in q.get('normalized', [])}
        pages = {p['title']: p for p in q.get('pages', [])}
        for f in lot_f:
            p = pages.get(vers.get('File:' + f, 'File:' + f), {})
            em = ((p.get('imageinfo') or [{}])[0]).get('extmetadata', {})
            res[f] = (propre(em.get('ObjectName', {}).get('value')), propre(em.get('ImageDescription', {}).get('value')))
        time.sleep(0.5)
    return res


def nettoyer_legende(t):
    t = re.split(r'\s+(?:label|title|description)\s+QS:', t or '')[0].strip(' .;:,')
    m = LANGUE.match(t)
    if m and not m.group(1).lower().startswith(('fran', 'french')):
        return ''
    return LANGUE.sub('', t).strip(' .;:,')


def cyrillique(t):
    return any(0x400 <= ord(c) <= 0x4ff for c in t)


def francais(t):
    if not t or len(t) < 8 or NOM_DE_FICHIER.search(t) or cyrillique(t):
        return False
    fr, en = len(FR.findall(t)), len(EN.findall(t))
    return fr >= 1 and fr >= en


def legende(a, fichier, desc):
    """(légende, étrangère) : la légende française, ou le nom de l'article et la description à traduire."""
    nom = a['nom']
    etrangere = ''
    for cand in desc:
        cand = nettoyer_legende(cand)
        if not cand or cand.lower() == os.path.splitext(fichier)[0].lower():
            continue
        if not francais(cand):
            etrangere = etrangere or cand[:140]
            continue
        if len(cand) > 150:
            cand = cand[:150].rsplit(' ', 1)[0] + '…'
        cand = cand[0].upper() + cand[1:]
        if a['cat'] == 'personnages' and nom.split()[-1].lower() not in cand.lower():
            return nom + ' — ' + cand, ''
        return cand, ''
    return nom, etrangere


def main():
    essai = '--essai' in sys.argv
    tous = articles()
    faits = deja()
    a_faire = [a for a in tous if a['id'] not in faits]
    if not a_faire:
        print('Tous les articles ont déjà leur ligne dans choix-images.txt.')
        return
    # 1. les images principales des pages citées, et leurs titres dans les autres langues
    par_langue = {}
    for a in a_faire:
        for langue, titre in a['liens']:
            par_langue.setdefault(langue, set()).add(titre)
    trouve = {}
    for langue, titres in par_langue.items():
        for t, v in images_principales(langue, sorted(titres)).items():
            trouve[(langue, t)] = v
    # 2. les mêmes pages dans les autres langues
    seconds = {}
    for a in a_faire:
        for langue, titre in a['liens']:
            for l2, t2 in (trouve.get((langue, titre)) or (None, {}))[1].items():
                if (l2, t2) not in trouve:
                    seconds.setdefault(l2, set()).add(t2)
    for langue, titres in seconds.items():
        for t, v in images_principales(langue, sorted(titres)).items():
            trouve[(langue, t)] = v
    # 3. les candidats de chaque article, dans l'ordre
    candidats = {}
    for a in a_faire:
        liste = []
        ordre = list(a['liens'])
        for langue, titre in a['liens']:
            autres = (trouve.get((langue, titre)) or (None, {}))[1]
            ordre += sorted(autres.items(), key=lambda kv: ('fr', 'de', 'en').index(kv[0]))
        for langue, titre in ordre:
            im = (trouve.get((langue, titre)) or (None, {}))[0]
            if im and not ECARTER.search(im) and im.replace('_', ' ') not in liste:
                liste.append(im.replace('_', ' '))
        candidats[a['id']] = liste
    # 4. vérification sur Commons
    fichiers = sorted({f for l in candidats.values() for f in l})
    infos = {}
    for i in range(0, len(fichiers), 50):
        infos.update(lot(fichiers[i:i + 50]))
    bons = [f for f in fichiers if infos.get(f) and infos[f]['accepte']]
    desc = descriptions(bons)
    lignes, sans = [], []
    utilisees = set()
    for a in a_faire:
        n = 2 if (a['cat'] in DEUX or a['id'] in PIVOTS) else 1
        retenus = [f for f in candidats[a['id']] if f in bons and f not in utilisees][:n]
        if not retenus:
            sans.append(a['id'])
        for f in retenus:
            utilisees.add(f)
            texte, etrangere = legende(a, f, desc.get(f, ('', '')))
            ligne = '%s | %s | %s' % (a['id'], f, texte)
            if etrangere or texte == a['nom']:
                ligne += '   # à revoir' + (' : ' + etrangere if etrangere else '')
            lignes.append(ligne)
    print('%d articles examinés : %d images proposées, %d articles sans image libre' % (len(a_faire), len(lignes), len(sans)))
    if essai:
        print('\n'.join(lignes))
        print('sans image : ' + ', '.join(sans))
        return
    neuf = not os.path.exists(CHOIX)
    with io.open(CHOIX, 'a', encoding='utf-8', newline='\n') as f:
        if neuf:
            f.write('# Le choix des illustrations de 1870 : une ligne par image.\n#\n'
                    '#     article[, article…] | Fichier sur Commons | Légende [| Crédit]\n#\n'
                    '# Proposé par build/proposer_images.py, relu et corrigé à la main ; une ligne retouchée\n'
                    '# n’est jamais réécrite. « # sans image : id, id » marque les articles examinés sans résultat ;\n'
                    '# « # à revoir » une légende à écrire (assembler_illustrations.py refuse ces lignes).\n'
                    '#\n#     python -I build/assembler_illustrations.py   écrit build/illustrations.txt (crédits lus sur Commons)\n'
                    '#     python -I build/illustrer.py                 télécharge, vérifie la licence, convertit en WebP\n\n')
        f.write('\n'.join(lignes) + '\n')
        if sans:
            f.write('# sans image : ' + ', '.join(sans) + '\n')
    print('écrit dans build/choix-images.txt — relisez-le avant d’assembler.')


if __name__ == '__main__':
    main()

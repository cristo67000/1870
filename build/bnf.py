"""
Trouver la cote Gallica d'un livre, sans passer par gallica.bnf.fr (qui refuse
les accès automatiques) : le catalogue général de la BnF donne les notices,
data.bnf.fr dit lesquelles ont une reproduction numérique sur Gallica.

    python -I build/bnf.py "Année terrible" --auteur Hugo
    python -I build/bnf.py "siège de Strasbourg" --avant 1914
    python -I build/bnf.py "débâcle" --auteur Zola --avant 1900

Affiche, pour chaque notice qui a une reproduction sur Gallica : la cote à
mettre dans « gallica: » (bpt6k…), le titre, l'auteur, l'éditeur et l'année,
et la notice (cb…) à citer dans « preuve: ». Les éditions les plus anciennes
d'abord.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

AGENT = {'User-Agent': 'encyclopedie-1870-hors-ligne/1.0 (projet personnel; usage modere)'}
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')


def lire(url, donnees=None):
    for essai in range(6):
        try:
            req = urllib.request.Request(url, data=donnees, headers=AGENT)
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read().decode('utf-8')
        except Exception:
            time.sleep(4 * (essai + 1))
    sys.exit('La BnF ne répond pas : réessayez dans une minute.')


def champ(notice, tag, codes=None):
    sortie = []
    for bloc in re.findall(r'tag="' + tag + r'".*?</mxc:datafield>', notice, flags=re.S):
        morceaux = re.findall(r'<mxc:subfield code="(.)">([^<]*)</mxc:subfield>', bloc)
        sortie.append(' '.join(v for c, v in morceaux if codes is None or c in codes))
    return sortie


def main(args):
    if not args or args[0].startswith('-'):
        sys.exit(__doc__)
    titre = args[0]
    auteur = args[args.index('--auteur') + 1] if '--auteur' in args else None
    avant = int(args[args.index('--avant') + 1]) if '--avant' in args else None
    requete = 'bib.title all "%s"' % titre.replace('"', ' ')
    if auteur:
        requete += ' and bib.author all "%s"' % auteur.replace('"', ' ')
    notices = []
    for debut in (1, 51, 101):
        url = 'https://catalogue.bnf.fr/api/SRU?' + urllib.parse.urlencode({
            'version': '1.2', 'operation': 'searchRetrieve', 'query': requete,
            'maximumRecords': 50, 'startRecord': debut, 'recordSchema': 'unimarcxchange'})
        xml = lire(url)
        total = int((re.findall(r'numberOfRecords>(\d+)', xml) or ['0'])[0])
        for r in re.split(r'<srw:record>', xml)[1:]:
            ark = re.findall(r'ark:/12148/(cb\w+)', r)
            if not ark:
                continue
            annee = re.findall(r'\b(1[5-9]\d\d|20\d\d)\b', ' '.join(champ(r, '210', 'd') + champ(r, '214', 'd')))
            notices.append({
                'cb': ark[0],
                'titre': (champ(r, '200', 'aehi') or [''])[0],
                'auteur': (champ(r, '200', 'f') or [''])[0],
                'edition': ' '.join(champ(r, '210', 'acd') + champ(r, '214', 'acd'))[:90],
                'annee': int(annee[0]) if annee else 9999,
            })
        if debut + 50 > total:
            break
    if avant:
        notices = [n for n in notices if n['annee'] <= avant]
    if not notices:
        sys.exit('Aucune notice pour cette recherche (%s).' % requete)
    # data.bnf.fr : lesquelles ont une reproduction sur Gallica ?
    trouvees = {}
    for i in range(0, len(notices), 40):
        lot = notices[i:i + 40]
        valeurs = ' '.join('<http://data.bnf.fr/ark:/12148/%s#about>' % n['cb'] for n in lot)
        sparql = ('PREFIX rdarelationships: <http://rdvocab.info/RDARelationshipsWEMI/> SELECT ?m ?g WHERE { VALUES ?m { %s } '
                  '?m rdarelationships:electronicReproduction ?g }' % valeurs)
        d = json.loads(lire('https://data.bnf.fr/sparql', urllib.parse.urlencode({'query': sparql, 'format': 'application/json'}).encode()))
        for b in d['results']['bindings']:
            cb = re.findall(r'(cb\w+)#', b['m']['value'])[0]
            g = re.findall(r'ark:/12148/(\w+)', b['g']['value'])
            if g:
                trouvees.setdefault(cb, []).append(g[0])
        time.sleep(0.5)
    avec = sorted([n for n in notices if n['cb'] in trouvees], key=lambda n: n['annee'])
    print('%d notices lues, %d avec une reproduction sur Gallica :' % (len(notices), len(avec)))
    for n in avec:
        print('- gallica: %s = %s%s, %s' % (trouvees[n['cb']][0], n['titre'], (' / ' + n['auteur']) if n['auteur'] else '', n['edition']))
        print('  preuve: data.bnf.fr, notice %s%s' % (n['cb'], ('  (autres cotes : ' + ', '.join(trouvees[n['cb']][1:4]) + ')') if len(trouvees[n['cb']]) > 1 else ''))
    if not avec:
        print('Aucune n’est numérisée d’après data.bnf.fr. Essayez un titre plus court, sans l’auteur, ou une autre édition.')


if __name__ == '__main__':
    main(sys.argv[1:])

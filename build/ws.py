"""
Lire un texte de Wikisource (fr) sans tout charger : l'outil des collecteurs
d'extraits de 1870.

    python -I build/ws.py -r "Fustel de Coulanges Alsace"           chercher des pages (dix titres)
    python -I build/ws.py "Titre de la page"                        le plan : longueur, sous-pages, source (Livre:, Gallica),
                                                                    début du texte
    python -I build/ws.py "Titre de la page" -c "motif"             les passages qui contiennent le motif (regex, sans casse)
    python -I build/ws.py "Titre de la page" -e "premiers mots" "derniers mots"
                                                                    le passage exact entre deux repères (inclus), prêt à copier
    python -I build/ws.py "Titre de la page" --tout                 tout le texte (à éviter : c'est long)

Le texte est celui que Wikisource affiche (transclusions comprises), sans les
numéros de page ni les notes d'édition ; les vers gardent leurs retours à la
ligne, les paragraphes sont séparés par une ligne vide. Les pages sont gardées
dans build/.atelier/ws/.
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ICI = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ICI, '.atelier', 'ws')
AGENT = {'User-Agent': 'encyclopedie-1870-hors-ligne/1.0 (projet personnel; usage modere)'}
API = 'https://fr.wikisource.org/w/api.php?'
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

BLOCS = {'p', 'div', 'br', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'blockquote', 'dd', 'dt'}
A_TAIRE = re.compile(r'(^|\s)(ws-noexport|mw-editsection|reference|references|noprint|pagenum|ws-pagenum|mw-cite-backlink|'
                     r'ws-summary|headertemplate|ws-header|navigation|footertemplate|mw-references-wrap|reference-text)(\s|$)')


class Texte(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.morceaux = []
        self.silence = []          # pile : profondeur des éléments tus
        self.profondeur = 0
        self.liens = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and a.get('href'):
            self.liens.append(a['href'])
        if tag in ('br',):
            if not self.silence:
                self.morceaux.append('\n')
            return
        if tag in ('img', 'hr', 'wbr', 'meta', 'link', 'input'):
            return
        self.profondeur += 1
        if self.silence or A_TAIRE.search(a.get('class') or '') or tag in ('style', 'script'):   # les appels de note (sup.reference) sont tus par leur classe, pas les exposants
            self.silence.append(self.profondeur)
        if tag in BLOCS and not self.silence:
            self.morceaux.append('\n\n' if tag in ('p', 'div', 'blockquote', 'table') else '\n')

    def handle_endtag(self, tag):
        if tag in ('br', 'img', 'hr', 'wbr', 'meta', 'link', 'input'):
            return
        if self.silence and self.silence[-1] == self.profondeur:
            self.silence.pop()
        elif tag in BLOCS and not self.silence:
            self.morceaux.append('\n')
        self.profondeur -= 1

    def handle_data(self, data):
        if not self.silence:
            self.morceaux.append(data)

    def texte(self):
        t = ''.join(self.morceaux).replace('\xa0', ' ').replace(' ', ' ')
        t = re.sub(r'[ \t]+', ' ', t)
        t = re.sub(r' *\n *', '\n', t)
        t = re.sub(r'\n{3,}', '\n\n', t)
        return t.strip()


def api(params):
    url = API + urllib.parse.urlencode(dict(params, format='json', formatversion='2'))
    for essai in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=60) as r:
                d = json.loads(r.read().decode('utf-8'))
            if not ('error' in d and d['error'].get('code') in ('ratelimited', 'maxlag')):
                return d
        except Exception:
            pass
        time.sleep(min(40, 3 * (essai + 1)))
    sys.exit('Wikisource ne répond pas : réessayez dans une minute.')


def page(titre):
    os.makedirs(CACHE, exist_ok=True)
    fichier = os.path.join(CACHE, re.sub(r'[^\w.-]+', '_', titre)[:140] + '.json')
    if os.path.exists(fichier):
        with open(fichier, encoding='utf-8') as f:
            return json.load(f)
    d = api({'action': 'parse', 'page': titre, 'prop': 'text|links', 'redirects': 1, 'disablelimitreport': 1})
    if 'error' in d:
        sys.exit('Page introuvable : « %s » (%s). Cherchez-la avec -r.' % (titre, d['error'].get('info', '')))
    p = d['parse']
    lecteur = Texte()
    lecteur.feed(p['text'])
    liens = lecteur.liens
    gallica = sorted(set(re.findall(r'gallica\.bnf\.fr/ark:/12148/(\w+)', ' '.join(liens))))
    livres = sorted(set(urllib.parse.unquote(l.split('/wiki/', 1)[1]).split('#')[0].split('?')[0]
                        for l in liens if '/wiki/Livre:' in l and 'wikisource.org/wiki/Livre:' not in l.replace('fr.wikisource', '')))
    sous = api({'action': 'query', 'list': 'allpages', 'apprefix': p['title'] + '/', 'apnamespace': 0, 'aplimit': 60})
    sortie = {'titre': p['title'], 'texte': lecteur.texte(), 'gallica': gallica, 'livres': livres,
              'sous_pages': [x['title'] for x in sous['query']['allpages']]}
    for livre in livres[:2]:
        dl = api({'action': 'parse', 'page': livre, 'prop': 'externallinks', 'disablelimitreport': 1})
        for lien in (dl.get('parse') or {}).get('externallinks', []):
            for g in re.findall(r'gallica\.bnf\.fr/ark:/12148/(\w+)', lien):
                if g not in sortie['gallica']:
                    sortie['gallica'].append(g)
    with open(fichier, 'w', encoding='utf-8') as f:
        json.dump(sortie, f, ensure_ascii=False)
    time.sleep(0.6)
    return sortie


def plan(p):
    print('« %s » (fr.wikisource.org)' % p['titre'])
    print('https://fr.wikisource.org/wiki/' + urllib.parse.quote(p['titre'].replace(' ', '_')))
    print('  longueur : %d caractères' % len(p['texte']))
    if p['livres']:
        print('  fac-similé : ' + ' ; '.join(p['livres'][:3]))
    if p['gallica']:
        print('  cotes Gallica citées par la page ou son Livre : ' + ', '.join(p['gallica'][:6]) + '  (preuve: « Index Wikisource »)')
    if p['sous_pages']:
        print('  sous-pages (%d) : %s' % (len(p['sous_pages']), ' | '.join(s[len(p['titre']) + 1:] for s in p['sous_pages'][:60])))
    print('\n— Début —')
    print(p['texte'][:1500] + (' […]' if len(p['texte']) > 1500 else ''))


def chercher(p, motif):
    t = p['texte']
    n = 0
    for m in re.finditer(motif, t, re.I):
        n += 1
        if n > 25:
            print('[… d’autres passages : affinez le motif]')
            break
        a = max(0, m.start() - 300)
        b = min(len(t), m.end() + 300)
        print('— (car. %d) …%s…' % (m.start(), t[a:b]))
    if not n:
        print('Aucun passage pour « %s ».' % motif)


def extrait(p, debut, fin):
    t = p['texte']
    norm = lambda s: re.sub(r'\s+', ' ', s).strip()
    # recherche tolérante aux espaces et aux retours à la ligne
    motif_debut = r'\s+'.join(re.escape(x) for x in norm(debut).split(' '))
    motif_fin = r'\s+'.join(re.escape(x) for x in norm(fin).split(' '))
    m = re.search(motif_debut, t)
    if not m:
        sys.exit('Début introuvable : « %s »' % debut)
    n = re.search(motif_fin, t[m.start():])
    if not n:
        sys.exit('Fin introuvable après le début : « %s »' % fin)
    morceau = t[m.start():m.start() + n.end()]
    print(morceau)
    print('\n[%d mots]' % len(morceau.split()))


def main(args):
    if not args:
        sys.exit(__doc__)
    if args[0] == '-r':
        d = api({'action': 'query', 'list': 'search', 'srsearch': ' '.join(args[1:]), 'srlimit': 10, 'srnamespace': 0})
        for r in d['query']['search']:
            print('- %s — %s' % (r['title'], html.unescape(re.sub(r'<[^>]+>', '', r.get('snippet', '')))[:110]))
        return
    p = page(args[0])
    if len(args) == 1:
        plan(p)
    elif args[1] == '-c':
        chercher(p, args[2])
    elif args[1] == '-e':
        extrait(p, args[2], args[3])
    elif args[1] == '--tout':
        print(p['texte'])
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main(sys.argv[1:])

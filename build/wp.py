"""
Lire Wikipédia sans tout charger : l'outil des rédacteurs de 1870.

    python -I build/wp.py fr "Bataille de Sedan (1870)"                  le plan de la page : sections et tailles,
                                                                         coordonnées, titres dans les autres langues, introduction
    python -I build/wp.py fr "Bataille de Sedan (1870)" -s "Déroulement"  une section (avec ses sous-sections)
    python -I build/wp.py de "Schlacht bei Sedan" -c "Verluste|Gefangene" les passages qui contiennent le motif
                                                                         (expression régulière, sans casse)
    python -I build/wp.py fr -r "siège de Toul 1870"                      chercher des pages (dix titres)
    python -I build/wp.py fr "Titre" --tout                               toute la page (à éviter : c'est long)

Les pages sont gardées dans build/.atelier/pages/ : une page lue une fois, par
n'importe quel rédacteur, ne se télécharge plus. Le script patiente quand
Wikipédia demande de ralentir.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ICI = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ICI, '.atelier', 'pages')
AGENT = {'User-Agent': 'encyclopedie-1870-hors-ligne/1.0 (projet personnel; usage modere)'}
LANGUES = ('fr', 'de', 'en', 'it', 'nl')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')


def api(langue, params):
    url = 'https://%s.wikipedia.org/w/api.php?' % langue + urllib.parse.urlencode(dict(params, format='json', formatversion='2', maxlag='5'))
    for essai in range(9):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=45) as r:
                texte = r.read().decode('utf-8')
            if texte.startswith('{'):
                d = json.loads(texte)
                if not ('error' in d and d['error'].get('code') in ('ratelimited', 'maxlag')):
                    return d
        except Exception:
            pass
        time.sleep(min(40, 3 * (essai + 1)))
    sys.exit('Wikipédia (%s) ne répond pas : réessayez dans une minute.' % langue)


def page(langue, titre):
    os.makedirs(CACHE, exist_ok=True)
    nom = re.sub(r'[^\w.-]+', '_', titre)[:120]
    fichier = os.path.join(CACHE, '%s-%s.json' % (langue, nom))
    if os.path.exists(fichier):
        with open(fichier, encoding='utf-8') as f:
            return json.load(f)
    d = api(langue, {'action': 'query', 'prop': 'extracts|coordinates|langlinks|pageprops', 'explaintext': 1,
                     'exsectionformat': 'wiki', 'redirects': 1, 'titles': titre, 'lllimit': 'max', 'ppprop': 'disambiguation'})
    p = d['query']['pages'][0]
    if p.get('missing') or p.get('invalid'):
        sys.exit('Page introuvable : « %s » (%s). Cherchez-la avec -r.' % (titre, langue))
    redir = d['query'].get('redirects') or []
    sortie = {
        'langue': langue,
        'titre': p['title'],
        'demande': titre,
        'redirection': redir[0]['to'] if redir else None,
        'homonymie': 'disambiguation' in (p.get('pageprops') or {}),
        'coord': [(c['lat'], c['lon']) for c in (p.get('coordinates') or [])][:1],
        'langues': {l['lang']: l['title'] for l in (p.get('langlinks') or []) if l['lang'] in LANGUES},
        'texte': p.get('extract', ''),
    }
    with open(fichier, 'w', encoding='utf-8') as f:
        json.dump(sortie, f, ensure_ascii=False)
    time.sleep(0.7)
    return sortie


TITRE = re.compile(r'^(=+)\s*(.*?)\s*=+\s*$')


def sections(texte):
    """[(niveau, titre, debut, fin)] ; l'introduction a le niveau 1 et le titre ''."""
    lignes = texte.split('\n')
    res = [[1, '', 0, None]]
    pos = 0
    for ligne in lignes:
        m = TITRE.match(ligne)
        if m:
            res[-1][3] = pos
            res.append([len(m.group(1)), m.group(2), pos, None])
        pos += len(ligne) + 1
    res[-1][3] = len(texte)
    return res


def plan(p):
    print('« %s » (%s.wikipedia.org)' % (p['titre'], p['langue']))
    print('https://%s.wikipedia.org/wiki/%s' % (p['langue'], urllib.parse.quote(p['titre'].replace(' ', '_'))))
    if p['redirection']:
        print('  ! « %s » redirige vers « %s »' % (p['demande'], p['redirection']))
    if p['homonymie']:
        print('  ! PAGE D’HOMONYMIE : ce n’est pas un article sur le sujet')
    if p['coord']:
        print('  coordonnées : %.4f, %.4f' % tuple(p['coord'][0]))
    if p['langues']:
        print('  autres langues : ' + ' ; '.join('%s « %s »' % kv for kv in sorted(p['langues'].items())))
    t = p['texte']
    print('  longueur : %d caractères' % len(t))
    print('  sections :')
    for niveau, nom, a, b in sections(t)[1:]:
        print('    ' + '  ' * (niveau - 2) + '%s (%d)' % (nom, b - a))
    intro = t[:sections(t)[0][3]].strip()
    print('\n— Introduction —')
    print(intro[:1800] + (' […]' if len(intro) > 1800 else ''))


def section(p, motif):
    t = p['texte']
    liste = sections(t)
    cible = motif.lower()
    for i, (niveau, nom, a, b) in enumerate(liste):
        if nom and cible in nom.lower():
            fin = len(t)
            for niveau2, nom2, a2, b2 in liste[i + 1:]:
                if niveau2 <= niveau:
                    fin = a2
                    break
            morceau = t[a:fin].strip()
            print(morceau[:9000] + ('\n[… %d caractères de plus : précisez une sous-section]' % (len(morceau) - 9000) if len(morceau) > 9000 else ''))
            return
    sys.exit('Pas de section « %s ». Sections : %s' % (motif, ', '.join(s[1] for s in liste if s[1])))


def chercher(p, motif):
    t = p['texte']
    liste = sections(t)
    n = 0
    for m in re.finditer(motif, t, re.I):
        n += 1
        if n > 30:
            print('[… d’autres passages : affinez le motif]')
            break
        a = max(0, m.start() - 260)
        b = min(len(t), m.end() + 260)
        nom = next((s[1] for s in reversed(liste) if s[2] <= m.start()), '')
        print('— [%s] …%s…' % (nom or 'introduction', t[a:b].replace('\n', ' ')))
    if not n:
        print('Aucun passage pour « %s ».' % motif)


def rechercher(langue, requete):
    d = api(langue, {'action': 'query', 'list': 'search', 'srsearch': requete, 'srlimit': 10})
    for r in d['query']['search']:
        extrait = re.sub(r'<[^>]+>', '', r.get('snippet', ''))
        print('- %s — %s' % (r['title'], extrait[:110]))


def main(args):
    if len(args) < 2 or args[0] not in LANGUES:
        sys.exit(__doc__)
    langue = args[0]
    if args[1] == '-r':
        rechercher(langue, ' '.join(args[2:]))
        return
    p = page(langue, args[1])
    if len(args) == 2:
        plan(p)
    elif args[2] == '-s':
        section(p, args[3])
    elif args[2] == '-c':
        chercher(p, args[3])
    elif args[2] == '--tout':
        print(p['texte'])
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main(sys.argv[1:])

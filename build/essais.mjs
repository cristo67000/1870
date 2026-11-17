/*
 * Épreuves de 1870, sans navigateur.
 *
 *   node build/essais.mjs            tout (le plan doit être entièrement écrit)
 *   node build/essais.mjs --partiel  sans exiger que tout le plan soit écrit
 *
 * 1. La coquille : sw.js liste exactement ce que index.html charge (plus les
 *    données, les fonds de carte et les icônes), tout existe, les versions
 *    concordent, aucun caractère de contrôle, aucun reste de l'application sœur.
 * 2. Les articles : renvois, « voir », coordonnées, chiffres, images, liens.
 * 3. Les extraits : domaine public, cote Gallica, articles liés.
 * 4. Les cartes animées : unités connues, positions dans le cadre du fond,
 *    marques et articles existants, dates dans l'ordre.
 * 5. Les modules de l'application, chargés dans un bac à sable : recherche,
 *    anniversaires, texte nu, préparation du texte pour la voix.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PARTIEL = process.argv.includes('--partiel');
let reussites = 0, echecs = 0;
function ok(cond, message) {
  if (cond) reussites++; else { echecs++; console.log('  ÉCHEC', message); }
}
function lire(f) { return fs.readFileSync(path.join(RACINE, f), 'utf8'); }

// ── 1. Coquille ───────────────────────────────────────────────────────────
console.log('coquille');
const index = lire('index.html');
const sw = lire('sw.js');
const charges = [...index.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:|^mailto:/.test(u));
const listes = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]);
for (const u of charges) ok(listes.includes(u), 'sw.js n’annonce pas ' + u);
for (const u of listes) if (u !== './') ok(fs.existsSync(path.join(RACINE, u)), 'fichier annoncé absent : ' + u);
for (const f of fs.readdirSync(path.join(RACINE, 'data'))) ok(listes.includes('data/' + f), 'sw.js n’annonce pas data/' + f);
for (const f of fs.readdirSync(path.join(RACINE, 'js', 'vues'))) ok(listes.includes('js/vues/' + f), 'sw.js n’annonce pas js/vues/' + f);
const vIndex = /application-version" content="([^"]+)"/.exec(index)[1];
const vSw = /const VERSION = '([^']+)'/.exec(sw)[1];
ok(vIndex === vSw, 'versions : index ' + vIndex + ' / sw ' + vSw);
for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'confidentialite.html', '.nojekyll', 'manifest.webmanifest']) {
  ok(fs.existsSync(path.join(RACINE, f)), 'manque ' + f);
}
const publies = listes.filter((u) => /\.(js|css|html|webmanifest)$/.test(u)).concat(['confidentialite.html']);
for (const f of publies) {
  const t = lire(f);
  ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(t), 'caractère de contrôle dans ' + f);
  ok(!/\bT\+|tplus|Templiers?|maîtres? de l’ordre/.test(t), 'reste de T+ dans ' + f + ' : ' + (t.match(/.{0,30}(\bT\+|tplus|Templiers?).{0,30}/) || [''])[0]);
  if (/\.html$/.test(f)) ok(!/\sstyle="/.test(t), 'attribut style dans ' + f + ' (interdit par la CSP)');
}
{
  const adresses = new Set();
  for (const f of publies) for (const m of lire(f).matchAll(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi)) adresses.add(m[0].toLowerCase());
  adresses.delete('cristo67apps@gmail.com');
  ok(adresses.size === 0, 'adresse électronique inattendue : ' + Array.from(adresses).join(', '));
}
const manifeste = JSON.parse(lire('manifest.webmanifest'));
ok(manifeste.short_name === '1870' && manifeste.icons.length === 3, 'manifeste');

// ── 2. Articles ───────────────────────────────────────────────────────────
console.log('articles');
const donnees = JSON.parse(lire('data/articles.json'));
const articles = donnees.articles;
const ids = new Set(articles.map((a) => a.id));
const plan = [...lire('build/PLAN-ARTICLES.txt').matchAll(/^([a-z0-9][a-z0-9-]*) \|/gm)].map((m) => m[1]);
if (!PARTIEL) for (const id of plan) ok(ids.has(id), 'article prévu absent : ' + id);
for (const a of articles) ok(plan.includes(a.id), 'article hors plan : ' + a.id);
const cats = new Set(donnees.categories.map((c) => c.id));
let mots = 0;
const permis = PARTIEL ? new Set(plan) : ids;
for (const a of articles) {
  ok(cats.has(a.c), a.id + ' : catégorie ' + a.c);
  ok(a.n && a.def && a.tx.length, a.id + ' : nom, définition ou texte vide');
  mots += a.tx.join(' ').split(/\s+/).length;
  const textes = [a.def, a.at || '', a.nc || ''].concat(a.tx, a.re.map((r) => r[1]));
  for (const t of textes) {
    for (const m of t.matchAll(/\[\[([^\]|]+)/g)) ok(permis.has(m[1]), a.id + ' : renvoi vers ' + m[1]);
    ok(!/\[\[[^\]]*$|\*\*|<\/?[a-z]/.test(t), a.id + ' : balisage suspect « ' + t.slice(0, 40) + ' »');
  }
  for (const v of a.vo) ok(permis.has(v), a.id + ' : voir ' + v);
  if (a.g) {
    ok(a.g[0] > 42 && a.g[0] < 55 && a.g[1] > -5 && a.g[1] < 14, a.id + ' : coordonnées hors du théâtre ' + a.g);
    ok(/, [A-ZÉ][^,]+$/.test(a.lo), a.id + ' : « lieu » sans pays en dernier : ' + a.lo);
  }
  if (a.c === 'batailles' || (a.c === 'sieges' && a.id !== 'places-fortes-en-1870' && a.id !== 'vie-a-paris-pendant-le-siege')) {
    ok(a.g && a.q, a.id + ' : bataille ou siège sans lieu ou sans date');
    ok(!a.q || (a.q >= '1870-07' && a.q <= '1871-03'), a.id + ' : date hors de la guerre ' + a.q);
  }
  if (a.c === 'personnages') ok(a.ca && a.an && a.fin, a.id + ' : personnage sans camp ou sans dates');
  for (const cle of ['ef', 'cn', 'pe']) if (a[cle]) ok(a[cle].length === 2 && a[cle].every((n) => n === null || (Number.isInteger(n) && n >= 0 && n < 2000000)), a.id + ' : ' + cle + ' illisible');
  if (a.ef && a.pe) ok(a.pe.every((p, i) => p === null || a.ef[i] === null || p <= a.ef[i]), a.id + ' : plus de pertes que d’hommes');
  for (const im of a.im || []) {
    ok(fs.existsSync(path.join(RACINE, im.f)), a.id + ' : image absente ' + im.f);
    ok(/^(domaine public|CC0|CC BY( \d\.\d)?|CC BY-SA( \d\.\d)?)$/.test(im.li), a.id + ' : licence ' + im.li);
    ok(im.cr && im.l && !/à revoir/.test(im.l), a.id + ' : image sans légende ou sans crédit');
  }
  for (const [, , adresse] of a.li) ok(/^https:\/\//.test(adresse) && !/gallica\.bnf/.test(adresse), a.id + ' : lien ' + adresse);
}
if (!PARTIEL) ok(mots > 75000, 'plus de 75 000 mots (' + mots + ')');
const precache = JSON.parse(lire('data/precache.json'));
for (const f of Object.keys(precache)) ok(fs.existsSync(path.join(RACINE, f)), 'precache : ' + f + ' absent');
const imgs = fs.existsSync(path.join(RACINE, 'img')) ? fs.readdirSync(path.join(RACINE, 'img')) : [];
for (const f of imgs) ok(precache['img/' + f], 'image orpheline img/' + f);

// ── 3. Extraits ───────────────────────────────────────────────────────────
console.log('textes');
const { textes, genres } = JSON.parse(lire('data/textes.json'));
const genresIds = new Set(genres.map((g) => g.id));
if (!PARTIEL) ok(textes.length >= 60, 'au moins 60 extraits (' + textes.length + ')');
for (const t of textes) {
  ok(genresIds.has(t.g), t.id + ' : genre ' + t.g);
  ok(t.au && t.ti && t.in && (t.p || t.v), t.id + ' : extrait incomplet');
  if (t.vie) ok(parseInt(t.vie.split('–')[1], 10) < 1956, t.id + ' : auteur mort après 1955');
  ok(t.ga && /^(bpt6k|btv1b|bd6t|cb)\w+/.test(t.ga[0]), t.id + ' : cote Gallica');
  ok(t.so && /^https:\/\//.test(t.so[2]), t.id + ' : source du texte');
  for (const id of t.po) ok(permis.has(id), t.id + ' : article lié inconnu ' + id);
}

// ── 4. Cartes animées ─────────────────────────────────────────────────────
console.log('cartes');
const { cartes } = JSON.parse(lire('data/cartes.json'));
ok(cartes.length >= 5, 'au moins cinq cartes animées (' + cartes.length + ')');
for (const c of cartes) {
  const fond = JSON.parse(lire('data/fond-' + c.fond + '.json'));
  const [x0, y0, l, h] = fond.cadre;
  const dedans = ([x, y], marge) => x >= x0 - marge && x <= x0 + l + marge && y >= y0 - marge && y <= y0 + h + marge;
  let avant = '';
  c.etapes.forEach((e, k) => {
    const lieu = c.id + ' étape ' + (k + 1);
    ok(e.date >= avant, lieu + ' : dates dans le désordre');
    avant = e.date;
    ok(e.titre && e.texte.length, lieu + ' : sans titre ni texte');
    ok(e.vue[2] > 0 && e.vue[3] > 0 && dedans([e.vue[0], e.vue[1]], l * 0.05), lieu + ' : cadre hors du fond');
    for (const [id, p] of Object.entries(e.pos)) {
      ok(c.unites[id], lieu + ' : unité inconnue ' + id);
      ok(dedans(p, l * 0.02), lieu + ' : ' + id + ' hors du fond');
    }
    for (const m of e.marques || []) {
      ok(dedans([m.x, m.y], 0), lieu + ' : marque « ' + m.nom + ' » hors du fond');
      if (m.a) ok(permis.has(m.a), lieu + ' : marque vers ' + m.a);
    }
    for (const id of e.articles || []) ok(permis.has(id), lieu + ' : article ' + id);
    for (const t of e.texte) for (const m of t.matchAll(/\[\[([^\]|]+)/g)) ok(permis.has(m[1]), lieu + ' : renvoi ' + m[1]);
  });
}

// ── 5. Bac à sable ────────────────────────────────────────────────────────
console.log('modules');
const noeud = () => ({ appendChild(e) { (this.enfants = this.enfants || []).push(e); return e; }, setAttribute() {}, addEventListener() {}, classList: { add() {}, toggle() {} }, style: { setProperty() {} }, dataset: {} });
const bac = {
  console, matchMedia: () => ({ matches: false, addEventListener() {} }),
  localStorage: { getItem: () => null, setItem() {} },
  navigator: {},
  document: {
    addEventListener() {},
    createElement: (b) => Object.assign(noeud(), { tagName: b.toUpperCase() }),
    createElementNS: (ns, b) => Object.assign(noeud(), { tagName: b }),
    createTextNode: (t) => ({ textContent: t, nodeType: 3 }),
    createDocumentFragment: () => noeud(),
    documentElement: { setAttribute() {}, removeAttribute() {} },
    querySelector: () => null,
  },
  fetch: async (u) => ({ ok: true, json: async () => JSON.parse(lire(u)) }),
};
bac.window = bac;
vm.createContext(bac);
for (const f of ['js/outils.js', 'js/reglages.js', 'js/donnees.js', 'js/voix.js']) vm.runInContext(lire(f), bac, { filename: f });
await bac.Donnees.charger();
const { Donnees, Voix } = bac;

const premier = (q) => (Donnees.rechercher(q)[0] || { a: {} }).a.id;
const cherche = [['Sedan', 'bataille-de-sedan'], ['Bazaine', 'bazaine'], ['chassepot', 'fusil-chassepot'], ['Ems', 'depeche-d-ems'],
  ['Frœschwiller', 'bataille-de-froeschwiller-woerth'], ['froeschwiller', 'bataille-de-froeschwiller-woerth'], ['Moltke', 'moltke']];
for (const [q, id] of cherche) if (ids.has(id)) ok(premier(q) === id, 'recherche « ' + q + ' » → ' + premier(q));
if (ids.has('bataille-de-sedan')) ok(Donnees.anniversaires(1, 9).some((x) => x.an === 1870), 'un 1er septembre : Sedan');
ok(Donnees.dates().every((a, i, l) => !i || Bac(l[i - 1].q) <= Bac(a.q)), 'chronologie dans l’ordre');
function Bac(q) { return bac.Dates.cle(q); }
for (const a of Donnees.articles) ok(!/\[\[|\]\]|\*/.test(Donnees.nu(a.def)), a.id + ' : définition nue avec balisage');
for (const c of cartes) for (const e of c.etapes) for (const id of e.articles || []) if (!PARTIEL) ok(Donnees.article(id), c.id + ' : article ' + id);

// la lecture à voix haute
const dit = (t, attendu) => ok(Voix.preparer(t) === attendu, 'voix : « ' + t + ' » → « ' + Voix.preparer(t) + ' »');
dit('19 juillet 1870 – 10 mai 1871', '19 juillet 1870 à 10 mai 1871');
dit('Guillaume Iᵉʳ', 'Guillaume premier');
dit('le 1ᵉʳ septembre', 'le premier septembre');
for (const a of Donnees.articles) {
  const t = Voix.preparer([a.n, a.da, Donnees.nu(a.def)].concat(a.tx.map(Donnees.nu), a.re.map((r) => r[0] + ' : ' + Donnees.nu(r[1]))).join(' '));
  ok(!/[ᵉʳ]|\bv\. ?\d/.test(t), a.id + ' : il reste des signes qu’une voix écorche — ' + (t.match(/.{0,20}(?:[ᵉʳ]|\bv\. ?\d).{0,10}/) || [''])[0]);
}

console.log('\n' + reussites + ' épreuves réussies, ' + echecs + ' échec(s)');
process.exit(echecs ? 1 : 0);

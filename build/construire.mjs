/*
 * Construit les données de « 1870 » à partir des sources de build/.
 *
 *     node build/construire.mjs                       tout construire → data/*.json
 *     node build/construire.mjs --verifier <fichier>  vérifier un seul fichier d'articles (format, renvois)
 *     node build/construire.mjs --verifier-textes <fichier>   vérifier un fichier d'extraits (build/textes/)
 *
 * ── Le format d'un article (build/articles/*.txt) ───────────────────────────
 *
 * Une ligne « clé: valeur » par champ ; une ligne qui commence par deux espaces
 * continue le champ précédent. Une ligne vide sépare deux champs, « # » ouvre
 * un commentaire.
 *
 *     @ bataille-de-wissembourg     l'identifiant (minuscules, chiffres, tirets)
 *     cat: batailles                la catégorie (voir CATEGORIES)
 *     nom: Bataille de Wissembourg  la vedette
 *     alias: Weissenburg, Geisberg  autres noms cherchés par la recherche (facultatif)
 *     dates: 4 août 1870            (facultatif) ce qu'on affiche sous la vedette
 *     quand: 1870-08-04             (événements) la date, AAAA-MM-JJ (ou AAAA-MM, ou AAAA)
 *     jusqu: 1870-08-06             (facultatif, avec quand) le dernier jour
 *     an: 1809                      (personnages) année de naissance ; fin: année de mort
 *     camp: fr                      (personnages ; facultatif ailleurs) fr, de ou autre
 *     role: général de division     (personnages, facultatif) la fonction en 1870, en quelques mots
 *     def: Une phrase.              la définition courte : listes, carte, recherche
 *     texte: Un paragraphe…         le corps ; un « texte: » par paragraphe
 *     repere: 4 août 1870, 8 h — Un fait.   une date — tiret cadratin — un fait ; dans l'ordre
 *     attention: …                  (facultatif) l'idée reçue, la légende, le point discuté
 *     issue: victoire allemande     (batailles, sièges) l'issue en quelques mots
 *     effectifs: 8000 | 50000       (batailles, sièges) Français | Allemands, nombres seuls ; « ? » si inconnu
 *     canons: 18 | 144              (facultatif) idem
 *     pertes: 2300 | 1550           (facultatif) idem : tués, blessés, disparus, prisonniers du jour
 *     chefs: Abel Douay | le Kronprinz Frédéric-Guillaume   (facultatif) Français | Allemands
 *     chiffres: D'après …           (facultatif) d'où viennent ces chiffres, les fourchettes
 *     fiche: Calibre = 11 mm        (facultatif, plusieurs) une ligne de fiche technique « Libellé = valeur »
 *     geo: 49.0367, 7.9450          (batailles, sièges, lieux) latitude, longitude
 *     lieu: Wissembourg, Bas-Rhin, France   (avec geo) où c'est, en clair ; le pays en dernier
 *     lien: wp Bataille de Wissembourg (1870)   (plusieurs) une page extérieure : voir SORTES
 *     sources: Roth 1990 ; …        les ouvrages et pages consultés, en clair
 *     voir: id, id                  articles voisins
 *
 * Dans « def », « texte », « repere », « attention », « chiffres » :
 *     [[id]]  renvoi vers un article (affiché sous son nom) ; [[id|texte]] sous un autre texte ;
 *     *titre* italique.
 *
 * Le script échoue à la moindre incohérence : une erreur de contenu ne doit pas
 * arriver dans le téléphone de quelqu'un.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.dirname(ICI);

export const CATEGORIES = [
  { id: 'guerre', nom: 'La guerre', couleur: '#8c2f39' },
  { id: 'personnages', nom: 'Personnages', couleur: '#6b4c9a' },
  { id: 'batailles', nom: 'Batailles', couleur: '#b3402a' },
  { id: 'sieges', nom: 'Sièges', couleur: '#9c7c2b' },
  { id: 'forces', nom: 'Rapports de force', couleur: '#2f5fa3' },
  { id: 'armes', nom: 'Armes et techniques', couleur: '#4d6a5a' },
  { id: 'memoire', nom: 'Mémoire', couleur: '#6f675c' },
];
const ID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));
const CAMPS = new Set(['fr', 'de', 'autre']);

/* Une vedette qui commence par un article ou par l'un de ces noms communs
 * s'écrit avec une minuscule au fil d'une phrase : « la [[bataille-de-sedan]] ». */
const DEBUTS_COMMUNS = /^(Le |La |Les |L’|L'|Bataille|Batailles|Siège|Combat|Combats|Sabres|Pigeons|Turcos|Tombes|Chansons|Photographie|Idées|Espionnage|Intendance|Service de)/;

/* Les articles de vue d'ensemble, sans lieu ni jour précis. */
const SANS_GEO = new Set(['places-fortes-en-1870', 'vie-a-paris-pendant-le-siege']);

const CLES = new Set(['cat', 'nom', 'alias', 'dates', 'quand', 'jusqu', 'an', 'fin', 'camp', 'role', 'def', 'texte', 'repere',
  'attention', 'issue', 'effectifs', 'canons', 'pertes', 'chefs', 'chiffres', 'fiche', 'geo', 'lieu', 'lien', 'sources', 'voir']);

const erreurs = [];
const avertissements = [];
const SOUPLE = process.argv.includes('--souple');
function erreur(lieu, message) { erreurs.push(lieu + ' — ' + message); }
function avertir(lieu, message) { avertissements.push(lieu + ' — ' + message); }

// ── Typographie ─────────────────────────────────────────────────────────────

const FINE = String.fromCharCode(0x202f);
const INSECABLE = String.fromCharCode(0xa0);
const EXPOSANT_E = String.fromCharCode(0x1d49);
const EXPOSANT_R = String.fromCharCode(0x2b3);

function typoBrute(texte) {
  return texte
    .replace(/(\p{L})'(?=\p{L}|\[\[|\*)/gu, '$1’')
    // ordinaux en chiffres romains : XIXe, Ier, Ire (mais pas le mot « Vie »)
    .replace(/\b([IVX]+)(e|er|re)(?=[\s,.;:!?)»–-]|$)/g, (tout, n, suffixe) => {
      if (tout === 'Vie' || tout === 'Ie') return tout;
      return n + (suffixe === 'e' ? EXPOSANT_E : suffixe === 'er' ? EXPOSANT_E + EXPOSANT_R : EXPOSANT_R + EXPOSANT_E);
    })
    // ordinaux en chiffres arabes : 1er, 1re, 2e, 13e
    .replace(/(?<![\p{L}\d])(\d+)(e|er|re)(?=[\s,.;:!?)»–-]|$)/gu, (tout, n, suffixe) => {
      if ((suffixe === 'er' || suffixe === 're') && n !== '1') return tout;
      return n + (suffixe === 'e' ? EXPOSANT_E : suffixe === 'er' ? EXPOSANT_E + EXPOSANT_R : EXPOSANT_R + EXPOSANT_E);
    })
    // milliers : 48 000 → espace fine insécable
    .replace(/(?<!\d)(\d{1,3})((?: \d{3})+)(?!\d)/g, (tout, tete, suite) => tete + suite.replace(/ /g, FINE))
    .replace(/(\d) (h|km|m|mm|cm|kg|g|F|%)(?=[\s,.;:!?)»]|$)/g, '$1' + INSECABLE + '$2')
    .replace(/ ([;:!?])/g, FINE + '$1')
    .replace(/« /g, '«' + INSECABLE)
    .replace(/ »/g, INSECABLE + '»')
    .replace(/ – /g, INSECABLE + '– ');
}

/* La typographie ne touche pas aux identifiants des renvois. */
export function typographie(texte) {
  const source = String(texte || '');
  let sortie = '';
  let pos = 0;
  const motif = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = motif.exec(source)) !== null) {
    sortie += typoBrute(source.slice(pos, m.index) + '\x01').slice(0, -1);
    sortie += '[[' + m[1] + (m[2] !== undefined ? '|' + typoBrute(m[2]) : '') + ']]';
    pos = m.index + m[0].length;
  }
  sortie += typoBrute(source.slice(pos));
  // l'apostrophe juste avant un renvoi : « l'[[armee-du-rhin|armée du Rhin]] »
  return sortie.replace(/(\p{L})'(?=\[\[)/gu, '$1’');
}

// ── Dates ───────────────────────────────────────────────────────────────────

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DATE_ISO = /^\d{4}(-\d\d){0,2}$/;

/* « 6 août 1870, vers 13 h » → { a: 1870, m: 8, j: 6, h: 13 } ; ce qui manque vaut 0. */
function dateDe(date, anneeParDefaut) {
  const d = { a: 0, m: 0, j: 0, h: -1 };
  const an = /(?<!\d)(1[5-9]\d\d|20\d\d)(?!\d)/.exec(date);
  if (an) d.a = parseInt(an[1], 10);
  else if (anneeParDefaut) d.a = anneeParDefaut;
  const bas = date.toLowerCase();
  let posMois = -1;
  MOIS.forEach((nom, i) => {
    const k = bas.indexOf(nom);
    if (k >= 0 && (posMois < 0 || k < posMois)) { posMois = k; d.m = i + 1; }
  });
  if (posMois >= 0) {
    const avant = /(\d{1,2})(?:er)?(?:\s*[-–]\s*\d{1,2}(?:er)?)?\s*$/.exec(bas.slice(0, posMois).trimEnd());
    const plage = /(\d{1,2})(?:er)?\s*(?:[-–]|au|et)\s*\d{1,2}(?:er)?\s*$/.exec(bas.slice(0, posMois).trimEnd());
    if (plage) d.j = parseInt(plage[1], 10);
    else if (avant) d.j = parseInt(avant[1], 10);
  }
  const heure = /(\d{1,2})\s*h(?:\s*(\d{2}))?/.exec(bas);
  if (heure) d.h = parseInt(heure[1], 10) + (heure[2] ? parseInt(heure[2], 10) / 60 : 0);
  return d;
}

function avantDate(x, y) {
  if (!x.a || !y.a) return false;
  if (x.a !== y.a) return x.a < y.a;
  if (!x.m || !y.m) return false;
  if (x.m !== y.m) return x.m < y.m;
  if (!x.j || !y.j) return false;
  if (x.j !== y.j) return x.j < y.j;
  if (x.h < 0 || y.h < 0) return false;
  return x.h < y.h;
}

// ── Lecture d'un fichier d'articles ─────────────────────────────────────────

function nombres(valeur, lieu, cle) {
  const p = valeur.split('|').map((s) => s.trim());
  if (p.length !== 2) { erreur(lieu, '« ' + cle + ': » attend « Français | Allemands »'); return null; }
  return p.map((s) => {
    if (s === '?' || s === '') return null;
    const n = s.replace(/\s/g, '');
    if (!/^\d+$/.test(n)) { erreur(lieu, '« ' + cle + ': » attend des nombres seuls (« 8000 | 50000 »), lu « ' + s + ' »'); return null; }
    return parseInt(n, 10);
  });
}

export function lireFichier(fichier, articles) {
  const nom = path.basename(fichier);
  const lignes = fs.readFileSync(fichier, 'utf-8').replace(/^\s+/, '').replace(/\r\n?/g, '\n').split('\n');
  let article = null;
  let champ = null;

  lignes.forEach((ligne, i) => {
    const lieu = nom + ':' + (i + 1);
    if (ligne.trim() === '') { champ = null; return; }
    if (ligne.startsWith('#')) return;

    if (ligne.startsWith('@ ')) {
      const id = ligne.slice(2).trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) erreur(lieu, 'identifiant invalide « ' + id + ' »');
      article = { id, cat: null, nom: null, al: [], dates: '', quand: null, jusqu: null, an: null, fin: null, camp: null, role: '',
        def: '', textes: [], reperes: [], attention: '', issue: '', effectifs: null, canons: null, pertes: null, chefs: null,
        chiffres: '', fiche: [], geo: null, lo: '', liens: [], sources: '', voir: [], lieu, fichier: nom };
      articles.push(article);
      champ = null;
      return;
    }
    if (!article) { erreur(lieu, 'contenu avant le premier « @ identifiant »'); return; }

    if (ligne.startsWith('  ')) {
      if (!champ) { erreur(lieu, 'ligne indentée sans champ à continuer'); return; }
      if (champ.indice !== undefined) {
        champ.cible[champ.cle][champ.indice] = (champ.cible[champ.cle][champ.indice] + ' ' + ligne.trim()).trim();
      } else {
        champ.cible[champ.cle] = (champ.cible[champ.cle] + ' ' + ligne.trim()).trim();
      }
      return;
    }

    const m = /^([a-z]+):\s?(.*)$/.exec(ligne);
    if (!m || !CLES.has(m[1])) { erreur(lieu, 'ligne incomprise : « ' + ligne.slice(0, 70) + ' »'); return; }
    const cle = m[1];
    const valeur = m[2].trim();
    champ = null;
    switch (cle) {
      case 'cat': article.cat = valeur; break;
      case 'nom': article.nom = valeur; break;
      case 'alias': article.al = valeur.split(',').map((s) => s.trim()).filter(Boolean); break;
      case 'dates': article.dates = valeur; break;
      case 'quand':
        if (!DATE_ISO.test(valeur)) erreur(lieu, '« quand: » illisible « ' + valeur + ' » (AAAA-MM-JJ)');
        article.quand = valeur; break;
      case 'jusqu':
        if (!DATE_ISO.test(valeur)) erreur(lieu, '« jusqu: » illisible « ' + valeur + ' » (AAAA-MM-JJ)');
        article.jusqu = valeur; break;
      case 'an':
        if (!/^\d{4}$/.test(valeur)) erreur(lieu, 'année invalide « ' + valeur + ' » (un nombre seul)');
        article.an = parseInt(valeur, 10);
        break;
      case 'fin':
        if (!/^\d{4}$/.test(valeur)) erreur(lieu, 'année de fin invalide « ' + valeur + ' »');
        article.fin = parseInt(valeur, 10);
        break;
      case 'camp':
        if (!CAMPS.has(valeur)) erreur(lieu, 'camp inconnu « ' + valeur + ' » (fr, de, autre)');
        article.camp = valeur; break;
      case 'role': article.role = valeur; break;
      case 'def':
        if (article.def) erreur(lieu, 'deux « def: »');
        article.def = valeur; champ = { cible: article, cle: 'def' };
        break;
      case 'texte':
        article.textes.push(valeur);
        champ = { cible: article, cle: 'textes', indice: article.textes.length - 1 };
        break;
      case 'repere':
        article.reperes.push(valeur);
        champ = { cible: article, cle: 'reperes', indice: article.reperes.length - 1 };
        break;
      case 'attention': article.attention = valeur; champ = { cible: article, cle: 'attention' }; break;
      case 'issue': article.issue = valeur; break;
      case 'effectifs': article.effectifs = nombres(valeur, lieu, cle); break;
      case 'canons': article.canons = nombres(valeur, lieu, cle); break;
      case 'pertes': article.pertes = nombres(valeur, lieu, cle); break;
      case 'chefs': {
        const p = valeur.split('|').map((s) => s.trim());
        if (p.length !== 2) erreur(lieu, '« chefs: » attend « Français | Allemands »');
        else article.chefs = p;
        break;
      }
      case 'chiffres': article.chiffres = valeur; champ = { cible: article, cle: 'chiffres' }; break;
      case 'fiche': {
        const k = valeur.indexOf(' = ');
        if (k < 1) { erreur(lieu, '« fiche: » attend « Libellé = valeur »'); break; }
        article.fiche.push([valeur.slice(0, k).trim(), valeur.slice(k + 3).trim()]);
        break;
      }
      case 'geo': {
        const g = /^(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})$/.exec(valeur);
        if (!g) { erreur(lieu, 'coordonnées illisibles « ' + valeur + ' » (« 48.3819, 3.9742 »)'); break; }
        const [lat, lon] = [parseFloat(g[1]), parseFloat(g[2])];
        if (lat < 35 || lat > 60 || lon < -85 || lon > 25) erreur(lieu, 'coordonnées hors de la carte « ' + valeur + ' »');
        article.geo = [lat, lon];
        break;
      }
      case 'lieu': article.lo = valeur; break;
      case 'lien': article.liens.push({ texte: valeur, lieu }); break;
      case 'sources': article.sources = valeur; champ = { cible: article, cle: 'sources' }; break;
      case 'voir': article.voir = valeur.split(',').map((s) => s.trim()).filter(Boolean); break;
      default: break;
    }
  });
}

// ── Les renvois dans le texte ───────────────────────────────────────────────

function analyser(texte, lieu, ids) {
  const cites = [];
  const sansLiens = texte.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (tout, id, libelle) => {
    if (!ids.has(id)) erreur(lieu, 'renvoi vers un article inexistant « ' + id + ' »');
    if (libelle !== undefined && !libelle.trim()) erreur(lieu, 'renvoi au libellé vide « ' + id + ' »');
    if (libelle !== undefined && libelle.includes('*')) erreur(lieu, 'italique dans le libellé d’un renvoi « ' + id + ' »');
    cites.push(id);
    return libelle || 'X';
  });
  if (/\[\[|\]\]/.test(sansLiens)) erreur(lieu, 'crochets de renvoi mal fermés');
  if ((sansLiens.match(/\*/g) || []).length % 2) erreur(lieu, 'italique mal fermée (nombre impair d’astérisques)');
  if (/\bTBD\b|\bXXX\b|\?\?\?|à compléter|lorem ipsum|\[citation/i.test(texte)) erreur(lieu, 'marque de travail restée dans le texte');
  if (/<[a-z]+>|&[a-z]+;|\*\*/.test(texte)) erreur(lieu, 'balise HTML ou Markdown dans le texte (seuls [[ ]] et * sont permis)');
  if (/\s{2,}/.test(texte)) avertir(lieu, 'espaces doublées');
  return cites;
}

export function nu(texte, noms) {
  return String(texte || '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (tout, id, libelle) => libelle || (noms && noms.get(id)) || id)
    .replace(/\*/g, '');
}

// ── Les repères ─────────────────────────────────────────────────────────────

function lireReperes(a, lieu, ids, liens) {
  const sortie = [];
  let avant = null;
  for (const r of a.reperes) {
    const m = /^(.+?) — (.+)$/.exec(r);
    if (!m) { erreur(lieu, 'repère sans « date — fait » (tiret cadratin entouré d’espaces) : « ' + r.slice(0, 50) + ' »'); continue; }
    const [, date, fait] = m;
    if (date.length > 34) erreur(lieu, 'date de repère trop longue « ' + date + ' »');
    if (!/\d|si[eè]cle/.test(date)) erreur(lieu, 'date de repère sans chiffre « ' + date + ' »');
    if (!/[.!?»)]$/.test(fait)) avertir(lieu, 'repère sans point final « ' + fait.slice(-30) + ' »');
    for (const id of analyser(fait, lieu, ids)) liens.add(id);
    const d = dateDe(date, avant ? avant.a : (a.quand ? parseInt(a.quand.slice(0, 4), 10) : 0));
    if (avant && avantDate(d, avant)) erreur(lieu, 'repères dans le désordre : « ' + date + ' » vient après une date plus tardive');
    if (d.a) avant = d;
    sortie.push([typographie(date), typographie(fait)]);
  }
  return sortie;
}

// ── Les liens vers d'autres sites ───────────────────────────────────────────

function titreUrl(titre) {
  return encodeURIComponent(titre.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':')
    .replace(/%2C/g, ',').replace(/%28/g, '(').replace(/%29/g, ')').replace(/%27/g, "'");
}
const SORTES = {
  wp: (v) => ['Wikipédia', v, 'https://fr.wikipedia.org/wiki/' + titreUrl(v)],
  en: (v) => ['Wikipedia (en anglais)', v, 'https://en.wikipedia.org/wiki/' + titreUrl(v)],
  de: (v) => ['Wikipedia (en allemand)', v, 'https://de.wikipedia.org/wiki/' + titreUrl(v)],
  it: (v) => ['Wikipedia (en italien)', v, 'https://it.wikipedia.org/wiki/' + titreUrl(v)],
  ws: (v, l) => ['Wikisource', l || v, 'https://fr.wikisource.org/wiki/' + titreUrl(v)],
  gallica: (v, l) => ['Gallica (BnF)', l, 'https://gallica.bnf.fr/ark:/12148/' + v],
  ia: (v, l) => ['Internet Archive', l, 'https://archive.org/details/' + v],
  persee: (v, l) => ['Persée', l, 'https://www.persee.fr/doc/' + v],
  url: (v, l) => [new URL(v).hostname.replace(/^www\./, ''), l, v],
};
const AVEC_LIBELLE = new Set(['gallica', 'ia', 'persee', 'url']);
const VALEURS = {
  gallica: /^(bpt6k|btv1b|bd6t|cb)[0-9a-z]+(\/f\d+(\.item|\.image)?)?$/,
  ia: /^[A-Za-z0-9._-]+$/,
  url: /^https:\/\/[^\s]+$/,
};

function lireLien(morceau, lieu) {
  const mm = /^([a-z]+) (.+)$/.exec(morceau.trim());
  if (!mm || !SORTES[mm[1]]) { erreur(lieu, 'lien incompris « ' + morceau + ' » (sortes : ' + Object.keys(SORTES).join(', ') + ')'); return null; }
  const [, sorte, brut] = mm;
  let valeur = brut.trim();
  let libelle = '';
  const k = valeur.indexOf(' = ');
  if (k >= 0) {
    libelle = valeur.slice(k + 3).trim();
    valeur = valeur.slice(0, k).trim();
  } else if (AVEC_LIBELLE.has(sorte)) {
    erreur(lieu, 'lien « ' + sorte + ' » sans « = libellé »'); return null;
  }
  if (VALEURS[sorte] && !VALEURS[sorte].test(valeur)) { erreur(lieu, 'valeur « ' + sorte + ' » invalide « ' + valeur + ' »'); return null; }
  if (/wikipedia\.org|wikisource\.org/.test(valeur) && sorte === 'url') { erreur(lieu, 'une page Wikipédia s’écrit « wp Titre », pas en adresse'); return null; }
  return SORTES[sorte](valeur, typographie(libelle));
}

// ── Les illustrations ───────────────────────────────────────────────────────

/* build/illustrations.json, écrit par build/illustrer.py : chaque image, son
 * fichier dans img/, sa légende, son crédit, sa licence, les articles où elle
 * paraît. */
function lireIllustrations(ids) {
  const fichier = path.join(ICI, 'illustrations.json');
  const resultat = { parArticle: new Map(), nombre: 0, octets: 0 };
  if (!fs.existsSync(fichier)) return resultat;
  const { images } = JSON.parse(fs.readFileSync(fichier, 'utf-8'));
  for (const [id, im] of Object.entries(images)) {
    const chemin = path.join(RACINE, im.f);
    if (!fs.existsSync(chemin)) { erreur('illustrations', 'fichier absent : ' + im.f + ' (relancer build/illustrer.py)'); continue; }
    resultat.nombre += 1;
    resultat.octets += fs.statSync(chemin).size;
    for (const ref of im.pour) {
      if (!ids.has(ref)) { (SOUPLE ? avertir : erreur)('illustrations', 'image « ' + id + ' » : article inexistant « ' + ref + ' »'); continue; }
      if (!resultat.parArticle.has(ref)) resultat.parArticle.set(ref, []);
      resultat.parArticle.get(ref).push({ f: im.f, v: im.v, w: im.w, h: im.h, l: typographie(im.l), cr: typographie(im.cr), li: im.li, src: im.src });
    }
  }
  return resultat;
}

// ── Le plan ─────────────────────────────────────────────────────────────────

export function lirePlan() {
  const fichier = path.join(ICI, 'PLAN-ARTICLES.txt');
  const ids = new Set();
  if (!fs.existsSync(fichier)) return ids;
  for (const ligne of fs.readFileSync(fichier, 'utf-8').split(/\r?\n/)) {
    const m = /^([a-z0-9][a-z0-9-]*) \|/.exec(ligne);
    if (m) ids.add(m[1]);
  }
  return ids;
}

// ── Vérification d'un article ───────────────────────────────────────────────

function verifierArticle(a, ids) {
  const lieu = a.lieu + ' (' + a.id + ')';
  if (!a.nom) erreur(lieu, 'pas de « nom: »');
  if (!ID_CATEGORIES.has(a.cat)) erreur(lieu, 'catégorie inconnue « ' + a.cat + ' » (' + CATEGORIES.map((c) => c.id).join(', ') + ')');
  if (!a.def) erreur(lieu, 'pas de « def: »');
  else if (a.def.length < 60) avertir(lieu, 'définition très courte');
  else if (a.def.length > 420) avertir(lieu, 'définition longue (' + a.def.length + ' caractères) : une phrase ou deux');
  if (!a.textes.length) erreur(lieu, 'pas de « texte: »');
  const mots = a.textes.join(' ').split(/\s+/).length;
  if (mots < 120) avertir(lieu, 'texte court (' + mots + ' mots)');
  if (a.fin !== null && a.an === null) erreur(lieu, '« fin: » sans « an: »');
  if (a.fin !== null && a.an !== null && a.fin < a.an) erreur(lieu, '« fin: » avant « an: »');
  if (a.jusqu && !a.quand) erreur(lieu, '« jusqu: » sans « quand: »');
  if (a.jusqu && a.quand && a.jusqu < a.quand) erreur(lieu, '« jusqu: » avant « quand: »');
  if (a.cat === 'personnages') {
    if (!a.camp) erreur(lieu, 'un personnage porte « camp: » (fr, de, autre)');
    if (a.an === null) erreur(lieu, 'un personnage porte « an: » (naissance) et « fin: » (mort)');
  }
  if (['batailles', 'sieges'].includes(a.cat) && !SANS_GEO.has(a.id)) {
    if (!a.geo) erreur(lieu, 'une bataille, un siège porte « geo: »');
    if (!a.quand) erreur(lieu, 'une bataille, un siège porte « quand: » (AAAA-MM-JJ)');
    if (!a.issue) avertir(lieu, 'pas d’« issue: »');
    if (!a.effectifs) avertir(lieu, 'pas d’« effectifs: »');
  }
  if (a.geo && !a.lo) erreur(lieu, '« geo: » sans « lieu: »');
  for (const cle of ['effectifs', 'canons', 'pertes']) {
    if (a[cle] && a[cle].every((x) => x === null)) erreur(lieu, '« ' + cle + ': » sans aucun nombre');
  }
  if ((a.effectifs || a.pertes || a.canons) && !a.chiffres) avertir(lieu, 'des chiffres sans « chiffres: » (d’où viennent-ils ?)');
  const liens = new Set();
  for (const champ of [a.def, a.attention, a.chiffres].concat(a.textes)) {
    for (const id of analyser(champ, lieu, ids)) liens.add(id);
  }
  for (const [, valeur] of a.fiche) analyser(valeur, lieu, ids);
  a.reperesLus = lireReperes(a, lieu, ids, liens);
  if (liens.has(a.id)) erreur(lieu, 'l’article se cite lui-même');
  for (const v of a.voir) {
    if (!ids.has(v)) erreur(lieu, 'voir : article inexistant « ' + v + ' »');
    if (v === a.id) erreur(lieu, 'voir : l’article se cite lui-même');
  }
  if (!a.voir.length) avertir(lieu, 'pas de « voir: »');
  if (a.voir.length > 10) avertir(lieu, 'beaucoup de « voir: » (' + a.voir.length + ')');
  a.liensLus = [];
  for (const l of a.liens) {
    const lu = lireLien(l.texte, l.lieu);
    if (lu) a.liensLus.push(lu);
  }
  const adresses = a.liensLus.map((x) => x[2]);
  if (new Set(adresses).size !== adresses.length) erreur(lieu, 'lien en double');
  if (!a.liensLus.length) avertir(lieu, 'pas de « lien: »');
  if (!a.sources) avertir(lieu, 'pas de « sources: »');
  return liens;
}

function afficher(exit) {
  for (const a of avertissements) console.log('  avertissement : ' + a);
  if (erreurs.length) {
    console.error('\n' + erreurs.length + ' erreur(s) :');
    for (const e of erreurs) console.error('  ✗ ' + e);
    if (exit) process.exit(1);
    return false;
  }
  return true;
}

// ── Assemblage ──────────────────────────────────────────────────────────────

function cleTri(nom) {
  return nom.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/^(le |la |les |l’|l')/, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9 ]+/g, ' ').trim();
}

async function main() {
  const k = process.argv.indexOf('--dossier');
  const dossier = k >= 0 ? path.resolve(process.argv[k + 1]) : path.join(ICI, 'articles');
  const fichiers = fs.existsSync(dossier) ? fs.readdirSync(dossier).filter((f) => f.endsWith('.txt')).sort() : [];
  const articles = [];
  for (const f of fichiers) lireFichier(path.join(dossier, f), articles);

  const ids = new Map();
  const noms = new Map();
  for (const a of articles) {
    if (ids.has(a.id)) erreur(a.lieu, 'identifiant « ' + a.id + ' » déjà pris à ' + ids.get(a.id));
    ids.set(a.id, a.lieu);
    noms.set(a.id, a.nom);
  }
  /* --souple : les renvois vers des articles du plan pas encore écrits passent. */
  const permis = SOUPLE ? new Set([...ids.keys(), ...lirePlan()]) : ids;
  const vedettes = new Map();
  const cites = new Map();
  for (const a of articles) {
    const cle = (a.nom || '').toLowerCase();
    if (vedettes.has(cle)) avertir(a.lieu, 'même vedette que ' + vedettes.get(cle));
    vedettes.set(cle, a.id);
    const liens = verifierArticle(a, permis);
    for (const id of liens) cites.set(id, (cites.get(id) || 0) + 1);
    for (const v of a.voir) cites.set(v, (cites.get(v) || 0) + 1);
  }
  const plan = lirePlan();
  const nonEcrits = Array.from(plan).filter((id) => !ids.has(id));
  if (nonEcrits.length) avertir('plan', nonEcrits.length + ' article(s) prévu(s) non écrit(s) : ' + nonEcrits.slice(0, 12).join(', ') + (nonEcrits.length > 12 ? '…' : ''));
  for (const a of articles) if (!plan.has(a.id)) avertir(a.lieu, 'article hors plan : ' + a.id);
  for (const a of articles) if (!cites.has(a.id) && a.id !== 'guerre-de-1870') avertir(a.lieu, 'aucun article ne cite ' + a.id);

  const illustrations = lireIllustrations(permis);

  // Les autres jeux de données (extraits, frise, cartes animées, rapports de force)
  const annexes = await import('./annexes.mjs').catch((e) => {
    if (e && e.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw e;
  });
  const sortiesAnnexes = annexes ? await annexes.construire({ ids: permis, noms, articles, erreur, avertir, typographie, analyser, RACINE, ICI, SOUPLE }) : {};

  if (!afficher(true)) return;

  // Les articles
  const sortie = articles.map((a) => {
    const o = {
      id: a.id, c: a.cat, n: typographie(a.nom), al: a.al.map(typographie), da: typographie(a.dates),
      def: typographie(a.def), tx: a.textes.map(typographie), re: a.reperesLus,
      vo: SOUPLE ? a.voir.filter((v) => ids.has(v)) : a.voir, li: a.liensLus, so: typographie(a.sources), t: cleTri(a.nom),
    };
    if (a.quand) o.q = a.quand;
    if (a.jusqu) o.j = a.jusqu;
    if (a.an !== null) o.an = a.an;
    if (a.fin !== null) o.fin = a.fin;
    if (a.camp) o.ca = a.camp;
    if (a.role) o.ro = typographie(a.role);
    if (a.attention) o.at = typographie(a.attention);
    if (a.issue) o.is = typographie(a.issue);
    if (a.effectifs) o.ef = a.effectifs;
    if (a.canons) o.cn = a.canons;
    if (a.pertes) o.pe = a.pertes;
    if (a.chefs) o.ch = a.chefs.map(typographie);
    if (a.chiffres) o.nc = typographie(a.chiffres);
    if (a.fiche.length) o.fi = a.fiche.map(([l, v]) => [typographie(l), typographie(v)]);
    if (a.geo) { o.g = a.geo; o.lo = typographie(a.lo); }
    if (DEBUTS_COMMUNS.test(a.nom)) o.mn = 1;
    if (illustrations.parArticle.has(a.id)) o.im = illustrations.parArticle.get(a.id);
    o.dn = nu(o.def, noms);
    return o;
  }).sort((x, y) => x.t.localeCompare(y.t, 'fr'));

  const mots = articles.reduce((s, a) => s + a.textes.join(' ').split(/\s+/).length, 0);
  const version = new Date().toISOString().slice(0, 10);
  const donnees = { version, categories: CATEGORIES.map(({ id, nom, couleur }) => ({ id, nom, couleur })), articles: sortie };
  fs.mkdirSync(path.join(RACINE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(RACINE, 'data', 'articles.json'), JSON.stringify(donnees), 'utf-8');
  for (const [nom, contenu] of Object.entries(sortiesAnnexes)) {
    fs.writeFileSync(path.join(RACINE, 'data', nom), JSON.stringify(contenu), 'utf-8');
  }
  // la liste des images, avec leur empreinte, pour le cache hors ligne
  const precache = {};
  for (const liste of illustrations.parArticle.values()) for (const im of liste) precache[im.f] = im.v;
  fs.writeFileSync(path.join(RACINE, 'data', 'precache.json'), JSON.stringify(precache), 'utf-8');

  console.log('data/articles.json : ' + sortie.length + ' articles, ' + mots.toLocaleString('fr-FR') + ' mots, '
    + sortie.filter((a) => a.g).length + ' lieux, ' + sortie.filter((a) => a.q).length + ' datés au jour, '
    + sortie.reduce((s, a) => s + a.re.length, 0) + ' repères, ' + sortie.reduce((s, a) => s + a.li.length, 0) + ' liens, '
    + illustrations.nombre + ' images (' + Math.round(illustrations.octets / 1024) + ' Ko), '
    + sortie.filter((a) => a.im).length + ' articles illustrés');
  for (const [nom, contenu] of Object.entries(sortiesAnnexes)) {
    console.log('data/' + nom + ' : ' + (contenu.resume || 'écrit'));
  }
}

function verifier(fichier) {
  const articles = [];
  lireFichier(path.resolve(fichier), articles);
  // les renvois permis : le plan, plus tout ce qui est déjà écrit
  const ids = new Set(lirePlan());
  const dossier = path.join(ICI, 'articles');
  if (fs.existsSync(dossier)) {
    for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.txt'))) {
      if (path.resolve(path.join(dossier, f)) === path.resolve(fichier)) continue;
      const autres = [];
      const avant = erreurs.length;
      try { lireFichier(path.join(dossier, f), autres); } catch (e) { /* un autre fichier en cours d'écriture */ }
      erreurs.length = avant;   // les erreurs des autres fichiers ne sont pas les nôtres
      for (const a of autres) ids.add(a.id);
    }
  }
  const vus = new Set();
  for (const a of articles) {
    if (vus.has(a.id)) erreur(a.lieu, 'identifiant en double « ' + a.id + ' »');
    vus.add(a.id);
    ids.add(a.id);
  }
  for (const a of articles) verifierArticle(a, ids);
  const plan = lirePlan();
  for (const a of articles) if (!plan.has(a.id)) avertir(a.lieu, 'article hors plan : ' + a.id + ' (signalez-le dans votre rapport)');
  console.log(articles.length + ' article(s) lu(s) dans ' + path.basename(fichier)
    + ' (' + articles.reduce((s, a) => s + a.textes.join(' ').split(/\s+/).length, 0).toLocaleString('fr-FR') + ' mots)');
  for (const a of articles) {
    console.log('  ' + a.id + ' : ' + a.textes.join(' ').split(/\s+/).length + ' mots, ' + a.reperes.length + ' repères');
  }
  if (afficher(true)) console.log('✓ aucune erreur');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const k = process.argv.indexOf('--verifier');
  const kt = process.argv.indexOf('--verifier-textes');
  if (k >= 0) verifier(process.argv[k + 1]);
  else if (kt >= 0) {
    const annexes = await import('./annexes.mjs');
    annexes.verifierTextes(path.resolve(process.argv[kt + 1]), { ids: lirePlan(), erreur, avertir, typographie, analyser });
    if (afficher(true)) console.log('✓ aucune erreur');
  } else await main();
}

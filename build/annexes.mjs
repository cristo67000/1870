/*
 * Les jeux de données autres que les articles : les extraits de textes
 * (build/textes/*.txt), la frise (build/frise.txt), les cartes animées
 * (build/cartes/*.txt) et les rapports de force (build/forces.txt).
 * Appelé par construire.mjs, qui écrit ce que `construire` renvoie dans data/.
 *
 * ── Le format d'un extrait (build/textes/*.txt) ─────────────────────────────
 *
 *     @ rimbaud-dormeur-du-val      l'identifiant (minuscules, chiffres, tirets)
 *     genre: poeme                  poeme, recit (roman, nouvelle), temoignage, analyse ou document
 *     auteur: Arthur Rimbaud
 *     vie: 1854-1891                naissance-mort de l'auteur
 *     titre: Le Dormeur du val      le titre de l'extrait, tel qu'il s'affiche
 *     oeuvre: Poésies               l'ouvrage d'où il vient (facultatif si c'est le même)
 *     annee: 1870                   année d'écriture ou de première publication
 *     quand: 1870-10                (facultatif) le moment dont parle le texte : AAAA-MM-JJ, AAAA-MM ou AAAA
 *     traducteur: Jean Thorel (1859-1916)   (seulement pour une traduction)
 *     intro: Deux ou trois phrases : qui parle, d'où, pourquoi ce texte compte.
 *     p: Un paragraphe de prose.    un « p: » par paragraphe ; « […] » marque une coupe
 *     v: Un vers.                   un « v: » par vers ; un « v: » vide sépare deux strophes
 *     gallica: bpt6k6558092h = L'Année terrible, Paris, Michel Lévy frères, 1872
 *     preuve: data.bnf.fr           d'où vient la cote Gallica (n'est pas publié)
 *     source: ws L'Année terrible/Sedan      où le texte a été copié : ws (Wikisource), ia (Internet Archive), url
 *     pour: bataille-de-sedan, napoleon-iii  les articles que l'extrait éclaire (identifiants du plan)
 */
import fs from 'node:fs';
import path from 'node:path';

const GENRES = [
  { id: 'poeme', nom: 'Poèmes' },
  { id: 'recit', nom: 'Romans et nouvelles' },
  { id: 'temoignage', nom: 'Témoignages' },
  { id: 'analyse', nom: 'Analyses' },
  { id: 'document', nom: 'Documents' },
];
const ID_GENRES = new Set(GENRES.map((g) => g.id));
const CLES_TEXTE = new Set(['genre', 'auteur', 'vie', 'titre', 'oeuvre', 'annee', 'quand', 'traducteur', 'intro', 'p', 'v',
  'gallica', 'preuve', 'source', 'pour']);
const ARK = /^(bpt6k|btv1b|bd6t|cb)[0-9a-z]+(\/f\d+(\.item|\.image)?)?$/;

function titreUrl(titre) {
  return encodeURIComponent(titre.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':')
    .replace(/%2C/g, ',').replace(/%28/g, '(').replace(/%29/g, ')').replace(/%27/g, "'");
}

export function lireTextes(fichier, textes, o) {
  const nom = path.basename(fichier);
  const lignes = fs.readFileSync(fichier, 'utf-8').replace(/^\s+/, '').replace(/\r\n?/g, '\n').split('\n');
  let t = null;
  let champ = null;
  lignes.forEach((ligne, i) => {
    const lieu = nom + ':' + (i + 1);
    if (ligne.trim() === '') { champ = null; return; }
    if (ligne.startsWith('#')) return;
    if (ligne.startsWith('@ ')) {
      const id = ligne.slice(2).trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) o.erreur(lieu, 'identifiant invalide « ' + id + ' »');
      t = { id, genre: null, auteur: '', vie: '', titre: '', oeuvre: '', annee: null, quand: null, traducteur: '', intro: '',
        p: [], v: [], gallica: null, preuve: '', source: null, pour: [], lieu, fichier: nom };
      textes.push(t);
      champ = null;
      return;
    }
    if (!t) { o.erreur(lieu, 'contenu avant le premier « @ identifiant »'); return; }
    if (ligne.startsWith('  ')) {
      if (!champ) { o.erreur(lieu, 'ligne indentée sans champ à continuer'); return; }
      if (champ.indice !== undefined) t[champ.cle][champ.indice] = (t[champ.cle][champ.indice] + ' ' + ligne.trim()).trim();
      else t[champ.cle] = (t[champ.cle] + ' ' + ligne.trim()).trim();
      return;
    }
    const m = /^([a-z]+):\s?(.*)$/.exec(ligne);
    if (!m || !CLES_TEXTE.has(m[1])) { o.erreur(lieu, 'ligne incomprise : « ' + ligne.slice(0, 70) + ' »'); return; }
    const cle = m[1];
    const valeur = m[2].trim();
    champ = null;
    switch (cle) {
      case 'genre': t.genre = valeur; break;
      case 'auteur': t.auteur = valeur; break;
      case 'vie':
        if (!/^\d{4}-\d{4}$/.test(valeur)) o.erreur(lieu, '« vie: » attend « 1854-1891 »');
        t.vie = valeur; break;
      case 'titre': t.titre = valeur; break;
      case 'oeuvre': t.oeuvre = valeur; break;
      case 'annee':
        if (!/^\d{4}$/.test(valeur)) o.erreur(lieu, '« annee: » attend une année');
        t.annee = parseInt(valeur, 10); break;
      case 'quand':
        if (!/^\d{4}(-\d\d){0,2}$/.test(valeur)) o.erreur(lieu, '« quand: » illisible « ' + valeur + ' »');
        t.quand = valeur; break;
      case 'traducteur': t.traducteur = valeur; break;
      case 'intro': t.intro = valeur; champ = { cle: 'intro' }; break;
      case 'p': t.p.push(valeur); champ = { cle: 'p', indice: t.p.length - 1 }; break;
      case 'v': t.v.push(valeur); break;
      case 'gallica': {
        const k = valeur.indexOf(' = ');
        if (k < 1) { o.erreur(lieu, '« gallica: » attend « cote = édition »'); break; }
        const ark = valeur.slice(0, k).trim();
        if (!ARK.test(ark)) o.erreur(lieu, 'cote Gallica invalide « ' + ark + ' »');
        t.gallica = [ark, valeur.slice(k + 3).trim()];
        break;
      }
      case 'preuve': t.preuve = valeur; break;
      case 'source': {
        const mm = /^(ws|ia|url) (.+)$/.exec(valeur);
        if (!mm) { o.erreur(lieu, '« source: » attend « ws Titre », « ia identifiant » ou « url https://… »'); break; }
        const [, sorte, reste] = mm;
        let v = reste.trim();
        let libelle = '';
        const k = v.indexOf(' = ');
        if (k >= 0) { libelle = v.slice(k + 3).trim(); v = v.slice(0, k).trim(); }
        if (sorte === 'ws') t.source = ['Wikisource', libelle || v, 'https://fr.wikisource.org/wiki/' + titreUrl(v)];
        else if (sorte === 'ia') t.source = ['Internet Archive', libelle || v, 'https://archive.org/details/' + v];
        else if (/^https:\/\/\S+$/.test(v)) t.source = [new URL(v).hostname.replace(/^www\./, ''), libelle || v, v];
        else o.erreur(lieu, 'adresse de source invalide');
        break;
      }
      case 'pour': t.pour = valeur.split(',').map((s) => s.trim()).filter(Boolean); break;
      default: break;
    }
  });
}

function verifierTexte(t, o) {
  const lieu = t.lieu + ' (' + t.id + ')';
  if (!ID_GENRES.has(t.genre)) o.erreur(lieu, 'genre inconnu « ' + t.genre + ' » (' + GENRES.map((g) => g.id).join(', ') + ')');
  for (const cle of ['auteur', 'titre', 'intro']) if (!t[cle]) o.erreur(lieu, 'pas de « ' + cle + ': »');
  if (!t.vie && t.genre !== 'document') o.erreur(lieu, 'pas de « vie: » (dates de l’auteur)');
  if (t.vie && parseInt(t.vie.slice(5), 10) > 1955) o.erreur(lieu, 'auteur mort après 1955 : texte encore protégé');
  if (!t.annee) o.erreur(lieu, 'pas d’« annee: »');
  if (t.p.length && t.v.length) o.erreur(lieu, 'prose (« p: ») et vers (« v: ») dans le même extrait');
  if (!t.p.length && !t.v.length) o.erreur(lieu, 'pas de texte (« p: » ou « v: »)');
  if (t.genre === 'poeme' && !t.v.length) o.erreur(lieu, 'un poème s’écrit en « v: »');
  const mots = t.p.concat(t.v).join(' ').split(/\s+/).filter(Boolean).length;
  if (mots < 40) o.avertir(lieu, 'extrait très court (' + mots + ' mots)');
  if (mots > 650) o.avertir(lieu, 'extrait long (' + mots + ' mots) : 120 à 450 pour la prose');
  if (t.intro.length < 80) o.avertir(lieu, 'présentation très courte');
  if (!t.gallica) o.erreur(lieu, 'pas de « gallica: »');
  else if (!t.preuve) o.erreur(lieu, 'une cote Gallica sans « preuve: » (d’où vient-elle ?)');
  if (!t.source) o.erreur(lieu, 'pas de « source: »');
  if (!t.pour.length) o.erreur(lieu, 'pas de « pour: » (articles liés)');
  for (const id of t.pour) if (!o.ids.has(id)) o.erreur(lieu, 'pour : article inexistant « ' + id + ' »');
  for (const morceau of t.p.concat(t.v, [t.intro])) {
    if (/<[a-z]+>|&[a-z]+;|\*\*|\[\[/.test(morceau)) o.erreur(lieu, 'balise dans le texte (seule l’italique *…* est permise)');
    if ((morceau.match(/\*/g) || []).length % 2) o.erreur(lieu, 'italique mal fermée');
    if (/\bTBD\b|\bXXX\b|\?\?\?|à compléter/i.test(morceau)) o.erreur(lieu, 'marque de travail restée dans le texte');
  }
  while (t.v.length && t.v[t.v.length - 1] === '') t.v.pop();
}

export function verifierTextes(fichier, o) {
  const textes = [];
  lireTextes(fichier, textes, o);
  const vus = new Set();
  for (const t of textes) {
    if (vus.has(t.id)) o.erreur(t.lieu, 'identifiant en double « ' + t.id + ' »');
    vus.add(t.id);
    verifierTexte(t, o);
  }
  console.log(textes.length + ' extrait(s) lu(s) dans ' + path.basename(fichier));
  for (const t of textes) {
    console.log('  ' + t.id + ' : ' + t.genre + ', ' + t.p.concat(t.v).join(' ').split(/\s+/).filter(Boolean).length + ' mots — ' + t.auteur);
  }
}

function construireTextes(o) {
  const dossier = path.join(o.ICI, 'textes');
  const textes = [];
  if (fs.existsSync(dossier)) {
    for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.txt')).sort()) lireTextes(path.join(dossier, f), textes, o);
  }
  const vus = new Map();
  for (const t of textes) {
    if (vus.has(t.id)) o.erreur(t.lieu, 'identifiant d’extrait « ' + t.id + ' » déjà pris à ' + vus.get(t.id));
    vus.set(t.id, t.lieu);
    verifierTexte(t, o);
  }
  const typo = o.typographie;
  const sortie = textes.map((t) => {
    const x = { id: t.id, g: t.genre, au: t.auteur, vie: t.vie.replace('-', '–'), ti: typo(t.titre), an: t.annee, in: typo(t.intro),
      po: o.SOUPLE ? t.pour.filter((id) => o.articles.some((a) => a.id === id)) : t.pour };
    if (t.oeuvre) x.oe = typo(t.oeuvre);
    if (t.quand) x.q = t.quand;
    if (t.traducteur) x.tr = t.traducteur;
    if (t.p.length) x.p = t.p.map(typo);
    if (t.v.length) x.v = t.v.map(typo);
    if (t.gallica) x.ga = [t.gallica[0], typo(t.gallica[1])];
    if (t.source) x.so = t.source;
    return x;
  });
  const mots = textes.reduce((s, t) => s + t.p.concat(t.v).join(' ').split(/\s+/).filter(Boolean).length, 0);
  return { genres: GENRES, textes: sortie, resume: sortie.length + ' extraits, ' + mots.toLocaleString('fr-FR') + ' mots, '
    + new Set(sortie.map((t) => t.au)).size + ' auteurs' };
}

// ── Les cartes animées (build/cartes/*.mjs) ─────────────────────────────────

async function construireCartes(o) {
  const { projeter, TAILLE } = await import('./geo.mjs');
  const { pathToFileURL } = await import('node:url');
  const dossier = path.join(o.ICI, 'cartes');
  const lieux = JSON.parse(fs.readFileSync(path.join(dossier, 'lieux.json'), 'utf-8'));
  const locaux = fs.existsSync(path.join(dossier, 'lieux-locaux.json')) ? JSON.parse(fs.readFileSync(path.join(dossier, 'lieux-locaux.json'), 'utf-8')) : {};
  const cartes = [];
  for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.mjs')).sort()) {
    const c = (await import(pathToFileURL(path.join(dossier, f)).href)).default;
    const ou = 'cartes/' + f;
    // les villages du fond (projetés) deviennent des lieux nommés, après ceux de la carte elle-même
    const villages = {};
    const fichierFond = path.join(o.RACINE, 'data', 'fond-' + c.fond + '.json');
    if (fs.existsSync(fichierFond)) {
      for (const [nom, x, y] of JSON.parse(fs.readFileSync(fichierFond, 'utf-8')).villes) {
        villages[nom] = { lon: x / TAILLE * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / TAILLE))) * 180 / Math.PI };
      }
    } else o.erreur(ou, 'fond absent : data/fond-' + c.fond + '.json (node build/fonds.mjs ' + c.fond + ')');
    const table = Object.assign({}, lieux, locaux[c.fond] || {}, villages, c.lieux || {});
    /* Une position : 'Lieu', ['Lieu', km vers l'est, km vers le nord] ou [lat, lon] ; un lieu de
     * la carte peut lui-même être défini par rapport à un autre (« Grosserwald » à 1,8 km
     * à l'ouest de Frœschwiller). Rend [lat, lon], ou null. */
    const decaler = ([lat, lon], est, nord) => {
      const la = lat + (nord || 0) / 111.2;
      return [la, lon + (est || 0) / (111.2 * Math.cos(la * Math.PI / 180))];
    };
    const latlon = (p, lieu, profondeur) => {
      if ((profondeur || 0) > 5) { o.erreur(lieu, 'lieux définis en boucle'); return null; }
      if (typeof p === 'string') {
        const l = table[p];
        if (!l) { o.erreur(lieu, 'lieu inconnu « ' + p + ' »'); return null; }
        return Array.isArray(l) ? latlon(l, lieu, (profondeur || 0) + 1) : [l.lat, l.lon];
      }
      if (Array.isArray(p) && typeof p[0] === 'string') {
        const base = latlon(p[0], lieu, (profondeur || 0) + 1);
        return base ? decaler(base, p[1], p[2]) : null;
      }
      return [p[0], p[1]];
    };
    const point = (p, lieu) => {
      const ll = latlon(p, lieu);
      if (!ll) return [0, 0];
      const [x, y] = projeter(ll[1], ll[0]);
      return [Math.round(x), Math.round(y)];
    };
    const courant = {};
    const etapes = c.etapes.map((e, i) => {
      const lieu = ou + ' étape ' + (i + 1);
      for (const [id, p] of Object.entries(e.pos || {})) {
        if (!c.unites[id]) { o.erreur(lieu, 'unité inconnue « ' + id + ' »'); continue; }
        if (p === null) delete courant[id]; else courant[id] = point(p, lieu);
      }
      const [x0, y1] = projeter(e.vue[0], e.vue[1]);
      const [x1, y0] = projeter(e.vue[2], e.vue[3]);
      const textes = [].concat(e.texte || []);
      for (const t of textes) o.analyser(t, lieu, o.ids);
      for (const id of e.articles || []) if (!o.ids.has(id)) o.erreur(lieu, 'article inexistant « ' + id + ' »');
      const s = { date: e.date, titre: o.typographie(e.titre), texte: textes.map(o.typographie),
        vue: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)], pos: Object.assign({}, courant) };
      if (e.quand) s.quand = o.typographie(e.quand);
      if (e.marques) s.marques = e.marques.map((m) => { const [x, y] = point(m.lieu, lieu); const r = { t: m.t, x, y, nom: m.nom }; if (m.camp) r.camp = m.camp; if (m.a) { if (!o.ids.has(m.a)) o.erreur(lieu, 'article inexistant « ' + m.a + ' »'); r.a = m.a; } return r; });
      if (e.leve) s.leve = e.leve;
      if (e.annexion) s.annexion = 1;
      if (e.articles) s.articles = e.articles;
      return s;
    });
    cartes.push({ id: c.id, ordre: c.ordre || 9, court: c.court || null, titre: o.typographie(c.titre), sous: o.typographie(c.sous || ''), fond: c.fond, traces: !!c.traces,
      article: c.article || null, unites: c.unites, etapes });
  }
  cartes.sort((a, b) => a.ordre - b.ordre);
  return { cartes, resume: cartes.map((c) => c.id + ' (' + c.etapes.length + ' étapes)').join(', ') };
}

// ── La frise (dérivée des articles datés, complétée par build/frise.txt) ────

function construireFrise(o) {
  const faits = [];
  const fichier = path.join(o.ICI, 'frise.txt');
  if (fs.existsSync(fichier)) {
    fs.readFileSync(fichier, 'utf-8').split(/\r?\n/).forEach((ligne, i) => {
      if (!ligne.trim() || ligne.startsWith('#')) return;
      const p = ligne.split('|').map((s) => s.trim());
      const lieu = 'frise.txt:' + (i + 1);
      if (p.length < 3 || !/^\d{4}(-\d\d){0,2}$/.test(p[0])) { o.erreur(lieu, 'ligne incomprise (date | voie | fait | article)'); return; }
      if (!['politique', 'operations', 'paris', 'avant', 'apres'].includes(p[1])) o.erreur(lieu, 'voie inconnue « ' + p[1] + ' »');
      o.analyser(p[2], lieu, o.ids);
      const f = { d: p[0], v: p[1], t: o.typographie(p[2]) };
      if (p[3]) { if (!o.ids.has(p[3])) o.erreur(lieu, 'article inexistant « ' + p[3] + ' »'); else f.a = p[3]; }
      faits.push(f);
    });
  }
  return { faits, resume: faits.length + ' faits' };
}

export async function construire(o) {
  const sorties = {};
  sorties['textes.json'] = construireTextes(o);
  sorties['cartes.json'] = await construireCartes(o);
  sorties['frise.json'] = construireFrise(o);
  return sorties;
}

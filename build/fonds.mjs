/*
 * Construit les fonds des cartes animées : data/fond-<id>.json.
 *
 *     node build/fonds.mjs lieux        résout build/cartes/lieux.txt → build/cartes/lieux.json (Wikipédia)
 *     node build/fonds.mjs campagne     le théâtre entier (Natural Earth, domaine public)
 *     node build/fonds.mjs <id>         un champ de bataille (OpenStreetMap, ODbL) : voir LOCAUX
 *     node build/fonds.mjs tout
 *
 * Les sources sont téléchargées une fois dans build/.sources-carte/, hors du
 * dépôt ; les fonds produits, eux, sont dans data/ et suffisent à l'application.
 *
 * Un fond : { cadre [x, y, l, h], terre, lacs, eaux [[tracé, classe]], frontieres,
 * annexion { aire, bord }, bois, villes [[nom, x, y, rang]], source }.
 * Les tracés sont des chemins SVG relatifs, en unités du monde (voir geo.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projeter, preparer, chemin, decouperAnneau, decouperLigne, boite, seTouchent, aire, recoudre, unitesParMetre, TAILLE } from './geo.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.dirname(ICI);
const SOURCES = path.join(ICI, '.sources-carte');
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const AGENT = 'carte-1870-hors-ligne/1.0';

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function naturalEarth(nom) {
  const fichier = path.join(SOURCES, nom + '.geojson');
  if (!fs.existsSync(fichier)) {
    fs.mkdirSync(SOURCES, { recursive: true });
    const r = await fetch(NE + nom + '.geojson', { headers: { 'User-Agent': AGENT } });
    if (!r.ok) throw new Error(nom + ' : HTTP ' + r.status);
    fs.writeFileSync(fichier, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(fichier, 'utf-8'));
}

const anneauxDe = (g) => (!g ? [] : g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : []);
const lignesDe = (g) => (!g ? [] : g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []);
const proj = (coords) => coords.map(([lon, lat]) => projeter(lon, lat));

function cadreDe(zone, marge) {
  const [x0, y1] = projeter(zone.ouest, zone.sud);
  const [x1, y0] = projeter(zone.est, zone.nord);
  const m = marge || 0;
  return [x0 - m, y0 - m, x1 + m, y1 + m];
}

// ── Les lieux (build/cartes/lieux.txt → lieux.json) ─────────────────────────

/* lieux.txt : « Nom affiché | Titre de la page Wikipédia (facultatif) | rang (facultatif) ».
 * Le rang (1 à 4) décide à quelle échelle le nom paraît sur la carte de campagne ;
 * sans rang, le lieu ne sert qu'à placer des unités. « = lat, lon » à la place du
 * titre fixe des coordonnées à la main. */
export function lireLieuxTxt() {
  const fichier = path.join(ICI, 'cartes', 'lieux.txt');
  const lieux = [];
  for (const ligne of fs.readFileSync(fichier, 'utf-8').split(/\r?\n/)) {
    if (!ligne.trim() || ligne.startsWith('#')) continue;
    const p = ligne.split('|').map((s) => s.trim());
    lieux.push({ nom: p[0], titre: p[1] || p[0], rang: p[2] ? parseInt(p[2], 10) : 0 });
  }
  return lieux;
}

/* Les communes de France (nom, département, latitude, longitude, code postal, population),
 * reprises de l'application sœur « france-departements » : pas de réseau, pas d'homonymie
 * hasardeuse — le département entre parenthèses tranche, sinon la plus peuplée de la zone. */
let tableCommunes = null;
let codesDepartements = null;
function chercherCommune(titre) {
  if (!tableCommunes) {
    const dossier = path.join(RACINE, '..', 'france-departements', 'data');
    if (!fs.existsSync(path.join(dossier, 'communes.json'))) { tableCommunes = []; codesDepartements = new Map(); return null; }
    tableCommunes = JSON.parse(fs.readFileSync(path.join(dossier, 'communes.json'), 'utf-8'));
    codesDepartements = new Map(JSON.parse(fs.readFileSync(path.join(dossier, 'departements.geojson'), 'utf-8')).features.map((f) => [f.properties.nom, f.properties.code]));
  }
  const m = /^(.*?)(?: \(([^)]+)\))?$/.exec(titre);
  const nom = m[1];
  const dep = m[2] ? codesDepartements.get(m[2]) : null;
  let candidats = tableCommunes.filter((c) => c[0] === nom && c[2] >= ZONE.sud && c[2] <= ZONE.nord && c[3] >= ZONE.ouest && c[3] <= ZONE.est);
  if (dep) candidats = candidats.filter((c) => c[1] === dep);
  if (!candidats.length) return null;
  candidats.sort((a, b) => (b[5] || 0) - (a[5] || 0));
  return candidats[0];
}

async function resoudreLieux() {
  const lieux = lireLieuxTxt();
  const sortieFichier = path.join(ICI, 'cartes', 'lieux.json');
  const connus = fs.existsSync(sortieFichier) ? JSON.parse(fs.readFileSync(sortieFichier, 'utf-8')) : {};
  const sortie = {};
  const aChercher = [];
  for (const l of lieux) {
    const fixe = /^=\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)$/.exec(l.titre);
    if (fixe) { sortie[l.nom] = { lat: parseFloat(fixe[1]), lon: parseFloat(fixe[2]), rang: l.rang, source: 'main' }; continue; }
    if (connus[l.nom] && connus[l.nom].titre === l.titre) { sortie[l.nom] = { ...connus[l.nom], rang: l.rang }; continue; }
    const commune = chercherCommune(l.titre);
    if (commune) { sortie[l.nom] = { lat: commune[2], lon: commune[3], rang: l.rang, titre: l.titre, page: commune[0] + ' (' + commune[1] + '), table des communes' }; continue; }
    aChercher.push(l);
  }
  for (let i = 0; i < aChercher.length; i += 40) {
    const lot = aChercher.slice(i, i + 40);
    const url = 'https://fr.wikipedia.org/w/api.php?action=query&prop=coordinates&coprimary=primary&redirects=1&format=json&colimit=max&titles='
      + encodeURIComponent(lot.map((l) => l.titre).join('|'));
    let d = null;
    for (let essai = 1; essai <= 8 && !d; essai += 1) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': AGENT } });
        const texte = await r.text();
        if (r.ok && texte.startsWith('{')) d = JSON.parse(texte);
      } catch (e) { /* on réessaie */ }
      if (!d) await attendre(4000 * essai);          // Wikipédia limite le débit : on patiente
    }
    if (!d) { console.error('  ✗ Wikipédia ne répond pas pour : ' + lot.map((l) => l.nom).join(', ')); continue; }
    const vers = new Map();
    for (const n of (d.query.normalized || [])) vers.set(n.from, n.to);
    const redir = new Map();
    for (const n of (d.query.redirects || [])) redir.set(n.from, n.to);
    const pages = new Map();
    for (const p of Object.values(d.query.pages)) pages.set(p.title, p);
    for (const l of lot) {
      let t = l.titre;
      if (vers.has(t)) t = vers.get(t);
      if (redir.has(t)) t = redir.get(t);
      const p = pages.get(t);
      if (!p || !p.coordinates) { console.error('  ✗ pas de coordonnées pour « ' + l.nom + ' » (page « ' + l.titre + ' »)'); continue; }
      sortie[l.nom] = { lat: p.coordinates[0].lat, lon: p.coordinates[0].lon, rang: l.rang, titre: l.titre, page: p.title };
    }
    fs.writeFileSync(sortieFichier, JSON.stringify(sortie, null, 1), 'utf-8');
    await attendre(1500);
  }
  fs.writeFileSync(sortieFichier, JSON.stringify(sortie, null, 1), 'utf-8');
  console.log('build/cartes/lieux.json : ' + Object.keys(sortie).length + ' lieux sur ' + lieux.length);
}

export function lireLieux() {
  const fichier = path.join(ICI, 'cartes', 'lieux.json');
  return fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier, 'utf-8')) : {};
}

// ── Le théâtre entier (Natural Earth) ───────────────────────────────────────

const ZONE = { ouest: -5.4, est: 12.6, sud: 43.1, nord: 52.7 };
const GRANDS = /^(Rhin|Rhine|Rhein|Seine|Loire|Rhône|Rhne|Maas|Meuse|Mosel|Moselle|Marne|Saône|Sane|Garonne|Donau|Main|Waal|Lek|Nederrijn|IJssel|Elbe|Weser)$/;
const MOYENS = /^(Doubs|Yonne|Somme|Sarre|Ill|Aube|Neckar|Allier|Cher|Sarthe|Eure|Mayenne|Vienne|Dordogne|Lot|Charente|Schelde|Sûre|Aar|Reuss|Limmat|Ruhr|Lippe|Fulda|Isar|Inn|Vilaine|Creuse|Tarn|Aveyron|Ems|Po|Ticino|Thames|Saale|Regnitz|Adour|Durance)$/;

/* L'Alsace-Lorraine cédée en 1871 : les départements actuels de la Moselle,
 * du Bas-Rhin et du Haut-Rhin en reprennent exactement le contour. */
function annexion(tolerance) {
  const fichier = path.join(RACINE, '..', 'france-departements', 'data', 'departements.geojson');
  const local = path.join(ICI, 'cartes', 'alsace-lorraine.geojson');
  let source;
  if (fs.existsSync(local)) source = JSON.parse(fs.readFileSync(local, 'utf-8'));
  else {
    const tout = JSON.parse(fs.readFileSync(fichier, 'utf-8'));
    source = { type: 'FeatureCollection', features: tout.features.filter((f) => ['57', '67', '68'].includes(f.properties.code)) };
    fs.writeFileSync(local, JSON.stringify(source), 'utf-8');
  }
  // les arêtes communes à deux départements sont intérieures : on les retire
  const compte = new Map();
  const cle = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? a + ';' + b : b + ';' + a);
  const anneaux = [];
  for (const f of source.features) for (const an of anneauxDe(f.geometry)) anneaux.push(an);
  for (const an of anneaux) for (let i = 0; i < an.length - 1; i += 1) { const k = cle(an[i], an[i + 1]); compte.set(k, (compte.get(k) || 0) + 1); }
  const troncons = [];
  for (const an of anneaux) {
    let courant = [];
    for (let i = 0; i < an.length - 1; i += 1) {
      if (compte.get(cle(an[i], an[i + 1])) === 1) { if (!courant.length) courant.push(an[i]); courant.push(an[i + 1]); }
      else if (courant.length) { troncons.push(courant); courant = []; }
    }
    if (courant.length) troncons.push(courant);
  }
  const contours = recoudre(troncons.map((t) => t.map((p) => p.map((v) => +v.toFixed(6)))));
  contours.sort((a, b) => b.length - a.length);
  const dAire = [];
  for (const an of anneaux) { const t = preparer(proj(an), true, tolerance); if (t) dAire.push(chemin(t, true)); }
  const dBord = [];
  for (const c of contours.slice(0, 1)) { const t = preparer(proj(c), true, tolerance); if (t) dBord.push(chemin(t, true)); }
  if (!dBord.length) console.error('  ! contour de l’Alsace-Lorraine non recousu (' + troncons.length + ' tronçons)');
  return { aire: dAire.join(''), bord: dBord.join('') };
}

async function campagne() {
  const tol = 64;                                         // ≈ 400 m
  const cadre = cadreDe(ZONE);
  const large = cadreDe(ZONE, 3000);
  const terre = await naturalEarth('ne_10m_land');
  const lacs = await naturalEarth('ne_10m_lakes');
  const f1 = await naturalEarth('ne_10m_rivers_lake_centerlines');
  const f2 = await naturalEarth('ne_10m_rivers_europe');
  const frontieres = await naturalEarth('ne_10m_admin_0_boundary_lines_land');
  let points = 0;

  const t = [];
  for (const f of terre.features) for (const an of anneauxDe(f.geometry)) {
    const p = proj(an);
    if (!seTouchent(boite(p), large)) continue;
    const coupe = decouperAnneau(p.slice(0, -1), large);
    if (!coupe) continue;
    const tr = preparer(coupe, true, tol);
    if (tr && Math.abs(aire(tr)) > 4000) { t.push(chemin(tr, true)); points += tr.length; }
  }

  const l = [];
  for (const f of lacs.features) for (const an of anneauxDe(f.geometry)) {
    const p = proj(an);
    if (!seTouchent(boite(p), cadre)) continue;
    const tr = preparer(p, true, tol / 2);
    if (tr && Math.abs(aire(tr)) > 60000) { l.push(chemin(tr, true)); points += tr.length; }
  }

  const eaux = { 1: [], 2: [] };
  for (const jeu of [f1, f2]) for (const f of jeu.features) {
    const pr = f.properties;
    if (pr.featurecla && /Lake/.test(pr.featurecla)) continue;
    const nom = pr.name || '';
    const classe = GRANDS.test(nom) ? 1 : MOYENS.test(nom) ? 2 : 0;
    if (!classe) continue;
    for (const ligne of lignesDe(f.geometry)) {
      for (const morceau of decouperLigne(proj(ligne), large)) {
        const tr = preparer(morceau, false, tol * 0.75);
        if (tr) { eaux[classe].push(chemin(tr, false)); points += tr.length; }
      }
    }
  }

  const fr = [];
  for (const f of frontieres.features) for (const ligne of lignesDe(f.geometry)) {
    for (const morceau of decouperLigne(proj(ligne), large)) {
      const tr = preparer(morceau, false, tol * 0.75);
      if (tr) { fr.push(chemin(tr, false)); points += tr.length; }
    }
  }

  const lieux = lireLieux();
  const villes = [];
  for (const [nom, v] of Object.entries(lieux)) {
    if (nom === 'Camp de Châlons') continue;
    const [x, y] = projeter(v.lon, v.lat);
    villes.push([nom, Math.round(x), Math.round(y), v.rang || 4]);       // sans rang : nommé seulement de très près
  }
  villes.sort((a, b) => a[3] - b[3] || a[0].localeCompare(b[0], 'fr'));

  const sortie = {
    id: 'campagne', taille: TAILLE,
    cadre: [Math.round(cadre[0]), Math.round(cadre[1]), Math.round(cadre[2] - cadre[0]), Math.round(cadre[3] - cadre[1])],
    terre: t.join(''), lacs: l.join(''), eaux: [[eaux[1].join(''), 1], [eaux[2].join(''), 2]], frontieres: fr.join(''),
    annexion: annexion(tol / 2), villes,
    source: 'Fond : Natural Earth (domaine public).',
  };
  ecrire('campagne', sortie, points);
}

// ── Les champs de bataille (OpenStreetMap) ──────────────────────────────────

/* id → la zone, les ruisseaux à garder (par leur nom), l'aire minimale d'un bois (hectares),
 * la tolérance de simplification (mètres), et jusqu'à quel rang de lieu on descend. */
export const LOCAUX = {
  froeschwiller: { zone: { sud: 48.880, nord: 48.995, ouest: 7.610, est: 7.830 }, ruisseaux: 'Sauer|Sauerbach|Soultzbach|Sulzbach|Eberbach|Falkensteinerbach|Falkensteinbach|Schwarzbach|Halbmuhlbach|Seltzbach', bois: 12, tol: 12, hameaux: true },
  sedan: { zone: { sud: 49.625, nord: 49.765, ouest: 4.830, est: 5.075 }, ruisseaux: 'Givonne|Chiers|Bar|Floing|Vrigne|Ennemane|Rulle', bois: 15, tol: 12, hameaux: true },
  metz: { zone: { sud: 49.020, nord: 49.245, ouest: 5.840, est: 6.330 }, ruisseaux: 'Mance|Orne|Seille|Yron|Gorze|Nied|Vallières|Chatel|Montvaux|Saint-Pierre', bois: 30, tol: 18, hameaux: false },
  paris: { zone: { sud: 48.700, nord: 49.030, ouest: 2.020, est: 2.640 }, ruisseaux: 'Bièvre|Morée|Croult|Yerres|Orge', bois: 80, tol: 30, hameaux: false,
    // les seuls noms gardés, et leur rang : la banlieue d'aujourd'hui noierait la carte
    noms: {
      1: ['Paris', 'Versailles', 'Saint-Denis', 'Le Bourget', 'Champigny-sur-Marne', 'Châtillon', 'Argenteuil', 'Gonesse', 'Chelles',
        'Choisy-le-Roi', 'Saint-Cloud', 'Rueil-Malmaison', 'Vincennes', 'Sèvres', 'Montmorency', 'Saint-Germain-en-Laye'],
      2: ['Villiers-sur-Marne', 'Bry-sur-Marne', 'Chevilly-Larue', 'Bagneux', 'Garches', 'Thiais', 'Meudon', 'Clamart', 'Montfermeil',
        'Chennevières-sur-Marne', 'Neuilly-Plaisance', 'Dugny', 'Bougival', 'Le Plessis-Robinson', 'Montreuil', 'Aubervilliers', 'Pantin',
        'Bondy', 'Créteil', 'Ivry-sur-Seine', 'Vitry-sur-Seine', 'Issy-les-Moulineaux', 'Boulogne-Billancourt', 'Neuilly-sur-Seine', 'Chatou',
        'Nanterre', 'Courbevoie', 'Stains', 'Pierrefitte-sur-Seine', 'Épinay-sur-Seine', 'Drancy', 'Noisy-le-Grand', 'Nogent-sur-Marne',
        'Joinville-le-Pont', 'Saint-Maur-des-Fossés', 'Villeneuve-Saint-Georges', 'L’Haÿ-les-Roses', 'Sceaux', 'Ville-d’Avray', 'Le Raincy',
        'Rosny-sous-Bois', 'Bobigny', 'Saint-Ouen-sur-Seine', 'Clichy', 'Colombes', 'Bezons', 'Sartrouville', 'Marly-le-Roi'],
    } },
  strasbourg: { zone: { sud: 48.535, nord: 48.625, ouest: 7.670, est: 7.850 }, ruisseaux: 'Ill|Bruche|Aar|Souffel', bois: 20, tol: 8, hameaux: false },
};

async function overpass(id, requete) {
  const fichier = path.join(SOURCES, 'osm-' + id + '.json');
  if (fs.existsSync(fichier)) return JSON.parse(fs.readFileSync(fichier, 'utf-8'));
  fs.mkdirSync(SOURCES, { recursive: true });
  for (const serveur of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    for (let essai = 0; essai < 2; essai += 1) {
      try {
        const r = await fetch(serveur, { method: 'POST', headers: { 'User-Agent': AGENT, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(requete) });
        if (r.ok) {
          const texte = await r.text();
          const d = JSON.parse(texte);
          fs.writeFileSync(fichier, texte, 'utf-8');
          return d;
        }
        console.error('  Overpass ' + r.status + ', nouvel essai…');
      } catch (e) { console.error('  Overpass : ' + e.message); }
      await attendre(8000);
    }
  }
  throw new Error('Overpass injoignable pour ' + id);
}

async function local(id) {
  const c = LOCAUX[id];
  if (!c) throw new Error('fond inconnu : ' + id);
  const z = c.zone;
  const b = '(' + [z.sud, z.ouest, z.nord, z.est].join(',') + ')';
  const lieuxOsm = c.hameaux ? 'city|town|village|hamlet' : 'city|town|village';
  const requete = '[out:json][timeout:150];('
    + 'way["waterway"~"^(river|canal)$"]' + b + ';'
    + 'way["waterway"="stream"]["name"~"' + c.ruisseaux + '"]' + b + ';'
    + 'way["natural"="wood"]' + b + ';way["landuse"="forest"]' + b + ';'
    + 'relation["natural"="wood"]' + b + ';relation["landuse"="forest"]' + b + ';'
    + 'node["place"~"^(' + lieuxOsm + ')$"]' + b + ';'
    + ');out geom;';
  const d = await overpass(id, requete);
  const latMoy = (z.sud + z.nord) / 2;
  const u = unitesParMetre(latMoy);
  const tol = c.tol * u;
  const cadre = cadreDe(z);
  const large = cadreDe(z, 300 * u);
  let points = 0;
  const geo = (g) => g.map((p) => projeter(p.lon, p.lat));

  // les eaux : rivières et canaux (classe 1), ruisseaux nommés (classe 2)
  const eaux = { 1: [], 2: [] };
  for (const e of d.elements) {
    if (e.type !== 'way' || !e.tags || !e.tags.waterway || !e.geometry) continue;
    const classe = e.tags.waterway === 'stream' ? 2 : 1;
    if (e.tags.tunnel) continue;
    for (const morceau of decouperLigne(geo(e.geometry), large)) {
      const tr = preparer(morceau, false, tol * (classe === 1 ? 0.6 : 1));
      if (tr) { eaux[classe].push(chemin(tr, false)); points += tr.length; }
    }
  }

  // les bois : chemins fermés et relations (anneaux extérieurs recousus)
  const bois = [];
  const aireMin = c.bois * 10000 * u * u;
  const poser = (anneau) => {
    if (!seTouchent(boite(anneau), cadre)) return;
    if (Math.abs(aire(anneau)) < aireMin) return;
    const coupe = decouperAnneau(anneau.slice(0, -1), large);
    if (!coupe) return;
    const tr = preparer(coupe, true, tol * 1.6);
    if (tr && Math.abs(aire(tr)) >= aireMin * 0.6) { bois.push(chemin(tr, true)); points += tr.length; }
  };
  for (const e of d.elements) {
    if (!e.tags || !(e.tags.natural === 'wood' || e.tags.landuse === 'forest')) continue;
    if (e.type === 'way' && e.geometry) {
      const g = geo(e.geometry);
      if (g.length >= 4 && g[0][0] === g[g.length - 1][0] && g[0][1] === g[g.length - 1][1]) poser(g);
    } else if (e.type === 'relation' && e.members) {
      const troncons = e.members.filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry).map((m) => geo(m.geometry).map(([x, y]) => [Math.round(x * 4) / 4, Math.round(y * 4) / 4]));
      for (const anneau of recoudre(troncons)) poser(anneau);
    }
  }

  // les lieux habités
  const villes = [];
  const vus = new Set();
  for (const e of d.elements) {
    if (e.type !== 'node' || !e.tags || !e.tags.place || !e.tags.name) continue;
    const nom = e.tags['name:fr'] || e.tags.name;
    if (vus.has(nom)) continue;
    vus.add(nom);
    let rang = { city: 1, town: 1, village: 2, hamlet: 3 }[e.tags.place] || 3;
    if (c.noms) {
      const r = Object.keys(c.noms).find((k) => c.noms[k].includes(nom) || c.noms[k].includes(e.tags.name));
      if (!r) continue;
      rang = parseInt(r, 10);
    }
    const [x, y] = projeter(e.lon, e.lat);
    villes.push([nom, Math.round(x), Math.round(y), rang]);
  }
  villes.sort((a, b) => a[3] - b[3] || a[0].localeCompare(b[0], 'fr'));

  const sortie = {
    id, taille: TAILLE,
    cadre: [Math.round(cadre[0]), Math.round(cadre[1]), Math.round(cadre[2] - cadre[0]), Math.round(cadre[3] - cadre[1])],
    eaux: [[eaux[1].join(''), 1], [eaux[2].join(''), 2]], bois: bois.join(''), villes,
    source: 'Fond : © les contributeurs d’OpenStreetMap (ODbL) — cours d’eau, bois et villages d’aujourd’hui.',
  };
  ecrire(id, sortie, points);
}

function ecrire(id, sortie, points) {
  const json = JSON.stringify(sortie);
  fs.mkdirSync(path.join(RACINE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(RACINE, 'data', 'fond-' + id + '.json'), json, 'utf-8');
  console.log('data/fond-' + id + '.json : ' + Math.round(json.length / 1024) + ' Ko, ' + points + ' points, ' + sortie.villes.length + ' lieux');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const quoi = process.argv[2] || 'tout';
  if (quoi === 'lieux') await resoudreLieux();
  else if (quoi === 'campagne') await campagne();
  else if (quoi === 'tout') { await campagne(); for (const id of Object.keys(LOCAUX)) await local(id); }
  else await local(quoi);
}

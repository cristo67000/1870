'use strict';
/*
 * Les données : les articles (data/articles.json), les extraits (data/textes.json),
 * les cartes animées (data/cartes.json) et la liste des images (data/precache.json),
 * chargées une fois, indexées, interrogées par les vues.
 *
 * Un article : { id, c (catégorie), n (nom), al (alias), da (dates affichées), q, j (jour de
 * début et de fin, AAAA-MM-JJ), an, fin, ca (camp), ro (rôle), def, dn (définition nue),
 * tx (paragraphes), re (repères [date, fait]), at (attention), is (issue), ef, cn, pe
 * ([Français, Allemands]), ch (chefs), nc (note sur les chiffres), fi (fiche [[libellé, valeur]]),
 * g [lat, lon], lo (lieu), li (liens), so (sources), vo (voir), im (images), mn, t (clé de tri) }.
 *
 * Un extrait : { id, g (genre), au, vie, ti, oe, an, q, in, p | v, ga [cote, édition], so, tr, po }.
 */
(function (racine) {

  let donnees = { version: '', categories: [], articles: [] };
  let textes = { genres: [], textes: [] };
  let cartes = { cartes: [] };
  let precache = {};
  let parId = {};
  let parCategorie = {};
  let texteParId = {};
  let textesPour = {};
  let index = [];
  let citePar = {};

  async function charger() {
    const json = (url, defaut) => fetch(url).then((r) => (r.ok ? r.json() : defaut)).catch(() => defaut);
    const [a, t, c, pc] = await Promise.all([
      fetch('data/articles.json').then((r) => { if (!r.ok) throw new Error('articles : ' + r.status); return r.json(); }),
      json('data/textes.json', { genres: [], textes: [] }),
      json('data/cartes.json', { cartes: [] }),
      json('data/precache.json', {}),
    ]);
    donnees = a; textes = t; cartes = c; precache = pc;
    indexer();
  }

  const MOTIF = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*([^*]+)\*/g;

  function nu(texte) {
    return String(texte || '').replace(MOTIF, (tout, id, libelle, ital) => {
      if (ital !== undefined) return ital;
      if (libelle) return libelle;
      const c = parId[id];
      return c ? (c.mn ? c.n.charAt(0).toLocaleLowerCase('fr') + c.n.slice(1) : c.n) : id;
    });
  }

  function indexer() {
    parId = {}; parCategorie = {}; citePar = {}; texteParId = {}; textesPour = {};
    for (const a of donnees.articles) {
      parId[a.id] = a;
      (parCategorie[a.c] = parCategorie[a.c] || []).push(a);
    }
    index = donnees.articles.map((a) => ({
      a,
      nom: Outils.normaliser(a.n),
      alias: a.al.map(Outils.normaliser),
      def: Outils.normaliser(nu(a.def)),
      texte: Outils.normaliser(nu(a.tx.join(' ')) + ' ' + a.re.map((r) => nu(r[1])).join(' ') + ' ' + (a.lo || '')),
    }));
    for (const a of donnees.articles) {
      const ids = new Set();
      const regarder = (t) => { for (const m of String(t || '').matchAll(/\[\[([^\]|]+)/g)) ids.add(m[1]); };
      regarder(a.def); regarder(a.at); a.tx.forEach(regarder); a.re.forEach((r) => regarder(r[1]));
      for (const v of a.vo) ids.add(v);
      for (const id of ids) if (id !== a.id) (citePar[id] = citePar[id] || []).push(a.id);
    }
    for (const t of textes.textes) {
      texteParId[t.id] = t;
      for (const id of t.po) (textesPour[id] = textesPour[id] || []).push(t);
    }
  }

  // ── Articles ──────────────────────────────────────────────────────────────

  function article(id) { return parId[id] || null; }
  function nom(id) { const a = parId[id]; return a ? a.n : null; }
  function categorie(id) { return donnees.categories.find((c) => c.id === id) || { id, nom: id, couleur: '#888' }; }
  function parCat(id) { return parCategorie[id] || []; }
  function citations(id) { return (citePar[id] || []).map((x) => parId[x]).filter(Boolean); }

  /* La date qui range un article dans la chronologie : son jour, sinon son année. */
  function cleDate(a) { return a.q ? Dates.cle(a.q) : (a.c !== 'personnages' && a.an !== undefined ? String(a.an) + '-01-01' : ''); }
  function dates() { return donnees.articles.filter((a) => a.q).sort((x, y) => Dates.cle(x.q).localeCompare(Dates.cle(y.q)) || x.t.localeCompare(y.t, 'fr')); }
  function batailles() { return dates().filter((a) => (a.c === 'batailles' || a.c === 'sieges') && (a.ef || a.pe)); }

  function auHasard(cat) {
    const liste = cat ? parCat(cat) : donnees.articles;
    return liste[Math.floor(Math.random() * liste.length)];
  }

  function numeroDuJour() { const t = new Date(); return t.getFullYear() * 400 + t.getMonth() * 31 + t.getDate(); }
  function duJour() {
    const liste = donnees.articles.filter((a) => a.im && a.im.length);
    const source = liste.length ? liste : donnees.articles;
    return source.length ? source[numeroDuJour() % source.length] : null;
  }
  function texteDuJour() { return textes.textes.length ? textes.textes[numeroDuJour() % textes.textes.length] : null; }

  /* Ce qui s'est passé ce jour-là (jour et mois) en 1870 ou 1871 : repères des articles, sans doublon. */
  function anniversaires(jour, mois) {
    const motif = new RegExp('(^|\\s)' + jour + '(ᵉʳ|er)?\\s+' + Dates.MOIS[mois - 1] + '\\s+(18(?:70|71))');
    const r = [];
    const vus = new Set();
    for (const a of donnees.articles) {
      for (const [d, f] of a.re) {
        const m = motif.exec(d);
        if (!m) continue;
        const cle = nu(f).slice(0, 40);
        if (vus.has(cle)) continue;
        vus.add(cle);
        r.push({ a, an: parseInt(m[3], 10), date: d, fait: f });
      }
    }
    return r.sort((x, y) => x.an - y.an);
  }

  function rechercher(texte, options) {
    const o = options || {};
    const q = Outils.normaliser(texte);
    if (q.length < 2) return [];
    const mots = q.split(' ').filter(Boolean);
    const res = [];
    for (const e of index) {
      if (o.cat && e.a.c !== o.cat) continue;
      let score = 0;
      if (e.nom === q) score = 100;
      else if (e.nom.startsWith(q)) score = 60;
      else if (e.alias.some((al) => al === q || al.startsWith(q))) score = 50;
      else if (e.nom.split(' ').some((w) => w.startsWith(q))) score = 40;
      else if (mots.every((m) => e.nom.includes(m) || e.alias.some((al) => al.includes(m)))) score = 30;
      else if (mots.every((m) => e.def.includes(m))) score = 20;
      else if (mots.every((m) => e.texte.includes(m))) score = 10;
      if (score) res.push({ a: e.a, score });
    }
    res.sort((x, y) => y.score - x.score || x.a.t.localeCompare(y.a.t, 'fr'));
    return res.slice(0, o.limite || 60);
  }

  // ── Extraits ──────────────────────────────────────────────────────────────

  function texte(id) { return texteParId[id] || null; }
  function textesDe(idArticle) { return textesPour[idArticle] || []; }
  function genre(id) { return textes.genres.find((g) => g.id === id) || { id, nom: id }; }
  function corpsNu(t) { return (t.p || t.v || []).join(' ').replace(/\*/g, ''); }

  // ── Cartes animées ────────────────────────────────────────────────────────

  function carte(id) { return cartes.cartes.find((c) => c.id === id) || null; }
  /* Les cartes où paraît cet article : [{ carte, etape }]. */
  function cartesDe(idArticle) {
    const r = [];
    for (const c of cartes.cartes) {
      const k = c.etapes.findIndex((e) => (e.articles || []).includes(idArticle));
      if (k >= 0) r.push({ carte: c, etape: k });
    }
    return r;
  }

  function urlImage(im) { return im.f + '?v=' + im.v; }

  racine.Donnees = {
    charger, nu, article, nom, categorie, parCat, citations, cleDate, dates, batailles, auHasard, duJour, texteDuJour, anniversaires,
    rechercher, texte, textesDe, genre, corpsNu, carte, cartesDe, urlImage,
    get articles() { return donnees.articles; },
    get categories() { return donnees.categories; },
    get version() { return donnees.version; },
    get textes() { return textes.textes; },
    get genres() { return textes.genres; },
    get cartes() { return cartes.cartes; },
    get precache() { return precache; },
  };

})(window);

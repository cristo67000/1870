'use strict';
/*
 * Le théâtre : une carte animée, étape par étape.
 *
 * Le fond (data/fond-<id>.json) est dessiné en SVG, sans serveur de tuiles :
 * tout marche hors ligne. Les unités sont des pastilles aux couleurs de leur
 * camp qui glissent d'une étape à la suivante ; les batailles et les sièges se
 * posent au fil du récit ; le cadre suit l'action. On peut aussi déplacer et
 * grossir la carte au doigt.
 *
 * Une carte (data/cartes.json) : { id, titre, sous, fond, traces, unites { id: { camp, nom, court } },
 * etapes [{ date, titre, texte, vue [x, y, l, h], pos { id: [x, y] }, marques [{ t, x, y, nom, camp, a }],
 * leve [noms], annexion, articles [ids] }] }. Tout est en unités du fond.
 */
(function (racine) {

  const { h, s, icone } = Outils;
  const fonds = new Map();
  const reduit = () => racine.matchMedia && racine.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chargerFond(id) {
    if (!fonds.has(id)) {
      fonds.set(id, fetch('data/fond-' + id + '.json').then((r) => { if (!r.ok) throw new Error('fond ' + r.status); return r.json(); })
        .catch((e) => { fonds.delete(id); throw e; }));
    }
    return fonds.get(id);
  }

  const melange = (a, b, t) => a + (b - a) * t;
  const doux = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function creer(conteneur, carte, options) {
    const o = options || {};
    let fond = null;
    let etape = Math.max(0, Math.min(carte.etapes.length - 1, o.etape || 0));
    let vue = null;             // [x, y, l, h] affiché
    let libre = false;          // la personne a déplacé la carte : on ne recadre plus tout seul
    let anim = 0;
    let lecture = 0;
    let detruit = false;

    const svg = s('svg', { class: 'theatre-svg', role: 'img', 'aria-label': carte.titre });
    const gFond = s('g', { class: 'th-fond' });
    const gVilles = s('g', { class: 'th-villes' });
    const gTraces = s('g', { class: 'th-traces' });
    const gMarques = s('g', { class: 'th-marques' });
    const gUnites = s('g', { class: 'th-unites' });
    svg.append(gFond, gTraces, gVilles, gMarques, gUnites);

    const cadre = h('div', { class: 'theatre-cadre' }, svg, h('p', { class: 'theatre-attente discret' }, 'La carte se déplie…'));
    const bPrec = h('button', { type: 'button', class: 'bouton-icone', 'aria-label': 'Étape précédente', onclick: () => { arreter(); aller(etape - 1); } }, icone('gauche'));
    const bSuiv = h('button', { type: 'button', class: 'bouton-icone', 'aria-label': 'Étape suivante', onclick: () => { arreter(); aller(etape + 1); } }, icone('droite'));
    const bJouer = h('button', { type: 'button', class: 'bouton-jouer', onclick: () => (lecture ? arreter() : jouer()) });
    const bCadrer = h('button', { type: 'button', class: 'bouton-icone th-cadrer', 'aria-label': 'Recadrer', title: 'Recadrer', hidden: true, onclick: () => { libre = false; bCadrer.hidden = true; versVue(carte.etapes[etape].vue); } }, icone('accueil'));
    const curseur = h('input', { type: 'range', min: 0, max: carte.etapes.length - 1, step: 1, value: etape, 'aria-label': 'Étape', oninput: () => { arreter(); aller(parseInt(curseur.value, 10)); } });
    const compteur = h('span', { class: 'th-compteur discret petit' });
    const recit = h('div', { class: 'theatre-recit', 'aria-live': 'polite' });
    cadre.appendChild(bCadrer);
    conteneur.append(cadre, h('div', { class: 'theatre-commandes' }, bPrec, bJouer, bSuiv, curseur, compteur), recit);

    const types = new Set(carte.etapes.flatMap((e) => (e.marques || []).map((m) => m.t)));
    const legende = h('p', { class: 'theatre-legende petit discret' },
      h('span', { class: 'th-pastille camp-fr' }), 'Français ', h('span', { class: 'th-pastille camp-de' }), 'Allemands ',
      types.has('bataille') ? [h('span', { class: 'th-signe' }, '✕'), 'combat '] : null,
      types.has('siege') ? [h('span', { class: 'th-signe' }, '◎'), 'siège '] : null,
      types.has('fort') ? [h('span', { class: 'th-signe th-signe-fort' }, '■'), 'fort '] : null,
      types.has('feu') ? [h('span', { class: 'th-signe th-signe-feu' }, '✹'), 'bombardement, incendie'] : null);
    conteneur.appendChild(legende);
    const credit = h('p', { class: 'petit discret theatre-credit' });
    conteneur.appendChild(credit);

    // ── Le dessin ───────────────────────────────────────────────────────────

    const nomsVilles = new Set();  // un lieu déjà nommé par le fond n'a pas besoin d'une seconde étiquette
    const unites = new Map();     // id → { g, rect, texte, x, y, visible }
    const noms = [];              // [{ el, x, y, rang }]
    let marquesPosees = [];

    function dessinerFond() {
      const c = fond.cadre;
      gFond.appendChild(s('rect', { class: 'th-mer', x: c[0] - c[2], y: c[1] - c[3], width: c[2] * 3, height: c[3] * 3 }));
      if (fond.terre) gFond.appendChild(s('path', { class: 'th-terre', d: fond.terre }));
      else gFond.appendChild(s('rect', { class: 'th-terre', x: c[0] - c[2], y: c[1] - c[3], width: c[2] * 3, height: c[3] * 3 }));
      if (fond.bois) gFond.appendChild(s('path', { class: 'th-bois', d: fond.bois }));
      if (fond.annexion) gFond.appendChild(s('path', { class: 'th-annexion', d: fond.annexion.aire }));
      if (fond.lacs) gFond.appendChild(s('path', { class: 'th-lac', d: fond.lacs }));
      for (const [d, classe] of fond.eaux || []) if (d) gFond.appendChild(s('path', { class: 'th-eau th-eau-' + classe, d }));
      if (fond.frontieres) gFond.appendChild(s('path', { class: 'th-frontiere', d: fond.frontieres }));
      if (fond.annexion) gFond.appendChild(s('path', { class: 'th-annexion-bord', d: fond.annexion.bord }));
      for (const [nom, x, y, rang] of fond.villes) {
        const g = s('g', { class: 'th-ville th-rang-' + rang });
        const point = s('circle', { cx: x, cy: y });
        const texte = s('text', { x, y }, nom);
        g.append(point, texte);
        gVilles.appendChild(g);
        noms.push({ g, point, texte, x, y, rang });
        nomsVilles.add(nom);
      }
      for (const [id, u] of Object.entries(carte.unites)) {
        const g = s('g', { class: 'th-unite camp-' + u.camp });
        const rect = s('rect', {});
        const texte = s('text', { 'text-anchor': 'middle' }, u.court);
        const titre = s('title', null, u.nom);
        g.append(titre, rect, texte);
        g.style.display = 'none';
        gUnites.appendChild(g);
        const trace = carte.traces ? s('polyline', { class: 'th-trace camp-' + u.camp }) : null;
        if (trace) gTraces.appendChild(trace);
        unites.set(id, { g, rect, texte, trace, x: 0, y: 0, visible: false, large: Math.max(3, u.court.length) });
      }
      credit.textContent = fond.source + ' Positions schématiques.';
    }

    /* Tout ce qui garde sa taille à l'écran : noms, pastilles, signes. `u` = unités par pixel. */
    function echelle() {
      const largeurPx = svg.clientWidth || 360;
      const u = vue[2] / largeurPx;
      const km = vue[2] * fond.metresParUnite / 1000;
      const seuil = fond.id === 'campagne' ? (km < 260 ? 4 : km < 520 ? 3 : km < 1000 ? 2 : 1) : (km < 14 ? 3 : km < 34 ? 2 : 1);
      for (const n of noms) {
        const vu = n.rang <= seuil && n.x > vue[0] && n.x < vue[0] + vue[2] && n.y > vue[1] && n.y < vue[1] + vue[3];
        n.g.style.display = vu ? '' : 'none';
        if (!vu) continue;
        n.point.setAttribute('r', (n.rang === 1 ? 2.6 : 1.9) * u);
        n.texte.setAttribute('font-size', (n.rang === 1 ? 12 : 10.5) * u);
        n.texte.setAttribute('x', n.x + 5 * u);
        n.texte.setAttribute('y', n.y + 3.5 * u);
      }
      placerUnites(u);
      for (const m of marquesPosees) {
        const taille = m.t === 'fort' ? 9 : m.actuelle ? 19 : 14;
        m.signe.setAttribute('font-size', taille * u);
        m.signe.setAttribute('y', m.y + taille * 0.34 * u);
        if (m.texte) { m.texte.setAttribute('font-size', 11.5 * u); m.texte.setAttribute('x', m.x + 10 * u); m.texte.setAttribute('y', m.y - 6 * u); }
      }
      gTraces.style.strokeWidth = 2 * u;
      gTraces.style.strokeDasharray = (1 * u) + ' ' + (5 * u);
    }

    /* Les pastilles des unités : posées au-dessus de leur lieu (sans cacher son nom),
     * puis écartées verticalement quand deux d'entre elles se chevaucheraient. */
    function placerUnites(u) {
      const petit = (svg.clientWidth || 360) < 430;
      const corps = petit ? 9.6 : 10.5;
      const ht = (petit ? 15 : 17) * u;
      const posees = [];
      for (const un of unites.values()) {
        if (!un.visible) continue;
        const l = (un.large * corps * 0.62 + 9) * u;
        const x = un.x;
        let y = un.y - 12 * u;
        for (let essai = 0; essai < 8; essai += 1) {
          const gene = posees.find((p) => Math.abs(p.x - x) < (p.l + l) / 2 + 2 * u && Math.abs(p.y - y) < ht + 2 * u);
          if (!gene) break;
          y = gene.y + (y >= gene.y ? 1 : -1) * (ht + 3 * u);
        }
        posees.push({ x, y, l });
        un.rect.setAttribute('x', x - l / 2); un.rect.setAttribute('y', y - ht / 2);
        un.rect.setAttribute('width', l); un.rect.setAttribute('height', ht); un.rect.setAttribute('rx', 4 * u);
        un.rect.setAttribute('stroke-width', 1.2 * u);
        un.texte.setAttribute('x', x); un.texte.setAttribute('y', y + corps * 0.36 * u);
        un.texte.setAttribute('font-size', corps * u);
      }
    }

    function poserVue(v) {
      vue = v;
      svg.setAttribute('viewBox', v.join(' '));
      echelle();
    }

    /* Le cadre de l'étape, élargi pour remplir le format de la carte à l'écran. */
    function ajuster(v) {
      const r = (svg.clientWidth || 360) / (svg.clientHeight || 300);
      let [x, y, l, ht] = v;
      if (l / ht > r) { const n = l / r; y -= (n - ht) / 2; ht = n; }
      else { const n = ht * r; x -= (n - l) / 2; l = n; }
      return [x, y, l, ht];
    }

    function marques(k) {
      gMarques.textContent = '';
      marquesPosees = [];
      const levees = new Set();
      const vues = new Map();
      for (let i = 0; i <= k; i += 1) {
        for (const nom of carte.etapes[i].leve || []) levees.add(nom);
        for (const m of carte.etapes[i].marques || []) { levees.delete(m.nom); vues.set(m.nom, { m, i }); }
      }
      for (const [nom, { m, i }] of vues) {
        if (levees.has(nom)) continue;
        const actuelle = i === k;
        const g = s(m.a ? 'a' : 'g', { class: 'th-marque th-' + m.t + (m.camp ? ' camp-' + m.camp : '') + (actuelle ? ' actuelle' : ''), href: m.a ? '#/a/' + m.a : null });
        const signe = s('text', { x: m.x, y: m.y, 'text-anchor': 'middle', class: 'th-signe' }, ({ siege: '◎', bataille: '✕', fort: '■', feu: '✹' })[m.t] || '●');
        g.append(s('title', null, m.nom), signe);
        let texte = null;
        if (((actuelle && m.t !== 'fort') || m.t === 'siege') && !nomsVilles.has(m.nom)) { texte = s('text', { class: 'th-nom-marque' }, m.nom); g.appendChild(texte); }
        gMarques.appendChild(g);
        marquesPosees.push({ signe, texte, x: m.x, y: m.y, actuelle, t: m.t });
      }
    }

    function traces(k) {
      if (!carte.traces) return;
      for (const [id, un] of unites) {
        const pts = [];
        for (let i = 0; i <= k; i += 1) {
          const p = carte.etapes[i].pos[id];
          if (!p) { pts.length = 0; continue; }
          const d = pts[pts.length - 1];
          if (!d || d[0] !== p[0] || d[1] !== p[1]) pts.push(p);
        }
        un.trace.setAttribute('points', pts.length > 1 ? pts.map((p) => p.join(',')).join(' ') : '');
      }
    }

    function recitDe(k) {
      const e = carte.etapes[k];
      recit.textContent = '';
      recit.appendChild(h('p', { class: 'th-date' }, e.quand || Dates.lire(e.date)));
      recit.appendChild(h('h3', null, e.titre));
      for (const p of [].concat(e.texte || [])) recit.appendChild(Rendu.paragraphe(p));
      const liens = (e.articles || []).map((id) => Donnees.article(id)).filter(Boolean);
      if (liens.length) {
        recit.appendChild(h('p', { class: 'th-liens' }, liens.map((a) => h('a', { class: 'puce puce-claire', href: '#/a/' + a.id, style: { '--teinte': Donnees.categorie(a.c).couleur } }, a.n))));
      }
      compteur.textContent = (k + 1) + ' / ' + carte.etapes.length;
      curseur.value = k;
      bPrec.disabled = k === 0;
      bSuiv.disabled = k === carte.etapes.length - 1;
    }

    function versVue(cible, duree) {
      cancelAnimationFrame(anim);
      const depart = vue.slice();
      const but = ajuster(cible);
      const debut = performance.now();
      const d = reduit() ? 0 : (duree || 700);
      const pas = (t) => {
        const f = d ? Math.min(1, (t - debut) / d) : 1;
        const e = doux(f);
        poserVue(depart.map((v, i) => melange(v, but[i], e)));
        if (f < 1 && !detruit) anim = requestAnimationFrame(pas);
      };
      anim = requestAnimationFrame(pas);
    }

    function aller(k, sansAnimation) {
      k = Math.max(0, Math.min(carte.etapes.length - 1, k));
      const e = carte.etapes[k];
      cancelAnimationFrame(anim);
      const departVue = vue.slice();
      const butVue = libre ? departVue : ajuster(e.vue);
      const departs = new Map();
      for (const [id, un] of unites) {
        const p = e.pos[id];
        departs.set(id, un.visible ? [un.x, un.y] : (p ? p.slice() : null));
        un.visible = !!p;
        un.g.style.display = p ? '' : 'none';
      }
      etape = k;
      marques(k);
      traces(k);
      recitDe(k);
      svg.classList.toggle('avec-annexion', !!e.annexion);
      const d = sansAnimation || reduit() ? 0 : 900;
      const debut = performance.now();
      const pas = (t) => {
        const f = d ? Math.min(1, (t - debut) / d) : 1;
        const g = doux(f);
        for (const [id, un] of unites) {
          const p = e.pos[id];
          if (!p) continue;
          const a = departs.get(id) || p;
          un.x = melange(a[0], p[0], g); un.y = melange(a[1], p[1], g);
        }
        poserVue(departVue.map((v, i) => melange(v, butVue[i], g)));
        if (f < 1 && !detruit) anim = requestAnimationFrame(pas);
      };
      anim = requestAnimationFrame(pas);
      if (o.surEtape) o.surEtape(k);
    }

    function habillerJouer() {
      bJouer.textContent = '';
      bJouer.append(icone(lecture ? 'pause' : 'lecture'), lecture ? 'Pause' : 'Animer');
    }
    function jouer() {
      if (etape >= carte.etapes.length - 1) aller(0);
      const suivant = () => {
        if (etape >= carte.etapes.length - 1) { arreter(); return; }
        aller(etape + 1);
        const mots = [].concat(carte.etapes[etape].texte || []).join(' ').split(/\s+/).length;
        lecture = setTimeout(suivant, Math.max(3500, Math.min(11000, 1600 + mots * 190)));
      };
      lecture = setTimeout(suivant, 900);
      habillerJouer();
    }
    function arreter() { clearTimeout(lecture); lecture = 0; habillerJouer(); }

    // ── Déplacer et grossir au doigt ────────────────────────────────────────

    const pointeurs = new Map();
    let prise = null;
    const liberer = () => { if (!libre) { libre = true; bCadrer.hidden = false; } cancelAnimationFrame(anim); };
    const zoomer = (facteur, cx, cy) => {
      const r = svg.getBoundingClientRect();
      const fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
      const max = fond.cadre[2] * 1.6, min = fond.cadre[2] / 400;
      const l = Math.max(min, Math.min(max, vue[2] * facteur));
      const k = l / vue[2];
      poserVue([vue[0] + vue[2] * fx * (1 - k), vue[1] + vue[3] * fy * (1 - k), l, vue[3] * k]);
    };
    svg.addEventListener('pointerdown', (e) => {
      pointeurs.set(e.pointerId, [e.clientX, e.clientY]);
      prise = { vue: vue.slice(), pts: new Map(pointeurs), bouge: false };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pointeurs.has(e.pointerId)) return;
      pointeurs.set(e.pointerId, [e.clientX, e.clientY]);
      const r = svg.getBoundingClientRect();
      const u = prise.vue[2] / r.width;
      const ids = Array.from(pointeurs.keys());
      if (ids.length === 1) {
        const a = prise.pts.get(ids[0]), b = pointeurs.get(ids[0]);
        if (!a) return;
        if (!prise.bouge && Math.hypot(b[0] - a[0], b[1] - a[1]) < 6) return;
        if (!prise.bouge) { prise.bouge = true; liberer(); try { svg.setPointerCapture(e.pointerId); } catch (err) { /* rien */ } }
        poserVue([prise.vue[0] - (b[0] - a[0]) * u, prise.vue[1] - (b[1] - a[1]) * u, prise.vue[2], prise.vue[3]]);
      } else if (ids.length === 2) {
        const [a1, a2] = [prise.pts.get(ids[0]), prise.pts.get(ids[1])];
        const [b1, b2] = [pointeurs.get(ids[0]), pointeurs.get(ids[1])];
        if (!a1 || !a2) return;
        liberer(); prise.bouge = true;
        const k = Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) / Math.max(10, Math.hypot(b2[0] - b1[0], b2[1] - b1[1]));
        const ma = [(a1[0] + a2[0]) / 2 - r.left, (a1[1] + a2[1]) / 2 - r.top];
        const mb = [(b1[0] + b2[0]) / 2 - r.left, (b1[1] + b2[1]) / 2 - r.top];
        const l = prise.vue[2] * k, ht = prise.vue[3] * k;
        const mx = prise.vue[0] + ma[0] * u, my = prise.vue[1] + ma[1] * u;
        poserVue([mx - mb[0] * (l / r.width), my - mb[1] * (l / r.width), l, ht]);
      }
    });
    const fin = (e) => { pointeurs.delete(e.pointerId); prise = { vue: vue ? vue.slice() : null, pts: new Map(pointeurs), bouge: false }; };
    svg.addEventListener('pointerup', fin);
    svg.addEventListener('pointercancel', fin);
    svg.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); liberer(); zoomer(e.deltaY > 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY); }, { passive: false });
    const surTaille = () => { if (vue && !detruit) echelle(); };
    racine.addEventListener('resize', surTaille);

    habillerJouer();
    chargerFond(carte.fond).then((f) => {
      if (detruit) return;
      fond = f;
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (f.cadre[1] + f.cadre[3] / 2) / f.taille)));
      fond.metresParUnite = 40075016.7 * Math.cos(lat) / f.taille;
      cadre.querySelector('.theatre-attente').remove();
      dessinerFond();
      vue = ajuster(carte.etapes[etape].vue);
      aller(etape, true);
    }).catch(() => { cadre.querySelector('.theatre-attente').textContent = 'Le fond de carte n’a pas pu être chargé.'; });

    return {
      aller: (k) => { arreter(); aller(k); },
      get etape() { return etape; },
      detruire: () => { detruit = true; arreter(); cancelAnimationFrame(anim); racine.removeEventListener('resize', surTaille); },
    };
  }

  racine.Theatre = { creer };

})(window);

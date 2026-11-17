'use strict';
/*
 * La frise : la guerre en un regard (les sièges en barres, les batailles en
 * traits, sur l'axe des mois), puis la chronologie jour par jour. Tout vient
 * des articles datés (« quand », « jusqu ») et de data/frise.json pour les
 * faits qui n'ont pas d'article à eux.
 */
(function (racine) {

  const { h, icone } = Outils;
  let faits = null;

  const jourDe = (cle) => { const [a, m, j] = cle.split('-').map(Number); return Date.UTC(a, m - 1, j) / 86400000; };
  const DEBUT = jourDe('1870-07-01');
  const FIN = jourDe('1871-03-31');
  const part = (cle) => Math.max(0, Math.min(100, 100 * (jourDe(cle) - DEBUT) / (FIN - DEBUT)));
  const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  function issueCamp(a) {
    const i = (a.is || '').toLowerCase();
    if (/français|place non prise|non prise/.test(i)) return 'fr';
    if (/allemand|prussien|bavarois|capitulation|reddition/.test(i)) return 'de';
    return '';
  }

  function regard(articles) {
    const bloc = h('div', { class: 'regard' });
    const axe = h('div', { class: 'regard-axe' });
    for (let m = 0; m < 9; m += 1) {
      const d = new Date(Date.UTC(1870, 6 + m, 1));
      const cle = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-01';
      axe.appendChild(h('span', { class: 'regard-mois', style: { left: part(cle) + '%' } }, MOIS_COURTS[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ' ' + String(d.getUTCFullYear()).slice(2) : '')));
    }
    bloc.appendChild(axe);
    const lignes = h('div', { class: 'regard-lignes' });
    const batailles = h('div', { class: 'regard-ligne regard-batailles' }, h('span', { class: 'regard-nom' }, 'Batailles'));
    for (const a of articles.filter((x) => x.c === 'batailles')) {
      batailles.appendChild(h('a', { class: 'regard-trait camp-' + issueCamp(a), href: '#/a/' + a.id, title: a.n + ' — ' + a.da, 'aria-label': a.n, style: { left: part(Dates.cle(a.q)) + '%' } }));
    }
    lignes.appendChild(batailles);
    const sieges = articles.filter((x) => x.c === 'sieges' && x.j).sort((x, y) => Dates.cle(x.q).localeCompare(Dates.cle(y.q)));
    for (const a of sieges) {
      const g = part(Dates.cle(a.q)), d = part(Dates.cle(a.j, true));
      const nom = a.n.replace(/^Siège d[e’'] ?/, '').replace(/^Le bombardement de /, 'Bombardement de ');
      lignes.appendChild(h('a', { class: 'regard-ligne regard-siege', href: '#/a/' + a.id },
        h('span', { class: 'regard-barre camp-' + issueCamp(a), style: { left: g + '%', width: Math.max(0.8, d - g) + '%' } }),
        h('span', { class: 'regard-etiquette' + (d - g > 45 ? ' dedans' : ''), style: d - g > 45 ? { left: g + '%' } : d > 62 ? { right: (100 - g) + '%' } : { left: d + '%' } }, nom)));
    }
    bloc.appendChild(lignes);
    bloc.appendChild(h('p', { class: 'petit discret regard-legende' }, h('span', { class: 'th-pastille camp-de' }), 'succès allemand ', h('span', { class: 'th-pastille camp-fr' }), 'succès français ou place tenue ', h('span', { class: 'th-pastille' }), 'indécis'));
    return bloc;
  }

  function liste(articles, voie) {
    const zone = h('div', { class: 'chrono' });
    const items = articles.filter((a) => !voie || a.c === voie).map((a) => ({ cle: Dates.cle(a.q), a }));
    if (!voie) for (const f of faits || []) items.push({ cle: Dates.cle(f.d), f });
    items.sort((x, y) => x.cle.localeCompare(y.cle));
    let mois = '';
    let ul = null;
    for (const it of items) {
      const [an, m, j] = it.cle.split('-');
      const cleMois = an + '-' + m;
      if (cleMois !== mois) {
        mois = cleMois;
        zone.appendChild(h('h3', { class: 'chrono-mois' }, Communs.majuscule(Dates.MOIS[parseInt(m, 10) - 1]) + ' ' + an));
        ul = zone.appendChild(h('ul', { class: 'chrono-liste liste-nue' }));
      }
      const precis = it.a ? /^\d{4}-\d\d-\d\d$/.test(it.a.q) : /^\d{4}-\d\d-\d\d$/.test(it.f.d);
      const jour = h('span', { class: 'chrono-jour' }, precis ? String(parseInt(j, 10)) : '·');
      if (it.a) {
        const a = it.a;
        const cat = Donnees.categorie(a.c);
        const duree = a.j && a.j !== a.q ? ' → ' + Dates.lire(a.j) + ' (' + Dates.duree(a.q, a.j, { finInclusive: true }) + ')' : '';
        ul.appendChild(h('li', { class: 'chrono-fait', style: { '--teinte': cat.couleur } }, jour,
          h('a', { class: 'chrono-corps', href: '#/a/' + a.id }, h('span', { class: 'chrono-titre' }, a.n),
            h('span', { class: 'chrono-sous petit discret' }, cat.nom + (a.is ? ' · ' + a.is : '') + duree))));
      } else {
        const corps = h('div', { class: 'chrono-corps' });
        corps.appendChild(Rendu.fragment(it.f.t));
        ul.appendChild(h('li', { class: 'chrono-fait chrono-simple' }, jour, corps));
      }
    }
    return zone;
  }

  function dessiner(zone, params) {
    const page = h('div', { class: 'page' });
    const articles = Donnees.dates().filter((a) => a.c !== 'personnages');
    page.appendChild(h('div', { class: 'ligne-compte' },
      h('p', { class: 'discret intro-carte' }, 'De la candidature Hohenzollern à la libération du territoire.'),
      h('a', { class: 'bouton-discret', href: '#/forces' }, icone('comparer'), 'Rapports de force')));
    page.appendChild(Communs.titre('La guerre en un regard', 'touchez un trait ou une barre'));
    page.appendChild(regard(articles.filter((a) => Dates.cle(a.q) >= '1870-07-01' && Dates.cle(a.q) <= '1871-03-31')));

    let voie = params.v || '';
    const filtres = h('div', { class: 'filtres' });
    const corps = h('div');
    const maj = () => {
      filtres.textContent = '';
      filtres.appendChild(h('button', { type: 'button', class: 'filtre' + (voie ? '' : ' actif'), onclick: () => { voie = ''; maj(); } }, 'Tout'));
      for (const c of Donnees.categories) {
        if (!articles.some((a) => a.c === c.id)) continue;
        filtres.appendChild(h('button', { type: 'button', class: 'filtre' + (voie === c.id ? ' actif' : ''), style: { '--teinte': c.couleur }, onclick: () => { voie = voie === c.id ? '' : c.id; maj(); } }, h('span', { class: 'point-cat' }), c.nom));
      }
      corps.textContent = '';
      corps.appendChild(liste(articles, voie));
    };
    page.appendChild(Communs.titre('Jour par jour'));
    page.append(filtres, corps);
    zone.appendChild(page);
    const pret = faits ? Promise.resolve() : fetch('data/frise.json').then((r) => r.json()).then((d) => { faits = d.faits || []; }).catch(() => { faits = []; });
    maj();
    pret.then(maj);
    return { titre: 'Frise', sous: 'juillet 1870 – 1873' };
  }

  racine.VueFrise = { dessiner };

})(window);

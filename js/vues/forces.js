'use strict';
/*
 * Les rapports de force : bataille par bataille (effectifs, canons, pertes des
 * deux camps, en barres opposées), et la portée des armes, sur une même règle.
 * Tout est tiré des articles : leurs chiffres, leurs fiches techniques.
 */
(function (racine) {

  const { h } = Outils;
  const nombre = (n) => (n == null ? '?' : n.toLocaleString('fr-FR'));

  /* « 1 200 m », « environ 3 000 m », « 3,8 km » → des mètres. */
  function metres(valeur) {
    const v = String(valeur).replace(/[\s  ]/g, '');
    const km = /(\d+(?:,\d+)?)km/.exec(v);
    if (km) return Math.round(parseFloat(km[1].replace(',', '.')) * 1000);
    const m = /(\d{2,5})m(?!m)/.exec(v);
    return m ? parseInt(m[1], 10) : null;
  }

  function duel(a, champ, max) {
    const [fr, de] = a[champ];
    const large = (n) => (n == null ? 0 : Math.max(1.5, 100 * n / max)) + '%';
    return h('a', { class: 'duel', href: '#/a/' + a.id },
      h('span', { class: 'duel-nom' }, a.n.replace(/^Bataille d[e’'u] ?|^Siège d[e’'] ?|^Combat d[e’'u] ?/, (m) => (/^Siège/.test(m) ? 'Siège : ' : '')), h('span', { class: 'discret petit' }, ' · ' + a.da)),
      h('span', { class: 'duel-barres' },
        h('span', { class: 'duel-cote duel-fr' }, h('span', { class: 'duel-valeur' }, nombre(fr)), h('span', { class: 'duel-barre camp-fr', style: { width: large(fr) } })),
        h('span', { class: 'duel-cote duel-de' }, h('span', { class: 'duel-barre camp-de', style: { width: large(de) } }), h('span', { class: 'duel-valeur' }, nombre(de)))));
  }

  function dessiner(zone, params) {
    const page = h('div', { class: 'page' });
    const batailles = Donnees.batailles();
    let champ = params.m || 'ef';
    const LIBELLES = { ef: ['Effectifs', 'hommes engagés'], pe: ['Pertes', 'tués, blessés, disparus, prisonniers'], cn: ['Canons', 'pièces engagées'] };

    page.appendChild(h('p', { class: 'discret intro-carte' }, 'Qui était le plus nombreux, où, et à quel prix ? Les chiffres sont des ordres de grandeur ; chaque article dit d’où ils viennent.'));
    for (const id of ['effectifs-compares', 'mobilisation-de-1870', 'armee-francaise-en-1870', 'armee-allemande-en-1870']) {
      const a = Donnees.article(id);
      if (a) page.appendChild(Communs.carteArticle(a, { sansDates: true }));
    }

    page.appendChild(Communs.titre('Bataille par bataille', Outils.pluriel(batailles.length, 'combat')));
    const segments = h('div', { class: 'segments' });
    const corps = h('div', { class: 'duels' });
    const maj = () => {
      segments.textContent = '';
      for (const [cle, [nom]] of Object.entries(LIBELLES)) {
        if (!batailles.some((a) => a[cle])) continue;
        segments.appendChild(h('button', { type: 'button', class: champ === cle ? 'actif' : '', onclick: () => { champ = cle; App.remplacer('#/forces?m=' + cle); maj(); } }, nom));
      }
      corps.textContent = '';
      // batailles et sièges, chacun sur sa propre échelle : 400 000 assiégés à Paris écraseraient Wissembourg
      for (const [cat, nom, cotes] of [['batailles', 'Batailles', ['Français', 'Allemands']], ['sieges', 'Sièges', ['Garnison', 'Assiégeants']]]) {
        const liste = batailles.filter((a) => a.c === cat && a[champ]);
        if (!liste.length) continue;
        const max = Math.max(1, ...liste.flatMap((a) => a[champ].filter((x) => x != null)));
        corps.appendChild(h('h3', { class: 'duel-groupe' }, nom));
        corps.appendChild(h('p', { class: 'duel-entete petit' }, h('span', { class: 'camp-texte-fr' }, cotes[0]), h('span', { class: 'discret' }, LIBELLES[champ][1]), h('span', { class: 'camp-texte-de' }, cotes[1])));
        for (const a of liste) corps.appendChild(duel(a, champ, max));
      }
      if (!corps.children.length) corps.appendChild(h('p', { class: 'discret' }, 'Pas encore de chiffres.'));
    };
    page.append(segments, corps);
    maj();

    // La portée des armes
    const armes = Donnees.parCat('armes').map((a) => {
      const ligne = (a.fi || []).find(([l]) => /^Portée utile/i.test(l));   // la seule portée utile : une portée maximale ne se compare pas
      const m = ligne ? metres(ligne[1]) : null;
      return m ? { a, m, texte: ligne[1], libelle: ligne[0] } : null;
    }).filter(Boolean).sort((x, y) => x.m - y.m);
    if (armes.length > 1) {
      page.appendChild(Communs.titre('La portée des armes', 'portée utile'));
      page.appendChild(h('p', { class: 'discret petit' }, 'Le fantassin français tire plus loin que le fantassin allemand ; le canon allemand tire plus loin et plus juste que le canon français. Toute la tactique de 1870 est dans cet écart.'));
      const max = Math.max(...armes.map((x) => x.m));
      const regle = h('div', { class: 'portees' });
      for (const x of armes) {
        regle.appendChild(h('a', { class: 'portee', href: '#/a/' + x.a.id },
          h('span', { class: 'portee-nom' }, x.a.n.replace(/^(Le |La |Les |L’)/, (m) => '').replace(/^./, (c) => c.toUpperCase())),
          h('span', { class: 'portee-piste' }, h('span', { class: 'portee-barre camp-' + (x.a.ca || ''), style: { width: Math.max(2, 100 * x.m / max) + '%' } })),
          h('span', { class: 'portee-valeur petit' }, x.texte)));
      }
      page.appendChild(regle);
    }
    zone.appendChild(page);
    return { titre: 'Rapports de force', sous: 'effectifs, pertes, portées' };
  }

  racine.VueForces = { dessiner };

})(window);

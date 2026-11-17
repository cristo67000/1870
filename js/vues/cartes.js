'use strict';
/* Les cartes animées : le choix de la carte, puis le théâtre (js/theatre.js). */
(function (racine) {

  const { h } = Outils;

  function dessiner(zone, params) {
    const page = h('div', { class: 'page page-cartes' });
    const cartes = Donnees.cartes;
    if (!cartes.length) {
      page.appendChild(h('p', { class: 'discret' }, 'Les cartes ne sont pas encore chargées.'));
      zone.appendChild(page);
      return { titre: 'Cartes' };
    }
    const carte = Donnees.carte(params.c) || cartes[0];
    if (cartes.length > 1) {
      const choix = h('div', { class: 'filtres choix-cartes', role: 'group', 'aria-label': 'Choisir une carte' });
      for (const c of cartes) {
        choix.appendChild(h('a', { class: 'filtre' + (c.id === carte.id ? ' actif' : ''), href: '#/cartes?c=' + c.id }, c.court || c.titre));
      }
      page.appendChild(choix);
    }
    page.appendChild(h('h2', { class: 'titre-carte' }, carte.titre));
    if (carte.sous) page.appendChild(h('p', { class: 'discret intro-carte' }, carte.sous));
    const scene = h('div', { class: 'theatre' });
    page.appendChild(scene);
    zone.appendChild(page);
    const depart = Math.max(0, parseInt(params.e || '1', 10) - 1) || 0;
    const theatre = Theatre.creer(scene, carte, {
      etape: depart,
      surEtape: (k) => App.remplacer('#/cartes?c=' + carte.id + (k ? '&e=' + (k + 1) : '')),
    });
    return { titre: 'Cartes animées', sous: carte.titre, quitter: () => theatre.detruire() };
  }

  racine.VueCartes = { dessiner };

})(window);

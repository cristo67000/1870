'use strict';
/* L'accueil : ce jour-là, les portes d'entrée, un texte, les thèmes. */
(function (racine) {

  const { h, icone } = Outils;
  const { carteArticle, vignette, titre } = Communs;

  /* Par où commencer : les grands articles, dans l'ordre d'une première lecture. */
  const PORTES = ['guerre-de-1870', 'causes-de-la-guerre', 'depeche-d-ems', 'effectifs-compares', 'bataille-de-froeschwiller-woerth',
    'bataille-de-gravelotte', 'bataille-de-sedan', 'siege-de-strasbourg', 'siege-de-paris', 'gambetta', 'traite-de-francfort', 'alsace-lorraine'];

  function carteSection(nom, sous, href, teinte, ico) {
    return h('a', { class: 'carte carte-lien carte-section', href, style: { '--teinte': teinte } },
      h('span', { class: 'pastille-section' }, icone(ico)),
      h('div', { class: 'corps' }, h('p', { class: 'carte-titre' }, nom), h('p', { class: 'discret petit' }, sous)),
      icone('droite', 'fleche discret'));
  }

  function dessiner(zone) {
    const page = h('div', { class: 'page' });
    const n = Donnees.articles.length;

    const champ = h('input', { type: 'search', placeholder: 'Chercher : Sedan, Bazaine, Chassepot…', 'aria-label': 'Chercher un article', autocomplete: 'off' });
    const chercher = () => { App.aller('#/articles?q=' + encodeURIComponent(champ.value.trim())); };
    champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') chercher(); });
    page.appendChild(h('section', { class: 'heros' },
      h('p', { class: 'heros-sur' }, '19 juillet 1870 – 10 mai 1871'),
      h('h2', null, 'L’année terrible'),
      h('p', null, 'La guerre franco-allemande en ' + Outils.pluriel(n, 'article') + ' vérifiés, des cartes qui s’animent, une frise jour par jour et ' + Outils.pluriel(Donnees.textes.length, 'texte') + ' de ceux qui l’ont vue.'),
      h('div', { class: 'saisie-date' }, champ, h('button', { type: 'button', onclick: chercher }, 'Chercher'))));

    const carteInstallation = Installer.carteAccueil();
    if (carteInstallation) page.appendChild(carteInstallation);

    // Ce jour-là
    const t = new Date();
    const anniv = Donnees.anniversaires(t.getDate(), t.getMonth() + 1);
    if (anniv.length) {
      page.appendChild(titre('Un ' + (t.getDate() === 1 ? '1ᵉʳ' : t.getDate()) + ' ' + Dates.MOIS[t.getMonth()], 'pendant la guerre'));
      const ul = h('ul', { class: 'reperes anniversaires' });
      for (const x of anniv.slice(0, 6)) {
        ul.appendChild(h('li', null, h('div', { class: 'quand' }, String(x.an)),
          h('div', { class: 'quoi' }, Rendu.fragment(x.fait), ' ', h('a', { class: 'renvoi', href: '#/a/' + x.a.id }, '→ ' + x.a.n))));
      }
      page.appendChild(ul);
    }

    // Les sections
    page.appendChild(titre('Explorer'));
    const grille = h('div', { class: 'grille-sections' });
    const campagne = Donnees.cartes[0];
    grille.appendChild(carteSection('Cartes animées', Donnees.cartes.length > 1 ? 'la campagne et ' + Outils.pluriel(Donnees.cartes.length - 1, 'bataille') + ', étape par étape' : 'la campagne, étape par étape', '#/cartes', '#2f5fa3', 'carte'));
    grille.appendChild(carteSection('Frise', 'la guerre jour par jour, les sièges en un regard', '#/frise', '#8c2f39', 'frise'));
    grille.appendChild(carteSection('Rapports de force', 'effectifs, pertes, portée des armes', '#/forces', '#4d6a5a', 'comparer'));
    grille.appendChild(carteSection('Textes', 'témoins, écrivains, historiens — avec le livre sur Gallica', '#/textes', '#9c7c2b', 'livre'));
    page.appendChild(grille);

    if (campagne) {
      page.appendChild(h('a', { class: 'carte carte-lien affiche-carte', href: '#/cartes?c=' + campagne.id },
        h('span', { class: 'affiche-signes', 'aria-hidden': 'true' }, h('i', { class: 'camp-de' }), h('i', { class: 'camp-fr' }), h('b', null, '✕')),
        h('div', { class: 'corps' }, h('p', { class: 'carte-titre' }, campagne.titre), h('p', { class: 'discret petit' }, campagne.sous)),
        h('span', { class: 'bouton-jouer' }, icone('lecture'), 'Animer')));
    }

    // Un texte
    const texte = Donnees.texteDuJour();
    if (texte) {
      page.appendChild(titre('À lire aujourd’hui', Donnees.genre(texte.g).nom.toLowerCase()));
      page.appendChild(VueTextes.carteTexte(texte, { extrait: true }));
    }

    // L'article du jour
    const jour = Donnees.duJour();
    if (jour) {
      page.appendChild(titre('Un article', 'au hasard du calendrier'));
      page.appendChild(carteArticle(jour));
    }

    // Par où commencer
    const portes = PORTES.map((id) => Donnees.article(id)).filter(Boolean);
    if (portes.length) {
      page.appendChild(titre('Par où commencer', 'dans l’ordre'));
      const ol = h('ol', { class: 'portes' });
      for (const a of portes) {
        ol.appendChild(h('li', null, h('a', { class: 'porte', href: '#/a/' + a.id }, vignette(a, 'petite'), h('span', { class: 'texte' }, h('span', { class: 'nom' }, a.n), h('span', { class: 'petit discret' }, a.da || Donnees.categorie(a.c).nom)))));
      }
      page.appendChild(ol);
    }

    // Les catégories
    page.appendChild(titre('Par thème'));
    const cats = h('div', { class: 'grille-categories' });
    for (const c of Donnees.categories) {
      const nb = Donnees.parCat(c.id).length;
      if (!nb) continue;
      cats.appendChild(h('a', { class: 'carte carte-lien carte-categorie', href: '#/articles?cat=' + c.id, style: { '--teinte': c.couleur } },
        h('span', { class: 'bande' }), h('span', { class: 'nom' }, c.nom), h('span', { class: 'petit discret' }, Outils.pluriel(nb, 'article'))));
    }
    page.appendChild(cats);

    page.appendChild(h('div', { class: 'outils-accueil' },
      h('button', { type: 'button', class: 'bouton-discret', onclick: () => App.aller('#/a/' + Donnees.auHasard().id) }, icone('hasard'), 'Un article au hasard')));

    page.appendChild(h('p', { class: 'discret petit', style: { marginTop: '18px' } },
      'Articles originaux, écrits d’après les travaux des historiens et vérifiés source par source ; textes du domaine public, avec renvoi à Gallica. ',
      h('a', { class: 'renvoi', href: '#/reglages' }, 'À propos')));
    zone.appendChild(page);
    return { titre: '1870', sous: 'la guerre franco-allemande' };
  }

  racine.VueAccueil = { dessiner };

})(window);

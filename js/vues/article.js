'use strict';
/*
 * Un article : illustrations, définition, encadré chiffré, texte, repères, attention,
 * fiche technique, cartes animées, textes du temps, « pour aller plus loin », sources, voisins.
 */
(function (racine) {

  const { h, icone } = Outils;
  const { carteArticle, titre, majuscule, annees } = Communs;

  function reperes(a) {
    const ul = h('ul', { class: 'reperes' });
    for (const [d, f] of a.re) {
      ul.appendChild(h('li', null, h('div', { class: 'quand' }, d), h('div', { class: 'quoi' }, Rendu.fragment(f))));
    }
    return ul;
  }

  const nombre = (n) => (n == null ? '?' : n.toLocaleString('fr-FR'));
  const CAMPS = { fr: 'Français', de: 'Allemand', autre: '' };

  /* L'encadré d'une bataille ou d'un siège : issue, chefs, et les chiffres des deux camps en barres. */
  function encadre(a) {
    if (!a.is && !a.ef && !a.pe && !a.ch) return null;
    const bloc = h('aside', { class: 'encadre' });
    if (a.is) bloc.appendChild(h('p', { class: 'encadre-issue' }, h('span', { class: 'discret' }, 'Issue : '), Communs.majuscule(a.is)));
    if (a.j && a.j !== a.q) bloc.appendChild(h('p', { class: 'petit discret' }, 'Durée : ' + Dates.duree(a.q, a.j, { finInclusive: true })));
    const table = h('div', { class: 'encadre-table' });
    table.appendChild(h('div', { class: 'encadre-ligne encadre-tete' }, h('span', { class: 'camp-texte-fr' }, 'Français'), h('span'), h('span', { class: 'camp-texte-de' }, 'Allemands')));
    if (a.ch) table.appendChild(h('div', { class: 'encadre-ligne encadre-chefs' }, h('span', null, a.ch[0]), h('span', { class: 'discret petit' }, 'chefs'), h('span', null, a.ch[1])));
    for (const [cle, nom] of [['ef', 'hommes'], ['cn', 'canons'], ['pe', 'pertes']]) {
      if (!a[cle]) continue;
      const [fr, de] = a[cle];
      const max = Math.max(fr || 0, de || 0, 1);
      table.appendChild(h('div', { class: 'encadre-ligne' },
        h('span', { class: 'encadre-cote' }, h('span', { class: 'encadre-valeur' }, nombre(fr)), h('span', { class: 'duel-barre camp-fr', style: { width: (fr ? Math.max(3, 100 * fr / max) : 0) + '%' } })),
        h('span', { class: 'discret petit' }, nom),
        h('span', { class: 'encadre-cote encadre-droite' }, h('span', { class: 'duel-barre camp-de', style: { width: (de ? Math.max(3, 100 * de / max) : 0) + '%' } }), h('span', { class: 'encadre-valeur' }, nombre(de)))));
    }
    bloc.appendChild(table);
    if (a.nc) bloc.appendChild(Rendu.paragraphe(a.nc, 'petit discret encadre-note'));
    bloc.appendChild(h('a', { class: 'renvoi petit', href: '#/forces' }, 'Comparer avec les autres batailles'));
    return bloc;
  }

  /* La fiche technique d'une arme, les chiffres clés d'une armée. */
  function fiche(a) {
    if (!a.fi || !a.fi.length) return null;
    const dl = h('dl', { class: 'fiche' });
    for (const [libelle, valeur] of a.fi) {
      const dd = h('dd');
      dd.appendChild(Rendu.fragment(valeur));
      dl.append(h('dt', null, libelle), dd);
    }
    return h('section', null, titre(a.c === 'armes' ? 'Fiche technique' : 'En chiffres', null, 'h3'), dl);
  }

  /* Les boutons « Écouter » : lecture, pause, arrêt ; le passage lu est mis
   * en valeur et ramené à l'écran. */
  function barreEcoute(aLire) {
    if (!racine.Voix || !Voix.possible) return null;
    let courant = null;
    const principal = h('button', { type: 'button', class: 'bouton-discret' });
    const stop = h('button', { type: 'button', class: 'bouton-discret', hidden: true, onclick: () => Voix.arreter() }, icone('stop'), 'Arrêter');
    const habiller = (etat) => {
      principal.textContent = '';
      const [ic, texte] = { arret: ['voix', 'Écouter'], lecture: ['pause', 'Pause'], pause: ['lecture', 'Reprendre'] }[etat];
      principal.append(icone(ic), texte);
      principal.classList.toggle('actif', etat === 'lecture');
      stop.hidden = etat === 'arret';
    };
    const marquer = (el) => {
      if (courant) courant.classList.remove('lu');
      courant = el;
      if (!el) return;
      el.classList.add('lu');
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > racine.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    principal.addEventListener('click', () => {
      if (Voix.etat === 'lecture') { Voix.pause(); return; }
      if (Voix.etat === 'pause') { Voix.reprendre(); return; }
      if (!Voix.voix().length) { Communs.toast('Aucune voix française n’est installée sur cet appareil.'); return; }
      Voix.lire(aLire.map((x) => x[1]), {
        surEtat: habiller,
        surMorceau: (i) => marquer(aLire[i][0]),
        surFin: (erreur) => { marquer(null); if (erreur) Communs.toast('La lecture s’est interrompue.'); },
      });
    });
    habiller('arret');
    return h('div', { class: 'ecoute' }, principal, stop);
  }

  function dessiner(zone, params) {
    const a = Donnees.article(params.id);
    if (!a) {
      zone.appendChild(h('div', { class: 'page' }, h('p', null, 'Cet article n’existe pas.'), h('a', { class: 'bouton-discret', href: '#/articles' }, 'Tous les articles')));
      return { titre: '1870' };
    }
    const cat = Donnees.categorie(a.c);
    const page = h('article', { class: 'page article cat-' + a.c, style: { '--teinte': cat.couleur } });

    // En-tête
    const tete = h('header', { class: 'article-tete' });
    tete.appendChild(h('a', { class: 'puce puce-claire', href: '#/articles?cat=' + a.c, style: { '--teinte': cat.couleur } }, cat.nom));
    tete.appendChild(h('h2', null, a.n));
    if (a.da) tete.appendChild(h('p', { class: 'article-dates' }, a.da));
    if (a.ro) tete.appendChild(h('p', { class: 'article-role' }, a.ca && CAMPS[a.ca] ? h('span', { class: 'th-pastille camp-' + a.ca }) : null, a.ro));
    if (a.lo) tete.appendChild(h('p', { class: 'article-lieu discret' }, icone('epingle', 'petite'), a.lo));
    page.appendChild(tete);

    // Ce qui se lit à voix haute : [élément mis en valeur, texte dit]
    const aLire = [[tete, a.n + '.' + (a.da ? ' ' + a.da + '.' : '')]];

    // Illustrations
    const bloc = Illustrations.bloc(a);
    if (bloc) page.appendChild(bloc);

    // Définition et texte
    const def = Rendu.paragraphe(a.def, 'article-def');
    page.appendChild(def);
    aLire.push([def, def.textContent]);
    const cadre = encadre(a);
    if (cadre) page.appendChild(cadre);
    const corps = h('div', { class: 'article-texte' });
    for (const p of a.tx) {
      const par = corps.appendChild(Rendu.paragraphe(p));
      aLire.push([par, par.textContent]);
    }
    page.appendChild(corps);

    // Attention
    if (a.at) {
      const garde = h('aside', { class: 'attention' }, h('p', { class: 'attention-titre' }, icone('info'), 'À ne pas confondre, ou à ne pas croire'), Rendu.paragraphe(a.at));
      page.appendChild(garde);
      aLire.push([garde, 'À ne pas confondre, ou à ne pas croire. ' + garde.lastChild.textContent]);
    }

    // Repères
    if (a.re.length) {
      const sec = h('section', { class: 'section-reperes' });
      sec.appendChild(titre('Repères', Outils.pluriel(a.re.length, 'date'), 'h3'));
      const liste = sec.appendChild(reperes(a));
      page.appendChild(sec);
      Array.from(liste.children).forEach((li, i) => {
        aLire.push([li, (i ? '' : 'Repères. ') + li.firstChild.textContent + ' : ' + li.lastChild.textContent]);
      });
    }

    const f = fiche(a);
    if (f) page.appendChild(f);

    // Sur les cartes animées
    const cartes = Donnees.cartesDe(a.id);
    if (cartes.length) {
      const sec = h('section');
      sec.appendChild(titre('Sur les cartes', null, 'h3'));
      for (const { carte, etape } of cartes) {
        sec.appendChild(h('a', { class: 'carte carte-lien lien-carte', href: '#/cartes?c=' + carte.id + '&e=' + (etape + 1) },
          h('span', { class: 'pastille-section' }, icone('carte')),
          h('div', { class: 'corps' }, h('p', { class: 'carte-titre' }, carte.titre), h('p', { class: 'discret petit' }, carte.etapes[etape].titre)),
          icone('droite', 'fleche discret')));
      }
      page.appendChild(sec);
    }

    // Les textes du temps
    const textes = Donnees.textesDe(a.id);
    if (textes.length) {
      const sec = h('section');
      sec.appendChild(titre('Ils l’ont écrit', Outils.pluriel(textes.length, 'texte'), 'h3'));
      for (const t of textes.slice(0, 8)) sec.appendChild(VueTextes.carteTexte(t, { extrait: textes.length < 4 }));
      page.appendChild(sec);
    }

    // Voir aussi
    const voisins = a.vo.map((id) => Donnees.article(id)).filter(Boolean);
    if (voisins.length) {
      const sec = h('section');
      sec.appendChild(titre('Voir aussi', null, 'h3'));
      const ul = h('div', { class: 'voisins-articles' });
      for (const v of voisins) ul.appendChild(carteArticle(v, { sansDef: true }));
      sec.appendChild(ul);
      page.appendChild(sec);
    }

    // Pour aller plus loin
    if (a.li.length) {
      const sec = h('section');
      sec.appendChild(titre('Pour aller plus loin', 'sites extérieurs', 'h3'));
      const ul = h('ul', { class: 'liens-ext liste-nue' });
      for (const [source, libelle, adresse] of a.li) {
        ul.appendChild(h('li', null, h('a', { class: 'lien-ext', href: adresse, target: '_blank', rel: 'noopener noreferrer' },
          icone('externe'), h('span', { class: 'texte' }, h('span', { class: 'source' }, source), h('span', { class: 'libelle' }, libelle)))));
      }
      sec.appendChild(ul);
      page.appendChild(sec);
    }

    // Sources et crédits
    const pied = h('footer', { class: 'article-pied' });
    if (a.so) pied.appendChild(h('p', { class: 'sources' }, h('strong', null, 'Sources. '), a.so));
    if (a.im && a.im.length) {
      pied.appendChild(h('p', { class: 'credit' }, 'Images : Wikimedia Commons — ' + a.im.map((im) => Donnees.nu(im.cr) + ' (' + im.li + ')').join(' ; ') + '.'));
    }
    const cites = Donnees.citations(a.id);
    if (cites.length) {
      pied.appendChild(h('p', { class: 'petit discret cites' }, 'Cité par : ', cites.slice(0, 12).map((c, i) => [i ? ', ' : '', h('a', { class: 'renvoi', href: '#/a/' + c.id }, c.n)])));
    }
    pied.appendChild(h('div', { class: 'bas-fiche' },
      h('button', { type: 'button', class: 'bouton-discret', onclick: async () => {
        const url = Installer.ADRESSE + '#/a/' + a.id;
        if (racine.navigator.share) { try { await racine.navigator.share({ title: a.n + ' — 1870', text: a.dn, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
        Communs.toast((await Outils.copier(url)) ? 'Adresse copiée.' : url);
      } }, icone('partager'), 'Partager'),
      h('button', { type: 'button', class: 'bouton-discret', onclick: () => App.aller('#/a/' + Donnees.auHasard(a.c).id) }, icone('hasard'), 'Au hasard')));
    page.appendChild(pied);

    const ecoute = barreEcoute(aLire);
    if (ecoute) tete.appendChild(ecoute);

    zone.appendChild(page);
    return { titre: a.n, sous: cat.nom + (a.da ? ' · ' + a.da : ''), quitter: () => { if (racine.Voix) Voix.arreter(); } };
  }

  racine.VueArticle = { dessiner };

})(window);

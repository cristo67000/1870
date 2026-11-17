'use strict';
/*
 * Les textes : extraits de témoins, d'écrivains, d'historiens et documents du
 * temps. La liste se filtre par genre et se cherche ; chaque extrait renvoie à
 * l'ouvrage numérisé sur Gallica et aux articles qu'il éclaire.
 */
(function (racine) {

  const { h, icone } = Outils;
  const TEINTES = { poeme: '#6b4c9a', recit: '#8c2f39', temoignage: '#2f5fa3', analyse: '#4d6a5a', document: '#9c7c2b' };
  const SINGULIER = { poeme: 'Poème', recit: 'Récit', temoignage: 'Témoignage', analyse: 'Analyse', document: 'Document' };

  function debut(t, longueur) {
    const brut = Donnees.corpsNu(t);
    return brut.length > longueur ? brut.slice(0, brut.lastIndexOf(' ', longueur)) + '…' : brut;
  }

  function carteTexte(t, options) {
    const o = options || {};
    const corps = h('div', { class: 'corps' });
    corps.appendChild(h('div', { class: 'cadre', style: { color: TEINTES[t.g] } }, SINGULIER[t.g] + ' · ' + t.an));
    corps.appendChild(h('div', { class: 'nom' }, t.ti));
    corps.appendChild(h('div', { class: 'dates' }, t.au + (t.oe && t.oe !== t.ti ? ', ' : ''), t.oe && t.oe !== t.ti ? h('i', null, t.oe) : null));
    if (o.extrait) corps.appendChild(h('div', { class: 'def citation' }, '« ' + debut(t, 170) + ' »'));
    return h('a', { class: 'carte carte-lien carte-article carte-texte', href: '#/t/' + t.id, style: { '--teinte': TEINTES[t.g] } },
      h('span', { class: 'vignette-article vignette-vide vignette-texte', 'aria-hidden': 'true' }, icone(t.g === 'poeme' ? 'etoile' : 'livre')), corps, icone('droite', 'fleche discret'));
  }

  function dessinerListe(zone, params) {
    const page = h('div', { class: 'page' });
    let genre = params.g || '';
    let q = params.q || '';
    const champ = h('input', { type: 'search', placeholder: 'Chercher un auteur, un mot du texte…', 'aria-label': 'Chercher', autocomplete: 'off', value: q });
    page.appendChild(h('p', { class: 'discret intro-carte' }, 'Ceux qui ont vu, ceux qui ont écrit, ceux qui ont jugé. Tous ces textes sont dans le domaine public ; chacun renvoie au livre numérisé par la Bibliothèque nationale de France.'));
    page.appendChild(h('div', { class: 'champ-recherche' }, icone('recherche', 'discret'), champ));
    const filtres = h('div', { class: 'filtres', role: 'group', 'aria-label': 'Filtrer par genre' });
    const compte = h('p', { class: 'discret petit compte' });
    const liste = h('div', { class: 'liste-articles' });
    page.append(filtres, compte, liste);

    function maj() {
      filtres.textContent = '';
      filtres.appendChild(h('button', { type: 'button', class: 'filtre' + (genre ? '' : ' actif'), onclick: () => { genre = ''; maj(); } }, 'Tout'));
      for (const g of Donnees.genres) {
        if (!Donnees.textes.some((t) => t.g === g.id)) continue;
        filtres.appendChild(h('button', { type: 'button', class: 'filtre' + (genre === g.id ? ' actif' : ''), style: { '--teinte': TEINTES[g.id] },
          onclick: () => { genre = genre === g.id ? '' : g.id; maj(); } }, h('span', { class: 'point-cat' }), g.nom));
      }
      App.remplacer('#/textes' + (genre || q ? '?' + new URLSearchParams(Object.assign({}, genre ? { g: genre } : {}, q ? { q } : {})).toString() : ''));
      const mots = Outils.normaliser(q).split(' ').filter(Boolean);
      const choisis = Donnees.textes.filter((t) => (!genre || t.g === genre)
        && (!mots.length || mots.every((m) => Outils.normaliser(t.au + ' ' + t.ti + ' ' + (t.oe || '') + ' ' + Donnees.corpsNu(t)).includes(m))));
      choisis.sort((a, b) => (a.q || String(a.an)).localeCompare(b.q || String(b.an)) || a.au.localeCompare(b.au, 'fr'));
      compte.textContent = Outils.pluriel(choisis.length, 'texte') + (genre ? ' · ' + Donnees.genre(genre).nom : '') + ', dans l’ordre des événements';
      liste.textContent = '';
      for (const t of choisis) liste.appendChild(carteTexte(t, { extrait: true }));
      if (!choisis.length) liste.appendChild(h('p', { class: 'discret' }, 'Aucun texte ne répond à cette recherche.'));
    }
    let minuteur = 0;
    champ.addEventListener('input', () => { clearTimeout(minuteur); minuteur = setTimeout(() => { q = champ.value; maj(); }, 150); });
    maj();
    zone.appendChild(page);
    return { titre: 'Textes', sous: Outils.pluriel(Donnees.textes.length, 'extrait') + ' du temps' };
  }

  function dessinerTexte(zone, params) {
    const t = Donnees.texte(params.id);
    if (!t) {
      zone.appendChild(h('div', { class: 'page' }, h('p', null, 'Ce texte n’existe pas.'), h('a', { class: 'bouton-discret', href: '#/textes' }, 'Tous les textes')));
      return { titre: 'Textes' };
    }
    const page = h('article', { class: 'page article texte-page', style: { '--teinte': TEINTES[t.g] } });
    const tete = h('header', { class: 'article-tete' });
    tete.appendChild(h('a', { class: 'puce puce-claire', href: '#/textes?g=' + t.g, style: { '--teinte': TEINTES[t.g] } }, Donnees.genre(t.g).nom));
    tete.appendChild(h('h2', null, t.ti));
    tete.appendChild(h('p', { class: 'article-dates' }, t.au + (t.vie ? ' (' + t.vie + ')' : '')));
    tete.appendChild(h('p', { class: 'discret' }, t.oe && t.oe !== t.ti ? h('i', null, t.oe) : null, (t.oe && t.oe !== t.ti ? ', ' : '') + t.an, t.tr ? ' · traduction de ' + t.tr : ''));
    page.appendChild(tete);
    const intro = Rendu.paragraphe(t.in, 'texte-intro');
    page.appendChild(intro);

    const aLire = [];
    const corps = h('div', { class: t.v ? 'texte-corps texte-vers' : 'texte-corps texte-prose' });
    if (t.v) {
      let strophe = h('p', { class: 'strophe' });
      const fermer = () => { if (strophe.childNodes.length) { corps.appendChild(strophe); aLire.push([strophe, strophe.textContent]); } strophe = h('p', { class: 'strophe' }); };
      for (const vers of t.v) {
        if (vers === '') { fermer(); continue; }
        const ligne = h('span', { class: 'vers' });
        ligne.appendChild(Rendu.fragment(vers));
        strophe.append(ligne, document.createTextNode('\n'));
      }
      fermer();
    } else {
      for (const p of t.p) { const par = corps.appendChild(Rendu.paragraphe(p)); aLire.push([par, par.textContent]); }
    }
    page.appendChild(corps);

    // Écouter
    if (racine.Voix && Voix.possible) {
      let courant = null;
      const b = h('button', { type: 'button', class: 'bouton-discret' });
      const habiller = (etat) => { b.textContent = ''; b.append(icone(etat === 'lecture' ? 'pause' : etat === 'pause' ? 'lecture' : 'voix'), etat === 'lecture' ? 'Pause' : etat === 'pause' ? 'Reprendre' : 'Écouter'); };
      b.addEventListener('click', () => {
        if (Voix.etat === 'lecture') { Voix.pause(); return; }
        if (Voix.etat === 'pause') { Voix.reprendre(); return; }
        if (!Voix.voix().length) { Communs.toast('Aucune voix française n’est installée sur cet appareil.'); return; }
        Voix.lire(aLire.map((x) => x[1]), { surEtat: habiller,
          surMorceau: (i) => { if (courant) courant.classList.remove('lu'); courant = aLire[i][0]; courant.classList.add('lu'); },
          surFin: () => { if (courant) courant.classList.remove('lu'); courant = null; } });
      });
      habiller('arret');
      tete.appendChild(h('div', { class: 'ecoute' }, b));
    }

    // Le livre
    const sec = h('section');
    sec.appendChild(Communs.titre('Le livre', 'bibliothèques numériques', 'h3'));
    const ul = h('ul', { class: 'liens-ext liste-nue' });
    const lien = (source, libelle, adresse) => h('li', null, h('a', { class: 'lien-ext', href: adresse, target: '_blank', rel: 'noopener noreferrer' },
      icone('externe'), h('span', { class: 'texte' }, h('span', { class: 'source' }, source), h('span', { class: 'libelle' }, libelle))));
    if (t.ga) ul.appendChild(lien('Gallica (BnF)', t.ga[1], 'https://gallica.bnf.fr/ark:/12148/' + t.ga[0]));
    if (t.so) ul.appendChild(lien(t.so[0] + ' — le texte', t.so[1], t.so[2]));
    sec.appendChild(ul);
    page.appendChild(sec);

    const lies = t.po.map((id) => Donnees.article(id)).filter(Boolean);
    if (lies.length) {
      const s2 = h('section');
      s2.appendChild(Communs.titre('Pour comprendre', null, 'h3'));
      const liste = h('div', { class: 'voisins-articles' });
      for (const a of lies) liste.appendChild(Communs.carteArticle(a, { sansDef: true }));
      s2.appendChild(liste);
      page.appendChild(s2);
    }
    const memes = Donnees.textes.filter((x) => x.au === t.au && x.id !== t.id);
    if (memes.length) {
      const s3 = h('section');
      s3.appendChild(Communs.titre('Du même auteur', null, 'h3'));
      for (const x of memes) s3.appendChild(carteTexte(x));
      page.appendChild(s3);
    }
    zone.appendChild(page);
    return { titre: t.au, sous: t.ti, quitter: () => { if (racine.Voix) Voix.arreter(); } };
  }

  racine.VueTextes = { dessiner: dessinerListe, carteTexte };
  racine.VueTexte = { dessiner: dessinerTexte };

})(window);

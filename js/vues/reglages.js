'use strict';
/* Réglages, installation, à propos. */
(function (racine) {

  const { h, icone } = Outils;

  function segments(valeurs, actuel, surChoix) {
    const bloc = h('div', { class: 'segments' });
    for (const [v, libelle] of valeurs) {
      bloc.appendChild(h('button', { type: 'button', class: v === actuel ? 'actif' : '', onclick: () => {
        surChoix(v);
        bloc.querySelectorAll('button').forEach((b, i) => b.classList.toggle('actif', valeurs[i][0] === v));
      } }, libelle));
    }
    return bloc;
  }

  /* La lecture à voix haute : la voix (un homme, en français de France, sauf
   * autre choix), le débit, un essai. */
  function carteVoix() {
    const carte = h('div', { class: 'carte' });
    carte.appendChild(h('p', { class: 'carte-titre' }, 'Lecture à voix haute'));
    const etat = h('div', { class: 'explication' });
    const liste = h('select', { class: 'choix-voix', 'aria-label': 'Voix', onchange: () => { Reglages.ecrire('voix', liste.value); montrer(); } });
    function montrer() {
      const voix = Voix.voix();
      const c = Voix.choisie();
      liste.textContent = '';
      liste.appendChild(h('option', { value: '' }, 'Automatique (voix d’homme)'));
      for (const v of voix) {
        liste.appendChild(h('option', { value: v.voiceURI }, v.name.replace(/\s*-\s*French \(France\)/i, '') + (Voix.estMasculine(v) ? ' · homme' : '') + (Voix.enLigne(v) ? ' · en ligne' : '')));
      }
      liste.value = c.choix ? c.voix.voiceURI : '';
      liste.disabled = !voix.length;
      if (!c.voix) etat.textContent = 'Aucune voix française n’est installée sur cet appareil : ajoutez-en une dans les réglages de synthèse vocale du système.';
      else if (c.choix) etat.textContent = 'Voix choisie : ' + c.voix.name + '.';
      else if (c.masculine) etat.textContent = 'Voix d’homme, en français de France : ' + c.voix.name + '.';
      else etat.textContent = 'Aucune voix d’homme reconnue sur cet appareil : ' + c.voix.name + ' est lue d’un ton plus grave. Si la liste contient une voix masculine, choisissez-la.';
    }
    Voix.surVoix(montrer);
    montrer();
    carte.appendChild(h('div', { class: 'option' }, h('div', { style: { flex: 1 } }, h('div', { class: 'libelle' }, 'Voix'), etat), liste));
    carte.appendChild(h('div', { class: 'option' }, h('div', null, h('div', { class: 'libelle' }, 'Débit'), h('div', { class: 'explication' }, 'La vitesse de la lecture.')),
      segments([['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']], Reglages.lire('debit', 'normal'), (v) => Reglages.ecrire('debit', v))));
    carte.appendChild(h('div', { style: { marginTop: '8px' } },
      h('button', { type: 'button', class: 'bouton-discret', onclick: () => { if (!Voix.essayer()) Communs.toast('La lecture n’a pas pu démarrer.'); } }, icone('voix'), 'Essayer')));
    return carte;
  }

  function dessiner(zone) {
    const page = h('div', { class: 'page' });

    const carte = h('div', { class: 'carte' });
    carte.appendChild(h('p', { class: 'carte-titre' }, 'Apparence'));
    carte.appendChild(h('div', { class: 'option' }, h('div', null, h('div', { class: 'libelle' }, 'Thème'), h('div', { class: 'explication' }, 'Clair, sombre, ou comme le système.')),
      segments([['auto', 'Auto'], ['clair', 'Clair'], ['sombre', 'Sombre']], Reglages.lire('theme', 'auto'), (v) => { Reglages.ecrire('theme', v); Reglages.appliquerTheme(); })));
    carte.appendChild(h('div', { class: 'option' }, h('div', null, h('div', { class: 'libelle' }, 'Taille du texte'), h('div', { class: 'explication' }, 'Pour les articles.')),
      segments([['normal', 'Normale'], ['grand', 'Grande'], ['tres-grand', 'Très grande']], Reglages.lire('taille', 'normal'), (v) => { Reglages.ecrire('taille', v); Reglages.appliquerTheme(); })));
    page.appendChild(carte);

    if (Voix.possible) page.appendChild(carteVoix());

    const img = h('div', { class: 'carte' });
    img.appendChild(h('p', { class: 'carte-titre' }, 'Images hors ligne'));
    const etat = h('div', { class: 'explication' });
    const jauge = h('div', { class: 'jauge' }, h('div'));
    const bouton = h('button', { type: 'button', class: 'bouton-discret', onclick: () => Images.completer(true) }, icone('telecharger'), 'Tout télécharger');
    function montrer(e) {
      if (!e.possible) { etat.textContent = 'Ce navigateur ne garde pas d’images hors ligne.'; bouton.hidden = true; return; }
      etat.textContent = e.enCours ? 'Téléchargement : ' + e.fait + ' sur ' + e.total + '…' : (e.restantes ? e.fait + ' images sur ' + e.total + ' sont gardées hors ligne.' : 'Les ' + e.total + ' images sont gardées hors ligne.');
      jauge.firstChild.style.width = (e.total ? Math.round(100 * e.fait / e.total) : 0) + '%';
      bouton.hidden = e.enCours || !e.restantes;
    }
    Images.surChangement(montrer);
    montrer(Images.etat());
    img.appendChild(h('div', { class: 'option' }, h('div', { style: { flex: 1 } }, h('div', { class: 'libelle' }, 'Les images se rangent en arrière-plan'), etat, jauge)));
    img.appendChild(h('div', { class: 'option' }, h('div', null, h('div', { class: 'libelle' }, 'En arrière-plan'), h('div', { class: 'explication' }, 'Sans Wi-Fi, les images pèsent quelques dizaines de mégaoctets.')),
      segments([['auto', 'Oui'], ['non', 'Non']], Reglages.lire('imagesHorsLigne', 'auto'), (v) => { Reglages.ecrire('imagesHorsLigne', v); if (v === 'auto') Images.completer(); else Images.arreter(); })));
    img.appendChild(h('div', { style: { marginTop: '8px' } }, bouton));
    page.appendChild(img);

    const inst = h('div', { class: 'carte' });
    inst.appendChild(h('p', { class: 'carte-titre' }, 'Installer 1870'));
    const zoneInst = h('div');
    Installer.dessinerInstallation(inst, zoneInst);
    inst.appendChild(zoneInst);
    page.appendChild(inst);

    const part = h('div', { class: 'carte' });
    part.appendChild(h('p', { class: 'carte-titre' }, 'Partager'));
    const zonePart = h('div');
    Installer.dessinerPartage(zonePart);
    part.appendChild(zonePart);
    page.appendChild(part);

    const ver = h('div', { class: 'carte' });
    ver.appendChild(h('p', { class: 'carte-titre' }, 'Version'));
    const texteVer = h('div', { class: 'explication' }, 'Version ' + (MiseAJour.version || document.querySelector('meta[name="application-version"]').content) + ' · données du ' + Donnees.version + ' · ' + Outils.pluriel(Donnees.articles.length, 'article') + '.');
    const bVer = h('button', { type: 'button', class: 'bouton-discret', onclick: async () => {
      bVer.disabled = true;
      const r = await MiseAJour.verifier(true);
      const messages = { prete: 'Une mise à jour est prête : touchez « Mettre à jour ».', 'en-cours': 'Une nouvelle version arrive…', 'a-jour': 'Vous avez la dernière version.', echec: 'Impossible de vérifier (pas de réseau ?).', 'sans-service-worker': 'Pas de service worker ici.' };
      Communs.toast(messages[r] || r);
      bVer.disabled = false;
    } }, 'Vérifier les mises à jour');
    ver.appendChild(h('div', { class: 'option' }, h('div', null, h('div', { class: 'libelle' }, '1870'), texteVer), bVer));
    page.appendChild(ver);

    const apropos = h('div', { class: 'carte' });
    apropos.appendChild(h('p', { class: 'carte-titre' }, 'À propos'));
    apropos.appendChild(h('p', null, '1870 raconte la guerre franco-allemande de 1870-1871, de la dépêche d’Ems au traité de Francfort : des articles sur les événements, les personnages, les batailles, les sièges, les forces en présence, les armes, la mémoire ; des cartes animées de la campagne et des grandes batailles ; une frise jour par jour ; des extraits de témoins, d’écrivains et d’historiens du temps.'));
    apropos.appendChild(h('p', null, h('strong', null, 'Méthode.'), ' Les articles sont originaux. Ils ont été écrits d’après les travaux des historiens — François Roth, Stéphane Audoin-Rouzeau, Pierre Milza, Michael Howard, Geoffrey Wawro, Nicolas Bourguinat et Gilles Vogt — puis vérifiés date par date et chiffre par chiffre dans les encyclopédies en français, en allemand et en anglais et dans les ouvrages accessibles en ligne. Chaque article dit ses sources ; quand les chiffres ou les récits divergent, il le dit aussi. Les mots célèbres et les légendes sont donnés pour ce qu’ils sont.'));
    apropos.appendChild(h('p', null, h('strong', null, 'Textes, images, cartes.'), ' Les extraits sont du domaine public, copiés de Wikisource ou d’Internet Archive ; chacun renvoie à l’ouvrage numérisé par la Bibliothèque nationale de France sur Gallica. Les images viennent de Wikimedia Commons (domaine public ou licence libre, créditée sous chaque image). Le fond de la carte de campagne vient de Natural Earth (domaine public) ; celui des champs de bataille, d’OpenStreetMap (© les contributeurs d’OpenStreetMap, licence ODbL) : cours d’eau, bois et villages y sont ceux d’aujourd’hui.'));
    apropos.appendChild(h('p', null, h('strong', null, 'Limites.'), ' Sur les cartes animées, les positions des armées sont schématiques : elles montrent le mouvement d’ensemble, pas l’emplacement de chaque régiment. Les effectifs et les pertes sont des ordres de grandeur. Une erreur ? Écrivez à ', h('a', { class: 'renvoi', href: 'mailto:cristo67apps@gmail.com' }, 'cristo67apps@gmail.com'), '.'));
    apropos.appendChild(h('p', null, h('strong', null, 'Vie privée.'), ' L’application fonctionne hors ligne, sans compte, sans publicité ni mesure d’audience ; elle ne contacte aucun serveur en dehors de ses propres fichiers. La lecture à voix haute se sert des voix de l’appareil ; une voix marquée « en ligne », si elle est la seule voix d’homme ou si vous la choisissez, envoie le texte lu à l’éditeur du navigateur. ', h('a', { class: 'renvoi', href: 'confidentialite.html' }, 'Politique de confidentialité'), '.'));
    page.appendChild(apropos);

    zone.appendChild(page);
    return { titre: 'Réglages', sous: 'apparence, hors ligne, à propos', quitter: () => Voix.arreter() };
  }

  racine.VueReglages = { dessiner };

})(window);

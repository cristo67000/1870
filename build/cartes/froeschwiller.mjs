/*
 * Frœschwiller-Wœrth, le 6 août 1870, heure par heure.
 *
 * Positions : 'Village' (du fond OpenStreetMap ou de lieux.txt), ['Village', km vers l'est,
 * km vers le nord], ou null. Les heures et les mouvements suivent l'article
 * bataille-de-froeschwiller-woerth et ses sources ; les dispositions françaises du
 * matin, celles que donne Wikipédia (« au soir du 5 août »). Un schéma, pas un relevé.
 */
const TOUT = [7.635, 48.893, 7.815, 48.982];
const SUD = [7.675, 48.893, 7.800, 48.952];
const CENTRE = [7.650, 48.905, 7.790, 48.965];

export default {
  id: 'froeschwiller',
  ordre: 2,
  court: 'Frœschwiller',
  titre: 'Frœschwiller-Wœrth, 6 août 1870',
  sous: 'La bataille dite de Reichshoffen, de l’aube au soir',
  fond: 'froeschwiller',
  article: 'bataille-de-froeschwiller-woerth',
  lieux: {
    'Grosserwald': ['Frœschwiller', -1.8, -0.4],
    'Calvaire': ['Wœrth', -0.9, -0.1],
    'Niederwald': ['Elsasshausen', 0.7, -1.4],
  },
  unites: {
    D1: { camp: 'fr', nom: '1re division (Ducrot)', court: 'Ducrot' },
    D3: { camp: 'fr', nom: '3e division (Raoult)', court: 'Raoult' },
    DC: { camp: 'fr', nom: 'Division Conseil-Dumesnil (7e corps)', court: 'Conseil-D.' },
    D4: { camp: 'fr', nom: '4e division (Lartigue)', court: 'Lartigue' },
    D2: { camp: 'fr', nom: '2e division (Pellé, ex-Douay)', court: 'Pellé' },
    CB: { camp: 'fr', nom: 'Division de cuirassiers Bonnemains', court: 'Bonnemains' },
    CM: { camp: 'fr', nom: 'Brigade de cuirassiers Michel', court: 'Michel' },
    V: { camp: 'de', nom: 'Ve corps prussien (Kirchbach)', court: 'Ve' },
    XI: { camp: 'de', nom: 'XIe corps prussien (Bose)', court: 'XIe' },
    B2: { camp: 'de', nom: 'IIe corps bavarois (Hartmann)', court: 'IIe bav.' },
    B1: { camp: 'de', nom: 'Ier corps bavarois (von der Tann)', court: 'Ier bav.' },
    WU: { camp: 'de', nom: 'Division wurtembergeoise (Obernitz)', court: 'Wurt.' },
  },
  etapes: [
    {
      date: '1870-08-06', quand: '6 août 1870, 5 h 30', titre: 'Sur les hauteurs, derrière la Sauer',
      texte: ['[[mac-mahon|Mac-Mahon]] a rangé le 1er corps et la division Conseil-Dumesnil, arrivée du 7e corps, sur les hauteurs qui dominent la Sauer, de Nehwiller à Morsbronn ; la 2e division, éprouvée à Wissembourg, reste en réserve dans le Grosserwald. [[ducrot|Ducrot]] et Raoult conseillent la retraite. En face, la IIIe armée campe à quelques kilomètres : le [[kronprinz-frederic-guillaume|Kronprinz]] ne compte pas attaquer avant le lendemain.'],
      vue: TOUT,
      pos: {
        D1: ['Frœschwiller', -0.5, 1.0], D3: ['Calvaire', -0.6, 0.5], DC: ['Calvaire', -0.4, -0.9], D4: ['Niederwald', 0.2, -1.0],
        D2: 'Grosserwald', CB: ['Elsasshausen', -1.3, -0.2], CM: ['Morsbronn-les-Bains', -1.2, 1.0],
        V: ['Gœrsdorf', 0.6, -1.0], XI: ['Gunstett', 1.2, 0.2], B2: ['Langensoultzbach', 0.6, 1.2], B1: ['Preuschdorf', 1.5, 0.6], WU: ['Gunstett', 2.5, -2.5],
      },
      articles: ['bataille-de-froeschwiller-woerth', 'mac-mahon', 'armee-d-afrique'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, 7 h', titre: 'Un combat d’avant-postes à Wœrth',
      texte: ['Une brigade du Ve corps prussien tâte les passages de la Sauer à Wœrth. Le canon attire les Bavarois au nord, contre la division Ducrot, et le XIe corps au sud, vers Gunstett. Personne ne l’a voulu : une bataille commence.'],
      vue: TOUT,
      pos: { V: ['Wœrth', 0.7, 0.1], B2: ['Langensoultzbach', -0.4, -0.6], XI: ['Gunstett', 0.3, 0] },
      marques: [{ t: 'bataille', lieu: 'Wœrth', nom: 'Wœrth', a: 'bataille-de-froeschwiller-woerth' }],
      articles: ['bataille-de-froeschwiller-woerth'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, vers 10 h 30', titre: 'Le Ve corps engagé, et repoussé',
      texte: ['Kirchbach jette tout le Ve corps sur les pentes, malgré l’ordre du Kronprinz d’éviter un engagement général. Ses assauts sont brisés par le feu des chassepots ; au nord, les Bavarois butent sur Ducrot. Mais l’artillerie allemande, plus nombreuse et plus précise, écrase les batteries françaises.'],
      vue: CENTRE,
      pos: { V: ['Wœrth', -0.2, 0], B2: ['Frœschwiller', 0.2, 2.0], XI: ['Gunstett', -0.4, 0.1] },
      articles: ['fusil-chassepot', 'canon-krupp', 'tactique-en-1870'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, 13 h', titre: 'Le Kronprinz prend la bataille en main',
      texte: ['Arrivé sur le terrain, le Kronprinz décide de livrer bataille avec toutes ses forces : le Ve corps tiendra le centre, le XIe tournera la droite française par Morsbronn, les Bavarois du Ier corps entrent en ligne au nord de Wœrth. Les Wurtembergeois, venus de Gunstett, marchent vers l’ouest.'],
      vue: CENTRE,
      pos: { XI: ['Morsbronn-les-Bains', 0.5, 0.2], B1: ['Gœrsdorf', -0.7, 0.5], WU: ['Gunstett', -0.2, -1.2] },
      articles: ['kronprinz-frederic-guillaume', 'blumenthal'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, vers 13 h 30', titre: 'Les cuirassiers de Michel dans Morsbronn',
      texte: ['Pour dégager la division Lartigue, menacée d’être tournée, la brigade Michel — les 8e et 9e cuirassiers et des lanciers du 6e — charge sur un terrain coupé de houblonnières et de clôtures. Elle s’engouffre dans Morsbronn, que l’infanterie prussienne tient déjà, et y est détruite : c’est la première des « charges de Reichshoffen ».'],
      vue: SUD,
      pos: { CM: ['Morsbronn-les-Bains', -0.2, 0.2], XI: ['Morsbronn-les-Bains', 0.2, 0.5] },
      marques: [{ t: 'bataille', lieu: ['Morsbronn-les-Bains', 0, 0.1], nom: 'Morsbronn', a: 'charges-de-reichshoffen' }],
      articles: ['charges-de-reichshoffen', 'cavalerie-en-1870'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, vers 15 h', titre: 'Le Niederwald et Elsasshausen tombent',
      texte: ['Le XIe corps, renforcé par une brigade wurtembergeoise, enlève le Niederwald puis Elsasshausen. Les quatre régiments de la division Bonnemains chargent à leur tour, sur les pentes, sans atteindre l’ennemi ; les turcos contre-attaquent à la baïonnette et reprennent un moment le terrain perdu. La droite française se défait.'],
      vue: CENTRE,
      pos: {
        CM: null, XI: ['Elsasshausen', 0.6, -0.4], WU: ['Niederwald', -0.6, -0.2], V: ['Calvaire', -0.3, 0.1], B1: ['Wœrth', -0.4, 1.4],
        D4: ['Elsasshausen', -0.9, 0.4], DC: ['Frœschwiller', 0.3, -0.7], CB: ['Elsasshausen', -0.4, 0.2], D3: ['Frœschwiller', 0.6, 0.1],
      },
      marques: [{ t: 'bataille', lieu: 'Elsasshausen', nom: 'Elsasshausen', a: 'charges-de-reichshoffen' }],
      articles: ['charges-de-reichshoffen', 'armee-d-afrique'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, vers 17 h', titre: 'Frœschwiller est pris',
      texte: ['Attaqué de trois côtés, le village tombe après un combat de rue. Mac-Mahon a ordonné la retraite ; la division Ducrot et les débris de la réserve la couvrent, pendant que l’armée reflue en désordre vers Reichshoffen et Niederbronn.'],
      vue: CENTRE,
      pos: {
        V: ['Frœschwiller', 0.6, -0.1], XI: ['Frœschwiller', -0.1, -0.7], B1: ['Frœschwiller', 0.4, 0.8], B2: ['Frœschwiller', -0.4, 1.3], WU: ['Elsasshausen', -1.3, -0.4],
        D1: ['Frœschwiller', -1.6, 0.9], D2: ['Grosserwald', -0.6, 0.3], D3: ['Reichshoffen', 1.4, 0.4], DC: ['Reichshoffen', 0.8, -0.3], D4: ['Gundershoffen', 1.0, 1.0], CB: ['Reichshoffen', 0.2, 0.1],
      },
      marques: [{ t: 'bataille', lieu: 'Frœschwiller', nom: 'Frœschwiller', camp: 'de', a: 'bataille-de-froeschwiller-woerth' }],
      articles: ['bataille-de-froeschwiller-woerth', 'ducrot'],
    },
    {
      date: '1870-08-06', quand: '6 août 1870, soir', titre: 'L’Alsace est ouverte',
      texte: ['Par Niederbronn et les cols des Vosges, le 1er corps gagne Saverne, puis Lunéville. Il a perdu environ 15 000 hommes tués, blessés ou prisonniers, contre un peu plus de 10 000 aux Allemands. Le même jour, en Lorraine, Frossard est battu à [[bataille-de-spicheren|Spicheren]] : Strasbourg est désormais seule.'],
      vue: TOUT,
      pos: {
        D1: ['Niederbronn-les-Bains', 0.3, -0.2], D2: ['Niederbronn-les-Bains', -0.6, 0.3], D3: ['Niederbronn-les-Bains', -0.4, -0.8], DC: ['Reichshoffen', -0.8, 0.3], D4: ['Reichshoffen', -1.6, -0.4], CB: ['Niederbronn-les-Bains', -1.2, -0.3],
        WU: ['Reichshoffen', 1.0, -0.6], XI: ['Elsasshausen', -0.8, -0.2], V: ['Frœschwiller', 0.2, 0.1], B1: ['Frœschwiller', -0.6, 0.6], B2: ['Nehwiller', 0.2, 0.6],
      },
      articles: ['bataille-de-froeschwiller-woerth', 'siege-de-strasbourg', 'sur-les-champs-de-bataille-d-alsace'],
    },
  ],
};

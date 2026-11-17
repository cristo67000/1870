/*
 * Le siège de Strasbourg, du 13 août au 28 septembre 1870.
 * Les dates, les lieux et les chiffres suivent l'article siege-de-strasbourg.
 * Porte de Pierre : à l'actuelle place de Haguenau ; citadelle : l'actuel parc
 * de la Citadelle (OpenStreetMap). Un schéma, pas un relevé.
 */
const VILLE = [7.700, 48.556, 7.828, 48.612];
const PRES = [7.715, 48.568, 7.790, 48.603];

export default {
  id: 'strasbourg',
  ordre: 5,
  court: 'Strasbourg',
  titre: 'Le siège de Strasbourg, 13 août – 28 septembre 1870',
  sous: 'Quarante-six jours : le blocus, le bombardement, la brèche',
  fond: 'strasbourg',
  article: 'siege-de-strasbourg',
  lieux: {
    'Porte de Pierre': [48.5912, 7.7429],
    'Citadelle': [48.5765, 7.7765],
    'Cathédrale': [48.5817, 7.7506],
    'Temple-Neuf': [48.5833, 7.7484],
    'Aubette': [48.5839, 7.7457],
    'Koenigshoffen': [48.5789, 7.7133],
  },
  unites: {
    G: { camp: 'fr', nom: 'La garnison du général Uhrich (17 000 hommes)', court: 'Uhrich' },
    W: { camp: 'de', nom: 'Corps de siège du général von Werder', court: 'Werder' },
    K: { camp: 'de', nom: 'Batteries badoises de Kehl', court: 'Kehl' },
  },
  etapes: [
    {
      date: '1870-08-13', quand: '12 – 13 août 1870', titre: 'Strasbourg investie',
      texte: ['Six jours après Frœschwiller, la division badoise coupe la voie ferrée et le télégraphe, puis investit la place. Strasbourg, 84 000 habitants, n’a pas de forts détachés ; le général [[general-uhrich|Uhrich]] réunit quelque 17 000 hommes de valeur très inégale. [[august-von-werder|Werder]] prend le commandement du siège.'],
      vue: VILLE,
      pos: { G: ['Strasbourg', 0, -0.6], W: ['Koenigshoffen', -0.8, 0.8], K: ['Kehl', 0.4, 0.4] },
      marques: [{ t: 'siege', lieu: 'Strasbourg', nom: 'Strasbourg', a: 'siege-de-strasbourg' }],
      articles: ['siege-de-strasbourg', 'general-uhrich', 'august-von-werder'],
    },
    {
      date: '1870-08-24', quand: 'Nuit du 24 au 25 août 1870', titre: 'Le Temple-Neuf et l’Aubette brûlent',
      texte: ['Pour forcer la population à faire pression sur le gouverneur, Werder fait bombarder la ville elle-même. Dans la nuit du 24 au 25 août, le Temple-Neuf brûle avec les bibliothèques de la ville et du séminaire protestant : plus de 300 000 volumes, dont l’*Hortus deliciarum*. La même nuit, l’Aubette et son musée de peinture flambent sur la place Kléber.'],
      vue: PRES,
      pos: { W: ['Koenigshoffen', 0.2, 1.4] },
      marques: [{ t: 'feu', lieu: 'Temple-Neuf', nom: 'Temple-Neuf', a: 'siege-de-strasbourg' }, { t: 'feu', lieu: 'Aubette', nom: 'Aubette', a: 'siege-de-strasbourg' }],
      articles: ['siege-de-strasbourg', 'artillerie-de-siege'],
    },
    {
      date: '1870-08-25', quand: 'Nuit du 25 au 26 août 1870', titre: 'Le toit de la cathédrale',
      texte: ['La toiture de la cathédrale prend feu ; les voûtes de pierre tiennent. Les faubourgs de Pierre, de Saverne et National sont presque rasés, les habitants vivent dans les caves. La ville ne cède pas : le 26 août, Werder revient au siège en règle.'],
      vue: PRES,
      marques: [{ t: 'feu', lieu: 'Cathédrale', nom: 'Cathédrale', a: 'siege-de-strasbourg' }],
      articles: ['siege-de-strasbourg'],
    },
    {
      date: '1870-08-30', quand: 'Nuit du 29 au 30 août 1870', titre: 'La première parallèle',
      texte: ['L’attaque vise le front nord-ouest, autour de la porte de Pierre : les bastions 11 et 12 et les lunettes 52 et 53. La première parallèle est ouverte dans la nuit. Les canons rayés réduisent au silence l’artillerie de la place, faite de pièces lisses et anciennes ; de l’autre côté du Rhin, les batteries de Kehl écrasent la citadelle.'],
      vue: PRES,
      pos: { W: ['Porte de Pierre', -1.1, 0.9] },
      leve: ['Temple-Neuf', 'Aubette', 'Cathédrale'],
      marques: [{ t: 'bataille', lieu: 'Porte de Pierre', nom: 'Porte de Pierre', a: 'siege-de-strasbourg' }, { t: 'feu', lieu: 'Citadelle', nom: 'Citadelle', a: 'siege-de-strasbourg' }],
      articles: ['siege-de-strasbourg', 'artillerie-de-siege', 'places-fortes-en-1870'],
    },
    {
      date: '1870-09-11', titre: 'La délégation suisse',
      texte: ['Des délégués suisses entrent dans la ville pour en faire sortir des femmes, des enfants et des vieillards ; ils apportent la nouvelle de Sedan. [[emile-kuss|Émile Küss]] devient maire. Le 20 septembre, le préfet Valentin, nommé par le gouvernement de la Défense nationale, franchit les lignes et les fossés à la nage pour gagner son poste.'],
      vue: VILLE,
      leve: ['Citadelle'],
      articles: ['emile-kuss', 'siege-de-strasbourg'],
    },
    {
      date: '1870-09-26', quand: '19 – 26 septembre 1870', titre: 'Les lunettes, puis la brèche',
      texte: ['Entre le 19 et le 22 septembre, les lunettes 53 et 52 sont prises ; le 26, deux brèches sont ouvertes dans le rempart. Le 27, à 14 h, les officiers du génie préviennent Uhrich que la brèche du bastion 11 est praticable : l’assaut peut venir d’une heure à l’autre.'],
      vue: PRES,
      pos: { W: ['Porte de Pierre', -0.4, 0.4] },
      marques: [{ t: 'bataille', lieu: 'Porte de Pierre', nom: 'La brèche', camp: 'de', a: 'siege-de-strasbourg' }],
      articles: ['siege-de-strasbourg', 'general-uhrich'],
    },
    {
      date: '1870-09-28', quand: '27 – 28 septembre 1870', titre: 'Le drapeau blanc sur la cathédrale',
      texte: ['Vers 17 h, le drapeau blanc monte sur la cathédrale. La capitulation est signée le 28 à 2 h du matin, dans un wagon, à Koenigshoffen : 451 officiers et 17 111 hommes partent prisonniers pour Rastatt. Le 30 septembre, Werder fait son entrée. Le 10 mai 1871, le traité de Francfort donne la ville à l’Empire allemand.'],
      vue: VILLE,
      pos: { G: null, W: ['Strasbourg', -0.6, 0.3] },
      leve: ['Porte de Pierre', 'La brèche', 'Strasbourg'],
      marques: [{ t: 'bataille', lieu: 'Koenigshoffen', nom: 'Capitulation à Koenigshoffen', camp: 'de', a: 'siege-de-strasbourg' }, { t: 'ville', lieu: 'Strasbourg', nom: 'Strasbourg prise', camp: 'de', a: 'alsace-lorraine' }],
      articles: ['siege-de-strasbourg', 'traite-de-francfort', 'alsace-lorraine'],
    },
  ],
};

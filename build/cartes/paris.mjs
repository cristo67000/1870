/*
 * Le siège de Paris, du 19 septembre 1870 au 28 janvier 1871.
 *
 * Les forts sont à leur place (OpenStreetMap ; seuls ceux de 1870, pas la seconde
 * ceinture bâtie après la guerre, ni la Double-Couronne du Nord, non localisée).
 * Les secteurs des corps allemands sont donnés au gros de leurs troupes ; les dates
 * et les chiffres suivent les articles siege-de-paris, bombardement-de-paris et
 * ceux des batailles. Un schéma, pas un relevé.
 */
const TOUT = [2.030, 48.705, 2.630, 49.025];
const EST = [2.330, 48.770, 2.600, 48.935];
const NORD = [2.280, 48.860, 2.560, 49.010];
const OUEST = [2.060, 48.790, 2.380, 48.930];
const SUD = [2.180, 48.740, 2.480, 48.890];

const FORTS = [
  ['Mont-Valérien', 48.8734, 2.2127], ['Fort d’Issy', 48.8165, 2.2671], ['Fort de Vanves', 48.8119, 2.2891],
  ['Fort de Montrouge', 48.8077, 2.3217], ['Fort de Bicêtre', 48.8051, 2.3544], ['Fort d’Ivry', 48.8023, 2.3902],
  ['Fort de Charenton', 48.8092, 2.4290], ['Vincennes', 48.8428, 2.4358], ['Fort de Nogent', 48.8440, 2.4792],
  ['Fort de Rosny', 48.8710, 2.4701], ['Fort de Noisy', 48.8832, 2.4485], ['Fort de Romainville', 48.8851, 2.4227],
  ['Fort d’Aubervilliers', 48.9150, 2.4035], ['Fort de l’Est', 48.9302, 2.3722], ['Fort de la Briche', 48.9454, 2.3410],
];
const lieux = { 'Plateau d’Avron': [48.8728, 2.5124], 'Rive gauche': [48.8440, 2.3380], 'Buzenval': ['Garches', -0.5, 0.9], 'Montretout': ['Saint-Cloud', -0.9, 0.5] };
for (const [nom, lat, lon] of FORTS) lieux[nom] = [lat, lon];
const forts = (camp) => FORTS.map(([nom]) => ({ t: 'fort', lieu: nom, nom, camp }));

export default {
  id: 'paris',
  ordre: 6,
  court: 'Paris',
  titre: 'Le siège de Paris, 1870 – 1871',
  sous: 'L’investissement, les sorties, le bombardement, la capitulation',
  fond: 'paris',
  article: 'siege-de-paris',
  lieux,
  unites: {
    P: { camp: 'fr', nom: 'Les défenseurs de Paris (Trochu) : armée, mobiles, garde nationale', court: 'Paris' },
    D: { camp: 'fr', nom: 'Deuxième armée de Paris (Ducrot)', court: 'Ducrot' },
    IV: { camp: 'de', nom: 'IVe corps (armée de la Meuse)', court: 'IVe' },
    GA: { camp: 'de', nom: 'Garde prussienne (armée de la Meuse)', court: 'Garde' },
    XII: { camp: 'de', nom: 'XIIe corps saxon (armée de la Meuse)', court: 'XIIe' },
    WU: { camp: 'de', nom: 'Division wurtembergeoise (IIIe armée)', court: 'Wurt.' },
    VI: { camp: 'de', nom: 'VIe corps (IIIe armée)', court: 'VIe' },
    B2: { camp: 'de', nom: 'IIe corps bavarois (IIIe armée)', court: 'IIe bav.' },
    V: { camp: 'de', nom: 'Ve corps (IIIe armée)', court: 'Ve' },
  },
  etapes: [
    {
      date: '1870-09-19', titre: 'Le cercle se ferme',
      texte: ['L’armée de la Meuse tient le nord et l’est, la IIIe armée le sud et l’ouest, et occupe Versailles, où le roi et le grand quartier général s’installeront au début d’octobre. Le même jour, [[ducrot|Ducrot]] échoue à garder les hauteurs de Châtillon, d’où les Bavarois verront Paris. Derrière l’enceinte et ses forts, deux millions d’habitants et quelque 400 000 hommes armés, dont la plupart n’ont jamais combattu.'],
      vue: TOUT,
      pos: {
        P: ['Paris', 0, 0.4], IV: ['Montmorency', -2.2, -1.6], GA: ['Gonesse', -1.6, -1.2], XII: ['Montfermeil', -0.6, 0], WU: ['Chennevières-sur-Marne', 0.6, -1.2],
        VI: ['Thiais', 0.2, -0.4], B2: ['Le Plessis-Robinson', 0, -0.4], V: ['Versailles', 2.6, 2.4],
      },
      marques: forts('fr').concat([{ t: 'siege', lieu: 'Paris', nom: 'Paris', a: 'siege-de-paris' }, { t: 'bataille', lieu: 'Châtillon', nom: 'Châtillon', camp: 'de', a: 'combat-de-chatillon' }]),
      articles: ['siege-de-paris', 'combat-de-chatillon', 'fortifications-de-paris', 'armees-allemandes-en-campagne'],
    },
    {
      date: '1870-10-07', quand: '30 septembre – 21 octobre 1870', titre: 'Les premières sorties',
      texte: ['À Chevilly le 30 septembre, à Bagneux et Châtillon le 13 octobre, à la Malmaison le 21, les sorties sont des reconnaissances qu’on rappelle dès qu’elles réussissent : elles montrent que la ligne allemande tient. Le 7 octobre, [[gambetta|Gambetta]] quitte Paris en ballon, de Montmartre, pour organiser la guerre en province.'],
      vue: SUD,
      marques: [
        { t: 'bataille', lieu: 'Chevilly-Larue', nom: 'Chevilly', a: 'siege-de-paris' },
        { t: 'bataille', lieu: 'Bagneux', nom: 'Bagneux', a: 'siege-de-paris' },
        { t: 'bataille', lieu: ['Rueil-Malmaison', 0.3, 0.2], nom: 'La Malmaison', a: 'siege-de-paris' },
      ],
      articles: ['siege-de-paris', 'ballons-du-siege', 'gambetta'],
    },
    {
      date: '1870-10-28', quand: '28 – 30 octobre 1870', titre: 'Le Bourget pris et perdu',
      texte: ['Des francs-tireurs enlèvent Le Bourget par surprise le 28 octobre ; la Garde prussienne le reprend le 30. Le lendemain, la perte du Bourget, la capitulation de Metz et des pourparlers d’armistice jettent la foule sur l’Hôtel de Ville : c’est la [[journee-du-31-octobre|journée du 31 octobre]].'],
      vue: NORD,
      pos: { GA: ['Le Bourget', 0.8, 1.0] },
      leve: ['Chevilly', 'Bagneux', 'La Malmaison'],
      marques: [{ t: 'bataille', lieu: 'Le Bourget', nom: 'Le Bourget', camp: 'de', a: 'combats-du-bourget' }],
      articles: ['combats-du-bourget', 'journee-du-31-octobre'],
    },
    {
      date: '1870-11-30', quand: '30 novembre – 2 décembre 1870', titre: 'Champigny : la grande sortie',
      texte: ['La deuxième armée de Ducrot franchit la Marne sur des ponts de bateaux, prend Champigny et Bry, mais bute sur le plateau de Villiers, que tiennent Wurtembergeois et Saxons. Après deux jours de combat et des nuits glaciales, elle repasse la rivière. L’armée de la Loire, qui devait lui donner la main, est battue le même 2 décembre à Loigny.'],
      vue: EST,
      pos: { D: ['Champigny-sur-Marne', 0.2, 0.6], WU: ['Villiers-sur-Marne', 0.3, -0.4], XII: ['Villiers-sur-Marne', 0.8, 1.2] },
      leve: ['Le Bourget'],
      marques: [{ t: 'bataille', lieu: 'Champigny-sur-Marne', nom: 'Champigny', a: 'bataille-de-champigny' }],
      articles: ['bataille-de-champigny', 'ducrot', 'bataille-de-loigny'],
    },
    {
      date: '1870-12-21', titre: 'Le second Bourget',
      texte: ['Une nouvelle attaque sur Le Bourget s’arrête devant l’artillerie et le froid. L’hiver est l’un des plus durs du siècle : les avant-postes gèlent, le bois manque dans la ville, on abat les arbres des boulevards.'],
      vue: NORD,
      pos: { D: ['Paris', 2.0, 2.4], WU: ['Chennevières-sur-Marne', 0.6, -1.2], XII: ['Montfermeil', -0.6, 0] },
      leve: ['Champigny'],
      marques: [{ t: 'bataille', lieu: 'Le Bourget', nom: 'Le Bourget', camp: 'de', a: 'combats-du-bourget' }],
      articles: ['combats-du-bourget', 'vie-a-paris-pendant-le-siege'],
    },
    {
      date: '1870-12-27', quand: '27 – 29 décembre 1870', titre: 'Avron sous les obus',
      texte: ['Les batteries de siège allemandes ouvrent le feu sur le plateau d’Avron, que les Français tiennent depuis la fin de novembre ; intenable, le plateau est évacué dans la nuit du 28 au 29 décembre.'],
      vue: EST,
      leve: ['Le Bourget'],
      marques: [{ t: 'feu', lieu: 'Plateau d’Avron', nom: 'Plateau d’Avron', a: 'bombardement-de-paris' }],
      articles: ['bombardement-de-paris', 'artillerie-de-siege'],
    },
    {
      date: '1871-01-05', quand: '5 – 26 janvier 1871', titre: 'Le bombardement de la rive gauche',
      texte: ['Les batteries de Châtillon et de Meudon écrasent les forts d’Issy, de Vanves et de Montrouge, et leurs obus les plus longs tombent sur la rive gauche, des Invalides au Muséum. En vingt-trois nuits, la ville reçoit environ 12 000 obus, qui font quelque 400 tués et blessés : ce n’est pas le canon qui fera céder Paris, c’est la faim.'],
      vue: SUD,
      leve: ['Plateau d’Avron'],
      marques: [{ t: 'feu', lieu: 'Rive gauche', nom: 'Rive gauche', a: 'bombardement-de-paris' }],
      articles: ['bombardement-de-paris', 'vie-a-paris-pendant-le-siege'],
    },
    {
      date: '1871-01-19', titre: 'Buzenval, la dernière sortie',
      texte: ['Quelque 90 000 hommes, dont la garde nationale, attaquent à l’ouest, vers Buzenval et la redoute de Montretout, qu’ils prennent un moment, puis refluent le soir sous le feu du Ve corps. La journée coûte 4 000 tués et blessés ; le peintre Henri Regnault est parmi les morts. Trochu cède le commandement à [[general-vinoy|Vinoy]].'],
      vue: OUEST,
      pos: { D: ['Buzenval', 0.6, 0.3], V: ['Buzenval', -1.4, -0.8] },
      leve: ['Rive gauche'],
      marques: [{ t: 'bataille', lieu: 'Buzenval', nom: 'Buzenval', camp: 'de', a: 'bataille-de-buzenval' }],
      articles: ['bataille-de-buzenval', 'trochu', 'garde-nationale'],
    },
    {
      date: '1871-01-28', quand: '28 – 29 janvier 1871', titre: 'Paris capitule',
      texte: ['Le pain va manquer. Jules Favre signe à Versailles l’armistice et la capitulation de Paris : le 29 janvier, les forts sont remis aux Allemands, l’armée est désarmée, la garde nationale garde ses fusils. La ville paiera une contribution de 200 millions de francs.'],
      vue: TOUT,
      pos: { D: null, V: ['Versailles', 2.6, 2.4] },
      leve: ['Buzenval', 'Paris'],
      marques: forts('de'),
      articles: ['armistice-de-1871', 'jules-favre', 'siege-de-paris'],
    },
  ],
};

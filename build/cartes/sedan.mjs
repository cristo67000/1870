/*
 * Sedan, du 31 août au 2 septembre 1870.
 *
 * Dispositions et heures d'après les articles bataille-de-sedan, bataille-de-bazeilles,
 * charges-de-floing et capitulation-de-sedan, et la page Wikipédia « Bataille de Sedan
 * (1870) » ; villages d'OpenStreetMap, château de Bellevue aussi (49.6970, 4.9028).
 * Frénois, où se tenait le roi, est placé d'après Wadelincourt. Un schéma, pas un relevé.
 */
const CUVETTE = [4.835, 49.632, 5.070, 49.762];
const NORD = [4.870, 49.680, 5.040, 49.762];
const VILLE = [4.880, 49.660, 5.010, 49.745];

export default {
  id: 'sedan',
  ordre: 4,
  court: 'Sedan',
  titre: 'Sedan, 31 août – 2 septembre 1870',
  sous: 'L’armée de Châlons encerclée, l’empereur prisonnier',
  fond: 'sedan',
  article: 'bataille-de-sedan',
  lieux: {
    'Bellevue': [49.6970, 4.9028],
    'Frénois': ['Wadelincourt', -1.6, -0.3],
    'Fond-de-Givonne': ['Sedan', 1.2, 0.9],
    'Bois de la Garenne': [49.7221, 4.9610],
    'Calvaire d’Illy': ['Illy', -0.3, -0.7],
  },
  unites: {
    F7: { camp: 'fr', nom: '7e corps (Félix Douay)', court: '7e c.' },
    D1: { camp: 'fr', nom: '1er corps (Ducrot)', court: '1er c.' },
    F5: { camp: 'fr', nom: '5e corps', court: '5e c.' },
    L12: { camp: 'fr', nom: '12e corps (Lebrun) et infanterie de marine', court: '12e c.' },
    CM: { camp: 'fr', nom: 'Division de cavalerie Margueritte', court: 'Margueritte' },
    B1: { camp: 'de', nom: 'Ier corps bavarois (von der Tann)', court: 'Ier bav.' },
    XII: { camp: 'de', nom: 'XIIe corps saxon', court: 'XIIe' },
    GA: { camp: 'de', nom: 'Garde prussienne', court: 'Garde' },
    B2: { camp: 'de', nom: 'IIe corps bavarois', court: 'IIe bav.' },
    XI: { camp: 'de', nom: 'XIe corps prussien', court: 'XIe' },
    V: { camp: 'de', nom: 'Ve corps prussien', court: 'Ve' },
    WU: { camp: 'de', nom: 'Division wurtembergeoise', court: 'Wurt.' },
  },
  etapes: [
    {
      date: '1870-08-31', titre: 'La cuvette de Sedan',
      texte: ['Après [[bataille-de-beaumont|Beaumont]], l’[[armee-de-chalons|armée de Châlons]] se resserre autour de Sedan, dans le triangle Floing – Illy – Bazeilles, adossée à une place démodée et à la frontière belge. [[mac-mahon|Mac-Mahon]] annonce le repos pour le lendemain et ne fait pas sauter les ponts : les Bavarois prennent celui du chemin de fer à Remilly et entrent dans Bazeilles, que tient l’infanterie de marine. À l’ouest, la IIIe armée atteint Donchery.'],
      vue: CUVETTE,
      pos: {
        F7: ['Floing', 1.6, 0.6], D1: ['Daigny', -0.5, 0.8], F5: 'Fond-de-Givonne', L12: ['Balan', 0.9, -0.7], CM: ['Floing', 2.6, 1.6],
        B1: ['Remilly-Aillicourt', 0, 0.9], XII: ['Douzy', 0, 0.6], GA: ['Francheval', 0.3, 0.2], B2: ['Frénois', 0, -0.6],
        XI: ['Donchery', -0.4, -1.3], V: ['Donchery', -1.6, -2.2], WU: ['Donchery', -2.2, -0.4],
      },
      marques: [{ t: 'bataille', lieu: 'Bazeilles', nom: 'Bazeilles', a: 'bataille-de-bazeilles' }],
      articles: ['bataille-de-sedan', 'armee-de-chalons', 'bataille-de-bazeilles'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, avant l’aube', titre: 'Bazeilles dans le brouillard',
      texte: ['Vers 4 h, dans le brouillard, le Ier corps bavarois attaque Bazeilles ; les marsouins de la division Vassoigne, la « division bleue », la défendent maison par maison. Plus au nord, les Saxons attaquent La Moncelle et Daigny, sur la Givonne.'],
      vue: VILLE,
      pos: { B1: ['Bazeilles', 0.4, -0.2], XII: ['La Moncelle', 1.0, -0.3], L12: ['Bazeilles', -0.7, 0.5] },
      articles: ['bataille-de-bazeilles', 'von-der-tann'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, 6 h – 8 h 30', titre: 'Trois chefs en trois heures',
      texte: ['Vers 6 h, Mac-Mahon, venu observer le combat de Bazeilles depuis les hauteurs de Balan, est blessé par un éclat d’obus. Il désigne [[ducrot|Ducrot]], qui ordonne vers 7 h la retraite vers l’ouest, par le plateau d’Illy, sur Mézières. Vers 8 h 30, [[wimpffen|Wimpffen]], arrivé d’Algérie avec une lettre de [[comte-de-palikao|Palikao]] qui lui confie le commandement en cas d’empêchement du maréchal, le réclame, l’obtient et annule l’ordre : il veut percer à l’est, vers Carignan.'],
      vue: VILLE,
      pos: { D1: ['Daigny', -0.8, 1.0], XII: ['Daigny', 0.9, -0.2] },
      articles: ['mac-mahon', 'ducrot', 'wimpffen'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, vers 10 h', titre: 'La IIIe armée tourne par le nord',
      texte: ['Passés à Donchery, les XIe et Ve corps remontent vers Saint-Menges et Fleigneux, derrière l’armée française ; les Wurtembergeois gardent la route de Mézières. À l’est, la Garde prussienne descend sur la Givonne. Le 7e corps de Félix Douay fait face au nord, sur le plateau de Floing.'],
      vue: CUVETTE,
      pos: { XI: ['Saint-Menges', 0.1, 0.3], V: ['Saint-Menges', -0.9, 1.0], WU: ['Donchery', -0.6, 1.0], GA: ['Villers-Cernay', -0.6, 0.4], F7: ['Floing', 1.3, 0.9] },
      articles: ['bataille-de-sedan', 'kronprinz-frederic-guillaume'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, vers 13 h', titre: 'Wimpffen veut reprendre Bazeilles',
      texte: ['Bazeilles est perdue ; les derniers marsouins se sont battus jusque dans l’auberge Bourgerie, l’épisode des « dernières cartouches ». Wimpffen ordonne de percer à l’est, vers Carignan, et prélève pour cela les réserves de Douay et de Ducrot : le front nord se dégarnit au moment où la IIIe armée l’aborde.'],
      vue: VILLE,
      pos: { F5: ['Balan', 0.6, 0.3], B1: ['Bazeilles', -0.4, 0.5], L12: ['Balan', 0.2, -0.1], GA: ['Givonne', 0.4, 0.6], V: ['Fleigneux', 0, 0], XI: ['Floing', 0.4, 1.6] },
      marques: [{ t: 'bataille', lieu: 'Bazeilles', nom: 'Bazeilles', camp: 'de', a: 'bataille-de-bazeilles' }],
      articles: ['bataille-de-bazeilles', 'wimpffen', 'mots-de-1870'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, vers 14 h', titre: 'Le cercle se ferme à Illy',
      texte: ['Les deux armées allemandes font leur jonction sur le plateau d’Illy : l’armée de Châlons est encerclée. Des centaines de pièces allemandes, sur les hauteurs, battent la cuvette de tous côtés ; le bois de la Garenne, où s’entassent les réserves, devient un piège.'],
      vue: NORD,
      pos: { GA: ['Illy', 0.7, 0], V: ['Illy', -0.7, 0.4], F7: ['Calvaire d’Illy', -0.8, -0.6], D1: ['Bois de la Garenne', 0.6, -0.2] },
      marques: [{ t: 'bataille', lieu: 'Illy', nom: 'Illy', camp: 'de', a: 'bataille-de-sedan' }],
      articles: ['bataille-de-sedan', 'canon-krupp', 'artillerie-francaise'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, 14 h – 15 h', titre: 'Les charges de Floing',
      texte: ['Pour rouvrir un passage, la cavalerie charge sur les pentes de Floing : chasseurs d’Afrique, hussards, lanciers. Le général [[general-margueritte|Margueritte]] est mortellement blessé en reconnaissant le terrain ; [[galliffet|Galliffet]] mène les charges suivantes, brisées l’une après l’autre par le feu de l’infanterie. Des hauteurs de Frénois, le roi Guillaume aurait salué leur courage.'],
      vue: NORD,
      pos: { CM: ['Floing', 1.0, 0.5], XI: ['Floing', 0.0, 1.2] },
      marques: [{ t: 'bataille', lieu: ['Floing', 0.6, 0.4], nom: 'Floing', camp: 'de', a: 'charges-de-floing' }],
      articles: ['charges-de-floing', 'general-margueritte', 'galliffet', 'cavalerie-en-1870'],
    },
    {
      date: '1870-09-01', quand: '1er septembre 1870, fin d’après-midi', titre: 'Le drapeau blanc',
      texte: ['La défense cède partout ; des dizaines de milliers d’hommes refluent dans Sedan, où l’on ne peut plus ni se battre ni sortir. [[napoleon-iii|Napoléon III]] fait hisser le drapeau blanc sur la citadelle. Wimpffen tente encore une percée vers Balan. Un officier allemand venu sommer la place découvre que l’empereur est là ; le soir, le général Reille porte au roi, sur les hauteurs de Frénois, la lettre où Napoléon III, n’ayant pu mourir au milieu de ses troupes, lui remet son épée.'],
      vue: VILLE,
      pos: { CM: null, F7: ['Sedan', 0.3, 1.3], D1: ['Sedan', 1.2, 0.7], F5: ['Sedan', 0.8, 0.1], L12: ['Sedan', 1.0, -0.6], GA: ['Bois de la Garenne', 0.4, 0.8], V: ['Calvaire d’Illy', -0.6, 0.2], XI: ['Floing', 0.4, 0.4], B1: ['Balan', 0.8, -0.4], XII: ['Daigny', -0.2, 0.2] },
      leve: ['Illy', 'Floing'],
      marques: [{ t: 'bataille', lieu: 'Sedan', nom: 'Sedan', camp: 'de', a: 'bataille-de-sedan' }],
      articles: ['bataille-de-sedan', 'napoleon-iii', 'capitulation-de-sedan'],
    },
    {
      date: '1870-09-02', titre: 'Bellevue : la capitulation',
      texte: ['Le soir du 1er, à Donchery, [[moltke|Moltke]] et [[bismarck|Bismarck]] exigent de Wimpffen une capitulation sans condition. Le 2 à l’aube, l’empereur part au-devant du roi ; Bismarck le rejoint sur la route et l’entretient dans la maison d’un tisserand. Vers 11 h, Wimpffen et Moltke signent la capitulation au château de Bellevue — l’empereur ne la signe pas. Environ 80 000 prisonniers sont parqués dans la presqu’île d’Iges, le « camp de la Misère », avant d’être emmenés en Allemagne.'],
      vue: CUVETTE,
      pos: { F7: null, D1: null, F5: null, L12: null },
      leve: ['Sedan', 'Bazeilles'],
      marques: [{ t: 'ville', lieu: 'Bellevue', nom: 'Château de Bellevue', camp: 'de', a: 'capitulation-de-sedan' }, { t: 'siege', lieu: 'Iges', nom: 'Camp de la Misère', a: 'capitulation-de-sedan' }],
      articles: ['capitulation-de-sedan', 'prisonniers-de-guerre', 'quatre-septembre'],
    },
  ],
};

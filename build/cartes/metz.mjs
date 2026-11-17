/*
 * Autour de Metz, du 14 au 20 août 1870 : Borny, Mars-la-Tour, Gravelotte – Saint-Privat,
 * l'investissement. Les heures suivent les articles bataille-de-borny,
 * bataille-de-mars-la-tour et bataille-de-gravelotte. Les corps sont placés au
 * gros de leurs troupes : un schéma, pas un relevé.
 */
const PLATEAU = [5.845, 49.035, 6.215, 49.235];
const OUEST = [5.845, 49.040, 6.090, 49.150];
const NORD = [5.930, 49.120, 6.120, 49.232];
const TOUT = [5.845, 49.020, 6.325, 49.245];

export default {
  id: 'metz',
  ordre: 3,
  court: 'Metz',
  titre: 'Autour de Metz, 14 – 20 août 1870',
  sous: 'Borny, Mars-la-Tour, Saint-Privat : l’armée du Rhin enfermée',
  fond: 'metz',
  article: 'bataille-de-gravelotte',
  lieux: {
    'Saint-Hubert': ['Gravelotte', 1.1, 0.2],
    'Point-du-Jour': ['Rozérieulles', 0.4, 0.5],
    'Plateau de l’Yron': ['Mars-la-Tour', 0.2, 2.0],
  },
  unites: {
    F2: { camp: 'fr', nom: '2e corps (Frossard)', court: '2e c.' },
    F3: { camp: 'fr', nom: '3e corps (Decaen, puis Le Bœuf)', court: '3e c.' },
    F4: { camp: 'fr', nom: '4e corps (Ladmirault)', court: '4e c.' },
    F6: { camp: 'fr', nom: '6e corps (Canrobert)', court: '6e c.' },
    FG: { camp: 'fr', nom: 'Garde impériale (Bourbaki)', court: 'Garde' },
    I: { camp: 'de', nom: 'Ier corps (Manteuffel), Ire armée', court: 'Ier' },
    VII: { camp: 'de', nom: 'VIIe corps (Zastrow), Ire armée', court: 'VIIe' },
    VIII: { camp: 'de', nom: 'VIIIe corps (Goeben), Ire armée', court: 'VIIIe' },
    III: { camp: 'de', nom: 'IIIe corps (Alvensleben), IIe armée', court: 'IIIe' },
    X: { camp: 'de', nom: 'Xe corps (Voigts-Rhetz), IIe armée', court: 'Xe' },
    IX: { camp: 'de', nom: 'IXe corps (Manstein), IIe armée', court: 'IXe' },
    GA: { camp: 'de', nom: 'Garde prussienne (prince Auguste de Wurtemberg)', court: 'Garde' },
    XII: { camp: 'de', nom: 'XIIe corps saxon (prince Albert de Saxe)', court: 'XIIe' },
    BR: { camp: 'de', nom: 'Brigade de cavalerie Bredow', court: 'Bredow' },
  },
  etapes: [
    {
      date: '1870-08-14', quand: '14 août 1870, après-midi', titre: 'Borny : l’armée retenue à l’est de Metz',
      texte: ['L’armée du Rhin commence à passer sur la rive gauche de la Moselle pour gagner Verdun. Une avant-garde de la Ire armée attaque les corps restés à l’est de la ville, à Borny et Colombey. Le combat ne tranche rien, mais il fait perdre une journée à l’armée — et le général Decaen, qui commande le 3e corps, est mortellement blessé.'],
      vue: TOUT,
      pos: {
        F3: ['Borny', 0.6, -0.2], F4: ['Borny', 0.6, 2.2], FG: ['Metz', 0.6, 0.4], F2: ['Metz', -2.5, -0.8], F6: ['Metz', -2.0, 1.0],
        VII: ['Borny', 3.0, -0.6], I: ['Noisseville', 1.4, 0.4], III: ['Gorze', 2.0, -2.6],
      },
      marques: [{ t: 'bataille', lieu: 'Borny', nom: 'Borny', a: 'bataille-de-borny' }],
      articles: ['bataille-de-borny', 'bazaine'],
    },
    {
      date: '1870-08-15', titre: 'Sur le plateau, vers Verdun',
      texte: ['Les corps français montent lentement sur le plateau par la seule route de Gravelotte, encombrée de voitures. Pendant ce temps, la IIe armée allemande franchit la Moselle au sud de Metz, à Pont-à-Mousson et Novéant, et remonte vers la route de Verdun.'],
      vue: PLATEAU,
      pos: {
        F2: ['Rezonville', 0.3, -0.6], F6: ['Rezonville', 0.4, 1.1], F3: ['Vernéville', 0.8, -0.3], F4: ['Plappeville', -0.5, 1.2], FG: ['Gravelotte', 0.8, 0.1],
        III: ['Gorze', 0.5, -2.0], VII: ['Ars-sur-Moselle', 3.0, -0.5],
      },
      articles: ['armee-du-rhin', 'bazaine'],
    },
    {
      date: '1870-08-16', quand: '16 août 1870, vers 10 h', titre: 'Alvensleben attaque',
      texte: ['Napoléon III a quitté l’armée à l’aube. Venu de Gorze, le IIIe corps d’[[constantin-von-alvensleben|Alvensleben]] tombe sur le 2e corps, qu’il croit être une arrière-garde : il a devant lui presque toute l’armée du Rhin.'],
      vue: OUEST,
      pos: {
        III: ['Vionville', 0.6, -1.4], F2: ['Rezonville', -0.8, -0.6], F6: ['Rezonville', -0.5, 1.1], F3: ['Saint-Marcel', 1.0, 0.3], F4: ['Doncourt-lès-Conflans', 2.5, 1.5], FG: ['Gravelotte', 0.2, 0],
      },
      articles: ['bataille-de-mars-la-tour', 'constantin-von-alvensleben', 'napoleon-iii'],
    },
    {
      date: '1870-08-16', quand: '16 août 1870, 11 h 30', titre: 'La route de Verdun est coupée',
      texte: ['Vionville tombe, puis Flavigny vers midi. Les Allemands tiennent la route de Verdun par Mars-la-Tour. [[bazaine|Bazaine]], qui pourrait écraser un corps isolé, garde ses forces groupées autour de Rezonville, l’œil tourné vers Metz.'],
      vue: OUEST,
      pos: { III: ['Vionville', 0.2, -0.3], F2: ['Rezonville', -0.4, -0.3] },
      marques: [{ t: 'bataille', lieu: 'Vionville', nom: 'Mars-la-Tour – Rezonville', a: 'bataille-de-mars-la-tour' }],
      articles: ['bataille-de-mars-la-tour'],
    },
    {
      date: '1870-08-16', quand: '16 août 1870, 14 h', titre: 'La « chevauchée de la mort »',
      texte: ['Pour dégager son infanterie à bout de souffle, Alvensleben lance la brigade de [[von-bredow|Bredow]], cuirassiers et uhlans, contre les batteries du 6e corps. Elle les traverse, perd près de la moitié de ses cavaliers au retour, mais suspend un moment la pression française.'],
      vue: OUEST,
      pos: { BR: ['Vionville', 0.9, 1.3] },
      articles: ['von-bredow', 'cavalerie-en-1870'],
    },
    {
      date: '1870-08-16', quand: '16 août 1870, vers 16 h', titre: 'Le Xe corps arrive',
      texte: ['Le Xe corps prussien entre en ligne par Tronville et Mars-la-Tour. Les 3e et 4e corps français attaquent la gauche allemande : la 38e brigade, lancée contre eux, est écrasée devant Bruville.'],
      vue: OUEST,
      pos: { BR: null, X: ['Mars-la-Tour', 0.6, 0.9], F4: ['Bruville', 0.6, 0.7], F3: ['Saint-Marcel', 0.6, -0.4] },
      articles: ['bataille-de-mars-la-tour'],
    },
    {
      date: '1870-08-16', quand: '16 août 1870, vers 19 h', titre: 'La mêlée de l’Yron',
      texte: ['Plusieurs milliers de cavaliers des deux camps se heurtent sur le plateau, au nord de Mars-la-Tour : la plus grande mêlée de cavalerie de la guerre, sans vainqueur. Les combats cessent vers 22 h. Chaque camp a perdu de 16 000 à 17 000 hommes ; la route de Verdun reste fermée.'],
      vue: OUEST,
      marques: [{ t: 'bataille', lieu: 'Plateau de l’Yron', nom: 'Mêlée de l’Yron', a: 'cavalerie-en-1870' }],
      articles: ['cavalerie-en-1870', 'bataille-de-mars-la-tour'],
    },
    {
      date: '1870-08-17', titre: 'Bazaine se replie sur les crêtes',
      texte: ['Au lieu de reprendre la marche, Bazaine ramène l’armée sur une forte ligne de crêtes, de Rozérieulles au sud à Saint-Privat au nord, adossée aux forts de Metz. Les deux armées allemandes se resserrent sur le plateau.'],
      vue: PLATEAU,
      pos: {
        F2: 'Point-du-Jour', F3: ['Gravelotte', 1.9, 1.3], F4: ['Amanvillers', 0.7, -0.2], F6: ['Saint-Privat-la-Montagne', 0.3, 0], FG: ['Plappeville', 0, 0.3],
        III: ['Vionville', 0.8, 0.8], X: ['Mars-la-Tour', 1.2, 0.5], VII: ['Ars-sur-Moselle', -1.5, 0.8], VIII: ['Gorze', 1.0, 1.6], IX: ['Vionville', 2.4, 2.2], GA: ['Mars-la-Tour', 0.5, 3.5], XII: ['Mars-la-Tour', 2.5, 6.5],
        I: ['Noisseville', 0.6, -0.3],
      },
      leve: ['Borny'],
      articles: ['bataille-de-gravelotte'],
    },
    {
      date: '1870-08-18', quand: '18 août 1870, vers midi', titre: 'Le IXe corps devant Amanvillers',
      texte: ['Le roi et [[moltke|Moltke]] lancent les deux armées contre la position française, sans savoir encore où elle finit au nord. Le IXe corps de Manstein ouvre le feu devant Amanvillers, en plein centre français, et y perd une partie de ses batteries.'],
      vue: PLATEAU,
      pos: { IX: ['Vernéville', 0.8, 0.5], VII: ['Gravelotte', 0.2, -1.0], VIII: ['Gravelotte', -0.3, 0.3], GA: ['Saint-Ail', -0.9, -0.3], XII: ['Batilly', 0.2, 0.3], III: ['Vernéville', -0.8, -1.0], X: ['Saint-Ail', -1.0, -1.6] },
      articles: ['bataille-de-gravelotte', 'moltke'],
    },
    {
      date: '1870-08-18', quand: '18 août 1870, 15 h 30', titre: 'Le ravin de la Mance, Sainte-Marie-aux-Chênes',
      texte: ['Au sud, [[steinmetz|Steinmetz]] jette le VIIIe corps dans le ravin de la Mance, sous le feu du Point-du-Jour : la ferme de Saint-Hubert tombe, la crête ne tombe pas. Au nord, la Garde prussienne et les Saxons enlèvent Sainte-Marie-aux-Chênes.'],
      vue: PLATEAU,
      pos: { VIII: ['Saint-Hubert', -0.2, 0], VII: ['Gravelotte', 0.6, -0.8], GA: ['Sainte-Marie-aux-Chênes', 0.4, -0.2], XII: ['Sainte-Marie-aux-Chênes', -0.5, 0.7] },
      marques: [{ t: 'bataille', lieu: 'Saint-Hubert', nom: 'Ravin de la Mance', a: 'bataille-de-gravelotte' }],
      articles: ['bataille-de-gravelotte', 'steinmetz'],
    },
    {
      date: '1870-08-18', quand: '18 août 1870, vers 17 h', titre: 'La Garde devant Saint-Privat',
      texte: ['La Garde prussienne attaque Saint-Privat à découvert, en colonnes serrées, sur une pente nue : le feu du 6e corps de [[canrobert|Canrobert]] lui coûte plus de 5 000 hommes en une heure. L’attaque s’arrête à quelques centaines de mètres du village.'],
      vue: NORD,
      pos: { GA: ['Saint-Privat-la-Montagne', -1.1, -0.2] },
      marques: [{ t: 'bataille', lieu: 'Saint-Privat-la-Montagne', nom: 'Saint-Privat', a: 'bataille-de-gravelotte' }],
      articles: ['bataille-de-gravelotte', 'canrobert', 'fusil-chassepot'],
    },
    {
      date: '1870-08-18', quand: '18 août 1870, vers 19 h 30', titre: 'Les Saxons par Roncourt',
      texte: ['Au sud, la Ire armée, épuisée, cède à la panique et reflue sur Gravelotte. Au nord, les Saxons, arrivés par Roncourt, prennent Saint-Privat à revers avec la Garde ; le village tombe vers 20 h. Le 6e corps, à court de munitions et sans renfort de la Garde impériale restée en réserve, se retire.'],
      vue: NORD,
      pos: { XII: ['Roncourt', 0.3, 0], GA: ['Saint-Privat-la-Montagne', -0.4, 0], F6: ['Saint-Privat-la-Montagne', 1.6, -0.8], VIII: ['Gravelotte', 0.2, 0.2] },
      marques: [{ t: 'bataille', lieu: ['Saint-Privat-la-Montagne', 0.2, 0.1], nom: 'Saint-Privat', camp: 'de', a: 'bataille-de-gravelotte' }],
      articles: ['bataille-de-gravelotte', 'albert-de-saxe'],
    },
    {
      date: '1870-08-20', quand: '19 – 20 août 1870', titre: 'L’armée du Rhin sous les forts',
      texte: ['L’armée du Rhin se retire sous le canon des forts. Le 20 août, l’investissement de Metz est achevé : plus de 150 000 hommes y sont enfermés. Moltke en tire trois corps — la Garde, les Saxons et le IVe corps — pour former l’armée de la Meuse, qui part vers l’ouest au-devant de l’armée de Châlons.'],
      vue: TOUT,
      pos: {
        F2: ['Metz', -2.6, -1.0], F3: ['Metz', -2.4, 1.6], F4: ['Metz', -0.4, 3.6], F6: ['Metz', -2.0, 4.4], FG: ['Metz', -1.2, 0.3],
        VII: ['Ars-sur-Moselle', 1.6, 1.5], VIII: ['Gravelotte', 0.5, 0.6], IX: ['Amanvillers', 0.4, 0], III: ['Saint-Privat-la-Montagne', 1.0, 1.2], X: ['Saint-Privat-la-Montagne', 5.5, 2.5], I: ['Noisseville', 0, 0],
        GA: null, XII: null,
      },
      leve: ['Mars-la-Tour – Rezonville', 'Mêlée de l’Yron', 'Ravin de la Mance'],
      marques: [{ t: 'siege', lieu: 'Metz', nom: 'Metz', a: 'siege-de-metz' }],
      articles: ['siege-de-metz', 'bazaine', 'armees-allemandes-en-campagne'],
    },
  ],
};

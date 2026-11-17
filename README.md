# 1870 · la guerre franco-allemande

Une application web à installer (PWA), hors ligne, sans compte ni publicité, sur la guerre
franco-allemande de 1870-1871 :

- **des articles** vérifiés et illustrés sur la guerre, les personnages, les batailles, les sièges,
  les forces en présence, les armes et la mémoire, avec leurs repères datés, leurs chiffres
  (effectifs, canons, pertes, d'où ils viennent) et leurs sources ;
- **des cartes animées** : la campagne de juillet 1870 à mai 1871, et de près Frœschwiller-Wœrth,
  les batailles autour de Metz, Sedan, les sièges de Strasbourg et de Paris ;
- **une frise** jour par jour et une vue d'ensemble des batailles et des sièges ;
- **les rapports de force**, bataille par bataille, et la portée des armes ;
- **des textes du temps** — témoins, écrivains, historiens, documents — tous du domaine public,
  chacun avec le livre numérisé par la Bibliothèque nationale de France sur Gallica.

## Construire

Rien à installer pour l'application elle-même : HTML, CSS et JavaScript sans dépendance. Les
données se construisent avec Node (≥ 20) et Python (≥ 3.10, Pillow pour les images) :

    node build/fonds.mjs tout              fonds de carte (Natural Earth, OpenStreetMap)
    python -I build/illustrer.py           illustrations (Wikimedia Commons, licences libres)
    node build/construire.mjs              data/*.json : articles, textes, cartes, frise
    node build/essais.mjs                  épreuves statiques
    node build/essais_navigateur.mjs       épreuves dans Chrome, hors ligne compris

Les sources sont dans `build/` : `articles/`, `textes/`, `cartes/`, `frise.txt`,
`choix-images.txt`. Les formats sont décrits en tête de `build/construire.mjs` et de
`build/annexes.mjs`.

## Sources et licences

Articles originaux © 2026. Extraits du domaine public. Images : Wikimedia Commons (domaine public,
CC0, CC BY, CC BY-SA ; auteur et licence sous chaque image). Fonds de carte : Natural Earth
(domaine public) et © les contributeurs d'OpenStreetMap (ODbL).

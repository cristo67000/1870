/*
 * Géométrie partagée par les scripts de cartes : projection, simplification,
 * découpe, écriture des tracés.
 *
 * Tout est projeté une fois pour toutes en Mercator « web » sur un monde de
 * TAILLE unités de côté (une unité ≈ 6 m à la latitude de Metz), en
 * coordonnées entières ; js/theatre.js place les unités par la même formule.
 */
export const TAILLE = 4194304;           // 2^22

export function projeter(lon, lat) {
  const phi = lat * Math.PI / 180;
  return [
    (lon + 180) / 360 * TAILLE,
    (1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2 * TAILLE,
  ];
}

/* Le nombre d'unités que fait un mètre à cette latitude. */
export function unitesParMetre(lat) {
  return TAILLE / (40075016.7 * Math.cos(lat * Math.PI / 180));
}

/* Douglas-Peucker. */
export function simplifier(points, tolerance) {
  const n = points.length;
  if (n <= 2) return points;
  const garder = new Uint8Array(n);
  garder[0] = garder[n - 1] = 1;
  const pile = [[0, n - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const long2 = dx * dx + dy * dy;
    let pire = -1;
    let ecart = 0;
    for (let i = a + 1; i < b; i += 1) {
      const [px, py] = points[i];
      const d = long2 === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / Math.sqrt(long2);
      if (d > ecart) { ecart = d; pire = i; }
    }
    if (pire !== -1 && ecart > tolerance) {
      garder[pire] = 1;
      pile.push([a, pire], [pire, b]);
    }
  }
  return points.filter((p, i) => garder[i]);
}

/* Un tracé projeté, simplifié, arrondi, sans doublons ; null s'il n'en reste rien. */
export function preparer(points, ferme, tolerance) {
  let s = simplifier(points, tolerance).map(([x, y]) => [Math.round(x), Math.round(y)]);
  s = s.filter((p, i) => i === 0 || p[0] !== s[i - 1][0] || p[1] !== s[i - 1][1]);
  if (ferme && s.length < 4) return null;
  if (!ferme && s.length < 2) return null;
  return s;
}

/* Les points d'un tracé en chemin SVG relatif : « M x y l dx dy dx dy… ». */
export function chemin(trace, ferme) {
  let d = 'M' + trace[0][0] + ' ' + trace[0][1] + 'l';
  let premier = true;
  for (let i = 1; i < trace.length; i += 1) {
    if (ferme && i === trace.length - 1 && trace[i][0] === trace[0][0] && trace[i][1] === trace[0][1]) break;
    const dx = trace[i][0] - trace[i - 1][0];
    const dy = trace[i][1] - trace[i - 1][1];
    d += (premier || dx < 0 ? '' : ' ') + dx + (dy < 0 ? '' : ' ') + dy;
    premier = false;
  }
  return d + (ferme ? 'z' : '');
}

/* Découpe d'un anneau par un rectangle [x0, y0, x1, y1] (Sutherland-Hodgman) :
 * suffisant pour remplir une terre dont le bord sort du cadre. */
export function decouperAnneau(anneau, [x0, y0, x1, y1]) {
  const bords = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]],
  ];
  let pts = anneau;
  for (const [dedans, coupe] of bords) {
    const sortie = [];
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const da = dedans(a);
      const db = dedans(b);
      if (da) sortie.push(a);
      if (da !== db) sortie.push(coupe(a, b));
    }
    pts = sortie;
    if (!pts.length) return null;
  }
  if (pts.length < 3) return null;
  pts.push(pts[0]);
  return pts;
}

/* Découpe d'une ligne par un rectangle : les morceaux qui restent dedans. */
export function decouperLigne(ligne, [x0, y0, x1, y1]) {
  const dedans = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  const morceaux = [];
  let courant = [];
  for (let i = 0; i < ligne.length; i += 1) {
    const p = ligne[i];
    if (dedans(p)) {
      if (!courant.length && i > 0) courant.push(ligne[i - 1]);   // on garde le point d'entrée
      courant.push(p);
    } else if (courant.length) {
      courant.push(p);                                            // et le point de sortie
      morceaux.push(courant);
      courant = [];
    }
  }
  if (courant.length > 1) morceaux.push(courant);
  return morceaux;
}

export function boite(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
export const seTouchent = (a, b) => a[2] >= b[0] && a[0] <= b[2] && a[3] >= b[1] && a[1] <= b[3];

/* L'aire signée d'un anneau (unités au carré). */
export function aire(anneau) {
  let s = 0;
  for (let i = 0; i < anneau.length - 1; i += 1) s += anneau[i][0] * anneau[i + 1][1] - anneau[i + 1][0] * anneau[i][1];
  return s / 2;
}

/* Recoud des tronçons (listes de points) en anneaux fermés par leurs extrémités. */
export function recoudre(troncons) {
  const cle = (p) => p[0] + ',' + p[1];
  const restants = troncons.filter((t) => t.length > 1).map((t) => t.slice());
  const anneaux = [];
  while (restants.length) {
    let courant = restants.pop();
    let avance = true;
    while (avance && cle(courant[0]) !== cle(courant[courant.length - 1])) {
      avance = false;
      const fin = cle(courant[courant.length - 1]);
      for (let i = 0; i < restants.length; i += 1) {
        const t = restants[i];
        if (cle(t[0]) === fin) { courant = courant.concat(t.slice(1)); restants.splice(i, 1); avance = true; break; }
        if (cle(t[t.length - 1]) === fin) { courant = courant.concat(t.slice(0, -1).reverse()); restants.splice(i, 1); avance = true; break; }
      }
    }
    if (courant.length >= 4 && cle(courant[0]) === cle(courant[courant.length - 1])) anneaux.push(courant);
  }
  return anneaux;
}

/*
 * Épreuves de 1870 dans un vrai Chrome, sans affichage, au format d'un téléphone.
 *
 *   node build/essais_navigateur.mjs
 *
 * Ouvre chaque vue, chaque article, chaque extrait et chaque étape de chaque
 * carte ; relève les erreurs JavaScript, les débordements horizontaux, les
 * vues vides. Puis installe l'application (service worker), arrête le serveur
 * et vérifie qu'elle s'ouvre encore : articles, textes, cartes et fonds.
 *
 * Chrome est lancé avec un profil neuf (dossier temporaire) et un port de
 * débogage à part (9371 : le 9222 est souvent pris sur ce poste).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { demarrerServeur } from './serveur_local.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.dirname(ICI);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((c) => fs.existsSync(c));
const PORT = 8271;
const DEBOGAGE = 9371;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let reussites = 0, echecs = 0;
function ok(cond, message) { if (cond) reussites++; else { echecs++; console.log('  ÉCHEC', message); } }

async function cdp(url) {
  const ws = new WebSocket(url);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let n = 0;
  const attentes = new Map();
  const ecouteurs = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && attentes.has(m.id)) { const [r, j] = attentes.get(m.id); attentes.delete(m.id); m.error ? j(new Error(m.error.message)) : r(m.result); }
    else for (const f of ecouteurs) f(m);
  };
  return {
    envoyer: (methode, params) => new Promise((r, j) => { n += 1; attentes.set(n, [r, j]); ws.send(JSON.stringify({ id: n, method: methode, params: params || {} })); }),
    sur: (f) => ecouteurs.push(f),
    fermer: () => ws.close(),
  };
}

async function main() {
  if (!CHROME) { console.log('Chrome introuvable : épreuves sautées.'); return; }
  let serveur = await demarrerServeur(PORT);
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'essais-1870-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--remote-debugging-port=' + DEBOGAGE, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });
  let page = null;
  try {
    let cible = null;
    for (let i = 0; i < 40 && !cible; i += 1) {
      await attendre(250);
      try { cible = (await (await fetch('http://127.0.0.1:' + DEBOGAGE + '/json/list')).json()).find((t) => t.type === 'page'); } catch (e) { /* Chrome démarre */ }
    }
    if (!cible) throw new Error('Chrome ne répond pas sur le port ' + DEBOGAGE);
    page = await cdp(cible.webSocketDebuggerUrl);
    const erreurs = [];
    page.sur((m) => {
      if (m.method === 'Runtime.exceptionThrown') erreurs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erreurs.push(m.params.args.map((a) => a.value || a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) erreurs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
    });
    await page.envoyer('Runtime.enable');
    await page.envoyer('Log.enable');
    await page.envoyer('Page.enable');
    await page.envoyer('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    const evaluer = async (expr) => (await page.envoyer('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
    const aller = async (url, ms) => { await page.envoyer('Page.navigate', { url }); await attendre(ms || 1200); };
    const ancre = async (h, ms) => { await evaluer('location.hash = ' + JSON.stringify(h) + '; true'); await attendre(ms || 160); };
    const etat = () => evaluer(`({ vue: document.querySelector('#vue').children.length, texte: document.querySelector('#vue').innerText.length,
      large: document.documentElement.scrollWidth, ecran: innerWidth, titre: document.title })`);
    const verifier = async (nom, attendu) => {
      const e = await etat();
      ok(e.vue > 0 && e.texte > (attendu || 40), nom + ' : vue vide');
      ok(e.large <= e.ecran + 1, nom + ' : débordement horizontal (' + e.large + ' > ' + e.ecran + ')');
      if (erreurs.length) { ok(false, nom + ' : ' + erreurs.join(' | ').slice(0, 300)); erreurs.length = 0; }
    };

    // 1. Les vues, sans service worker
    console.log('vues');
    const base = 'http://127.0.0.1:' + PORT + '/index.html?sans-sw';
    await aller(base + '#/', 1800);
    await verifier('accueil', 300);
    const donnees = await evaluer(`({ articles: Donnees.articles.map((a) => a.id), textes: Donnees.textes.map((t) => t.id),
      cartes: Donnees.cartes.map((c) => [c.id, c.etapes.length]) })`);
    for (const h of ['#/articles', '#/articles?cat=batailles', '#/articles?q=sedan', '#/frise', '#/forces', '#/textes', '#/textes?g=poeme', '#/reglages']) {
      await ancre(h, 400);
      await verifier(h, 100);
    }
    ok(await evaluer(`document.querySelectorAll('.regard-trait').length`) >= 0, 'frise');
    await ancre('#/frise', 600);
    ok(await evaluer(`document.querySelectorAll('.chrono-fait').length`) > 20, 'frise : la chronologie jour par jour');
    await ancre('#/forces', 500);
    ok(await evaluer(`document.querySelectorAll('.duel').length`) > 5, 'rapports de force : des batailles comparées');

    console.log('articles (' + donnees.articles.length + ')');
    for (const id of donnees.articles) { await ancre('#/a/' + id, 120); await verifier('article ' + id, 300); }
    console.log('textes (' + donnees.textes.length + ')');
    for (const id of donnees.textes) { await ancre('#/t/' + id, 100); await verifier('texte ' + id, 200); }
    console.log('cartes');
    for (const [id, n] of donnees.cartes) {
      for (const e of [1, Math.ceil(n / 2), n]) {
        await aller(base + '&c=' + id + e + '#/cartes?c=' + id + '&e=' + e, 1600);
        await verifier('carte ' + id + ' étape ' + e, 100);
        const vu = await evaluer(`({ unites: [...document.querySelectorAll('.th-unite')].filter((g) => g.style.display !== 'none').length,
          fond: !!document.querySelector('.th-terre'), etape: document.querySelector('.th-compteur').textContent })`);
        ok(vu.fond && vu.etape === e + ' / ' + n, 'carte ' + id + ' étape ' + e + ' : fond ou étape ' + JSON.stringify(vu));
      }
      // l'animation complète, d'un bout à l'autre, sans erreur
      await evaluer(`(async () => { const b = document.querySelector('.theatre-commandes .bouton-icone:last-of-type'); for (let i = 0; i < ${n}; i += 1) { document.querySelector('[aria-label="Étape suivante"]').click(); await new Promise((r) => setTimeout(r, 60)); } return true; })()`);
      await attendre(400);
      if (erreurs.length) { ok(false, 'carte ' + id + ' (défilement) : ' + erreurs.join(' | ').slice(0, 300)); erreurs.length = 0; }
    }

    // 2. Hors ligne : installer, couper le serveur, rouvrir
    console.log('hors ligne');
    const sonde = await evaluer(`(async () => { try { const c = await caches.open('sonde'); await c.put('/sonde', new Response('ok')); await caches.delete('sonde'); return true; } catch (e) { return String(e); } })()`);
    if (sonde !== true) { console.log('  (API Cache indisponible dans ce Chrome sans affichage : ' + sonde + ' — épreuve hors ligne à faire dans le volet)'); }
    else {
      await aller('http://127.0.0.1:' + PORT + '/', 2500);
      const pret = await evaluer(`(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; })()`);
      ok(pret, 'service worker actif');
      await aller('http://127.0.0.1:' + PORT + '/', 1500);
      ok(await evaluer('!!navigator.serviceWorker.controller'), 'la page est servie par le service worker');
      const caches1 = await evaluer(`(async () => (await caches.keys()))()`);
      ok(caches1.some((c) => /^an1870-coquille-/.test(c)), 'cache de la coquille : ' + caches1.join(', '));
      await serveur.arreter();
      serveur = null;
      await aller('http://127.0.0.1:' + PORT + '/#/', 1500);
      await verifier('hors ligne : accueil', 300);
      await ancre('#/a/' + donnees.articles[0], 300);
      await verifier('hors ligne : article', 300);
      await ancre('#/t/' + donnees.textes[0], 300);
      await verifier('hors ligne : texte', 200);
      for (const [id] of donnees.cartes) {
        await ancre('#/cartes?c=' + id, 1200);
        ok(await evaluer(`!!document.querySelector('.th-terre')`), 'hors ligne : fond de la carte ' + id);
      }
      erreurs.length = 0;
    }
  } finally {
    if (page) page.fermer();
    chrome.kill();
    if (serveur) await serveur.arreter();
    await attendre(400);
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch (e) { /* Chrome tient encore le profil */ }
  }
  console.log('\n' + reussites + ' épreuves réussies, ' + echecs + ' échec(s)');
  process.exitCode = echecs ? 1 : 0;
}

await main();

// Genera seo-snapshots.json: el texto y los enlaces que cada página SEO
// muestra de verdad, extraídos de la página ya renderizada en Chrome.
//
// ── Por qué ──────────────────────────────────────────────────────────────
//
// Search Console (sept. 2026): 500 URLs en el sitemap, 127 indexadas, 108
// «descubiertas: actualmente sin indexar» y ~260 que Google ni conocía. Cada
// shell de generate-seo-shells.mjs llevaba <div id="root"></div> vacío: sin
// ejecutar JavaScript no había ni texto ni ENLACES que seguir, así que Google
// descubría las páginas sólo por el sitemap y las dejaba para su segunda
// pasada de renderizado, que en un dominio joven tarda semanas. Bing y los
// rastreadores de IA no ejecutan JS en absoluto.
//
// Las páginas de Estados Unidos generan su HTML estático desde los datos
// (generate-seo-manifest.mts). El resto usa ~20 plantillas distintas; en vez
// de reescribir cada una en HTML, esto abre cada ruta en Chrome, espera a que
// React la pinte y guarda sus encabezados, párrafos, listas y enlaces como HTML
// simple. generate-seo-shells.mjs lo mete dentro de #root y createRoot() lo
// reemplaza por la página real al arrancar: es el mismo contenido que ve
// cualquier visitante, no una versión distinta para bots.
//
// ── Cuándo correrlo ──────────────────────────────────────────────────────
//
// Como sync-vercel-rewrites.mjs: en local, después de cambiar el contenido de
// alguna landing, y se sube el JSON resultante. No va dentro de `npm run
// build` porque Vercel no tiene Chrome.
//
//   npm run build
//   npx vite preview --port 4173 &
//   npm run snapshot:seo
//
// Opciones: BASE=http://localhost:4173  CHROME=/ruta/a/chrome  CONCURRENCY=6

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const BASE = process.env.BASE ?? 'http://localhost:4173';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 6);
const PORT = 9333;

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'seo-manifest.json'), 'utf-8'));
const dataBodiesPath = path.join(root, '.seo-bodies.json');
const dataBodies = fs.existsSync(dataBodiesPath) ? JSON.parse(fs.readFileSync(dataBodiesPath, 'utf-8')) : {};
// Las que ya salen de los datos no necesitan instantánea.
// La portada no está en el manifiesto (su shell es dist/index.html, ver
// generate-seo-shells.mjs) pero es la página que más importa capturar.
const rutas = ['/', ...Object.keys(manifest).filter((r) => !dataBodies[r])];

// Se ejecuta DENTRO de la página. Recorre #root en orden y devuelve HTML
// simple: sólo encabezados, párrafos, elementos de lista y enlaces internos.
const EXTRAER = `(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return '';
  // Todavía es el HTML estático del shell (lleva data-seo-static): React aún
  // no ha pintado. Capturarlo sería copiar la instantánea anterior.
  if (rootEl.querySelector('[data-seo-static]')) return '';
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const oculto = (el) => el.closest('[role="dialog"], script, style, noscript, svg, button, [aria-hidden="true"]');
  const interno = (a) => { const h = a.getAttribute('href') || ''; return h.startsWith('/') && !h.startsWith('//'); };
  // Texto de un bloque conservando sus enlaces internos.
  const aHtml = (el) => {
    let out = '';
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) out += esc(n.textContent);
      else if (n.nodeType === 1 && !oculto(n)) {
        if (n.tagName === 'A' && interno(n)) out += '<a href="' + esc(n.getAttribute('href')) + '">' + esc(n.textContent.trim()) + '</a>';
        else if (n.tagName === 'BR') out += ' ';
        else out += aHtml(n);
      }
    });
    return out.replace(/\\s+/g, ' ').trim();
  };
  const SEL = 'h1,h2,h3,h4,p,li,blockquote,dt,dd';
  const bloques = [...rootEl.querySelectorAll(SEL)].filter((el) => !oculto(el) && !el.parentElement.closest(SEL));
  const partes = [];
  const vistos = new Set();
  for (const el of bloques) {
    const html = aHtml(el);
    if (!html || vistos.has(html)) continue;
    vistos.add(html);
    const tag = el.tagName.toLowerCase();
    const t = ['h1','h2','h3','h4'].includes(tag) ? tag : (tag === 'li' || tag === 'dt' || tag === 'dd' ? 'p' : tag === 'blockquote' ? 'blockquote' : 'p');
    partes.push('<' + t + '>' + html + '</' + t + '>');
  }
  // Enlaces internos que no estaban dentro de ningún bloque (tarjetas, menús).
  const enBloques = new Set(bloques.flatMap((b) => [...b.querySelectorAll('a')]));
  const sueltos = [];
  const hrefs = new Set();
  for (const a of rootEl.querySelectorAll('a[href]')) {
    if (enBloques.has(a) || oculto(a) || !interno(a)) continue;
    const h = a.getAttribute('href');
    const t = a.textContent.replace(/\\s+/g, ' ').trim();
    if (!t || hrefs.has(h)) continue;
    hrefs.add(h);
    sueltos.push('<li><a href="' + esc(h) + '">' + esc(t.slice(0, 120)) + '</a></li>');
  }
  if (sueltos.length) partes.push('<ul>' + sueltos.join('') + '</ul>');
  const h1 = rootEl.querySelector('h1');
  return JSON.stringify({ h1: h1 ? h1.textContent.trim() : '', html: partes.join('') });
})()`;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-snap-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`,
    '--no-first-run', '--no-default-browser-check', '--window-size=1366,900', '--lang=en-US', 'about:blank',
  ], { stdio: 'ignore' });

  let version;
  for (let i = 0; i < 50 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await esperar(200); }
  }
  if (!version) throw new Error('Chrome no arrancó con depuración remota');

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pendientes = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendientes.has(msg.id)) { pendientes.get(msg.id)(msg); pendientes.delete(msg.id); }
  });
  const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const n = ++id;
    pendientes.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

  const resultado = {};
  const fallos = [];
  let hechas = 0;

  async function capturar(ruta) {
    const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
    try {
      await cdp('Page.enable', {}, sessionId);
      // Se captura lo que ve Googlebot: desde EE. UU., en inglés y en
      // escritorio. Sin esto, la portada y las páginas que eligen idioma por
      // IP salían en la versión de quien corre el script (desde Colombia, la
      // portada LatAm sin las secciones de EE. UU.).
      await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
      await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "try { localStorage.setItem('codec_language', 'en'); } catch {}" }, sessionId);
      await cdp('Page.navigate', { url: BASE + (ruta === '/' ? '/?market=us' : ruta) }, sessionId);
      // Espera a que React pinte el h1 de la página (las rutas son lazy).
      let datos = null;
      for (let i = 0; i < 40; i++) {
        await esperar(250);
        const r = await cdp('Runtime.evaluate', { expression: EXTRAER, returnByValue: true }, sessionId);
        const v = r?.result?.value ? JSON.parse(r.result.value) : null;
        if (v && v.h1 && v.html.length > 400) { datos = v; break; }
      }
      // Un segundo más para contenido que llega después del primer pintado.
      if (datos) {
        await esperar(800);
        const r = await cdp('Runtime.evaluate', { expression: EXTRAER, returnByValue: true }, sessionId);
        datos = JSON.parse(r.result.value);
      }
      if (!datos || !datos.h1) fallos.push(ruta);
      else resultado[ruta] = datos.html;
    } catch (e) {
      fallos.push(`${ruta} (${e.message})`);
    } finally {
      await cdp('Target.closeTarget', { targetId }).catch(() => {});
      hechas += 1;
      if (hechas % 25 === 0) console.log(`  ${hechas}/${rutas.length}`);
    }
  }

  const cola = [...rutas];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (cola.length) await capturar(cola.shift());
  }));

  const salida = Object.fromEntries(Object.keys(resultado).sort().map((k) => [k, resultado[k]]));
  fs.writeFileSync(path.join(root, 'seo-snapshots.json'), `${JSON.stringify(salida, null, 0)}\n`, 'utf-8');
  const kb = Math.round(fs.statSync(path.join(root, 'seo-snapshots.json')).size / 1024);
  console.log(`snapshot-seo-bodies: ${Object.keys(salida).length} páginas (${kb} KB) en seo-snapshots.json`);
  if (fallos.length) console.log(`  sin capturar (${fallos.length}): ${fallos.join(', ')}`);

  // Limpieza al final y sin poder fallar: Chrome sigue escribiendo en su
  // perfil unos instantes después de recibir la señal de cierre.
  ws.close();
  await new Promise((r) => { chrome.once('exit', r); chrome.kill(); setTimeout(r, 3000); });
  try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temporal del sistema */ }
}

main().catch((e) => { console.error(e); process.exit(1); });

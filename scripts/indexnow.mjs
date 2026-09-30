// Avisa a Bing (y a los demás buscadores de IndexNow: Yandex, Seznam, Naver)
// de las URL del sitemap, para que las rastreen sin esperar a descubrirlas.
// Bing alimenta la búsqueda de ChatGPT y Copilot, así que es también la vía
// más directa para aparecer ahí. Google no participa en IndexNow: para Google
// están el sitemap y Search Console.
//
// Correr DESPUÉS de que el despliegue esté en producción (el buscador pide la
// URL de inmediato):  npm run indexnow            → todo el sitemap
//                     npm run indexnow -- /ruta1 /ruta2   → sólo esas
//
// La clave es pública por diseño: IndexNow comprueba que el archivo
// public/<clave>.txt exista en el dominio para confirmar que el aviso es
// del dueño del sitio.

import fs from 'node:fs';
import path from 'node:path';

const HOST = 'www.codecdocument.com';
const KEY = '3c8bc16e2f1c4b6485e3e39220b914e0';

const rutas = process.argv.slice(2);
const urls = rutas.length
  ? rutas.map((r) => `https://${HOST}${r.startsWith('/') ? r : `/${r}`}`)
  : [...fs.readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// Endpoint de Bing: los avisos se comparten con todos los buscadores de
// IndexNow, y api.indexnow.org rechazaba (403) claves recién publicadas.
const res = await fetch('https://www.bing.com/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
// 200 = aceptado, 202 = recibido (se validará la clave), 422/403 = clave o URL inválidas.
console.log(`indexnow: ${urls.length} URL enviadas → HTTP ${res.status} ${res.statusText}`);
if (res.status >= 400) process.exit(1);

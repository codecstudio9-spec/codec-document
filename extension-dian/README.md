# Descargador DIAN — extensión de Chrome (beta interna)

## Por qué existe

Se verificó en vivo el 2026-08-14 que la DIAN ata el token de acceso a la
IP que lo solicitó. El proxy del servidor (`supabase/functions/dian-descargar`)
sale por las IPs compartidas de Supabase, así que ya no puede autenticar
ningún token nuevo — no importa qué tan bien imite a un navegador. Esta
extensión reemplaza esa pieza: corre dentro del Chrome del propio contador,
así que la petición sale genuinamente de su IP.

## Cómo instalarla (modo desarrollador — no está publicada en la Chrome Web Store todavía)

1. Abre `chrome://extensions`.
2. Activa "Modo de desarrollador" (esquina superior derecha).
3. "Cargar descomprimida" → selecciona esta carpeta (`extension-dian/`).
4. Aparece el ícono de Codec Document en la barra de extensiones. Anclarlo
   (el ícono del pin) para tenerlo a mano.

## Cómo se usa

Igual que el panel "Descargar de la DIAN" de la app web:

1. Entra al portal de la DIAN, solicita un token, copia el enlace del correo
   ("Ingrese aquí" → clic derecho → Copiar dirección del enlace).
2. Abre el ícono de la extensión, pega el enlace, dale a "Probar".
3. Exporta el listado de CUFEs del período desde el portal de la DIAN y
   pégalos en la lista.
4. "Iniciar descarga". Los archivos quedan en `Descargas/DIAN/` de tu
   computador — luego se arrastran a "Subir mis XML" en Codec Document,
   igual que cualquier XML que ya tuvieras en el disco.

Si el token vence a mitad de una descarga larga, pide uno nuevo, pégalo, y
dale a "Iniciar" otra vez: no repite lo que ya bajó — lo identifica por la
lista de CUFEs, no por el enlace (que siempre es nuevo).

## Qué NO hace (a propósito, para este MVP)

- No sube nada a Codec Document por su cuenta. El paso de arrastrar la
  carpeta sigue siendo manual.
- No pide una carpeta de destino: usa siempre `Descargas/DIAN/` porque la
  API de descargas de una extensión no tiene el mismo selector de carpetas
  que sí tiene la pestaña del navegador (File System Access API).
- No está publicada en la Chrome Web Store. Para un puñado de contadores en
  beta, "cargar descomprimida" es más rápido que esperar la revisión de
  Google. Publicarla es un paso aparte si esto escala.

## Piezas

- `manifest.json` — Manifest V3. `host_permissions` limitado a los cuatro
  dominios de la DIAN (mismo allowlist que tenía el proxy del servidor).
- `background.js` — el service worker. Abre sesión con el enlace del token
  y descarga cada CUFE, ambos con `credentials: 'include'` — el navegador
  guarda y reenvía la cookie de sesión solo, no hay que capturarla a mano
  como sí tocaba hacer en Deno.
- `dian.js` — regex de CUFE, validación de host, y construcción de la URL
  de descarga. Calcado a propósito de `dian-descargar/index.ts`: es la
  misma regla de dominio, no debería divergir.
- `popup.html` / `popup.js` — la interfaz.

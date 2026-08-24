# Descargador DIAN — extensión de Chrome (beta interna)

## Por qué NO se usa el web service oficial de la DIAN (investigado 2026-08-23)

Antes de reconstruir esto se investigó si `GetXmlByDocumentKey` (parte de
`WcfDianCustomerServices.svc`, `https://vpfe[-hab].dian.gov.co/`) podía
reemplazar la automatización de portal. Según la guía oficial de la DIAN
("Herramienta para el Consumo de Web Services"), ese servicio SOAP se
autentica con **WS-Security Signature usando un certificado digital X.509
(.p12) emitido por una entidad certificadora autorizada por ONAC** — un
certificado que pertenece al NIT registrado como facturador electrónico, no
al del contador que consulta. Es un mecanismo de autenticación totalmente
distinto del enlace de token que llega por correo (ese es una cookie de
sesión ASP.NET para el portal humano `catalogo-vpfe`, no sirve para SOAP).

Un contador que gestiona documentos *recibidos* de decenas de NITs de
clientes distintos tendría que custodiar el certificado privado (+ PIN) de
cada uno de esos clientes dentro de la extensión para usar esa vía — mucho
más riesgo de custodia de credenciales que lo que ya evita el diseño
actual, e inviable operativamente a la escala que busca Codec. Por eso se
descartó sin prototipo: no había forma legítima de probarlo sin pedirle a
un cliente real su certificado privado.

## Por qué existe (la vía que sí se usa)

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

## Cómo descarga cada documento (desde 2026-08-18)

Se verificó en vivo que el botón de descargar del propio portal de la DIAN
llama a `Document/DownloadZipFiles?trackId=<CUFE>&captcha=<token>`, y ese
`captcha` es un token de Cloudflare Turnstile que la página resuelve sola al
cargar. No hay forma de fabricar ese token desde un service worker (no tiene
DOM), así que la extensión ya NO arma esa URL a mano: abre una pestaña real
oculta sobre "Documentos recibidos", busca cada CUFE por su campo "Código
único" (el mismo formulario del portal) y hace clic en el botón real de esa
fila — igual que lo haría un contador, sólo que automatizado. El Turnstile
se resuelve solo, una vez por pestaña, no por documento.

Es más lento que una petición directa (cada CUFE es una búsqueda real en el
portal, unos segundos), pero es lo único que no depende de romper ni de
adivinar nada.

## Piezas

- `manifest.json` — Manifest V3. `host_permissions` limitado a los cuatro
  dominios de la DIAN (mismo allowlist que tenía el proxy del servidor).
  Permiso `scripting` para poder buscar y hacer clic dentro de la pestaña
  real de la DIAN. Permiso `alarms` para sobrevivir a que Chrome mate el
  service worker a mitad de un lote largo (ver abajo).
- `background.js` — el service worker. Sólo enruta mensajes; toda la
  lógica vive en los tres módulos siguientes.
- `dian-session.js` — abre sesión con el enlace del token (pestaña real, no
  `fetch()`).
- `download-worker.js` — procesa UN CUFE de punta a punta en su propia
  pestaña: máquina de estados explícita (`PREPARANDO_PESTANA` →
  `CONSULTANDO` → `ESPERANDO_RESULTADO` → `DESCARGANDO` →
  `VERIFICANDO_ARCHIVO` → `COMPLETADO`/`ERROR_*`), cada paso con su propio
  tope de tiempo más un tope total de respaldo. **Antes de cada CUFE —
  también tras uno exitoso, no sólo en error — recarga entera "Documentos
  recibidos" desde cero**, para que un resultado de búsqueda del CUFE
  anterior no pueda seguir vivo en el DOM cuando arranca el siguiente (esa
  era la sospecha más probable de por qué el primer CUFE bajaba bien y el
  resto fallaba, aunque no se pudo confirmar en vivo sin un token real).
- `download-manager.js` — la cola: reintentos con espera creciente por
  CUFE (nunca inmediata), persistencia en `chrome.storage.local`,
  correlación exacta descarga↔CUFE por callback del worker (no por adivinar
  la URL), auto-baja la concurrencia si la DIAN pide verificación humana, y
  se revive sola vía `chrome.alarms` si el service worker muere a mitad de
  un lote de horas — reconstruye la cola desde `chrome.storage` sin que el
  popup tenga que seguir abierto.
- `dian.js` — regex de CUFE, validación de host. Calcado a propósito de
  `dian-descargar/index.ts`: es la misma regla de dominio, no debería
  divergir.
- `popup.html` / `popup.js` — la interfaz.

## Limitaciones conocidas (a propósito, no implementadas todavía)

- **Verificación de contenido real del XML**: hoy se descarta un archivo
  por MIME (`text/html` → probable bloqueo) y por tamaño mínimo, pero no se
  abre el archivo para confirmar que es XML bien formado ni que el CUFE de
  adentro coincide con el pedido. Una extensión MV3 no puede leer del disco
  lo que ella misma acaba de guardar sin permisos nativos adicionales. La
  alternativa técnicamente correcta (leer el botón de descarga ya resuelto
  por Turnstile, hacer `fetch()` del mismo enlace desde la pestaña para
  traer los bytes ANTES de guardarlos, y sólo entonces escribir el archivo
  ya validado) no se implementó porque el endpoint se llama
  `DownloadZipFiles` — probablemente entrega un ZIP, y desempaquetar un ZIP
  dentro de la extensión requeriría vendorizar una librería de
  descompresión sin poder probarla contra una respuesta real de la DIAN en
  este entorno. Queda para cuando haya una sesión real para probarlo.
- **ZIP final del lote**: no implementado. Requiere leer de vuelta los
  archivos ya guardados en `Descargas/DIAN/`, algo que un service worker
  MV3 no puede hacer sin la File System Access API (que sólo existe en una
  página, no en el service worker) o sin vendorizar otra librería sin
  poder probarla en vivo.
- **Detección automática de CUFEs desde el Excel/portal**: sigue siendo
  copiar/pegar a propósito (ver PARTE 16 del pedido original: no
  implementar hasta que la descarga básica esté sólida).
- **Concurrencia adaptativa**: `numWorkers` es configurable (1-5) y se
  AUTO-reduce a 1 en cuanto la DIAN pide verificación humana (para el
  resto de esa corrida), pero no auto-escala hacia arriba sola dentro de
  una corrida — subir de 1 a 2+ workers sigue siendo una decisión manual
  del usuario, probada primero en tandas chicas.

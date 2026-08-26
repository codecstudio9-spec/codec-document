# Descargador DIAN — extensión de Chrome (beta interna)

## Auditoría 2026-08-25 — "0 XML en Descargas/DIAN" + "El campo de seguridad no está completo"

En una prueba con ~59 CUFEs, la cola corría (consultaba, reintentaba) pero
**0 archivos aparecían realmente en `Descargas/DIAN/`**, y la DIAN mostraba
repetidamente: *"El campo de seguridad no está completo. Por favor espere
que se cargue la página."*

**Diagnóstico del flujo completo** (token → sesión → pestaña → página lista
→ seguridad lista → CUFE → buscar → resultado → descargar →
`chrome.downloads` → archivo físico): el punto de quiebre es entre "página
lista" y "seguridad lista" — la v2.1 los trataba como el mismo paso
(esperaba sólo a que la pestaña terminara de cargar, después hacía clic en
Buscar de inmediato). Ese mensaje de seguridad nunca estaba en
`FRASES_BLOQUEO`, así que cuando aparecía cada intento se perdía como un
`ERROR_REINTENTABLE` genérico e indistinguible de cualquier otro fallo — de
ahí que el registro no dejara ver dónde se rompía cada CUFE.

**Hipótesis principal (no confirmada aún en vivo — hace falta un token real
para probarla):** es públicamente confirmado que la DIAN añadió un filtro
de seguridad **operado por Microsoft** que puede dejar a usuarios reales
atrapados en un bucle de validación ([El Tiempo, agosto 2026][el-tiempo] —
la propia cuenta oficial de la DIAN pidió disculpas por el incidente). Ese
tipo de filtro suele depender de que la página esté *visible* (Page
Visibility API) para terminar de resolverse — y Chrome estrangula
temporizadores y `requestAnimationFrame` en cualquier pestaña abierta con
`active: false`, que es como esta extensión abría TODAS sus pestañas hasta
la v2.1. Herramientas de escritorio como QFe Collector automatizan un
navegador real y visible, nunca una pestaña oculta — coincide con la
hipótesis.

[el-tiempo]: https://www.eltiempo.com/economia/finanzas-personales/usuarios-reportan-fallas-en-la-plataforma-de-facturacion-electronica-de-la-dian-por-bucle-en-la-validacion-de-seguridad-brindo-numeros-de-atencion-3567952

**Cambios de la v2.2 mientras se confirma en vivo:**

1. Cada worker (y la pestaña de autenticación) abre su propia **ventana** de
   Chrome — no una pestaña oculta dentro de la ventana principal. Con
   `focused: false` para no robarle el foco al usuario, pero la pestaña sí
   queda "visible" para Chrome. Ver `_crearPestana` en `download-worker.js`
   y `abrirSesion` en `dian-session.js`.
2. "La página cargó" y "el campo de seguridad terminó de cargar" son ahora
   dos pasos EXPLÍCITOS y distintos (`PREPARANDO_PESTANA` →
   `ESPERANDO_SEGURIDAD` → `CONSULTANDO`), en vez de asumir que uno implica
   el otro. Ver `_esperarSeguridadLista`.
3. Taxonomía de errores granular (`CODIGOS_ERROR` en `download-worker.js`):
   `ERROR_PAGINA`, `ERROR_SEGURIDAD`, `ERROR_BUSQUEDA`, `ERROR_RESULTADO`,
   `ERROR_DESCARGA`, `ERROR_ARCHIVO`, `ERROR_TIMEOUT`, `ERROR_BLOQUEO` — ya
   no un único "ERROR_REINTENTABLE" para todo. Visible en el registro del
   popup (`[CÓDIGO] detalle`) y en la columna `codigo_error` del CSV
   exportado.

**Cómo probarlo (necesita un token real — no se pudo verificar en vivo en
este entorno):**

1. Cargar la extensión actualizada (`chrome://extensions` → recargar).
2. Probar con un lote CHICO primero (5-10 CUFEs, 1 worker) — no 5.000. Si
   siguen apareciendo `[ERROR_SEGURIDAD]` en el registro, la hipótesis de
   arriba está incompleta y hace falta ver la página en vivo (inspeccionar
   qué exactamente populate ese "campo de seguridad" — probablemente un
   `iframe`/script del filtro de Microsoft, no necesariamente Cloudflare).
3. Confirmar el único criterio real de éxito: ¿aparecieron archivos XML/ZIP
   físicos en `Descargas/DIAN/`? No cuenta como éxito que el popup muestre
   "completado" sin ese archivo.
4. Si el problema persiste igual con ventanas visibles, el siguiente sospechoso
   a investigar (con sesión real) es si `#DocumentKey`/`.btn-search` siguen
   siendo los selectores correctos — la DIAN pudo haber cambiado el HTML del
   formulario junto con el nuevo filtro de seguridad.

## Auditoría 2026-08-25(b) — confirmado en vivo: el clic en "Descargar" no bastaba

Con el cambio de arriba (ventanas visibles) SÍ se avanzó: la búsqueda y el
resultado ya funcionan. Pero apareció un fallo nuevo y consistente:
`[ERROR_DESCARGA] La DIAN no entregó nada tras hacer clic en descargar
(tiempo agotado)`. El clic no arroja ningún error — el botón existe,
`boton.click()` "funciona" — pero la DIAN nunca entrega el archivo.

**Causa:** `boton.click()` disparado desde `chrome.scripting.executeScript`
es un evento SINTÉTICO — `event.isTrusted` vale `false` siempre, sin
excepción posible desde JavaScript (esto no es specific de la DIAN, es una
garantía del propio navegador). Eso alcanza para enviar el formulario de
búsqueda, pero el botón de descargar está detrás de un token de Cloudflare
Turnstile — y es común que ese tipo de verificación exija un gesto
realmente confiable antes de entregar el archivo.

**Fix (v2.3):** el clic en "Descargar" ahora se dispara por el Protocolo de
DevTools de Chrome (`chrome.debugger` + `Input.dispatchMouseEvent`), que sí
produce `isTrusted: true` porque ocurre al nivel del propio navegador, no
de la página — la misma técnica que usan por debajo Puppeteer/Playwright
(y, casi seguro, herramientas como QFe Collector). Ver
`_adjuntarDebugger`/`_clicReal` en `download-worker.js`.

**Contrapartida honesta:** esto agrega el permiso `debugger` al manifest, y
mientras la extensión trabaja, Chrome muestra una barra amarilla
"...está depurando este navegador" en la parte superior — visible a
propósito, no se puede (ni se debe) ocultar. Si el usuario le da a
"Cancelar" en esa barra, el worker pierde el clic real para ese CUFE
(queda como ERROR_DESCARGA y reintenta más tarde, readjuntando solo).

**Sigue sin confirmarse el criterio final** — falta que un lote real
termine con archivos físicos en `Descargas/DIAN/`.

## Auditoría 2026-08-25(c) — confirmado en vivo: la causa real no era Turnstile, era el propio `chrome.debugger`

El clic real de la sección anterior seguía sin funcionar. La consola de
errores de la extensión (`chrome://extensions` → "Errores" en la tarjeta
de Codec Document) mostró la causa exacta:

> Unchecked runtime.lastError: Debugger is not attached to the tab with id: `<N>`.

Chrome suelta la sesión de `chrome.debugger` sola en algún punto entre
CUFEs — lo más probable, el reload de página que `_prepararPestanaLimpia`
hace SIEMPRE antes de cada CUFE (una navegación completa puede invalidar
la sesión de depuración aunque la pestaña sea la misma). El código
adjuntaba el debugger una sola vez por pestaña y confiaba en que seguía
adjunto — así que el clic real intentaba usar una sesión que ya no
existía, sin que nada lo detectara ni lo reintentara.

**Fix:** ahora se adjunta de nuevo ANTES DE CADA clic (tolerando el error
de "already attached" como éxito, no como fallo), y si el clic mismo topa
con "not attached" se reintenta una vez tras re-adjuntar. Ver
`_adjuntarDebugger`/`_clicReal` en `download-worker.js`.

**Cómo revisar la consola de errores de la extensión** (útil para
cualquier futuro fallo silencioso de una API de Chrome, no sólo éste):
`chrome://extensions` → tarjeta de Codec Document → botón "Errores".

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

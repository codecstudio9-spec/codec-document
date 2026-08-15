# Ficha para publicar en la Chrome Web Store

Todo lo de aquí es texto para copiar y pegar en el panel de developer.chrome.com/webstore/devconsole cuando crees la cuenta de desarrollador (5 USD, pago único, con tu cuenta de Google). Yo no puedo crear la cuenta ni pagar por ti — eso queda para ti.

Recomendación: publícala como **"No listada" (Unlisted)** mientras estés en beta con pocos contadores. No aparece en búsquedas, pero cualquiera con el enlace directo la instala con un clic. Cuando quieras que cualquiera la encuentre buscando "Codec Document" o "descargar XML DIAN", la pasas a "Pública" sin tener que volver a subir nada.

---

## Nombre del producto
Codec Document — Descargador DIAN

## Resumen (132 caracteres máx.)
Descarga tus documentos electrónicos de la DIAN a tu computador, desde tu propio navegador — no un servidor compartido.

## Categoría
Productividad

## Idioma
Español (Colombia)

## Descripción detallada

```
Descarga tus facturas, notas crédito/débito y documentos equivalentes electrónicos directamente desde el portal de la DIAN, usando el enlace de token que te llega por correo — sin instalar programas de escritorio ni depender de un servidor compartido.

¿Por qué una extensión y no una web?

La DIAN ata el token de acceso a la computadora que lo solicitó. Un servicio web tradicional, que corre en un servidor compartido, ya no puede autenticar ese token — la DIAN lo rechaza sin importar qué tan bien se disfrace de navegador. Esta extensión resuelve eso corriendo dentro de TU Chrome, con tu propia conexión: la DIAN la ve exactamente como lo que es, tú navegando.

Cómo funciona

1. Pide un token en el portal de la DIAN — te llega un enlace al correo.
2. Abre el ícono de Codec Document en tu barra de Chrome, pega el enlace y dale a Probar.
3. Exporta el listado de CUFEs del período que necesitas desde el portal de la DIAN, y pégalos en la lista.
4. Dale a Iniciar descarga. Los archivos (ZIP y XML) quedan en tu carpeta de Descargas, dentro de una carpeta llamada DIAN.

Si el token vence a mitad de una descarga larga (dura 60 minutos y sirve una sola vez), pide otro, pégalo, y continúa — no repite lo que ya bajó.

Privacidad

No sube nada a ningún servidor por su cuenta. El único tráfico que genera es entre tu navegador y los dominios oficiales de la DIAN. Ver la política completa: https://www.codecdocument.com/privacidad-extension-dian

Hecha por Codec Document (codecdocument.com), plataforma de firma electrónica y automatización contable para Colombia y Latinoamérica.
```

## Justificación de permisos (pestaña "Privacy practices" del panel)

**host_permissions — catalogo-vpfe.dian.gov.co y dominios equivalentes de la DIAN**
> La extensión necesita hacer peticiones directas a los servidores de la DIAN para autenticar el token del usuario y descargar sus propios documentos electrónicos. Sin este permiso, el navegador bloquearía la petición por política de mismo origen (CORS).

**downloads**
> Se usa para guardar los documentos descargados (ZIP/XML) en la carpeta de Descargas del usuario, dentro de una subcarpeta "DIAN". Es la única forma de entregarle al usuario los archivos que pidió.

**storage**
> Se usa para recordar, en el propio computador del usuario, qué documentos ya se descargaron dentro de un lote — así, si el token vence a mitad de una descarga larga, se puede continuar sin repetir lo ya bajado. No sale de la máquina del usuario.

**cookies**
> Se usa únicamente para comprobar si la sesión abierta con la DIAN sigue activa (existe la cookie de sesión y no está vencida), y así poder avisarle al usuario si el enlace del token todavía sirve. No se leen ni se envían los valores de las cookies a ningún sitio.

**externally_connectable (codecdocument.com)**
> Permite que la aplicación web de Codec Document le pregunte a la extensión "¿estás instalada?" para guiar al usuario correctamente (mostrarle instrucciones de instalación o confirmar que ya puede usarla). Es un solo mensaje de ida y vuelta; no le da a la página web ningún acceso a la sesión de la DIAN ni a los archivos descargados.

## Declaración de uso de datos (formulario de Chrome Web Store)

Al llenar el formulario "Does your extension collect or use user data?": marcar que **NO** se recopilan datos personales, financieros, de salud, ubicación, historial web, ni contenido de comunicaciones. La única información que la extensión maneja (el enlace del token, los CUFEs, y si hay sesión activa con la DIAN) se queda en el propio computador del usuario — no se transmite a Codec Document ni a ningún tercero.

URL de política de privacidad a pegar en el formulario:
**https://www.codecdocument.com/privacidad-extension-dian**

## Assets que necesita el formulario

- [x] Ícono 128×128 — ya está en `extension-dian/icons/icon-128.png`
- [ ] Al menos 1 captura de pantalla (1280×800 o 640×400, PNG o JPEG sin transparencia) — pendiente, tomar una del popup abierto mostrando el flujo (enlace pegado + "El enlace funciona").
- [ ] Tile promocional pequeño 440×280 (opcional pero recomendado) — pendiente.

## Antes de subir el paquete

Subir el `.zip` de `public/descargas/codec-document-descargador-dian.zip` (o volver a empacar `extension-dian/` si hubo cambios después). El ID quedará fijo en `nikdagbmkbmbmnmgcalhmhnhmgkconon` gracias a la clave en `manifest.json` — no cambia aunque la subas desde otro computador.

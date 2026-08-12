/**
 * 12 páginas SEO por NECESIDAD para contadores en Colombia.
 *
 * Las otras doce (contador-dian-seo-content.ts) van por ciudad. Éstas van por
 * lo que el contador escribe en Google cuando tiene el problema delante.
 *
 * ── Cómo se eligieron, y qué NO se sabe ─────────────────────────────────
 *
 * No hay aquí datos de volumen de búsqueda: eso se mide con Search Console y
 * con la propia herramienta de Google, y hay que contrastarlo con el tráfico
 * real. Lo que sí se puede razonar es la INTENCIÓN, que es lo que decide si
 * una página responde o no a la búsqueda:
 *
 *   Informacional  «cómo descargar los XML de la DIAN», «qué es el CUFE»
 *                  Busca entender. Llega mucha gente, convierte poco, pero es
 *                  donde se construye autoridad y donde entra el contador que
 *                  todavía no sabe que existe una herramienta.
 *
 *   Transaccional  «descargador masivo DIAN», «programa para bajar facturas»
 *                  Ya sabe que quiere una herramienta. Menos visitas, mucha
 *                  más conversión.
 *
 *   Comparativa    «importar facturas a Siigo», «pasar XML a World Office»
 *                  Tiene un software concreto y busca cómo conectarlo. Es la
 *                  intención más rentable: el problema ya está definido.
 *
 * Las doce se reparten entre las tres para no competir entre ellas. Dos
 * páginas que responden la misma pregunta se canibalizan y ninguna sube.
 *
 * Cada página tiene además su propio ángulo dentro del mismo producto, para
 * que no sean el mismo texto con otro título — la regla de contenido único de
 * CLAUDE.md aplica igual aquí que en las páginas por ciudad.
 */

import type { CiudadContadorSeo } from './contador-dian-seo-content';

/**
 * Misma forma que las páginas por ciudad, para poder reusar la plantilla.
 *
 * `ciudad` y `departamento` no aplican y se dejan vacíos; el componente sólo
 * los usa para el listado de otras ciudades, que estas páginas no muestran.
 * `heroSector` pasa a ser la intención de búsqueda —«Descarga masiva»,
 * «Conversión a Excel»— que es lo que identifica a la página.
 */
export type NecesidadContadorSeo = CiudadContadorSeo & {
  /** Qué tipo de búsqueda responde. Sirve para no repartir mal los enlaces
   *  internos: una página informacional debe enlazar a una transaccional, no
   *  a otra informacional. */
  intencion: 'informacional' | 'transaccional' | 'comparativa';
};

const F = (a: string, b: string, c: string): [string, string, string] => [a, b, c];

export const NECESIDADES_CONTADOR: NecesidadContadorSeo[] = [
  // ── INFORMACIONAL ──────────────────────────────────────────────────────
  {
    slug: 'como-descargar-xml-de-la-dian',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#2563EB',
    titleTag: 'Cómo descargar los XML de la DIAN paso a paso (2026) | Codec Document',
    metaDescription: 'Guía real para descargar los XML de tus facturas electrónicas en el portal de la DIAN: cómo pedir el token, por qué vence en 60 minutos y cómo bajar cientos de documentos sin hacerlo uno por uno.',
    h1Accent: 'Cómo descargar los XML',
    h1Rest: 'de la DIAN, paso a paso',
    heroSector: 'Guía práctica',
    subtitulo: 'Lo que el portal no explica: el token, el listado, y por qué bajar cien documentos toma una tarde entera.',
    intro: 'Descargar un documento electrónico de la DIAN parece sencillo hasta que hay que descargar trescientos. El portal de facturación electrónica permite consultar y bajar los documentos que emitiste y recibiste, pero está diseñado para consultar de a uno: cada archivo se descarga por separado, en su propio comprimido, y el acceso caduca a los sesenta minutos. Esta guía explica el procedimiento real, con los pasos que el manual oficial da por supuestos, y dónde está el punto en el que la mayoría de los contadores pierde la tarde.',
    sectorTitulo: 'El token: la parte que confunde a todos',
    sectorTexto: 'El acceso al catálogo de documentos no se hace con usuario y contraseña sino con un token que la DIAN envía por correo. Ese enlace autentica la sesión, no descarga nada: mucha gente lo abre esperando que aparezcan sus facturas y se encuentra con una pantalla vacía. Además vive sesenta minutos y funciona una sola vez, así que si se vence a mitad de una descarga larga hay que solicitar otro y empezar de nuevo.',
    dolores: [
      { titulo: 'El enlace del correo autentica, no descarga', texto: 'Al abrirlo se abre la sesión en el catálogo. Los documentos hay que buscarlos y bajarlos después, dentro de esa misma ventana de tiempo.' },
      { titulo: 'Sesenta minutos y un solo uso', texto: 'Si el token vence, o si ya se usó, el enlace deja de servir y hay que volver al portal a pedir otro. En descargas de varios cientos de documentos, esto pasa casi siempre.' },
      { titulo: 'Un comprimido por documento', texto: 'No hay opción de «descargar todo». Cada documento se baja por separado, y cada uno viene dentro de su propio ZIP que después hay que descomprimir.' },
    ],
    respuesta: 'El procedimiento manual es correcto pero no escala: sirve para consultar un documento puntual, no para el cierre mensual. Lo que sí escala es automatizar la parte repetitiva —pedir cada documento a partir de su CUFE— y dejar en manos del contador sólo lo que exige su criterio: revisar lo que no cuadra.',
    caso: {
      titulo: 'Los pasos reales, sin adornos',
      texto: 'Entrar al portal de facturación electrónica de la DIAN con tu certificado o tu usuario. Ir a la sección de documentos recibidos o emitidos según lo que necesites. Solicitar el token y esperar el correo, que puede tardar unos minutos. Abrir el correo, hacer clic derecho sobre el enlace y copiar la dirección: ese enlace es el que da acceso. Filtrar por el periodo que vas a trabajar y exportar el listado, que trae los CUFE. Y a partir de ahí, descargar. Es en ese último paso donde el trabajo deja de ser un trámite y se convierte en una tarde: cada documento, su comprimido, su descompresión y su lectura.',
      antes: 'Un documento por vez, dentro de una ventana de 60 minutos',
      despues: 'La lista de CUFE pegada una sola vez, y los documentos bajando solos a tu carpeta',
    },
    fotos: F('/images/seo/dashboard-desk.jpg', '/images/seo/office-tablet-woman.jpg', '/images/seo/app-man-blue.jpg'),
    cierre: 'Conviene entender el procedimiento manual aunque después se automatice, porque explica los límites: el token seguirá siendo temporal, la DIAN seguirá entregando un archivo por documento y el XML seguirá siendo el documento con validez legal. Lo que cambia al automatizar no son las reglas, es quién hace el trabajo repetitivo dentro de ellas. Y hay una consecuencia práctica: quien entiende el flujo detecta antes cuándo algo va mal —un token que no abre sesión, un periodo mal filtrado, un documento que la DIAN no tiene— en vez de suponer que el problema es de la herramienta.',
    faq: [
      { q: '¿Cuánto dura el token de la DIAN?', a: 'Sesenta minutos, y funciona una sola vez. Si se vence a mitad de una descarga hay que solicitar uno nuevo desde el portal y volver a empezar con ese enlace.' },
      { q: '¿Puedo descargar todas mis facturas de una vez desde el portal?', a: 'No. El portal entrega un comprimido por documento. Para bajar cientos hay que repetir el proceso o usar una herramienta que lo haga por ti a partir de la lista de CUFE.' },
      { q: '¿El XML o el PDF? ¿Cuál es el documento válido?', a: 'El XML. El PDF es una representación gráfica; el documento con validez legal y con la información completa —CUFE, códigos de impuesto, bases— es el XML.' },
    ],
  },
  {
    slug: 'que-es-el-cufe-factura-electronica',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#4F46E5',
    titleTag: 'Qué es el CUFE y para qué sirve en la factura electrónica | Codec Document',
    metaDescription: 'El CUFE es la huella única de cada factura electrónica en Colombia. Qué es, dónde encontrarlo, cómo se usa para verificar un documento ante la DIAN y por qué es la clave para descargar en lote.',
    h1Accent: 'Qué es el CUFE',
    h1Rest: 'y por qué lo necesitas',
    heroSector: 'Concepto clave',
    subtitulo: 'La huella única de cada factura electrónica: dónde está, qué garantiza y qué se puede hacer con ella.',
    intro: 'El CUFE —Código Único de Factura Electrónica— es una cadena de caracteres que identifica de forma irrepetible a cada factura emitida en Colombia. No es un consecutivo ni un número interno: se calcula a partir del contenido del propio documento, de modo que cualquier cambio en la factura produciría un CUFE distinto. Esa propiedad es la que lo convierte en la prueba de que un documento es auténtico y no fue alterado después de emitirse.',
    sectorTitulo: 'Para qué sirve, más allá de la teoría',
    sectorTexto: 'En el día a día contable el CUFE cumple tres funciones muy concretas: permite verificar ante la DIAN que una factura existe y fue aceptada, permite localizar un documento entre miles sin depender del número ni del proveedor, y es la clave con la que se solicita cada documento al catálogo. Esa última función es la que casi nadie aprovecha, y es la que permite descargar cientos de documentos sin buscarlos de a uno.',
    dolores: [
      { titulo: 'Se confunde con el número de la factura', texto: 'El número lo asigna el emisor y puede repetirse entre proveedores. El CUFE es único en todo el país, y por eso sirve para identificar sin ambigüedad.' },
      { titulo: 'Está en el XML, no siempre visible en el PDF', texto: 'Muchos formatos gráficos lo muestran en letra pequeña o dentro del código QR. En el XML siempre está, en su propio campo.' },
      { titulo: 'Se copia mal cuando se transcribe a mano', texto: 'Son casi cien caracteres. Copiarlo a mano garantiza errores, y un CUFE mal escrito no encuentra nada.' },
    ],
    respuesta: 'Si exportas el listado de tus documentos desde el portal de la DIAN, ese archivo trae la columna de CUFE. Con esa lista se puede pedir cada documento de forma automática, sin buscarlos uno por uno: es exactamente lo que hace la descarga masiva, y por eso el CUFE deja de ser un dato técnico y pasa a ser la llave del trabajo del mes.',
    caso: {
      titulo: 'Cómo se ve y dónde encontrarlo',
      texto: 'El CUFE es una cadena hexadecimal de noventa y seis caracteres, resultado de aplicar una función criptográfica —SHA-384— sobre datos concretos de la factura: el número, las fechas, los valores, el NIT del emisor y del adquiriente, y la clave técnica del emisor. Cambiar cualquiera de esos datos produce un CUFE completamente distinto, y ahí está su valor probatorio. Lo encuentras en el XML dentro del campo correspondiente, en la representación gráfica en PDF —normalmente al pie o dentro del QR— y en el listado que exportas desde el portal de la DIAN, que es la forma más práctica de tenerlos todos juntos.',
      antes: 'Un dato técnico que se ignora',
      despues: 'La llave para verificar y para descargar cientos de documentos de una vez',
    },
    fotos: F('/images/seo/app-woman-tech-blue.jpg', '/images/seo/tablet-review-woman.jpg', '/images/home/templates-meeting.jpg'),
    cierre: 'Para el trabajo diario conviene tratar el CUFE como se trata un número de cuenta: no se transcribe, se copia. Y no se guarda suelto en una hoja sin contexto, sino junto al documento al que pertenece. Cuando cada documento procesado conserva su CUFE, responder un requerimiento deja de ser una búsqueda en carpetas y pasa a ser una consulta. Es una diferencia pequeña en el momento del registro y enorme dos años después, cuando alguien pide el soporte de una operación concreta y hay que encontrarla entre miles.',
    faq: [
      { q: '¿El CUFE y el CUDE son lo mismo?', a: 'No exactamente. El CUFE identifica facturas electrónicas de venta; el CUDE cumple la misma función para otros documentos, como las notas crédito y débito o el documento soporte. La lógica es idéntica: una huella única calculada sobre el contenido.' },
      { q: '¿Puedo verificar una factura solo con el CUFE?', a: 'Sí. La DIAN permite consultar la validez de un documento a partir de su CUFE, que es la forma de comprobar que existe y fue aceptado.' },
      { q: '¿De dónde saco la lista de CUFE de mis facturas?', a: 'Del listado que exportas desde el portal de facturación electrónica, filtrando por el periodo. Ese archivo trae la columna con todos los CUFE del periodo.' },
    ],
  },
  {
    slug: 'documento-soporte-electronico-dian',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#0891B2',
    titleTag: 'Documento soporte electrónico DIAN: qué es y cómo manejarlo | Codec Document',
    metaDescription: 'Qué es el documento soporte en adquisiciones a no obligados a facturar, en qué se diferencia de una factura electrónica y cómo procesarlo sin confundirlo al registrar y declarar.',
    h1Accent: 'Documento soporte',
    h1Rest: 'en compras a no obligados a facturar',
    heroSector: 'Tipo de documento',
    subtitulo: 'Cuándo se emite, en qué se diferencia de una factura y por qué mezclarlos distorsiona la declaración.',
    intro: 'Cuando una empresa le compra a alguien que no está obligado a facturar electrónicamente —un productor agrícola, una persona natural del régimen simple, un proveedor pequeño— el comprador debe generar un documento soporte electrónico para poder tomar ese costo o gasto. Es un documento con validez propia, con su estructura XML y su código único, y llega mezclado con las facturas en la misma descarga del portal. Distinguirlo bien no es un detalle formal: determina cómo se declara.',
    sectorTitulo: 'Por qué no se puede tratar como una factura',
    sectorTexto: 'Una factura electrónica la emite el vendedor; el documento soporte lo emite el comprador. Eso cambia quién responde por su contenido, qué retenciones aplican y cómo se refleja en la declaración. Cuando ambos terminan resumidos en la misma hoja de cálculo sin distinguir el tipo, la contabilidad pierde esa diferencia y la declaración se arma sobre una base equivocada.',
    dolores: [
      { titulo: 'Llegan mezclados en la misma descarga', texto: 'El portal entrega todo junto. Separarlos es un paso previo que consume tiempo antes siquiera de empezar a registrar.' },
      { titulo: 'Se declaran distinto', texto: 'El tratamiento tributario no es el mismo, y la diferencia sólo se ve si el tipo de documento quedó registrado.' },
      { titulo: 'Son frecuentes en agro y servicios', texto: 'En sectores donde se compra a personas naturales, el documento soporte puede ser la mayor parte del volumen del mes.' },
    ],
    respuesta: 'La clasificación por tipo se puede resolver leyendo el propio documento: el XML declara qué es. Cuando esa lectura es automática, el documento soporte queda separado desde el primer momento, con su propio conteo y su propia hoja, y deja de depender de que alguien recuerde distinguirlo a las siete de la tarde de un día de cierre.',
    caso: {
      titulo: 'Cómo se separa en la práctica',
      texto: 'Al procesar una descarga completa del portal, cada documento se clasifica por lo que declara ser: factura electrónica de venta, nota crédito, nota débito, documento soporte o nómina electrónica. Esa clasificación no se deduce del nombre del archivo ni del proveedor, sino del contenido del XML, que es la única fuente confiable. El resultado es que un mes con doscientas facturas y ochenta documentos soporte llega a la contabilidad ya separado en dos grupos, cada uno con su total, en vez de llegar como trescientos ochenta renglones que alguien tiene que clasificar a ojo.',
      antes: 'Trescientos ochenta renglones sin distinguir tipo',
      despues: 'Cada grupo con su total, clasificado desde el contenido del documento',
    },
    fotos: F('/images/seo/tablet-sign-business.jpg', '/images/contadores/profesional-movil.jpg', '/images/home/why-1-pointing.jpg'),
    cierre: 'Hay una razón práctica para cuidar esta separación más allá del cumplimiento: el documento soporte es el que más preguntas genera en una revisión, porque lo emitió el propio contribuyente que se toma el costo. Tenerlos identificados, contados y localizables permite responder con la evidencia a la mano en vez de reconstruir el mes. Y en sectores donde son la mayoría del volumen, saber cuántos hubo y por cuánto es información de gestión, no sólo de cumplimiento.',
    faq: [
      { q: '¿Quién emite el documento soporte?', a: 'Lo genera el comprador, no el vendedor, precisamente porque el vendedor no está obligado a facturar electrónicamente.' },
      { q: '¿La herramienta lo distingue de una factura?', a: 'Sí. Es un tipo propio dentro de la clasificación y aparece marcado como tal en el Excel y en la tabla, con su conteo separado.' },
      { q: '¿Sirve también para el documento soporte de nómina?', a: 'La nómina electrónica se reconoce como tipo aparte, con su propia clasificación, para que no se sume a las compras.' },
    ],
  },

  // ── TRANSACCIONAL ──────────────────────────────────────────────────────
  {
    slug: 'descargar-facturas-electronicas-dian-masivamente',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#059669',
    titleTag: 'Descargar facturas electrónicas de la DIAN masivamente | Codec Document',
    metaDescription: 'Descarga cientos de facturas electrónicas de la DIAN de una sola vez: pega la lista de CUFE, elige la carpeta y los XML bajan solos. Sin abrir un documento por uno. Hecho para contadores en Colombia.',
    h1Accent: 'Descarga masiva',
    h1Rest: 'de facturas electrónicas de la DIAN',
    heroSector: 'Descarga en lote',
    subtitulo: 'Pega la lista de CUFE una vez y deja que los documentos bajen solos mientras haces otra cosa.',
    intro: 'El portal de la DIAN entrega los documentos de a uno. Para un contador que cierra quince contabilidades al mes, eso significa repetir la misma secuencia de clics cientos de veces, dentro de una ventana de sesenta minutos que se vence antes de terminar. La descarga masiva resuelve exactamente esa parte: a partir del listado que ya exportaste del portal, cada documento se solicita automáticamente y se guarda en la carpeta de tu computador que tú elijas.',
    sectorTitulo: 'Cómo funciona la descarga en lote',
    sectorTexto: 'El listado que exportas del portal trae la columna de CUFE. Esa lista se pega completa, se pega también el enlace del token que te llegó por correo, y se elige una carpeta de destino. A partir de ahí el proceso avanza solo, documento por documento, a un ritmo deliberadamente moderado para no saturar los servicios de la DIAN ni provocar un bloqueo.',
    dolores: [
      { titulo: 'El token vence a mitad del lote', texto: 'Con descargas largas es casi seguro. Por eso lo ya descargado no se vuelve a pedir: se solicita otro token, se pega y continúa donde iba.' },
      { titulo: 'Bajar rápido es contraproducente', texto: 'Pedir cientos de documentos en segundos es la forma más rápida de que la DIAN corte el acceso. El ritmo se controla a propósito.' },
      { titulo: 'Los archivos deben quedar en tu equipo', texto: 'Los documentos se guardan en la carpeta que elijas de tu propio computador, no en un servidor ajeno.' },
    ],
    respuesta: 'Descargar deja de ser una tarea que ocupa a una persona y pasa a ser algo que ocurre mientras esa persona hace otra cosa. Y como los archivos quedan en tu carpeta, el siguiente paso —leerlos y convertirlos en información contable— es arrastrarlos de vuelta a la herramienta.',
    caso: {
      titulo: 'Doscientos documentos, una sola operación',
      texto: 'Un cierre típico de una empresa mediana son entre doscientos y cuatrocientos documentos recibidos. Hecho a mano, es una tarde completa de una persona repitiendo la misma secuencia: buscar, descargar, descomprimir, siguiente. Hecho en lote, es pegar una lista, elegir una carpeta y volver cuando termine. La diferencia no está sólo en el tiempo: está en que un proceso repetitivo hecho por una persona cansada produce omisiones —un documento que no se descargó, otro que se descargó dos veces— y un proceso automático no se cansa ni se salta renglones.',
      antes: 'Una tarde de clics repetidos, con omisiones que nadie detecta',
      despues: 'Una lista pegada y una carpeta llena, sin documentos saltados',
    },
    fotos: F('/images/seo/app-woman-blue.jpg', '/images/seo/dashboard-desk.jpg', '/images/home/why-3-confident.jpg'),
    cierre: 'Vale la pena señalar qué NO cambia: sigue haciendo falta el token de la DIAN, que es temporal y personal, y sigue siendo la DIAN quien entrega los documentos. No hay atajos ni accesos alternativos, ni se piden ni se guardan tus credenciales. Lo único que se automatiza es la repetición: pedir cada documento, esperar, guardarlo y pasar al siguiente. Esa es toda la magia, y es suficiente para convertir una tarde de trabajo en una operación desatendida.',
    faq: [
      { q: '¿Necesito dar mis claves de la DIAN?', a: 'No. Nunca se piden ni se almacenan. Se usa el token temporal que la propia DIAN te envía a tu correo cuando lo solicitas.' },
      { q: '¿Dónde quedan los archivos descargados?', a: 'En la carpeta de tu computador que elijas al empezar. Nunca se suben a un servidor.' },
      { q: '¿Qué pasa si se corta a mitad?', a: 'Puedes volver a lanzarla sobre la misma carpeta: lo que ya está descargado no se vuelve a pedir, así que continúa donde se quedó.' },
    ],
  },
  {
    slug: 'descargador-masivo-dian-gratis',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#DC2626',
    titleTag: 'Descargador masivo de la DIAN gratis para contadores | Codec Document',
    metaDescription: 'Descarga y procesa tus XML de la DIAN gratis, sin instalar nada y sin tarjeta de crédito. Prueba con tus propios documentos y compara el Excel con el que armas a mano.',
    h1Accent: 'Descargador masivo',
    h1Rest: 'de la DIAN, gratis para empezar',
    heroSector: 'Prueba sin costo',
    subtitulo: 'Sin instalar programas, sin tarjeta y sin dar tus claves. Pruébalo con los documentos que ya tienes.',
    intro: 'La mayoría de los programas para descargar documentos de la DIAN son aplicaciones de escritorio que hay que instalar, actualizar y a veces pagar antes de saber si sirven. Esta funciona en el navegador y se puede probar con tus propios documentos del mes pasado, que es la única forma honesta de saber si te ahorra tiempo: coges los comprimidos que ya descargaste, los sueltas y comparas el Excel que sale con el que armaste a mano.',
    sectorTitulo: 'Qué incluye la versión gratuita',
    sectorTexto: 'Procesar tus XML, obtener el Excel con documentos, líneas e impuestos, y cruzar lo reportado en la DIAN contra tu contabilidad. Nada de eso está recortado en el plan gratuito, porque una prueba que esconde lo mejor no permite decidir. Lo que se limita es el volumen mensual, no las funciones.',
    dolores: [
      { titulo: 'Instalar para probar', texto: 'Un ejecutable que hay que descargar, permitir en el antivirus y actualizar cada vez. Aquí no hay instalación: abres el navegador.' },
      { titulo: 'Pedir la tarjeta antes de mostrar nada', texto: 'No se pide medio de pago para probar. Se entra con el correo y se empieza.' },
      { titulo: 'Programas que piden tus claves de la DIAN', texto: 'Aquí no se piden ni se guardan. Se usa el token temporal que la DIAN envía a tu correo, que caduca solo.' },
    ],
    respuesta: 'La prueba está pensada para que la hagas con un cliente real y un mes real, no con un archivo de ejemplo. Si el Excel que sale no te sirve, no perdiste nada más que diez minutos. Y si te sirve, ya sabes exactamente qué estás pagando cuando decidas ampliar el volumen.',
    caso: {
      titulo: 'Diez minutos para saber si sirve',
      texto: 'La prueba honesta es esta: busca la carpeta donde guardaste los comprimidos del mes pasado, arrástralos a la herramienta y descarga el Excel. Compáralo con la hoja que armaste a mano ese mes. Vas a ver tres cosas de inmediato: si los totales coinciden, si el desglose de impuestos es el que necesitas, y cuántos documentos te faltaban sin que lo supieras. Ese último dato es el que suele sorprender, porque el trabajo manual no falla de forma visible: simplemente omite, y la omisión no deja rastro hasta que alguien la busca.',
      antes: 'Decidir si un programa sirve leyendo su publicidad',
      despues: 'Decidirlo comparando su resultado con tu propio trabajo del mes pasado',
    },
    fotos: F('/images/home/why-2-pointing.jpg', '/images/seo/office-tablet-woman.jpg', '/images/seo/app-man-blue.jpg'),
    cierre: 'Sobre el precio, sin rodeos: el plan completo cuesta 52.900 pesos al mes, sin permanencia, y se paga desde Colombia en pesos. El plan gratuito no es una versión mutilada sino el mismo producto con un tope de documentos mensuales, pensado para que un contador pueda trabajar un cliente completo antes de decidir. Si tu cartera cabe en ese tope, puedes quedarte ahí indefinidamente; si no cabe, ya sabrás por experiencia propia qué estás comprando.',
    faq: [
      { q: '¿Es realmente gratis o es una prueba de días?', a: 'Es un plan gratuito con un tope de documentos al mes, no una prueba que se vence. Si tu volumen cabe en ese tope, no necesitas pagar.' },
      { q: '¿Tengo que instalar algo?', a: 'No. Funciona en el navegador, en Chrome o Edge de computador. La descarga masiva necesita computador porque guarda los archivos en una carpeta que tú eliges.' },
      { q: '¿Mis documentos se suben a algún servidor?', a: 'Los XML se leen dentro de tu propio navegador. Lo que se guarda es la información contable extraída, no los archivos.' },
    ],
  },
  {
    slug: 'convertir-xml-dian-a-excel',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#16A34A',
    titleTag: 'Convertir XML de la DIAN a Excel automáticamente | Codec Document',
    metaDescription: 'Convierte los XML de tus facturas electrónicas en un Excel con documentos, líneas e impuestos separados. IVA, ICA, INC y retenciones desglosadas, con los totales cuadrados contra el documento.',
    h1Accent: 'Convierte los XML',
    h1Rest: 'de la DIAN en un Excel de verdad',
    heroSector: 'Conversión a Excel',
    subtitulo: 'No un volcado de datos: un archivo con documentos, líneas e impuestos separados y cuadrados.',
    intro: 'Un XML de factura electrónica no está hecho para que lo lea una persona. Es un archivo con etiquetas anidadas donde la información que un contador necesita —base, IVA, retenciones, detalle por línea— está repartida entre decenas de campos con nombres técnicos. Abrirlo en Excel directamente produce una columna de código ilegible. Convertirlo bien significa entender la estructura del documento y sacar de ella las cifras que corresponden a cada concepto contable.',
    sectorTitulo: 'Qué trae el archivo que sale',
    sectorTexto: 'Cuatro hojas. Un resumen con los totales del periodo. Una de documentos, con un renglón por factura: emisor, número, fecha, base, impuestos y total. Una de líneas, con el detalle de cada renglón de cada factura, que es lo que permite costear por referencia. Y una de impuestos, con retefuente, reteIVA, reteICA, IVA, ICA e INC separados por concepto con su base y su tarifa.',
    dolores: [
      { titulo: 'Abrir el XML en Excel no sirve', texto: 'Sale el código, no la información. Excel no sabe qué etiqueta corresponde a qué concepto contable.' },
      { titulo: 'Los totales tienen que cuadrar contra el documento', texto: 'Recalcularlos a partir de las líneas introduce diferencias por redondeo. Los totales salen del documento y se verifican contra él.' },
      { titulo: 'El detalle por línea se pierde al resumir', texto: 'Si cada factura se reduce a un renglón, no queda forma de saber qué se compró sin volver a abrir los archivos.' },
    ],
    respuesta: 'La conversión no es un volcado: cada cifra se toma del campo que le corresponde y se verifica que las líneas más los impuestos den el total del documento. Lo que no cuadra no se corrige por su cuenta, se marca, porque una diferencia en una factura es información que el contador necesita ver, no un problema que la herramienta deba disimular.',
    caso: {
      titulo: 'Por qué cuadrar importa más que convertir',
      texto: 'Cualquier programa puede sacar cifras de un XML. Lo difícil es saber cuándo esas cifras no cuadran y decirlo. Una factura donde la suma de las líneas más los impuestos no da el total puede tener un descuento mal reportado, un impuesto que el emisor calculó distinto o una línea excluida de IVA que no aparece en la base gravable. Ninguno de esos casos es un error de lectura: son documentos reales con particularidades reales, y el contador tiene que verlos. Por eso lo que no cuadra va a una bandeja aparte con el motivo, en vez de sumarse silenciosamente al total del mes.',
      antes: 'Cifras extraídas sin verificar, que cuadran hasta que alguien revisa',
      despues: 'Totales verificados contra el documento, y lo que no cuadra señalado con su motivo',
    },
    fotos: F('/images/seo/tablet-review-woman.jpg', '/images/home/templates-meeting.jpg', '/images/seo/app-woman-tech-blue.jpg'),
    cierre: 'Un detalle que se agradece en el uso diario: el Excel sale con anchos de columna ya definidos y los importes con formato de número, no como texto. Parece menor hasta que se recibe un archivo donde todas las cifras están alineadas a la izquierda y hay que convertirlas una por una para poder sumarlas. Y las celdas sin dato dicen por qué están vacías —«excluido», «sin vencimiento»— en vez de dejar un hueco que obligue a volver al documento para averiguar si falta información o simplemente no aplica.',
    faq: [
      { q: '¿En qué formato sale el archivo?', a: 'En .xlsx, con cuatro hojas: resumen, documentos, líneas e impuestos. Se abre en Excel, en Google Sheets o en LibreOffice.' },
      { q: '¿Puedo obtenerlo en el formato de mi software contable?', a: 'Sí. Subes tu formato vacío una vez, se emparejan las columnas, y los meses siguientes descargas directamente el archivo listo para importar.' },
      { q: '¿Qué pasa con las notas crédito?', a: 'Se clasifican como tipo propio, separadas de las facturas, para que las devoluciones no se sumen como compras.' },
    ],
  },
  {
    slug: 'descargar-facturas-recibidas-dian',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#0D9488',
    titleTag: 'Descargar facturas recibidas de la DIAN en lote | Codec Document',
    metaDescription: 'Baja todas las facturas que te emitieron tus proveedores desde el portal de la DIAN y conviértelas en Excel con el IVA descontable y las retenciones separadas.',
    h1Accent: 'Tus facturas recibidas',
    h1Rest: 'bajadas y clasificadas de una vez',
    heroSector: 'Documentos recibidos',
    subtitulo: 'Las que te emitieron tus proveedores: las que sostienen tu IVA descontable y tus costos.',
    intro: 'Las facturas recibidas son las que determinan el IVA descontable y buena parte del costo deducible, y por eso son las que más revisión exigen y las que más se dejan para el final. Son además las que el contador no controla: llegan cuando el proveedor las emite, con el formato y el detalle que el proveedor decidió, y aparecen en el catálogo de la DIAN sin avisar. Trabajarlas bien empieza por tenerlas todas.',
    sectorTitulo: 'El problema de las que no sabes que existen',
    sectorTexto: 'Un proveedor puede emitir una factura que tú nunca recibiste por correo, y esa factura está reportada en la DIAN a tu NIT. Si tu contabilidad se arma sólo con lo que llegó al correo, esos documentos quedan fuera: no se registra el costo, no se descuenta el IVA y la información no coincide con la que la DIAN ya tiene.',
    dolores: [
      { titulo: 'El correo no es la fuente de verdad', texto: 'La fuente es el catálogo de la DIAN. Lo que llegó al correo es sólo lo que el proveedor se acordó de enviar.' },
      { titulo: 'El IVA descontable depende de tenerlas todas', texto: 'Una factura que no se registró es IVA que no se descontó, y eso se paga de más sin que nadie lo note.' },
      { titulo: 'Aparecen tarde', texto: 'Un proveedor puede reportar días después. Descargar el periodo completo cerca del vencimiento evita la sorpresa.' },
    ],
    respuesta: 'Descargar el periodo completo de documentos recibidos, procesarlo entero y cruzarlo contra lo que tú registraste convierte esa incertidumbre en una lista concreta: estas facturas están en la DIAN y no en tu contabilidad. Con nombre, número y valor, para pedirlas o registrarlas antes de declarar.',
    caso: {
      titulo: 'Lo que aparece cuando se descarga todo',
      texto: 'La primera vez que un contador descarga el periodo completo de recibidos y lo cruza contra su contabilidad, casi siempre aparecen documentos que no tenía. No es negligencia: son facturas que el proveedor emitió y no envió, o que llegaron a un correo que nadie revisa, o que se reportaron después del cierre. El número típico está entre el dos y el cinco por ciento del volumen del mes, y en IVA descontable eso puede ser una cifra que justifica sola el tiempo de hacer el cruce. Lo importante es que se descubre antes de declarar, no en una revisión posterior.',
      antes: 'Registrar lo que llegó al correo y suponer que era todo',
      despues: 'Registrar lo que la DIAN tiene reportado a tu NIT, que es lo que van a comparar',
    },
    fotos: F('/images/seo/app-man-blue.jpg', '/images/contadores/profesional-movil.jpg', '/images/seo/dashboard-desk.jpg'),
    cierre: 'Hay un efecto secundario útil de trabajar siempre contra el catálogo: la conversación con el proveedor cambia. En vez de pedir «las facturas del mes» de forma genérica, se le puede decir exactamente qué documento falta, con su número y su fecha. Eso acorta el ida y vuelta y evita el clásico envío de un paquete de PDF repetidos. Y en el otro sentido, cuando el proveedor reclama un pago que no aparece registrado, la respuesta sale de una consulta en vez de una búsqueda.',
    faq: [
      { q: '¿Puedo descargar recibidas y emitidas por separado?', a: 'Sí. En el portal se filtra por tipo antes de exportar el listado, y a partir de ahí se descarga sólo lo que necesitas.' },
      { q: '¿Cómo sé cuáles me faltan por registrar?', a: 'Subiendo tu Excel contable: se cruza documento por documento contra lo descargado y devuelve la lista de faltantes con su número, su NIT y su valor.' },
      { q: '¿Sirve para varios NIT?', a: 'Sí. Cada descarga usa el token del NIT correspondiente y los documentos quedan separados por emisor y por receptor.' },
    ],
  },

  // ── COMPARATIVA / SOFTWARE ─────────────────────────────────────────────
  {
    slug: 'importar-facturas-electronicas-a-siigo',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#7C3AED',
    titleTag: 'Importar facturas electrónicas de la DIAN a Siigo | Codec Document',
    metaDescription: 'Pasa los XML de la DIAN al formato de importación de Siigo sin digitar. Sube tu plantilla vacía una vez, empareja las columnas y descarga el archivo listo cada mes.',
    h1Accent: 'De los XML de la DIAN',
    h1Rest: 'al formato de importación de tu software',
    heroSector: 'Integración contable',
    subtitulo: 'Tu propia plantilla, emparejada una sola vez, lista para importar todos los meses.',
    intro: 'Ningún software contable importa directamente el XML de la DIAN. Cada uno espera su propio archivo, con sus columnas, en su orden y con sus nombres. Ese es el paso donde se pierde el tiempo: no en entender la información, sino en moverla de un formato a otro. Y como cada software pide algo distinto, la solución genérica —un Excel estándar— nunca encaja del todo y siempre exige un ajuste manual.',
    sectorTitulo: 'Por qué la plantilla la pones tú',
    sectorTexto: 'En vez de adivinar cómo importa cada programa y quedar desactualizado en cuanto cambie una versión, el contador sube el formato vacío que ya usa. Se le indica qué columna corresponde a qué dato una sola vez, y esa configuración queda guardada. Los meses siguientes se elige el perfil y se descarga el archivo ya en ese formato.',
    dolores: [
      { titulo: 'Cada software pide otro formato', texto: 'Y cada versión puede cambiarlo. Una integración rígida se rompe con la siguiente actualización.' },
      { titulo: 'El Excel genérico siempre necesita ajustes', texto: 'Reordenar columnas, renombrar encabezados, convertir formatos de fecha. Diez minutos por cliente, todos los meses.' },
      { titulo: 'Los terceros se duplican al digitar', texto: 'Un NIT mal copiado crea un tercero nuevo. Con el dato tomado del documento, eso no ocurre.' },
    ],
    respuesta: 'El archivo sale con tus columnas, en tu orden, con tus encabezados. Y como el NIT, la razón social y las cifras vienen del documento electrónico y no de una transcripción, los terceros se crean bien la primera vez y los importes no dependen de que alguien no se haya equivocado a las siete de la tarde.',
    caso: {
      titulo: 'Configurar una vez, usar todos los meses',
      texto: 'La configuración inicial toma unos minutos: se sube el archivo de importación vacío —el mismo que usas hoy—, la herramienta detecta los encabezados y propone a qué dato corresponde cada uno. Se corrige lo que haga falta, se guarda con el nombre del cliente y ya está. El mes siguiente, y todos los siguientes, el flujo es soltar los comprimidos y descargar el archivo listo. Para un estudio con veinte clientes en tres programas distintos, son tres configuraciones que se hacen una vez y se reutilizan indefinidamente, en vez de veinte ajustes manuales cada mes.',
      antes: 'Reacomodar el Excel para cada cliente, todos los meses',
      despues: 'Elegir el perfil del cliente y descargar el archivo ya en su formato',
    },
    fotos: F('/images/home/templates-meeting.jpg', '/images/seo/tablet-sign-business.jpg', '/images/seo/app-woman-blue.jpg'),
    cierre: 'Conviene aclarar el alcance para no prometer de más: esto genera el archivo de importación en el formato que tú definas, no se conecta por API con tu software ni escribe dentro de él. Es deliberado. Una integración directa depende de credenciales, de versiones y de permisos que cambian, y cuando se rompe deja al contador sin salida en pleno cierre. Un archivo de importación funciona siempre, con cualquier programa que acepte importar, y si mañana cambias de software sólo cambias la plantilla.',
    faq: [
      { q: '¿Funciona con Siigo, Alegra, World Office o Helisa?', a: 'Con cualquiera que permita importar desde un archivo. Como la plantilla la subes tú, el programa concreto no importa: lo que importa es el formato que ese programa espera.' },
      { q: '¿Tengo que configurarlo cada mes?', a: 'No. Se configura una vez por cliente y queda guardado. Los meses siguientes eliges el perfil y descargas.' },
      { q: '¿Se conecta directamente con mi software?', a: 'No. Genera el archivo de importación, que tú cargas. Es más robusto: no depende de credenciales ni de versiones que cambien.' },
    ],
  },
  {
    slug: 'conciliar-facturas-electronicas-con-contabilidad',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#DB2777',
    titleTag: 'Conciliar las facturas de la DIAN con tu contabilidad | Codec Document',
    metaDescription: 'Cruza lo que la DIAN tiene reportado contra lo que registraste. Descubre qué facturas te faltan, cuáles registraste de más y cuáles tienen diferencia de valor, antes de declarar.',
    h1Accent: 'Cruza la DIAN',
    h1Rest: 'contra tu contabilidad, antes de declarar',
    heroSector: 'Conciliación',
    subtitulo: 'Tres listas concretas: lo que falta, lo que sobra y lo que no cuadra en valor.',
    intro: 'La DIAN ya tiene una copia de todo lo que te facturaron. Tu contabilidad tiene lo que alcanzaste a registrar. Cuando esas dos cosas no coinciden, la diferencia aparece en el peor momento posible: en un cruce de información, meses después, cuando corregir implica sanción. Conciliar antes de declarar convierte ese riesgo en una lista de tareas concreta.',
    sectorTitulo: 'Qué significa conciliar de verdad',
    sectorTexto: 'No es comparar totales. Dos totales pueden coincidir por compensación —una factura que falta y otra duplicada— y el problema seguir ahí. Conciliar es emparejar documento por documento, por número y por NIT, y decir exactamente cuáles no tienen pareja. Esa es la única comparación que sirve para actuar.',
    dolores: [
      { titulo: 'Cuadrar totales esconde errores', texto: 'Una omisión y una duplicación se cancelan entre sí. El total da y la contabilidad está mal.' },
      { titulo: 'Hacerlo a mano no es viable', texto: 'Con trescientos documentos por lado, el emparejamiento manual toma más que el registro mismo y por eso nunca se hace.' },
      { titulo: 'Se descubre cuando ya hay sanción', texto: 'La diferencia aparece en un cruce posterior, cuando corregir cuesta dinero además de tiempo.' },
    ],
    respuesta: 'El cruce se hace documento por documento contra el Excel que tú ya tienes, sin cambiar tu forma de trabajar. El resultado son tres listas separadas: lo que la DIAN tiene y tú no registraste, lo que registraste y la DIAN no tiene, y lo que está en ambos lados con valores distintos. Cada una con el documento identificado.',
    caso: {
      titulo: 'Las tres listas, y qué hacer con cada una',
      texto: 'Los faltantes son los más urgentes: son costo no registrado e IVA no descontado, y hay que conseguirlos antes de declarar. Los sobrantes suelen ser errores de digitación o documentos anulados que no se dieron de baja, y limpiarlos evita una diferencia que después nadie sabe explicar. Y las diferencias de valor son las más reveladoras: casi siempre son una nota crédito que no se aplicó, un descuento registrado mal o un impuesto clasificado en la columna equivocada. Cada una exige una acción distinta, y por eso salen separadas en vez de en una sola lista de incidencias. Hay un cuarto resultado que no aparece en ninguna lista y que es el mas valioso: cuando el cruce da limpio. Saber con certeza que el mes cuadro contra lo que la DIAN tiene reportado cambia la forma de firmar una declaracion. Sin ese cruce, lo que hay es una suposicion razonable basada en que el equipo trabajo bien; con el, hay evidencia. Y la evidencia se puede guardar y mostrar despues, que es exactamente lo que hace falta cuando una revision pregunta por un periodo cerrado hace dos anos y ya nadie recuerda como se armo.',
      antes: 'Comparar dos totales y confiar en que coincidan',
      despues: 'Tres listas con nombre, número y valor, y una acción clara para cada una',
    },
    fotos: F('/images/seo/office-tablet-woman.jpg', '/images/home/why-1-pointing.jpg', '/images/seo/tablet-review-woman.jpg'),
    cierre: 'Hay un momento óptimo para hacer este cruce y no es el día del vencimiento: es unos días antes, cuando todavía se le puede pedir un documento a un proveedor y esperar que lo mande. Hecho con margen, la conciliación deja de ser un control que confirma problemas y pasa a ser una herramienta que los resuelve. Y una vez incorporada al cierre, cada mes empieza sabiendo que el anterior quedó cuadrado, que es lo que permite dormir en época de declaración.',
    faq: [
      { q: '¿Qué formato debe tener mi Excel contable?', a: 'El que ya uses. Le indicas cuál columna es el número, cuál el NIT y cuál el valor, y esa configuración queda guardada.' },
      { q: '¿Empareja por número o por CUFE?', a: 'Por número y NIT, que es lo que suele tener un auxiliar contable. Si tu archivo trae CUFE, el emparejamiento es aún más preciso.' },
      { q: '¿Qué pasa con las notas crédito?', a: 'Se tratan como documentos propios. Una diferencia de valor causada por una nota crédito no aplicada aparece señalada como tal.' },
    ],
  },
  {
    slug: 'reporte-retenciones-facturas-electronicas',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#D97706',
    titleTag: 'Reporte de retenciones desde las facturas electrónicas | Codec Document',
    metaDescription: 'Saca retefuente, reteIVA y reteICA separadas por concepto, con su base y su tarifa, directamente de los XML de la DIAN. Sin desglosar documento por documento.',
    h1Accent: 'Retefuente, reteIVA y reteICA',
    h1Rest: 'separadas desde el documento',
    heroSector: 'Impuestos y retenciones',
    subtitulo: 'Cada retención con su base y su tarifa, tal como la reportó el emisor. Sin desglosar a mano.',
    intro: 'Un mismo documento electrónico puede traer retención en la fuente, retención de IVA y retención de industria y comercio al tiempo, cada una con su propia base. En el papel se ven parecidas; en la declaración van a lugares distintos. Desglosarlas documento por documento es la tarea que se lleva buena parte del cierre y la que menos tolera el cansancio, porque un error de clasificación no se ve hasta que ya hay sanción.',
    sectorTitulo: 'La información ya está clasificada en el XML',
    sectorTexto: 'Cada impuesto viene en el documento con su código, su base gravable y su tarifa. No hay que deducirlo ni calcularlo: hay que leerlo. El trabajo manual consiste en abrir el documento, encontrar esos campos entre el resto del código y copiarlos a la columna correcta, que es exactamente el tipo de tarea donde una persona cansada se equivoca y una lectura automática no.',
    dolores: [
      { titulo: 'Las tres terminan en una sola columna', texto: 'Resumirlas juntas obliga a volver al documento cuando llega el momento de declarar cada una por separado.' },
      { titulo: 'ReteICA depende del municipio', texto: 'La tarifa cambia según dónde se realizó la actividad, y ese dato viaja en el documento.' },
      { titulo: 'El error no falla de forma visible', texto: 'La declaración se presenta y el sistema la acepta. El problema aparece en un cruce posterior.' },
    ],
    respuesta: 'El Excel trae una hoja dedicada a impuestos donde cada retención aparece con su concepto, su base y su tarifa, tal como vienen en el documento. Lo que antes era clasificar queda hecho antes de que empieces a revisar, y la revisión pasa a ser lo que debería: comprobar que las tarifas aplicadas correspondan a la actividad.',
    caso: {
      titulo: 'Verificar tarifas, no clasificarlas',
      texto: 'Cuando el desglose viene resuelto, aparece tiempo para una comprobación que casi nadie alcanza a hacer: contrastar que la tarifa que aplicó el proveedor sea la que corresponde a la actividad y al municipio. Un proveedor que retiene de más le está quitando flujo de caja a tu cliente; uno que retiene de menos deja una diferencia que alguien tendrá que asumir. Ninguno de los dos casos se detecta si el cierre se va en copiar cifras de una columna a otra. Ese es el trabajo que justifica a un contador, y es el que aparece cuando el trabajo mecánico desaparece.',
      antes: 'El cierre gastado en clasificar impuestos uno por uno',
      despues: 'El desglose resuelto, y tiempo para verificar que las tarifas sean correctas',
    },
    fotos: F('/images/seo/dashboard-desk.jpg', '/images/seo/app-woman-tech-blue.jpg', '/images/home/why-3-confident.jpg'),
    cierre: 'Un detalle sobre cómo se presentan los datos que importa más de lo que parece: cuando un periodo no tuvo retenciones de un tipo, la hoja lo dice explícitamente en vez de dejar celdas vacías. Saber que no hubo es distinto de no saber, y esa diferencia evita la duda de si el dato falta porque no existía o porque la herramienta no lo leyó. En un documento que sostiene una declaración, esa ambigüedad no es aceptable.',
    faq: [
      { q: '¿Separa reteIVA de reteICA y de retefuente?', a: 'Sí, cada una con su código, su base y su tarifa, en una hoja de impuestos aparte de la de documentos.' },
      { q: '¿Incluye IVA, ICA e INC además de las retenciones?', a: 'Sí. Todos los impuestos que el emisor reportó aparecen con su concepto propio, sin mezclarse entre sí.' },
      { q: '¿De dónde salen las tarifas?', a: 'Del propio documento electrónico, tal como las reportó quien emitió. No se calculan ni se suponen.' },
    ],
  },
  {
    slug: 'nomina-electronica-dian-descargar-xml',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#EA580C',
    titleTag: 'Descargar y leer los XML de nómina electrónica DIAN | Codec Document',
    metaDescription: 'Procesa los XML del documento soporte de nómina electrónica: devengados, deducciones y totales por empleado, listos para revisar y contabilizar.',
    h1Accent: 'Nómina electrónica',
    h1Rest: 'leída y clasificada aparte',
    heroSector: 'Nómina electrónica',
    subtitulo: 'Un tipo de documento distinto, con su propia estructura, que no debe sumarse a las compras.',
    intro: 'El documento soporte de pago de nómina electrónica es obligatorio para quienes deducen costos y gastos por nómina, y llega al catálogo de la DIAN igual que las facturas, mezclado con ellas. Pero no es una compra: tiene su propia estructura, con devengados y deducciones por trabajador, y sumarlo al total de facturas distorsiona cualquier cifra que se calcule después.',
    sectorTitulo: 'Por qué no puede ir en el mismo saco',
    sectorTexto: 'Una factura tiene base, impuestos y total; un documento de nómina tiene devengados, deducciones y un neto. Los conceptos no son equivalentes y no se pueden sumar entre sí. Cuando ambos terminan en la misma hoja sin distinguir el tipo, el total del mes deja de significar nada y hay que rehacerlo.',
    dolores: [
      { titulo: 'Llega mezclado con las facturas', texto: 'La descarga del portal trae todo junto, y separarlo es un paso previo que consume tiempo.' },
      { titulo: 'Su estructura es distinta', texto: 'Devengados y deducciones no equivalen a base e impuestos. Tratarlos igual produce cifras sin sentido.' },
      { titulo: 'Es mensual y repetitivo', texto: 'Todos los meses, para todos los empleados. Es el tipo de volumen que hace inviable el trabajo manual.' },
    ],
    respuesta: 'La nómina electrónica se reconoce como tipo propio desde el contenido del documento y se clasifica aparte, con su propio conteo. No se suma a las compras ni al IVA descontable, y queda disponible para revisarla como lo que es: el soporte de un costo de personal.',
    caso: {
      titulo: 'Lo que permite revisar cuando está separada',
      texto: 'Con los documentos de nómina identificados y sus cifras extraídas, se puede hacer una comprobación que a mano casi nadie hace: contrastar lo reportado a la DIAN contra lo que se registró en la contabilidad y contra lo que se pagó realmente. Las tres cifras deberían coincidir, y cuando no lo hacen suele haber una explicación concreta —un ajuste que se hizo en nómina y no se reportó, o al revés— que conviene encontrar antes de que la encuentre un tercero. La obligación de reportar existe desde hace años; la costumbre de verificar lo reportado, mucho menos. Conviene ademas revisar la nomina electronica con la misma disciplina que las compras, aunque no genere IVA descontable. Es soporte de deduccion, y por lo tanto se revisa: que todos los periodos esten reportados, que no falte ningun mes, que los ajustes y las notas de ajuste esten donde deben. Un periodo faltante no produce ningun error visible en la contabilidad, porque el gasto se registro igual desde la nomina interna; el problema aparece cuando la deduccion tiene que sostenerse con el documento electronico y ese documento no existe. Tenerlos todos descargados y contados es la unica forma de saberlo antes de que lo pregunten.',
      antes: 'Nómina sumada al total de compras, distorsionando las cifras del mes',
      despues: 'Clasificada aparte y contrastable contra lo registrado y lo pagado',
    },
    fotos: F('/images/contadores/profesional-movil.jpg', '/images/seo/app-man-blue.jpg', '/images/seo/office-tablet-woman.jpg'),
    cierre: 'Vale una precisión de alcance: la herramienta lee y clasifica los documentos de nómina electrónica que ya fueron emitidos y reportados, no los genera ni los transmite. Generar la nómina electrónica es función del software de nómina o del proveedor tecnológico autorizado. Lo que aquí se resuelve es la otra mitad del problema, la que casi nadie atiende: qué hacer con esos documentos una vez existen, cómo revisarlos y cómo contabilizarlos sin volver a digitarlos.',
    faq: [
      { q: '¿La herramienta genera la nómina electrónica?', a: 'No. La lee y la clasifica. Generarla y transmitirla corresponde a tu software de nómina o a tu proveedor tecnológico.' },
      { q: '¿La suma a las compras del mes?', a: 'No. Se clasifica como tipo propio y se cuenta aparte, precisamente porque sus conceptos no son equivalentes a los de una factura.' },
      { q: '¿Incluye el detalle por empleado?', a: 'Se extrae la información que el documento reporta, incluidos devengados y deducciones tal como fueron declarados.' },
    ],
  },
  {
    slug: 'automatizar-cierre-contable-mensual',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#B45309',
    titleTag: 'Cómo automatizar el cierre contable mensual en Colombia | Codec Document',
    metaDescription: 'Qué partes del cierre contable se pueden automatizar de verdad y cuáles no: descarga de documentos, clasificación, conciliación con la DIAN y armado del archivo de importación.',
    h1Accent: 'Automatiza el cierre',
    h1Rest: 'sin perder el control de lo que revisas',
    heroSector: 'Cierre mensual',
    subtitulo: 'Qué se puede automatizar de verdad, qué no conviene automatizar, y en qué orden empezar.',
    intro: 'Automatizar el cierre no significa que un programa haga la contabilidad. Significa quitarle al contador la parte que no exige criterio —descargar, descomprimir, clasificar, transcribir— para que su tiempo se dedique a la parte que sí lo exige. La distinción importa, porque las herramientas que prometen automatizar el juicio profesional terminan produciendo cifras que nadie puede defender.',
    sectorTitulo: 'Qué sí y qué no conviene automatizar',
    sectorTexto: 'Se automatiza bien todo lo que tiene una respuesta única y verificable: bajar un documento, leer su CUFE, extraer su base gravable, emparejarlo con un registro. No se automatiza bien lo que depende de contexto: decidir si un gasto es deducible, si una operación está bien estructurada o si una diferencia amerita una corrección. La frontera entre ambos es clara, y respetarla es lo que separa una herramienta útil de una que genera trabajo nuevo.',
    dolores: [
      { titulo: 'El cierre se va en tareas sin criterio', texto: 'Descargar, descomprimir, digitar y reordenar ocupan la mayor parte del tiempo y no aportan nada que un profesional deba aportar.' },
      { titulo: 'La revisión queda para el final, sin tiempo', texto: 'Cuando lo mecánico consume la semana, revisar se convierte en un muestreo apurado.' },
      { titulo: 'Automatizar de más produce cifras indefendibles', texto: 'Una herramienta que decide por el contador le deja el riesgo sin darle el control.' },
    ],
    respuesta: 'El orden que funciona es empezar por lo más repetitivo y menos ambiguo: la descarga. Luego la lectura y clasificación. Luego el archivo de importación. Y sólo al final la conciliación, que es la que da el mayor retorno pero requiere que los tres pasos anteriores estén ordenados. Cada etapa se puede adoptar por separado.',
    caso: {
      titulo: 'Cómo se ve un cierre ya automatizado',
      texto: 'La descarga se lanza al principio de la semana de cierre y ocurre sola. Los documentos se procesan en un gesto y quedan clasificados por tipo, con los impuestos separados. El archivo de importación se descarga en el formato de cada cliente sin reacomodar nada. Y la conciliación contra la DIAN produce tres listas de excepciones. A partir de ahí empieza el trabajo del contador: revisar esas excepciones, decidir qué hacer con cada una y hablar con el cliente sobre lo que encontró. Lo que antes ocupaba la semana entera ocupa una mañana, y lo que antes no cabía —la revisión de fondo— ahora tiene sitio.',
      antes: 'Una semana de tareas mecánicas y una revisión apurada al final',
      despues: 'Una mañana de proceso y el resto de la semana en lo que exige criterio',
    },
    fotos: F('/images/home/why-2-pointing.jpg', '/images/home/templates-meeting.jpg', '/images/seo/tablet-sign-business.jpg'),
    cierre: 'Un consejo de adopción, por experiencia de cómo suele fallar: no intentes automatizar los veinte clientes el primer mes. Coge uno, el que más documentos tenga, y hazlo completo de punta a punta. Vas a descubrir particularidades —un proveedor que factura raro, una plantilla de importación que necesita una columna más— que es mejor encontrar en un cliente que en veinte. Cuando ese esté funcionando sin fricción, replicarlo al resto es cuestión de configurar plantillas, no de aprender nada nuevo.',
    faq: [
      { q: '¿Por dónde conviene empezar?', a: 'Por la descarga y la lectura de documentos, que es lo más repetitivo y lo que menos criterio exige. La conciliación da más retorno pero conviene dejarla para cuando lo anterior esté ordenado.' },
      { q: '¿Reemplaza al software contable?', a: 'No. Se ocupa de la parte que va desde la DIAN hasta el archivo de importación. Tu software contable sigue siendo donde vive la contabilidad.' },
      { q: '¿Cuánto tiempo toma configurarlo la primera vez?', a: 'La lectura de documentos no requiere configuración. La plantilla de importación toma unos minutos por cliente, una sola vez.' },
    ],
  },
  {
    slug: 'notas-credito-debito-dian-xml',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#DC2626',
    titleTag: 'Notas crédito y débito electrónicas: cómo procesarlas | Codec Document',
    metaDescription: 'Cómo distinguir y procesar las notas crédito y débito de la DIAN para que las devoluciones no se sumen como compras ni distorsionen el IVA del periodo.',
    h1Accent: 'Notas crédito y débito',
    h1Rest: 'sin que distorsionen el mes',
    heroSector: 'Ajustes y devoluciones',
    subtitulo: 'Documentos que restan, no que suman. Tratarlos como facturas descuadra el periodo entero.',
    intro: 'Una nota crédito corrige o anula total o parcialmente una factura ya emitida; una nota débito la aumenta. Ambas son documentos electrónicos con su propio código único y llegan mezcladas con las facturas en la misma descarga. El problema aparece cuando se procesan como si fueran facturas: una devolución sumada en vez de restada no sólo infla el total, también infla el IVA del periodo.',
    sectorTitulo: 'El efecto de tratarlas mal',
    sectorTexto: 'Si una nota crédito de un millón de pesos se registra como una compra más, el costo del mes queda inflado en dos millones respecto de la realidad: el millón que no se restó y el millón que se sumó de más. Y el IVA asociado sigue el mismo camino. Es un error que no se detecta cuadrando totales, porque el total cuadra consigo mismo; sólo aparece al comparar con la DIAN.',
    dolores: [
      { titulo: 'Se ven iguales en una hoja de cálculo', texto: 'Resumidas a número, fecha y valor, una nota crédito y una factura son indistinguibles si nadie anotó el tipo.' },
      { titulo: 'Distorsionan el IVA, no sólo el total', texto: 'El impuesto asociado a la devolución arrastra el mismo error y afecta la declaración.' },
      { titulo: 'Referencian a otro documento', texto: 'Una nota corrige una factura concreta. Sin esa relación, no se sabe qué está corrigiendo.' },
    ],
    respuesta: 'Cada documento se clasifica por lo que declara ser, y las notas quedan separadas con su signo correcto y con la referencia al documento que corrigen. Así el total del periodo refleja lo que realmente ocurrió, y una diferencia de valor en la conciliación se puede explicar señalando la nota que la produjo.',
    caso: {
      titulo: 'La nota crédito que explica una diferencia',
      texto: 'En una conciliación contra la DIAN, las diferencias de valor son las más incómodas porque parecen errores de registro sin causa clara. En la práctica, buena parte de ellas son notas crédito que se emitieron y no se aplicaron: la factura está registrada por su valor original y la DIAN ya tiene la corrección. Cuando las notas están clasificadas y referenciadas, esa diferencia deja de ser un misterio y pasa a ser una tarea de un minuto. Cuando no lo están, alguien pasa media mañana buscando por qué una factura de hace dos meses no cuadra por ochenta mil pesos. Una precision util sobre los plazos: una nota credito puede emitirse en un periodo distinto al de la factura que corrige, y eso es normal. Lo que genera confusion es que al conciliar un mes aparezca una nota sin su factura, o una factura cuyo valor no cuadra porque la nota llego despues. No es un error: es la realidad del ciclo comercial. Por eso conviene revisar las notas contra la factura que referencian y no solo contra el periodo, y conservar esa relacion en la contabilidad. Cuando la referencia esta registrada, el desfase entre periodos deja de ser un misterio y pasa a ser un dato que se explica en una linea.',
      antes: 'Diferencias de valor sin explicación aparente',
      despues: 'La nota que corrige cada factura, identificada y aplicada',
    },
    fotos: F('/images/seo/app-woman-blue.jpg', '/images/seo/dashboard-desk.jpg', '/images/contadores/profesional-movil.jpg'),
    cierre: 'Merece atención un caso concreto que confunde con frecuencia: la nota crédito que anula completamente una factura. Contablemente el efecto neto es cero, pero ambos documentos existen, ambos están reportados y ambos deben quedar registrados. Borrar la factura y no registrar la nota deja la contabilidad con menos documentos de los que la DIAN tiene, y esa diferencia aparece en el cruce. Registrar los dos, con su relación explícita, es lo que hace que la conciliación cierre en cero de verdad.',
    faq: [
      { q: '¿La herramienta distingue notas crédito de facturas?', a: 'Sí. Son tipos propios dentro de la clasificación, con su conteo separado, para que las devoluciones no se sumen como compras.' },
      { q: '¿Muestra a qué factura corresponde cada nota?', a: 'Se conserva la referencia al documento que la nota corrige, tal como viene declarada en el XML.' },
      { q: '¿Y las notas débito?', a: 'Se tratan igual, como tipo propio. Aumentan el valor de la operación en vez de disminuirlo.' },
    ],
  },
];

export const getNecesidadContador = (slug: string): NecesidadContadorSeo | undefined =>
  NECESIDADES_CONTADOR.find((n) => n.slug === slug);

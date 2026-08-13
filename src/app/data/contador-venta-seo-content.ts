/**
 * 20 páginas SEO de VENTA para contadores en Colombia.
 *
 * Las otras veinticinco (contador-dian-seo-content.ts por ciudad,
 * contador-necesidad-seo-content.ts por necesidad) ya cubren el «cómo se
 * hace» y el «dónde estoy». Éstas cubren la tercera pregunta, que es la que
 * cierra la venta: «¿por qué debería cambiar lo que hago hoy?».
 *
 * ── Por qué hacen falta si ya hay 25 ────────────────────────────────────
 *
 * Porque las que hay responden a alguien que YA está buscando una solución.
 * El contador que escribe «cómo descargar XML de la DIAN» sabe que tiene un
 * problema técnico. Pero la mayoría no busca eso: busca el nombre de su
 * programa contable («importar facturas a Alegra»), busca a la competencia
 * («alternativa a QFe Collector»), o busca la norma que le da miedo
 * («sanción por no conservar facturas electrónicas»). Ésos son los tres
 * momentos en los que alguien paga, y ninguno estaba cubierto.
 *
 * ── Reparto, para no canibalizar ────────────────────────────────────────
 *
 *   Comparativa (7)  El contador ya tiene un software o evalúa a un rival.
 *                    Es la intención más rentable: el problema ya está
 *                    definido y sólo falta elegir. Ninguna repite el software
 *                    de otra; Siigo ya lo cubre una página existente.
 *
 *   Dolor (6)        No busca herramienta, busca alivio. Convierte peor por
 *                    visita pero trae al que ni sabía que esto se podía
 *                    automatizar — que es la mayoría del mercado.
 *
 *   Norma (4)        Busca por miedo: qué debe guardar, qué le pueden
 *                    sancionar, qué da derecho a descontar. Trae al que
 *                    decide rápido, porque el coste de no actuar es una cifra.
 *
 *   Tarea (3)        Sabe exactamente qué quiere hacer hoy. Máxima intención.
 *
 * ── Lo que NO se hace aquí ──────────────────────────────────────────────
 *
 * No se inventan cifras de ahorro ni testimonios. Cada página se sostiene
 * sobre hechos comprobables: lo que dice la norma, lo que hace el portal de
 * la DIAN, y lo que la herramienta hace de verdad hoy. Una landing que promete
 * lo que el producto no cumple convierte una vez y quema al cliente en la
 * primera factura — y en un mercado donde los contadores se conocen entre
 * ellos, eso se paga caro.
 *
 * Las citas de norma son reales y verificables: Res. DIAN 000042/2020,
 * Res. 000165/2023, art. 616-1 y art. 632 del Estatuto Tributario. Si alguna
 * cambia, hay que corregirlas aquí — un dato legal desactualizado en una
 * página de venta es peor que no tenerlo.
 */

import type { CiudadContadorSeo } from './contador-dian-seo-content';
import type { NecesidadContadorSeo } from './contador-necesidad-seo-content';

/** Misma forma que las páginas por necesidad: reutilizan la misma plantilla,
 *  así que no hay ningún componente nuevo que mantener. */
export type VentaContadorSeo = NecesidadContadorSeo;

const F = (a: string, b: string, c: string): [string, string, string] => [a, b, c];

/** Las seis fotos disponibles, rotadas para que dos páginas seguidas no se
 *  vean iguales. Repetirlas no es problema —son fotos de contexto, no
 *  capturas del producto—, pero repetirlas en el MISMO orden sí se nota. */
const FOTOS_A = F('/images/seo/dashboard-desk.jpg', '/images/seo/office-tablet-woman.jpg', '/images/seo/app-man-blue.jpg');
const FOTOS_B = F('/images/seo/app-woman-blue.jpg', '/images/seo/tablet-review-woman.jpg', '/images/seo/dashboard-desk.jpg');
const FOTOS_C = F('/images/seo/app-woman-tech-blue.jpg', '/images/seo/tablet-sign-business.jpg', '/images/seo/office-tablet-woman.jpg');
const FOTOS_D = F('/images/seo/tablet-review-woman.jpg', '/images/seo/app-man-blue.jpg', '/images/seo/app-woman-tech-blue.jpg');

export const VENTAS_CONTADOR: VentaContadorSeo[] = [
  // ── COMPARATIVA: el contador ya tiene un programa ──────────────────────
  {
    slug: 'importar-facturas-electronicas-a-alegra',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#0EA5E9',
    titleTag: 'Importar facturas electrónicas de la DIAN a Alegra sin digitar | Codec Document',
    metaDescription: 'Pasa los XML de la DIAN a Alegra sin teclear factura por factura. Subes tu plantilla de Alegra una vez, señalas las columnas y cada mes descargas el archivo ya lleno.',
    h1Accent: 'De los XML de la DIAN',
    h1Rest: 'a Alegra, sin teclear una cifra',
    heroSector: 'Para quien trabaja con Alegra',
    subtitulo: 'Subes tu plantilla vacía una vez. El mes siguiente eliges el perfil y descargas el archivo lleno.',
    intro: 'Alegra resuelve bien la contabilidad del día a día, pero la entrada de las compras sigue siendo manual: alguien abre cada factura recibida y teclea NIT, fecha, base, IVA y retenciones. Con veinte clientes y trescientos documentos al mes, esa entrada de datos es la mitad del trabajo del cierre y es donde aparecen los errores que después hay que buscar. El problema no es Alegra: es que entre la DIAN y cualquier programa contable no existe un puente. Codec Document es ese puente, y funciona sin pedirle nada a Alegra.',
    sectorTitulo: 'Por qué no hace falta una integración oficial',
    sectorTexto: 'Una integración por API obligaría a que Alegra la publicara, a mantenerla cuando cambie y a pedirte credenciales de tu cuenta. En vez de eso, el contador sube su propia plantilla de importación de Alegra —el archivo vacío que el programa ya acepta— y señala una sola vez qué columna es cuál. A partir de ahí, cada mes se descarga ese mismo archivo con los datos dentro, listo para importar. Funciona con Alegra, y funcionaría igual si mañana cambias de programa.',
    dolores: [
      { titulo: 'Teclear lo que ya está en un archivo', texto: 'El XML de la DIAN trae el NIT, la base gravable, cada impuesto con su código y las retenciones. Digitarlo a mano es copiar a mano un dato que el computador ya tiene.' },
      { titulo: 'Un error de tecleo que aparece en la declaración', texto: 'Una base mal copiada no se nota al momento: se nota cuando el IVA descontable no cuadra y hay que revisar trescientos documentos para encontrar cuál fue.' },
      { titulo: 'Volver a configurar todos los meses', texto: 'Las soluciones de conversión genéricas te hacen mapear las columnas cada vez. Al tercer mes se abandona y se vuelve a teclear.' },
    ],
    respuesta: 'El mapeo se guarda. Es la diferencia entre una herramienta que se usa una vez y una que se usa todos los meses: la primera vez configuras, las siguientes eliges el perfil y descargas.',
    caso: {
      titulo: 'Cómo queda el cierre de un mes',
      texto: 'Sueltas el comprimido que te dio la DIAN, o dejas que las facturas lleguen solas a tu dirección de correo. Codec lee cada documento, cuadra sus cifras y te marca únicamente los que no cuadran, que suelen ser un puñado. Revisas esos. Después eliges tu perfil de Alegra y descargas el archivo lleno. Lo importas en Alegra como cualquier otro archivo, porque es exactamente el formato que Alegra te dio.',
      antes: 'Trescientas facturas digitadas a mano, dos minutos cada una',
      despues: 'Un archivo de Alegra lleno, y cinco documentos revisados a criterio',
    },
    fotos: FOTOS_A,
    cierre: 'La ventaja de trabajar contra tu propia plantilla es que no dependes de que nadie mantenga una integración. Si Alegra cambia su formato de importación, subes la plantilla nueva y vuelves a señalar las columnas una vez. Y si algún día trabajas con otro programa, el procedimiento es idéntico: el motor no sabe nada de Alegra, sabe leer documentos de la DIAN y escribir en el archivo que le des.',
    faq: [
      { q: '¿Necesito darle mis claves de Alegra a Codec Document?', a: 'No. No se conecta a tu cuenta de Alegra. Tú subes la plantilla de importación vacía y descargas ese mismo archivo con los datos dentro; el paso de importarlo lo haces tú desde Alegra.' },
      { q: '¿Sirve si mi plantilla de Alegra tiene columnas propias?', a: 'Sí. Se leen los encabezados de tu archivo y se auto-asignan los que se puedan reconocer por el nombre; los que falten los señalas tú. Ese mapeo queda guardado para los meses siguientes.' },
      { q: '¿Qué pasa con la cuenta contable?', a: 'No viene en el XML de la DIAN: sale de tu plan de cuentas, no del documento. Se te dice en pantalla antes de descargar, para que no lo descubras al abrir el archivo.' },
    ],
  },
  {
    slug: 'importar-facturas-electronicas-a-world-office',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#7C3AED',
    titleTag: 'Importar facturas electrónicas de la DIAN a World Office | Codec Document',
    metaDescription: 'Lleva los XML de la DIAN a World Office sin digitar. Subes la plantilla de importación de World Office, señalas las columnas una vez y cada mes descargas el archivo lleno.',
    h1Accent: 'Los XML de la DIAN',
    h1Rest: 'dentro de World Office',
    heroSector: 'Para quien trabaja con World Office',
    subtitulo: 'Tu plantilla de importación, llena y lista, sin abrir un solo XML.',
    intro: 'World Office acepta importaciones por archivo, y ahí está la oportunidad: si el archivo llega lleno, la digitación desaparece. Lo que hoy toma una tarde —abrir cada factura recibida, leer las cifras y teclearlas— se convierte en descargar un archivo y subirlo. La parte difícil nunca fue World Office: fue conseguir que los datos de la DIAN llegaran en el formato exacto que World Office espera, sin que el contador tenga que armarlo a mano cada mes.',
    sectorTitulo: 'El formato lo pones tú, no nosotros',
    sectorTexto: 'No se adivina cómo importa World Office ni se mantiene una plantilla escrita de memoria: el contador sube el archivo de importación vacío que su propia instalación acepta. Se leen sus encabezados, se asignan las columnas que se reconocen por el nombre y él corrige las que falten. Ese mapeo queda guardado con un nombre, así que el mes siguiente es elegirlo y descargar. Si su versión de World Office pide columnas distintas de las de otro despacho, funciona igual, porque la plantilla es la suya.',
    dolores: [
      { titulo: 'La importación exige un formato exacto', texto: 'Una columna de más, de menos o en otro orden y World Office rechaza el archivo. Armarlo a mano cada mes es tan lento como digitar.' },
      { titulo: 'Los impuestos no son una sola columna', texto: 'IVA, INC, ReteFuente, ReteIVA y ReteICA van separados y con su código. Extraerlos del XML uno por uno es donde se pierde la tarde.' },
      { titulo: 'Las notas crédito hay que restarlas', texto: 'Si entran con el mismo signo que las facturas, la base y el IVA descontable quedan inflados. Y eso es la cifra que va a la declaración.' },
    ],
    respuesta: 'Las notas crédito se restan y las notas débito se suman, por tipo de documento y no por una convención de signo. Es una regla aritmética fija, verificada contra documentos reales de varios emisores.',
    caso: {
      titulo: 'Un cierre de mes, de principio a fin',
      texto: 'Entran los documentos —arrastrando el ZIP de la DIAN, bajándolos por CUFE con tu token, o dejando que lleguen solos a tu dirección de correo—. Codec lee cada uno, comprueba que sus propias cifras cuadren y aparta los que no. Tú miras sólo esos. Después eliges tu perfil de World Office y descargas. El archivo que baja es el tuyo, con tus columnas, listo para importar.',
      antes: 'Armar el archivo de importación a mano, columna por columna',
      despues: 'Elegir el perfil guardado y descargar',
    },
    fotos: FOTOS_B,
    cierre: 'Conviene saber que hay una parte que ninguna herramienta puede resolver sola: la cuenta contable. No está en el XML de la DIAN porque no es un dato del documento, es una decisión de tu plan de cuentas. Se dice en pantalla antes de descargar, y ahí es donde después encajan las reglas por proveedor —que ese proveedor siempre va a esta cuenta—, que es lo que termina de eliminar el trabajo repetitivo.',
    faq: [
      { q: '¿Funciona con cualquier versión de World Office?', a: 'Funciona con la plantilla de importación que tu instalación acepte, sea cual sea. No se depende de una versión concreta porque el formato lo aporta tu propio archivo.' },
      { q: '¿Tengo que volver a configurar cada mes?', a: 'No. El mapeo de columnas se guarda con un nombre. Al mes siguiente eliges el perfil y descargas directamente.' },
      { q: '¿Las retenciones vienen separadas?', a: 'Sí. ReteFuente, ReteIVA y ReteICA se leen del XML por su código de impuesto y van en columnas distintas, además de una hoja de retenciones aparte en el Excel de cuatro hojas.' },
    ],
  },
  {
    slug: 'importar-facturas-electronicas-a-helisa',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#059669',
    titleTag: 'Importar facturas electrónicas de la DIAN a Helisa sin digitar | Codec Document',
    metaDescription: 'Pasa los XML de la DIAN a Helisa sin teclear. Subes tu plantilla de importación, señalas las columnas una vez y cada mes descargas el archivo listo para cargar.',
    h1Accent: 'De la DIAN a Helisa',
    h1Rest: 'sin digitar factura por factura',
    heroSector: 'Para quien trabaja con Helisa',
    subtitulo: 'El archivo de importación de Helisa, lleno con los documentos del periodo.',
    intro: 'Helisa lleva décadas en los despachos contables colombianos y su importación por archivo funciona bien cuando el archivo está bien armado. El problema es armarlo: los datos vienen repartidos en cientos de XML que hay que abrir uno por uno. Cada factura recibida tiene su NIT, su base gravable, sus impuestos con código y sus retenciones, y todo eso hay que sacarlo y ordenarlo en columnas antes de que Helisa lo acepte. Eso es lo que Codec Document hace por ti.',
    sectorTitulo: 'Tu plantilla, no una que nosotros supongamos',
    sectorTexto: 'No hay una plantilla de Helisa escrita dentro de la herramienta, y es a propósito: cada despacho tiene la suya, con sus columnas y a veces con sus macros. El contador sube su archivo vacío, se leen los encabezados y se asignan los que se reconocen; los demás los señala él. El archivo que descarga después es el mismo que subió, con las filas dentro — conserva sus formatos y sus hojas de configuración.',
    dolores: [
      { titulo: 'Cada XML hay que abrirlo para leerlo', texto: 'Un XML no se lee de un vistazo: las cifras están entre etiquetas, y las de impuestos repetidas por cada tipo. Encontrar la base gravable exige saber dónde mirar.' },
      { titulo: 'La base gravable no es el total antes de impuestos', texto: 'Los renglones excluidos de IVA no aparecen en la base gravable pero sí suman en el total del documento. Confundirlos descuadra el cierre.' },
      { titulo: 'Trescientos documentos, un archivo', texto: 'Ordenar a mano trescientas filas con quince columnas cada una es donde se va el día, y donde se cuela el error que después nadie encuentra.' },
    ],
    respuesta: 'La base gravable se lee del campo que la DIAN usa para eso, no del total menos los impuestos. Es una distinción que sólo se descubre revisando documentos reales, y está verificada contra facturas de varios emisores distintos.',
    caso: {
      titulo: 'Lo que cambia en la práctica',
      texto: 'Sueltas el comprimido tal como te lo entregó la DIAN, sin descomprimir. Codec abre cada documento en tu propio navegador —los documentos fiscales no salen de tu equipo para procesarse—, comprueba que sus cifras cuadren y te marca lo que no. Revisas eso, eliges tu perfil de Helisa y descargas el archivo lleno.',
      antes: 'Una tarde armando el archivo de importación',
      despues: 'Un archivo descargado y unos pocos documentos revisados',
    },
    fotos: FOTOS_C,
    cierre: 'Si tu instalación de Helisa exige un formato antiguo de Excel, conviene comprobarlo con una plantilla pequeña antes del cierre. El procedimiento es el mismo, pero es mejor descubrir un detalle de formato un martes cualquiera que el día 17 a las nueve de la noche. Y una vez guardado el perfil, ese paso no se repite.',
    faq: [
      { q: '¿Me devuelve mi mismo archivo o uno nuevo?', a: 'El tuyo. Se escriben las filas dentro del archivo que subiste, conservando formatos, macros y hojas de configuración que pueda tener.' },
      { q: '¿Y si mi plantilla tiene columnas que no existen en la DIAN?', a: 'Se dejan vacías y se te dice cuáles son antes de descargar. La cuenta contable es el caso típico: no está en el XML porque sale de tu plan de cuentas.' },
      { q: '¿Puedo tener más de un perfil guardado?', a: 'Sí. Es lo normal si manejas clientes con configuraciones distintas: cada perfil recuerda su propio mapeo de columnas.' },
    ],
  },
  {
    slug: 'alternativa-a-qfe-collector',
    ciudad: '', departamento: '', intencion: 'comparativa',
    color: '#DC2626',
    titleTag: 'Alternativa web a QFe Collector para descargar facturas de la DIAN | Codec Document',
    metaDescription: 'Compara: los descargadores de escritorio se instalan en un solo computador y se pagan por año. Codec Document funciona en el navegador, sin instalar, y tiene plan gratuito de 100 documentos al mes.',
    h1Accent: 'Una alternativa web',
    h1Rest: 'a los descargadores de escritorio',
    heroSector: 'Comparativa honesta',
    subtitulo: 'Sin instalar nada, sin licencia anual por adelantado, y con el cruce contra tu contabilidad incluido.',
    intro: 'Los descargadores masivos de facturas que se usan hoy en Colombia son aplicaciones de escritorio para Windows: se instalan en un computador concreto, se pagan por licencia anual y hacen bien una cosa —bajar los XML—. Funcionan. La pregunta es si eso es todo lo que necesitas, porque bajar los archivos es el primer paso de un trabajo que sigue: leerlos, cuadrarlos, encontrar los que no cuadran y llevarlos a tu programa contable. Esta página compara las dos formas sin descalificar a nadie.',
    sectorTitulo: 'Escritorio o navegador: qué cambia de verdad',
    sectorTexto: 'Una aplicación de escritorio vive en un computador. Si trabajas desde la oficina y desde la casa, o si tienes un asistente, la licencia se queda en la máquina donde se instaló. Una herramienta web se abre desde cualquier equipo con la misma cuenta, se actualiza sola cuando la DIAN cambia algo, y no depende de que alguien tenga permisos de administrador para instalarla. A cambio, una aplicación de escritorio descarga desde tu propia conexión, lo que le da más margen frente a los límites de la DIAN. Son ventajas distintas, y conviene saber cuál pesa más en tu caso.',
    dolores: [
      { titulo: 'Bajar los XML no es terminar el trabajo', texto: 'Con los archivos en una carpeta todavía falta leerlos, cuadrarlos y llevarlos al programa contable. Ahí es donde se va la mayor parte del tiempo.' },
      { titulo: 'Pagar un año por adelantado para probar', texto: 'Una licencia anual obliga a decidir antes de saber si la herramienta sirve para tu forma de trabajar. Es mucho compromiso para una prueba.' },
      { titulo: 'Instalada en un solo computador', texto: 'El que trabaja desde dos sitios, o el despacho con dos personas, descubre el límite el primer mes.' },
    ],
    respuesta: 'Codec Document hace las dos cosas: baja los documentos y además los lee, los cuadra, te señala los que no cuadran y te entrega el Excel o la plantilla de tu programa contable. Y se prueba gratis con 100 documentos al mes, sin tarjeta.',
    caso: {
      titulo: 'Lo que se puede probar antes de pagar',
      texto: 'Cien documentos al mes en el plan gratuito son un cliente pequeño entero, o una muestra grande de uno mediano. Con eso se comprueba lo único que importa: si las cifras que salen coinciden con las tuyas. Se sube el comprimido, se mira el cuadre, se descarga el Excel y se compara contra lo que ya tenías registrado. Si coincide, la decisión de pagar es sobre algo que ya viste funcionar.',
      antes: 'Decidir por una licencia anual antes de probar',
      despues: 'Cien documentos al mes gratis, y pagar sólo si convence',
    },
    fotos: FOTOS_D,
    cierre: 'Una diferencia técnica que conviene entender: una herramienta web descarga desde direcciones compartidas, y la DIAN limita cuántas peticiones acepta por dirección. Por eso Codec baja a ritmo moderado, con un gobernador de concurrencia, en vez de a toda velocidad — es lo que evita que un bloqueo afecte a todos los clientes a la vez. En la práctica significa que una descarga grande tarda más que en una aplicación de escritorio, y es un intercambio deliberado: preferimos que tarde a que deje de funcionar.',
    faq: [
      { q: '¿Tengo que instalar algo?', a: 'No. Funciona en el navegador, desde cualquier computador, con la misma cuenta. Los documentos se procesan en tu propio equipo aunque la herramienta sea web.' },
      { q: '¿Es más lento que un descargador de escritorio?', a: 'En la descarga desde la DIAN, sí: se baja a ritmo moderado a propósito, porque el tráfico sale de direcciones compartidas y la DIAN bloquea a quien la satura. En el procesamiento no, porque ocurre en tu propio equipo.' },
      { q: '¿Qué hace de más?', a: 'Cuadra cada documento contra sus propias cifras, separa los que no cuadran, cruza lo de la DIAN contra tu contabilidad para encontrar IVA que dejaste de descontar, y entrega el Excel de cuatro hojas o la plantilla de tu programa contable.' },
    ],
  },
  {
    slug: 'programa-para-descargar-facturas-dian',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#2563EB',
    titleTag: 'Programa para descargar facturas electrónicas de la DIAN (2026) | Codec Document',
    metaDescription: 'Descarga masiva de facturas electrónicas de la DIAN desde el navegador, sin instalar nada. Pega tus CUFE, elige la carpeta y los documentos bajan y se analizan solos. 100 gratis al mes.',
    h1Accent: 'El programa para bajar',
    h1Rest: 'tus facturas de la DIAN',
    heroSector: 'Descarga masiva',
    subtitulo: 'Pegas la lista de CUFE una vez. Los documentos bajan, se leen y se cuadran sin que abras ninguno.',
    intro: 'El portal de la DIAN permite descargar los documentos que recibiste, pero de uno en uno: cada archivo en su propio comprimido, dentro de una sesión que caduca a los sesenta minutos. Para consultar una factura puntual está bien. Para un cierre mensual de trescientos documentos, no. Lo que hace falta es algo que tome la lista completa y baje todo, y que además deje los datos listos para usar en vez de dejar una carpeta con trescientos archivos ilegibles.',
    sectorTitulo: 'Del listado de la DIAN a los documentos, sin pasos intermedios',
    sectorTexto: 'El punto de partida es el listado que la propia DIAN exporta del periodo, que trae la columna de CUFE. Se pega esa columna entera —sin limpiarla— y la herramienta hace el resto: pide cada documento, lo guarda y lo analiza. Y si algunos ya los tenías cargados, te lo dice antes de bajar nada, así que no se repite trabajo ni se gasta cupo en documentos que ya estaban.',
    dolores: [
      { titulo: 'Un comprimido por documento', texto: 'No existe un botón de «descargar todo». Trescientos documentos son trescientas descargas y trescientas descompresiones.' },
      { titulo: 'El token vence a mitad', texto: 'Sesenta minutos y un solo uso. En una descarga larga se vence casi siempre, y hay que pedir otro y retomar donde iba.' },
      { titulo: 'Y al final, una carpeta de XML ilegibles', texto: 'Con los archivos bajados todavía no tienes nada: falta abrirlos, entender dónde está cada cifra y pasarlas a tu Excel.' },
    ],
    respuesta: 'Si el token vence a mitad, pides otro, lo pegas y la descarga continúa donde iba: no se repite lo ya descargado. Y al terminar no queda una carpeta de archivos, queda una tabla con las cifras leídas y cuadradas.',
    caso: {
      titulo: 'Los cuatro pasos reales',
      texto: 'Entras a la DIAN, pides un token y exportas el listado del periodo. Vuelves a pedir un segundo token —ése es el que se usa para descargar—, copias la dirección del enlace del correo sin abrirlo y la pegas. Pegas la columna de CUFE, eliges la carpeta y le das a descargar. A partir de ahí no hay que hacer nada: los documentos bajan a ritmo moderado y entran directo al analizador.',
      antes: 'Una tarde de descargas y descompresiones',
      despues: 'Una lista pegada y una tabla con todo leído',
    },
    fotos: FOTOS_A,
    cierre: 'Vale la pena decir qué no se puede: no existe una API pública que permita a un tercero descargar los documentos de un contribuyente sin su intervención. Los servicios oficiales de la DIAN son para emitir, no para consultar en nombre de otro. Por eso el token lo pides tú y lo pegas tú: esa parte necesita tus claves y no hay forma legítima de saltarla. Todo lo demás sí se automatiza.',
    faq: [
      { q: '¿Necesito instalar algo?', a: 'No. Funciona en el navegador. Los documentos se guardan en la carpeta de tu equipo que tú elijas.' },
      { q: '¿Por qué hace falta un segundo token?', a: 'El primero abre la sesión para exportar el listado del periodo. El segundo es el que autentica las descargas. Son dos correos distintos de «Token Acceso Dian».' },
      { q: '¿Qué pasa si la DIAN me bloquea por descargar mucho?', a: 'Se descarga a ritmo moderado con un límite de peticiones por segundo, precisamente para no llegar a ese punto. Es más lento a propósito.' },
    ],
  },
  {
    slug: 'software-para-contadores-colombia',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#1D4ED8',
    titleTag: 'Software para contadores en Colombia: automatiza el cierre mensual | Codec Document',
    metaDescription: 'Herramienta colombiana para contadores: descarga los XML de la DIAN, los cuadra, encuentra el IVA que dejaste de descontar y entrega el Excel o la plantilla de tu programa contable.',
    h1Accent: 'Software para contadores',
    h1Rest: 'hecho para el cierre colombiano',
    heroSector: 'Para despachos y contadores independientes',
    subtitulo: 'No reemplaza tu programa contable. Elimina la digitación que hay antes de él.',
    intro: 'La mayoría del software que se le ofrece a un contador colombiano quiere ser su programa contable: llevar la contabilidad completa, emitir, declarar. Codec Document no compite con eso. Se ocupa del tramo que ningún programa cubre y que se hace a mano en todos los despachos del país: convertir los documentos electrónicos que la DIAN tiene en información contable lista para usar. Ese tramo es donde se van las horas del cierre y donde aparecen los errores que después cuesta encontrar.',
    sectorTitulo: 'Qué hace exactamente, sin adornos',
    sectorTexto: 'Trae los documentos por cuatro caminos —arrastrando el comprimido de la DIAN, bajándolos por CUFE con tu token, verificando contra la lista del portal cuáles te faltan, o recibiéndolos por una dirección de correo tuya—. Lee facturas, notas crédito, notas débito y documentos equivalentes POS. Comprueba que cada uno cuadre consigo mismo y aparta los que no. Cruza lo de la DIAN contra tu contabilidad. Y entrega el Excel de cuatro hojas o la plantilla de tu propio programa.',
    dolores: [
      { titulo: 'Ningún programa contable lee la DIAN por ti', texto: 'Siigo, Alegra, World Office y Helisa reciben datos; no van a buscarlos. El puente entre la DIAN y ellos lo pone una persona con un teclado.' },
      { titulo: 'El cierre depende de que nadie se equivoque', texto: 'Trescientos documentos digitados a mano a las nueve de la noche del día 17 es exactamente la situación en la que se cometen errores.' },
      { titulo: 'Lo que falta no se ve', texto: 'Un documento que está en la DIAN y no en tus libros es IVA que dejaste de descontar. Nadie lo echa de menos porque no está.' },
    ],
    respuesta: 'De trescientos documentos, quizá cinco necesitan tu criterio. Los otros doscientos noventa y cinco no los abres. Ahí es donde están las horas.',
    caso: {
      titulo: 'El mes de un despacho con veinte clientes',
      texto: 'Hoy: por cada factura recibida, abrir el correo, bajar el adjunto, buscarlo en el explorador, abrir el XML —que es ilegible— o el PDF, y teclear NIT, fecha, base, IVA y retenciones. Dos minutos por documento cuando todo va bien. Trescientos documentos son diez horas. Con la herramienta: los documentos entran solos o de un arrastre, se leen y se cuadran, y el contador revisa únicamente lo marcado. La digitación desaparece.',
      antes: 'Diez horas tecleando cifras que ya estaban en un archivo',
      despues: 'Una hora revisando lo que de verdad necesita criterio',
    },
    fotos: FOTOS_B,
    cierre: 'Está hecho para la norma colombiana, no traducido de otro país. Distingue una nota crédito de una nota débito para el signo, sabe que la base gravable no es el total menos los impuestos, y conoce reglas que no se ven en el archivo —como que un documento equivalente POS a «Consumidor final» no da derecho a IVA descontable aunque venga firmado y validado por la DIAN—. Esas reglas son la diferencia entre un conversor de archivos y una herramienta contable.',
    faq: [
      { q: '¿Reemplaza a mi programa contable?', a: 'No. Se ocupa del tramo anterior: convertir los documentos de la DIAN en datos listos y entregártelos en el formato que tu programa acepta.' },
      { q: '¿Los documentos de mis clientes salen de mi computador?', a: 'El procesamiento ocurre en tu propio navegador. Lo que se guarda son las cifras ya leídas, en tu cuenta y separadas de las de cualquier otro contador.' },
      { q: '¿Cuánto cuesta empezar?', a: 'Cien documentos al mes, gratis y sin tarjeta. Es un cliente pequeño entero, suficiente para comprobar si las cifras coinciden con las tuyas antes de decidir.' },
    ],
  },
  {
    slug: 'excel-facturas-electronicas-plantilla-contable',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#047857',
    titleTag: 'Excel de facturas electrónicas de la DIAN listo para declarar | Codec Document',
    metaDescription: 'Un Excel de cuatro hojas con tus facturas electrónicas: resumen del periodo, detalle línea por línea, un renglón por documento y las retenciones aparte. Con las notas crédito ya restadas.',
    h1Accent: 'El Excel de tus facturas',
    h1Rest: 'ya cuadrado y listo',
    heroSector: 'Reporte de cuatro hojas',
    subtitulo: 'Resumen, detalle, un renglón por documento y retenciones. Con las notas crédito restadas donde tienen que estarlo.',
    intro: 'El reporte que un contador necesita del periodo no es una lista de archivos: es un resumen que cuadre, un detalle donde buscar cuando algo no cuadra, y las retenciones separadas para el certificado. Armar eso a mano desde los XML de la DIAN es el trabajo de una tarde larga, y basta un signo mal puesto en las notas crédito para que la cifra que va a la declaración salga inflada. Este Excel se descarga hecho.',
    sectorTitulo: 'Qué trae cada hoja, y por qué son cuatro',
    sectorTexto: 'La hoja General resume el periodo: bases, impuestos y totales, con las notas crédito ya restadas — es la cifra que se lleva a la declaración. La hoja Detallado baja a nivel de línea, para cuando hay que entender de dónde salió un número. La tercera pone un renglón por documento, que es el formato que la mayoría de programas contables espera importar. Y la cuarta separa las retenciones, porque van a un trámite distinto y mezclarlas obliga a filtrar cada vez.',
    dolores: [
      { titulo: 'El signo de las notas crédito', texto: 'Si una nota crédito suma en vez de restar, la base y el IVA descontable quedan inflados. Y el IVA descontable es exactamente lo que se declara.' },
      { titulo: 'Un resumen sin detalle no sirve', texto: 'Cuando el total no cuadra hay que poder bajar hasta la línea que lo causó. Sin la hoja de detalle, toca volver a abrir los XML.' },
      { titulo: 'Las retenciones mezcladas', texto: 'Van a un trámite distinto y con otros plazos. Filtrarlas a mano cada mes es tiempo que no aporta nada.' },
    ],
    respuesta: 'El signo va por TIPO de documento: la nota crédito resta y la nota débito suma. No es «las notas llevan signo negativo» — esa suposición es la que descuadra los cierres.',
    caso: {
      titulo: 'Un error que costó encontrarlo',
      texto: 'Durante el desarrollo, la hoja de resumen sumaba las notas crédito en positivo. El total del periodo salía más alto de lo que era y el IVA descontable también, que es la cifra que va a la declaración. El fallo no se veía en una prueba pequeña: sólo aparecía con un periodo que tuviera notas crédito de verdad. Hoy hay diecisiete comprobaciones automáticas que fijan esa regla y las relacionadas, para que no vuelva a colarse.',
      antes: 'Una tarde armando el Excel, y un signo que nadie revisa',
      despues: 'Cuatro hojas descargadas, con la aritmética verificada',
    },
    fotos: FOTOS_C,
    cierre: 'Si prefieres el formato de tu propio programa contable en vez del Excel genérico, también se puede: subes tu plantilla de importación vacía, señalas las columnas una vez y el mapeo queda guardado para los meses siguientes. Las dos salidas parten de los mismos datos ya cuadrados, así que da igual cuál uses: las cifras son las mismas.',
    faq: [
      { q: '¿Puedo abrirlo en Excel y en Google Sheets?', a: 'Sí. Es un archivo .xlsx estándar, sin macros ni dependencias.' },
      { q: '¿El resumen incluye los documentos que requieren revisión?', a: 'Se te señalan aparte antes de exportar, para que decidas. Un documento que no cuadra consigo mismo no debería entrar en una declaración sin que lo mires.' },
      { q: '¿Sirve para sustentar la declaración?', a: 'Es la información de tus documentos, ordenada y cuadrada. El soporte legal sigue siendo el XML, que es el documento con validez; por eso se conserva.' },
    ],
  },
  // ── DOLOR: no busca herramienta, busca alivio ──────────────────────────
  {
    slug: 'cierre-contable-sin-digitar-facturas',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#B45309',
    titleTag: 'Cerrar el mes sin digitar facturas una por una | Codec Document',
    metaDescription: 'La digitación de facturas recibidas es la mitad del cierre mensual y la fuente de casi todos los errores. Cómo eliminarla sin cambiar de programa contable.',
    h1Accent: 'Cerrar el mes',
    h1Rest: 'sin digitar una sola factura',
    heroSector: 'El cierre mensual',
    subtitulo: 'La digitación no es trabajo contable. Es transcripción, y la hace mejor una máquina.',
    intro: 'Hay una parte del cierre que exige criterio profesional: decidir cuentas, interpretar un caso raro, revisar lo que no cuadra. Y hay otra que no exige nada más que paciencia: leer una cifra de una pantalla y teclearla en otra. Un contador con veinte clientes dedica la mayor parte del cierre a la segunda. Esta página trata de cómo eliminarla, sin cambiar de programa contable y sin pedirle nada a la DIAN que no se pueda pedir.',
    sectorTitulo: 'Por qué la digitación se resiste a desaparecer',
    sectorTexto: 'Porque el dato está en un formato que las personas no leen. El XML de la DIAN tiene toda la información —NIT, base gravable, cada impuesto con su código, retenciones—, pero entre etiquetas. Así que el contador abre el PDF, que sí se lee, y teclea desde ahí. Es un rodeo absurdo: se convierte un dato estructurado en algo visual para volver a convertirlo en dato tecleándolo. La solución no es leer más rápido, es leer el XML directamente.',
    dolores: [
      { titulo: 'Dos minutos por documento', texto: 'Abrir el correo, bajar el adjunto, buscarlo, abrirlo, leer, teclear. Trescientos documentos son diez horas, y son diez horas todos los meses.' },
      { titulo: 'Los errores no aparecen al momento', texto: 'Una base mal tecleada no avisa. Se descubre cuando el IVA descontable no cuadra, y entonces hay que revisar los trescientos para encontrar cuál fue.' },
      { titulo: 'Es el trabajo que menos vale y más cansa', texto: 'Un cliente no paga por transcripción, paga por criterio. Las horas de digitación son las que no se facturan bien.' },
    ],
    respuesta: 'El XML se lee directamente, con sus códigos de impuesto y su base gravable. No se convierte a PDF ni se interpreta visualmente: se lee el dato que ya está ahí.',
    caso: {
      titulo: 'Qué queda cuando la digitación desaparece',
      texto: 'Queda lo que sí es trabajo contable. Los documentos entran, se leen y se cuadran solos, y lo que llega a tus manos son los que no cuadran: una base que no coincide con la suma de sus líneas, un impuesto con un código raro, un documento equivalente que no da derecho a descontar. De trescientos, suele ser un puñado. Eso sí exige criterio, y para eso te contrataron.',
      antes: 'Diez horas de transcripción y cinco de revisión',
      despues: 'Cero de transcripción y una de revisión',
    },
    fotos: FOTOS_D,
    cierre: 'Hay un efecto secundario que se nota al segundo mes: cuando el cierre deja de ser una maratón, se puede hacer varias veces. En vez de acumular todo para el día 15, se procesa lo que va llegando y el cierre se convierte en revisar lo poco que quedó marcado. Es la diferencia entre un trabajo que se sufre una vez al mes y uno que se lleva al día.',
    faq: [
      { q: '¿Tengo que cambiar de programa contable?', a: 'No. La herramienta entrega el Excel o directamente la plantilla de importación de tu programa, sea cual sea.' },
      { q: '¿Y si un documento tiene algo raro?', a: 'Se aparta con el motivo escrito y no entra en los totales sin que lo revises. La idea es que mires poco, no que mires menos de lo que debes.' },
      { q: '¿Cuánto tarda en procesar trescientos documentos?', a: 'Minutos, y ocurre en tu propio navegador. Lo que tarda es la descarga desde la DIAN si los estás bajando de ahí, porque se hace a ritmo moderado a propósito.' },
    ],
  },
  {
    slug: 'iva-descontable-perdido-facturas-no-registradas',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#BE123C',
    titleTag: 'IVA descontable que se pierde por facturas no registradas | Codec Document',
    metaDescription: 'Una factura que está en la DIAN y no en tus libros es IVA que no descontaste: dinero perdido que nadie echa de menos. Cómo encontrar esas facturas cruzando la DIAN contra tu contabilidad.',
    h1Accent: 'El IVA descontable',
    h1Rest: 'que se pierde sin que nadie lo note',
    heroSector: 'Cruce DIAN contra libros',
    subtitulo: 'Lo que falta no se ve. Por eso hay que buscarlo a propósito.',
    intro: 'Un error de digitación se descubre porque algo no cuadra. Una factura que nunca se registró no descuadra nada: simplemente no está, y nadie echa de menos lo que no ve. El resultado es IVA descontable que no se descontó — dinero real del cliente que se quedó sin usar, mes tras mes, sin que aparezca en ningún informe. Encontrarlo exige comparar dos listas: lo que la DIAN dice que recibiste y lo que está registrado en tus libros.',
    sectorTitulo: 'Por qué se pierden facturas',
    sectorTexto: 'No suele ser descuido. Un proveedor manda la factura a un correo que nadie revisa. Otra llega en un ZIP que se descargó pero no se procesó. Otra se registró por un valor distinto y el error se compensó con otro. Y en los meses de mucho volumen, alguna simplemente se salta. Con veinte clientes y trescientos documentos, que se cuelen unos pocos no es negligencia: es aritmética.',
    dolores: [
      { titulo: 'La ausencia no genera alertas', texto: 'Un documento que falta no descuadra el balance ni dispara ningún aviso. Es invisible por definición.' },
      { titulo: 'Comparar dos listas a mano es inviable', texto: 'Trescientos CUFE contra trescientos registros, con formatos distintos. Nadie lo hace todos los meses.' },
      { titulo: 'El costo es del cliente, y es real', texto: 'Cada factura no registrada es IVA que se pagó y no se descontó. No es un error contable abstracto: es caja.' },
    ],
    respuesta: 'El cruce es aritmética determinista, no una estimación ni una sugerencia de inteligencia artificial. Se comparan documento a documento y se reporta lo que falta, lo que sobra y lo que está por otra cifra.',
    caso: {
      titulo: 'Las tres cosas que aparecen al cruzar',
      texto: 'Primero, documentos que la DIAN tiene y tus libros no: eso es IVA que dejaste de descontar. Segundo, documentos registrados por una cifra distinta de la del documento electrónico, que es un error de digitación esperando a descuadrar algo. Y tercero, registros que no corresponden a ningún documento electrónico, que a veces son legítimos y a veces son una duplicación. Las tres listas salen con nombre, número y cifra, para poder ir a arreglarlas.',
      antes: 'Suponer que no falta nada porque nada descuadra',
      despues: 'Una lista concreta de lo que falta, con su valor',
    },
    fotos: FOTOS_A,
    cierre: 'Conviene hacer este cruce aunque se confíe en el proceso, y sobre todo la primera vez: es la forma de saber cuánto se estaba perdiendo antes. Y hay un detalle de aritmética que importa: las notas crédito se comparan por magnitud y no por signo, porque unos programas contables las guardan en negativo y otros en positivo. Asumir una convención marcaría como diferencia toda nota crédito registrada con la otra, llenando el informe de falsos hallazgos.',
    faq: [
      { q: '¿Qué archivo tengo que subir de mi contabilidad?', a: 'El que exporte tu programa contable con los documentos del periodo. Se leen sus encabezados y tú señalas cuál columna es cuál si no se reconocen solas.' },
      { q: '¿La inteligencia artificial decide qué está mal?', a: 'No. El cruce es SQL determinista: la aritmética la hace el sistema, siempre igual. La IA sólo se usa para redactar y priorizar hallazgos, nunca para calcular cifras.' },
      { q: '¿Sirve para periodos ya cerrados?', a: 'Sí, y es donde más aparece. Encontrar hoy IVA no descontado de meses anteriores permite decidir si se corrige.' },
    ],
  },
  {
    slug: 'recibir-facturas-de-proveedores-por-correo',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#0284C7',
    titleTag: 'Recibir las facturas de tus proveedores automáticamente por correo | Codec Document',
    metaDescription: 'Tus proveedores ya te mandan el XML por correo porque la ley los obliga. Una dirección propia convierte esos correos en documentos procesados, sin descargar ni arrastrar nada.',
    h1Accent: 'Que las facturas',
    h1Rest: 'lleguen solas a tu contabilidad',
    heroSector: 'Conector de correo',
    subtitulo: 'Una dirección tuya, que puedes dictar por teléfono. Lo que llega, entra.',
    intro: 'Hay una vía de entrada que ya existe y casi nadie aprovecha: el correo. La norma obliga al emisor a entregar el XML de la factura electrónica al adquiriente, y la forma habitual de hacerlo es por email. Es decir, los documentos ya están llegando todos los días a un buzón. Lo que falta no es conseguirlos: es que dejen de requerir que una persona los baje, los busque en el explorador y los arrastre a algún sitio.',
    sectorTitulo: 'Una dirección propia, sin darnos tu contraseña',
    sectorTexto: 'Se te asigna una dirección de recepción tuya, con el nombre que elijas —el tuyo o el de tu oficina—, para que puedas dictarla por teléfono a un proveedor sin deletrear veinte caracteres. Tú decides qué llega ahí: puedes crear una regla de reenvío en tu correo actual, o darle la dirección directamente a tus proveedores. En ningún momento se pide la contraseña de tu correo ni se accede a tu bandeja.',
    dolores: [
      { titulo: 'Bajar y arrastrar, por cada proveedor y cada mes', texto: 'Abrir el correo, guardar el adjunto, buscarlo en la carpeta de descargas y llevarlo a la herramienta. Multiplicado por todos los proveedores de todos los clientes.' },
      { titulo: 'Los que no mandan la factura no se notan', texto: 'Si no llega, no hay nada que eches de menos hasta el cierre, cuando ya es tarde para reclamar cómodamente.' },
      { titulo: 'El token de la DIAN no sirve de noche', texto: 'Dura sesenta minutos y hay que pedirlo a mano, así que no existe forma de sincronizar automáticamente por ahí. El correo es el único camino desatendido.' },
    ],
    respuesta: 'Lo que llega queda listado con remitente, asunto y fecha. Si un proveedor no mandó su factura, se ve — y sabes a quién reclamarle antes del cierre, no después.',
    caso: {
      titulo: 'Una decisión que conviene entender',
      texto: 'Lo que llega por correo NO se procesa automáticamente: se queda esperando en la bandeja hasta que tú le das a procesar. Podría hacerse solo, pero eso significaría dos caminos distintos calculando lo mismo, y el día que uno se toque y el otro no, el mismo documento daría dos cifras según por dónde entró. En contabilidad eso no es una molestia, es una declaración mal presentada. Así que hay un solo motor, y todo pasa por él.',
      antes: 'Bajar y arrastrar cada adjunto, proveedor por proveedor',
      despues: 'Una bandeja con lo que llegó, y un botón para procesarlo',
    },
    fotos: FOTOS_B,
    cierre: 'Como la dirección es fácil de dictar, también es fácil de adivinar, y puede llegarte correo de desconocidos. Por eso nada se procesa solo: lo que entra espera con su remitente a la vista y lo que no reconoces lo borras sin procesarlo. Es el mismo modelo con el que funciona cualquier dirección de recepción de facturas en Colombia — la protección no es que nadie sepa la dirección, es que quien recibe mira lo que llega.',
    faq: [
      { q: '¿Tengo que darles mi contraseña de correo?', a: 'No. Es una dirección aparte, sólo tuya. Tú decides qué se reenvía ahí; no se accede a tu correo.' },
      { q: '¿Puedo elegir el nombre de la dirección?', a: 'Sí. Puede ser el tuyo o el de tu oficina, para que se pueda dictar por teléfono. La que se genera al activar es aleatoria hasta que le pongas nombre.' },
      { q: '¿Se guarda el PDF también?', a: 'Se guarda el XML, que es el documento con validez legal. El PDF es una representación gráfica y pesa mucho más; si hace falta, se regenera.' },
    ],
  },
  {
    slug: 'cuantas-horas-pierde-un-contador-en-facturas',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#EA580C',
    titleTag: 'Cuántas horas pierde un contador digitando facturas electrónicas | Codec Document',
    metaDescription: 'Haz la cuenta: dos minutos por documento, trescientos documentos al mes. Diez horas de transcripción que no se facturan bien y donde se cometen los errores del cierre.',
    h1Accent: 'Haz la cuenta',
    h1Rest: 'de lo que cuesta digitar',
    heroSector: 'El costo real del cierre',
    subtitulo: 'Dos minutos por documento no parece nada. Trescientos documentos son diez horas.',
    intro: 'Nadie mide el tiempo que dedica a digitar facturas, y por eso nadie lo cuestiona: se asume que es parte del trabajo. Pero la cuenta es sencilla y conviene hacerla al menos una vez. Abrir el correo, bajar el adjunto, encontrarlo en el explorador, abrir el documento, leer las cifras y teclearlas en el programa contable toma alrededor de dos minutos cuando todo va bien. Multiplica eso por los documentos que recibes al mes y tendrás una cifra incómoda.',
    sectorTitulo: 'Dos minutos es la cuenta optimista',
    sectorTexto: 'Dos minutos supone que el archivo estaba donde debía, que el documento se leía bien, que las cifras eran claras y que no hubo que consultar nada. En la realidad hay facturas con renglones excluidos de IVA donde la base gravable no es lo que parece, notas crédito que hay que restar, documentos equivalentes POS con reglas propias, y algún proveedor que mandó el PDF y no el XML. Cada uno de esos casos suma minutos, y son bastantes más de los que uno recuerda.',
    dolores: [
      { titulo: 'Es tiempo que no se factura bien', texto: 'Un cliente paga por criterio contable, no por transcripción. Las horas de digitación son las que peor se cobran y más desgastan.' },
      { titulo: 'Se concentran en los peores días', texto: 'No se reparten a lo largo del mes: caen todas juntas antes del vencimiento, que es cuando más se equivoca uno.' },
      { titulo: 'Crecen con cada cliente nuevo', texto: 'Es el trabajo que impide crecer: aceptar un cliente más significa aceptar más noches de digitación.' },
    ],
    respuesta: 'De trescientos documentos, los que necesitan criterio profesional suelen ser un puñado. El resto es transcripción, y esa la hace mejor y sin cansarse una máquina.',
    caso: {
      titulo: 'La cuenta, con números redondos',
      texto: 'Trescientos documentos al mes a dos minutos son diez horas. Al año son ciento veinte horas, tres semanas de trabajo. Y esa cifra sólo cuenta la digitación: no incluye buscar la factura que faltaba, ni rehacer el cierre cuando una base quedó mal copiada, ni la revisión final para comprobar que todo cuadra. Contando eso, la cifra real es bastante más alta.',
      antes: 'Ciento veinte horas al año transcribiendo',
      despues: 'Ese tiempo, disponible para clientes o para no trabajar de noche',
    },
    fotos: FOTOS_C,
    cierre: 'La conclusión práctica no es «trabaja más rápido». Es que hay una parte del cierre que no requiere ser contador, y mientras siga haciéndola un contador, el despacho no puede crecer sin contratar. Automatizar esa parte no reemplaza a nadie: libera al profesional para lo que sí exige su firma.',
    faq: [
      { q: '¿De dónde sale el cálculo de dos minutos por documento?', a: 'De cronometrar el recorrido completo: abrir el correo, bajar el adjunto, buscarlo, abrirlo, leer y teclear. Es la cuenta optimista, con todo saliendo bien.' },
      { q: '¿Y si recibo menos documentos?', a: 'La cuenta escala igual. Con cien documentos son tres horas y media al mes, que siguen siendo cuarenta al año.' },
      { q: '¿Cuánto tiempo toma con la herramienta?', a: 'El procesamiento son minutos y ocurre solo. Lo que queda es revisar lo marcado, que suele ser un puñado de documentos.' },
    ],
  },
  {
    slug: 'contador-independiente-automatizar-clientes',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#4F46E5',
    titleTag: 'Contador independiente: atender más clientes sin contratar | Codec Document',
    metaDescription: 'El límite de un contador independiente no es su conocimiento, es la digitación. Automatiza la entrada de facturas electrónicas y acepta más clientes sin alargar las noches.',
    h1Accent: 'Más clientes',
    h1Rest: 'sin más noches de trabajo',
    heroSector: 'Para el contador independiente',
    subtitulo: 'Lo que te limita no es lo que sabes. Es cuántas facturas puedes teclear.',
    intro: 'Un contador independiente sabe exactamente cuántos clientes puede llevar, y no es una cifra que dependa de su conocimiento: depende de cuántas facturas puede procesar antes del vencimiento. Aceptar un cliente más significa aceptar varias noches más de digitación, y llega un punto en que no compensa. Ese techo es artificial: lo pone la parte del trabajo que menos criterio requiere.',
    sectorTitulo: 'El techo está en la transcripción, no en la contabilidad',
    sectorTexto: 'Interpretar un caso complejo, decidir una cuenta, sustentar un tratamiento tributario: eso escala mal porque exige tu criterio, pero tampoco es lo que consume el tiempo. Lo que lo consume es abrir trescientos documentos y copiar cifras. Si esa parte se automatiza, el mismo profesional puede llevar bastantes más clientes con las mismas horas — y las horas que quedan se dedican a lo que el cliente de verdad valora.',
    dolores: [
      { titulo: 'Cada cliente nuevo son más noches', texto: 'El trabajo crece de forma lineal con el número de facturas, y las horas del día no.' },
      { titulo: 'Contratar no siempre compensa', texto: 'Un asistente para digitar hay que buscarlo, formarlo y revisarle el trabajo. Para un despacho pequeño, el cálculo casi nunca sale.' },
      { titulo: 'Los picos coinciden entre clientes', texto: 'Todos vencen en las mismas fechas. No se puede repartir la carga a lo largo del mes.' },
    ],
    respuesta: 'La herramienta no reemplaza criterio: elimina transcripción. Sigues revisando lo que no cuadra, que es donde tu firma tiene valor.',
    caso: {
      titulo: 'Cómo cambia la forma de trabajar',
      texto: 'En vez de acumular todo para los días previos al vencimiento, los documentos se procesan según van llegando —o llegan solos, si activas la dirección de correo—. Cuando llega el cierre, el trabajo ya no es procesar trescientos documentos: es revisar los pocos que quedaron marcados y sacar los reportes. El pico deja de existir porque el trabajo se repartió solo.',
      antes: 'Tres noches por cliente antes de cada vencimiento',
      despues: 'Revisión continua, y un cierre que es sacar reportes',
    },
    fotos: FOTOS_D,
    cierre: 'Conviene empezar por un cliente, no por todos. Con el plan gratuito de cien documentos al mes cabe un cliente pequeño entero: se procesa su mes, se compara el Excel contra lo que ya tenías registrado y se comprueba si las cifras coinciden. Si coinciden, la decisión de llevar el resto está tomada sobre evidencia y no sobre una promesa.',
    faq: [
      { q: '¿Puedo manejar varios clientes en la misma cuenta?', a: 'Sí. Los documentos se procesan y consultan desde la misma cuenta, y los reportes se sacan por periodo y por filtros.' },
      { q: '¿Necesito que mis clientes hagan algo?', a: 'No, si trabajas con el comprimido de la DIAN o descargando por CUFE. Si activas la dirección de correo, les pides a sus proveedores que envíen ahí, o creas una regla de reenvío.' },
      { q: '¿Sirve si algunos clientes usan programas contables distintos?', a: 'Sí. Puedes guardar un perfil de exportación por cada programa y elegir el que corresponda al descargar.' },
    ],
  },
  {
    slug: 'oficina-contable-pequena-automatizar',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#0D9488',
    titleTag: 'Automatizar una oficina contable pequeña en Colombia | Codec Document',
    metaDescription: 'Cómo un despacho de dos o tres personas elimina la digitación de facturas electrónicas sin cambiar de programa contable ni instalar nada en cada computador.',
    h1Accent: 'Automatizar un despacho',
    h1Rest: 'de dos o tres personas',
    heroSector: 'Para oficinas contables pequeñas',
    subtitulo: 'Sin instalar en cada equipo, sin licencias por puesto, sin cambiar de programa.',
    intro: 'Un despacho pequeño tiene un problema que los grandes no tienen: no puede permitirse ni una persona dedicada sólo a digitar ni un proyecto de sistemas. Necesita algo que funcione desde el primer día, que no exija instalar nada en cada computador, y que no obligue a cambiar el programa contable con el que ya trabaja. Esta página explica cómo se automatiza la entrada de documentos electrónicos en ese contexto.',
    sectorTitulo: 'Por qué el navegador importa cuando son varios',
    sectorTexto: 'Las herramientas de escritorio se instalan en una máquina y ahí se quedan. En un despacho donde una persona trabaja en la oficina, otra desde la casa y a veces se usa el portátil del cliente, eso obliga a licencias por puesto o a que todo pase por un solo computador. Una herramienta web se abre desde cualquier equipo con la misma cuenta, se actualiza sola y no necesita permisos de administrador para instalarse.',
    dolores: [
      { titulo: 'Nadie tiene tiempo para implantar nada', texto: 'Una herramienta que exija una semana de configuración no se adopta en un despacho pequeño: se abandona en la primera semana ocupada.' },
      { titulo: 'Cambiar de programa contable no es opción', texto: 'La migración cuesta más que el problema que resolvería. Lo que haga falta tiene que convivir con lo que ya hay.' },
      { titulo: 'El conocimiento se queda en una persona', texto: 'Si sólo uno sabe hacer el procedimiento, sus vacaciones son un problema del despacho.' },
    ],
    respuesta: 'No sustituye el programa contable: entrega el archivo en el formato que ese programa acepta. Y el mapeo de columnas queda guardado, así que el procedimiento no vive en la cabeza de nadie.',
    caso: {
      titulo: 'La primera semana, de forma realista',
      texto: 'Se empieza con un cliente y un mes. Se sube el comprimido de la DIAN, se mira qué quedó marcado y se compara el Excel contra lo que ya estaba registrado. Si cuadra, se sube la plantilla del programa contable y se señalan las columnas una vez. A partir de ahí, ese perfil queda guardado y cualquiera del despacho lo usa. No hay implantación, hay un mes de prueba con datos reales.',
      antes: 'Un procedimiento que sólo sabe hacer una persona',
      despues: 'Un perfil guardado que usa cualquiera del equipo',
    },
    fotos: FOTOS_A,
    cierre: 'Un detalle práctico para despachos: conviene guardar un perfil de exportación por cada programa contable con el que se trabaja, con nombres claros. Es lo que convierte la herramienta en algo del despacho y no de la persona que la configuró — y lo que hace que el mes siguiente sea elegir y descargar en vez de volver a empezar.',
    faq: [
      { q: '¿Hay que instalar algo en cada computador?', a: 'No. Se abre en el navegador desde cualquier equipo con la misma cuenta.' },
      { q: '¿Se paga por puesto?', a: 'No. El plan se define por documentos procesados al mes, no por número de personas.' },
      { q: '¿Qué pasa si nos pasamos del cupo?', a: 'Se avisa antes de llegar y los documentos que no se procesaron no se pierden: se vuelve a subir el mismo archivo cuando haya cupo y continúa donde iba.' },
    ],
  },
  {
    slug: 'revisor-fiscal-facturacion-electronica',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#7C3AED',
    titleTag: 'Revisor fiscal: verificar la facturación electrónica de tus revisadas | Codec Document',
    metaDescription: 'Herramienta para revisores fiscales: cruza lo que la DIAN tiene contra lo registrado en libros, con aritmética determinista, y documenta los hallazgos con documento, número y cifra.',
    h1Accent: 'Para el revisor fiscal',
    h1Rest: 'que tiene que poder sustentar',
    heroSector: 'Revisoría fiscal',
    subtitulo: 'Un cruce que se puede documentar: qué falta, qué sobra y qué está por otra cifra.',
    intro: 'El trabajo del revisor fiscal tiene una exigencia que el del contador no tiene en la misma medida: lo que afirma debe poder sustentarse. Decir que la facturación electrónica de una revisada está correctamente registrada exige haberlo comprobado, y comprobarlo a mano sobre cientos de documentos no es viable con la periodicidad que la función requiere. Lo que hace falta es un cruce que se pueda repetir, que sea determinista y que deje constancia de qué se comparó.',
    sectorTitulo: 'Determinista, no estimado',
    sectorTexto: 'El cruce entre lo que la DIAN tiene y lo que está en libros se hace documento a documento con aritmética exacta. No es una estimación ni una sugerencia generada por un modelo: son dos listas comparadas por sus identificadores y sus cifras. Eso importa para la revisoría, porque un hallazgo que no se puede reproducir no sirve como sustento. La inteligencia artificial, si se usa, sólo redacta y prioriza; nunca calcula una cifra.',
    dolores: [
      { titulo: 'Verificar por muestreo deja huecos', texto: 'Una muestra pequeña puede no tocar precisamente los documentos que faltan, que son los que más importan.' },
      { titulo: 'Los hallazgos hay que poder reproducirlos', texto: 'Un informe que dice «faltan documentos» sin decir cuáles y por qué valor no sustenta nada.' },
      { titulo: 'La periodicidad hace inviable el trabajo manual', texto: 'Lo que se hace una vez al año se puede hacer a mano. Lo que hay que revisar cada mes, no.' },
    ],
    respuesta: 'El resultado son tres listas concretas: lo que está en la DIAN y no en libros, lo registrado por una cifra distinta, y lo que está en libros sin documento electrónico que lo respalde. Cada una con documento, número y valor.',
    caso: {
      titulo: 'Un detalle de aritmética que evita falsos hallazgos',
      texto: 'Las notas crédito se comparan por magnitud y no por signo. La razón es que unos programas contables las registran en negativo y otros en positivo, y asumir una convención marcaría como diferencia toda nota crédito guardada con la otra. Un informe lleno de falsos hallazgos obliga a revisarlos uno por uno y termina desacreditando el cruce entero, que es justo lo contrario de lo que se busca.',
      antes: 'Muestreo manual y hallazgos difíciles de sustentar',
      despues: 'Cruce completo, reproducible y con cifras concretas',
    },
    fotos: FOTOS_B,
    cierre: 'Hay una obligación de fondo que conviene tener presente: el artículo 632 del Estatuto Tributario obliga al adquiriente a conservar los documentos que soportan sus operaciones, y en facturación electrónica el documento con validez es el XML, no el PDF. Un despacho que sólo guarda representaciones gráficas tiene un problema de conservación aunque su contabilidad esté correcta.',
    faq: [
      { q: '¿Puedo exportar los hallazgos?', a: 'Sí. El cruce y el detalle salen en el Excel, con documento, número, cifra registrada y cifra del documento electrónico.' },
      { q: '¿Sirve para varias revisadas?', a: 'Sí. Se trabaja por periodo y por filtros, y se pueden guardar perfiles distintos de exportación según el programa contable de cada una.' },
      { q: '¿La IA decide qué es un hallazgo?', a: 'No. La comparación es determinista y siempre da el mismo resultado con los mismos datos. La IA sólo se usa para redactar y ordenar por importancia.' },
    ],
  },
  // ── NORMA: busca por obligación o por miedo ────────────────────────────
  {
    slug: 'documento-equivalente-pos-iva-descontable',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#D97706',
    titleTag: 'Documento equivalente POS: cuándo NO da derecho a IVA descontable | Codec Document',
    metaDescription: 'Un tiquete POS a nombre de «Consumidor final» no da derecho a IVA descontable ni a costos, aunque esté firmado y validado por la DIAN. Cómo detectarlos antes de declarar.',
    h1Accent: 'El tiquete POS',
    h1Rest: 'que no da derecho a descontar',
    heroSector: 'Regla que no se ve en el archivo',
    subtitulo: 'Está firmado, está validado por la DIAN, y aun así no sirve para descontar.',
    intro: 'El documento equivalente electrónico generado por sistemas POS es, con diferencia, el de mayor volumen en muchos negocios. Y trae una trampa que no se ve mirando el archivo: cuando se expide a nombre de «Consumidor final», con el NIT genérico 222222222222, no da derecho a IVA descontable ni a costos y deducciones. El documento está bien formado, tiene su firma y su validación de la DIAN, y aun así no sirve para lo que el contador va a usarlo.',
    sectorTitulo: 'Por qué es fácil que se cuele',
    sectorTexto: 'Porque no hay nada en el documento que lo marque como inválido: es un documento perfectamente legítimo, sólo que expedido sin identificar al adquiriente. Una herramienta que se limite a leer cifras y sumarlas lo va a incluir en la base de IVA descontable sin decir nada, y el error sólo aparece si alguien revisa documento por documento — que es precisamente lo que se estaba tratando de evitar. La regla está en la Resolución DIAN 000165 de 2023 y se relaciona con lo dispuesto en la Resolución 000042 de 2020.',
    dolores: [
      { titulo: 'El archivo se ve correcto', texto: 'Firmado, validado, con su CUDE. No hay ningún indicio técnico de que ese documento no sirva para descontar.' },
      { titulo: 'Es el tipo de documento más frecuente', texto: 'En negocios con punto de venta, los equivalentes POS pueden ser la mayoría del volumen del mes.' },
      { titulo: 'El error infla exactamente lo que se declara', texto: 'Incluirlos aumenta el IVA descontable, que es la cifra que va a la declaración. No es un descuadre interno: es una declaración mal presentada.' },
    ],
    respuesta: 'Los documentos equivalentes POS expedidos a «Consumidor final» se detectan por el NIT genérico del adquiriente y salen a la bandeja de revisión con el motivo escrito, en vez de entrar callados en los totales.',
    caso: {
      titulo: 'Qué se ve en pantalla',
      texto: 'El documento no se descarta ni se borra: se marca. Aparece en la bandeja de revisión indicando que se expidió sin identificar al adquiriente y que, por tanto, no da derecho a IVA descontable ni a costos. El contador decide qué hacer con él —a veces hay una gestión posible con el proveedor para que reexpida el documento identificado—, pero decide sabiendo, no descubriéndolo después.',
      antes: 'Sumado en silencio a la base de IVA descontable',
      despues: 'Marcado, con el motivo y la norma detrás',
    },
    fotos: FOTOS_C,
    cierre: 'Si el proveedor está dispuesto, la salida práctica es pedirle que expida el documento identificando al adquiriente con su NIT. Vale la pena hacerlo durante el mes y no en el cierre: reclamar un documento del periodo anterior es bastante más incómodo, y el tiempo para gestionarlo se acaba justo cuando más se necesita.',
    faq: [
      { q: '¿Qué NIT identifica a «Consumidor final»?', a: 'El genérico 222222222222. Es el que se usa cuando el documento se expide sin identificar al adquiriente.' },
      { q: '¿El documento es inválido entonces?', a: 'No. Es un documento válido y correctamente emitido. Lo que no otorga es el derecho a IVA descontable ni a costos y deducciones para quien lo recibe.' },
      { q: '¿Se puede corregir?', a: 'La vía habitual es pedirle al proveedor que expida el documento identificando al adquiriente. Conviene gestionarlo dentro del periodo.' },
    ],
  },
  {
    slug: 'conservar-xml-facturas-electronicas-obligacion',
    ciudad: '', departamento: '', intencion: 'informacional',
    color: '#334155',
    titleTag: 'Conservar el XML de las facturas electrónicas: qué obliga la norma | Codec Document',
    metaDescription: 'El documento con validez legal es el XML, no el PDF. Qué hay que conservar, por cuánto tiempo según el artículo 632 del Estatuto Tributario, y por qué guardar sólo el PDF no basta.',
    h1Accent: 'El XML es el documento',
    h1Rest: 'el PDF sólo es su foto',
    heroSector: 'Obligación de conservación',
    subtitulo: 'Guardar el PDF y borrar el XML es guardar la fotografía y tirar el original.',
    intro: 'Hay una confusión extendida y con consecuencias: mucha gente conserva el PDF de sus facturas electrónicas y borra el XML, porque el PDF es el que se puede leer. Es exactamente al revés. En la facturación electrónica colombiana el documento es el archivo XML —con su firma digital, su CUFE y la validación de la DIAN—; el PDF es una representación gráfica generada a partir de él, y se puede volver a generar. Lo que no se puede regenerar es el XML.',
    sectorTitulo: 'Qué dice la norma, en corto',
    sectorTexto: 'El artículo 632 del Estatuto Tributario obliga a conservar las informaciones y pruebas relacionadas con las operaciones, por el término establecido, y a ponerlas a disposición de la administración cuando las requiera. Aplicado a facturación electrónica, eso significa el documento electrónico con sus atributos de integridad y autenticidad: la firma y la validación viven en el XML. Un PDF impreso o guardado no acredita esos atributos.',
    dolores: [
      { titulo: 'El PDF no prueba integridad', texto: 'Se puede editar sin dejar rastro evidente. La firma digital y la validación de la DIAN están en el XML, no en su representación gráfica.' },
      { titulo: 'El correo no es un archivo', texto: 'Confiar en que el XML sigue en algún correo antiguo funciona hasta que se depura el buzón o se cambia de proveedor.' },
      { titulo: 'Se descubre cuando ya se necesita', texto: 'La ausencia del XML no molesta en el día a día. Molesta cuando hay que responder un requerimiento.' },
    ],
    respuesta: 'El XML se conserva de forma permanente, porque la obligación de conservación es del adquiriente. El PDF no se guarda: pesa mucho más y se puede regenerar cuando haga falta.',
    caso: {
      titulo: 'Una decisión de diseño que viene de la norma',
      texto: 'Podría guardarse todo —XML y PDF— y no pensar más en ello, pero el PDF pesa alrededor de veinticinco veces más y no aporta nada que el XML no tenga. Así que se conserva el documento con validez legal y la representación gráfica se genera bajo demanda. Es la misma lógica que aplica un archivo bien llevado: se guarda el original y se imprime cuando se necesita, no al revés.',
      antes: 'Carpetas de PDF y XML perdidos en correos antiguos',
      despues: 'El XML conservado y el PDF generado cuando haga falta',
    },
    fotos: FOTOS_D,
    cierre: 'Esta página describe el marco general y no sustituye la asesoría sobre un caso concreto: los plazos y las obligaciones específicas dependen del tipo de contribuyente y de la operación. Lo que no cambia según el caso es cuál de los dos archivos es el documento — y esa parte conviene tenerla clara antes de decidir qué se borra.',
    faq: [
      { q: '¿Basta con guardar el PDF?', a: 'No. El documento con validez es el XML: es donde están la firma digital, el CUFE y la validación de la DIAN. El PDF es una representación gráfica.' },
      { q: '¿Por cuánto tiempo hay que conservarlos?', a: 'Por el término que establece el artículo 632 del Estatuto Tributario para las informaciones y pruebas de las operaciones. El plazo concreto depende del caso; conviene confirmarlo para tu situación.' },
      { q: '¿Y si necesito el PDF para un cliente?', a: 'Se regenera a partir del XML cuando haga falta. Por eso no se almacena: pesa mucho más y no aporta nada que el original no tenga.' },
    ],
  },
  {
    slug: 'validar-cufe-masivo',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#059669',
    titleTag: 'Validar CUFE masivo: qué facturas ya tienes y cuáles te faltan | Codec Document',
    metaDescription: 'Pega la columna de CUFE del listado de la DIAN y descubre al instante cuáles documentos ya están cargados y cuáles faltan. Sin revisar uno por uno.',
    h1Accent: 'Pega tus CUFE',
    h1Rest: 'y sabe qué te falta',
    heroSector: 'Verificación en lote',
    subtitulo: 'La pregunta del cierre —¿los tengo todos?— contestada en un pegado.',
    intro: 'Antes de declarar hay una pregunta que hay que poder contestar con certeza: ¿tengo todos los documentos del periodo? La DIAN permite exportar el listado de lo que recibiste, con su columna de CUFE. Comparar esa lista contra lo que ya está cargado es lo que convierte una suposición en un dato, pero hacerlo a mano sobre trescientas líneas de noventa y seis caracteres cada una no lo hace nadie dos veces.',
    sectorTitulo: 'Qué es el CUFE y por qué sirve para esto',
    sectorTexto: 'El CUFE es el código único que identifica cada factura electrónica: funciona como su huella. Dos documentos no comparten CUFE, así que comparar por CUFE es exacto — no depende de que el número de factura o el nombre del proveedor estén escritos igual en los dos lados. Por eso la verificación en lote se hace con esa columna y no con el número del documento.',
    dolores: [
      { titulo: 'Noventa y seis caracteres por línea', texto: 'Comparar CUFE a ojo es inviable, y comparar por número de factura falla en cuanto dos proveedores repiten numeración.' },
      { titulo: 'Suponer que están todos', texto: 'La mayoría de cierres asume que no falta nada porque nada descuadra. Un documento ausente no descuadra: falta.' },
      { titulo: 'Descubrirlo tarde', texto: 'Enterarse de que faltan documentos el día del vencimiento deja sin margen para conseguirlos.' },
    ],
    respuesta: 'Se pega la columna completa, tal como sale del Excel de la DIAN, sin limpiarla. Se dice cuántos ya están cargados, cuántos faltan, cuántos venían repetidos en la lista y cuántas líneas no tienen forma de CUFE.',
    caso: {
      titulo: 'Y de ahí, directo a bajarlos',
      texto: 'Saber cuáles faltan servía de poco si después había que copiarlos, abrir otra herramienta, pegarlos, elegir carpeta, esperar, buscar esa carpeta y arrastrar los archivos de vuelta. Ahora los que faltan se bajan y se analizan sin salir de la pantalla: se pulsa una vez y entran por el mismo camino que un archivo arrastrado, con las mismas comprobaciones.',
      antes: 'Suponer que no falta nada, o revisarlo a ojo',
      despues: 'La lista exacta de lo que falta, y bajarlo desde ahí',
    },
    fotos: FOTOS_A,
    cierre: 'La verificación no descarga nada de la DIAN por sí sola: cruza tu lista contra lo que ya está cargado en tu cuenta. Es rápida y no consume cupo, así que conviene hacerla varias veces durante el mes en vez de una sola al final — encontrar un documento que falta el día 5 deja tiempo para pedírselo al proveedor.',
    faq: [
      { q: '¿Tengo que limpiar la lista antes de pegarla?', a: 'No. Se puede pegar la columna directamente desde el Excel de la DIAN. Las líneas que no tengan forma de CUFE se reportan aparte.' },
      { q: '¿Qué pasa con los repetidos?', a: 'Se cuentan una sola vez y se te dice cuántos venían repetidos, que suele indicar que el listado se exportó dos veces.' },
      { q: '¿Consume cupo de mi plan?', a: 'No. La verificación sólo compara. El cupo lo consumen los documentos que se procesan con éxito.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-varios-clientes',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#1E40AF',
    titleTag: 'Descargar los XML de la DIAN de varios clientes a la vez | Codec Document',
    metaDescription: 'Un despacho con veinte clientes repite el mismo procedimiento veinte veces cada mes. Cómo organizar la descarga y el procesamiento de documentos electrónicos de varios clientes.',
    h1Accent: 'Veinte clientes',
    h1Rest: 'y un solo procedimiento',
    heroSector: 'Para despachos con cartera',
    subtitulo: 'El trabajo no crece por cliente: crece por documento, y los documentos se procesan solos.',
    intro: 'Manejar la facturación electrónica de un cliente es un trámite. Manejar la de veinte es un trabajo de tiempo completo, porque el procedimiento se repite entero por cada uno: entrar al portal, pedir el token, exportar el listado, descargar, descomprimir, leer y digitar. Veinte veces al mes. Lo que hace inviable esa carga no es la complejidad, es la repetición — y la repetición es exactamente lo que se puede automatizar.',
    sectorTitulo: 'La parte que sigue siendo manual, y por qué',
    sectorTexto: 'Hay un paso que no se puede automatizar: pedir el token en el portal de la DIAN. Requiere las credenciales del contribuyente, dura sesenta minutos y exige una acción humana. No existe una API pública que permita a un tercero descargar los documentos de un contribuyente sin su intervención — los servicios oficiales de la DIAN son para emitir. Todo lo demás sí: pegado el token, la descarga, la lectura, el cuadre y la exportación ocurren solos.',
    dolores: [
      { titulo: 'El mismo procedimiento, veinte veces', texto: 'No es difícil: es largo. Y al ser largo y repetitivo, es donde se salta un paso sin darse cuenta.' },
      { titulo: 'Cada cliente con su programa contable', texto: 'Uno usa Siigo, otro Alegra, otro World Office. Armar el archivo de cada uno a mano multiplica el trabajo.' },
      { titulo: 'Todos vencen en las mismas fechas', texto: 'La carga no se reparte: cae toda junta antes del vencimiento.' },
    ],
    respuesta: 'Se guarda un perfil de exportación por cada programa contable. Al descargar, se elige el perfil del cliente y sale su archivo en su formato, sin volver a configurar nada.',
    caso: {
      titulo: 'Cómo se reparte la carga durante el mes',
      texto: 'La forma de que el cierre deje de ser un pico es que los documentos entren según van llegando. Con la dirección de correo activada, los proveedores de cada cliente envían ahí y los documentos aparecen en la bandeja durante todo el mes. Se procesan cuando se quiera, y para el cierre lo que queda es revisar lo marcado y sacar los reportes por cliente.',
      antes: 'Veinte procedimientos completos en tres días',
      despues: 'Documentos entrando todo el mes y un cierre de revisión',
    },
    fotos: FOTOS_B,
    cierre: 'Un aviso honesto sobre la descarga masiva: se hace a ritmo moderado a propósito. El tráfico sale por direcciones compartidas y la DIAN limita cuántas peticiones acepta y se defiende activamente de la automatización, así que descargar a toda velocidad terminaría en un bloqueo que afectaría a todos los clientes a la vez. Es más lento por diseño, y es lo que hace que siga funcionando el mes siguiente.',
    faq: [
      { q: '¿Puedo descargar los documentos de varios clientes a la vez?', a: 'Cada descarga usa el token de ese contribuyente, así que se hace por cliente. Lo que no se repite es la configuración: el perfil de exportación queda guardado.' },
      { q: '¿Se mezclan los documentos de mis clientes?', a: 'Los documentos se consultan y exportan con filtros por periodo y por emisor, y los reportes se sacan de lo que selecciones.' },
      { q: '¿El cupo del plan es por cliente o total?', a: 'Total: cuenta los documentos procesados con éxito en el mes, sin importar de qué cliente sean. Los duplicados y los que fallan no gastan cupo.' },
    ],
  },
  {
    slug: 'precio-software-descarga-facturas-dian',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#065F46',
    titleTag: 'Cuánto cuesta un software para descargar facturas de la DIAN | Codec Document',
    metaDescription: 'Precios claros y plan gratuito de 100 documentos al mes, sin tarjeta. Compara contra las licencias anuales de escritorio y decide con la herramienta ya probada.',
    h1Accent: 'Cuánto cuesta',
    h1Rest: 'y qué se puede probar antes',
    heroSector: 'Precios',
    subtitulo: 'Cien documentos al mes gratis. Sin tarjeta, sin llamada, sin licencia anual por adelantado.',
    intro: 'Las herramientas de descarga masiva que se usan hoy en Colombia se venden por licencia anual, y eso obliga a decidir antes de saber si sirven para tu forma de trabajar. Esta página explica cómo está estructurado el precio de Codec Document y, sobre todo, qué se puede comprobar sin pagar nada — porque la única forma sensata de elegir una herramienta contable es ver si sus cifras coinciden con las tuyas.',
    sectorTitulo: 'Lo que cambia entre planes es el volumen, no las funciones',
    sectorTexto: 'Todos los planes incluyen lo mismo: subir el comprimido de la DIAN, descargar por CUFE con tu token, verificar qué te falta, el Excel de cuatro hojas, las plantillas de tu programa contable y el cruce contra tu contabilidad. Lo que cambia es cuántos documentos se procesan al mes. La única excepción es recibir facturas por correo, que requiere un plan de pago porque cada cuenta lleva su propio buzón. Se dice así de claro porque un catálogo donde no se sabe qué falta en cada nivel es un catálogo diseñado para confundir.',
    dolores: [
      { titulo: 'Pagar un año para saber si sirve', texto: 'Una licencia anual por adelantado es mucho compromiso para una herramienta que todavía no has visto trabajar con tus documentos.' },
      { titulo: 'Precios que no aparecen hasta la llamada', texto: 'Pedir una demostración para conocer el precio alarga una decisión que debería tomar diez minutos.' },
      { titulo: 'Cupos que se gastan con errores', texto: 'Si un archivo que falló consume cupo, el plan rinde menos de lo que dice.' },
    ],
    respuesta: 'Sólo cuentan los documentos procesados con éxito. Los duplicados y los que fallan no gastan cupo, y cuando se llega al tope los que quedaron sin procesar no se pierden: se vuelve a subir el mismo archivo y continúa donde iba.',
    caso: {
      titulo: 'Qué comprobar durante la prueba',
      texto: 'Cien documentos al mes dan para un cliente pequeño entero. Lo que hay que mirar no es si la herramienta es bonita: es si el total del periodo coincide con el que ya tenías registrado, si las notas crédito quedaron restadas donde debían, y si los documentos que marcó para revisión eran de verdad los que había que mirar. Si eso cuadra, la decisión de pagar está tomada sobre evidencia.',
      antes: 'Decidir por una licencia anual sin haberla visto trabajar',
      despues: 'Un mes real procesado, y después decidir',
    },
    fotos: FOTOS_C,
    cierre: 'El pago se hace con Wompi, que acepta Nequi, PSE, tarjeta y corresponsal, y se cancela cuando se quiera. Se nombra el medio de pago antes de salir de la aplicación a propósito: llegar a una pasarela y descubrir que no acepta lo que uno usa es la forma más tonta de perder una compra que ya estaba decidida.',
    faq: [
      { q: '¿Necesito tarjeta para empezar?', a: 'No. El plan gratuito de cien documentos al mes no pide medio de pago.' },
      { q: '¿Qué pasa si me paso del cupo?', a: 'Se avisa antes de llegar. Los documentos que queden sin procesar no se pierden: vuelves a subir el mismo archivo cuando tengas cupo y continúa donde iba.' },
      { q: '¿Con qué medios se puede pagar?', a: 'Con Wompi: Nequi, PSE, tarjeta o corresponsal. Se puede cancelar cuando quieras.' },
    ],
  },
  {
    slug: 'auditoria-facturas-electronicas-vs-contabilidad',
    ciudad: '', departamento: '', intencion: 'transaccional',
    color: '#0F766E',
    titleTag: 'Auditoría de facturas electrónicas contra tu contabilidad | Codec Document',
    metaDescription: 'Sube lo que exporta tu programa contable y compáralo contra lo que la DIAN tiene. Aritmética exacta: qué falta, qué sobra y qué está registrado por otra cifra.',
    h1Accent: 'Audita tu periodo',
    h1Rest: 'antes de que lo audite otro',
    heroSector: 'Cruce antes de declarar',
    subtitulo: 'Dos listas comparadas documento a documento, con aritmética exacta y no con estimaciones.',
    intro: 'Declarar sin haber comparado lo que la DIAN tiene contra lo que está en libros es declarar sobre una suposición. La suposición suele ser correcta, pero cuando no lo es el error va en las dos direcciones: documentos que faltan y son IVA que se dejó de descontar, o registros que no corresponden a ningún documento electrónico. Comparar las dos listas antes de declarar convierte esa suposición en un dato, y toma minutos.',
    sectorTitulo: 'Qué se compara y cómo',
    sectorTexto: 'Se sube el archivo que exporta el programa contable con los documentos del periodo. Se leen sus encabezados y se señala una vez qué columna es cuál — número, NIT, fecha, valor —. A partir de ahí la comparación es documento a documento con aritmética determinista: siempre da el mismo resultado con los mismos datos, que es lo que permite sustentar un hallazgo en vez de sólo mencionarlo.',
    dolores: [
      { titulo: 'Lo que falta no descuadra nada', texto: 'Un documento ausente no dispara ninguna alerta contable. Se detecta comparando, o no se detecta.' },
      { titulo: 'Un valor mal registrado se compensa solo', texto: 'Dos errores en sentidos opuestos se anulan en el total y sobreviven al cierre sin que nadie los vea.' },
      { titulo: 'Comparar a mano no se hace dos veces', texto: 'Trescientos documentos contra trescientos registros, con formatos distintos. Se intenta una vez y se abandona.' },
    ],
    respuesta: 'Salen tres listas: lo que está en la DIAN y no en libros, lo registrado por una cifra distinta, y lo que está en libros sin documento electrónico. Cada una con documento, número y valor, para poder ir a arreglarla.',
    caso: {
      titulo: 'Por qué las notas crédito se comparan por magnitud',
      texto: 'Unos programas contables registran las notas crédito en negativo y otros en positivo. Si el cruce asumiera una convención, marcaría como diferencia toda nota crédito guardada con la otra, y el informe saldría lleno de hallazgos falsos que hay que descartar uno por uno. Comparando por magnitud, las que están bien no aparecen y las que de verdad difieren, sí. Es un detalle pequeño que decide si el informe se usa o se ignora.',
      antes: 'Declarar suponiendo que está todo',
      despues: 'Tres listas concretas antes de presentar',
    },
    fotos: FOTOS_D,
    cierre: 'La aritmética la hace el sistema y siempre igual; si se usa inteligencia artificial es sólo para redactar los hallazgos y ordenarlos por importancia, nunca para calcular una cifra. Esa separación es deliberada: un número que cambia según cómo se le pregunte a un modelo no sirve para sustentar nada ante la DIAN.',
    faq: [
      { q: '¿Qué archivo tengo que subir?', a: 'El que exporte tu programa contable con los documentos del periodo. Se leen sus encabezados y señalas las columnas si no se reconocen solas.' },
      { q: '¿Sirve para periodos ya declarados?', a: 'Sí, y suele ser donde más aparece. Encontrar IVA no descontado de periodos anteriores permite decidir si se corrige.' },
      { q: '¿La comparación es exacta o aproximada?', a: 'Exacta y determinista: los mismos datos dan siempre el mismo resultado. No hay estimación ni criterio automático de por medio.' },
    ],
  },
];

/**
 * 12 páginas SEO para contadores en Colombia — herramienta «Automatización
 * para Contadores» (descarga y lectura de XML de la DIAN).
 *
 * Sólo Colombia. La herramienta lee facturación electrónica bajo la
 * Resolución DIAN 000042 de 2020 y el UBL 2.1 colombiano; no tiene sentido
 * ofrecerla en otro país.
 *
 * ── Por qué cada ciudad dice cosas distintas ────────────────────────────
 *
 * La regla del proyecto para páginas ciudad × servicio (ver CLAUDE.md) es que
 * NO valen doce copias con el nombre cambiado: eso es contenido duplicado, y
 * Google lo trata como tal. Así que cada página parte de la economía real de
 * su ciudad y del trabajo contable que esa economía genera:
 *
 *   Bogotá        outsourcing contable, carteras de 30+ clientes
 *   Medellín      moda y manufactura, muchos proveedores pequeños
 *   Cali          agroindustria, facturación estacional por zafra
 *   Barranquilla  comercio exterior y zona franca, IVA y aduanas
 *   Cartagena     turismo y hotelería, INC y facturación diaria
 *   Bucaramanga   calzado y salud, doble régimen
 *   Pereira       eje cafetero, cooperativas y compras a campesinos
 *   Manizales     café y educación, entidades sin ánimo de lucro
 *   Cúcuta        frontera, alta rotación y control cambiario
 *   Ibagué        agro y comercio, retenciones municipales
 *   Santa Marta   turismo y banano, exportación
 *   Villavicencio llanos, ganadería e hidrocarburos
 *
 * El dolor concreto cambia con el sector, y con él cambian las palabras que
 * ese contador escribe en Google.
 */

export interface CiudadContadorSeo {
  slug: string;
  ciudad: string;
  departamento: string;
  /** Color de acento de la página. */
  color: string;
  /** <title> — bajo 60 caracteres visibles donde se pueda. */
  titleTag: string;
  metaDescription: string;
  h1Accent: string;
  h1Rest: string;
  /** Frase de entrada bajo el H1. */
  subtitulo: string;
  /** Párrafo de apertura, específico de la economía local. */
  intro: string;
  /** El sector que define el trabajo contable de la ciudad. */
  sectorTitulo: string;
  sectorTexto: string;
  /** Tres dolores concretos de ese sector, no genéricos. */
  dolores: Array<{ titulo: string; texto: string }>;
  /** Cómo responde la herramienta a ESE trabajo. */
  respuesta: string;
  faq: Array<{ q: string; a: string }>;
}

/** Lo que la herramienta hace, idéntico en todas las páginas porque es el
 *  producto. Lo que cambia es a qué problema local responde. */
export const CAPACIDADES = [
  {
    titulo: 'Arrastra los ZIP de la DIAN y listo',
    texto: 'Suelta los comprimidos tal como los descargaste del portal. Se abren, se leen los XML y salen los datos: NIT, razón social, prefijo, número, fecha, base, IVA, retenciones y total. No hay que abrir un solo archivo a mano.',
  },
  {
    titulo: 'Descarga masiva desde la DIAN',
    texto: 'Pega la lista de CUFE, pega el enlace del token que llega a tu correo y elige una carpeta de tu computador. Los ZIP se descargan solos, a ritmo controlado para que la DIAN no bloquee la conexión.',
  },
  {
    titulo: 'Excel listo para tu contabilidad',
    texto: 'Cuatro hojas: resumen, documentos, líneas e impuestos. Los totales vienen cuadrados contra el XML, no recalculados a ojo, y las retenciones salen separadas por concepto.',
  },
  {
    titulo: 'Tu propia plantilla contable',
    texto: 'Sube el formato vacío que ya usas en Siigo, Alegra, World Office, Helisa o el que sea. Se emparejan las columnas una sola vez y los meses siguientes solo descargas el archivo listo para importar.',
  },
  {
    titulo: 'Auditor: DIAN contra tu contabilidad',
    texto: 'Cruza lo que la DIAN tiene reportado contra lo que tú registraste. Te dice qué facturas te faltan, cuáles registraste y no están en la DIAN, y cuáles tienen diferencia de valor.',
  },
  {
    titulo: 'Solo revisas las excepciones',
    texto: 'Lo que cuadra pasa sin que lo mires. Lo que no cuadra queda en una bandeja aparte con el motivo exacto: un total que no da, un impuesto raro, un documento repetido.',
  },
] as const;

export const CIUDADES_CONTADOR: CiudadContadorSeo[] = [
  {
    slug: 'descargar-xml-dian-bogota',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    color: '#2563EB',
    titleTag: 'Descargar XML de la DIAN en Bogotá — Automatización Contable',
    metaDescription: 'Contadores en Bogotá: descarga masiva de XML de la DIAN y conversión automática a Excel con IVA, retenciones y totales cuadrados. Cruza la DIAN contra tu contabilidad y deja de revisar factura por factura.',
    h1Accent: 'Descarga los XML de la DIAN',
    h1Rest: 'y pásalos a Excel — Bogotá',
    subtitulo: 'Para los estudios contables que manejan decenas de clientes y cierran todos el mismo mes.',
    intro: 'Bogotá concentra la mayor parte del outsourcing contable del país. Un estudio mediano lleva entre veinte y cincuenta clientes, y todos cierran en la misma semana. La descarga de documentos electrónicos deja de ser una tarea y se convierte en el cuello de botella del mes: alguien del equipo se sienta a bajar comprimidos del portal, abrirlos uno por uno y copiar cifras a una hoja. Con quince clientes y ochenta documentos cada uno, son mil doscientos archivos que nadie alcanza a revisar de verdad.',
    sectorTitulo: 'El problema del outsourcing contable',
    sectorTexto: 'Cuando una firma lleva la contabilidad de muchas empresas a la vez, el trabajo repetitivo no crece poco a poco: se multiplica por el número de clientes. Cada NIT tiene su propio token de la DIAN, su propio periodo y su propio plan de cuentas en el software contable. La parte que consume el tiempo no es entender la información, es moverla de un formato a otro.',
    dolores: [
      { titulo: 'Un token por cliente, y dura una hora', texto: 'El token de la DIAN vive sesenta minutos y sirve una sola vez. Con veinte clientes son veinte solicitudes, veinte correos y veinte ventanas de una hora que hay que aprovechar antes de que venzan.' },
      { titulo: 'Cada software contable pide otro formato', texto: 'Siigo no importa lo mismo que World Office, y ninguno de los dos importa el XML de la DIAN. La conversión termina siendo un Excel armado a mano para cada cliente.' },
      { titulo: 'Nadie revisa mil doscientos documentos', texto: 'Cuando el volumen supera lo que una persona puede leer, la revisión se vuelve un muestreo. Los errores que se cuelan aparecen en la declaración, no antes.' },
    ],
    respuesta: 'La herramienta separa las dos cosas que hoy van juntas: bajar los archivos y entenderlos. Los ZIP se descargan solos a partir de la lista de CUFE, y al soltarlos salen las cifras ya clasificadas. Lo que cuadra no se revisa; lo que no cuadra queda en una bandeja con el motivo. La plantilla de importación se configura una vez por cliente y se reutiliza todos los meses.',
    faq: [
      { q: '¿Sirve para varios NIT o solo para uno?', a: 'Sirve para todos los que manejes. Cada descarga usa el token del NIT correspondiente, y los documentos quedan separados por emisor, así que puedes procesar un cliente detrás de otro sin que se mezclen.' },
      { q: '¿Tengo que subir los XML a algún servidor?', a: 'No. Los archivos se leen dentro de tu propio navegador. Lo que se guarda es la información contable que extrae, no los archivos, para no exponer documentos de tus clientes.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-medellin',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    color: '#7C3AED',
    titleTag: 'Descargar XML de la DIAN en Medellín — Automatización Contable',
    metaDescription: 'Contadores en Medellín: convierte los XML de la DIAN en Excel automáticamente, con IVA y retenciones separadas. Ideal para empresas de moda y manufactura con muchos proveedores pequeños.',
    h1Accent: 'Los XML de la DIAN, en Excel',
    h1Rest: 'sin abrir un solo archivo — Medellín',
    subtitulo: 'Pensado para la contabilidad de manufactura: muchos proveedores, facturas pequeñas, márgenes ajustados.',
    intro: 'La industria de Medellín trabaja con cadenas de proveedores largas y fragmentadas. Un taller de confección le compra a satélites, a talleres de bordado, a proveedores de insumos y a transportadores, y casi todos facturan montos pequeños. El resultado contable es un volumen alto de documentos de valor bajo, que es el peor escenario para el trabajo manual: cuesta lo mismo digitar una factura de treinta mil pesos que una de treinta millones.',
    sectorTitulo: 'Moda, manufactura y cadenas de proveedores',
    sectorTexto: 'En manufactura el costo se arma sumando muchas facturas chicas. Si esa suma se hace a mano, el margen real del producto se conoce tarde y con error. La información está toda en los XML —el detalle por línea, el IVA descontable, las retenciones— pero llega en un formato que ningún humano lee de corrido.',
    dolores: [
      { titulo: 'Cien facturas pequeñas cuestan más que diez grandes', texto: 'El tiempo se va en la cantidad de documentos, no en su valor. Un mes con trescientas facturas de proveedores pequeños se lleva días de digitación.' },
      { titulo: 'El detalle por línea se pierde', texto: 'Al resumir la factura a un solo renglón se pierde qué se compró. Después, calcular el costo por referencia obliga a volver a abrir los archivos.' },
      { titulo: 'El IVA descontable se arma a pulso', texto: 'Separar qué IVA es descontable y cuál no exige mirar cada documento. Es exactamente el tipo de tarea donde el cansancio produce errores.' },
    ],
    respuesta: 'La herramienta extrae el detalle línea por línea, no solo el total, y saca el IVA y las retenciones ya separados por concepto. La hoja de líneas permite calcular costo por referencia sin volver a tocar los XML, y el volumen deja de importar: trescientas facturas se procesan en el mismo gesto que tres.',
    faq: [
      { q: '¿Trae el detalle de cada línea de la factura?', a: 'Sí. El Excel incluye una hoja de líneas con la descripción, la cantidad, el valor unitario y los impuestos de cada renglón, además de la hoja de documentos con los totales.' },
      { q: '¿Reconoce las notas crédito de los proveedores?', a: 'Sí. Distingue facturas, notas crédito, notas débito, documento soporte y nómina electrónica, y las clasifica por tipo para que las devoluciones no se sumen como compras.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-cali',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    color: '#059669',
    titleTag: 'Descargar XML de la DIAN en Cali — Automatización Contable',
    metaDescription: 'Contadores en Cali: descarga masiva de XML de la DIAN y Excel automático con retenciones separadas. Pensado para agroindustria y facturación estacional del Valle.',
    h1Accent: 'Automatiza la lectura',
    h1Rest: 'de tus XML de la DIAN — Cali',
    subtitulo: 'Para la contabilidad agroindustrial, donde el volumen no se reparte parejo durante el año.',
    intro: 'La contabilidad agroindustrial del Valle no tiene meses iguales. En zafra la facturación se dispara y en temporada baja cae, así que el equipo contable se dimensiona para el promedio y sufre en los picos. Cuando llega el mes fuerte, la descarga y digitación de documentos electrónicos se acumula, y lo que en un mes normal toma dos días, en zafra toma dos semanas que no existen.',
    sectorTitulo: 'Estacionalidad: el mismo equipo, el triple de documentos',
    sectorTexto: 'El trabajo manual escala mal porque depende de horas-persona. Un proceso automático no distingue entre un mes de doscientos documentos y uno de mil doscientos: es el mismo gesto. Eso es justo lo que necesita una operación estacional, que no puede contratar y despedir según la cosecha.',
    dolores: [
      { titulo: 'Los picos no avisan con tiempo', texto: 'Cuando el volumen se triplica de un mes a otro, no hay margen para contratar y entrenar a alguien que digite.' },
      { titulo: 'Las retenciones agrícolas tienen sus propias tarifas', texto: 'Compras a productores, retención en la fuente por conceptos específicos y ReteICA municipal: separar todo eso a mano es lento y se presta a error.' },
      { titulo: 'La conciliación con la DIAN queda para el final', texto: 'Cuando el mes se va en digitar, cruzar lo reportado contra lo registrado se pospone. Los faltantes aparecen cuando ya hay que declarar.' },
    ],
    respuesta: 'El procesamiento no depende del volumen, así que un mes de zafra cuesta lo mismo que uno tranquilo. Las retenciones salen desglosadas por concepto —fuente, IVA e ICA— y el auditor cruza lo reportado en la DIAN contra tu contabilidad antes de declarar, no después.',
    faq: [
      { q: '¿Cuántos documentos puede procesar de una vez?', a: 'No hay un tope técnico por lote: se procesan en tu propio navegador y el límite práctico es la memoria del computador. Miles de documentos se procesan en minutos.' },
      { q: '¿Separa la retención de ICA por municipio?', a: 'Separa la retención de ICA como concepto propio con su base y su tarifa. El municipio depende de cómo lo haya reportado el emisor en el XML.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-barranquilla',
    ciudad: 'Barranquilla',
    departamento: 'Atlántico',
    color: '#0891B2',
    titleTag: 'Descargar XML de la DIAN en Barranquilla — Automatización Contable',
    metaDescription: 'Contadores en Barranquilla: pasa los XML de la DIAN a Excel con IVA y retenciones separadas. Para comercio exterior, zona franca e importadores del Atlántico.',
    h1Accent: 'Descarga y procesa',
    h1Rest: 'tus XML de la DIAN — Barranquilla',
    subtitulo: 'Para la contabilidad de comercio exterior, donde cada documento tiene un tratamiento distinto.',
    intro: 'Barranquilla vive del comercio exterior y de la zona franca, y eso le da a su contabilidad una complejidad que otras ciudades no tienen: operaciones exentas, excluidas y gravadas conviviendo en el mismo mes, con tratamientos de IVA distintos. Clasificar mal un documento no es un error de digitación, es una declaración equivocada. Y clasificar bien exige leer cada factura, que es precisamente lo que el volumen impide.',
    sectorTitulo: 'Exento, excluido y gravado en el mismo mes',
    sectorTexto: 'La información que distingue un tratamiento de otro está en el XML, en los códigos de impuesto que el emisor reportó. Ese dato existe y es exacto, pero se pierde en cuanto alguien resume la factura a mano en una hoja de cálculo con tres columnas.',
    dolores: [
      { titulo: 'El tratamiento tributario se pierde al resumir', texto: 'Una hoja hecha a mano guarda base y total, pero rara vez guarda por qué esa operación no llevaba IVA. Después nadie puede reconstruirlo sin volver al archivo.' },
      { titulo: 'Zona franca y territorio aduanero se mezclan', texto: 'Con operaciones de los dos tipos en el mismo periodo, la separación depende de que alguien la recuerde al digitar.' },
      { titulo: 'Los soportes se piden meses después', texto: 'Cuando llega un requerimiento, encontrar el XML de una factura concreta entre cientos de comprimidos toma más tiempo que responderlo.' },
    ],
    respuesta: 'Se conservan los códigos de impuesto tal como los reportó el emisor, así que el tratamiento queda registrado y no depende de la memoria de nadie. Los documentos quedan buscables por NIT, número y CUFE, de modo que responder un requerimiento es una búsqueda y no una excavación.',
    faq: [
      { q: '¿Distingue operaciones exentas de excluidas?', a: 'Conserva el código de impuesto y la base de cada línea tal como vienen en el XML, que es donde esa distinción está registrada oficialmente. En el Excel aparece explícito en vez de perderse.' },
      { q: '¿Puedo buscar una factura vieja por su CUFE?', a: 'Sí. Cada documento procesado queda con su CUFE, su número y su emisor, y se puede buscar por cualquiera de los tres.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-cartagena',
    ciudad: 'Cartagena',
    departamento: 'Bolívar',
    color: '#DB2777',
    titleTag: 'Descargar XML de la DIAN en Cartagena — Automatización Contable',
    metaDescription: 'Contadores en Cartagena: automatiza la descarga de XML de la DIAN y el Excel con INC, IVA y retenciones. Para hotelería, restaurantes y turismo con facturación diaria.',
    h1Accent: 'Deja de abrir XML',
    h1Rest: 'uno por uno — Cartagena',
    subtitulo: 'Para hotelería y turismo, donde se factura todos los días y el impuesto al consumo complica la lectura.',
    intro: 'La hotelería y la restauración facturan a diario y en volumen alto, con tiquetes y facturas pequeñas que se acumulan de forma constante en vez de concentrarse al cierre. A eso se suma el impuesto nacional al consumo, que convive con el IVA y no se declara igual. El resultado es una contabilidad donde el volumen es continuo y la clasificación no admite atajos.',
    sectorTitulo: 'Turismo: facturación diaria y dos impuestos a la vez',
    sectorTexto: 'Un restaurante puede tener INC y no IVA; un hotel puede tener los dos según el servicio. Distinguirlos importa porque van a declaraciones distintas, y la información para distinguirlos viene en el XML con su código propio. Digitando a mano, ese matiz es lo primero que se pierde.',
    dolores: [
      { titulo: 'El INC se confunde con el IVA', texto: 'Son impuestos distintos con declaraciones distintas. Al resumir a mano, terminan en la misma columna más veces de las que nadie quisiera admitir.' },
      { titulo: 'La facturación no para nunca', texto: 'No hay un cierre tranquilo: todos los días entran documentos. El trabajo manual nunca se pone al día del todo.' },
      { titulo: 'Alta rotación de personal contable', texto: 'Cuando el proceso vive en la cabeza de quien digita, cada cambio de persona reinicia la curva de aprendizaje y los errores.' },
    ],
    respuesta: 'El impuesto al consumo se identifica por su propio código y sale en columna separada del IVA, así que no hay que confiar en que quien digita los distinga. Y como el proceso es el mismo cada vez, no depende de quién esté en el puesto esta temporada.',
    faq: [
      { q: '¿Separa el impuesto al consumo del IVA?', a: 'Sí. El INC tiene su propio código en el XML y aparece en su propia columna, con su base y su tarifa, sin mezclarse con el IVA.' },
      { q: '¿Sirve si facturamos todos los días?', a: 'Sí, y es donde más se nota. Puedes procesar por semana o por mes; el esfuerzo no cambia con la cantidad de documentos.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-bucaramanga',
    ciudad: 'Bucaramanga',
    departamento: 'Santander',
    color: '#D97706',
    titleTag: 'Descargar XML de la DIAN en Bucaramanga — Automatización Contable',
    metaDescription: 'Contadores en Bucaramanga: XML de la DIAN a Excel automático, con retenciones desglosadas. Para calzado, salud y comercio de Santander.',
    h1Accent: 'XML de la DIAN a Excel',
    h1Rest: 'en un solo paso — Bucaramanga',
    subtitulo: 'Para la contabilidad de calzado, salud y comercio, con proveedores en dos regímenes distintos.',
    intro: 'El tejido empresarial de Bucaramanga mezcla manufactura de calzado, un sector salud fuerte y comercio, y eso pone a los contadores a trabajar con proveedores de regímenes muy distintos en la misma empresa: responsables de IVA junto a no responsables, y en salud, servicios excluidos que conviven con compras gravadas. Cada combinación tiene su tratamiento, y la única fuente confiable de cuál aplica es el propio documento electrónico.',
    sectorTitulo: 'Dos regímenes en la misma contabilidad',
    sectorTexto: 'Cuando un mismo mes trae compras a responsables y a no responsables de IVA, la retención aplicable cambia. Digitando a mano, la decisión la toma quien digita, en el momento y sin tiempo. El XML ya trae la información que permite tomarla bien.',
    dolores: [
      { titulo: 'La retención depende del régimen del proveedor', texto: 'Aplicarla mal se corrige tarde y con costo. La información del emisor viene en el XML, pero no se aprovecha si el proceso es manual.' },
      { titulo: 'Salud: excluido no es lo mismo que exento', texto: 'Los servicios de salud excluidos no dan derecho a descontar el IVA de las compras asociadas. Distinguirlos exige leer el documento, no resumirlo.' },
      { titulo: 'Muchos proveedores pequeños del calzado', texto: 'Talleres y proveedores de insumos generan un flujo constante de facturas pequeñas que consume el día del auxiliar contable.' },
    ],
    respuesta: 'Cada documento conserva el NIT y la razón social del emisor junto a los códigos de impuesto que reportó, así que el régimen y el tratamiento quedan a la vista en el Excel. El auditor además señala las diferencias contra lo que tú registraste, antes de que se conviertan en una corrección.',
    faq: [
      { q: '¿Muestra si el proveedor es responsable de IVA?', a: 'Muestra los impuestos que el emisor reportó en cada documento, que es la evidencia de cómo facturó. Con eso se ve directamente si liquidó IVA o no.' },
      { q: '¿Funciona con documento soporte de no obligados a facturar?', a: 'Sí. El documento soporte se reconoce como tipo propio y se clasifica aparte de las facturas.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    color: '#16A34A',
    titleTag: 'Descargar XML de la DIAN en Pereira — Automatización Contable',
    metaDescription: 'Contadores en Pereira: descarga masiva de XML de la DIAN y Excel automático. Para cooperativas, comercio y compras a productores del Eje Cafetero.',
    h1Accent: 'Automatiza los XML',
    h1Rest: 'de la DIAN — Pereira',
    subtitulo: 'Para cooperativas y comercio del Eje Cafetero, con muchos terceros y compras a productores.',
    intro: 'En el Eje Cafetero una parte importante de la actividad pasa por cooperativas y por compras directas a productores. Contablemente eso significa muchos terceros distintos, documentos soporte por compras a no obligados a facturar, y una mezcla de operaciones que no encaja en el flujo simple de comprar y vender. La descarga y clasificación de documentos electrónicos se vuelve un trabajo de ordenar terceros, no solo de sumar cifras.',
    sectorTitulo: 'Muchos terceros, documentos de origen distinto',
    sectorTexto: 'Cuando el mismo periodo trae facturas electrónicas de proveedores formales y documentos soporte por compras a productores, la contabilidad tiene que distinguirlos sin equivocarse. Ambos son documentos electrónicos válidos, pero no se tratan igual ni se declaran igual.',
    dolores: [
      { titulo: 'El documento soporte se mezcla con las facturas', texto: 'Si todo termina en la misma hoja sin distinguir el tipo, las compras a no obligados se declaran mal.' },
      { titulo: 'Cientos de terceros distintos al mes', texto: 'Cada tercero nuevo hay que crearlo en el software contable. Con el NIT y la razón social mal copiados, se duplican terceros y se ensucia el auxiliar.' },
      { titulo: 'Cooperativas: rigor contable con equipos pequeños', texto: 'La exigencia de control no baja porque el equipo sea reducido, y el tiempo que se va en digitar es tiempo que no se dedica a revisar.' },
    ],
    respuesta: 'Cada documento sale clasificado por tipo —factura, nota crédito, nota débito, documento soporte, nómina— y con el NIT y la razón social exactos como los reportó el emisor, así que los terceros se crean bien la primera vez. El Excel se puede volcar directo en tu plantilla de importación.',
    faq: [
      { q: '¿Distingue el documento soporte de una factura normal?', a: 'Sí, es un tipo propio dentro de la clasificación y aparece marcado como tal en el Excel y en la tabla.' },
      { q: '¿El NIT y la razón social salen tal cual?', a: 'Salen tal como el emisor los reportó en el XML, sin retipear, que es lo que evita crear el mismo tercero dos veces con nombres distintos.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-manizales',
    ciudad: 'Manizales',
    departamento: 'Caldas',
    color: '#4F46E5',
    titleTag: 'Descargar XML de la DIAN en Manizales — Automatización Contable',
    metaDescription: 'Contadores en Manizales: convierte los XML de la DIAN en Excel automáticamente. Para entidades sin ánimo de lucro, educación y agroindustria de Caldas.',
    h1Accent: 'Los XML de la DIAN',
    h1Rest: 'convertidos en información — Manizales',
    subtitulo: 'Para entidades educativas y sin ánimo de lucro, donde cada peso tiene que quedar justificado.',
    intro: 'Manizales tiene un peso alto de educación superior y de entidades sin ánimo de lucro, y ese tipo de organización vive de rendir cuentas: ante su consejo, ante sus aportantes y ante la DIAN dentro del régimen tributario especial. La exigencia no es solo registrar bien, es poder demostrar cada registro con su soporte. Cuando el soporte vive en un ZIP dentro de una carpeta que nadie ordenó, demostrarlo cuesta más que registrarlo.',
    sectorTitulo: 'Régimen especial: registrar no basta, hay que poder demostrarlo',
    sectorTexto: 'La trazabilidad entre un registro contable y el documento electrónico que lo respalda es lo que sostiene una rendición de cuentas. Si esa relación se mantiene a mano, con nombres de archivo y carpetas, se rompe con el primer cambio de persona.',
    dolores: [
      { titulo: 'El soporte y el registro viven separados', texto: 'La cifra está en el software contable y el XML en una carpeta. La única conexión entre los dos suele ser la memoria de alguien.' },
      { titulo: 'Rendiciones que miran hacia atrás varios años', texto: 'Cuando piden el soporte de una operación de hace dos años, el tiempo se va en buscar, no en explicar.' },
      { titulo: 'Equipos contables pequeños con exigencia alta', texto: 'La carga normativa del régimen especial no se reduce porque la entidad sea chica.' },
    ],
    respuesta: 'Cada documento queda registrado con su CUFE, su número, su emisor y su fecha, y el XML original conserva su valor legal —es el documento con validez, no el PDF—. Buscar un soporte concreto pasa de ser una excavación a ser una búsqueda por NIT o por número.',
    faq: [
      { q: '¿Se conserva el XML original?', a: 'El XML es el documento con validez legal, no el PDF, y ese criterio guía toda la herramienta: lo que se extrae es la información contable, y el archivo original sigue siendo tuyo en tu carpeta.' },
      { q: '¿Sirve para una entidad sin ánimo de lucro?', a: 'Sí. La herramienta lee documentos electrónicos de la DIAN sin importar el régimen del receptor; lo que cambia es qué haces después con la información.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-cucuta',
    ciudad: 'Cúcuta',
    departamento: 'Norte de Santander',
    color: '#DC2626',
    titleTag: 'Descargar XML de la DIAN en Cúcuta — Automatización Contable',
    metaDescription: 'Contadores en Cúcuta: descarga masiva de XML de la DIAN y Excel automático con retenciones. Para comercio de frontera con alta rotación de documentos.',
    h1Accent: 'Descarga masiva',
    h1Rest: 'de XML de la DIAN — Cúcuta',
    subtitulo: 'Para el comercio de frontera, donde el volumen es alto y el control tiene que ser estricto.',
    intro: 'El comercio de frontera se mueve rápido y con márgenes estrechos, lo que produce un patrón contable muy particular: muchísimos documentos de valor moderado, rotación alta de proveedores y una necesidad de control que no se puede relajar. En un entorno así, la contabilidad no puede ir un mes atrás: si la información llega tarde, llega cuando ya no sirve para decidir.',
    sectorTitulo: 'Volumen alto con control estricto',
    sectorTexto: 'Cuando el negocio depende de márgenes pequeños, saber la cifra real a tiempo vale más que saberla perfecta un mes después. El trabajo manual impone justamente ese retraso: la información existe desde el día uno en los XML, pero no está disponible hasta que alguien la transcribe.',
    dolores: [
      { titulo: 'La contabilidad va siempre un mes atrás', texto: 'Cuando el registro depende de digitar, la foto del negocio llega tarde para decidir sobre compras y precios.' },
      { titulo: 'Rotación alta de proveedores', texto: 'Terceros nuevos cada mes significa creación constante de terceros en el software, con el riesgo de duplicarlos.' },
      { titulo: 'El control no puede aflojarse', texto: 'Cruzar lo reportado en la DIAN contra lo registrado deja de ser una buena práctica y pasa a ser una necesidad.' },
    ],
    respuesta: 'La descarga masiva y la lectura automática acortan la distancia entre que el documento existe y que la información está disponible. El auditor cruza la DIAN contra tu contabilidad y te dice exactamente qué falta, qué sobra y qué tiene diferencia de valor, con nombre y número.',
    faq: [
      { q: '¿Cómo cruza la DIAN contra mi contabilidad?', a: 'Subes tu Excel contable y la herramienta empareja documento por documento contra lo procesado de la DIAN, por número y por NIT. Devuelve tres listas: faltantes, sobrantes y diferencias de valor.' },
      { q: '¿Qué pasa si mi Excel tiene otro formato?', a: 'Se emparejan las columnas la primera vez: le dices cuál es el número, cuál el NIT y cuál el valor. Esa configuración queda guardada para las siguientes veces.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-ibague',
    ciudad: 'Ibagué',
    departamento: 'Tolima',
    color: '#0D9488',
    titleTag: 'Descargar XML de la DIAN en Ibagué — Automatización Contable',
    metaDescription: 'Contadores en Ibagué: XML de la DIAN a Excel con ReteICA y retenciones separadas. Para agro y comercio del Tolima.',
    h1Accent: 'Pasa los XML de la DIAN',
    h1Rest: 'a tu contabilidad — Ibagué',
    subtitulo: 'Para agro y comercio del Tolima, con retenciones municipales que hay que separar bien.',
    intro: 'La actividad agrícola y comercial del Tolima trae consigo un detalle que consume más tiempo del que parece: las retenciones. Retención en la fuente por distintos conceptos, retención de IVA y retención de industria y comercio, cada una con su base y su tarifa, y todas metidas dentro del mismo documento electrónico. Separarlas es indispensable para declarar, y hacerlo a mano es donde se va buena parte del cierre.',
    sectorTitulo: 'Tres retenciones distintas en el mismo documento',
    sectorTexto: 'Un solo XML puede traer retefuente, reteIVA y reteICA al tiempo, con bases diferentes. En el papel se ven parecidas; en la declaración van a lugares distintos. La información está en el archivo con su código y su base, perfectamente identificada — hasta que alguien la resume.',
    dolores: [
      { titulo: 'Las tres retenciones terminan en una sola columna', texto: 'Resumirlas juntas obliga a volver al documento cuando llega el momento de declarar cada una.' },
      { titulo: 'ReteICA cambia con el municipio', texto: 'La tarifa depende de dónde se realizó la actividad, y esa información viaja en el documento.' },
      { titulo: 'El cierre se va en desglosar', texto: 'Lo que debería ser revisión termina siendo clasificación manual de impuestos, uno por uno.' },
    ],
    respuesta: 'El Excel trae una hoja dedicada a impuestos con retefuente, reteIVA y reteICA separadas por concepto, cada una con su base y su tarifa tal como vienen en el XML. Lo que antes era desglosar queda hecho antes de que empieces a revisar.',
    faq: [
      { q: '¿Separa reteIVA de reteICA y de retefuente?', a: 'Sí, cada una con su código, su base y su tarifa, en una hoja de impuestos aparte de la de documentos.' },
      { q: '¿Qué pasa si un documento no trae retenciones?', a: 'Simplemente no aparece en esa hoja. La herramienta lo indica de forma explícita en vez de dejar celdas vacías que parezcan un error.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-santa-marta',
    ciudad: 'Santa Marta',
    departamento: 'Magdalena',
    color: '#EA580C',
    titleTag: 'Descargar XML de la DIAN en Santa Marta — Automatización Contable',
    metaDescription: 'Contadores en Santa Marta: automatiza la descarga de XML de la DIAN y su paso a Excel. Para turismo, agroexportación y comercio del Magdalena.',
    h1Accent: 'Descarga tus XML',
    h1Rest: 'y olvídate del trabajo manual — Santa Marta',
    subtitulo: 'Para turismo y agroexportación, con temporadas marcadas y operaciones de exportación.',
    intro: 'Santa Marta combina dos economías con ritmos opuestos: un turismo de temporadas muy marcadas y una agroexportación —banano, palma— que factura de forma sostenida y con operaciones de exportación. Contablemente eso significa manejar en la misma ciudad picos estacionales fuertes y operaciones exentas por exportación, cada una con su propio tratamiento y su propia exigencia de soporte.',
    sectorTitulo: 'Temporada alta y exportación en la misma contabilidad',
    sectorTexto: 'Las operaciones de exportación son exentas y dan derecho a devolución de IVA, lo que las convierte en las más revisadas por la administración. Su soporte tiene que estar impecable. Y al mismo tiempo, en temporada alta el volumen de documentos del lado turístico se dispara.',
    dolores: [
      { titulo: 'Las exportaciones exigen soporte impecable', texto: 'Una solicitud de devolución obliga a tener cada documento localizable y consistente con lo declarado.' },
      { titulo: 'La temporada alta desborda al equipo', texto: 'El volumen se concentra en pocos meses y el equipo contable es el mismo todo el año.' },
      { titulo: 'Dos lógicas contables conviviendo', texto: 'Lo que aplica al hotel no aplica a la comercializadora, y ambas pasan por el mismo escritorio.' },
    ],
    respuesta: 'La lectura automática mantiene la consistencia entre lo que dice el documento y lo que queda registrado, que es exactamente lo que sostiene una devolución. Y como el esfuerzo no depende del volumen, la temporada alta deja de ser un problema de capacidad.',
    faq: [
      { q: '¿Sirve para soportar una solicitud de devolución de IVA?', a: 'La herramienta te da la información exacta del documento electrónico y lo deja localizable por CUFE y número. El trámite lo presentas tú, pero el soporte queda ordenado y consistente.' },
      { q: '¿Puedo procesar varios periodos de una sola vez?', a: 'Sí. Puedes soltar los comprimidos de varios meses juntos; cada documento conserva su fecha de emisión y se puede filtrar por periodo.' },
    ],
  },
  {
    slug: 'descargar-xml-dian-villavicencio',
    ciudad: 'Villavicencio',
    departamento: 'Meta',
    color: '#B45309',
    titleTag: 'Descargar XML de la DIAN en Villavicencio — Automatización Contable',
    metaDescription: 'Contadores en Villavicencio: descarga masiva de XML de la DIAN y Excel automático. Para ganadería, agro e hidrocarburos del Meta.',
    h1Accent: 'Los XML de la DIAN',
    h1Rest: 'sin abrirlos uno por uno — Villavicencio',
    subtitulo: 'Para ganadería, agro e hidrocarburos, con proveedores de servicios y compras a productores.',
    intro: 'La economía del Meta mezcla ganadería y agricultura con una cadena de servicios alrededor de los hidrocarburos, y esas dos realidades producen contabilidades muy distintas en la misma ciudad. Por un lado, compras a productores que muchas veces no están obligados a facturar; por otro, contratistas de servicios con facturación alta y retenciones importantes. Un contador de la región suele llevar clientes de los dos tipos a la vez.',
    sectorTitulo: 'Compras a productores y contratistas de servicios',
    sectorTexto: 'El documento soporte por compras a no obligados y la factura electrónica de un contratista son documentos distintos, con tratamientos distintos, que llegan mezclados en la misma descarga del portal. Distinguirlos bien es lo primero que hay que hacer, y es también lo que más se demora cuando se hace a mano.',
    dolores: [
      { titulo: 'Documento soporte y factura llegan mezclados', texto: 'La descarga trae de todo junto. Separarlos correctamente es un paso previo que consume tiempo antes siquiera de empezar a registrar.' },
      { titulo: 'Contratistas con retenciones altas', texto: 'En servicios, las retenciones pesan y equivocarlas se nota de inmediato en el flujo de caja del contratista.' },
      { titulo: 'Distancias largas, equipos distribuidos', texto: 'Cuando el cliente está en otro municipio, el intercambio de archivos y la digitación remota multiplican los errores.' },
    ],
    respuesta: 'La clasificación por tipo de documento es automática, así que la separación entre documento soporte y factura electrónica deja de ser un paso manual. Y como todo se procesa en el navegador desde cualquier lugar, no hace falta que los archivos viajen de un escritorio a otro para poder trabajarlos.',
    faq: [
      { q: '¿Necesito instalar algo?', a: 'No. Funciona en el navegador, en Chrome o Edge de computador. La descarga masiva necesita computador porque guarda los archivos en una carpeta que tú eliges.' },
      { q: '¿Puedo trabajarlo desde otro municipio?', a: 'Sí. Lo único que necesitas es tu sesión y el token de la DIAN del cliente, que llega al correo de quien lo solicita.' },
    ],
  },
];

export const getCiudadContador = (slug: string): CiudadContadorSeo | undefined =>
  CIUDADES_CONTADOR.find((c) => c.slug === slug);

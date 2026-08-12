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
  /**
   * Lo que identifica a esa ciudad SIN nombrarla: su sector económico.
   *
   * El nombre de la ciudad vive en la URL y en el <title> —donde Google lo
   * necesita— pero no en el texto visible. Doce páginas que gritan «— Bogotá»,
   * «— Cali», «— Cartagena» en el titular se leen como lo que son, una
   * plantilla repetida, y eso resta credibilidad justo en la primera línea.
   * El sector hace el mismo trabajo de reconocimiento —un contador de
   * hotelería sabe que la página le habla a él— sin el efecto de catálogo.
   */
  heroSector: string;
  /** Párrafo de apertura, específico de la economía local. */
  intro: string;
  /** El sector que define el trabajo contable de la ciudad. */
  sectorTitulo: string;
  sectorTexto: string;
  /** Tres dolores concretos de ese sector, no genéricos. */
  dolores: Array<{ titulo: string; texto: string }>;
  /** Cómo responde la herramienta a ESE trabajo. */
  respuesta: string;
  /** Un caso concreto de esa ciudad, con cifras. No es un testimonio
   *  inventado: es la aritmética del trabajo, que cualquier contador puede
   *  contrastar con su propio mes. */
  caso: { titulo: string; texto: string; antes: string; despues: string };
  /** Tres fotos por página, rotadas entre ciudades para que doce páginas del
   *  mismo servicio no se vean como la misma. Todas licenciadas y ya
   *  optimizadas en el repositorio: no se descarga nada de la red. */
  fotos: [string, string, string];
  /** En qué se invierte el tiempo recuperado, segun el trabajo real de ese
   *  contador. Cierra la pagina respondiendo la pregunta que queda despues
   *  de prometer ahorro de horas: ahorradas, para que. */
  cierre: string;
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
    h1Rest: 'y pásalos a Excel',
    heroSector: 'Para estudios contables con decenas de clientes',
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
    caso: {
      titulo: '22 clientes, una semana de cierre',
      texto: 'Un estudio contable de Chapinero con 22 clientes recibe alrededor de 1.700 documentos electronicos al mes. Bajarlos del portal y digitarlos ocupa a dos auxiliares durante seis dias habiles, siempre los mismos seis dias, siempre contra el reloj del vencimiento. No es que trabajen despacio: es que 1.700 archivos abiertos de a uno son 1.700 aperturas. La aritmetica no perdona, y por eso el cierre siempre se siente igual de apretado aunque el equipo mejore.',
      antes: '6 dias habiles de dos auxiliares abriendo archivos',
      despues: 'Los mismos 1.700 documentos procesados en una manana, y el resto del tiempo en revisar lo que no cuadro',
    },
    fotos: ['/images/seo/dashboard-desk.jpg', '/images/seo/app-woman-tech-blue.jpg', '/images/seo/office-tablet-woman.jpg'],
    cierre: 'Un estudio que recupera seis dias de dos auxiliares no gana seis dias de descanso: gana la posibilidad de vender asesoria. La planeacion tributaria, la revision de cifras con el gerente del cliente y la respuesta tranquila a un requerimiento son trabajo que se factura mejor que la digitacion, y son justo lo que hoy no cabe en el calendario. En una firma de outsourcing, ademas, la capacidad liberada se traduce en clientes nuevos sin contratar a nadie mas: el limite deja de ser cuantos documentos alcanza a digitar el equipo y pasa a ser cuantas contabilidades alcanza a entender.',
    faq: [
      { q: '¿Sirve para varios NIT o solo para uno?', a: 'Sirve para todos los que manejes. Cada descarga usa el token del NIT correspondiente, y los documentos quedan separados por emisor, así que puedes procesar un cliente detrás de otro sin que se mezclen.' },
      { q: '¿Tengo que subir los XML a algún servidor?', a: 'No. Los archivos se leen dentro de tu propio navegador. Lo que se guarda es la información contable que extrae, no los archivos, para no exponer documentos de tus clientes.' },
      { q: 'Nuestro estudio usa Siigo para unos clientes y World Office para otros. Sirve igual?', a: 'Si. Subes el formato vacio de cada uno y le indicas que columna es cada cosa una sola vez. Desde ese momento eliges el perfil del cliente y descargas el archivo en su formato, sin volver a configurar nada.' },
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
    h1Rest: 'sin abrir un solo archivo',
    heroSector: 'Para la contabilidad de manufactura y confección',
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
    caso: {
      titulo: 'Una confeccion con 180 proveedores al mes',
      texto: 'Un taller de confeccion del Poblado que trabaja con satelites, bordadores y proveedores de insumos recibe cerca de 180 facturas mensuales, la mayoria por debajo de los 400.000 pesos. Digitar una factura pequena cuesta lo mismo que digitar una grande, asi que el costo administrativo por documento se come el margen justo en las compras que menos lo aguantan. Y el detalle por referencia, que es lo unico que permitiria costear bien, se pierde al resumir cada factura a un renglon.',
      antes: '180 facturas resumidas a un renglon cada una, sin detalle por referencia',
      despues: 'El detalle linea por linea disponible para costear, sin volver a abrir un XML',
    },
    fotos: ['/images/seo/tablet-review-woman.jpg', '/images/seo/app-man-blue.jpg', '/images/seo/tablet-sign-business.jpg'],
    cierre: 'Cuando el detalle por referencia esta disponible sin abrir un solo archivo, el contador de una empresa de manufactura puede hacer algo que hoy casi nunca alcanza: sentarse con produccion a mirar el costo real por prenda antes de fijar el precio de la siguiente coleccion. Ese es el trabajo que justifica un contador dentro de una fabrica, y el que se pierde cuando las horas se van en digitar facturas de treinta mil pesos. La informacion siempre estuvo en los documentos; lo que faltaba era tenerla a tiempo y en una forma que se pueda cruzar.',
    faq: [
      { q: '¿Trae el detalle de cada línea de la factura?', a: 'Sí. El Excel incluye una hoja de líneas con la descripción, la cantidad, el valor unitario y los impuestos de cada renglón, además de la hoja de documentos con los totales.' },
      { q: '¿Reconoce las notas crédito de los proveedores?', a: 'Sí. Distingue facturas, notas crédito, notas débito, documento soporte y nómina electrónica, y las clasifica por tipo para que las devoluciones no se sumen como compras.' },
      { q: 'Necesito el costo por referencia, no solo el total de la factura. Lo saca?', a: 'Si. El Excel trae una hoja de lineas con la descripcion, la cantidad, el valor unitario y los impuestos de cada renglon. Desde ahi se costea por referencia con una tabla dinamica, sin volver a tocar los archivos originales.' },
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
    h1Rest: 'de tus XML de la DIAN',
    heroSector: 'Para la agroindustria y su facturación de temporada',
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
    caso: {
      titulo: 'El mes de zafra con el mismo equipo',
      texto: 'Una comercializadora agroindustrial del Valle pasa de 240 documentos en temporada baja a mas de 900 en zafra. El equipo contable es el mismo los doce meses, porque no se puede contratar y entrenar a alguien por seis semanas. El resultado conocido: en zafra el registro se atrasa, la conciliacion con la DIAN se pospone y los faltantes aparecen cuando ya hay que declarar, no cuando todavia se pueden pedir al proveedor.',
      antes: '900 documentos en zafra contra un equipo dimensionado para 240',
      despues: 'El mismo esfuerzo para 240 que para 900, y la conciliacion hecha antes de declarar',
    },
    fotos: ['/images/seo/app-woman-blue.jpg', '/images/home/templates-meeting.jpg', '/images/contadores/profesional-movil.jpg'],
    cierre: 'Un equipo que atraviesa la zafra sin atrasarse llega a la declaracion con la conciliacion hecha y no corriendo. Eso cambia la conversacion con el cliente agroindustrial: en vez de pedir prorrogas, el contador puede avisar en septiembre que faltan quince facturas de un proveedor y conseguirlas cuando todavia se pueden conseguir. Y en temporada baja, el tiempo que antes se usaba para ponerse al dia queda libre para lo que de verdad aporta: revisar margenes por linea, ordenar el plan de cuentas y preparar el siguiente pico antes de que llegue.',
    faq: [
      { q: '¿Cuántos documentos puede procesar de una vez?', a: 'No hay un tope técnico por lote: se procesan en tu propio navegador y el límite práctico es la memoria del computador. Miles de documentos se procesan en minutos.' },
      { q: '¿Separa la retención de ICA por municipio?', a: 'Separa la retención de ICA como concepto propio con su base y su tarifa. El municipio depende de cómo lo haya reportado el emisor en el XML.' },
      { q: 'En zafra llegamos a 900 documentos en un mes. Se cae la herramienta?', a: 'No. El procesamiento ocurre en tu propio computador y no depende de cuantos documentos sean; miles se procesan en minutos. El unico limite practico es la memoria del equipo, muy por encima de ese volumen.' },
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
    h1Rest: 'tus XML de la DIAN',
    heroSector: 'Para comercio exterior y zona franca',
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
    caso: {
      titulo: 'Exento, excluido y gravado en el mismo periodo',
      texto: 'Un importador del Atlantico con operacion en zona franca maneja en el mismo mes compras gravadas, importaciones y ventas exentas por exportacion. Cada una tiene un tratamiento distinto de IVA, y la evidencia de cual aplica esta en el codigo de impuesto que el emisor reporto en el XML. Cuando alguien resume la factura a mano en una hoja con base y total, ese codigo desaparece: meses despues, ante un requerimiento, nadie puede reconstruir por que esa operacion no llevaba IVA.',
      antes: 'El tratamiento tributario perdido al resumir a mano',
      despues: 'El codigo de impuesto conservado tal como lo reporto el emisor, documento por documento',
    },
    fotos: ['/images/home/why-1-pointing.jpg', '/images/home/why-3-confident.jpg', '/images/home/why-2-pointing.jpg'],
    cierre: 'En comercio exterior, el valor del contador esta en anticipar: saber que una operacion va a necesitar soporte reforzado antes de que llegue el requerimiento, no despues. Eso exige tiempo para revisar la clasificacion de cada operacion, y ese tiempo hoy se lo come la digitacion. Cuando el tratamiento tributario queda registrado automaticamente desde el documento, el contador puede dedicar la semana a lo que nadie mas puede hacer por el: revisar que la operacion este bien estructurada, no verificar que alguien haya copiado bien un numero.',
    faq: [
      { q: '¿Distingue operaciones exentas de excluidas?', a: 'Conserva el código de impuesto y la base de cada línea tal como vienen en el XML, que es donde esa distinción está registrada oficialmente. En el Excel aparece explícito en vez de perderse.' },
      { q: '¿Puedo buscar una factura vieja por su CUFE?', a: 'Sí. Cada documento procesado queda con su CUFE, su número y su emisor, y se puede buscar por cualquiera de los tres.' },
      { q: 'Ante un requerimiento me piden el soporte de una factura de hace dos anos. Cuanto tardo?', a: 'Lo que tardes en escribir el numero o el NIT en el buscador. Cada documento procesado queda con su CUFE, su numero y su emisor, asi que encontrarlo es una busqueda y no revisar comprimidos uno por uno.' },
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
    h1Rest: 'uno por uno',
    heroSector: 'Para hotelería, restaurantes y turismo',
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
    caso: {
      titulo: 'Un hotel que factura todos los dias',
      texto: 'Un hotel boutique del Centro Historico emite y recibe documentos los 30 dias del mes: proveedores de alimentos, lavanderia, mantenimiento, comisiones de agencias. Nunca hay un momento tranquilo para ponerse al dia. A eso se suma que el impuesto al consumo convive con el IVA en la misma contabilidad, y van a declaraciones distintas. Cuando el INC y el IVA terminan en la misma columna de una hoja hecha a mano, el error no se ve hasta que llega la declaracion.',
      antes: 'INC y IVA mezclados en la misma columna, sin manera de separarlos despues',
      despues: 'Cada impuesto en su columna con su base y su tarifa, tal como los reporto el emisor',
    },
    fotos: ['/images/seo/dashboard-desk.jpg', '/images/seo/app-woman-tech-blue.jpg', '/images/seo/office-tablet-woman.jpg'],
    cierre: 'En hoteleria el margen se defiende dia a dia, y el contador es quien puede ver donde se esta yendo. Con la clasificacion de impuestos resuelta, el tiempo se invierte en analizar el costo por habitacion ocupada, revisar las comisiones de agencias contra lo facturado y detectar el proveedor que subio precios sin avisar. Ese trabajo se paga solo en un mes. El que no se paga nunca es abrir archivos XML para copiar un numero a una celda, y sin embargo es el que hoy ocupa la mayor parte del cierre.',
    faq: [
      { q: '¿Separa el impuesto al consumo del IVA?', a: 'Sí. El INC tiene su propio código en el XML y aparece en su propia columna, con su base y su tarifa, sin mezclarse con el IVA.' },
      { q: '¿Sirve si facturamos todos los días?', a: 'Sí, y es donde más se nota. Puedes procesar por semana o por mes; el esfuerzo no cambia con la cantidad de documentos.' },
      { q: 'Tenemos alta rotacion en el area contable. Hay que entrenar a cada persona nueva?', a: 'El proceso es el mismo siempre: arrastrar los comprimidos y descargar el Excel. No depende de que alguien recuerde como se clasificaba cada impuesto, porque esa clasificacion la hace la herramienta leyendo el documento.' },
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
    h1Rest: 'en un solo paso',
    heroSector: 'Para calzado, salud y comercio',
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
    caso: {
      titulo: 'Proveedores en dos regimenes, en la misma empresa',
      texto: 'Una comercializadora de calzado de Bucaramanga le compra a talleres responsables de IVA y a proveedores no responsables en el mismo mes. La retencion aplicable cambia segun el caso, y cuando el registro se hace digitando, la decision la toma el auxiliar en el momento y sin tiempo para verificarla. Aplicarla mal se corrige tarde, con una correccion que cuesta mas que el documento que la origino.',
      antes: 'La retencion decidida a ojo por quien digita, documento a documento',
      despues: 'Los impuestos que el emisor liquido, a la vista en el Excel antes de registrar',
    },
    fotos: ['/images/seo/tablet-review-woman.jpg', '/images/seo/app-man-blue.jpg', '/images/seo/tablet-sign-business.jpg'],
    cierre: 'Llevar contabilidades de sectores distintos exige criterio, y el criterio necesita tiempo para aplicarse. Cuando el registro deja de consumir la semana, el contador puede revisar de verdad el tratamiento de cada operacion: si esa compra da derecho a descontar IVA, si esa retencion aplicaba, si el proveedor esta facturando como corresponde. Son decisiones que solo un profesional puede tomar y que hoy se toman a la carrera, en el mismo momento en que se digita, porque no queda tiempo para tomarlas dos veces.',
    faq: [
      { q: '¿Muestra si el proveedor es responsable de IVA?', a: 'Muestra los impuestos que el emisor reportó en cada documento, que es la evidencia de cómo facturó. Con eso se ve directamente si liquidó IVA o no.' },
      { q: '¿Funciona con documento soporte de no obligados a facturar?', a: 'Sí. El documento soporte se reconoce como tipo propio y se clasifica aparte de las facturas.' },
      { q: 'Como se si el proveedor es responsable de IVA sin buscar el RUT?', a: 'El documento muestra los impuestos que el emisor liquido, que es la evidencia de como facturo. Si liquido IVA, aparece con su base y su tarifa; si no, la casilla queda explicitamente vacia en vez de ambigua.' },
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
    h1Rest: 'de la DIAN',
    heroSector: 'Para cooperativas y compras a productores',
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
    caso: {
      titulo: 'Una cooperativa con 300 terceros distintos',
      texto: 'Una cooperativa del Eje Cafetero registra en un mes compras a mas de 300 terceros: productores, transportadores, proveedores de insumos. Cada tercero nuevo hay que crearlo en el software contable, y cuando el NIT o la razon social se copian a mano, el mismo proveedor termina creado dos veces con nombres ligeramente distintos. El auxiliar de terceros se ensucia, los saldos se parten y depurarlo cuesta mas que haberlo hecho bien. Y hay un costo que no aparece en ninguna factura: cuando el auxiliar de terceros esta sucio, ningun informe de compras por asociado es confiable, asi que la cooperativa toma decisiones sobre cifras que su propio contador sabe que estan mal. Depurar trescientos terceros duplicados es un trabajo de semanas que nadie presupuesta y que siempre se pospone, porque nunca es tan urgente como el cierre del mes que viene. El problema se arrastra de un ano al siguiente hasta que alguien decide pararlo todo y ordenarlo.',
      antes: 'Terceros duplicados por digitar mal el NIT o la razon social',
      despues: 'El NIT y la razon social exactos como los reporto el emisor, sin retipear',
    },
    fotos: ['/images/seo/app-woman-blue.jpg', '/images/home/templates-meeting.jpg', '/images/contadores/profesional-movil.jpg'],
    cierre: 'En una cooperativa, el auxiliar de terceros limpio no es un lujo administrativo: es lo que permite saber cuanto se le ha comprado a cada asociado y responder cuando lo pregunte. Cuando los terceros se crean bien la primera vez, el contador deja de dedicar dias a depurar duplicados y puede dedicarlos a lo que la asamblea si va a preguntar: como quedaron los excedentes, que asociados concentran las compras y si la operacion del ano se comporto como estaba presupuestada.',
    faq: [
      { q: '¿Distingue el documento soporte de una factura normal?', a: 'Sí, es un tipo propio dentro de la clasificación y aparece marcado como tal en el Excel y en la tabla.' },
      { q: '¿El NIT y la razón social salen tal cual?', a: 'Salen tal como el emisor los reportó en el XML, sin retipear, que es lo que evita crear el mismo tercero dos veces con nombres distintos.' },
      { q: 'Compramos a productores que no estan obligados a facturar. Eso tambien lo lee?', a: 'Si. El documento soporte es un tipo propio dentro de la clasificacion y aparece marcado como tal, separado de las facturas electronicas, para que no se declaren como si fueran lo mismo.' },
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
    h1Rest: 'convertidos en información',
    heroSector: 'Para entidades educativas y sin ánimo de lucro',
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
    caso: {
      titulo: 'Rendir cuentas dos anos despues',
      texto: 'Una fundacion educativa de Manizales, dentro del regimen tributario especial, tiene que poder demostrar cada registro ante su consejo directivo y ante la DIAN. La cifra vive en el software contable y el soporte en una carpeta de comprimidos que alguien organizo alguna vez. La unica conexion entre los dos suele ser la memoria de quien estaba entonces, y esa persona ya no siempre esta cuando llega la solicitud.',
      antes: 'El soporte y el registro conectados solo por la memoria de alguien',
      despues: 'Cada registro con su CUFE, su numero y su emisor, localizable en segundos',
    },
    fotos: ['/images/home/why-1-pointing.jpg', '/images/home/why-3-confident.jpg', '/images/home/why-2-pointing.jpg'],
    cierre: 'En una entidad del regimen especial, el tiempo mejor invertido es el que se dedica a preparar la rendicion de cuentas antes de que la pidan, no a buscar soportes cuando ya la pidieron. Con la trazabilidad resuelta, el contador puede armar los informes al consejo con calma, revisar que la destinacion de los excedentes este documentada y anticipar las preguntas del proximo requerimiento. Es el trabajo por el que una fundacion contrata a un contador, y el que queda desplazado cuando la semana se va en organizar carpetas.',
    faq: [
      { q: '¿Se conserva el XML original?', a: 'El XML es el documento con validez legal, no el PDF, y ese criterio guía toda la herramienta: lo que se extrae es la información contable, y el archivo original sigue siendo tuyo en tu carpeta.' },
      { q: '¿Sirve para una entidad sin ánimo de lucro?', a: 'Sí. La herramienta lee documentos electrónicos de la DIAN sin importar el régimen del receptor; lo que cambia es qué haces después con la información.' },
      { q: 'Somos una entidad sin animo de lucro. La herramienta aplica a nuestro caso?', a: 'Si. Lee documentos electronicos de la DIAN sin importar el regimen de quien los recibe. Lo que cambia con el regimen especial es que la trazabilidad entre registro y soporte pesa mas, y es justamente lo que queda resuelto.' },
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
    h1Rest: 'de XML de la DIAN',
    heroSector: 'Para el comercio de frontera',
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
    caso: {
      titulo: 'Una contabilidad que va un mes atras',
      texto: 'Un comercializador de Cucuta con margenes del 4% necesita saber su costo real esta semana, no el mes entrante. Pero el registro depende de digitar, y digitar depende de que alguien tenga tiempo. La informacion existe desde el dia uno dentro de los XML; lo que no existe es alguien que la haya transcrito. Decidir precios con la foto del mes pasado, con esos margenes, es decidir a ciegas. El efecto compuesto es lo que casi nadie calcula: si la contabilidad va un mes atras, la decision de precio de este mes se toma con la estructura de costos del anterior, y en un negocio que compra y vende rapido esa diferencia se acumula en cada operacion. No es un error puntual que se pueda corregir despues; es un sesgo constante en la direccion equivocada, y solo se nota cuando el margen del trimestre no cuadra con lo que se esperaba.',
      antes: 'La cifra real disponible un mes tarde, cuando ya no sirve para decidir',
      despues: 'La informacion disponible el mismo dia en que el documento existe',
    },
    fotos: ['/images/seo/dashboard-desk.jpg', '/images/seo/app-woman-tech-blue.jpg', '/images/seo/office-tablet-woman.jpg'],
    cierre: 'Con margenes del cuatro por ciento, el contador que entrega la cifra a tiempo deja de ser un area de soporte y pasa a ser parte de la decision comercial. Recuperar los dias que hoy se van en digitar significa poder sentarse a mirar rotacion, costo real por linea y cuales proveedores estan encareciendo la operacion sin que nadie lo haya notado. En un negocio de frontera, donde el precio cambia rapido, esa informacion vale mas que el ahorro de horas que la produjo.',
    faq: [
      { q: '¿Cómo cruza la DIAN contra mi contabilidad?', a: 'Subes tu Excel contable y la herramienta empareja documento por documento contra lo procesado de la DIAN, por número y por NIT. Devuelve tres listas: faltantes, sobrantes y diferencias de valor.' },
      { q: '¿Qué pasa si mi Excel tiene otro formato?', a: 'Se emparejan las columnas la primera vez: le dices cuál es el número, cuál el NIT y cuál el valor. Esa configuración queda guardada para las siguientes veces.' },
      { q: 'Como se exactamente que facturas me faltan por registrar?', a: 'Subes tu Excel contable y el auditor lo empareja contra lo que la DIAN tiene reportado, por numero y por NIT. Devuelve tres listas separadas: lo que falta, lo que sobra y lo que tiene diferencia de valor, cada una con su documento identificado.' },
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
    h1Rest: 'a tu contabilidad',
    heroSector: 'Para el agro y el comercio regional',
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
    caso: {
      titulo: 'Tres retenciones dentro del mismo documento',
      texto: 'Una comercializadora agricola del Tolima recibe facturas que traen retefuente, reteIVA y reteICA al mismo tiempo, cada una con su base distinta. En el papel se ven parecidas; en la declaracion van a lugares distintos. Desglosarlas a mano, documento por documento, es la tarea que se lleva la mitad del cierre y la que menos tolera el cansancio de la ultima hora de la tarde. A eso se suma que las retenciones mal desglosadas no fallan de forma visible: la declaracion se presenta, el sistema la acepta y todo parece correcto. El error aparece meses despues, en un cruce de informacion, cuando corregir ya implica sancion. Por eso el desglose no es una tarea administrativa mas: es el punto donde un cierre apurado se convierte en un costo real, y donde el contador prefiere no tener que confiar en que a las siete de la tarde alguien clasifico bien la retencion numero doscientos.',
      antes: 'Las tres retenciones sumadas en una columna, para volver a abrirlas al declarar',
      despues: 'Cada retencion con su concepto, su base y su tarifa, en una hoja aparte',
    },
    fotos: ['/images/seo/tablet-review-woman.jpg', '/images/seo/app-man-blue.jpg', '/images/seo/tablet-sign-business.jpg'],
    cierre: 'Con las retenciones desglosadas desde el documento, el cierre deja de ser una tarea de clasificacion y vuelve a ser una de revision. El contador puede verificar que las tarifas aplicadas sean las correctas segun la actividad y el municipio, algo que hoy casi nadie alcanza a comprobar porque el tiempo se agota antes. En el agro, donde las bases y los conceptos cambian con el tipo de compra, esa verificacion es exactamente donde un profesional evita una correccion costosa meses despues.',
    faq: [
      { q: '¿Separa reteIVA de reteICA y de retefuente?', a: 'Sí, cada una con su código, su base y su tarifa, en una hoja de impuestos aparte de la de documentos.' },
      { q: '¿Qué pasa si un documento no trae retenciones?', a: 'Simplemente no aparece en esa hoja. La herramienta lo indica de forma explícita en vez de dejar celdas vacías que parezcan un error.' },
      { q: 'Y si un mes no hay retenciones de algun tipo?', a: 'La hoja lo dice de forma explicita en vez de dejar celdas vacias que parezcan un error de la herramienta. Saber que no hubo es distinto de no saber.' },
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
    h1Rest: 'y olvídate del trabajo manual',
    heroSector: 'Para turismo y agroexportación',
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
    caso: {
      titulo: 'Una devolucion de IVA por exportacion',
      texto: 'Una comercializadora de banano del Magdalena solicita devolucion de IVA por sus exportaciones. Ese tramite es de los mas revisados, y exige que cada documento este localizable y sea consistente con lo declarado. Cuando el soporte vive en comprimidos sin ordenar y las cifras se transcribieron a mano, cualquier diferencia entre lo registrado y lo que dice el documento se convierte en un requerimiento. Y el calendario no ayuda: la temporada alta del turismo coincide con los meses de mayor exportacion, asi que las dos operaciones exigen atencion al mismo tiempo. El equipo termina eligiendo cual atender bien, y la que se queda esperando suele ser la que no grita, que es justamente la que tiene el tramite de devolucion en curso. Cuando el registro deja de depender de horas-persona, esa eleccion desaparece y las dos avanzan a la vez.',
      antes: 'Cifras transcritas a mano que hay que verificar contra el documento una por una',
      despues: 'Lo registrado sale del documento, asi que no puede diferir de el',
    },
    fotos: ['/images/seo/app-woman-blue.jpg', '/images/home/templates-meeting.jpg', '/images/contadores/profesional-movil.jpg'],
    cierre: 'Cuando el soporte de una exportacion sale directamente del documento y no de una transcripcion, la solicitud de devolucion se prepara con semanas de anticipacion en vez de contra el plazo. Ese tiempo se invierte en revisar que la operacion este bien documentada desde el origen, que es donde se decide si la devolucion sale o se queda en un requerimiento. Y en temporada alta, el equipo puede atender la operacion turistica sin que la agroexportadora quede desatendida, que es lo que hoy pasa cada ano.',
    faq: [
      { q: '¿Sirve para soportar una solicitud de devolución de IVA?', a: 'La herramienta te da la información exacta del documento electrónico y lo deja localizable por CUFE y número. El trámite lo presentas tú, pero el soporte queda ordenado y consistente.' },
      { q: '¿Puedo procesar varios periodos de una sola vez?', a: 'Sí. Puedes soltar los comprimidos de varios meses juntos; cada documento conserva su fecha de emisión y se puede filtrar por periodo.' },
      { q: 'Manejamos hotel y comercializadora con el mismo contador. Se pueden separar?', a: 'Si. Cada documento conserva el NIT del emisor y del receptor, asi que puedes procesar y filtrar por empresa sin que las dos contabilidades se mezclen.' },
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
    h1Rest: 'sin abrirlos uno por uno',
    heroSector: 'Para ganadería, agro y servicios petroleros',
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
    caso: {
      titulo: 'Documento soporte y factura llegando juntos',
      texto: 'Un contador de Villavicencio lleva a la vez una ganaderia que compra a productores no obligados a facturar y una empresa de servicios petroleros con contratistas formales. La descarga del portal trae de todo mezclado, y separar el documento soporte de la factura electronica es un paso previo obligatorio antes siquiera de empezar a registrar. Con clientes en municipios distintos, ademas, los archivos viajan por correo de un escritorio a otro. Hay ademas un costo silencioso en el ida y vuelta de archivos: cada correo con comprimidos adjuntos es una version mas de la verdad, y cuando algo no cuadra nadie sabe cual carpeta es la buena. Con clientes a dos o tres horas de camino, aclarar una diferencia por telefono cuesta media manana. Trabajar sobre la misma informacion, leida siempre igual, elimina esa clase de discusion antes de que empiece.',
      antes: 'Separar a mano documento soporte de factura antes de poder registrar',
      despues: 'Cada documento clasificado por tipo desde el momento en que se lee',
    },
    fotos: ['/images/home/why-1-pointing.jpg', '/images/home/why-3-confident.jpg', '/images/home/why-2-pointing.jpg'],
    cierre: 'Llevar clientes en municipios distintos deja de ser un problema logistico cuando los documentos no tienen que viajar. El contador puede procesar la contabilidad de la ganaderia y la de los servicios petroleros el mismo dia sin desplazarse, y usar el tiempo recuperado en lo que si exige presencia: entender la operacion del cliente, revisar contratos con contratistas y anticipar el impacto tributario de la siguiente temporada. En una region de distancias largas, el tiempo de traslado es el recurso mas escaso.',
    faq: [
      { q: '¿Necesito instalar algo?', a: 'No. Funciona en el navegador, en Chrome o Edge de computador. La descarga masiva necesita computador porque guarda los archivos en una carpeta que tú eliges.' },
      { q: '¿Puedo trabajarlo desde otro municipio?', a: 'Sí. Lo único que necesitas es tu sesión y el token de la DIAN del cliente, que llega al correo de quien lo solicita.' },
      { q: 'Trabajo desde otro municipio y mi cliente esta en Villavicencio. Funciona?', a: 'Si. Todo ocurre en tu navegador desde donde estes. Lo unico que necesitas es tu sesion y el enlace del token de la DIAN, que llega al correo de quien lo solicita.' },
    ],
  },
];

export const getCiudadContador = (slug: string): CiudadContadorSeo | undefined =>
  CIUDADES_CONTADOR.find((c) => c.slug === slug);

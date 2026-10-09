/**
 * Colombia — firma electrónica y las funciones nuevas (firmar desde el
 * celular, por WhatsApp, en persona con QR, plantillas desde Word,
 * reconocimiento facial). Ver co-intent-seo-content.ts para el porqué de
 * cada tema y las fuentes legales.
 */
import type { PaginaCO } from './co-intent-seo-content';
import { F } from './seo-fotos';

export const PAGINAS_CO_FIRMA: PaginaCO[] = [
  {
    slug: 'firmar-documentos-desde-el-celular',
    titleTag: 'Firmar documentos desde el celular en Colombia',
    metaDescription: 'Firma un PDF o un contrato desde tu celular, sin instalar nada y con validez legal en Colombia (Ley 527 de 1999). Envíalo a firmar por WhatsApp o correo.',
    h1: 'Firmar documentos desde el celular',
    grupo: 'firma',
    intro: 'La mayoría de los contratos en Colombia ya no se firman en una oficina: se firman en un bus, en la fila del banco o en un descanso del trabajo, desde el celular. Lo que falta casi siempre no es la firma, sino la prueba de quién firmó, cuándo y qué documento exacto. Eso es lo que separa una imagen de una firma pegada en un PDF de una firma electrónica que aguanta una discusión.',
    problema: {
      titulo: 'Una foto de la firma no es una firma electrónica',
      texto: 'Lo habitual es imprimir, firmar con esfero, tomar una foto y mandarla por WhatsApp. O pegar una imagen de la firma encima del PDF. Las dos cosas se pueden hacer en un minuto, y las dos dejan el mismo hueco: nada demuestra que esa imagen la puso la persona que dice haberla puesto, ni que el documento no cambió después. Si el otro lado niega haber firmado, lo único que hay es una imagen que cualquiera pudo copiar. El problema no es el celular; es que firmar sin registro deja todo el peso de la prueba en el aire.',
    },
    puntos: [
      { titulo: 'Firma con el dedo, sin instalar nada', texto: 'Abres el enlace en el navegador del celular —Android o iPhone—, revisas el documento completo y firmas con el dedo sobre la pantalla. No hay que descargar una aplicación, crear una cuenta ni tener un certificado digital instalado.' },
      { titulo: 'Cada firma queda con su registro', texto: 'Junto con la firma se guardan la fecha y la hora, la dirección IP, el dispositivo y una huella SHA-256 del documento. Si alguien cambia una coma después de firmado, la huella ya no coincide y se nota.' },
      { titulo: 'Verificación de identidad si el documento lo amerita', texto: 'Para un contrato de arriendo o un pagaré puedes pedir que quien firma tome una selfie y una foto de su cédula, o que confirme con el reconocimiento facial o la huella de su propio celular. Para una autorización sencilla, basta la firma.' },
      { titulo: 'Lo envías por donde ya hablas con la gente', texto: 'El enlace para firmar se manda por WhatsApp, por correo o se muestra como código QR en tu pantalla. Cuando todos firman, cada persona recibe el PDF firmado con su certificado de firma al final.' },
    ],
    ley: {
      titulo: 'Por qué tiene validez en Colombia',
      texto: 'El artículo 7 de la Ley 527 de 1999 establece que cuando la ley exige la firma de una persona, ese requisito se cumple en un mensaje de datos si se usa un método que identifique al firmante e indique que aprueba el contenido, y que sea confiable y apropiado para el propósito del mensaje. El Decreto 2364 de 2012, hoy compilado en el Decreto Único Reglamentario 1074 de 2015, considera confiable la firma electrónica cuando los datos de creación corresponden exclusivamente al firmante y es posible detectar cualquier alteración posterior. Y el artículo 247 del Código General del Proceso admite los mensajes de datos como prueba documental. La firma desde el celular cabe en esa definición siempre que quede el registro que la respalda.',
    },
    caso: {
      titulo: 'Un contrato de arriendo firmado desde Cartagena',
      texto: 'Una arrendadora en Bogotá tenía un inquilino nuevo que estaba trabajando en Cartagena por tres semanas. Antes, eso significaba esperar a que volviera o pagar una mensajería de ida y vuelta. Le envió el contrato por WhatsApp, él lo firmó desde el celular con selfie y foto de la cédula en la hora del almuerzo, y ella firmó por la tarde. Los dos recibieron el PDF con el certificado de firma esa misma noche, y el inquilino pudo entregar el depósito de servicios al portero sin que nadie se moviera de su ciudad.',
    },
    checklist: {
      titulo: 'Antes de mandar un documento a firmar desde el celular',
      items: [
        'Revisa que el PDF se lea bien en pantalla pequeña: letra de al menos 10 puntos y sin tablas que se salgan del margen.',
        'Decide si basta la firma o si necesitas selfie, cédula o reconocimiento facial según lo que se esté firmando.',
        'Escribe en el mensaje qué documento es y para qué, para que quien firma no lo confunda con un enlace sospechoso.',
        'Guarda el PDF firmado con su certificado: es lo que vas a mostrar si algún día hay una discusión.',
      ],
    },
    faq: [
      { q: '¿Es legal firmar un contrato desde el celular en Colombia?', a: 'Sí. La Ley 527 de 1999 no distingue el dispositivo: lo que exige es que el método identifique al firmante, muestre que aprueba el contenido y sea confiable. Un celular sirve igual que un computador si queda el registro de quién firmó y la prueba de que el documento no cambió.' },
      { q: '¿Necesito un certificado de firma digital?', a: 'No para la mayoría de contratos entre particulares. La firma digital certificada (artículo 28 de la Ley 527) es un tipo específico que algunos trámites exigen expresamente. Para arriendos, contratos de servicios, autorizaciones o pagarés entre personas, la firma electrónica con registro de auditoría es suficiente.' },
      { q: '¿La otra persona necesita instalar algo?', a: 'No. Abre el enlace en el navegador de su celular, lee el documento y firma con el dedo. No necesita cuenta, contraseña ni aplicación.' },
      { q: '¿Puedo firmar un PDF que me mandaron por WhatsApp?', a: 'Sí. Lo subes, pones tu firma donde corresponde y lo descargas firmado, o lo devuelves para que la otra parte también firme. El PDF final lleva el certificado con el registro de cada firma.' },
    ],
    fotos: [F.movil, F.revisar, F.firma],
    cta: 'Firmar un documento ahora',
    ctaTo: '/firma-electronica',
  },
  {
    slug: 'como-firmar-un-documento-en-word',
    titleTag: 'Cómo firmar un documento de Word',
    metaDescription: 'Firma un documento de Word sin imprimirlo ni escanearlo: súbelo, fírmalo desde el computador o el celular y descárgalo en PDF con certificado de firma.',
    h1: 'Cómo firmar un documento de Word',
    grupo: 'firma',
    intro: 'Word sirve para escribir el contrato, pero no para firmarlo. Insertar una imagen de la firma en el documento es lo que hace casi todo el mundo, y es justo lo que menos protege: el archivo se puede seguir editando después, y la imagen se puede copiar a cualquier otro documento. La forma correcta es convertir el Word en un PDF que nadie pueda alterar sin que se note, y firmarlo con registro.',
    problema: {
      titulo: 'Una imagen en un .docx se puede mover, copiar y negar',
      texto: 'Un documento de Word es editable por diseño. Si firmas pegando una imagen y lo envías como .docx, quien lo recibe puede cambiar una cifra, una fecha o una cláusula, guardar y nadie sabrá qué decía antes. Si lo conviertes a PDF tú mismo y le pegas la imagen, mejoras un poco, pero la imagen sigue sin decir quién la puso ni cuándo. En una discusión, «yo no firmé eso» y «eso no decía así» son las dos frases más comunes, y un Word firmado con una imagen no responde ninguna.',
    },
    puntos: [
      { titulo: 'Sube el Word tal como lo tienes', texto: 'Arrastras el .docx y se convierte en un documento para firmar, con su formato: títulos, negritas, tablas y márgenes. No tienes que exportarlo a PDF antes ni ajustar nada.' },
      { titulo: 'Firma con el mouse, el dedo o tu firma guardada', texto: 'Dibujas la firma o usas la que guardaste la primera vez. Si firman varias personas, cada una recibe su propio enlace y firma desde su computador o celular.' },
      { titulo: 'El documento queda sellado', texto: 'Al terminar, el documento se cierra con una huella SHA-256. Cualquier cambio posterior, por pequeño que sea, rompe la huella. El PDF final incluye un certificado con quién firmó, cuándo y desde qué dispositivo.' },
      { titulo: 'Si lo usas seguido, conviértelo en plantilla', texto: 'Si es un contrato que firmas cada semana, súbelo una vez como plantilla: la app encuentra sola los espacios en blanco (____, [Nombre], XXXX) y la próxima vez solo llenas los datos y lo envías.' },
    ],
    ley: {
      titulo: 'Qué dice la ley colombiana',
      texto: 'La Ley 527 de 1999 reconoce los mensajes de datos —un documento electrónico— con el mismo valor que el papel (artículo 5) y considera cumplido el requisito de firma cuando se usa un método confiable que identifique a quien firma y muestre que aprueba el contenido (artículo 7). El artículo 8 añade la exigencia de integridad: que la información se haya mantenido completa e inalterada. Por eso importa más el registro y el sellado del documento que la apariencia de la firma. El Decreto 2364 de 2012, compilado en el Decreto 1074 de 2015, precisa que la firma es confiable si es posible detectar cualquier alteración hecha después de firmar.',
    },
    caso: {
      titulo: 'La cotización que cambió de precio',
      texto: 'Un contratista de remodelaciones en Medellín enviaba sus cotizaciones en Word con su firma pegada como imagen. Un cliente le devolvió el documento «firmado» con el valor total cambiado de $18 millones a $15 millones, y la discusión duró semanas porque el contratista no tenía cómo demostrar cuál era la versión original. Ahora sube el Word, lo firma y lo envía para que el cliente firme encima: el PDF sellado dice exactamente qué valor aceptaron los dos.',
    },
    faq: [
      { q: '¿Puedo firmar directamente dentro de Word?', a: 'Word permite insertar una imagen o una línea de firma, pero el archivo sigue siendo editable y no registra quién firmó ni cuándo. Para un documento que deba valer ante un tercero, conviene convertirlo en un PDF sellado con registro de firma.' },
      { q: '¿Se pierde el formato del Word al subirlo?', a: 'No. Se conservan títulos, negritas, tablas, viñetas y márgenes. Lo que ves al subirlo es lo que verá quien firma.' },
      { q: '¿Cómo firmo un Word desde el celular?', a: 'Abres la app en el navegador del celular, subes el Word desde el teléfono o desde Google Drive y firmas con el dedo. No necesitas Word instalado en el teléfono.' },
      { q: '¿Qué diferencia hay entre firmar un Word y firmar un PDF?', a: 'Para quien firma, ninguna. Por dentro, el Word se convierte en un documento sellado igual que un PDF, y el resultado final se descarga en PDF con el certificado de firma.' },
    ],
    fotos: [F.escritorio, F.oficina, F.firma],
    cta: 'Subir mi Word y firmarlo',
    ctaTo: '/firma-electronica',
  },
  {
    slug: 'enviar-documento-a-firmar-por-whatsapp',
    titleTag: 'Enviar un documento a firmar por WhatsApp',
    metaDescription: 'Manda un contrato a firmar por WhatsApp con un enlace seguro. Quien firma lo hace desde el celular y tú recibes el PDF firmado con certificado.',
    h1: 'Enviar un documento a firmar por WhatsApp',
    grupo: 'firma',
    intro: 'En Colombia los negocios se cierran por WhatsApp. El arriendo se acuerda por WhatsApp, la cotización se aprueba por WhatsApp y el contrato de servicios se negocia por WhatsApp. Tiene sentido que la firma también llegue por ahí, pero no como un PDF que la persona tiene que imprimir, firmar, escanear y devolver: como un enlace que se firma en dos minutos.',
    problema: {
      titulo: 'El ciclo de imprimir, firmar y escanear se queda a medias',
      texto: 'Cuando el contrato se manda como PDF adjunto, empieza el ciclo: la otra persona lo descarga, no tiene impresora, lo deja para después, lo firma con una foto torcida o devuelve una versión sin la última página. Mientras tanto el negocio está parado. Y al final, lo que queda en el chat es una foto de un papel, que no prueba quién firmó ni que el documento sea el mismo que enviaste. Lo que se pierde no es solo tiempo: es la certeza de qué quedó firmado.',
    },
    puntos: [
      { titulo: 'Un enlace en lugar de un adjunto', texto: 'Creas el documento o lo subes, y la app genera un enlace único para cada firmante. Tocas «WhatsApp» y se abre el chat con el mensaje listo; solo eliges el contacto y envías.' },
      { titulo: 'Quien lo recibe firma sin salir del celular', texto: 'Abre el enlace, lee el documento completo, firma con el dedo y, si lo pediste, se toma una selfie con su cédula. No descarga nada ni crea cuenta.' },
      { titulo: 'Sabes en qué va cada firma', texto: 'Ves si el documento está pendiente o firmado, y por quién. Cuando firma el último, todos reciben el PDF final con el certificado de firma: fecha, hora, IP, dispositivo y huella del documento.' },
      { titulo: 'Un enlace por persona', texto: 'Si firman tres personas, cada una recibe su propio enlace. Nadie puede firmar por otro, y el registro muestra quién abrió y firmó cada parte.' },
    ],
    ley: {
      titulo: 'Un mensaje de WhatsApp también es un mensaje de datos',
      texto: 'La Ley 527 de 1999 define mensaje de datos como la información generada, enviada, recibida o almacenada por medios electrónicos, y le da el mismo valor que a un documento en papel. Los jueces colombianos admiten conversaciones de WhatsApp como prueba y las valoran con las reglas de los mensajes de datos del artículo 247 del Código General del Proceso. Pero hay una diferencia entre usar WhatsApp para enviar el enlace y usarlo como lugar de la firma: la firma con registro de auditoría deja la prueba de identidad e integridad que una foto en un chat no deja, y eso es lo que el artículo 7 de la Ley 527 pide para que una firma electrónica sea confiable.',
    },
    caso: {
      titulo: 'Una academia con cuarenta matrículas en una semana',
      texto: 'Una academia de inglés en Bucaramanga hacía firmar los contratos de matrícula en papel en la recepción, y en temporada se formaban filas los sábados. El primer semestre que mandó el contrato por WhatsApp a cada acudiente, el 80 % lo firmó el mismo día desde el celular. La recepción dejó de archivar papeles y cada contrato quedó con la cédula del acudiente que lo firmó.',
    },
    faq: [
      { q: '¿Es válido un contrato firmado por WhatsApp?', a: 'Un acuerdo expresado por WhatsApp puede tener valor probatorio, pero es mucho más débil que una firma electrónica con registro. Lo recomendable es usar WhatsApp para enviar el enlace y que la firma quede registrada en el documento, con identidad y huella de integridad.' },
      { q: '¿El enlace se puede reenviar a otra persona?', a: 'Cada enlace es personal. Si pides verificación de identidad, quien firme tendrá que mostrar su cédula y su cara, así que reenviarlo no permite que otra persona firme en su lugar sin que quede registrado.' },
      { q: '¿Tengo que tener WhatsApp Business?', a: 'No. Funciona con WhatsApp normal en el celular o en WhatsApp Web. La app solo prepara el mensaje con el enlace.' },
      { q: '¿Qué pasa si la persona no tiene WhatsApp?', a: 'Le envías el mismo enlace por correo, por SMS o se lo muestras como código QR para que lo escanee con la cámara.' },
    ],
    fotos: [F.movil, F.mujer, F.firma],
    cta: 'Enviar un documento a firmar',
    ctaTo: '/firma-electronica',
  },
  {
    slug: 'firmar-en-persona-con-codigo-qr',
    titleTag: 'Firmar en persona con código QR',
    metaDescription: 'Muestra un código QR y tu cliente firma el contrato desde su propio celular, ahí mismo. Sin papel, sin tableta prestada y con registro legal.',
    h1: 'Firmar en persona con código QR',
    grupo: 'firma',
    intro: 'Hay momentos en que el cliente está ahí, al frente, y hay que firmar ya: al entregar un apartamento, al recibir un vehículo, al cerrar una venta en una feria o al matricular a un estudiante. Pasarle tu celular o una tableta para que firme funciona, pero deja una duda: la firma la hizo él en tu dispositivo. Con un código QR firma en el suyo, y eso cambia la prueba.',
    problema: {
      titulo: 'Firmar en el dispositivo del vendedor deja una duda',
      texto: 'Cuando el cliente firma en la tableta del negocio, el registro dice que la firma se hizo desde un dispositivo que controla el negocio. Si después hay un reclamo, el cliente puede alegar que no leyó el documento, que se lo pusieron rápido o que la firma se reutilizó. Además, pasar un celular de mano en mano en un mostrador no es cómodo para nadie, y el papel que se firma «mientras tanto» termina perdido en una carpeta.',
    },
    puntos: [
      { titulo: 'El QR abre el documento en el celular del cliente', texto: 'Tocas «En persona» y aparece en tu pantalla un código QR grande y con alto contraste. El cliente lo escanea con la cámara de su celular —cualquier Android o iPhone— y el documento se abre para leerlo y firmarlo.' },
      { titulo: 'La pantalla no se apaga mientras esperas', texto: 'Mientras el QR está en pantalla, la app evita que el teléfono se bloquee, para que el cliente pueda escanearlo con calma.' },
      { titulo: 'Tarjeta NFC para quien firma seguido', texto: 'En celulares Android con Chrome puedes grabar el enlace en una tarjeta o sticker NFC. El cliente acerca su teléfono a la tarjeta —también funciona con iPhone— y se abre el documento para firmar.' },
      { titulo: 'Cada firmante con su propio enlace', texto: 'Si firman dos o tres personas, cada una escanea su propio QR. El registro muestra que cada firma se hizo desde el dispositivo de esa persona.' },
    ],
    ley: {
      titulo: 'Por qué el dispositivo propio fortalece la firma',
      texto: 'El Decreto 2364 de 2012, compilado en el artículo 2.2.2.47.4 del Decreto 1074 de 2015, considera confiable una firma electrónica cuando los datos de creación de la firma corresponden exclusivamente al firmante en el contexto en que se usan. Que la persona firme desde su propio celular, con su propio registro de dispositivo e IP, ayuda a demostrar precisamente eso. Sumado a la huella de integridad del documento —la posibilidad de detectar cualquier alteración posterior—, cumple los dos criterios de confiabilidad de la norma y los del artículo 7 de la Ley 527 de 1999.',
    },
    caso: {
      titulo: 'Entrega de un apartamento sin papel',
      texto: 'Una inmobiliaria en Pereira hacía el acta de entrega de cada apartamento en papel, con fotos tomadas en el celular del asesor que después nadie encontraba. Ahora el asesor recorre el inmueble, llena el acta en la app y al final muestra el QR: el arrendatario la firma desde su teléfono en la sala del apartamento. El acta firmada, con su registro, le llega a los dos por correo antes de que el asesor salga del edificio.',
    },
    faq: [
      { q: '¿Funciona con cualquier celular?', a: 'Sí. Cualquier teléfono con cámara puede leer un código QR; en la mayoría basta con abrir la cámara y apuntar. No hay que instalar nada.' },
      { q: '¿Qué es la tarjeta NFC y la necesito?', a: 'Es un sticker o tarjeta que guarda el enlace del documento: el cliente acerca su teléfono y se abre. Es opcional; el QR hace lo mismo y funciona en todos los celulares.' },
      { q: '¿Se puede firmar en persona sin internet?', a: 'Quien firma necesita datos o wifi para abrir el enlace y registrar la firma. El registro en línea es lo que le da a la firma su fecha, hora e integridad verificables.' },
      { q: '¿Puedo pedir la cédula al firmar en persona?', a: 'Sí. Puedes exigir selfie y foto de la cédula, o la confirmación con el reconocimiento facial o la huella del propio celular del cliente.' },
    ],
    fotos: [F.hombre, F.movil, F.oficina],
    cta: 'Firmar en persona ahora',
    ctaTo: '/firma-electronica',
  },
  {
    slug: 'firma-electronica-para-contratos-de-trabajo',
    titleTag: 'Firma electrónica para contratos de trabajo',
    metaDescription: 'Firma contratos laborales en línea con validez en Colombia. Cumple el contrato escrito que exige la reforma laboral (Ley 2466 de 2025) sin papel.',
    h1: 'Firma electrónica para contratos de trabajo',
    grupo: 'firma',
    intro: 'Con la reforma laboral, el contrato por escrito dejó de ser una buena práctica y pasó a ser una obligación en varios casos: el de término fijo, el de obra o labor y el del trabajo doméstico. Firmarlos en papel con cada persona nueva es lento, y perderlos en una carpeta es caro. Firmarlos electrónicamente cumple el requisito de forma y deja cada contrato archivado con su prueba.',
    problema: {
      titulo: 'El contrato que no se firmó a tiempo ya es indefinido',
      texto: 'La Ley 2466 de 2025 establece que el contrato a término fijo debe constar por escrito y que, si no se cumple ese requisito, se entiende celebrado a término indefinido desde el inicio. Lo mismo pasa con el contrato por obra o labor si no se especifica por escrito la labor contratada. En la práctica, muchas empresas pequeñas contratan a alguien el lunes y le hacen firmar «cuando haya tiempo». Ese retraso, que antes era desorden, ahora puede cambiar la modalidad del contrato.',
    },
    puntos: [
      { titulo: 'Firmado antes del primer día', texto: 'Envías el contrato por WhatsApp o correo cuando la persona acepta la oferta, y lo firma desde su celular ese mismo día. Llega al primer día de trabajo con el contrato ya firmado por los dos.' },
      { titulo: 'Plantillas que respetan cada modalidad', texto: 'Sube tus modelos de término indefinido, término fijo, obra o labor o servicio doméstico una sola vez. La app encuentra los espacios para llenar y cada contratación nueva toma un par de minutos.' },
      { titulo: 'Identidad verificada del trabajador', texto: 'Puedes pedir selfie y foto de la cédula al firmar, para que el contrato quede ligado a la persona que realmente se contrató.' },
      { titulo: 'Todos los contratos en un solo lugar', texto: 'Cada contrato firmado queda en «Mis documentos» con su certificado. Cuando llega una visita del Ministerio de Trabajo o un requerimiento, lo encuentras en segundos.' },
    ],
    ley: {
      titulo: 'Contrato escrito y firma electrónica',
      texto: 'Tras la Ley 2466 de 2025, el artículo 47 del Código Sustantivo del Trabajo establece el contrato a término indefinido como regla general, y el artículo 46 exige que el de término fijo conste por escrito, con un máximo de cuatro años. El artículo 33 de la misma ley exige contrato escrito para todo trabajador doméstico. Ninguna de estas normas exige papel: la Ley 527 de 1999, en su artículo 6, establece que cuando la ley requiere que la información conste por escrito, ese requisito se cumple con un mensaje de datos si la información es accesible para su posterior consulta. Un contrato firmado electrónicamente y conservado con su registro cumple ese requisito.',
    },
    caso: {
      titulo: 'Una cadena de panaderías con rotación alta',
      texto: 'Una panadería con cuatro puntos en Cali contrataba entre seis y diez personas al mes. Los contratos se firmaban en la sede principal y había empleados que trabajaban dos semanas antes de pasar a firmar. Después de la reforma, el administrador pasó a enviar el contrato por WhatsApp el día de la entrevista. Hoy nadie empieza a trabajar sin el contrato firmado, y cada uno está archivado con la cédula del trabajador.',
    },
    faq: [
      { q: '¿Un contrato de trabajo firmado electrónicamente es válido?', a: 'Sí. El Código Sustantivo del Trabajo exige que ciertos contratos consten por escrito, y la Ley 527 de 1999 equipara el documento electrónico al escrito cuando es accesible para su consulta posterior. La firma electrónica confiable cumple el requisito de firma.' },
      { q: '¿Qué contratos deben ser escritos después de la reforma?', a: 'Según la Ley 2466 de 2025: el de término fijo, el de obra o labor —que debe detallar la labor contratada— y el del trabajo doméstico. El indefinido puede ser verbal, pero hacerlo por escrito evita discusiones sobre salario, cargo y jornada.' },
      { q: '¿El trabajador necesita un certificado digital?', a: 'No. Firma con el dedo desde su celular. Si quieres más seguridad, pides selfie y cédula al firmar.' },
      { q: '¿También puedo firmar otrosíes y cartas de terminación?', a: 'Sí. Cualquier documento laboral —otrosí, carta de terminación, certificado, paz y salvo— se firma igual y queda archivado con el contrato.' },
    ],
    fotos: [F.oficina, F.firma, F.escritorio],
    cta: 'Firmar contratos de trabajo en línea',
    ctaTo: '/my-templates',
  },
  {
    slug: 'firma-electronica-para-contratos-de-arriendo',
    titleTag: 'Firma electrónica para contratos de arriendo',
    metaDescription: 'Firma contratos de arrendamiento de vivienda o local en línea, con cédula verificada y validez legal en Colombia. Arrendador, arrendatario y codeudores.',
    h1: 'Firma electrónica para contratos de arriendo',
    grupo: 'firma',
    intro: 'Un contrato de arriendo en Colombia suele tener tres o cuatro firmas: arrendador, arrendatario y uno o dos deudores solidarios, que casi nunca viven en la misma ciudad. Reunirlos en una notaría o mover el papel de casa en casa puede tomar una semana, y en ese tiempo el inmueble sigue vacío. Firmar en línea pone a todos a firmar el mismo día, cada uno desde donde esté.',
    problema: {
      titulo: 'El codeudor que vive en otra ciudad',
      texto: 'El arrendatario está listo, el arrendador también, pero el deudor solidario vive en Tunja y viene a Bogotá en quince días. Mientras tanto se negocia con promesas, se recibe un pago «de buena fe» o se entregan las llaves sin contrato firmado. Cuando algo sale mal en ese intervalo —un daño, un pago que no llega—, no hay documento que diga qué se había acordado. Y si el contrato se firma en papel por partes, nadie garantiza que las tres copias sean idénticas.',
    },
    puntos: [
      { titulo: 'Cada firmante desde su ciudad', texto: 'Arrendador, arrendatario y codeudores reciben su propio enlace. Cada uno firma desde su celular cuando puede, y el contrato queda completo cuando firma el último.' },
      { titulo: 'Cédula y selfie de quien se obliga', texto: 'Para el arrendatario y los codeudores conviene pedir verificación de identidad: selfie y foto de la cédula. Así el contrato queda ligado a las personas que efectivamente asumieron la deuda.' },
      { titulo: 'Un solo documento, idéntico para todos', texto: 'Todos firman el mismo archivo sellado. No hay versiones distintas en cada carpeta ni hojas cambiadas: la huella SHA-256 demuestra que el texto es el mismo para todos.' },
      { titulo: 'Inventario y acta de entrega en el mismo lugar', texto: 'El inventario del inmueble y el acta de entrega se firman igual, incluso en persona con un código QR al recibir las llaves, y quedan archivados junto al contrato.' },
    ],
    ley: {
      titulo: 'El arriendo no exige papel ni notaría',
      texto: 'La Ley 820 de 2003, que regula el arrendamiento de vivienda urbana, permite que el contrato se celebre de forma verbal o escrita (artículo 3) y no exige autenticación ante notario. El Código de Comercio tampoco la exige para el arriendo de locales. Cuando se hace por escrito, la Ley 527 de 1999 equipara el documento electrónico al de papel y la firma electrónica confiable a la manuscrita. Lo que sí conviene es la prueba de identidad de quien firma, sobre todo de los deudores solidarios, porque es contra ellos que se dirige el cobro si el arrendatario no paga.',
    },
    caso: {
      titulo: 'Un apartamento arrendado en un día',
      texto: 'Un arrendador en Manizales tenía un apartamento listo y un interesado con dos codeudores: uno en Pereira y otro trabajando en Panamá. Antes habría esperado dos semanas a que el segundo codeudor enviara el documento autenticado desde el consulado. Envió el contrato por WhatsApp a los cuatro con verificación de cédula; el codeudor en Panamá firmó en la noche desde su celular y el arrendatario recibió las llaves al día siguiente.',
    },
    faq: [
      { q: '¿Un contrato de arriendo firmado en línea es válido en Colombia?', a: 'Sí. La Ley 820 de 2003 no exige una forma especial y la Ley 527 de 1999 le da a la firma electrónica confiable el mismo valor que a la manuscrita. Lo importante es poder demostrar quién firmó y que el contrato no cambió.' },
      { q: '¿Hay que autenticar el contrato en notaría?', a: 'No es requisito legal. Algunos arrendadores lo hacían para tener prueba de la firma; la verificación de identidad con cédula y el registro de auditoría cumplen ese mismo propósito.' },
      { q: '¿Los codeudores pueden firmar desde otro país?', a: 'Sí. Firman desde su celular con su propio enlace, y si pides verificación de identidad, muestran su cédula colombiana o su pasaporte.' },
      { q: '¿Sirve para arriendo de locales comerciales?', a: 'Sí. El contrato de local se rige por el Código de Comercio, que tampoco exige notaría, y se firma igual que el de vivienda.' },
    ],
    fotos: [F.firma, F.mujer, F.oficina],
    cta: 'Firmar mi contrato de arriendo en línea',
    ctaTo: '/my-templates',
  },
  {
    slug: 'convertir-word-en-plantilla',
    titleTag: 'Convertir un Word en plantilla para llenar',
    metaDescription: 'Sube tu contrato en Word tal como lo usas: encontramos los espacios en blanco y lo convertimos en una plantilla que llenas y envías a firmar en minutos.',
    h1: 'Convertir un Word en plantilla para llenar',
    grupo: 'firma',
    intro: 'Todo negocio tiene su contrato en Word: el que hizo el abogado hace años, el que se ha ido corrigiendo con cada cliente. Cada vez que se usa, alguien abre el archivo, busca dónde cambiar el nombre, la cédula y la fecha, se le pasa uno y guarda encima del original. Convertirlo en plantilla significa llenar solo los datos que cambian y no volver a tocar el texto.',
    problema: {
      titulo: 'El contrato con los datos del cliente anterior',
      texto: 'El error más común con un modelo en Word es enviar un contrato con un dato del cliente anterior: la cédula de otra persona en la segunda página, un valor viejo en una cláusula que nadie revisó. Pasa porque los datos están repartidos por todo el documento y se cambian a mano. El otro problema es que, después de muchas copias, ya nadie sabe cuál es la versión buena del modelo. Una plantilla separa lo que nunca cambia —las cláusulas— de lo que cambia cada vez —los datos—.',
    },
    puntos: [
      { titulo: 'No tienes que preparar el Word', texto: 'Lo subes tal como lo usas. La app encuentra sola los espacios para llenar: líneas como ______, textos entre corchetes como [Nombre del cliente], XXXX, campos entre <<>> y el texto resaltado en amarillo. Cada uno se vuelve un campo con su nombre.' },
      { titulo: 'Si falta un dato, lo marcas', texto: 'Si el modelo tiene un nombre o una fecha escrita en lugar de un espacio, la seleccionas con el mouse y la conviertes en campo. O abres el documento completo y arrastras cada campo al lugar exacto donde va.' },
      { titulo: 'Llenas y ves el documento a la vez', texto: 'Al usar la plantilla llenas un formulario corto. Si quieres, ves el documento al lado y cada dato aparece en su lugar mientras lo escribes; los que faltan se marcan en amarillo.' },
      { titulo: 'Lo envías a firmar o lo descargas', texto: 'Con los datos llenos, envías el documento a firmar por WhatsApp, correo o QR, o lo descargas en PDF. También puedes compartir un enlace para que el propio cliente llene sus datos y firme.' },
    ],
    ley: {
      titulo: 'La plantilla no cambia la validez del contrato',
      texto: 'Un contrato no vale más o menos por haber salido de una plantilla: vale por lo que dice y por quién lo firma. Lo que la plantilla sí asegura es que el texto aprobado no cambie entre un cliente y otro, que es justo lo que protege el artículo 8 de la Ley 527 de 1999 al exigir que la información se mantenga íntegra. Y al firmar electrónicamente, el documento final queda sellado con una huella que demuestra que el contenido es el mismo que vieron las dos partes. Si tu modelo lo redactó un abogado, la plantilla conserva cada palabra de lo que él escribió.',
    },
    caso: {
      titulo: 'Una academia que llenaba 30 contratos a mano',
      texto: 'Un centro de idiomas en Barranquilla tenía su contrato de matrícula en Word con 18 datos por llenar: nombre del estudiante, del acudiente, cédulas, curso, horario, valor y fechas. La secretaria tardaba diez minutos por contrato y cada semestre había errores de cédulas. Subieron el Word, la app detectó 16 de los 18 campos y marcaron los otros dos con el mouse. Hoy cada contrato se llena en dos minutos y se envía a firmar al acudiente por WhatsApp.',
    },
    faq: [
      { q: '¿Tengo que escribir {{llaves}} en mi Word?', a: 'No. La app detecta los espacios que la gente usa de verdad: líneas, corchetes, XXXX y resaltado amarillo. Las llaves también funcionan, pero no son necesarias.' },
      { q: '¿Se pierde el formato de mi documento?', a: 'No. La plantilla conserva el Word original con sus fuentes, negritas, tablas y márgenes; solo se reemplazan los datos.' },
      { q: '¿Puedo traer el Word desde Google Drive?', a: 'Sí. Puedes elegir el archivo desde tu Google Drive; si es un Google Docs, se convierte a Word automáticamente.' },
      { q: '¿Y si solo tengo el contrato en PDF o en foto?', a: 'También sirve. Con un PDF o una foto, marcas con un clic dónde va cada dato sobre el documento.' },
    ],
    fotos: [F.escritorio, F.tech, F.revisar],
    cta: 'Convertir mi Word en plantilla',
    ctaTo: '/my-templates',
  },
  {
    slug: 'firma-con-reconocimiento-facial',
    titleTag: 'Firma electrónica con reconocimiento facial',
    metaDescription: 'Pide que quien firma confirme con Face ID, huella o selfie con cédula. Firma electrónica con identidad verificada, válida en Colombia (Ley 527 de 1999).',
    h1: 'Firma electrónica con reconocimiento facial',
    grupo: 'firma',
    intro: 'Una firma electrónica vale tanto como la prueba de quién la hizo. Para una autorización sencilla basta un nombre y un trazo; para un pagaré, un contrato de arriendo o la venta de un vehículo, conviene saber con certeza que firmó la persona correcta. El reconocimiento facial o la huella del propio celular, y la selfie con la cédula, son las formas más simples de lograrlo sin pedirle a nadie que vaya a una notaría.',
    problema: {
      titulo: '«Esa no es mi firma» es la defensa más fácil',
      texto: 'Cuando un documento importante se discute, lo primero que se ataca es la autoría: que la firma no la hizo esa persona, que alguien más usó su correo o su celular. Con una firma dibujada sin más registro, esa defensa es fácil de sostener. La verificación de identidad cambia la conversación: ya no se discute quién firmó, porque hay una cara, una cédula y un dispositivo asociados a la firma.',
    },
    puntos: [
      { titulo: 'Face ID o huella del propio celular', texto: 'Quien firma confirma con el reconocimiento facial o la huella de su teléfono, como cuando desbloquea el celular o paga en una app del banco. La confirmación queda registrada junto a la firma.' },
      { titulo: 'Selfie con la cédula', texto: 'Puedes pedir una selfie y una foto de la cédula por ambos lados. Las imágenes quedan en una página de verificación de identidad dentro del PDF firmado.' },
      { titulo: 'Tú decides qué tan estricto ser', texto: 'Para cada envío eliges el nivel: solo firma, firma con selfie y cédula, o firma con confirmación biométrica. Un pagaré y una autorización de fotos no necesitan lo mismo.' },
      { titulo: 'Registro completo en el certificado', texto: 'El certificado al final del PDF muestra quién firmó, cuándo, desde qué dispositivo e IP, qué verificaciones se hicieron y la huella SHA-256 del documento.' },
    ],
    ley: {
      titulo: 'Identidad y confiabilidad en la ley colombiana',
      texto: 'El artículo 7 de la Ley 527 de 1999 exige que el método de firma identifique al firmante y sea confiable y apropiado para el propósito del documento. El Decreto 2364 de 2012, compilado en el Decreto 1074 de 2015, añade que la firma es confiable si los datos de creación corresponden exclusivamente al firmante. Verificar la identidad con biometría o con la cédula es la forma de demostrar ese «exclusivamente». Además, las fotos de la cédula y la selfie son datos personales: la Ley 1581 de 2012 exige informar para qué se usan y obtener la autorización previa de su titular, así que conviene dejar esa autorización por escrito en el mismo documento.',
    },
    caso: {
      titulo: 'Un préstamo entre conocidos que sí se pudo cobrar',
      texto: 'Un comerciante en Cúcuta prestó $12 millones a un proveedor y le hizo firmar un pagaré electrónico con selfie, cédula y confirmación biométrica desde el celular del proveedor. Cuando el pago se atrasó y el proveedor dijo que «ese documento lo había firmado otra persona», el certificado de firma mostraba su cara, su cédula y la confirmación con su propio teléfono. La discusión terminó en un acuerdo de pago en lugar de un pleito.',
    },
    faq: [
      { q: '¿El reconocimiento facial guarda mi cara?', a: 'La confirmación con Face ID o huella la hace tu propio celular; la app recibe solo la confirmación de que fuiste tú, no la imagen de tu cara ni tu huella. Si te piden selfie con cédula, esas fotos sí quedan en el documento firmado, con tu autorización.' },
      { q: '¿Funciona en cualquier celular?', a: 'La confirmación biométrica funciona en celulares con Face ID, Touch ID o lector de huella compatibles con el navegador. Si el teléfono no lo tiene, se usa la selfie con cédula.' },
      { q: '¿Es lo mismo que una firma digital certificada?', a: 'No. La firma digital certificada usa un certificado emitido por una entidad de certificación. La firma electrónica con verificación biométrica es otro método confiable según la Ley 527 de 1999, suficiente para la gran mayoría de contratos entre particulares.' },
      { q: '¿Cuándo vale la pena pedir verificación de identidad?', a: 'Cuando el documento crea una deuda o una obligación importante: pagarés, contratos de arriendo con codeudores, compraventas de vehículos o préstamos. Para autorizaciones simples basta la firma.' },
    ],
    fotos: [F.tech, F.movil, F.firma],
    cta: 'Firmar con identidad verificada',
    ctaTo: '/firma-electronica',
  },
];

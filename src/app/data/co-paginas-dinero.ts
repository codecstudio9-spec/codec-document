/**
 * Colombia — dinero, vehículos y trámites: pagaré, letra de cambio,
 * compraventa de vehículo, mandato, poder especial y autorización de
 * tratamiento de datos. Fuentes en co-intent-seo-content.ts.
 *
 * Sobre los títulos valores electrónicos: los juzgados colombianos no tienen
 * un criterio único sobre su mérito ejecutivo. Estas páginas lo dicen tal
 * cual en vez de prometer un cobro ejecutivo seguro.
 */
import type { PaginaCO } from './co-intent-seo-content';
import { F } from './seo-fotos';

export const PAGINAS_CO_DINERO: PaginaCO[] = [
  {
    slug: 'pagare-con-carta-de-instrucciones',
    titleTag: 'Pagaré con carta de instrucciones: requisitos',
    metaDescription: 'Requisitos del pagaré y de la carta de instrucciones en Colombia (arts. 621, 622 y 709 del Código de Comercio) y qué saber antes de firmarlo en línea.',
    h1: 'Pagaré con carta de instrucciones',
    grupo: 'dinero',
    intro: 'El pagaré es el título valor más usado en Colombia para respaldar una deuda: un préstamo entre personas, la venta de un bien a plazos, un crédito de un almacén. Cuando se firma con espacios en blanco —el valor final o la fecha de vencimiento—, debe ir con una carta de instrucciones que diga cómo se llenarán. Un pagaré bien hecho se puede cobrar; uno mal hecho es solo una hoja con una firma.',
    problema: {
      titulo: 'El pagaré en blanco sin instrucciones',
      texto: 'Es común que el acreedor pida firmar un pagaré «en blanco» para llenarlo si hay incumplimiento. Sin carta de instrucciones, o con unas instrucciones vagas, el deudor puede alegar que el título se llenó de forma distinta a lo acordado, y esa defensa puede tumbar el cobro. Y al revés: un deudor que firma sin leer las instrucciones puede encontrarse con intereses o valores que no esperaba.',
    },
    puntos: [
      { titulo: 'Los requisitos de forma', texto: 'La promesa incondicional de pagar una suma determinada, el nombre de a quién se paga, la forma de vencimiento, si es a la orden o al portador, y la firma de quien lo crea.' },
      { titulo: 'Instrucciones claras para los espacios en blanco', texto: 'Qué espacios se llenan, con qué valor —capital, intereses, gastos—, en qué fecha y en qué casos se puede llenar el título.' },
      { titulo: 'Identidad del deudor verificada', texto: 'Para un pagaré conviene la verificación más fuerte: selfie, cédula y confirmación biométrica desde el celular de quien firma.' },
      { titulo: 'Firmado y custodiado', texto: 'El pagaré y su carta de instrucciones quedan firmados con certificado de integridad y archivados juntos, con fecha cierta.' },
    ],
    ley: {
      titulo: 'Lo que dice el Código de Comercio y lo que aún se discute',
      texto: 'El artículo 621 del Código de Comercio exige que todo título valor contenga la mención del derecho que incorpora y la firma de quien lo crea; el artículo 709 añade los requisitos propios del pagaré: la promesa incondicional de pagar una suma determinada, el nombre de la persona a quien debe hacerse el pago, la indicación de ser pagadero a la orden o al portador y la forma de vencimiento. El artículo 622 permite llenar los espacios en blanco conforme a las instrucciones del suscriptor. La Ley 527 de 1999 admite que los títulos valores se creen como mensajes de datos, pero los juzgados no tienen un criterio único sobre el mérito ejecutivo del pagaré electrónico: varios exigen que se demuestren la identidad del firmante, la integridad y la disponibilidad del documento. Por eso, para un pagaré que pueda terminar en un cobro judicial, conviene la verificación de identidad más fuerte y, para montos altos, asesoría jurídica o la custodia en un depósito centralizado de valores.',
    },
    caso: {
      titulo: 'Un préstamo entre socios',
      texto: 'Dos socios de un taller en Cúcuta acordaron un préstamo de $15 millones con pagaré y carta de instrucciones. Lo firmaron en línea con selfie, cédula y confirmación biométrica, y el acreedor guardó el PDF con su certificado de firma. Cuando hubo un atraso, el deudor no discutió la firma ni el valor: el documento mostraba su identidad y que el texto no había cambiado. Acordaron un plan de pagos sin necesidad de demanda.',
    },
    checklist: {
      titulo: 'Qué debe tener un pagaré con carta de instrucciones',
      items: [
        'La palabra «pagaré» y la promesa incondicional de pagar una suma determinada.',
        'Nombre de la persona a quien debe hacerse el pago y si es a la orden o al portador.',
        'Forma y fecha de vencimiento, y la tasa de interés si se pacta.',
        'Lugar de pago y firma del deudor (y de codeudores, si hay).',
        'Carta de instrucciones: qué espacios se llenan, cómo se calculan los valores y en qué casos.',
        'Verificación de identidad de quien firma.',
      ],
    },
    faq: [
      { q: '¿Un pagaré firmado electrónicamente es válido?', a: 'La Ley 527 de 1999 permite crear títulos valores como mensajes de datos. Su cobro ejecutivo, sin embargo, depende de que se pruebe la identidad del firmante y la integridad del documento, y los juzgados no tienen un criterio único. Conviene la verificación de identidad más fuerte y asesoría para montos altos.' },
      { q: '¿Para qué sirve la carta de instrucciones?', a: 'Para decir cómo se llenarán los espacios en blanco del pagaré. El artículo 622 del Código de Comercio exige que se llenen conforme a esas instrucciones.' },
      { q: '¿Un pagaré necesita notaría?', a: 'No. El pagaré es un documento privado; su fuerza viene de los requisitos del Código de Comercio y de la prueba de la firma.' },
      { q: '¿Qué diferencia hay entre un pagaré y una letra de cambio?', a: 'En el pagaré el deudor promete pagar; en la letra de cambio el girador ordena a otra persona que pague. Ambos son títulos valores con requisitos propios.' },
    ],
    fotos: [F.escritorio, F.firma, F.revisar],
    cta: 'Crear un pagaré con instrucciones',
    ctaTo: '/my-templates',
  },
  {
    slug: 'letra-de-cambio',
    titleTag: 'Letra de cambio: cómo se llena y requisitos',
    metaDescription: 'Requisitos de la letra de cambio en Colombia (art. 671 del Código de Comercio), cómo se llena y cuándo conviene más un pagaré o un contrato de préstamo.',
    h1: 'Letra de cambio',
    grupo: 'dinero',
    intro: 'La letra de cambio es el título valor de los préstamos entre conocidos en Colombia: la que se compra en la papelería, se llena a mano y se guarda en un cajón. Es útil y tiene fuerza legal, pero se llena mal con mucha frecuencia, y una letra con un requisito faltante puede no servir para cobrar. Saber cómo se llena es la diferencia entre un respaldo real y un papel.',
    problema: {
      titulo: 'La letra llenada a medias',
      texto: 'Una letra sin fecha de vencimiento, con el nombre del deudor mal escrito o sin la firma de quien la gira, es más común de lo que parece. También es común confundir los papeles: quién es el girador, quién el girado y quién el beneficiario. Y como se llena a mano, después aparecen enmendaduras que el deudor puede discutir.',
    },
    puntos: [
      { titulo: 'Las tres figuras de la letra', texto: 'El girador ordena el pago, el girado es quien debe pagar y el beneficiario es quien recibe. En los préstamos entre particulares, a menudo el acreedor es girador y beneficiario a la vez.' },
      { titulo: 'La orden de pagar una suma determinada', texto: 'Un valor exacto, en números y en letras, sin condiciones.' },
      { titulo: 'La forma de vencimiento', texto: 'A la vista, a un día cierto, a un plazo desde la fecha o desde la vista. Sin vencimiento claro, el cobro se complica.' },
      { titulo: 'Cuándo conviene un pagaré', texto: 'Si el deudor es quien promete pagar directamente, un pagaré con carta de instrucciones suele ser más sencillo y claro que una letra.' },
    ],
    ley: {
      titulo: 'El artículo 671 del Código de Comercio',
      texto: 'Además de los requisitos comunes del artículo 621 —la mención del derecho que se incorpora y la firma de quien lo crea—, el artículo 671 del Código de Comercio exige que la letra de cambio contenga la orden incondicional de pagar una suma determinada de dinero, el nombre del girado, la forma del vencimiento y la indicación de ser pagadera a la orden o al portador. Como con el pagaré, la Ley 527 de 1999 admite títulos valores electrónicos, pero su mérito ejecutivo depende de que se prueben la identidad del firmante y la integridad del documento, y la jurisprudencia aún no es uniforme.',
    },
    caso: {
      titulo: 'Una letra sin fecha de vencimiento',
      texto: 'Un comerciante en Neiva prestó dinero a un cliente con una letra de cambio de papelería, pero dejó en blanco la forma de vencimiento. Cuando intentó cobrar, la discusión sobre desde cuándo era exigible retrasó el proceso meses. Para sus siguientes préstamos usa un pagaré con carta de instrucciones, firmado en línea con verificación de identidad.',
    },
    checklist: {
      titulo: "Requisitos de una letra de cambio",
      items: [
        "La orden incondicional de pagar una suma determinada de dinero.",
        "El nombre del girado, quien debe pagar.",
        "La forma de vencimiento.",
        "La indicación de ser pagadera a la orden o al portador.",
        "La firma del girador y, para obligarse, la aceptación del girado.",
      ],
    },
    faq: [
      { q: '¿Cómo se llena una letra de cambio?', a: 'Con el lugar y fecha de creación, el valor en números y letras, el nombre del girado (quien paga), el beneficiario, la forma de vencimiento, si es a la orden o al portador, y la firma del girador. El girado firma como aceptante.' },
      { q: '¿Una letra de cambio vence?', a: 'La acción cambiaria para cobrarla prescribe en tres años desde el vencimiento, según el artículo 789 del Código de Comercio.' },
      { q: '¿Es mejor una letra o un pagaré?', a: 'Para un préstamo en el que el deudor promete pagar directamente, el pagaré con carta de instrucciones suele ser más claro.' },
      { q: '¿Se puede hacer una letra de cambio electrónica?', a: 'La ley lo admite, pero su cobro ejecutivo depende de la prueba de identidad e integridad. Para préstamos entre particulares, conviene la verificación de identidad más fuerte.' },
      { q: "¿Una letra de cambio necesita fiador?", a: "No es obligatorio, pero puede incluirse un avalista que garantice el pago firmando el título." },
    ],
    fotos: [F.revisar, F.escritorio, F.hombre],
    cta: 'Crear un documento de préstamo',
    ctaTo: '/my-templates',
  },
  {
    slug: 'contrato-de-compraventa-de-vehiculo',
    titleTag: 'Contrato de compraventa de vehículo 2026',
    metaDescription: 'Qué incluir en la compraventa de un carro o moto en Colombia y por qué el traspaso en el RUNT es urgente desde 2026. Firma el contrato en línea.',
    h1: 'Contrato de compraventa de vehículo',
    grupo: 'dinero',
    intro: 'Vender un carro o una moto entre particulares en Colombia tiene dos momentos: el contrato de compraventa, en el que se acuerda la venta y se entrega el vehículo, y el traspaso ante el organismo de tránsito, que cambia el propietario en el RUNT. El error más caro es creer que con el primero basta: mientras no se haga el traspaso, el vendedor sigue siendo el responsable ante la ley.',
    problema: {
      titulo: 'Las fotomultas que le llegan al vendedor',
      texto: 'El vendedor entrega el carro, recibe el pago y firma una «carta de venta». Meses después empiezan a llegarle fotomultas, el cobro del impuesto vehicular y hasta citaciones por un accidente: el comprador nunca hizo el traspaso. Desde 2026 tampoco existe el traspaso a persona indeterminada como salida, así que el contrato de compraventa y el traspaso oportuno son la única protección real.',
    },
    puntos: [
      { titulo: 'El vehículo bien identificado', texto: 'Placa, marca, línea, modelo, color, número de motor, número de chasis o VIN, y el número de la licencia de tránsito.' },
      { titulo: 'Precio, pago y entrega', texto: 'Cuánto se paga, cómo y cuándo, y la fecha y hora exacta de la entrega: desde ese momento las responsabilidades del vehículo pasan al comprador.' },
      { titulo: 'Compromiso de traspaso con fecha', texto: 'El contrato debe fijar quién hace el traspaso, quién paga los gastos y el plazo para radicarlo ante el organismo de tránsito.' },
      { titulo: 'Firma con cédula verificada', texto: 'Comprador y vendedor firman en línea con selfie y cédula. El contrato con fecha y hora cierta es la prueba de desde cuándo el vehículo dejó de estar a cargo del vendedor.' },
    ],
    ley: {
      titulo: 'Compraventa y traspaso',
      texto: 'La compraventa es un contrato consensual regulado por el Código Civil (artículo 1849 y siguientes) y puede celebrarse por escrito y firmarse electrónicamente según la Ley 527 de 1999. Pero la propiedad de un vehículo se registra en el Registro Nacional Automotor: la Concesión RUNT ha indicado que la inscripción del traspaso ante el organismo de tránsito debe hacerse dentro de los sesenta días hábiles siguientes a la adquisición. Además, desde febrero de 2026 el Ministerio de Transporte eliminó el traspaso a persona indeterminada, de modo que el vendedor ya no puede liberarse de la responsabilidad sin identificar al comprador. Verifica los requisitos vigentes con el organismo de tránsito de tu ciudad.',
    },
    caso: {
      titulo: 'Una moto vendida en un parqueadero',
      texto: 'Un joven en Montería vendió su moto a un conocido y solo se dieron la mano. Tres meses después le llegaron dos fotomultas de otra ciudad y no tenía cómo demostrar la fecha de la venta. Para su siguiente venta hizo el contrato en el celular, con la placa, el número de motor y la hora de entrega, lo firmaron los dos con cédula, y el contrato fijó que el traspaso se radicaría esa misma semana.',
    },
    checklist: {
      titulo: 'Qué debe incluir la compraventa de un vehículo',
      items: [
        'Nombre, cédula, dirección y teléfono de vendedor y comprador.',
        'Placa, marca, línea, modelo, color, número de motor y de chasis o VIN.',
        'Precio, forma de pago y constancia de recibo.',
        'Fecha y hora exacta de la entrega del vehículo.',
        'Estado del SOAT, la revisión técnico-mecánica, impuestos y multas al momento de la venta.',
        'Quién hace el traspaso, quién paga los gastos y el plazo para radicarlo.',
        'Firma de las dos partes.',
      ],
    },
    faq: [
      { q: '¿Basta con el contrato de compraventa para vender un carro?', a: 'No. El contrato prueba la venta entre las partes, pero el propietario ante la ley es quien figura en el RUNT. El traspaso ante el organismo de tránsito es indispensable.' },
      { q: '¿Cuánto tiempo hay para hacer el traspaso?', a: 'La Concesión RUNT ha indicado un plazo de sesenta días hábiles desde la adquisición. Confirma los requisitos con el organismo de tránsito de tu ciudad.' },
      { q: '¿Todavía existe el traspaso a persona indeterminada?', a: 'No. Desde febrero de 2026 el Ministerio de Transporte eliminó esa figura; el traspaso debe hacerse a un comprador identificado.' },
      { q: '¿Puedo firmar la compraventa en línea?', a: 'Sí. La Ley 527 de 1999 da plena validez a la firma electrónica, y la fecha y hora registradas sirven como prueba de cuándo se entregó el vehículo.' },
    ],
    fotos: [F.hombre, F.firma, F.movil],
    cta: 'Crear mi contrato de compraventa de vehículo',
    ctaTo: '/my-templates',
  },
  {
    slug: 'contrato-de-mandato',
    titleTag: 'Contrato de mandato: qué es y cómo hacerlo',
    metaDescription: 'El mandato es el encargo de gestionar un negocio por cuenta de otro (art. 2142 del Código Civil). Usos comunes, qué incluir y cómo firmarlo en línea.',
    h1: 'Contrato de mandato',
    grupo: 'tramites',
    intro: 'El contrato de mandato es el que celebras cuando le encargas a otra persona que haga algo por ti: un tramitador que hace el traspaso de tu vehículo, un administrador que gestiona tus arriendos, un amigo que vende algo en tu nombre. Es un contrato cotidiano y, precisamente por eso, muchas veces se hace sin papel, hasta que el encargado hace algo que no se le pidió.',
    problema: {
      titulo: 'El encargo sin límites',
      texto: 'Le pides a alguien que venda tu carro «por lo que más pueda» y lo vende por la mitad. Le das a un tramitador tus documentos para un traspaso y no sabes en qué quedó. Sin un mandato escrito que diga qué puede hacer el mandatario, con qué límites, por cuánto tiempo y si cobra, la discusión es sobre qué se había autorizado, y quien hizo el encargo suele llevar la peor parte.',
    },
    puntos: [
      { titulo: 'El encargo concreto', texto: 'Qué gestión exactamente: vender un bien, hacer un trámite, administrar un inmueble. Un mandato preciso protege a las dos partes.' },
      { titulo: 'Los límites del mandatario', texto: 'Precio mínimo, plazos, gastos autorizados, qué puede firmar y qué no. Lo que no está autorizado no obliga al mandante.' },
      { titulo: 'Remuneración y rendición de cuentas', texto: 'Si el mandatario cobra, cuánto y cuándo, y cómo debe informar lo que hizo y entregar lo que recibió.' },
      { titulo: 'Firmado en línea por las dos partes', texto: 'Mandante y mandatario firman desde su celular, con cédula verificada, antes de que empiece la gestión.' },
    ],
    ley: {
      titulo: 'El mandato en la ley colombiana',
      texto: 'El artículo 2142 del Código Civil define el mandato como el contrato en que una persona confía la gestión de uno o más negocios a otra, que se hace cargo de ellos por cuenta y riesgo de la primera. El mandatario debe ceñirse rigurosamente a los términos del mandato y responde por su gestión. Cuando el encargo es de actos de comercio, aplican los artículos 1262 y siguientes del Código de Comercio. Algunos trámites, como los de tránsito, tienen sus propios formatos y requisitos para actuar mediante apoderado; verifica con la entidad. El mandato puede firmarse electrónicamente con plena validez según la Ley 527 de 1999.',
    },
    caso: {
      titulo: 'Un administrador de arriendos con reglas claras',
      texto: 'Una propietaria que vive en Estados Unidos encargó a un administrador en Armenia la gestión de dos apartamentos. Firmaron un mandato en línea que fija el canon mínimo, los gastos que puede aprobar sin consultarle, su comisión y un informe mensual. Cuando el administrador quiso aceptar un arrendatario con un canon menor, el mandato dejaba claro que necesitaba autorización.',
    },
    checklist: {
      titulo: "Qué debe incluir un contrato de mandato",
      items: [
        "Identificación del mandante y del mandatario.",
        "El encargo concreto y sus límites.",
        "Facultades: qué puede firmar, cobrar o negociar el mandatario.",
        "Remuneración, gastos autorizados y rendición de cuentas.",
        "Duración, forma de revocación y firmas.",
      ],
    },
    faq: [
      { q: '¿Qué diferencia hay entre mandato y poder?', a: 'El mandato es el contrato entre mandante y mandatario. El poder es el documento con el que el mandatario demuestra ante terceros que puede actuar en nombre del mandante.' },
      { q: '¿El mandato puede ser gratuito?', a: 'Sí. Puede ser gratuito o remunerado; si se paga, conviene fijar el valor y la forma de pago.' },
      { q: '¿Se puede revocar un mandato?', a: 'Sí, el mandante puede revocarlo, salvo casos especiales. Conviene comunicar la revocación al mandatario y a los terceros que lo conocían.' },
      { q: '¿Se puede firmar en línea?', a: 'Sí, con plena validez según la Ley 527 de 1999, aunque algunos trámites exigen formatos propios de cada entidad.' },
      { q: "¿El mandatario responde si hace algo que no se le autorizó?", a: "Sí. Lo que exceda los límites del mandato no obliga al mandante frente a terceros, salvo que este lo ratifique, y el mandatario responde por los perjuicios." },
    ],
    fotos: [F.oficina, F.firma, F.mujer],
    cta: 'Crear mi contrato de mandato',
    ctaTo: '/my-templates',
  },
  {
    slug: 'poder-especial',
    titleTag: 'Poder especial: modelo y cómo otorgarlo',
    metaDescription: 'Cómo otorgar un poder especial en Colombia para un trámite o un proceso judicial, y cuándo vale sin firma manuscrita (Ley 2213 de 2022, artículo 5).',
    h1: 'Poder especial',
    grupo: 'tramites',
    intro: 'Un poder especial autoriza a otra persona a actuar en tu nombre para un asunto determinado: reclamar un documento, hacer un trámite, vender un bien o representarte en un proceso judicial. Es especial porque se limita a ese asunto, a diferencia del poder general. Para los poderes judiciales, la ley colombiana simplificó mucho el trámite desde la virtualidad: ya no siempre hace falta ir a una notaría.',
    problema: {
      titulo: 'El poder que no le sirvió al apoderado',
      texto: 'El poder dice «para que me represente en todos mis asuntos» y la entidad lo rechaza porque no es específico. O el poder para un proceso no indica el correo del abogado, y el juzgado lo inadmite. O se autentica en notaría un poder que no lo necesitaba, y se pierden días. La mayoría de los problemas con los poderes vienen de no decir con precisión para qué son y cómo se otorgan.',
    },
    puntos: [
      { titulo: 'El asunto exacto', texto: 'Para qué se otorga el poder: el trámite, el proceso con su radicado, el bien con su matrícula o placa. La especificidad es lo que lo hace útil.' },
      { titulo: 'Las facultades del apoderado', texto: 'Qué puede hacer: recibir, firmar, transigir, conciliar, desistir. Las facultades que no se otorgan expresamente no se entienden dadas.' },
      { titulo: 'Para procesos, el correo del abogado', texto: 'En los poderes judiciales debe indicarse el correo electrónico del apoderado, que coincida con el del Registro Nacional de Abogados.' },
      { titulo: 'Firmado y enviado en línea', texto: 'Firmas el poder desde tu celular y se lo envías al apoderado. Para trámites que exigen autenticación, la entidad te dirá si acepta firma electrónica o requiere notaría.' },
    ],
    ley: {
      titulo: 'Poderes judiciales por mensaje de datos',
      texto: 'El artículo 74 del Código General del Proceso regula los poderes para actuar en procesos. El artículo 5 de la Ley 2213 de 2022, que adoptó de forma permanente el Decreto 806 de 2020, permite que los poderes especiales para cualquier actuación judicial se confieran mediante mensaje de datos, sin firma manuscrita o digital, con la sola antefirma; se presumen auténticos y no requieren presentación personal ni reconocimiento. El poder debe indicar el correo electrónico del apoderado inscrito en el Registro Nacional de Abogados, y los poderes de personas inscritas en el registro mercantil deben remitirse desde el correo inscrito para notificaciones judiciales. Los jueces no aplican todos el mismo estándar de prueba del envío, así que conviene conservar la trazabilidad. Para trámites ante entidades, cada una define si exige autenticación.',
    },
    caso: {
      titulo: 'Un poder desde el exterior sin consulado',
      texto: 'Una colombiana en Madrid necesitaba que un abogado en Bogotá la representara en un proceso de sucesión. Antes habría tenido que ir al consulado a autenticar el poder. Lo firmó electrónicamente con verificación de identidad, indicando el correo del abogado inscrito en el Registro Nacional de Abogados, y se lo envió desde su correo. El juzgado lo admitió.',
    },
    checklist: {
      titulo: 'Qué debe incluir un poder especial',
      items: [
        'Datos completos de quien otorga el poder (poderdante) y del apoderado.',
        'El asunto específico: trámite, proceso con radicado y juzgado, o bien con su identificación.',
        'Las facultades que se otorgan, en especial las de recibir, conciliar, transigir o desistir.',
        'En poderes judiciales, el correo del apoderado inscrito en el Registro Nacional de Abogados.',
        'Fecha y firma del poderdante.',
      ],
    },
    faq: [
      { q: '¿Un poder especial tiene que autenticarse en notaría?', a: 'Para actuaciones judiciales, no: el artículo 5 de la Ley 2213 de 2022 permite conferirlo por mensaje de datos sin presentación personal. Para trámites ante entidades, depende de lo que exija cada una.' },
      { q: '¿Qué diferencia hay entre poder especial y poder general?', a: 'El especial se otorga para un asunto determinado; el general, para la administración de todos los negocios del poderdante, y suele requerir escritura pública.' },
      { q: '¿Puedo otorgar un poder desde el exterior?', a: 'Sí. Para procesos judiciales puedes conferirlo por mensaje de datos según la Ley 2213 de 2022. Para otros trámites, verifica si la entidad exige apostilla o autenticación consular.' },
      { q: '¿Puedo firmar el poder electrónicamente?', a: 'Sí. La Ley 527 de 1999 le da validez a la firma electrónica, y para poderes judiciales la Ley 2213 de 2022 ni siquiera exige firma manuscrita o digital.' },
    ],
    fotos: [F.revisar, F.oficina, F.firma],
    cta: 'Crear y firmar un poder especial',
    ctaTo: '/my-templates',
  },
  {
    slug: 'autorizacion-tratamiento-de-datos-personales',
    titleTag: 'Autorización de tratamiento de datos personales',
    metaDescription: 'Cómo obtener la autorización previa, expresa e informada que exige la Ley 1581 de 2012 y guardar la prueba. Formato y firma en línea para tus clientes.',
    h1: 'Autorización de tratamiento de datos personales',
    grupo: 'tramites',
    intro: 'Cualquier negocio que recoja nombres, cédulas, teléfonos o correos de sus clientes, empleados o estudiantes está tratando datos personales. La ley colombiana exige que, antes de hacerlo, obtenga una autorización previa, expresa e informada de cada titular, y que pueda demostrarla después. No basta con tenerla: hay que poder probar que se obtuvo.',
    problema: {
      titulo: 'La autorización que nadie puede encontrar',
      texto: 'Muchas empresas tienen una casilla en un formulario de papel o una frase al pie de un correo, y cuando un titular reclama o la Superintendencia de Industria y Comercio pide la prueba, no hay forma de mostrar que esa persona en particular autorizó el tratamiento, cuándo y con qué información. La autorización existe en teoría, pero no como prueba.',
    },
    puntos: [
      { titulo: 'Informada: qué, para qué y con qué derechos', texto: 'La autorización debe decir quién es el responsable, qué datos se recogen, para qué finalidades y cuáles son los derechos del titular y cómo ejercerlos.' },
      { titulo: 'Expresa y previa', texto: 'El titular debe aceptar de forma inequívoca y antes de que empiece el tratamiento. Una firma sobre el texto completo es la forma más clara.' },
      { titulo: 'Datos sensibles y de menores', texto: 'Si se recogen datos sensibles —salud, biometría— o de menores, la autorización debe señalarlo y el titular no está obligado a autorizarlos.' },
      { titulo: 'Guardada con fecha y firma', texto: 'Cada autorización queda firmada electrónicamente, con fecha, hora y la versión exacta del texto que el titular aceptó.' },
    ],
    ley: {
      titulo: 'La Ley 1581 de 2012',
      texto: 'El artículo 9 de la Ley 1581 de 2012 exige, para el tratamiento de datos personales, la autorización previa e informada del titular, obtenida por cualquier medio que pueda ser objeto de consulta posterior. El artículo 12 detalla la información que debe darse al titular: el tratamiento y su finalidad, el carácter facultativo de las respuestas sobre datos sensibles o de menores, sus derechos y la identificación del responsable. El Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015, exige que el responsable conserve prueba de la autorización. Un documento firmado electrónicamente con su registro es una forma de cumplir esa carga de prueba.',
    },
    caso: {
      titulo: 'Un gimnasio con 600 afiliados',
      texto: 'Un gimnasio en Santa Marta recogía datos de salud de sus afiliados en una ficha de papel con una frase de autorización. Ante una queja de un afiliado, no pudo mostrar su autorización firmada. Ahora cada afiliado nuevo firma desde su celular la autorización completa, con un apartado específico para los datos de salud, y el gimnasio la tiene archivada con fecha y hora.',
    },
    checklist: {
      titulo: "Qué debe incluir la autorización",
      items: [
        "Identificación y datos de contacto del responsable del tratamiento.",
        "Los datos que se recogen y las finalidades del tratamiento.",
        "Si se tratarán datos sensibles o de menores, y que su suministro es facultativo.",
        "Los derechos del titular y cómo ejercerlos.",
        "Fecha y firma del titular.",
      ],
    },
    faq: [
      { q: '¿La autorización puede ser verbal?', a: 'La ley admite cualquier medio que permita su consulta posterior. Una autorización verbal es difícil de probar; por eso conviene un documento firmado.' },
      { q: '¿Necesito autorización para datos de mis empleados?', a: 'Sí. El tratamiento de datos de empleados también requiere autorización, salvo las excepciones de la ley.' },
      { q: '¿Qué son los datos sensibles?', a: 'Los que afectan la intimidad o pueden generar discriminación: salud, origen étnico, orientación política o sexual, datos biométricos, entre otros. Su tratamiento tiene reglas más estrictas.' },
      { q: '¿Puedo pedir la autorización en línea?', a: 'Sí. Una autorización firmada electrónicamente cumple el requisito de poder consultarse después y deja la prueba que exige la norma.' },
      { q: "¿Cuánto tiempo debo guardar la autorización?", a: "Mientras se traten los datos y el tiempo adicional que exijan las normas aplicables, porque es la prueba de que el tratamiento fue autorizado." },
      { q: "¿Qué pasa si el titular revoca la autorización?", a: "Debes dejar de tratar sus datos para las finalidades revocadas, salvo que exista un deber legal o contractual de conservarlos." },
    ],
    fotos: [F.tech, F.oficina, F.movil],
    cta: 'Crear mi formato de autorización',
    ctaTo: '/my-templates',
  },
];

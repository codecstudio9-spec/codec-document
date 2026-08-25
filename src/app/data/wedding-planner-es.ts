// CONTRATO DE WEDDING PLANNER — versión en español
//
// Está pensado para el caso que más problemas da y del que nadie habla en los
// modelos genéricos: la planner vive en una ciudad y el evento es en otra. Ahí
// las dudas no son legales, son logísticas —¿cuántas veces viene?, ¿quién paga
// los viajes?, ¿quién firma con los proveedores?, ¿cuándo llega?— y son
// exactamente las que rompen la confianza si no están escritas.
//
// De ahí que el contrato dedique cláusulas propias a lo que INCLUYE y a lo que
// NO INCLUYE. Un contrato de servicios que sólo enumera lo incluido deja que
// cada parte imagine cosas distintas sobre el resto, y esa diferencia siempre
// aparece la semana del evento, que es cuando ya no se puede resolver.
//
// Recortado el 2026-08-24 tras una prueba real (una pareja en Colombia
// intentando llenarlo): tenía 37 campos, varios de ellos detalles operativos
// (tamaño del equipo, tiempo de respuesta, tarifa por hora extra) que suman
// fricción sin cambiar si el contrato protege a alguien, más una forma
// duplicada de agregar texto extra (condiciones especiales Y el campo de IA
// para redactar cláusulas hacían lo mismo). Se dejó lo que de verdad hay que
// dejar por escrito. `governing_city` también dejó de asumir un marco de
// "qué corte de EE. UU." — ahora es sólo el nombre de una ciudad, opcional,
// que se lee igual si la pareja está en Miami o en Bogotá.
//
// La versión en inglés vive en wedding-planner-template.ts y debe mantener los
// MISMOS ids de campo y las opciones en el MISMO orden: las etiquetas del
// formulario en español se derivan emparejando ambos archivos por posición
// (ver registrarPareja en field-translations.ts).

import { DocumentTemplate } from '../types/document';

export const weddingPlannerTemplateES: DocumentTemplate = {
  id: 'wedding-planner',
  name: 'Contrato de Wedding Planner',
  description: 'Contrato de planeación y coordinación de bodas y eventos, preparado para el caso en que la planner y el evento están en ciudades distintas. Detalla qué incluye y qué no incluye el servicio, visitas presenciales, manejo de proveedores, pagos, cambios, cancelación y reprogramación. Totalmente editable y firmable digitalmente.',
  category: 'Events & Celebrations',
  price: 9.00,
  fields: [
    // ── Quién presta el servicio ──────────────────────────────────────────
    {
      id: 'planner_name',
      label: 'Nombre de la wedding planner o de la empresa',
      type: 'text',
      required: true,
      placeholder: 'Como debe aparecer en el contrato',
    },
    {
      id: 'planner_id',
      label: 'Cédula o NIT de la planner',
      type: 'text',
      required: true,
    },
    {
      id: 'planner_city',
      label: 'Ciudad desde donde trabaja la planner',
      type: 'text',
      required: true,
      helpText: 'Si es distinta a la del evento, el contrato activa las cláusulas de viajes y visitas.',
    },
    {
      id: 'planner_phone',
      label: 'Teléfono de la planner',
      type: 'tel',
      required: true,
    },
    {
      id: 'planner_email',
      label: 'Correo de la planner',
      type: 'email',
      required: false,
    },

    // ── Quién contrata ────────────────────────────────────────────────────
    {
      id: 'client_name',
      label: 'Tu nombre completo',
      type: 'text',
      required: true,
      placeholder: 'Como aparece en tu documento',
    },
    {
      id: 'client_id',
      label: 'Tu número de documento',
      type: 'text',
      required: true,
    },
    {
      id: 'client_phone',
      label: 'Tu teléfono',
      type: 'tel',
      required: true,
    },
    {
      id: 'client_email',
      label: 'Tu correo',
      type: 'email',
      required: false,
    },
    {
      id: 'client_partner_name',
      label: 'Nombre de tu pareja',
      type: 'text',
      required: false,
      helpText: 'Sólo si se casan los dos y quieres que aparezca en el contrato.',
    },

    // ── El evento ─────────────────────────────────────────────────────────
    {
      id: 'event_type',
      label: 'Tipo de evento',
      type: 'select',
      required: true,
      options: [
        'Boda',
        'Matrimonio civil',
        'Boda simbólica o renovación de votos',
        'Fiesta de quince años',
        'Aniversario',
        'Grado',
        'Cumpleaños',
        'Evento corporativo',
        'Otra celebración',
      ],
    },
    {
      id: 'event_date',
      label: 'Fecha del evento',
      type: 'date',
      required: true,
    },
    {
      id: 'event_time',
      label: 'Hora de inicio',
      type: 'text',
      required: false,
      placeholder: '4:00 p. m.',
    },
    {
      id: 'event_venue',
      label: 'Lugar del evento',
      type: 'text',
      required: true,
      placeholder: 'Nombre del salón, finca u hotel',
    },
    {
      id: 'event_city',
      label: 'Ciudad del evento',
      type: 'text',
      required: true,
    },
    {
      id: 'guest_count',
      label: 'Número aproximado de invitados',
      type: 'number',
      required: false,
      helpText: 'Un aproximado está bien, aunque no sea el número final todavía.',
    },

    // ── Alcance ───────────────────────────────────────────────────────────
    {
      id: 'services_included',
      label: 'Qué incluye el servicio',
      type: 'textarea',
      required: true,
      placeholder: 'Diseño del concepto, búsqueda y selección de proveedores, visitas al lugar, cronograma, coordinación del día del evento…',
      helpText: 'Lo más importante del contrato. Puedes dictarlo con el micrófono y luego pulsar «Mejorar con IA» para ordenarlo.',
    },
    {
      id: 'services_excluded',
      label: 'Qué NO incluye',
      type: 'textarea',
      required: false,
      placeholder: 'Costo de los proveedores, alquiler del lugar, vestuario, luna de miel, trámites civiles o religiosos…',
      helpText: 'Escribirlo evita el noventa por ciento de los malentendidos. Lo que no está aquí ni arriba, no está contratado.',
    },
    {
      id: 'onsite_visits',
      label: 'Visitas presenciales incluidas antes del evento',
      type: 'number',
      required: true,
      placeholder: '2',
      helpText: 'Cuántas veces viaja la planner al lugar del evento antes del día.',
    },
    {
      id: 'arrival_days_before',
      label: 'Días antes del evento en que la planner llega a la ciudad',
      type: 'number',
      required: false,
      placeholder: '2',
    },
    {
      id: 'travel_costs',
      label: 'Gastos de viaje, transporte y alojamiento',
      type: 'select',
      required: true,
      options: [
        'Incluidos en los honorarios',
        'A cargo del cliente, además de los honorarios',
        'Compartidos entre las partes',
      ],
    },
    {
      id: 'vendor_contracting',
      label: 'Quién contrata a los proveedores',
      type: 'select',
      required: true,
      options: [
        'El cliente contrata y paga a cada proveedor; la planner solo coordina',
        'La planner contrata a nombre del cliente, con autorización escrita previa',
        'Mixto: algunos los contrata la planner y otros el cliente',
      ],
    },

    // ── Dinero ────────────────────────────────────────────────────────────
    {
      id: 'currency_code',
      label: 'Moneda',
      type: 'select',
      required: true,
      options: ['COP', 'USD', 'MXN', 'EUR', 'ARS', 'CLP', 'PEN'],
    },
    {
      id: 'total_fee',
      label: 'Honorarios totales de la planner',
      type: 'currency',
      required: true,
      helpText: 'Solo el trabajo de planeación y coordinación, sin el costo de los proveedores.',
    },
    {
      id: 'deposit_amount',
      label: 'Anticipo para reservar la fecha',
      type: 'currency',
      required: true,
    },
    {
      id: 'payment_plan',
      label: 'Forma de pago del saldo',
      type: 'textarea',
      required: true,
      placeholder: 'Un segundo pago del 40% tres meses antes y el saldo quince días antes del evento.',
    },
    {
      id: 'final_payment_days',
      label: 'Días antes del evento en que se paga el saldo',
      type: 'number',
      required: true,
      placeholder: '15',
    },

    // ── Protecciones ──────────────────────────────────────────────────────
    {
      id: 'changes_deadline_days',
      label: 'Días antes del evento en que se cierran los cambios',
      type: 'number',
      required: false,
      placeholder: '30',
      helpText: 'Después de esa fecha ya hay proveedores confirmados y los cambios cuestan dinero.',
    },
    {
      id: 'cancellation_policy',
      label: 'Política de cancelación',
      type: 'select',
      required: true,
      options: [
        'Escalonada: se retiene el 30% si se cancela con más de 90 días, el 60% entre 89 y 30 días, y el 100% con menos de 30 días',
        'El anticipo no se devuelve; lo demás se devuelve si se avisa con más de 30 días',
        'El anticipo no se devuelve en ningún caso y el saldo pagado tampoco',
        'Personalizada (se describe en las cláusulas adicionales)',
      ],
    },
    {
      id: 'portfolio_use',
      label: 'Uso de fotos y video del evento por la planner',
      type: 'select',
      required: true,
      options: [
        'Sí, puede usarlos en su portafolio y redes',
        'Sí, pero sin mencionar los nombres',
        'No autoriza el uso de imágenes',
      ],
    },
    {
      id: 'governing_country',
      label: 'País',
      type: 'select',
      required: true,
      options: ['Estados Unidos', 'Colombia', 'México', 'Chile', 'Perú', 'Argentina', 'Ecuador'],
      helpText: 'Se detecta solo según tu ubicación — cámbialo si no es correcto.',
    },
    {
      id: 'governing_state',
      label: 'Estado de EE. UU. para resolver una disputa',
      type: 'select',
      required: false,
      helpText: 'Solo aparece cuando el país de arriba es Estados Unidos.',
    },
    {
      id: 'governing_city',
      label: 'Ciudad para resolver una disputa (opcional)',
      type: 'text',
      required: false,
      placeholder: 'ej. Bogotá, Miami, Madrid…',
      helpText: 'No es obligatorio. Si lo dejas en blanco, el contrato simplemente nombra el estado/país de arriba.',
    },
    {
      id: 'custom_ai_clauses',
      label: 'Cláusulas adicionales personalizadas',
      type: 'textarea',
      required: false,
      placeholder: 'Dile a la IA qué quieres, por ejemplo: "Agrega una cláusula donde el valor total pueda aumentar si ambas partes lo acuerdan en una sesión de negociación posterior" o "Agrega un pago adicional de un monto fijo en una fecha específica" — y pulsa "Redactar con IA".',
      helpText: 'Cualquier otra cosa que quieras dejar por escrito va aquí — escribe una instrucción y pulsa "Redactar con IA" para que ella escriba la cláusula por ti, o dicta/escribe la cláusula tú mismo. En los dos casos ves el resultado antes de que entre al contrato, y siempre puedes deshacerlo.',
    },
  ],

  template: `CONTRATO DE PLANEACIÓN Y COORDINACIÓN DE EVENTO


Entre los suscritos:

{{planner_name}}, identificado(a) con documento número {{planner_id}}, con domicilio en {{planner_city}}, quien en adelante se denominará LA PLANNER;

y

{{client_name}}, identificado(a) con documento número {{client_id}}{{#if client_partner_name}}, junto con {{client_partner_name}}{{/if}}, quien en adelante se denominará EL CLIENTE;

se celebra el presente contrato, que se regirá por las siguientes cláusulas.


PRIMERA — OBJETO

LA PLANNER se obliga a prestar a EL CLIENTE los servicios profesionales de planeación, asesoría y coordinación del evento descrito en la cláusula segunda, en los términos y con el alcance que este contrato define.

LA PLANNER presta el servicio de forma independiente, con su propio equipo y sus propios medios. Este contrato no crea relación laboral, de subordinación ni de exclusividad entre las partes.


SEGUNDA — EL EVENTO

Tipo de evento: {{event_type}}
Fecha: {{event_date}}{{#if event_time}}
Hora de inicio: {{event_time}}{{/if}}
Lugar: {{event_venue}}
Ciudad: {{event_city}}{{#if guest_count}}
Número aproximado de invitados: {{guest_count}}{{/if}}

La fecha queda reservada para EL CLIENTE únicamente desde el momento en que se paga el anticipo previsto en la cláusula octava. Antes de ese pago, LA PLANNER puede aceptar otro evento para el mismo día.


TERCERA — QUÉ INCLUYE EL SERVICIO

LA PLANNER se obliga a lo siguiente:

{{services_included}}

Además, y en todos los casos:

a) Entregar a EL CLIENTE un plan de trabajo con las fechas en que debe tomarse cada decisión.
b) Presentar opciones de proveedores para cada necesidad del evento, con sus cotizaciones, sin ocultar comisiones ni acuerdos propios con ellos.
c) Elaborar el cronograma del día del evento y compartirlo con EL CLIENTE y con todos los proveedores antes de la fecha.
d) Coordinar el montaje, el desarrollo y el desmonte del evento en el horario pactado.
e) Ser el único punto de contacto con los proveedores el día del evento, de modo que EL CLIENTE no tenga que resolver nada ese día.


CUARTA — QUÉ NO INCLUYE EL SERVICIO

Los honorarios de este contrato remuneran el trabajo de LA PLANNER. No comprenden, salvo pacto escrito distinto:

{{#if services_excluded}}{{services_excluded}}

Y en todo caso tampoco comprenden:{{/if}}
a) El costo de los proveedores, del lugar, de la comida, de las bebidas, de la música, de la decoración, del vestuario ni de ningún otro bien o servicio contratado para el evento.
b) Los trámites civiles, notariales o religiosos del matrimonio, ni los documentos que estos exijan.
c) El transporte, el alojamiento ni la alimentación de los invitados.
d) Cualquier servicio que no esté escrito en la cláusula tercera.

Lo que no aparece en la cláusula tercera no está contratado. Si EL CLIENTE lo solicita después, las partes acordarán por escrito su alcance y su precio antes de ejecutarlo.


QUINTA — COORDINACIÓN A DISTANCIA

Las partes reconocen que LA PLANNER trabaja desde {{planner_city}} y que el evento se realiza en {{event_city}}. Por eso acuerdan expresamente:

a) LA PLANNER realizará {{onsite_visits}} visita(s) presencial(es) al lugar del evento antes de la fecha. Las visitas adicionales que solicite EL CLIENTE se cobrarán aparte, previo acuerdo escrito.{{#if arrival_days_before}}
b) LA PLANNER llegará a {{event_city}} con {{arrival_days_before}} día(s) de anticipación y permanecerá disponible hasta el final del evento.{{/if}}
c) El resto de la planeación se hará por videollamada, teléfono y correo. Las decisiones que se tomen por esos medios tienen el mismo valor que las tomadas en persona, siempre que queden por escrito.
d) Cada parte mantendrá actualizados sus datos de contacto. Las comunicaciones se entienden recibidas cuando se envían a los medios señalados en este contrato.


SEXTA — PROVEEDORES

Modalidad acordada: {{vendor_contracting}}

En cualquier modalidad:

a) EL CLIENTE aprueba por escrito cada proveedor y cada presupuesto antes de que se confirme.
b) LA PLANNER no responde por el incumplimiento, el retraso o la mala calidad de un proveedor contratado por EL CLIENTE. Su obligación es seleccionarlo con diligencia, advertir los riesgos que conozca, y hacer todo lo razonable para resolver el problema durante el evento.
c) Cuando LA PLANNER contrate a nombre de EL CLIENTE, lo hace por cuenta de este y con los recursos que este le entregue. No adelanta dinero propio salvo que lo acepte por escrito.
d) LA PLANNER informará a EL CLIENTE de cualquier comisión, descuento o beneficio que reciba de un proveedor.


SÉPTIMA — GASTOS DE VIAJE

Los gastos de transporte, alojamiento y alimentación de LA PLANNER y de su equipo, necesarios para las visitas y para el evento, quedan así: {{travel_costs}}.

Cuando estén a cargo de EL CLIENTE, LA PLANNER los cotizará por anticipado y los soportará con facturas. EL CLIENTE no está obligado a reembolsar un gasto que no haya aprobado antes.


OCTAVA — HONORARIOS Y FORMA DE PAGO

Honorarios totales: {{currency_code}} {{total_fee}}

Anticipo para reservar la fecha: {{currency_code}} {{deposit_amount}}, pagadero a la firma de este contrato. Este pago se imputa a los honorarios totales.

Saldo: {{payment_plan}}

El último pago deberá estar realizado a más tardar {{final_payment_days}} día(s) antes del evento. LA PLANNER no está obligada a ejecutar el evento si el saldo no ha sido pagado en esa fecha.


NOVENA — CAMBIOS

EL CLIENTE puede solicitar cambios en el diseño, los proveedores o el número de invitados, por escrito.{{#if changes_deadline_days}} Los cambios se reciben hasta {{changes_deadline_days}} día(s) antes del evento; después de esa fecha los proveedores ya están confirmados y sólo se aceptarán los que sean materialmente posibles y cuyo sobrecosto asuma EL CLIENTE.{{/if}}

Todo cambio que aumente el costo del evento o el trabajo de LA PLANNER se acordará por escrito antes de ejecutarse, con su precio.


DÉCIMA — CANCELACIÓN POR EL CLIENTE

Si EL CLIENTE cancela el evento, se aplicará lo siguiente: {{cancellation_policy}}.

Lo anterior se entiende sin perjuicio de las sumas ya pagadas a proveedores, que se rigen por lo pactado con cada uno de ellos y que LA PLANNER no puede devolver.

La cancelación debe comunicarse por escrito. La fecha de esa comunicación es la que determina el porcentaje aplicable.


DÉCIMA PRIMERA — CANCELACIÓN POR LA PLANNER

LA PLANNER sólo puede terminar este contrato antes del evento por causa grave: incumplimiento de pago de EL CLIENTE, imposibilidad médica o de fuerza mayor, o trato irrespetuoso o agresivo hacia ella o su equipo.

Si termina el contrato sin causa, devolverá a EL CLIENTE la totalidad de lo pagado y, además, colaborará entregando toda la información del evento y los contactos de los proveedores para que otra persona pueda continuar.

Si la causa es imposibilidad médica o de fuerza mayor, LA PLANNER hará todo lo posible por conseguir un reemplazo idóneo y devolverá la parte de los honorarios correspondiente al trabajo no ejecutado.


DÉCIMA SEGUNDA — REPROGRAMACIÓN Y FUERZA MAYOR

Si el evento debe aplazarse por un hecho ajeno a las partes —una prohibición de autoridad, un desastre natural, una emergencia sanitaria, la muerte de un familiar cercano— las partes acordarán una nueva fecha y este contrato seguirá vigente para ella, sin penalidad.

Los honorarios ya pagados se abonan a la nueva fecha. Si en la nueva fecha LA PLANNER ya tiene un evento comprometido, devolverá lo pagado descontando el trabajo efectivamente realizado hasta ese momento.

Los valores no recuperables que ya se hayan pagado a proveedores no son responsabilidad de LA PLANNER.


DÉCIMA TERCERA — RESPONSABILIDAD

LA PLANNER responde por la diligencia de su propio trabajo. No responde por hechos de terceros, por el clima, por decisiones que EL CLIENTE haya tomado contra su recomendación escrita, ni por daños que ocurran en el lugar del evento y sean de cargo de este o de sus invitados.

En todo caso, la responsabilidad total de LA PLANNER derivada de este contrato no excederá el valor de los honorarios efectivamente pagados.


DÉCIMA CUARTA — OBLIGACIONES DE EL CLIENTE

a) Pagar en las fechas pactadas.
b) Entregar a tiempo la información que LA PLANNER le solicite: lista de invitados, decisiones de menú, tiempos de la ceremonia y demás.
c) Tomar las decisiones que le corresponden dentro de los plazos del plan de trabajo. Un retraso en decidir puede hacer que un proveedor ya no esté disponible, y esa consecuencia no es imputable a LA PLANNER.
d) Tratar con respeto a LA PLANNER, a su equipo y a los proveedores.


DÉCIMA QUINTA — IMÁGENES DEL EVENTO

Sobre el uso de fotografías y video del evento por parte de LA PLANNER: {{portfolio_use}}.

Esta autorización, cuando se concede, es gratuita, no exclusiva y limitada a mostrar su trabajo profesional. No permite ceder las imágenes a terceros para publicidad ajena, ni usarlas en un contexto que afecte la honra o la intimidad de EL CLIENTE. EL CLIENTE puede revocarla en cualquier momento por escrito, y LA PLANNER retirará las imágenes de los medios que controle.


DÉCIMA SEXTA — DISEÑO Y CONFIDENCIALIDAD

Los conceptos, bocetos, paletas y propuestas creadas por LA PLANNER son suyos hasta que el evento se pague en su totalidad; desde ese momento EL CLIENTE puede usarlos libremente para su propio evento. Ninguna de las partes puede revenderlos como propios a un tercero.

Ambas partes guardarán reserva sobre la información personal, familiar y económica que conozcan por razón de este contrato, incluso después de terminado.

{{#if custom_ai_clauses}}
DÉCIMA SÉPTIMA — CLÁUSULAS ADICIONALES PERSONALIZADAS

{{custom_ai_clauses}}

{{/if}}
CLÁUSULA FINAL — ACUERDO ÍNTEGRO, MODIFICACIONES Y CONTROVERSIAS

Este documento recoge todo lo acordado entre las partes y reemplaza cualquier conversación o cotización anterior. Sólo puede modificarse por escrito firmado por ambas.

Si alguna cláusula resulta inválida, las demás continúan vigentes.

Las partes intentarán resolver de buena fe cualquier diferencia mediante conversación directa y, si no lo logran, acudirán a los jueces competentes de{{#if governing_city}} {{governing_city}},{{/if}}{{#if governing_state}} {{governing_state}},{{/if}} {{governing_country}}, renunciando a cualquier otro fuero.

En señal de aceptación, las partes firman en{{#if governing_city}} {{governing_city}},{{/if}}{{#if governing_state}} {{governing_state}},{{/if}} {{governing_country}}, el {{current_date}}.


LA PLANNER

_______________________________________
{{planner_name}}
Documento {{planner_id}}
{{planner_phone}}{{#if planner_email}}
{{planner_email}}{{/if}}

EL CLIENTE

_______________________________________
{{client_name}}
Documento {{client_id}}
{{client_phone}}{{#if client_email}}
{{client_email}}{{/if}}{{#if client_partner_name}}
_______________________________________
{{client_partner_name}}{{/if}}`,

  // Nota de cierre para AMBAS partes — fuera de `template` a propósito, ver
  // el comentario del campo signerNote en types/document.ts. Reescrita el
  // 2026-08-25: la versión anterior vivía dentro del cuerpo de la plantilla
  // (por eso terminaba donde la heurística de corte de firma del PDF
  // decidiera ponerla, a veces antes de las firmas reales) y estaba escrita
  // sólo desde el punto de vista del cliente ("todo lo que esperas
  // recibir"), lo que suena a consejo para un solo lado de un contrato
  // entre dos. Esta versión se dirige a quien la esté leyendo, planner o
  // cliente por igual.
  signerNote: `NOTA PARA AMBAS PARTES — no forma parte del contrato

Revisen juntos que la cláusula tercera diga de verdad todo lo que la planner debe entregar. Lo que se habló por WhatsApp y no quedó escrito ahí, no está contratado, para ninguna de las dos partes.

Guarden cada aprobación de proveedor y cada cambio por escrito, aunque sea por correo. Eso protege tanto a la planner como al cliente de discusiones de última hora sobre quién autorizó qué.

Este es un modelo general. No reemplaza la asesoría de un abogado en el país de cualquiera de las partes, sobre todo si el evento es en el extranjero o si los valores son altos.`,
};

// PLANTILLA PROFESIONAL DE CONTRATO DE SERVICIOS
// Acuerdo completo para servicios continuos entre proveedor y cliente
// Incluye términos de SLA, cronogramas de pago y compromisos de nivel de servicio

import { DocumentTemplate } from '../types/document';

export const serviceAgreementTemplateES: DocumentTemplate = {
  id: 'service-agreement',
  name: 'Contrato de Servicios',
  description: 'Contrato profesional de servicios para servicios continuos con alcance, entregables, cronograma de pagos y compromisos de nivel de servicio. Ideal para contratos de mantenimiento, servicios de soporte, consultoría y servicios profesionales recurrentes.',
  category: 'Negocios y Contratos',
  price: 9.99,
  fields: [
    // Información del Proveedor de Servicios
    {
      id: 'provider_name',
      label: 'Nombre Legal Completo del Proveedor',
      type: 'text',
      required: true,
      helpText: 'La persona o empresa que PROVEE los servicios'
    },
    {
      id: 'provider_business_name',
      label: 'Nombre Comercial del Proveedor (si es diferente)',
      type: 'text',
      required: false,
      helpText: 'Nombre comercial registrado o nombre de entidad comercial'
    },
    {
      id: 'provider_address',
      label: 'Dirección del Proveedor',
      type: 'textarea',
      required: true
    },
    {
      id: 'provider_email',
      label: 'Correo electrónico del Proveedor',
      type: 'email',
      required: true
    },
    {
      id: 'provider_phone',
      label: 'Teléfono del Proveedor',
      type: 'tel',
      required: true
    },
    {
      id: 'provider_type',
      label: 'Tipo de Proveedor',
      type: 'select',
      options: ['Individual', 'Corporación', 'LLC', 'Sociedad', 'Otra Entidad Comercial'],
      required: true
    },

    // Información del Cliente
    {
      id: 'client_name',
      label: 'Nombre Legal Completo del Cliente',
      type: 'text',
      required: true,
      helpText: 'La persona o empresa que RECIBE los servicios'
    },
    {
      id: 'client_business_name',
      label: 'Nombre Comercial del Cliente (si aplica)',
      type: 'text',
      required: false
    },
    {
      id: 'client_address',
      label: 'Dirección del Cliente',
      type: 'textarea',
      required: true
    },
    {
      id: 'client_email',
      label: 'Correo electrónico del Cliente',
      type: 'email',
      required: true
    },
    {
      id: 'client_phone',
      label: 'Teléfono del Cliente',
      type: 'tel',
      required: true
    },

    // Detalles del Servicio
    {
      id: 'service_type',
      label: 'Tipo de Servicios',
      type: 'select',
      options: [
        'Soporte y Mantenimiento de TI',
        'Hosting y Mantenimiento Web',
        'Servicios de Consultoría',
        'Servicios de Marketing y Publicidad',
        'Contabilidad y Teneduría de Libros',
        'Servicios Legales',
        'Servicios de Limpieza',
        'Servicios de Seguridad',
        'Jardinería y Mantenimiento',
        'Administración de Propiedades',
        'Mantenimiento de Equipos',
        'Software como Servicio (SaaS)',
        'Servicios Gestionados',
        'Servicios Profesionales',
        'Otros Servicios'
      ],
      required: true,
      helpText: 'Categoría general de servicios que se proporcionan'
    },
    {
      id: 'service_description',
      label: 'Descripción Detallada del Servicio',
      type: 'textarea',
      required: true,
      placeholder: 'Describa en detalle los servicios a proporcionar, incluyendo frecuencia, alcance y requisitos específicos.',
      helpText: 'Sea específico sobre qué servicios se proporcionarán y con qué frecuencia'
    },
    {
      id: 'service_location',
      label: 'Ubicación del Servicio',
      type: 'select',
      options: [
        'En Sitio - Ubicación del Cliente',
        'Remoto/Fuera de Sitio',
        'Híbrido (En Sitio y Remoto)',
        'Ubicación del Proveedor',
        'Varias Ubicaciones Según Necesidad'
      ],
      required: true
    },
    {
      id: 'service_hours',
      label: 'Horario de Servicio',
      type: 'textarea',
      required: false,
      placeholder: 'Ejemplo: Lunes-Viernes 9am-5pm, o Disponible 24/7, o Según necesidad',
      helpText: 'Cuándo estarán disponibles o se realizarán los servicios'
    },

    // Plazo y Duración
    {
      id: 'start_date',
      label: 'Fecha de Inicio del Servicio',
      type: 'date',
      required: true
    },
    {
      id: 'term_type',
      label: 'Tipo de Plazo del Contrato',
      type: 'select',
      options: [
        'Mes a Mes',
        'Plazo Fijo - 3 Meses',
        'Plazo Fijo - 6 Meses',
        'Plazo Fijo - 1 Año',
        'Plazo Fijo - 2 Años',
        'Plazo Fijo - 3 Años',
        'Plazo Fijo - Duración Personalizada',
        'Continuo Hasta Terminación'
      ],
      required: true
    },
    {
      id: 'end_date',
      label: 'Fecha de Finalización (si es Plazo Fijo)',
      type: 'date',
      required: false,
      helpText: 'Solo si seleccionó un plazo fijo'
    },
    {
      id: 'auto_renewal',
      label: 'Renovación Automática',
      type: 'select',
      options: [
        'No - El contrato termina en la fecha de finalización',
        'Sí - Se renueva automáticamente por el mismo plazo',
        'Sí - Se renueva automáticamente mes a mes',
        'Sí - Se renueva automáticamente anualmente'
      ],
      required: true,
      helpText: 'Si el contrato se renueva automáticamente'
    },

    // Términos de Pago
    {
      id: 'payment_structure',
      label: 'Estructura de Pago',
      type: 'select',
      options: [
        'Tarifa Mensual Recurrente',
        'Tarifa Trimestral',
        'Tarifa Anual',
        'Por Servicio/Por Incidente',
        'Tarifa por Hora',
        'Anticipo + Excedente por Hora',
        'Precios por Niveles',
        'Estructura de Pago Personalizada'
      ],
      required: true
    },
    {
      id: 'monthly_fee',
      label: 'Tarifa Mensual de Servicio ($) - Si Aplica',
      type: 'currency',
      required: false
    },
    {
      id: 'annual_fee',
      label: 'Tarifa Anual de Servicio ($) - Si Aplica',
      type: 'currency',
      required: false
    },
    {
      id: 'hourly_rate',
      label: 'Tarifa por Hora ($) - Si Aplica',
      type: 'currency',
      required: false
    },
    {
      id: 'payment_schedule',
      label: 'Cronograma/Términos de Pago',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo: Pagadero mensualmente por adelantado el día 1 de cada mes, Neto 15 días',
      helpText: 'Cuándo y cómo se deben realizar los pagos'
    },
    {
      id: 'late_fee',
      label: 'Tarifa por Pago Tardío',
      type: 'select',
      options: [
        'Sin tarifas por mora',
        '1.5% mensual sobre saldo vencido',
        '5% del monto vencido',
        'Tarifa fija de $25',
        'Tarifa fija de $50',
        'Términos personalizados de tarifa por mora'
      ],
      required: true
    },
    {
      id: 'payment_method',
      label: 'Métodos de Pago Aceptados',
      type: 'select',
      options: [
        'Cheque o Transferencia Bancaria',
        'Tarjeta de Crédito',
        'ACH/Débito Directo',
        'PayPal o Pago en Línea',
        'Cualquiera de los Anteriores'
      ],
      required: true
    },

    // Acuerdo de Nivel de Servicio (SLA)
    {
      id: 'sla_included',
      label: '¿Incluir Acuerdo de Nivel de Servicio (SLA)?',
      type: 'select',
      options: ['Sí', 'No'],
      required: true,
      helpText: 'SLA define tiempos de respuesta y garantías de servicio'
    },
    {
      id: 'response_time',
      label: 'Compromiso de Tiempo de Respuesta (si SLA)',
      type: 'text',
      required: false,
      placeholder: 'Ejemplo: 4 horas hábiles para problemas críticos, 24 horas para no críticos',
      helpText: 'Qué tan rápido el proveedor responderá a solicitudes de servicio'
    },
    {
      id: 'uptime_guarantee',
      label: 'Garantía de Tiempo de Actividad/Disponibilidad (si aplica)',
      type: 'text',
      required: false,
      placeholder: 'Ejemplo: 99.9% de tiempo de actividad',
      helpText: 'Para servicios que requieren disponibilidad continua'
    },

    // Entregables e Informes
    {
      id: 'deliverables',
      label: 'Entregables/Informes (si los hay)',
      type: 'textarea',
      required: false,
      placeholder: 'Ejemplo: Informes de servicio mensuales, registros de mantenimiento, informes de analítica, etc.',
      helpText: 'Qué resultados tangibles recibirá el cliente'
    },

    // Propiedad Intelectual
    {
      id: 'ip_ownership',
      label: 'Propiedad del Producto del Trabajo',
      type: 'select',
      options: [
        'El cliente posee todo el producto del trabajo',
        'El proveedor retiene propiedad, el cliente obtiene licencia',
        'Propiedad compartida',
        'No aplica - no se crea producto de trabajo'
      ],
      required: true,
      helpText: 'Quién posee los materiales creados durante la prestación del servicio'
    },

    // Confidencialidad
    {
      id: 'confidentiality',
      label: 'Disposiciones de Confidencialidad',
      type: 'select',
      options: [
        'Sí - Incluir términos de confidencialidad mutua',
        'Sí - Solo confidencialidad del proveedor',
        'No - No es necesario para estos servicios'
      ],
      required: true
    },

    // Garantías y Descargos
    {
      id: 'service_warranty',
      label: 'Garantía de Servicio',
      type: 'select',
      options: [
        'El proveedor garantiza servicios profesionales y de calidad',
        'Servicios proporcionados "tal cual" sin garantías',
        'Garantía limitada - términos específicos a agregar',
        'Garantías solo según lo requerido por ley'
      ],
      required: true
    },

    // Responsabilidad
    {
      id: 'liability_cap',
      label: 'Limitación de Responsabilidad',
      type: 'select',
      options: [
        'Sin limitación de responsabilidad',
        'Limitado a tarifas pagadas en últimos 12 meses',
        'Limitado a tarifas pagadas en últimos 6 meses',
        'Limitado a tarifas pagadas en últimos 3 meses',
        'Limitado a monto específico en dólares',
        'Limitaciones estándar de responsabilidad aplican'
      ],
      required: true
    },
    {
      id: 'liability_amount',
      label: 'Monto Específico de Límite de Responsabilidad ($) - Si Aplica',
      type: 'currency',
      required: false
    },

    // Seguro
    {
      id: 'insurance_required',
      label: 'Requisitos de Seguro',
      type: 'select',
      options: [
        'No se requiere seguro',
        'Seguro de Responsabilidad General requerido',
        'Seguro de Responsabilidad Profesional (E&O) requerido',
        'Ambos Responsabilidad General y Profesional requeridos',
        'Compensación de Trabajadores (si aplica)',
        'Requisitos personalizados de seguro'
      ],
      required: true
    },
    {
      id: 'insurance_amount',
      label: 'Cobertura Mínima de Seguro ($) - Si se Requiere',
      type: 'currency',
      required: false,
      placeholder: '1000000',
      helpText: 'Ejemplo: $1,000,000'
    },

    // Terminación
    {
      id: 'termination_notice',
      label: 'Período de Aviso de Terminación',
      type: 'select',
      options: [
        'Terminación inmediata permitida',
        'Aviso Escrito de 7 Días',
        'Aviso Escrito de 14 Días',
        'Aviso Escrito de 30 Días',
        'Aviso Escrito de 60 Días',
        'Aviso Escrito de 90 Días'
      ],
      required: true
    },
    {
      id: 'early_termination_fee',
      label: 'Tarifa por Terminación Anticipada (si es Plazo Fijo)',
      type: 'select',
      options: [
        'Sin tarifa por terminación anticipada',
        'Saldo restante del contrato adeudado',
        'Una tarifa mensual de servicio',
        'Dos tarifas mensuales de servicio',
        'Tres tarifas mensuales de servicio',
        'Términos personalizados de terminación anticipada'
      ],
      required: false,
      helpText: 'Tarifa si el cliente termina antes del fin del plazo fijo'
    },

    // Gastos
    {
      id: 'expenses',
      label: 'Gastos y Reembolsos',
      type: 'select',
      options: [
        'Sin gastos adicionales - todo incluido en tarifa de servicio',
        'Gastos preaprobados reembolsados a costo',
        'Gastos facturados por separado con margen',
        'Cliente proporciona todos materiales y suministros'
      ],
      required: true
    },

    // Ley Aplicable
    {
      id: 'governing_state',
      label: 'Ley Estatal Aplicable',
      type: 'select',
      options: [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
        'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
      ],
      required: true
    },

    // Términos Adicionales
    {
      id: 'additional_terms',
      label: 'Términos Adicionales/Disposiciones Especiales (Opcional)',
      type: 'textarea',
      required: false,
      placeholder: 'Cualquier condición especial o cláusulas adicionales específicas a este contrato de servicios'
    },
  ],

  template: `CONTRATO DE SERVICIOS

ESTE CONTRATO DE SERVICIOS (el "Contrato") se celebra este día {{current_day}} de {{current_month}} de {{current_year}} (la "Fecha Efectiva"), por y entre:

PROVEEDOR DE SERVICIOS:
{{provider_name}}
{{#if provider_business_name}}nombre comercial {{provider_business_name}}{{/if}}
{{provider_address}}
Correo electrónico: {{provider_email}}
Teléfono: {{provider_phone}}
Tipo: {{provider_type}}
(en adelante denominado "Proveedor" o "Proveedor de Servicios")

y

CLIENTE:
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}
{{client_address}}
Correo electrónico: {{client_email}}
Teléfono: {{client_phone}}
(en adelante denominado "Cliente")

(Cada parte puede ser referida individualmente como una "Parte" y colectivamente como las "Partes".)

CONSIDERANDOS

CONSIDERANDO QUE, el Proveedor se dedica al negocio de proporcionar {{service_type}}; y

CONSIDERANDO QUE, el Cliente desea contratar al Proveedor para proporcionar ciertos servicios; y

CONSIDERANDO QUE, el Proveedor está dispuesto a proporcionar dichos servicios bajo los términos y condiciones establecidos en este Contrato.

AHORA, POR LO TANTO, en consideración de los acuerdos y convenios mutuos contenidos en este documento, y por otra buena y valiosa consideración, cuyo recibo y suficiencia se reconocen por la presente, las Partes acuerdan lo siguiente:

--------------------------------------------------

1. SERVICIOS

1.1. ALCANCE DE LOS SERVICIOS. El Proveedor acuerda proporcionar los siguientes servicios (los "Servicios"):

Tipo de Servicio: {{service_type}}

{{service_description}}

1.2. UBICACIÓN DEL SERVICIO. Los servicios se realizarán: {{service_location}}

{{#if service_hours}}
1.3. HORARIO DE SERVICIO. Los servicios estarán disponibles/se realizarán según el siguiente horario:
{{service_hours}}
{{/if}}

1.4. ESTÁNDAR DE DESEMPEÑO. El Proveedor ejecutará todos los Servicios de manera profesional y competente, conforme a estándares de la industria y mejores prácticas. El Proveedor dedicará recursos adecuados y personal calificado para la ejecución de los Servicios.

1.5. MODIFICACIONES A LOS SERVICIOS. Cualquier modificación al alcance de los Servicios debe ser acordada por escrito por ambas Partes y puede resultar en ajustes a las tarifas.

--------------------------------------------------

2. PLAZO Y TERMINACIÓN

2.1. PLAZO. Este Contrato comenzará el {{start_date}} y continuará de la siguiente manera:
    Tipo de Plazo: {{term_type}}
    {{#if end_date}}Fecha de Finalización: {{end_date}}{{/if}}

2.2. RENOVACIÓN AUTOMÁTICA. {{auto_renewal}}

Si este Contrato se renueva automáticamente, cualquiera de las Partes puede prevenir la renovación proporcionando aviso por escrito de no renovación al menos treinta (30) días antes del final del plazo actual.

2.3. TERMINACIÓN POR CONVENIENCIA. Cualquiera de las Partes puede terminar este Contrato por cualquier razón o sin razón proporcionando el siguiente aviso:
    Período de Aviso: {{termination_notice}}

{{#if early_termination_fee}}
2.4. TARIFA POR TERMINACIÓN ANTICIPADA. Si el Cliente termina este Contrato antes del final de un plazo fijo:
    {{early_termination_fee}}
{{/if}}

2.5. TERMINACIÓN POR CAUSA. Cualquiera de las Partes puede terminar este Contrato inmediatamente mediante aviso por escrito si:
    (a) La otra Parte incumple materialmente este Contrato y no cura dicho incumplimiento dentro de quince (15) días después de recibir aviso por escrito;
    (b) La otra Parte se vuelve insolvente, declara bancarrota o hace una cesión en beneficio de acreedores;
    (c) La otra Parte cesa de conducir negocios en el curso normal.

2.6. EFECTO DE LA TERMINACIÓN. Al terminar o expirar este Contrato:
    (a) El Cliente pagará al Proveedor por todos los Servicios satisfactoriamente ejecutados hasta la fecha de terminación;
    (b) El Proveedor entregará todo producto de trabajo, materiales y propiedad del Cliente al Cliente;
    (c) Todas las obligaciones que por su naturaleza deberían sobrevivir la terminación sobrevivirán, incluyendo obligaciones de pago, confidencialidad, derechos de propiedad intelectual, garantías, indemnización y limitación de responsabilidad;
    (d) Ninguna Parte será responsable ante la otra por daños resultantes de la terminación de acuerdo con los términos de este Contrato, excepto tarifas por terminación anticipada si aplican.

--------------------------------------------------

3. COMPENSACIÓN Y PAGO

3.1. TARIFAS DE SERVICIO. El Cliente pagará al Proveedor de la siguiente manera:

    Estructura de Pago: {{payment_structure}}
    {{#if monthly_fee}}Tarifa Mensual: USD {{monthly_fee}}{{/if}}
    {{#if annual_fee}}Tarifa Anual: USD {{annual_fee}}{{/if}}
    {{#if hourly_rate}}Tarifa por Hora: USD {{hourly_rate}} por hora{{/if}}

3.2. TÉRMINOS DE PAGO. {{payment_schedule}}

3.3. FACTURACIÓN. El Proveedor enviará facturas al Cliente según el cronograma de pago anterior. Las facturas incluirán:
    (a) Número y fecha de factura;
    (b) Descripción de Servicios ejecutados durante el período de facturación;
    (c) Tarifas adeudadas;
    (d) Instrucciones de pago.

3.4. PAGOS TARDÍOS. {{late_fee}}

Si el pago no se recibe cuando es debido, el Proveedor puede, a su opción:
    • Suspender los Servicios hasta que se reciba el pago completo;
    • Cobrar intereses sobre montos vencidos al menor de 1.5% mensual o la tasa máxima permitida por ley;
    • Terminar este Contrato por falta de pago después de proporcionar aviso por escrito y oportunidad de cura.

3.5. MÉTODO DE PAGO. El Cliente puede pagar mediante: {{payment_method}}

3.6. IMPUESTOS. Todas las tarifas son exclusivas de impuestos federales, estatales y locales sobre ventas, uso, consumo u otros impuestos aplicables. El Cliente es responsable de todos dichos impuestos excepto impuestos basados en el ingreso neto del Proveedor.

3.7. AJUSTES DE TARIFAS. El Proveedor puede aumentar las tarifas mediante aviso por escrito de treinta (30) días al Cliente. Si el Cliente no está de acuerdo con el aumento de tarifas, el Cliente puede terminar este Contrato mediante aviso por escrito antes de la fecha efectiva del aumento.

--------------------------------------------------

4. GASTOS Y REEMBOLSOS

4.1. GASTOS. {{expenses}}

{{#if expenses}}
Si los gastos son reembolsables, el Proveedor deberá:
    (a) Obtener aprobación previa por escrito del Cliente para gastos que excedan $500;
    (b) Proporcionar recibos y documentación para todos los gastos reembolsables;
    (c) Enviar informes de gastos con facturas;
    (d) Buscar reembolso solo por gastos razonables y necesarios directamente relacionados con los Servicios.
{{/if}}

--------------------------------------------------

5. ACUERDO DE NIVEL DE SERVICIO (SLA)

SLA Incluido: {{sla_included}}

{{#if response_time}}
5.1. TIEMPO DE RESPUESTA. El Proveedor se compromete a los siguientes tiempos de respuesta:
{{response_time}}

El tiempo de respuesta se mide desde cuando el Cliente envía una solicitud de servicio a través del canal designado hasta cuando el Proveedor reconoce recibo y comienza a trabajar en el problema.
{{/if}}

{{#if uptime_guarantee}}
5.2. TIEMPO DE ACTIVIDAD/DISPONIBILIDAD. El Proveedor se compromete al siguiente estándar de disponibilidad:
{{uptime_guarantee}}

El tiempo de inactividad excluye mantenimiento programado (con aviso previo), eventos de fuerza mayor y problemas causados por sistemas del Cliente o terceros.
{{/if}}

{{#if sla_included}}
5.3. PRIORIDADES DE SERVICIO. Las solicitudes de servicio se priorizarán de la siguiente manera:
    • Crítico: Sistema caído, operaciones comerciales detenidas - Respuesta dentro de [X] horas
    • Alto: Funcionalidad principal afectada - Respuesta dentro de [X] horas
    • Medio: Problema menor, solución alternativa disponible - Respuesta dentro de [X] horas hábiles
    • Bajo: Pregunta general o solicitud de mejora - Respuesta dentro de [X] días hábiles

5.4. CRÉDITOS DE SLA. Si el Proveedor no cumple con compromisos de SLA, el Cliente puede tener derecho a créditos de servicio de la siguiente manera:
    • [Definir estructura de crédito si aplica]
    • Los créditos de servicio son el único remedio del Cliente por violaciones de SLA.
    • Los créditos no aplican a problemas causados por el Cliente, fuerza mayor o terceros.
{{/if}}

--------------------------------------------------

6. ENTREGABLES E INFORMES

{{#if deliverables}}
6.1. ENTREGABLES. El Proveedor proporcionará los siguientes entregables:
{{deliverables}}

6.2. CRONOGRAMA DE ENTREGA. Los entregables se proporcionarán según el cronograma acordado por las Partes.

6.3. REVISIÓN DEL CLIENTE. El Cliente tendrá [X] días hábiles para revisar entregables y proporcionar retroalimentación. El Proveedor hará revisiones razonables basadas en la retroalimentación del Cliente.
{{else}}
6.1. SIN ENTREGABLES ESPECÍFICOS. Este Contrato es para la provisión de servicios continuos y no requiere entregables específicos a menos que se acuerde de otra manera por escrito.
{{/if}}

--------------------------------------------------

7. DERECHOS DE PROPIEDAD INTELECTUAL

7.1. PROPIEDAD DEL PRODUCTO DEL TRABAJO. {{ip_ownership}}

7.2. MATERIALES PREEXISTENTES. Cada Parte retiene todos los derechos a su propiedad intelectual preexistente, materiales, herramientas, plantillas y conocimientos desarrollados antes o fuera del alcance de este Contrato.

7.3. LICENCIA AL PROVEEDOR. El Cliente otorga al Proveedor una licencia no exclusiva para usar las marcas comerciales, logotipos y materiales del Cliente únicamente según sea necesario para ejecutar los Servicios.

7.4. LICENCIA AL CLIENTE. Si el Proveedor retiene propiedad del producto del trabajo, el Proveedor otorga al Cliente una licencia perpetua, no exclusiva, libre de regalías para usar el producto del trabajo para propósitos comerciales del Cliente.

7.5. MATERIALES DE TERCEROS. El Proveedor no incorporará materiales de terceros en el producto del trabajo sin el consentimiento del Cliente, a menos que estén debidamente licenciados.

--------------------------------------------------

8. CONFIDENCIALIDAD

Confidencialidad: {{confidentiality}}

{{#if confidentiality}}
8.1. INFORMACIÓN CONFIDENCIAL. "Información Confidencial" significa toda información no pública divulgada por una Parte (la "Parte Divulgadora") a la otra Parte (la "Parte Receptora"), ya sea oralmente o por escrito, que esté designada como confidencial o que razonablemente deba considerarse confidencial dada la naturaleza de la información y circunstancias de la divulgación.

8.2. OBLIGACIONES. La Parte Receptora acuerda:
    (a) Mantener toda Información Confidencial en estricta confidencia;
    (b) No divulgar Información Confidencial a terceros sin consentimiento previo por escrito;
    (c) Usar Información Confidencial únicamente para los propósitos de este Contrato;
    (d) Proteger Información Confidencial usando el mismo grado de cuidado que usa para su propia información confidencial, pero no menos que un cuidado razonable;
    (e) Limitar el acceso a Información Confidencial a empleados y contratistas que necesiten saber y que estén obligados por obligaciones de confidencialidad.

8.3. EXCLUSIONES. La Información Confidencial no incluye información que:
    (a) Es o se vuelve públicamente disponible sin incumplimiento de este Contrato;
    (b) Fue poseída legítimamente por la Parte Receptora antes de la divulgación;
    (c) Es legítimamente recibida de un tercero sin obligaciones de confidencialidad;
    (d) Es desarrollada independientemente por la Parte Receptora sin uso de Información Confidencial;
    (e) Se requiere divulgar por ley u orden judicial (con aviso a la Parte Divulgadora si está permitido).

8.4. DEVOLUCIÓN DE MATERIALES. Al terminar o a solicitud, la Parte Receptora devolverá o destruirá toda Información Confidencial y certificará dicha destrucción por escrito.

8.5. SUPERVIVENCIA. Las obligaciones de confidencialidad sobrevivirán la terminación de este Contrato por un período de tres (3) años.
{{/if}}

--------------------------------------------------

9. GARANTÍAS Y DESCARGOS

9.1. GARANTÍAS DEL PROVEEDOR. El Proveedor declara y garantiza que:
    (a) El Proveedor tiene las habilidades, calificaciones y experiencia necesarias para ejecutar los Servicios;
    (b) {{service_warranty}};
    (c) Los Servicios no infringirán ni violarán derechos de propiedad intelectual de terceros;
    (d) El Proveedor tiene el derecho legal de celebrar este Contrato y ejecutar los Servicios;
    (e) El Proveedor cumplirá con todas las leyes y regulaciones federales, estatales y locales aplicables.

9.2. GARANTÍAS DEL CLIENTE. El Cliente declara y garantiza que:
    (a) El Cliente tiene la autoridad para celebrar este Contrato;
    (b) El Cliente proporcionará al Proveedor acceso, información y cooperación necesarios para ejecutar los Servicios;
    (c) El Cliente posee o tiene derechos para usar todos los materiales proporcionados al Proveedor.

9.3. DESCARGO. EXCEPTO SEGÚN SE ESTABLECE EXPRESAMENTE EN ESTE CONTRATO, EL PROVEEDOR NO HACE GARANTÍAS, EXPRESAS O IMPLÍCITAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR O NO INFRACCIÓN. EL PROVEEDOR NO GARANTIZA QUE LOS SERVICIOS SERÁN ININTERRUMPIDOS O LIBRES DE ERRORES.

--------------------------------------------------

10. INDEMNIZACIÓN

10.1. INDEMNIZACIÓN DEL PROVEEDOR. El Proveedor indemnizará, defenderá y mantendrá indemne al Cliente y sus oficiales, directores, empleados y agentes de y contra cualquier y todos reclamos, daños, pérdidas, responsabilidades, costos y gastos (incluyendo honorarios razonables de abogados) que surjan de o se relacionen con:
    (a) Incumplimiento del Proveedor de este Contrato;
    (b) Negligencia o mala conducta intencional del Proveedor;
    (c) Reclamos de que los Servicios o producto del trabajo infringen derechos de propiedad intelectual de terceros;
    (d) Violación del Proveedor de leyes aplicables;
    (e) Actos u omisiones de empleados, agentes o subcontratistas del Proveedor.

10.2. INDEMNIZACIÓN DEL CLIENTE. El Cliente indemnizará, defenderá y mantendrá indemne al Proveedor de y contra reclamos que surjan de:
    (a) Incumplimiento del Cliente de este Contrato;
    (b) Negligencia o mala conducta intencional del Cliente;
    (c) Reclamos de que materiales del Cliente infringen derechos de terceros;
    (d) Uso del Cliente de Servicios de manera no autorizada por este Contrato.

10.3. PROCEDIMIENTO DE INDEMNIZACIÓN. La parte indemnizada deberá:
    (a) Avisar prontamente a la parte indemnizante de cualquier reclamo;
    (b) Cooperar razonablemente con la defensa del reclamo;
    (c) Permitir que la parte indemnizante controle la defensa y el acuerdo, siempre que los acuerdos no admitan responsabilidad o impongan obligaciones sobre la parte indemnizada sin consentimiento.

--------------------------------------------------

11. LIMITACIÓN DE RESPONSABILIDAD

11.1. LÍMITE DE RESPONSABILIDAD. {{liability_cap}}
{{#if liability_amount}}Responsabilidad Máxima: USD {{liability_amount}}{{/if}}

EXCEPTO POR INCUMPLIMIENTOS DE CONFIDENCIALIDAD, INFRACCIÓN DE PROPIEDAD INTELECTUAL, NEGLIGENCIA GRAVE O MALA CONDUCTA INTENCIONAL, LA RESPONSABILIDAD TOTAL AGREGADA DEL PROVEEDOR BAJO ESTE CONTRATO NO EXCEDERÁ EL MONTO ESPECIFICADO ARRIBA.

11.2. EXCLUSIÓN DE DAÑOS. EN NINGÚN CASO NINGUNA PARTE SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, CONSECUENTES, ESPECIALES, EJEMPLARES O PUNITIVOS, INCLUYENDO PÉRDIDA DE BENEFICIOS, PÉRDIDA DE DATOS, INTERRUPCIÓN DE NEGOCIOS O PÉRDIDA DE REPUTACIÓN, AÚN SI SE ADVIRTIÓ DE LA POSIBILIDAD DE DICHOS DAÑOS.

11.3. PROPÓSITO ESENCIAL. Las Partes reconocen que las limitaciones de responsabilidad en esta Sección son elementos esenciales del acuerdo y que el Proveedor no celebraría este Contrato sin estas limitaciones.

--------------------------------------------------

12. SEGURO

Requisitos de Seguro: {{insurance_required}}

{{#if insurance_amount}}
12.1. MONTOS DE COBERTURA. El Proveedor mantendrá cobertura de seguro de al menos USD {{insurance_amount}} por ocurrencia.
{{/if}}

{{#if insurance_required}}
12.2. OBLIGACIONES DE SEGURO. El Proveedor deberá:
    (a) Obtener y mantener seguro requerido a costa del Proveedor;
    (b) Proporcionar al Cliente certificados de seguro a solicitud;
    (c) Proporcionar aviso de treinta (30) días si el seguro se cancela o cambia materialmente;
    (d) Nombrar al Cliente como asegurado adicional en pólizas de responsabilidad general (si se solicita).

12.3. SIN LIMITACIÓN. Los requisitos de seguro no limitan la responsabilidad del Proveedor u obligaciones de indemnización bajo este Contrato.
{{/if}}

--------------------------------------------------

13. RELACIÓN DE CONTRATISTA INDEPENDIENTE

13.1. CONTRATISTA INDEPENDIENTE. El Proveedor es un contratista independiente y no un empleado, socio o empresa conjunta del Cliente. Nada en este Contrato crea una relación de empleo, sociedad o agencia.

13.2. SIN AUTORIDAD. El Proveedor no tiene autoridad para obligar al Cliente o hacer compromisos en nombre del Cliente sin autorización expresa por escrito.

13.3. IMPUESTOS Y BENEFICIOS. El Proveedor es responsable de todos los impuestos, incluyendo impuestos de autoempleo. El Proveedor no tiene derecho a beneficios de empleados, seguro o compensación de trabajadores.

13.4. ASISTENTES. El Proveedor puede usar asistentes o subcontratistas para ejecutar Servicios, siempre que:
    (a) El Proveedor obtenga aprobación previa por escrito del Cliente para subcontratistas;
    (b) El Proveedor permanezca completamente responsable del desempeño del subcontratista;
    (c) Los subcontratistas estén obligados por las mismas obligaciones de confidencialidad y otras obligaciones que el Proveedor.

--------------------------------------------------

14. RESPONSABILIDADES DEL CLIENTE

14.1. COOPERACIÓN. El Cliente deberá:
    (a) Proporcionar al Proveedor acceso razonable a instalaciones, sistemas y personal del Cliente según sea necesario;
    (b) Proporcionar respuestas oportunas a solicitudes del Proveedor de información o decisiones;
    (c) Designar una persona de contacto principal para coordinación;
    (d) Revisar y aprobar entregables de manera oportuna;
    (e) Pagar tarifas cuando sean debidas.

14.2. MATERIALES DEL CLIENTE. El Cliente proporcionará al Proveedor materiales, información y acceso necesarios para que el Proveedor ejecute los Servicios. El Cliente declara que tiene derechos para usar y compartir dichos materiales.

14.3. RETRASOS. Si el incumplimiento del Cliente de cumplir sus responsabilidades causa retrasos en la entrega del Servicio, el Proveedor no será responsable por dichos retrasos y puede tener derecho a tiempo y compensación adicionales.

--------------------------------------------------

15. DISPOSICIONES GENERALES

15.1. LEY APLICABLE. Este Contrato se regirá e interpretará de acuerdo con las leyes del Estado de {{governing_state}}, sin consideración a sus principios de conflicto de leyes.

15.2. JURISDICCIÓN Y COMPETENCIA. Cualquier acción legal o procedimiento que surja bajo este Contrato se presentará exclusivamente en los tribunales estatales o federales ubicados en {{governing_state}}, y cada Parte consiente a la jurisdicción de dichos tribunales.

15.3. RESOLUCIÓN DE DISPUTAS. Antes de iniciar litigación, las Partes acuerdan intentar resolver disputas mediante negociación de buena fe. Si la negociación falla dentro de treinta (30) días, cualquiera de las Partes puede buscar remedios legales.

15.4. ACUERDO COMPLETO. Este Contrato constituye el acuerdo completo entre las Partes respecto al asunto del presente y reemplaza todos los acuerdos, entendimientos, negociaciones y discusiones previos, ya sean orales o escritos.

15.5. ENMIENDAS. Este Contrato puede ser enmendado o modificado solo mediante un instrumento escrito firmado por ambas Partes.

15.6. RENUNCIA. Ninguna renuncia de cualquier disposición constituirá una renuncia de cualquier otra disposición, ni ninguna renuncia constituirá una renuncia continua a menos que se declare expresamente por escrito.

15.7. DIVISIBILIDAD. Si cualquier disposición se considera inválida, ilegal o inaplicable, las disposiciones restantes continuarán en pleno vigor y efecto.

15.8. CESIÓN. Ninguna Parte puede ceder este Contrato sin el consentimiento previo por escrito de la otra Parte, excepto que cualquiera de las Partes puede ceder a un sucesor en conexión con una fusión, adquisición o venta de sustancialmente todos los activos. Este Contrato obligará y beneficiará a las Partes y sus sucesores y cesionarios permitidos.

15.9. AVISOS. Todos los avisos bajo este Contrato serán por escrito y entregados mediante:
    (a) Correo electrónico con confirmación de recibo;
    (b) Correo certificado, recibo de devolución solicitado;
    (c) Servicio de mensajería nocturna.

    Avisos al Proveedor: {{provider_email}}
    Avisos al Cliente: {{client_email}}

15.10. FUERZA MAYOR. Ninguna Parte será responsable por retrasos o fallas en el desempeño debido a causas fuera de su control razonable, incluyendo actos de Dios, guerra, terrorismo, huelgas, desastres naturales, pandemias o acciones gubernamentales.

15.11. CONTRAPARTES. Este Contrato puede ejecutarse en contrapartes, cada una considerada un original y todas juntas constituyendo un acuerdo. Las firmas electrónicas tendrán el mismo efecto que las firmas originales.

15.12. SUPERVIVENCIA. Las secciones que por su naturaleza deberían sobrevivir la terminación sobrevivirán, incluyendo confidencialidad, propiedad intelectual, obligaciones de pago, garantías, indemnización, limitación de responsabilidad y resolución de disputas.

15.13. ENCABEZADOS. Los encabezados de sección son solo por conveniencia y no afectarán la interpretación.

15.14. RELACIÓN DE DISPOSICIONES. Si hay algún conflicto entre disposiciones de este Contrato, la disposición específica controlará sobre la disposición general.

{{#if additional_terms}}
16. TÉRMINOS ADICIONALES

{{additional_terms}}
{{/if}}

--------------------------------------------------

EN FE DE LO CUAL, las Partes han ejecutado este Contrato de Servicios en la fecha indicada arriba.


PROVEEDOR DE SERVICIOS:

_____________________________________
{{provider_name}}
{{#if provider_business_name}}{{provider_business_name}}{{/if}}

Firma: ___________________________

Título (si aplica): ________________

Fecha: _______________________________


CLIENTE:

_____________________________________
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}

Firma: ___________________________

Título (si aplica): ________________

Fecha: _______________________________


--------------------------------------------------

DESCARGO DE RESPONSABILIDAD LEGAL E INFORMACIÓN IMPORTANTE

Esta plantilla de Contrato de Servicios se proporciona solo con fines informativos y no constituye asesoramiento legal. Los contratos de servicios están regidos por la ley de contratos, que varía según el estado y puede ser compleja dependiendo del tipo de servicios que se proporcionan.

CUÁNDO CONSULTAR A UN ABOGADO:

Debe consultar con un abogado licenciado si:
• Los servicios involucran industrias reguladas (médica, legal, servicios financieros)
• El valor del contrato excede $50,000
• Los servicios involucran riesgos potenciales de seguridad o preocupaciones de responsabilidad
• Necesita cumplimiento específico de la industria (HIPAA, SOC 2, PCI-DSS, etc.)
• Los servicios involucran partes internacionales o transacciones transfronterizas
• Tiene consideraciones complejas de propiedad intelectual
• Necesita garantías de desempeño específicas o términos de SLA con penalidades

MEJORES PRÁCTICAS PARA CONTRATOS DE SERVICIOS:

1. SEA ESPECÍFICO: Defina claramente el alcance de servicios, entregables, plazos y criterios de aceptación.

2. DOCUMENTE TODO: Mantenga registros de todas las comunicaciones, solicitudes de cambio y aprobaciones.

3. COMIENCE CON UNA PRUEBA: Considere un plazo inicial más corto (3-6 meses) antes de comprometerse a un acuerdo a largo plazo.

4. DEFINA EL ÉXITO: Establezca métricas claras y KPIs para medir el desempeño del servicio.

5. PLANIFIQUE LOS CAMBIOS: Incluya un proceso para manejar cambios de alcance, servicios adicionales y ajustes de tarifas.

6. PROTEJA SUS INTERESES: Asegúrese de que las disposiciones de confidencialidad, propiedad intelectual y responsabilidad protejan adecuadamente su negocio.

7. REVISE REGULARMENTE: Revise el acuerdo periódicamente para asegurar que todavía satisface las necesidades de ambas partes.

CONTRATO DE SERVICIOS vs. CONTRATO DE CONTRATISTA INDEPENDIENTE:

• CONTRATO DE SERVICIOS: Para servicios continuos y recurrentes (mantenimiento mensual, soporte, consultoría)
• CONTRATO DE CONTRATISTA INDEPENDIENTE: Para proyectos específicos o compromisos únicos

Elija el tipo de acuerdo que mejor se ajuste a su relación comercial.

CONSIDERACIONES ESPECÍFICAS POR ESTADO:

Diferentes estados pueden tener requisitos específicos para contratos de servicios, incluyendo:
• Divulgaciones requeridas para ciertos tipos de servicio
• Requisitos de licencia para proveedores de servicios
• Leyes de protección al consumidor para ciertos servicios
• Limitaciones en cláusulas de responsabilidad o indemnización
• Regulaciones de contratistas de mejoras para el hogar
• Derechos específicos de cancelación para consumidores

Siempre investigue los requisitos específicos de su estado o consulte con un abogado local.

REGULACIONES ESPECÍFICAS DE LA INDUSTRIA:

Ciertas industrias tienen requisitos legales y de cumplimiento específicos:
• Servicios de TI: Seguridad de datos, cumplimiento de privacidad, recuperación ante desastres
• Atención Médica: Cumplimiento HIPAA, privacidad del paciente, responsabilidad médica
• Servicios Financieros: Regulaciones de valores, deberes fiduciarios, cumplimiento
• Servicios Legales: Privilegio abogado-cliente, reglas éticas, conflicto de intereses
• Construcción/Contratación: Licencias, permisos, gravámenes mecánicos, códigos de construcción

Asegúrese de que su acuerdo aborde los requisitos legales específicos de la industria.

--------------------------------------------------

Este Contrato de Servicios fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.`
};

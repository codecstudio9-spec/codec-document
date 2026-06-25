// PLANTILLA PROFESIONAL DE CONTRATO DE SERVICIOS
// Acuerdo completo para servicios continuos entre proveedor y cliente
// Incluye trminos de SLA, cronogramas de pago y compromisos de nivel de servicio

import { DocumentTemplate } from '../types/document';

export const serviceAgreementTemplateES: DocumentTemplate = {
  id: 'service-agreement',
  name: 'Contrato de Servicios',
  description: 'Contrato profesional de servicios para servicios continuos con alcance, entregables, cronograma de pagos y compromisos de nivel de servicio. Ideal para contratos de mantenimiento, servicios de soporte, consultora y servicios profesionales recurrentes.',
  category: 'Negocios y Contratos',
  price: 9.99,
  fields: [
    // Informacin del Proveedor de Servicios
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
      label: 'Direccin del Proveedor', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'provider_email', 
      label: 'Correo electrnico del Proveedor', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'provider_phone', 
      label: 'Telfono del Proveedor', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'provider_type', 
      label: 'Tipo de Proveedor', 
      type: 'select', 
      options: ['Individual', 'Corporacin', 'LLC', 'Sociedad', 'Otra Entidad Comercial'], 
      required: true 
    },
    
    // Informacin del Cliente
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
      label: 'Direccin del Cliente', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'client_email', 
      label: 'Correo electrnico del Cliente', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'client_phone', 
      label: 'Telfono del Cliente', 
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
        'Servicios de Consultora',
        'Servicios de Marketing y Publicidad',
        'Contabilidad y Tenedura de Libros',
        'Servicios Legales',
        'Servicios de Limpieza',
        'Servicios de Seguridad',
        'Jardinera y Mantenimiento',
        'Administracin de Propiedades',
        'Mantenimiento de Equipos',
        'Software como Servicio (SaaS)',
        'Servicios Gestionados',
        'Servicios Profesionales',
        'Otros Servicios'
      ],
      required: true,
      helpText: 'Categora general de servicios que se proporcionan'
    },
    { 
      id: 'service_description', 
      label: 'Descripcin Detallada del Servicio', 
      type: 'textarea', 
      required: true,
      placeholder: 'Describa en detalle los servicios a proporcionar, incluyendo frecuencia, alcance y requisitos especficos.',
      helpText: 'Sea especfico sobre qu servicios se proporcionarn y con qu frecuencia'
    },
    { 
      id: 'service_location', 
      label: 'Ubicacin del Servicio', 
      type: 'select',
      options: [
        'En Sitio - Ubicacin del Cliente',
        'Remoto/Fuera de Sitio',
        'Hbrido (En Sitio y Remoto)',
        'Ubicacin del Proveedor',
        'Varias Ubicaciones Segn Necesidad'
      ],
      required: true 
    },
    { 
      id: 'service_hours', 
      label: 'Horario de Servicio', 
      type: 'textarea', 
      required: false,
      placeholder: 'Ejemplo: Lunes-Viernes 9am-5pm, o Disponible 24/7, o Segn necesidad',
      helpText: 'Cundo estarn disponibles o se realizarn los servicios'
    },
    
    // Plazo y Duracin
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
        'Plazo Fijo - 1 Ao',
        'Plazo Fijo - 2 Aos',
        'Plazo Fijo - 3 Aos',
        'Plazo Fijo - Duracin Personalizada',
        'Continuo Hasta Terminacin'
      ],
      required: true 
    },
    { 
      id: 'end_date', 
      label: 'Fecha de Finalizacin (si es Plazo Fijo)', 
      type: 'date', 
      required: false,
      helpText: 'Solo si seleccion un plazo fijo' 
    },
    { 
      id: 'auto_renewal', 
      label: 'Renovacin Automtica', 
      type: 'select',
      options: [
        'No - El contrato termina en la fecha de finalizacin',
        'S - Se renueva automticamente por el mismo plazo',
        'S - Se renueva automticamente mes a mes',
        'S - Se renueva automticamente anualmente'
      ],
      required: true,
      helpText: 'Si el contrato se renueva automticamente'
    },
    
    // Trminos de Pago
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
      label: 'Cronograma/Trminos de Pago', 
      type: 'textarea', 
      required: true,
      placeholder: 'Ejemplo: Pagadero mensualmente por adelantado el da 1 de cada mes, Neto 15 das',
      helpText: 'Cundo y cmo se deben realizar los pagos'
    },
    { 
      id: 'late_fee', 
      label: 'Tarifa por Pago Tardo', 
      type: 'select',
      options: [
        'Sin tarifas por mora',
        '1.5% mensual sobre saldo vencido',
        '5% del monto vencido',
        'Tarifa fija de $25',
        'Tarifa fija de $50',
        'Trminos personalizados de tarifa por mora'
      ],
      required: true 
    },
    { 
      id: 'payment_method', 
      label: 'Mtodos de Pago Aceptados', 
      type: 'select',
      options: [
        'Cheque o Transferencia Bancaria',
        'Tarjeta de Crdito',
        'ACH/Dbito Directo',
        'PayPal o Pago en Lnea',
        'Cualquiera de los Anteriores'
      ],
      required: true 
    },
    
    // Acuerdo de Nivel de Servicio (SLA)
    { 
      id: 'sla_included', 
      label: 'Incluir Acuerdo de Nivel de Servicio (SLA)?', 
      type: 'select',
      options: ['S', 'No'],
      required: true,
      helpText: 'SLA define tiempos de respuesta y garantas de servicio'
    },
    { 
      id: 'response_time', 
      label: 'Compromiso de Tiempo de Respuesta (si SLA)', 
      type: 'text', 
      required: false,
      placeholder: 'Ejemplo: 4 horas hbiles para problemas crticos, 24 horas para no crticos',
      helpText: 'Qu tan rpido el proveedor responder a solicitudes de servicio'
    },
    { 
      id: 'uptime_guarantee', 
      label: 'Garanta de Tiempo de Actividad/Disponibilidad (si aplica)', 
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
      placeholder: 'Ejemplo: Informes de servicio mensuales, registros de mantenimiento, informes de analtica, etc.',
      helpText: 'Qu resultados tangibles recibir el cliente'
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
      helpText: 'Quin posee los materiales creados durante la prestacin del servicio'
    },
    
    // Confidencialidad
    { 
      id: 'confidentiality', 
      label: 'Disposiciones de Confidencialidad', 
      type: 'select',
      options: [
        'S - Incluir trminos de confidencialidad mutua',
        'S - Solo confidencialidad del proveedor',
        'No - No es necesario para estos servicios'
      ],
      required: true 
    },
    
    // Garantas y Descargos
    { 
      id: 'service_warranty', 
      label: 'Garanta de Servicio', 
      type: 'select',
      options: [
        'El proveedor garantiza servicios profesionales y de calidad',
        'Servicios proporcionados "tal cual" sin garantas',
        'Garanta limitada - trminos especficos a agregar',
        'Garantas solo segn lo requerido por ley'
      ],
      required: true 
    },
    
    // Responsabilidad
    { 
      id: 'liability_cap', 
      label: 'Limitacin de Responsabilidad', 
      type: 'select',
      options: [
        'Sin limitacin de responsabilidad',
        'Limitado a tarifas pagadas en ltimos 12 meses',
        'Limitado a tarifas pagadas en ltimos 6 meses',
        'Limitado a tarifas pagadas en ltimos 3 meses',
        'Limitado a monto especfico en dlares',
        'Limitaciones estndar de responsabilidad aplican'
      ],
      required: true 
    },
    { 
      id: 'liability_amount', 
      label: 'Monto Especfico de Lmite de Responsabilidad ($) - Si Aplica', 
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
        'Compensacin de Trabajadores (si aplica)',
        'Requisitos personalizados de seguro'
      ],
      required: true 
    },
    { 
      id: 'insurance_amount', 
      label: 'Cobertura Mnima de Seguro ($) - Si se Requiere', 
      type: 'currency', 
      required: false,
      placeholder: '1000000',
      helpText: 'Ejemplo: $1,000,000'
    },
    
    // Terminacin
    { 
      id: 'termination_notice', 
      label: 'Perodo de Aviso de Terminacin', 
      type: 'select',
      options: [
        'Terminacin inmediata permitida',
        'Aviso Escrito de 7 Das',
        'Aviso Escrito de 14 Das',
        'Aviso Escrito de 30 Das',
        'Aviso Escrito de 60 Das',
        'Aviso Escrito de 90 Das'
      ],
      required: true 
    },
    { 
      id: 'early_termination_fee', 
      label: 'Tarifa por Terminacin Anticipada (si es Plazo Fijo)', 
      type: 'select',
      options: [
        'Sin tarifa por terminacin anticipada',
        'Saldo restante del contrato adeudado',
        'Una tarifa mensual de servicio',
        'Dos tarifas mensuales de servicio',
        'Tres tarifas mensuales de servicio',
        'Trminos personalizados de terminacin anticipada'
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
    
    // Trminos Adicionales
    { 
      id: 'additional_terms', 
      label: 'Trminos Adicionales/Disposiciones Especiales (Opcional)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Cualquier condicin especial o clusulas adicionales especficas a este contrato de servicios'
    },
  ],
  
  template: `CONTRATO DE SERVICIOS

ESTE CONTRATO DE SERVICIOS (el "Contrato") se celebra este da {{current_day}} de {{current_month}} de {{current_year}} (la "Fecha Efectiva"), por y entre:

PROVEEDOR DE SERVICIOS:
{{provider_name}}
{{#if provider_business_name}}nombre comercial {{provider_business_name}}{{/if}}
{{provider_address}}
Correo electrnico: {{provider_email}}
Telfono: {{provider_phone}}
Tipo: {{provider_type}}
(en adelante denominado "Proveedor" o "Proveedor de Servicios")

y

CLIENTE:
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}
{{client_address}}
Correo electrnico: {{client_email}}
Telfono: {{client_phone}}
(en adelante denominado "Cliente")

(Cada parte puede ser referida individualmente como una "Parte" y colectivamente como las "Partes".)

CONSIDERANDOS

CONSIDERANDO QUE, el Proveedor se dedica al negocio de proporcionar {{service_type}}; y

CONSIDERANDO QUE, el Cliente desea contratar al Proveedor para proporcionar ciertos servicios; y

CONSIDERANDO QUE, el Proveedor est dispuesto a proporcionar dichos servicios bajo los trminos y condiciones establecidos en este Contrato.

AHORA, POR LO TANTO, en consideracin de los acuerdos y convenios mutuos contenidos en este documento, y por otra buena y valiosa consideracin, cuyo recibo y suficiencia se reconocen por la presente, las Partes acuerdan lo siguiente:

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

1. SERVICIOS

1.1. ALCANCE DE LOS SERVICIOS. El Proveedor acuerda proporcionar los siguientes servicios (los "Servicios"):

Tipo de Servicio: {{service_type}}

{{service_description}}

1.2. UBICACIN DEL SERVICIO. Los servicios se realizarn: {{service_location}}

{{#if service_hours}}
1.3. HORARIO DE SERVICIO. Los servicios estarn disponibles/se realizarn segn el siguiente horario:
{{service_hours}}
{{/if}}

1.4. ESTNDAR DE DESEMPEO. El Proveedor ejecutar todos los Servicios de manera profesional y competente, conforme a estndares de la industria y mejores prcticas. El Proveedor dedicar recursos adecuados y personal calificado para la ejecucin de los Servicios.

1.5. MODIFICACIONES A LOS SERVICIOS. Cualquier modificacin al alcance de los Servicios debe ser acordada por escrito por ambas Partes y puede resultar en ajustes a las tarifas.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

2. PLAZO Y TERMINACIN

2.1. PLAZO. Este Contrato comenzar el {{start_date}} y continuar de la siguiente manera:
    Tipo de Plazo: {{term_type}}
    {{#if end_date}}Fecha de Finalizacin: {{end_date}}{{/if}}

2.2. RENOVACIN AUTOMTICA. {{auto_renewal}}

Si este Contrato se renueva automticamente, cualquiera de las Partes puede prevenir la renovacin proporcionando aviso por escrito de no renovacin al menos treinta (30) das antes del final del plazo actual.

2.3. TERMINACIN POR CONVENIENCIA. Cualquiera de las Partes puede terminar este Contrato por cualquier razn o sin razn proporcionando el siguiente aviso:
    Perodo de Aviso: {{termination_notice}}

{{#if early_termination_fee}}
2.4. TARIFA POR TERMINACIN ANTICIPADA. Si el Cliente termina este Contrato antes del final de un plazo fijo:
    {{early_termination_fee}}
{{/if}}

2.5. TERMINACIN POR CAUSA. Cualquiera de las Partes puede terminar este Contrato inmediatamente mediante aviso por escrito si:
    (a) La otra Parte incumple materialmente este Contrato y no cura dicho incumplimiento dentro de quince (15) das despus de recibir aviso por escrito;
    (b) La otra Parte se vuelve insolvente, declara bancarrota o hace una cesin en beneficio de acreedores;
    (c) La otra Parte cesa de conducir negocios en el curso normal.

2.6. EFECTO DE LA TERMINACIN. Al terminar o expirar este Contrato:
    (a) El Cliente pagar al Proveedor por todos los Servicios satisfactoriamente ejecutados hasta la fecha de terminacin;
    (b) El Proveedor entregar todo producto de trabajo, materiales y propiedad del Cliente al Cliente;
    (c) Todas las obligaciones que por su naturaleza deberan sobrevivir la terminacin sobrevivirn, incluyendo obligaciones de pago, confidencialidad, derechos de propiedad intelectual, garantas, indemnizacin y limitacin de responsabilidad;
    (d) Ninguna Parte ser responsable ante la otra por daos resultantes de la terminacin de acuerdo con los trminos de este Contrato, excepto tarifas por terminacin anticipada si aplican.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

3. COMPENSACIN Y PAGO

3.1. TARIFAS DE SERVICIO. El Cliente pagar al Proveedor de la siguiente manera:

    Estructura de Pago: {{payment_structure}}
    {{#if monthly_fee}}Tarifa Mensual: USD {{monthly_fee}}{{/if}}
    {{#if annual_fee}}Tarifa Anual: USD {{annual_fee}}{{/if}}
    {{#if hourly_rate}}Tarifa por Hora: USD {{hourly_rate}} por hora{{/if}}

3.2. T0RMINOS DE PAGO. {{payment_schedule}}

3.3. FACTURACIN. El Proveedor enviar facturas al Cliente segn el cronograma de pago anterior. Las facturas incluirn:
    (a) Nmero y fecha de factura;
    (b) Descripcin de Servicios ejecutados durante el perodo de facturacin;
    (c) Tarifas adeudadas;
    (d) Instrucciones de pago.

3.4. PAGOS TARDOS. {{late_fee}}

Si el pago no se recibe cuando es debido, el Proveedor puede, a su opcin:
    " Suspender los Servicios hasta que se reciba el pago completo;
    " Cobrar intereses sobre montos vencidos al menor de 1.5% mensual o la tasa mxima permitida por ley;
    " Terminar este Contrato por falta de pago despus de proporcionar aviso por escrito y oportunidad de cura.

3.5. M0TODO DE PAGO. El Cliente puede pagar mediante: {{payment_method}}

3.6. IMPUESTOS. Todas las tarifas son exclusivas de impuestos federales, estatales y locales sobre ventas, uso, consumo u otros impuestos aplicables. El Cliente es responsable de todos dichos impuestos excepto impuestos basados en el ingreso neto del Proveedor.

3.7. AJUSTES DE TARIFAS. El Proveedor puede aumentar las tarifas mediante aviso por escrito de treinta (30) das al Cliente. Si el Cliente no est de acuerdo con el aumento de tarifas, el Cliente puede terminar este Contrato mediante aviso por escrito antes de la fecha efectiva del aumento.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

4. GASTOS Y REEMBOLSOS

4.1. GASTOS. {{expenses}}

{{#if expenses}}
Si los gastos son reembolsables, el Proveedor deber:
    (a) Obtener aprobacin previa por escrito del Cliente para gastos que excedan $500;
    (b) Proporcionar recibos y documentacin para todos los gastos reembolsables;
    (c) Enviar informes de gastos con facturas;
    (d) Buscar reembolso solo por gastos razonables y necesarios directamente relacionados con los Servicios.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

5. ACUERDO DE NIVEL DE SERVICIO (SLA)

SLA Incluido: {{sla_included}}

{{#if response_time}}
5.1. TIEMPO DE RESPUESTA. El Proveedor se compromete a los siguientes tiempos de respuesta:
{{response_time}}

El tiempo de respuesta se mide desde cuando el Cliente enva una solicitud de servicio a travs del canal designado hasta cuando el Proveedor reconoce recibo y comienza a trabajar en el problema.
{{/if}}

{{#if uptime_guarantee}}
5.2. TIEMPO DE ACTIVIDAD/DISPONIBILIDAD. El Proveedor se compromete al siguiente estndar de disponibilidad:
{{uptime_guarantee}}

El tiempo de inactividad excluye mantenimiento programado (con aviso previo), eventos de fuerza mayor y problemas causados por sistemas del Cliente o terceros.
{{/if}}

{{#if sla_included}}
5.3. PRIORIDADES DE SERVICIO. Las solicitudes de servicio se priorizarn de la siguiente manera:
    " Crtico: Sistema cado, operaciones comerciales detenidas - Respuesta dentro de [X] horas
    " Alto: Funcionalidad principal afectada - Respuesta dentro de [X] horas
    " Medio: Problema menor, solucin alternativa disponible - Respuesta dentro de [X] horas hbiles
    " Bajo: Pregunta general o solicitud de mejora - Respuesta dentro de [X] das hbiles

5.4. CR0DITOS DE SLA. Si el Proveedor no cumple con compromisos de SLA, el Cliente puede tener derecho a crditos de servicio de la siguiente manera:
    " [Definir estructura de crdito si aplica]
    " Los crditos de servicio son el nico remedio del Cliente por violaciones de SLA.
    " Los crditos no aplican a problemas causados por el Cliente, fuerza mayor o terceros.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

6. ENTREGABLES E INFORMES

{{#if deliverables}}
6.1. ENTREGABLES. El Proveedor proporcionar los siguientes entregables:
{{deliverables}}

6.2. CRONOGRAMA DE ENTREGA. Los entregables se proporcionarn segn el cronograma acordado por las Partes.

6.3. REVISIN DEL CLIENTE. El Cliente tendr [X] das hbiles para revisar entregables y proporcionar retroalimentacin. El Proveedor har revisiones razonables basadas en la retroalimentacin del Cliente.
{{else}}
6.1. SIN ENTREGABLES ESPECFICOS. Este Contrato es para la provisin de servicios continuos y no requiere entregables especficos a menos que se acuerde de otra manera por escrito.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

7. DERECHOS DE PROPIEDAD INTELECTUAL

7.1. PROPIEDAD DEL PRODUCTO DEL TRABAJO. {{ip_ownership}}

7.2. MATERIALES PREEXISTENTES. Cada Parte retiene todos los derechos a su propiedad intelectual preexistente, materiales, herramientas, plantillas y conocimientos desarrollados antes o fuera del alcance de este Contrato.

7.3. LICENCIA AL PROVEEDOR. El Cliente otorga al Proveedor una licencia no exclusiva para usar las marcas comerciales, logotipos y materiales del Cliente nicamente segn sea necesario para ejecutar los Servicios.

7.4. LICENCIA AL CLIENTE. Si el Proveedor retiene propiedad del producto del trabajo, el Proveedor otorga al Cliente una licencia perpetua, no exclusiva, libre de regalas para usar el producto del trabajo para propsitos comerciales del Cliente.

7.5. MATERIALES DE TERCEROS. El Proveedor no incorporar materiales de terceros en el producto del trabajo sin el consentimiento del Cliente, a menos que estn debidamente licenciados.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

8. CONFIDENCIALIDAD

Confidencialidad: {{confidentiality}}

{{#if confidentiality}}
8.1. INFORMACIN CONFIDENCIAL. "Informacin Confidencial" significa toda informacin no pblica divulgada por una Parte (la "Parte Divulgadora") a la otra Parte (la "Parte Receptora"), ya sea oralmente o por escrito, que est designada como confidencial o que razonablemente deba considerarse confidencial dada la naturaleza de la informacin y circunstancias de la divulgacin.

8.2. OBLIGACIONES. La Parte Receptora acuerda:
    (a) Mantener toda Informacin Confidencial en estricta confidencia;
    (b) No divulgar Informacin Confidencial a terceros sin consentimiento previo por escrito;
    (c) Usar Informacin Confidencial nicamente para los propsitos de este Contrato;
    (d) Proteger Informacin Confidencial usando el mismo grado de cuidado que usa para su propia informacin confidencial, pero no menos que un cuidado razonable;
    (e) Limitar el acceso a Informacin Confidencial a empleados y contratistas que necesiten saber y que estn obligados por obligaciones de confidencialidad.

8.3. EXCLUSIONES. La Informacin Confidencial no incluye informacin que:
    (a) Es o se vuelve pblicamente disponible sin incumplimiento de este Contrato;
    (b) Fue poseda legtimamente por la Parte Receptora antes de la divulgacin;
    (c) Es legtimamente recibida de un tercero sin obligaciones de confidencialidad;
    (d) Es desarrollada independientemente por la Parte Receptora sin uso de Informacin Confidencial;
    (e) Se requiere divulgar por ley u orden judicial (con aviso a la Parte Divulgadora si est permitido).

8.4. DEVOLUCIN DE MATERIALES. Al terminar o a solicitud, la Parte Receptora devolver o destruir toda Informacin Confidencial y certificar dicha destruccin por escrito.

8.5. SUPERVIVENCIA. Las obligaciones de confidencialidad sobrevivirn la terminacin de este Contrato por un perodo de tres (3) aos.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

9. GARANTAS Y DESCARGOS

9.1. GARANTAS DEL PROVEEDOR. El Proveedor declara y garantiza que:
    (a) El Proveedor tiene las habilidades, calificaciones y experiencia necesarias para ejecutar los Servicios;
    (b) {{service_warranty}};
    (c) Los Servicios no infringirn ni violarn derechos de propiedad intelectual de terceros;
    (d) El Proveedor tiene el derecho legal de celebrar este Contrato y ejecutar los Servicios;
    (e) El Proveedor cumplir con todas las leyes y regulaciones federales, estatales y locales aplicables.

9.2. GARANTAS DEL CLIENTE. El Cliente declara y garantiza que:
    (a) El Cliente tiene la autoridad para celebrar este Contrato;
    (b) El Cliente proporcionar al Proveedor acceso, informacin y cooperacin necesarios para ejecutar los Servicios;
    (c) El Cliente posee o tiene derechos para usar todos los materiales proporcionados al Proveedor.

9.3. DESCARGO. EXCEPTO SEGaN SE ESTABLECE EXPRESAMENTE EN ESTE CONTRATO, EL PROVEEDOR NO HACE GARANTAS, EXPRESAS O IMPLCITAS, INCLUYENDO GARANTAS IMPLCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPSITO PARTICULAR O NO INFRACCIN. EL PROVEEDOR NO GARANTIZA QUE LOS SERVICIOS SERN ININTERRUMPIDOS O LIBRES DE ERRORES.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

10. INDEMNIZACIN

10.1. INDEMNIZACIN DEL PROVEEDOR. El Proveedor indemnizar, defender y mantendr indemne al Cliente y sus oficiales, directores, empleados y agentes de y contra cualquier y todos reclamos, daos, prdidas, responsabilidades, costos y gastos (incluyendo honorarios razonables de abogados) que surjan de o se relacionen con:
    (a) Incumplimiento del Proveedor de este Contrato;
    (b) Negligencia o mala conducta intencional del Proveedor;
    (c) Reclamos de que los Servicios o producto del trabajo infringen derechos de propiedad intelectual de terceros;
    (d) Violacin del Proveedor de leyes aplicables;
    (e) Actos u omisiones de empleados, agentes o subcontratistas del Proveedor.

10.2. INDEMNIZACIN DEL CLIENTE. El Cliente indemnizar, defender y mantendr indemne al Proveedor de y contra reclamos que surjan de:
    (a) Incumplimiento del Cliente de este Contrato;
    (b) Negligencia o mala conducta intencional del Cliente;
    (c) Reclamos de que materiales del Cliente infringen derechos de terceros;
    (d) Uso del Cliente de Servicios de manera no autorizada por este Contrato.

10.3. PROCEDIMIENTO DE INDEMNIZACIN. La parte indemnizada deber:
    (a) Avisar prontamente a la parte indemnizante de cualquier reclamo;
    (b) Cooperar razonablemente con la defensa del reclamo;
    (c) Permitir que la parte indemnizante controle la defensa y el acuerdo, siempre que los acuerdos no admitan responsabilidad o impongan obligaciones sobre la parte indemnizada sin consentimiento.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

11. LIMITACIN DE RESPONSABILIDAD

11.1. LMITE DE RESPONSABILIDAD. {{liability_cap}}
{{#if liability_amount}}Responsabilidad Mxima: USD {{liability_amount}}{{/if}}

EXCEPTO POR INCUMPLIMIENTOS DE CONFIDENCIALIDAD, INFRACCIN DE PROPIEDAD INTELECTUAL, NEGLIGENCIA GRAVE O MALA CONDUCTA INTENCIONAL, LA RESPONSABILIDAD TOTAL AGREGADA DEL PROVEEDOR BAJO ESTE CONTRATO NO EXCEDER EL MONTO ESPECIFICADO ARRIBA.

11.2. EXCLUSIN DE DAOS. EN NINGaN CASO NINGUNA PARTE SER RESPONSABLE POR DAOS INDIRECTOS, INCIDENTALES, CONSECUENTES, ESPECIALES, EJEMPLARES O PUNITIVOS, INCLUYENDO P0RDIDA DE BENEFICIOS, P0RDIDA DE DATOS, INTERRUPCIN DE NEGOCIOS O P0RDIDA DE REPUTACIN, AaN SI SE ADVIRTI DE LA POSIBILIDAD DE DICHOS DAOS.

11.3. PROPSITO ESENCIAL. Las Partes reconocen que las limitaciones de responsabilidad en esta Seccin son elementos esenciales del acuerdo y que el Proveedor no celebrara este Contrato sin estas limitaciones.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

12. SEGURO

Requisitos de Seguro: {{insurance_required}}

{{#if insurance_amount}}
12.1. MONTOS DE COBERTURA. El Proveedor mantendr cobertura de seguro de al menos USD {{insurance_amount}} por ocurrencia.
{{/if}}

{{#if insurance_required}}
12.2. OBLIGACIONES DE SEGURO. El Proveedor deber:
    (a) Obtener y mantener seguro requerido a costa del Proveedor;
    (b) Proporcionar al Cliente certificados de seguro a solicitud;
    (c) Proporcionar aviso de treinta (30) das si el seguro se cancela o cambia materialmente;
    (d) Nombrar al Cliente como asegurado adicional en plizas de responsabilidad general (si se solicita).

12.3. SIN LIMITACIN. Los requisitos de seguro no limitan la responsabilidad del Proveedor u obligaciones de indemnizacin bajo este Contrato.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

13. RELACIN DE CONTRATISTA INDEPENDIENTE

13.1. CONTRATISTA INDEPENDIENTE. El Proveedor es un contratista independiente y no un empleado, socio o empresa conjunta del Cliente. Nada en este Contrato crea una relacin de empleo, sociedad o agencia.

13.2. SIN AUTORIDAD. El Proveedor no tiene autoridad para obligar al Cliente o hacer compromisos en nombre del Cliente sin autorizacin expresa por escrito.

13.3. IMPUESTOS Y BENEFICIOS. El Proveedor es responsable de todos los impuestos, incluyendo impuestos de autoempleo. El Proveedor no tiene derecho a beneficios de empleados, seguro o compensacin de trabajadores.

13.4. ASISTENTES. El Proveedor puede usar asistentes o subcontratistas para ejecutar Servicios, siempre que:
    (a) El Proveedor obtenga aprobacin previa por escrito del Cliente para subcontratistas;
    (b) El Proveedor permanezca completamente responsable del desempeo del subcontratista;
    (c) Los subcontratistas estn obligados por las mismas obligaciones de confidencialidad y otras obligaciones que el Proveedor.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

14. RESPONSABILIDADES DEL CLIENTE

14.1. COOPERACIN. El Cliente deber:
    (a) Proporcionar al Proveedor acceso razonable a instalaciones, sistemas y personal del Cliente segn sea necesario;
    (b) Proporcionar respuestas oportunas a solicitudes del Proveedor de informacin o decisiones;
    (c) Designar una persona de contacto principal para coordinacin;
    (d) Revisar y aprobar entregables de manera oportuna;
    (e) Pagar tarifas cuando sean debidas.

14.2. MATERIALES DEL CLIENTE. El Cliente proporcionar al Proveedor materiales, informacin y acceso necesarios para que el Proveedor ejecute los Servicios. El Cliente declara que tiene derechos para usar y compartir dichos materiales.

14.3. RETRASOS. Si el incumplimiento del Cliente de cumplir sus responsabilidades causa retrasos en la entrega del Servicio, el Proveedor no ser responsable por dichos retrasos y puede tener derecho a tiempo y compensacin adicionales.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

15. DISPOSICIONES GENERALES

15.1. LEY APLICABLE. Este Contrato se regir e interpretar de acuerdo con las leyes del Estado de {{governing_state}}, sin consideracin a sus principios de conflicto de leyes.

15.2. JURISDICCIN Y COMPETENCIA. Cualquier accin legal o procedimiento que surja bajo este Contrato se presentar exclusivamente en los tribunales estatales o federales ubicados en {{governing_state}}, y cada Parte consiente a la jurisdiccin de dichos tribunales.

15.3. RESOLUCIN DE DISPUTAS. Antes de iniciar litigacin, las Partes acuerdan intentar resolver disputas mediante negociacin de buena fe. Si la negociacin falla dentro de treinta (30) das, cualquiera de las Partes puede buscar remedios legales.

15.4. ACUERDO COMPLETO. Este Contrato constituye el acuerdo completo entre las Partes respecto al asunto del presente y reemplaza todos los acuerdos, entendimientos, negociaciones y discusiones previos, ya sean orales o escritos.

15.5. ENMIENDAS. Este Contrato puede ser enmendado o modificado solo mediante un instrumento escrito firmado por ambas Partes.

15.6. RENUNCIA. Ninguna renuncia de cualquier disposicin constituir una renuncia de cualquier otra disposicin, ni ninguna renuncia constituir una renuncia continua a menos que se declare expresamente por escrito.

15.7. DIVISIBILIDAD. Si cualquier disposicin se considera invlida, ilegal o inaplicable, las disposiciones restantes continuarn en pleno vigor y efecto.

15.8. CESIN. Ninguna Parte puede ceder este Contrato sin el consentimiento previo por escrito de la otra Parte, excepto que cualquiera de las Partes puede ceder a un sucesor en conexin con una fusin, adquisicin o venta de sustancialmente todos los activos. Este Contrato obligar y beneficiar a las Partes y sus sucesores y cesionarios permitidos.

15.9. AVISOS. Todos los avisos bajo este Contrato sern por escrito y entregados mediante:
    (a) Correo electrnico con confirmacin de recibo;
    (b) Correo certificado, recibo de devolucin solicitado;
    (c) Servicio de mensajera nocturna.

    Avisos al Proveedor: {{provider_email}}
    Avisos al Cliente: {{client_email}}

15.10. FUERZA MAYOR. Ninguna Parte ser responsable por retrasos o fallas en el desempeo debido a causas fuera de su control razonable, incluyendo actos de Dios, guerra, terrorismo, huelgas, desastres naturales, pandemias o acciones gubernamentales.

15.11. CONTRAPARTES. Este Contrato puede ejecutarse en contrapartes, cada una considerada un original y todas juntas constituyendo un acuerdo. Las firmas electrnicas tendrn el mismo efecto que las firmas originales.

15.12. SUPERVIVENCIA. Las secciones que por su naturaleza deberan sobrevivir la terminacin sobrevivirn, incluyendo confidencialidad, propiedad intelectual, obligaciones de pago, garantas, indemnizacin, limitacin de responsabilidad y resolucin de disputas.

15.13. ENCABEZADOS. Los encabezados de seccin son solo por conveniencia y no afectarn la interpretacin.

15.14. RELACIN DE DISPOSICIONES. Si hay algn conflicto entre disposiciones de este Contrato, la disposicin especfica controlar sobre la disposicin general.

{{#if additional_terms}}
16. T0RMINOS ADICIONALES

{{additional_terms}}
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

EN FE DE LO CUAL, las Partes han ejecutado este Contrato de Servicios en la fecha indicada arriba.


PROVEEDOR DE SERVICIOS:

_____________________________________
{{provider_name}}
{{#if provider_business_name}}{{provider_business_name}}{{/if}}

Firma: ___________________________

Ttulo (si aplica): ________________

Fecha: _______________________________


CLIENTE:

_____________________________________
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}

Firma: ___________________________

Ttulo (si aplica): ________________

Fecha: _______________________________


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCARGO DE RESPONSABILIDAD LEGAL E INFORMACIN IMPORTANTE

Esta plantilla de Contrato de Servicios se proporciona solo con fines informativos y no constituye asesoramiento legal. Los contratos de servicios estn regidos por la ley de contratos, que vara segn el estado y puede ser compleja dependiendo del tipo de servicios que se proporcionan.

CUNDO CONSULTAR A UN ABOGADO:

Debe consultar con un abogado licenciado si:
" Los servicios involucran industrias reguladas (mdica, legal, servicios financieros)
" El valor del contrato excede $50,000
" Los servicios involucran riesgos potenciales de seguridad o preocupaciones de responsabilidad
" Necesita cumplimiento especfico de la industria (HIPAA, SOC 2, PCI-DSS, etc.)
" Los servicios involucran partes internacionales o transacciones transfronterizas
" Tiene consideraciones complejas de propiedad intelectual
" Necesita garantas de desempeo especficas o trminos de SLA con penalidades

MEJORES PRCTICAS PARA CONTRATOS DE SERVICIOS:

1. SEA ESPECFICO: Defina claramente el alcance de servicios, entregables, plazos y criterios de aceptacin.

2. DOCUMENTE TODO: Mantenga registros de todas las comunicaciones, solicitudes de cambio y aprobaciones.

3. COMIENCE CON UNA PRUEBA: Considere un plazo inicial ms corto (3-6 meses) antes de comprometerse a un acuerdo a largo plazo.

4. DEFINA EL 0XITO: Establezca mtricas claras y KPIs para medir el desempeo del servicio.

5. PLANIFIQUE LOS CAMBIOS: Incluya un proceso para manejar cambios de alcance, servicios adicionales y ajustes de tarifas.

6. PROTEJA SUS INTERESES: Asegrese de que las disposiciones de confidencialidad, propiedad intelectual y responsabilidad protejan adecuadamente su negocio.

7. REVISE REGULARMENTE: Revise el acuerdo peridicamente para asegurar que todava satisface las necesidades de ambas partes.

CONTRATO DE SERVICIOS vs. CONTRATO DE CONTRATISTA INDEPENDIENTE:

" CONTRATO DE SERVICIOS: Para servicios continuos y recurrentes (mantenimiento mensual, soporte, consultora)
" CONTRATO DE CONTRATISTA INDEPENDIENTE: Para proyectos especficos o compromisos nicos

Elija el tipo de acuerdo que mejor se ajuste a su relacin comercial.

CONSIDERACIONES ESPECFICAS POR ESTADO:

Diferentes estados pueden tener requisitos especficos para contratos de servicios, incluyendo:
" Divulgaciones requeridas para ciertos tipos de servicio
" Requisitos de licencia para proveedores de servicios
" Leyes de proteccin al consumidor para ciertos servicios
" Limitaciones en clusulas de responsabilidad o indemnizacin
" Regulaciones de contratistas de mejoras para el hogar
" Derechos especficos de cancelacin para consumidores

Siempre investigue los requisitos especficos de su estado o consulte con un abogado local.

REGULACIONES ESPECFICAS DE LA INDUSTRIA:

Ciertas industrias tienen requisitos legales y de cumplimiento especficos:
" Servicios de TI: Seguridad de datos, cumplimiento de privacidad, recuperacin ante desastres
" Atencin Mdica: Cumplimiento HIPAA, privacidad del paciente, responsabilidad mdica
" Servicios Financieros: Regulaciones de valores, deberes fiduciarios, cumplimiento
" Servicios Legales: Privilegio abogado-cliente, reglas ticas, conflicto de intereses
" Construccin/Contratacin: Licencias, permisos, gravmenes mecnicos, cdigos de construccin

Asegrese de que su acuerdo aborde los requisitos legales especficos de la industria.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Este Contrato de Servicios fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.`
};



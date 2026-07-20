// CONTRATO DE CONTRATISTA INDEPENDIENTE - TRADUCCIÓN AL ESPAÑOL
// Traducción profesional del contrato de contratista independiente

import { DocumentTemplate } from '../types/document';

export const independentContractorTemplateES: DocumentTemplate = {
  id: 'independent-contractor',
  name: 'Contrato de Contratista Independiente',
  description: 'Acuerdo profesional para contratar freelancers y contratistas independientes. Cumple con IRS con alcance de trabajo claro, términos de pago, derechos de propiedad intelectual y definición de estatus de contratista.',
  category: 'Negocios y Contratos',
  price: 9.99,
  fields: [
    // Client/Company Information
    {
      id: 'client_name',
      label: 'Nombre Legal Completo del Cliente/Empresa',
      type: 'text',
      required: true,
      helpText: 'La persona o empresa que CONTRATA al contratista'
    },
    {
      id: 'client_address',
      label: 'Dirección del Cliente/Empresa',
      type: 'textarea',
      required: true
    },
    {
      id: 'client_email',
      label: 'Correo electrónico del Cliente/Empresa',
      type: 'email',
      required: true
    },
    {
      id: 'client_phone',
      label: 'Teléfono del Cliente/Empresa',
      type: 'tel',
      required: false
    },
    {
      id: 'client_type',
      label: 'Tipo de Cliente/Empresa',
      type: 'select',
      options: ['Individual', 'Corporación', 'LLC', 'Sociedad', 'Otra Entidad Empresarial'],
      required: true
    },

    // Contractor Information
    {
      id: 'contractor_name',
      label: 'Nombre Legal Completo del Contratista',
      type: 'text',
      required: true,
      helpText: 'La persona o entidad que PROPORCIONA servicios'
    },
    {
      id: 'contractor_business_name',
      label: 'Nombre Comercial del Contratista (si aplica)',
      type: 'text',
      required: false,
      helpText: 'Nombre comercial registrado o nombre de entidad comercial'
    },
    {
      id: 'contractor_address',
      label: 'Dirección del Contratista',
      type: 'textarea',
      required: true
    },
    {
      id: 'contractor_email',
      label: 'Correo electrónico del Contratista',
      type: 'email',
      required: true
    },
    {
      id: 'contractor_phone',
      label: 'Teléfono del Contratista',
      type: 'tel',
      required: false
    },
    {
      id: 'contractor_ssn_ein',
      label: 'SSN o EIN del Contratista (Solo Últimos 4 Dígitos)',
      type: 'text',
      required: false,
      placeholder: 'Ej: XXXX',
      helpText: 'Para propósitos de reporte fiscal 1099. Solo incluye últimos 4 dígitos por seguridad.'
    },

    // Project/Services Information
    {
      id: 'services_description',
      label: 'Descripción Detallada de Servicios',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo: Servicios de desarrollo web incluyendo diseño, programación, pruebas y despliegue de sitio web e-commerce personalizado con integración de pasarela de pago.',
      helpText: 'Sé específico sobre qué servicios proporcionará el contratista'
    },
    {
      id: 'deliverables',
      label: 'Entregables Específicos',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo:\n- Sitio web e-commerce completamente funcional\n- Diseño responsivo para móviles\n- Panel de administración\n- Documentación de usuario',
      helpText: 'Lista todos los entregables esperados'
    },

    // Term and Duration
    {
      id: 'contract_type',
      label: 'Tipo de Duración del Contrato',
      type: 'select',
      options: [
        'Plazo Fijo - Fecha de Finalización Específica',
        'Basado en Proyecto - Hasta Completar',
        'Continuo - Hasta Terminar',
        'Plazo Fijo con Opción a Renovar'
      ],
      required: true
    },
    {
      id: 'end_date',
      label: 'Fecha de Finalización del Contrato (si es Plazo Fijo)',
      type: 'date',
      required: false,
      helpText: 'Solo si seleccionaste "Plazo Fijo"'
    },
    {
      id: 'estimated_completion',
      label: 'Fecha Estimada de Finalización (si es Basado en Proyecto)',
      type: 'date',
      required: false
    },

    // Compensation
    {
      id: 'payment_structure',
      label: 'Estructura de Pago',
      type: 'select',
      options: [
        'Tarifa Fija - Pago Único',
        'Tarifa Fija - Basada en Hitos',
        'Tarifa por Hora',
        'Retención Mensual',
        'Basado en Comisión',
        'Híbrido - Tarifa Fija + Por Hora'
      ],
      required: true
    },
    {
      id: 'fixed_fee',
      label: 'Monto de Tarifa Fija ($) - Si Aplica',
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
      id: 'monthly_retainer',
      label: 'Monto de Retención Mensual ($) - Si Aplica',
      type: 'currency',
      required: false
    },
    {
      id: 'payment_schedule',
      label: 'Cronograma/Términos de Pago',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo: 50% por adelantado, 25% a mitad, 25% al completar. Neto 15 días.',
      helpText: 'Cuándo y cómo se harán los pagos'
    },
    {
      id: 'expenses_reimbursement',
      label: 'Reembolso de Gastos',
      type: 'select',
      options: [
        'No - El contratista paga todos los gastos',
        'Sí - Solo gastos pre-aprobados',
        'Sí - Todos los gastos comerciales razonables'
      ],
      required: true
    },

    // Work Details
    {
      id: 'work_location',
      label: 'Ubicación de Trabajo',
      type: 'select',
      options: [
        'Remoto - Ubicación del Contratista',
        'En Sitio - Ubicación del Cliente',
        'Híbrido - Remoto y En Sitio',
        'Flexible - Según Necesidad'
      ],
      required: true
    },
    {
      id: 'work_hours',
      label: 'Horas/Horario de Trabajo',
      type: 'textarea',
      required: false,
      placeholder: 'Ejemplo: Horas flexibles, contratista establece su propio horario. Disponible para reuniones L-V 9am-5pm EST.',
      helpText: 'Describe disponibilidad esperada (pero recuerda: el contratista controla su horario)'
    },

    // Intellectual Property
    {
      id: 'ip_ownership',
      label: 'Propiedad de Propiedad Intelectual',
      type: 'select',
      options: [
        'Obra por encargo - Cliente posee toda la propiedad intelectual',
        'Cliente posee IP después del pago final',
        'Contratista retiene IP, Cliente obtiene licencia',
        'Propiedad Compartida/Conjunta'
      ],
      required: true,
      helpText: '¿Quién posee el producto de trabajo creado?'
    },

    // Confidentiality
    {
      id: 'confidentiality',
      label: 'Cláusula de Confidencialidad',
      type: 'select',
      options: [
        'Sí - Incluir términos estándar de confidencialidad',
        'No - No necesario para este proyecto'
      ],
      required: true
    },

    // Non-Compete and Non-Solicitation
    {
      id: 'non_compete',
      label: 'Cláusula de No Competencia (Usar con Precaución)',
      type: 'select',
      options: ['No', 'Sí'],
      required: true,
      helpText: 'Puede no ser exigible para contratistas independientes en muchos estados'
    },
    {
      id: 'non_compete_duration',
      label: 'Duración de No Competencia (Meses) - Si es Sí',
      type: 'number',
      required: false,
      placeholder: 'Ej: 6'
    },
    {
      id: 'non_solicitation',
      label: 'Cláusula de No Solicitación',
      type: 'select',
      options: ['No', 'Sí'],
      required: true,
      helpText: 'Previene que contratista solicite clientes/empleados'
    },
    {
      id: 'non_solicitation_duration',
      label: 'Duración de No Solicitación (Meses) - Si es Sí',
      type: 'number',
      required: false,
      placeholder: 'Ej: 12'
    },

    // Insurance
    {
      id: 'insurance_required',
      label: 'Requisitos de Seguro',
      type: 'select',
      options: [
        'No se requiere seguro',
        'Seguro de Responsabilidad General requerido',
        'Seguro de Responsabilidad Profesional (E&O) requerido',
        'Ambos: Responsabilidad General y Profesional requeridos'
      ],
      required: true
    },
    {
      id: 'insurance_amount',
      label: 'Cobertura Mínima de Seguro ($) - Si es Requerido',
      type: 'currency',
      required: false,
      placeholder: '1000000',
      helpText: 'Ejemplo: $1,000,000'
    },

    // Termination
    {
      id: 'termination_notice',
      label: 'Período de Aviso de Terminación',
      type: 'select',
      options: [
        'Inmediato - Cualquier parte puede terminar en cualquier momento',
        '7 Días de Aviso por Escrito',
        '14 Días de Aviso por Escrito',
        '30 Días de Aviso por Escrito',
        '60 Días de Aviso por Escrito'
      ],
      required: true
    },

    // Governing Law
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

    // Additional Terms
    {
      id: 'additional_terms',
      label: 'Términos Adicionales/Provisiones Especiales (Opcional)',
      type: 'textarea',
      required: false,
      placeholder: 'Cualquier condición especial o cláusulas adicionales'
    },
  ],

  template: `CONTRATO DE CONTRATISTA INDEPENDIENTE

ESTE CONTRATO DE CONTRATISTA INDEPENDIENTE (el "Contrato") se celebra este día {{current_day}} de {{current_month}} de {{current_year}} (la "Fecha Efectiva"), entre:

CLIENTE:
{{client_name}}
{{client_address}}
Correo electrónico: {{client_email}}
{{#if client_phone}}Teléfono: {{client_phone}}{{/if}}
Tipo: {{client_type}}
(en adelante denominado "Cliente" o "Empresa")

y

CONTRATISTA:
{{contractor_name}}
{{#if contractor_business_name}}Nombre Comercial: {{contractor_business_name}}{{/if}}
{{contractor_address}}
Correo electrónico: {{contractor_email}}
{{#if contractor_phone}}Teléfono: {{contractor_phone}}{{/if}}
{{#if contractor_ssn_ein}}ID Fiscal (últimos 4): XXXXX{{contractor_ssn_ein}}{{/if}}
(en adelante denominado "Contratista")

(Cada parte puede ser referida individualmente como una "Parte" y colectivamente como las "Partes".)

CONSIDERANDOS

CONSIDERANDO QUE, el Cliente desea contratar al Contratista para proporcionar ciertos servicios; y

CONSIDERANDO QUE, el Contratista declara que está calificado y dispuesto a proporcionar dichos servicios bajo los términos y condiciones establecidos aquí; y

CONSIDERANDO QUE, las Partes pretenden que el Contratista preste servicios como contratista independiente y no como empleado del Cliente.

AHORA, POR LO TANTO, en consideración de los convenios y acuerdos mutuos contenidos aquí, y por otra consideración buena y valiosa, cuya recepción y suficiencia se reconocen por la presente, las Partes acuerdan lo siguiente:

1. SERVICIOS Y ENTREGABLES

1.1. ALCANCE DE SERVICIOS. El Contratista acuerda proporcionar los siguientes servicios (los "Servicios"):

{{services_description}}

1.2. ENTREGABLES. El Contratista entregará los siguientes productos de trabajo específicos (los "Entregables"):

{{deliverables}}

1.3. ESTÁNDAR DE DESEMPEÑO. El Contratista realizará todos los Servicios de manera profesional y competente, consistente con los estándares y mejores prácticas de la industria.

2. PLAZO Y TERMINACIÓN

2.1. PLAZO. Este Contrato comenzará el {{start_date}} y continuará hasta:
   {{contract_type}}
   {{#if end_date}}Fecha de Finalización: {{end_date}}{{/if}}

{{#if estimated_completion}}
2.2. FINALIZACIÓN ESTIMADA. Las Partes anticipan que los Servicios se completarán para el {{estimated_completion}}. Esto es solo un estimado.
{{/if}}

2.3. TERMINACIÓN POR CONVENIENCIA. Cualquiera de las Partes puede terminar este Contrato proporcionando aviso por escrito: {{termination_notice}}

3. ESTATUS DE CONTRATISTA INDEPENDIENTE

3.1. RELACIÓN DE PARTES. El Contratista es un contratista independiente y no un empleado del Cliente.

3.2. EL CONTRATISTA RECONOCE Y ACUERDA:
   (a) El Contratista tiene el derecho de controlar el tiempo, lugar, manera y medios de realizar los Servicios;
   (b) El Contratista es responsable de todos los impuestos;
   (c) El Contratista no tiene derecho a beneficios de empleado;
   (d) El Cliente emitirá el Formulario 1099-NEC del IRS si los pagos superan $600 en un año calendario;
   (e) El Contratista puede contratar a otros clientes.

3.3. UBICACIÓN Y HORARIO.
   Ubicación: {{work_location}}
   {{#if work_hours}}Horario: {{work_hours}}{{/if}}

   El Contratista retiene el derecho de determinar su propio horario de trabajo.

4. COMPENSACIÓN Y PAGO

4.1. ESTRUCTURA DE PAGO. El Cliente compensará al Contratista de la siguiente manera:
   Tipo de Pago: {{payment_structure}}
   {{#if fixed_fee}}Tarifa Fija: USD {{fixed_fee}}{{/if}}
   {{#if hourly_rate}}Tarifa por Hora: USD {{hourly_rate}} por hora{{/if}}
   {{#if monthly_retainer}}Retención Mensual: USD {{monthly_retainer}} por mes{{/if}}

4.2. TÉRMINOS DE PAGO. El pago se realizará según el siguiente cronograma:
   {{payment_schedule}}

4.3. GASTOS. {{expenses_reimbursement}}
   Si los gastos son reembolsables, el Contratista debe obtener la aprobación previa por escrito del Cliente para gastos que excedan montos razonables. El Contratista deberá proporcionar recibos para todos los gastos reembolsables.

4.4. SIN BENEFICIOS DE EMPLEADO. El Contratista reconoce que no tiene derecho a ningún beneficio de empleado.

5. DERECHOS DE PROPIEDAD INTELECTUAL

5.1. PROPIEDAD DEL PRODUCTO DE TRABAJO.
   Modelo de Propiedad de IP: {{ip_ownership}}

   Todo el producto de trabajo se manejará según el modelo de propiedad seleccionado anteriormente.

5.2. MATERIALES PREEXISTENTES. El Contratista retiene todos los derechos sobre cualquier material preexistente.

6. CONFIDENCIALIDAD

Términos de Confidencialidad: {{confidentiality}}

Si aplican protecciones de confidencialidad, la Parte Receptora acuerda mantener toda Información Confidencial en estricta confidencialidad.

7. NO COMPETENCIA Y NO SOLICITACIÓN

No Competencia: {{non_compete}}
{{#if non_compete_duration}}Duración: {{non_compete_duration}} meses{{/if}}

No Solicitación: {{non_solicitation}}
{{#if non_solicitation_duration}}Duración: {{non_solicitation_duration}} meses{{/if}}

8. INDEMNIZACIÓN

8.1. El Contratista indemnizará al Cliente contra cualquier reclamo que surja del incumplimiento del Contratista, negligencia, o infracción de propiedad intelectual.

9. SEGURO

Requisitos de Seguro: {{insurance_required}}
{{#if insurance_amount}}Cobertura Mínima: USD {{insurance_amount}}{{/if}}

Si se requiere seguro, el Contratista obtendrá y mantendrá la cobertura por su cuenta.

10. DISPOSICIONES GENERALES

10.1. LEY APLICABLE. Este Contrato se regirá por las leyes del Estado de {{governing_state}}.

10.2. ACUERDO COMPLETO. Este Contrato constituye el acuerdo completo entre las Partes.

10.3. MODIFICACIÓN. Este Contrato no puede ser modificado excepto por escrito firmado por ambas Partes.

{{#if additional_terms}}
11. TÉRMINOS ADICIONALES

{{additional_terms}}
{{/if}}

EN FE DE LO CUAL, las Partes han ejecutado este Contrato de Contratista Independiente en la fecha indicada arriba.

CLIENTE:

_________________________________
{{client_name}}

Firma: _______________________

Fecha: ___________________________


CONTRATISTA:

_________________________________
{{contractor_name}}
{{#if contractor_business_name}}{{contractor_business_name}}{{/if}}

Firma: _______________________

Fecha: ___________________________


RECONOCIMIENTO DEL CONTRATISTA

Yo, {{contractor_name}}, reconozco y confirmo que:

✓ Soy un contratista independiente y no un empleado de {{client_name}}
✓ Soy responsable de pagar todos los impuestos federales, estatales y locales
✓ No tengo derecho a beneficios de empleado
✓ Controlo la manera y medios de realizar mi trabajo
✓ Puedo trabajar para otros clientes
✓ Recibiré el Formulario 1099-NEC del IRS (si los pagos superan $600/año)
✓ He leído y entendido todos los términos de este Contrato

_________________________________
Iniciales del Contratista

Fecha: ___________________________


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

AVISO IMPORTANTE DEL IRS Y LEGAL:

CLASIFICACIÓN CONTRATISTA INDEPENDIENTE vs. EMPLEADO:

El IRS y el Departamento de Trabajo usan pruebas específicas para determinar si un trabajador es contratista independiente o empleado. La clasificación incorrecta puede resultar en multas significativas, impuestos atrasados y responsabilidad legal.

FACTORES CLAVE QUE EL IRS CONSIDERA:

1. CONTROL CONDUCTUAL: ¿La empresa controla cómo el trabajador hace su trabajo?
   • Los contratistas independientes controlan sus propios métodos de trabajo y horario
   • A los empleados se les dice cuándo, dónde y cómo trabajar

2. CONTROL FINANCIERO: ¿La empresa controla aspectos comerciales del trabajo?
   • Los contratistas independientes tienen gastos no reembolsados, invierten en equipo y pueden obtener ganancia o pérdida
   • Los empleados son reembolsados por gastos y reciben salarios regulares garantizados

3. RELACIÓN: ¿Cuál es la naturaleza de la relación?
   • Los contratistas independientes tienen contratos escritos, sin beneficios, y el trabajo es temporal o basado en proyectos
   • Los empleados reciben beneficios, tienen relaciones continuas y realizan funciones comerciales principales

MEJORES PRÁCTICAS PARA MANTENER ESTATUS DE CONTRATISTA INDEPENDIENTE:

• Use contratos escritos que establezcan claramente el estatus de contratista independiente
• Pague por proyecto o factura, no por hora/salario con cheques de pago regulares
• No proporcione equipo, espacio de oficina o herramientas
• No establezca las horas de trabajo del contratista
• Permita que el contratista trabaje para otros clientes
• No proporcione beneficios de empleado
• Emita el Formulario 1099-NEC (no W-2)
• Use contratistas para proyectos especializados, no funciones comerciales continuas

CONSULTE A UN ABOGADO: Esta plantilla se proporciona solo con fines informativos y no constituye asesoramiento legal o fiscal. Las leyes de clasificación de empleo varían por estado y pueden ser complejas. Consulte con un abogado licenciado y profesional de impuestos antes de usar este acuerdo para garantizar el cumplimiento con las leyes federales y estatales.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""`
};

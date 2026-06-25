// PLANTILLA PROFESIONAL DE PAGAR0
// Promesa legalmente vinculante de pagar un prstamo con intereses y trminos de pago
// Para prstamos personales, prstamos comerciales y acuerdos de pago

import { DocumentTemplate } from '../types/document';

export const promissoryNoteTemplateES: DocumentTemplate = {
  id: 'promissory-note',
  name: 'Pagar',
  description: 'Promesa escrita legalmente vinculante de pagar un prstamo con tasa de inters, calendario de pagos y trminos especificados. Perfecto para prstamos personales entre familia/amigos, prstamos para pequeas empresas o acuerdos de prstamo formales. Incluye opciones para prstamos garantizados/no garantizados, tarifas por mora y trminos de pago anticipado.',
  category: 'Financiero y Legal',
  price: 7.00,
  fields: [
    // Monto del Prstamo y Fecha
    { 
      id: 'loan_amount', 
      label: 'Monto Principal del Prstamo ($)', 
      type: 'currency', 
      required: true,
      helpText: 'La cantidad total que se est prestando (sin intereses)'
    },
    { 
      id: 'loan_date', 
      label: 'Fecha del Prstamo', 
      type: 'date', 
      required: true,
      helpText: 'Fecha en que se hace el prstamo y cambia el dinero de manos'
    },
    
    // Informacin del Prestatario (Persona que RECIBE el dinero)
    { 
      id: 'borrower_name', 
      label: 'Nombre Legal Completo del Prestatario', 
      type: 'text', 
      required: true,
      helpText: 'La persona que RECIBE el prstamo (quien debe el dinero)'
    },
    { 
      id: 'borrower_address', 
      label: 'Direccin del Prestatario', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'borrower_email', 
      label: 'Correo electrnico del Prestatario', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'borrower_phone', 
      label: 'Telfono del Prestatario', 
      type: 'tel', 
      required: false 
    },
    { 
      id: 'borrower_ssn_last4', 
      label: 'altimos 4 Dgitos del SSN del Prestatario (Opcional)', 
      type: 'text', 
      required: false,
      helpText: 'Solo para propsitos de identificacin (opcional pero recomendado)'
    },
    
    // Informacin del Prestamista (Persona que DA el dinero)
    { 
      id: 'lender_name', 
      label: 'Nombre Legal Completo del Prestamista', 
      type: 'text', 
      required: true,
      helpText: 'La persona que DA el prstamo (a quien se le debe el dinero)'
    },
    { 
      id: 'lender_address', 
      label: 'Direccin del Prestamista', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'lender_email', 
      label: 'Correo electrnico del Prestamista', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'lender_phone', 
      label: 'Telfono del Prestamista', 
      type: 'tel', 
      required: false 
    },
    
    // Tasa de Inters
    { 
      id: 'interest_rate', 
      label: 'Tasa de Inters Anual (%)', 
      type: 'text', 
      required: true,
      placeholder: '0',
      helpText: 'Ingrese 0 para prstamo sin inters, o el porcentaje (ej. 5 para 5% anual)'
    },
    { 
      id: 'interest_type', 
      label: 'Mtodo de Clculo de Inters', 
      type: 'select',
      options: [
        'Inters Simple',
        'Inters Compuesto (Mensual)',
        'Inters Compuesto (Anual)',
        'Sin Inters (0%)'
      ],
      required: true,
      helpText: 'El inters simple es ms comn para prstamos personales'
    },
    
    // Trminos de Pago
    { 
      id: 'payment_structure', 
      label: 'Estructura de Pago', 
      type: 'select',
      options: [
        'Suma Global - Un solo pago en la fecha de vencimiento',
        'Cuotas Mensuales - Monto fijo cada mes',
        'Cuotas Quincenales',
        'Cuotas Trimestrales',
        'Cuotas Anuales',
        'Pagos Solo de Inters con Pago Global',
        'Calendario de Pago Personalizado'
      ],
      required: true 
    },
    { 
      id: 'installment_amount', 
      label: 'Monto de Cuota ($) - Si Aplica', 
      type: 'currency', 
      required: false,
      helpText: 'Monto de cada pago regular (si usa cuotas)'
    },
    { 
      id: 'number_of_payments', 
      label: 'Nmero de Pagos - Si Aplica', 
      type: 'text', 
      required: false,
      placeholder: '12',
      helpText: 'Nmero total de cuotas'
    },
    { 
      id: 'first_payment_date', 
      label: 'Fecha de Vencimiento del Primer Pago - Si Aplica', 
      type: 'date', 
      required: false,
      helpText: 'Fecha en que vence la primera cuota'
    },
    { 
      id: 'payment_day', 
      label: 'Da de Vencimiento del Mes - Si Aplica', 
      type: 'select',
      options: [
        '1 de cada mes', '5 de cada mes', '10 de cada mes',
        '15 de cada mes', '20 de cada mes', '25 de cada mes',
        'altimo da de cada mes', 'Otro - Ver calendario personalizado'
      ],
      required: false,
      helpText: 'Para pagos mensuales'
    },
    { 
      id: 'maturity_date', 
      label: 'Fecha de Vencimiento (Fecha Final de Pago)', 
      type: 'date', 
      required: true,
      helpText: 'Fecha en que el prstamo debe estar completamente pagado'
    },
    
    // Mtodo de Pago
    { 
      id: 'payment_method', 
      label: 'Mtodos de Pago Aceptados', 
      type: 'select',
      options: [
        'Cheque o Giro Postal',
        'Transferencia bancaria',
        'ACH / Depsito Directo',
        'Efectivo',
        'PayPal o Venmo',
        'Zelle o Cash App',
        'Cualquiera de los Anteriores'
      ],
      required: true 
    },
    { 
      id: 'payment_address', 
      label: 'Direccin de Envo de Pagos (si aplica)', 
      type: 'textarea', 
      required: false,
      helpText: 'Dnde enviar cheques o giros postales'
    },
    
    // Trminos de Pago Anticipado
    { 
      id: 'prepayment_allowed', 
      label: 'Se Permite Pago Anticipado (Pago Adelantado)?', 
      type: 'select',
      options: [
        'S - Sin penalizacin por pago anticipado',
        'S - Con penalizacin por pago anticipado',
        'No - Debe seguir el calendario de pagos exactamente'
      ],
      required: true,
      helpText: 'Puede el prestatario pagar el prstamo antes?'
    },
    { 
      id: 'prepayment_penalty', 
      label: 'Penalizacin por Pago Anticipado (si aplica)', 
      type: 'text', 
      required: false,
      placeholder: 'Ejemplo: 2% del principal restante',
      helpText: 'Tarifa por pagar el prstamo antes de tiempo'
    },
    
    // Trminos de Pago Tardo
    { 
      id: 'late_payment_fee', 
      label: 'Tarifa por Pago Tardo', 
      type: 'select',
      options: [
        'Sin tarifas por mora',
        'Tarifa fija de $25',
        'Tarifa fija de $50',
        'Tarifa fija de $100',
        '5% del pago perdido',
        '10% del pago perdido',
        'Trminos personalizados de tarifa por mora'
      ],
      required: true 
    },
    { 
      id: 'grace_period', 
      label: 'Perodo de Gracia Antes de Tarifa por Mora', 
      type: 'select',
      options: [
        'Sin perodo de gracia - Tarifa aplica inmediatamente',
        'Perodo de gracia de 5 das',
        'Perodo de gracia de 10 das',
        'Perodo de gracia de 15 das',
        'Perodo de gracia de 30 das'
      ],
      required: true 
    },
    { 
      id: 'default_interest_rate', 
      label: 'Tasa de Inters por Incumplimiento (%) - Si Se Pierde Pago', 
      type: 'text', 
      required: false,
      placeholder: 'Ejemplo: 18',
      helpText: 'Tasa de inters ms alta que aplica si el prestatario incumple (opcional)'
    },
    
    // Seguridad/Garanta
    { 
      id: 'secured_loan', 
      label: 'Este Prstamo Est Garantizado por Colateral?', 
      type: 'select',
      options: [
        'No - Prstamo no garantizado (sin colateral)',
        'S - Garantizado por propiedad/activo especfico'
      ],
      required: true,
      helpText: 'Los prstamos garantizados permiten al prestamista embargar el colateral si no se paga'
    },
    { 
      id: 'collateral_description', 
      label: 'Descripcin del Colateral (si est garantizado)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Ejemplo: Honda Accord 2020, VIN: 1HGCV1F3XLA123456\nO: Propiedad inmobiliaria ubicada en 123 Main St, Ciudad, Estado',
      helpText: 'Descripcin detallada de la propiedad que garantiza el prstamo'
    },
    { 
      id: 'collateral_value', 
      label: 'Valor Estimado del Colateral ($) - Si Est Garantizado', 
      type: 'currency', 
      required: false 
    },
    
    // Clusula de Aceleracin
    { 
      id: 'acceleration_clause', 
      label: 'Incluir Clusula de Aceleracin?', 
      type: 'select',
      options: [
        'S - Saldo completo debido inmediatamente al incumplir',
        'No - Continuar con calendario de pagos incluso si se pierde un pago'
      ],
      required: true,
      helpText: 'Permite al prestamista exigir pago completo si el prestatario incumple'
    },
    
    // Co-firmante/Garante
    { 
      id: 'cosigner_required', 
      label: 'Hay un Co-firmante/Garante?', 
      type: 'select',
      options: ['No', 'S'],
      required: true 
    },
    { 
      id: 'cosigner_name', 
      label: 'Nombre Legal Completo del Co-firmante', 
      type: 'text', 
      required: false,
      helpText: 'Persona que garantiza el pago si el prestatario incumple'
    },
    { 
      id: 'cosigner_address', 
      label: 'Direccin del Co-firmante', 
      type: 'textarea', 
      required: false 
    },
    { 
      id: 'cosigner_phone', 
      label: 'Telfono del Co-firmante', 
      type: 'tel', 
      required: false 
    },
    
    // Propsito del Prstamo
    { 
      id: 'loan_purpose', 
      label: 'Propsito del Prstamo (Opcional)', 
      type: 'select',
      options: [
        'No Especificado',
        'Gastos Personales/Familiares',
        'Gastos Comerciales',
        'Compra de Vehculo',
        'Mejoras al Hogar',
        'Educacin/Matrcula',
        'Consolidacin de Deudas',
        'Gastos Mdicos',
        'Compra de Bienes Races',
        'Otro'
      ],
      required: false,
      helpText: 'Para qu se usar el prstamo (opcional pero recomendado)'
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
      required: true,
      helpText: 'Ley estatal que regir este pagar'
    },
    
    // Trminos Adicionales
    { 
      id: 'additional_terms', 
      label: 'Trminos o Condiciones Adicionales (Opcional)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Cualquier condicin especial, restricciones o acuerdos adicionales'
    },
  ],
  
  template: `PAGAR0

Monto Principal: USD {{loan_amount}}
Fecha del Prstamo: {{loan_date}}

POR VALOR RECIBIDO, el abajo firmante ("Prestatario" o "Librador") promete pagar a la orden de ("Prestamista" o "Beneficiario") la suma principal de {{loan_amount}} Dlares de los Estados Unidos (USD {{loan_amount}}), junto con intereses y otros cargos segn se establece a continuacin.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PRESTATARIO (Persona que Recibe el Prstamo / Debe el Dinero):

Nombre: {{borrower_name}}
Direccin: {{borrower_address}}
{{#if borrower_email}}Correo electrnico: {{borrower_email}}{{/if}}
{{#if borrower_phone}}Telfono: {{borrower_phone}}{{/if}}
{{#if borrower_ssn_last4}}SSN (altimos 4): XXX-XX-{{borrower_ssn_last4}}{{/if}}

(En adelante denominado "Prestatario" o "Librador")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PRESTAMISTA (Persona que Da el Prstamo / Se le Debe el Dinero):

Nombre: {{lender_name}}
Direccin: {{lender_address}}
{{#if lender_email}}Correo electrnico: {{lender_email}}{{/if}}
{{#if lender_phone}}Telfono: {{lender_phone}}{{/if}}

(En adelante denominado "Prestamista" o "Beneficiario")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

T0RMINOS DEL PR0STAMO

1. MONTO PRINCIPAL
   El monto principal de este prstamo es: USD {{loan_amount}}

2. FECHA DEL PR0STAMO
   Este prstamo se hace el: {{loan_date}}

{{#if loan_purpose}}
3. PROPSITO DEL PR0STAMO
   El propsito de este prstamo es: {{loan_purpose}}
   
   Esta declaracin de propsito es solo para fines informativos y no limita el uso de los fondos por parte del Prestatario ni crea obligaciones adicionales.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

INTER0S

4. TASA DE INTER0S
   Tasa de Inters Anual: {{interest_rate}}%
   Mtodo de Clculo de Inters: {{interest_type}}

{{#if interest_rate}}
   El inters se acumular desde la Fecha del Prstamo hasta que el principal y todos los intereses acumulados se paguen en su totalidad. El inters se calcular usando el mtodo de {{interest_type}}.
   
   {{#if interest_type}}
   {{#if interest_type "Inters Simple"}}
   Frmula de Inters Simple: Inters = Principal  Tasa  Tiempo
   Ejemplo: Para un prstamo de USD 10,000 al 5% por 1 ao = USD 500 en intereses
   {{/if}}
   {{/if}}
{{else}}
   SIN INTER0S: Este es un prstamo sin intereses. No se acumularn intereses sobre el saldo principal.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

T0RMINOS DE PAGO

5. ESTRUCTURA DE PAGO
   {{payment_structure}}

{{#if installment_amount}}
6. CUOTAS
   Monto de Cuota: USD {{installment_amount}}
   {{#if number_of_payments}}Nmero de Pagos: {{number_of_payments}}{{/if}}
   {{#if first_payment_date}}Primer Pago Vence: {{first_payment_date}}{{/if}}
   {{#if payment_day}}Pago Vence: {{payment_day}}{{/if}}
   
   El Prestatario har cuotas regulares de USD {{installment_amount}} cada una, continuando hasta que todo el saldo principal y todos los intereses acumulados se paguen en su totalidad.
{{/if}}

7. FECHA DE VENCIMIENTO (FECHA FINAL DE PAGO)
   Todo el saldo principal pendiente y todos los intereses acumulados vencern y sern pagaderos en su totalidad en o antes de: {{maturity_date}}
   
   Esta es la fecha final absoluta en la que el prstamo debe estar completamente pagado. Si queda algn saldo sin pagar despus de esta fecha, el Prestatario estar en incumplimiento.

8. M0TODO DE PAGO
   Los pagos se harn mediante: {{payment_method}}
   
{{#if payment_address}}
   Direccin de Envo de Pagos:
   {{payment_address}}
{{/if}}
   
   Todos los pagos se harn en moneda de los Estados Unidos. Los pagos se aplicarn primero a cualquier inters acumulado, tarifas por mora y otros cargos, y el resto se aplicar al principal.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PAGO ANTICIPADO

9. DERECHOS DE PAGO ANTICIPADO
   {{prepayment_allowed}}
   
{{#if prepayment_allowed}}
   {{#if prepayment_penalty}}
   Penalizacin por Pago Anticipado: {{prepayment_penalty}}
   
   Si el Prestatario elige pagar el prstamo antes de la Fecha de Vencimiento, el Prestatario pagar la penalizacin por pago anticipado especificada arriba adems del principal pendiente y los intereses acumulados.
   {{else}}
   El Prestatario puede pagar anticipadamente todo o cualquier parte del saldo principal en cualquier momento sin penalizacin. Los pagos anticipados se aplicarn al principal y reducirn los cargos de inters futuros en consecuencia.
   {{/if}}
{{else}}
   El Prestatario NO puede pagar anticipadamente este prstamo. Todos los pagos deben hacerse de acuerdo con el calendario de pagos. Los pagos anticipados no reducirn el inters total adeudado.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PAGOS TARDOS E INCUMPLIMIENTO

10. TARIFA POR PAGO TARDO
    {{late_payment_fee}}
    
    Perodo de Gracia: {{grace_period}}
    
    Si algn pago no se recibe dentro del perodo de gracia despus de la fecha de vencimiento, el Prestatario pagar la tarifa por mora especificada arriba adems del monto de pago regular.

{{#if default_interest_rate}}
11. TASA DE INTER0S POR INCUMPLIMIENTO
    Si el Prestatario est en incumplimiento bajo este Pagar, la tasa de inters aumentar a {{default_interest_rate}}% anual (la "Tasa de Incumplimiento") sobre todo el saldo pendiente hasta que se cure el incumplimiento.
    
    La Tasa de Incumplimiento se aplicar desde la fecha de incumplimiento hasta que el Prestatario ya no est en incumplimiento.
{{/if}}

12. INCUMPLIMIENTO
    El Prestatario estar en incumplimiento bajo este Pagar si ocurre cualquiera de lo siguiente:
    
    (a) El Prestatario no hace algn pago cuando vence y no cura el pago perdido dentro de treinta (30) das despus de recibir aviso por escrito del Prestamista;
    
    (b) El Prestatario no paga todo el saldo pendiente en la Fecha de Vencimiento;
    
    (c) El Prestatario se vuelve insolvente, declara bancarrota o hace una cesin en beneficio de acreedores;
    
    (d) El Prestatario muere o se vuelve legalmente incapacitado (a menos que un co-firmante o garante haya acordado asumir la obligacin);
    
    {{#if secured_loan}}
    (e) El Prestatario vende, transfiere o grava el colateral que garantiza este Pagar sin el consentimiento previo por escrito del Prestamista;
    
    (f) El colateral es destruido, daado o disminuye significativamente en valor;
    {{/if}}
    
    (g) Cualquier declaracin o garanta hecha por el Prestatario en conexin con este Pagar resulta haber sido falsa o engaosa cuando se hizo.

13. CLUSULA DE ACELERACIN
    {{acceleration_clause}}
    
{{#if acceleration_clause}}
    Al incumplir, el Prestamista puede, a opcin del Prestamista, declarar todo el saldo principal no pagado, junto con todos los intereses acumulados y otros cargos, inmediatamente debido y pagadero sin aviso o demanda adicional.
    
    Esto significa que si el Prestatario pierde incluso un pago y no lo cura dentro del perodo de aviso, el Prestamista puede exigir pago inmediato de TODO el saldo restante del prstamo, no solo el pago perdido.
{{else}}
    Incluso si el Prestatario pierde un pago, el Prestamista no puede acelerar el prstamo. El Prestatario continuar haciendo pagos de acuerdo con el calendario original, ms cualquier tarifa por mora e inters por incumplimiento aplicable.
{{/if}}

14. REMEDIOS AL INCUMPLIR
    Si el Prestatario incumple bajo este Pagar, el Prestamista tendr los siguientes remedios:
    
    (a) Exigir pago inmediato de todos los montos adeudados (si aplica clusula de aceleracin);
    
    (b) Cobrar la Tasa de Inters por Incumplimiento (si aplica);
    
    (c) Evaluar tarifas por mora y otros cargos segn se establece en este Pagar;
    
    (d) Reportar el incumplimiento a las agencias de crdito, lo que puede afectar negativamente el puntaje de crdito del Prestatario;
    
    {{#if secured_loan}}
    (e) Tomar posesin y vender el colateral para satisfacer la deuda;
    {{/if}}
    
    (f) Buscar accin legal para cobrar la deuda, incluyendo presentar una demanda;
    
    (g) Buscar un juicio contra el Prestatario por el monto completo adeudado ms intereses, costos y honorarios razonables de abogados;
    
    (h) Embargar los salarios o cuentas bancarias del Prestatario (si est permitido por ley);
    
    (i) Ejercer cualquier otro derecho disponible bajo la ley aplicable.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

SEGURIDAD / COLATERAL

15. INTER0S DE SEGURIDAD
    {{secured_loan}}

{{#if collateral_description}}
    Este Pagar est GARANTIZADO por el siguiente colateral:
    
    {{collateral_description}}
    
    {{#if collateral_value}}Valor Estimado: USD {{collateral_value}}{{/if}}
    
    ACUERDO DE SEGURIDAD: Al firmar este Pagar, el Prestatario otorga al Prestamista un inters de seguridad en el colateral descrito arriba. El Prestatario declara y garantiza que:
    
    (a) El Prestatario es el propietario legal del colateral y tiene pleno derecho de pignorarlo como garanta;
    (b) El colateral est libre de cualquier otro gravamen o carga (a menos que se divulgue al Prestamista);
    (c) El Prestatario mantendr el colateral en buenas condiciones;
    (d) El Prestatario mantendr el colateral adecuadamente asegurado;
    (e) El Prestatario no vender, transferir o gravar ms el colateral sin el consentimiento previo por escrito del Prestamista.
    
    DERECHOS DEL PRESTAMISTA AL INCUMPLIR: Si el Prestatario incumple, el Prestamista puede tomar posesin del colateral y venderlo en venta pblica o privada. El Prestamista puede aplicar los ingresos de la venta a la deuda pendiente. Si los ingresos de la venta exceden la deuda, el Prestamista pagar el excedente al Prestatario. Si los ingresos son insuficientes, el Prestatario permanece responsable por la deficiencia.
    
    PERFECCIN DEL INTER0S DE SEGURIDAD: Las Partes reconocen que este Pagar puede necesitar ser complementado con documentos adicionales (como una declaracin de financiamiento UCC-1 para propiedad personal o una hipoteca/escritura de fideicomiso para bienes inmuebles) para perfeccionar adecuadamente el inters de seguridad del Prestamista bajo la ley aplicable.
{{else}}
    Este Pagar NO EST GARANTIZADO. El Prestatario no ha pignado ningn colateral para garantizar el pago. Si el Prestatario incumple, los remedios del Prestamista se limitan a accin legal para cobro y juicio.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

CO-FIRMANTE / GARANTE

16. CO-FIRMANTE
    Co-firmante/Garante: {{cosigner_required}}

{{#if cosigner_name}}
    INFORMACIN DEL CO-FIRMANTE:
    Nombre: {{cosigner_name}}
    Direccin: {{cosigner_address}}
    {{#if cosigner_phone}}Telfono: {{cosigner_phone}}{{/if}}
    
    GARANTA: El abajo firmante Co-firmante/Garante ("Co-firmante") garantiza incondicionalmente el pago completo y oportuno de todos los montos adeudados bajo este Pagar. El Co-firmante acuerda ser responsable conjunta y solidariamente con el Prestatario por todas las obligaciones bajo este Pagar.
    
    Esto significa:
    " El Prestamista puede exigir pago del Co-firmante sin primero intentar cobrar del Prestatario
    " El Co-firmante es igualmente responsable por toda la deuda
    " El crdito del Co-firmante puede ser afectado si el Prestatario incumple
    " El Co-firmante renuncia a cualquier defensa basada en incapacidad del Prestatario, bancarrota u otras defensas
    
    El Co-firmante permanece responsable incluso si:
    " El Prestamista otorga extensiones o modificaciones al Prestatario
    " El Prestamista libera o perjudica cualquier colateral
    " El Prestamista demora en hacer cumplir derechos contra el Prestatario
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DISPOSICIONES GENERALES

17. LEY APLICABLE
    Este Pagar se regir e interpretar de acuerdo con las leyes del Estado de {{governing_state}}, sin consideracin a sus principios de conflicto de leyes.

18. JURISDICCIN Y COMPETENCIA
    Cualquier accin legal para hacer cumplir este Pagar se presentar en los tribunales estatales o federales ubicados en {{governing_state}}. El Prestatario consiente a la jurisdiccin de dichos tribunales y renuncia a cualquier objecin a la competencia.

19. HONORARIOS DE ABOGADOS Y COSTOS
    Si el Prestamista debe tomar accin legal para cobrar montos adeudados bajo este Pagar, el Prestatario pagar todos los costos de cobro, incluyendo honorarios razonables de abogados, costos judiciales, tarifas de agencia de cobro y otros gastos incurridos por el Prestamista.

20. RENUNCIA
    Ninguna demora u omisin por parte del Prestamista en ejercer cualquier derecho bajo este Pagar constituir una renuncia a ese derecho o cualquier otro derecho. Una renuncia en una ocasin no constituir una renuncia en cualquier ocasin futura.

21. DIVISIBILIDAD
    Si cualquier disposicin de este Pagar se considera invlida, ilegal o inaplicable, las disposiciones restantes continuarn en pleno vigor y efecto.

22. ENMIENDAS
    Este Pagar no puede ser enmendado, modificado o complementado excepto por un acuerdo escrito firmado tanto por el Prestatario como por el Prestamista.

23. AVISOS
    Todos los avisos requeridos bajo este Pagar sern por escrito y entregados a las direcciones establecidas arriba (o a otras direcciones que una parte pueda designar por escrito). Los avisos pueden ser entregados mediante:
    (a) Entrega personal;
    (b) Correo certificado, recibo de devolucin solicitado;
    (c) Servicio de mensajera nocturna;
    (d) Correo electrnico (con confirmacin de recibo).

24. ACUERDO COMPLETO
    Este Pagar constituye el acuerdo completo entre el Prestatario y el Prestamista respecto a este prstamo y reemplaza todas las discusiones, negociaciones y acuerdos previos.

25. SUCESORES Y CESIONARIOS
    Este Pagar ser vinculante para el Prestatario y los herederos, albaceas, administradores y representantes legales del Prestatario. Este Pagar beneficiar al Prestamista y a los sucesores y cesionarios del Prestamista.
    
    El Prestamista puede vender, transferir o ceder este Pagar y cualquier inters de seguridad sin el consentimiento del Prestatario. El Prestatario NO puede transferir o ceder ninguna obligacin bajo este Pagar sin el consentimiento previo por escrito del Prestamista.

26. RESPONSABILIDAD CONJUNTA Y SOLIDARIA
    Si ms de una persona firma este Pagar como Prestatario, cada persona ser responsable conjunta y solidariamente por el monto completo de la deuda. Esto significa que el Prestamista puede cobrar el monto completo de cualquier Prestatario.

27. CLUSULA DE SALVAGUARDA DE USURA
    Es la intencin de las partes cumplir con todas las leyes de usura aplicables. Si cualquier disposicin de este Pagar resultara en una tasa de inters que exceda la tasa mxima permitida por ley, la tasa de inters se reducir automticamente a la tasa legal mxima. Cualquier monto cobrado en exceso del mximo legal ser reembolsado al Prestatario o acreditado contra el saldo principal.

28. SIN MODIFICACIONES ORALES
    Este es un contrato escrito. Cualquier declaracin, promesa o representacin oral no contenida en este Pagar escrito no es vinculante. Este Pagar solo puede ser modificado por un documento escrito firmado por ambas partes.

29. CONTRAPARTES
    Este Pagar puede ejecutarse en contrapartes, cada una de las cuales ser considerada un original y todas juntas constituirn un solo instrumento. Las firmas electrnicas tendrn el mismo efecto que las firmas originales.

30. RENUNCIA A JUICIO POR JURADO
    EN LA MEDIDA PERMITIDA POR LA LEY, EL PRESTATARIO Y EL PRESTAMISTA RENUNCIAN CADA UNO A SU DERECHO A UN JUICIO POR JURADO EN CUALQUIER DEMANDA, PROCEDIMIENTO O CONTRADEMANDA PRESENTADA POR CUALQUIERA DE LAS PARTES CONTRA LA OTRA QUE SURJA DE O EN CONEXIN CON ESTE PAGAR0.

{{#if additional_terms}}
31. T0RMINOS Y CONDICIONES ADICIONALES

{{additional_terms}}
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

RECONOCIMIENTO Y PROMESA DE PAGO

Yo, el abajo firmante Prestatario, reconozco que he ledo este Pagar en su totalidad, entiendo todos sus trminos y condiciones, y acepto estar legalmente obligado por ellos.

PROMETO PAGAR al Prestamista la suma principal de USD {{loan_amount}}, ms intereses y otros cargos segn se establece arriba, de acuerdo con los trminos de este Pagar.

Entiendo que:
" Esta es una obligacin legalmente vinculante
" El incumplimiento de pago puede resultar en accin legal, embargo de salario y dao a mi crdito
" Soy personalmente responsable por toda la deuda
{{#if secured_loan}}" El colateral puede ser embargado y vendido si incumplo{{/if}}
{{#if cosigner_name}}" Mi co-firmante es igualmente responsable por esta deuda{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

FIRMAS

PRESTATARIO (Librador):

_____________________________________
{{borrower_name}}

Firma: ___________________________

Fecha: _______________________________

{{#if borrower_ssn_last4}}
SSN (altimos 4): XXX-XX-{{borrower_ssn_last4}}
{{/if}}


{{#if cosigner_name}}
CO-FIRMANTE / GARANTE:

_____________________________________
{{cosigner_name}}

Firma: ___________________________

Fecha: _______________________________


Al firmar arriba, el Co-firmante garantiza incondicionalmente el pago de todos los montos adeudados bajo este Pagar y acepta ser responsable conjunta y solidariamente con el Prestatario.
{{/if}}


PRESTAMISTA (Beneficiario):

_____________________________________
{{lender_name}}

Firma: ___________________________

Fecha: _______________________________


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

RECONOCIMIENTO NOTARIAL (OPCIONAL PERO RECOMENDADO)

Estado de {{governing_state}}
Condado de ___________________

En este da _____ de _____________, 20_____, ante m, un Notario Pblico, compareci personalmente {{borrower_name}}, conocido por m (o probado satisfactoriamente) ser la persona cuyo nombre est suscrito en el instrumento adjunto, y reconoci que ejecut el mismo para los propsitos contenidos en el mismo.

EN FE DE LO CUAL, pongo mi mano y sello oficial.

_____________________________________
Firma del Notario Pblico

Mi Comisin Expira: ______________

[SELLO NOTARIAL]


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCARGO DE RESPONSABILIDAD LEGAL E INFORMACIN IMPORTANTE

Esta plantilla de Pagar se proporciona solo con fines informativos y no constituye asesoramiento legal o financiero.

CUNDO CONSULTAR A UN ABOGADO O ASESOR FINANCIERO:

Debe consultar con un abogado licenciado si:
" El monto del prstamo excede $10,000
" El prstamo involucra bienes inmuebles o requiere una hipoteca/escritura de fideicomiso
" El prstamo est garantizado por colateral valioso (vehculo, equipo, etc.)
" Necesita perfeccionar un inters de seguridad (presentacin UCC, gravamen de ttulo de vehculo, etc.)
" El prestatario es una entidad comercial (corporacin, LLC, sociedad)
" El prstamo involucra trminos de pago complejos o pagos globales
" Est prestando entre estados
" Tiene preguntas sobre leyes de usura (tasas de inters mximas)
" Anticipa posibles problemas de cobro o incumplimientos

NOTAS IMPORTANTES SOBRE PAGAR0S:

1. LEYES DE USURA: Cada estado tiene tasas de inters mximas (lmites de usura). Cobrar inters por encima del mximo legal puede anular el inters o incluso todo el prstamo. Verifique las leyes de usura de su estado.

2. IMPLICACIONES FISCALES:
   " Para Prestamistas: El ingreso por intereses es imponible y debe reportarse al IRS
   " Para Prestatarios: El inters sobre prstamos personales generalmente NO es deducible de impuestos (los prstamos comerciales pueden serlo)
   " Inters Imputado: Si hace un prstamo sin inters por ms de $10,000, el IRS puede imputar ingreso por inters
   " Consulte a un profesional de impuestos para prstamos sobre $10,000

3. ESTATUTO DE FRAUDES: La mayora de los estados requieren que los prstamos sobre cierta cantidad estn por escrito. Siempre use un pagar escrito para cualquier prstamo significativo.

4. GARANTIZADO VS. NO GARANTIZADO:
   " GARANTIZADO: El prestamista puede embargar el colateral si el prestatario incumple (requiere documentacin adecuada)
   " NO GARANTIZADO: El prestamista solo puede demandar por pago (sin derecho automtico a embargar propiedad)

5. PERFECCIN DE INTERESES DE SEGURIDAD:
   " Vehculo: Debe presentar gravamen con DMV y anotar en el ttulo
   " Propiedad Personal: Presentar declaracin de financiamiento UCC-1 con Secretario de Estado
   " Bienes Races: Debe registrar hipoteca o escritura de fideicomiso con registrador del condado
   " Sin perfeccin adecuada, su inters de seguridad puede ser invlido

6. COBRO:
   " Si el prestatario incumple, puede necesitar demandar y obtener un juicio
   " Los juicios pueden usarse para embargar salarios o cuentas bancarias
   " El cobro a travs de tribunales puede ser costoso y llevar tiempo
   " Considere usar un abogado de cobro si el monto es sustancial

7. PR0STAMOS ENTRE FAMILIA/AMIGOS:
   " Incluso con familia o amigos, SIEMPRE use un pagar escrito
   " Sea claro sobre los trminos para evitar malentendidos
   " Entienda que la accin legal puede daar la relacin
   " Considere si puede permitirse perder el dinero si no se paga

8. REPORTE DE CR0DITO:
   " La mayora de prestamistas personales no pueden reportar a agencias de crdito (solo prestamistas institucionales pueden)
   " Sin embargo, si obtiene un juicio, eso aparecer en el reporte de crdito del prestatario

ALTERNATIVAS A PAGAR0S:

" SIMPLE IOU: Para prstamos muy pequeos entre familia/amigos (menos de $1,000)
" CONTRATO DE PR0STAMO: Contrato ms completo con trminos detallados
" ACUERDO DE LNEA DE CR0DITO: Para relacin de prstamo continua
" CONTRATO DE PR0STAMO COMERCIAL: Para prstamos a empresas

CONSIDERACIONES ESPECFICAS POR ESTADO:

" Las tasas de inters mximas varan por estado (tpicamente 6%-36%)
" Algunos estados requieren notarizacin para ciertos prstamos garantizados
" El estatuto de limitaciones sobre cobro de deudas vara (tpicamente 3-6 aos)
" Algunos estados prohben ciertas penalizaciones por pago anticipado
" Verifique los requisitos especficos de su estado

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Este Pagar fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.
EL PRESTAMISTA DEBE GUARDAR EL PAGAR0 FIRMADO ORIGINAL EN UN LUGAR SEGURO.`
};



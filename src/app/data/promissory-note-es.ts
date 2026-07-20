// PLANTILLA PROFESIONAL DE PAGARÉ
// Promesa legalmente vinculante de pagar un préstamo con intereses y términos de pago
// Para préstamos personales, préstamos comerciales y acuerdos de pago

import { DocumentTemplate } from '../types/document';

export const promissoryNoteTemplateES: DocumentTemplate = {
  id: 'promissory-note',
  name: 'Pagaré',
  description: 'Promesa escrita legalmente vinculante de pagar un préstamo con tasa de interés, calendario de pagos y términos especificados. Perfecto para préstamos personales entre familia/amigos, préstamos para pequeñas empresas o acuerdos de préstamo formales. Incluye opciones para préstamos garantizados/no garantizados, tarifas por mora y términos de pago anticipado.',
  category: 'Financiero y Legal',
  price: 7.00,
  fields: [
    // Monto del Préstamo y Fecha
    {
      id: 'loan_amount',
      label: 'Monto Principal del Préstamo ($)',
      type: 'currency',
      required: true,
      helpText: 'La cantidad total que se está prestando (sin intereses)'
    },
    {
      id: 'loan_date',
      label: 'Fecha del Préstamo',
      type: 'date',
      required: true,
      helpText: 'Fecha en que se hace el préstamo y cambia el dinero de manos'
    },

    // Información del Prestatario (Persona que RECIBE el dinero)
    {
      id: 'borrower_name',
      label: 'Nombre Legal Completo del Prestatario',
      type: 'text',
      required: true,
      helpText: 'La persona que RECIBE el préstamo (quien debe el dinero)'
    },
    {
      id: 'borrower_address',
      label: 'Dirección del Prestatario',
      type: 'textarea',
      required: true
    },
    {
      id: 'borrower_email',
      label: 'Correo electrónico del Prestatario',
      type: 'email',
      required: false
    },
    {
      id: 'borrower_phone',
      label: 'Teléfono del Prestatario',
      type: 'tel',
      required: false
    },
    {
      id: 'borrower_ssn_last4',
      label: 'Últimos 4 Dígitos del SSN del Prestatario (Opcional)',
      type: 'text',
      required: false,
      helpText: 'Solo para propósitos de identificación (opcional pero recomendado)'
    },

    // Información del Prestamista (Persona que DA el dinero)
    {
      id: 'lender_name',
      label: 'Nombre Legal Completo del Prestamista',
      type: 'text',
      required: true,
      helpText: 'La persona que DA el préstamo (a quien se le debe el dinero)'
    },
    {
      id: 'lender_address',
      label: 'Dirección del Prestamista',
      type: 'textarea',
      required: true
    },
    {
      id: 'lender_email',
      label: 'Correo electrónico del Prestamista',
      type: 'email',
      required: false
    },
    {
      id: 'lender_phone',
      label: 'Teléfono del Prestamista',
      type: 'tel',
      required: false
    },

    // Tasa de Interés
    {
      id: 'interest_rate',
      label: 'Tasa de Interés Anual (%)',
      type: 'text',
      required: true,
      placeholder: 'Ej: 5',
      helpText: 'Ingrese 0 para préstamo sin interés, o el porcentaje (ej. 5 para 5% anual)'
    },
    {
      id: 'interest_type',
      label: 'Método de Cálculo de Interés',
      type: 'select',
      options: [
        'Interés Simple',
        'Interés Compuesto (Mensual)',
        'Interés Compuesto (Anual)',
        'Sin Interés (0%)'
      ],
      required: true,
      helpText: 'El interés simple es más común para préstamos personales'
    },

    // Términos de Pago
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
        'Pagos Solo de Interés con Pago Global',
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
      label: 'Número de Pagos - Si Aplica',
      type: 'text',
      required: false,
      placeholder: 'Ej: 12',
      helpText: 'Número total de cuotas'
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
      label: 'Día de Vencimiento del Mes - Si Aplica',
      type: 'select',
      options: [
        '1 de cada mes', '5 de cada mes', '10 de cada mes',
        '15 de cada mes', '20 de cada mes', '25 de cada mes',
        'Último día de cada mes', 'Otro - Ver calendario personalizado'
      ],
      required: false,
      helpText: 'Para pagos mensuales'
    },
    {
      id: 'maturity_date',
      label: 'Fecha de Vencimiento (Fecha Final de Pago)',
      type: 'date',
      required: true,
      helpText: 'Fecha en que el préstamo debe estar completamente pagado'
    },

    // Método de Pago
    {
      id: 'payment_method',
      label: 'Métodos de Pago Aceptados',
      type: 'select',
      options: [
        'Cheque o Giro Postal',
        'Transferencia bancaria',
        'ACH / Depósito Directo',
        'Efectivo',
        'PayPal o Venmo',
        'Zelle o Cash App',
        'Cualquiera de los Anteriores'
      ],
      required: true
    },
    {
      id: 'payment_address',
      label: 'Dirección de Envío de Pagos (si aplica)',
      type: 'textarea',
      required: false,
      helpText: 'Dónde enviar cheques o giros postales'
    },

    // Términos de Pago Anticipado
    {
      id: 'prepayment_allowed',
      label: '¿Se Permite Pago Anticipado (Pago Adelantado)?',
      type: 'select',
      options: [
        'Sí - Sin penalización por pago anticipado',
        'Sí - Con penalización por pago anticipado',
        'No - Debe seguir el calendario de pagos exactamente'
      ],
      required: true,
      helpText: '¿Puede el prestatario pagar el préstamo antes?'
    },
    {
      id: 'prepayment_penalty',
      label: 'Penalización por Pago Anticipado (si aplica)',
      type: 'text',
      required: false,
      placeholder: 'Ejemplo: 2% del principal restante',
      helpText: 'Tarifa por pagar el préstamo antes de tiempo'
    },

    // Términos de Pago Tardío
    {
      id: 'late_payment_fee',
      label: 'Tarifa por Pago Tardío',
      type: 'select',
      options: [
        'Sin tarifas por mora',
        'Tarifa fija de $25',
        'Tarifa fija de $50',
        'Tarifa fija de $100',
        '5% del pago perdido',
        '10% del pago perdido',
        'Términos personalizados de tarifa por mora'
      ],
      required: true
    },
    {
      id: 'grace_period',
      label: 'Período de Gracia Antes de Tarifa por Mora',
      type: 'select',
      options: [
        'Sin período de gracia - Tarifa aplica inmediatamente',
        'Período de gracia de 5 días',
        'Período de gracia de 10 días',
        'Período de gracia de 15 días',
        'Período de gracia de 30 días'
      ],
      required: true
    },
    {
      id: 'default_interest_rate',
      label: 'Tasa de Interés por Incumplimiento (%) - Si Se Pierde Pago',
      type: 'text',
      required: false,
      placeholder: 'Ejemplo: 18',
      helpText: 'Tasa de interés más alta que aplica si el prestatario incumple (opcional)'
    },

    // Seguridad/Garantía
    {
      id: 'secured_loan',
      label: '¿Este Préstamo Está Garantizado por Colateral?',
      type: 'select',
      options: [
        'No - Préstamo no garantizado (sin colateral)',
        'Sí - Garantizado por propiedad/activo específico'
      ],
      required: true,
      helpText: 'Los préstamos garantizados permiten al prestamista embargar el colateral si no se paga'
    },
    {
      id: 'collateral_description',
      label: 'Descripción del Colateral (si está garantizado)',
      type: 'textarea',
      required: false,
      placeholder: 'Ejemplo: Honda Accord 2020, VIN: 1HGCV1F3XLA123456\nO: Propiedad inmobiliaria ubicada en 123 Main St, Ciudad, Estado',
      helpText: 'Descripción detallada de la propiedad que garantiza el préstamo'
    },
    {
      id: 'collateral_value',
      label: 'Valor Estimado del Colateral ($) - Si Está Garantizado',
      type: 'currency',
      required: false
    },

    // Cláusula de Aceleración
    {
      id: 'acceleration_clause',
      label: '¿Incluir Cláusula de Aceleración?',
      type: 'select',
      options: [
        'Sí - Saldo completo debido inmediatamente al incumplir',
        'No - Continuar con calendario de pagos incluso si se pierde un pago'
      ],
      required: true,
      helpText: 'Permite al prestamista exigir pago completo si el prestatario incumple'
    },

    // Co-firmante/Garante
    {
      id: 'cosigner_required',
      label: '¿Hay un Co-firmante/Garante?',
      type: 'select',
      options: ['No', 'Sí'],
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
      label: 'Dirección del Co-firmante',
      type: 'textarea',
      required: false
    },
    {
      id: 'cosigner_phone',
      label: 'Teléfono del Co-firmante',
      type: 'tel',
      required: false
    },

    // Propósito del Préstamo
    {
      id: 'loan_purpose',
      label: 'Propósito del Préstamo (Opcional)',
      type: 'select',
      options: [
        'No Especificado',
        'Gastos Personales/Familiares',
        'Gastos Comerciales',
        'Compra de Vehículo',
        'Mejoras al Hogar',
        'Educación/Matrícula',
        'Consolidación de Deudas',
        'Gastos Médicos',
        'Compra de Bienes Raíces',
        'Otro'
      ],
      required: false,
      helpText: 'Para qué se usará el préstamo (opcional pero recomendado)'
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
      helpText: 'Ley estatal que regirá este pagaré'
    },

    // Términos Adicionales
    {
      id: 'additional_terms',
      label: 'Términos o Condiciones Adicionales (Opcional)',
      type: 'textarea',
      required: false,
      placeholder: 'Cualquier condición especial, restricciones o acuerdos adicionales'
    },
  ],

  template: `PAGARÉ

Monto Principal: USD {{loan_amount}}
Fecha del Préstamo: {{loan_date}}

POR VALOR RECIBIDO, el abajo firmante ("Prestatario" o "Librador") promete pagar a la orden de ("Prestamista" o "Beneficiario") la suma principal de {{loan_amount}} Dólares de los Estados Unidos (USD {{loan_amount}}), junto con intereses y otros cargos según se establece a continuación.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PRESTATARIO (Persona que Recibe el Préstamo / Debe el Dinero):

Nombre: {{borrower_name}}
Dirección: {{borrower_address}}
{{#if borrower_email}}Correo electrónico: {{borrower_email}}{{/if}}
{{#if borrower_phone}}Teléfono: {{borrower_phone}}{{/if}}
{{#if borrower_ssn_last4}}SSN (últimos 4): XXX-XX-{{borrower_ssn_last4}}{{/if}}

(En adelante denominado "Prestatario" o "Librador")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PRESTAMISTA (Persona que Da el Préstamo / Se le Debe el Dinero):

Nombre: {{lender_name}}
Dirección: {{lender_address}}
{{#if lender_email}}Correo electrónico: {{lender_email}}{{/if}}
{{#if lender_phone}}Teléfono: {{lender_phone}}{{/if}}

(En adelante denominado "Prestamista" o "Beneficiario")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

TÉRMINOS DEL PRÉSTAMO

1. MONTO PRINCIPAL
   El monto principal de este préstamo es: USD {{loan_amount}}

2. FECHA DEL PRÉSTAMO
   Este préstamo se hace el: {{loan_date}}

{{#if loan_purpose}}
3. PROPÓSITO DEL PRÉSTAMO
   El propósito de este préstamo es: {{loan_purpose}}

   Esta declaración de propósito es solo para fines informativos y no limita el uso de los fondos por parte del Prestatario ni crea obligaciones adicionales.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

INTERÉS

4. TASA DE INTERÉS
   Tasa de Interés Anual: {{interest_rate}}%
   Método de Cálculo de Interés: {{interest_type}}

{{#if interest_rate}}
   El interés se acumulará desde la Fecha del Préstamo hasta que el principal y todos los intereses acumulados se paguen en su totalidad. El interés se calculará usando el método de {{interest_type}}.

   {{#if interest_type}}
   {{#if interest_type "Interés Simple"}}
   Fórmula de Interés Simple: Interés = Principal × Tasa × Tiempo
   Ejemplo: Para un préstamo de USD 10,000 al 5% por 1 año = USD 500 en intereses
   {{/if}}
   {{/if}}
{{else}}
   SIN INTERÉS: Este es un préstamo sin intereses. No se acumularán intereses sobre el saldo principal.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

TÉRMINOS DE PAGO

5. ESTRUCTURA DE PAGO
   {{payment_structure}}

{{#if installment_amount}}
6. CUOTAS
   Monto de Cuota: USD {{installment_amount}}
   {{#if number_of_payments}}Número de Pagos: {{number_of_payments}}{{/if}}
   {{#if first_payment_date}}Primer Pago Vence: {{first_payment_date}}{{/if}}
   {{#if payment_day}}Pago Vence: {{payment_day}}{{/if}}

   El Prestatario hará cuotas regulares de USD {{installment_amount}} cada una, continuando hasta que todo el saldo principal y todos los intereses acumulados se paguen en su totalidad.
{{/if}}

7. FECHA DE VENCIMIENTO (FECHA FINAL DE PAGO)
   Todo el saldo principal pendiente y todos los intereses acumulados vencerán y serán pagaderos en su totalidad en o antes de: {{maturity_date}}

   Esta es la fecha final absoluta en la que el préstamo debe estar completamente pagado. Si queda algún saldo sin pagar después de esta fecha, el Prestatario estará en incumplimiento.

8. MÉTODO DE PAGO
   Los pagos se harán mediante: {{payment_method}}

{{#if payment_address}}
   Dirección de Envío de Pagos:
   {{payment_address}}
{{/if}}

   Todos los pagos se harán en moneda de los Estados Unidos. Los pagos se aplicarán primero a cualquier interés acumulado, tarifas por mora y otros cargos, y el resto se aplicará al principal.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PAGO ANTICIPADO

9. DERECHOS DE PAGO ANTICIPADO
   {{prepayment_allowed}}

{{#if prepayment_allowed}}
   {{#if prepayment_penalty}}
   Penalización por Pago Anticipado: {{prepayment_penalty}}

   Si el Prestatario elige pagar el préstamo antes de la Fecha de Vencimiento, el Prestatario pagará la penalización por pago anticipado especificada arriba además del principal pendiente y los intereses acumulados.
   {{else}}
   El Prestatario puede pagar anticipadamente todo o cualquier parte del saldo principal en cualquier momento sin penalización. Los pagos anticipados se aplicarán al principal y reducirán los cargos de interés futuros en consecuencia.
   {{/if}}
{{else}}
   El Prestatario NO puede pagar anticipadamente este préstamo. Todos los pagos deben hacerse de acuerdo con el calendario de pagos. Los pagos anticipados no reducirán el interés total adeudado.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

PAGOS TARDÍOS E INCUMPLIMIENTO

10. TARIFA POR PAGO TARDÍO
    {{late_payment_fee}}

    Período de Gracia: {{grace_period}}

    Si algún pago no se recibe dentro del período de gracia después de la fecha de vencimiento, el Prestatario pagará la tarifa por mora especificada arriba además del monto de pago regular.

{{#if default_interest_rate}}
11. TASA DE INTERÉS POR INCUMPLIMIENTO
    Si el Prestatario está en incumplimiento bajo este Pagaré, la tasa de interés aumentará a {{default_interest_rate}}% anual (la "Tasa de Incumplimiento") sobre todo el saldo pendiente hasta que se cure el incumplimiento.

    La Tasa de Incumplimiento se aplicará desde la fecha de incumplimiento hasta que el Prestatario ya no esté en incumplimiento.
{{/if}}

12. INCUMPLIMIENTO
    El Prestatario estará en incumplimiento bajo este Pagaré si ocurre cualquiera de lo siguiente:

    (a) El Prestatario no hace algún pago cuando vence y no cura el pago perdido dentro de treinta (30) días después de recibir aviso por escrito del Prestamista;

    (b) El Prestatario no paga todo el saldo pendiente en la Fecha de Vencimiento;

    (c) El Prestatario se vuelve insolvente, declara bancarrota o hace una cesión en beneficio de acreedores;

    (d) El Prestatario muere o se vuelve legalmente incapacitado (a menos que un co-firmante o garante haya acordado asumir la obligación);

    {{#if secured_loan}}
    (e) El Prestatario vende, transfiere o grava el colateral que garantiza este Pagaré sin el consentimiento previo por escrito del Prestamista;

    (f) El colateral es destruido, dañado o disminuye significativamente en valor;
    {{/if}}

    (g) Cualquier declaración o garantía hecha por el Prestatario en conexión con este Pagaré resulta haber sido falsa o engañosa cuando se hizo.

13. CLÁUSULA DE ACELERACIÓN
    {{acceleration_clause}}

{{#if acceleration_clause}}
    Al incumplir, el Prestamista puede, a opción del Prestamista, declarar todo el saldo principal no pagado, junto con todos los intereses acumulados y otros cargos, inmediatamente debido y pagadero sin aviso o demanda adicional.

    Esto significa que si el Prestatario pierde incluso un pago y no lo cura dentro del período de aviso, el Prestamista puede exigir pago inmediato de TODO el saldo restante del préstamo, no solo el pago perdido.
{{else}}
    Incluso si el Prestatario pierde un pago, el Prestamista no puede acelerar el préstamo. El Prestatario continuará haciendo pagos de acuerdo con el calendario original, más cualquier tarifa por mora e interés por incumplimiento aplicable.
{{/if}}

14. REMEDIOS AL INCUMPLIR
    Si el Prestatario incumple bajo este Pagaré, el Prestamista tendrá los siguientes remedios:

    (a) Exigir pago inmediato de todos los montos adeudados (si aplica cláusula de aceleración);

    (b) Cobrar la Tasa de Interés por Incumplimiento (si aplica);

    (c) Evaluar tarifas por mora y otros cargos según se establece en este Pagaré;

    (d) Reportar el incumplimiento a las agencias de crédito, lo que puede afectar negativamente el puntaje de crédito del Prestatario;

    {{#if secured_loan}}
    (e) Tomar posesión y vender el colateral para satisfacer la deuda;
    {{/if}}

    (f) Buscar acción legal para cobrar la deuda, incluyendo presentar una demanda;

    (g) Buscar un juicio contra el Prestatario por el monto completo adeudado más intereses, costos y honorarios razonables de abogados;

    (h) Embargar los salarios o cuentas bancarias del Prestatario (si está permitido por ley);

    (i) Ejercer cualquier otro derecho disponible bajo la ley aplicable.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

SEGURIDAD / COLATERAL

15. INTERÉS DE SEGURIDAD
    {{secured_loan}}

{{#if collateral_description}}
    Este Pagaré está GARANTIZADO por el siguiente colateral:

    {{collateral_description}}

    {{#if collateral_value}}Valor Estimado: USD {{collateral_value}}{{/if}}

    ACUERDO DE SEGURIDAD: Al firmar este Pagaré, el Prestatario otorga al Prestamista un interés de seguridad en el colateral descrito arriba. El Prestatario declara y garantiza que:

    (a) El Prestatario es el propietario legal del colateral y tiene pleno derecho de pignorarlo como garantía;
    (b) El colateral está libre de cualquier otro gravamen o carga (a menos que se divulgue al Prestamista);
    (c) El Prestatario mantendrá el colateral en buenas condiciones;
    (d) El Prestatario mantendrá el colateral adecuadamente asegurado;
    (e) El Prestatario no venderá, transferirá o gravará más el colateral sin el consentimiento previo por escrito del Prestamista.

    DERECHOS DEL PRESTAMISTA AL INCUMPLIR: Si el Prestatario incumple, el Prestamista puede tomar posesión del colateral y venderlo en venta pública o privada. El Prestamista puede aplicar los ingresos de la venta a la deuda pendiente. Si los ingresos de la venta exceden la deuda, el Prestamista pagará el excedente al Prestatario. Si los ingresos son insuficientes, el Prestatario permanece responsable por la deficiencia.

    PERFECCIÓN DEL INTERÉS DE SEGURIDAD: Las Partes reconocen que este Pagaré puede necesitar ser complementado con documentos adicionales (como una declaración de financiamiento UCC-1 para propiedad personal o una hipoteca/escritura de fideicomiso para bienes inmuebles) para perfeccionar adecuadamente el interés de seguridad del Prestamista bajo la ley aplicable.
{{else}}
    Este Pagaré NO ESTÁ GARANTIZADO. El Prestatario no ha pignorado ningún colateral para garantizar el pago. Si el Prestatario incumple, los remedios del Prestamista se limitan a acción legal para cobro y juicio.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

CO-FIRMANTE / GARANTE

16. CO-FIRMANTE
    Co-firmante/Garante: {{cosigner_required}}

{{#if cosigner_name}}
    INFORMACIÓN DEL CO-FIRMANTE:
    Nombre: {{cosigner_name}}
    Dirección: {{cosigner_address}}
    {{#if cosigner_phone}}Teléfono: {{cosigner_phone}}{{/if}}

    GARANTÍA: El abajo firmante Co-firmante/Garante ("Co-firmante") garantiza incondicionalmente el pago completo y oportuno de todos los montos adeudados bajo este Pagaré. El Co-firmante acuerda ser responsable conjunta y solidariamente con el Prestatario por todas las obligaciones bajo este Pagaré.

    Esto significa:
    • El Prestamista puede exigir pago del Co-firmante sin primero intentar cobrar del Prestatario
    • El Co-firmante es igualmente responsable por toda la deuda
    • El crédito del Co-firmante puede ser afectado si el Prestatario incumple
    • El Co-firmante renuncia a cualquier defensa basada en incapacidad del Prestatario, bancarrota u otras defensas

    El Co-firmante permanece responsable incluso si:
    • El Prestamista otorga extensiones o modificaciones al Prestatario
    • El Prestamista libera o perjudica cualquier colateral
    • El Prestamista demora en hacer cumplir derechos contra el Prestatario
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DISPOSICIONES GENERALES

17. LEY APLICABLE
    Este Pagaré se regirá e interpretará de acuerdo con las leyes del Estado de {{governing_state}}, sin consideración a sus principios de conflicto de leyes.

18. JURISDICCIÓN Y COMPETENCIA
    Cualquier acción legal para hacer cumplir este Pagaré se presentará en los tribunales estatales o federales ubicados en {{governing_state}}. El Prestatario consiente a la jurisdicción de dichos tribunales y renuncia a cualquier objeción a la competencia.

19. HONORARIOS DE ABOGADOS Y COSTOS
    Si el Prestamista debe tomar acción legal para cobrar montos adeudados bajo este Pagaré, el Prestatario pagará todos los costos de cobro, incluyendo honorarios razonables de abogados, costos judiciales, tarifas de agencia de cobro y otros gastos incurridos por el Prestamista.

20. RENUNCIA
    Ninguna demora u omisión por parte del Prestamista en ejercer cualquier derecho bajo este Pagaré constituirá una renuncia a ese derecho o cualquier otro derecho. Una renuncia en una ocasión no constituirá una renuncia en cualquier ocasión futura.

21. DIVISIBILIDAD
    Si cualquier disposición de este Pagaré se considera inválida, ilegal o inaplicable, las disposiciones restantes continuarán en pleno vigor y efecto.

22. ENMIENDAS
    Este Pagaré no puede ser enmendado, modificado o complementado excepto por un acuerdo escrito firmado tanto por el Prestatario como por el Prestamista.

23. AVISOS
    Todos los avisos requeridos bajo este Pagaré serán por escrito y entregados a las direcciones establecidas arriba (o a otras direcciones que una parte pueda designar por escrito). Los avisos pueden ser entregados mediante:
    (a) Entrega personal;
    (b) Correo certificado, recibo de devolución solicitado;
    (c) Servicio de mensajería nocturna;
    (d) Correo electrónico (con confirmación de recibo).

24. ACUERDO COMPLETO
    Este Pagaré constituye el acuerdo completo entre el Prestatario y el Prestamista respecto a este préstamo y reemplaza todas las discusiones, negociaciones y acuerdos previos.

25. SUCESORES Y CESIONARIOS
    Este Pagaré será vinculante para el Prestatario y los herederos, albaceas, administradores y representantes legales del Prestatario. Este Pagaré beneficiará al Prestamista y a los sucesores y cesionarios del Prestamista.

    El Prestamista puede vender, transferir o ceder este Pagaré y cualquier interés de seguridad sin el consentimiento del Prestatario. El Prestatario NO puede transferir o ceder ninguna obligación bajo este Pagaré sin el consentimiento previo por escrito del Prestamista.

26. RESPONSABILIDAD CONJUNTA Y SOLIDARIA
    Si más de una persona firma este Pagaré como Prestatario, cada persona será responsable conjunta y solidariamente por el monto completo de la deuda. Esto significa que el Prestamista puede cobrar el monto completo de cualquier Prestatario.

27. CLÁUSULA DE SALVAGUARDA DE USURA
    Es la intención de las partes cumplir con todas las leyes de usura aplicables. Si cualquier disposición de este Pagaré resultara en una tasa de interés que exceda la tasa máxima permitida por ley, la tasa de interés se reducirá automáticamente a la tasa legal máxima. Cualquier monto cobrado en exceso del máximo legal será reembolsado al Prestatario o acreditado contra el saldo principal.

28. SIN MODIFICACIONES ORALES
    Este es un contrato escrito. Cualquier declaración, promesa o representación oral no contenida en este Pagaré escrito no es vinculante. Este Pagaré solo puede ser modificado por un documento escrito firmado por ambas partes.

29. CONTRAPARTES
    Este Pagaré puede ejecutarse en contrapartes, cada una de las cuales será considerada un original y todas juntas constituirán un solo instrumento. Las firmas electrónicas tendrán el mismo efecto que las firmas originales.

30. RENUNCIA A JUICIO POR JURADO
    EN LA MEDIDA PERMITIDA POR LA LEY, EL PRESTATARIO Y EL PRESTAMISTA RENUNCIAN CADA UNO A SU DERECHO A UN JUICIO POR JURADO EN CUALQUIER DEMANDA, PROCEDIMIENTO O CONTRADEMANDA PRESENTADA POR CUALQUIERA DE LAS PARTES CONTRA LA OTRA QUE SURJA DE O EN CONEXIÓN CON ESTE PAGARÉ.

{{#if additional_terms}}
31. TÉRMINOS Y CONDICIONES ADICIONALES

{{additional_terms}}
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

RECONOCIMIENTO Y PROMESA DE PAGO

Yo, el abajo firmante Prestatario, reconozco que he leído este Pagaré en su totalidad, entiendo todos sus términos y condiciones, y acepto estar legalmente obligado por ellos.

PROMETO PAGAR al Prestamista la suma principal de USD {{loan_amount}}, más intereses y otros cargos según se establece arriba, de acuerdo con los términos de este Pagaré.

Entiendo que:
• Esta es una obligación legalmente vinculante
• El incumplimiento de pago puede resultar en acción legal, embargo de salario y daño a mi crédito
• Soy personalmente responsable por toda la deuda
{{#if secured_loan}}• El colateral puede ser embargado y vendido si incumplo{{/if}}
{{#if cosigner_name}}• Mi co-firmante es igualmente responsable por esta deuda{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

FIRMAS

PRESTATARIO (Librador):

_____________________________________
{{borrower_name}}

Firma: ___________________________

Fecha: _______________________________

{{#if borrower_ssn_last4}}
SSN (últimos 4): XXX-XX-{{borrower_ssn_last4}}
{{/if}}


{{#if cosigner_name}}
CO-FIRMANTE / GARANTE:

_____________________________________
{{cosigner_name}}

Firma: ___________________________

Fecha: _______________________________


Al firmar arriba, el Co-firmante garantiza incondicionalmente el pago de todos los montos adeudados bajo este Pagaré y acepta ser responsable conjunta y solidariamente con el Prestatario.
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

En este día _____ de _____________, 20_____, ante mí, un Notario Público, compareció personalmente {{borrower_name}}, conocido por mí (o probado satisfactoriamente) ser la persona cuyo nombre está suscrito en el instrumento adjunto, y reconoció que ejecutó el mismo para los propósitos contenidos en el mismo.

EN FE DE LO CUAL, pongo mi mano y sello oficial.

_____________________________________
Firma del Notario Público

Mi Comisión Expira: ______________

[SELLO NOTARIAL]


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCARGO DE RESPONSABILIDAD LEGAL E INFORMACIÓN IMPORTANTE

Esta plantilla de Pagaré se proporciona solo con fines informativos y no constituye asesoramiento legal o financiero.

CUÁNDO CONSULTAR A UN ABOGADO O ASESOR FINANCIERO:

Debe consultar con un abogado licenciado si:
• El monto del préstamo excede $10,000
• El préstamo involucra bienes inmuebles o requiere una hipoteca/escritura de fideicomiso
• El préstamo está garantizado por colateral valioso (vehículo, equipo, etc.)
• Necesita perfeccionar un interés de seguridad (presentación UCC, gravamen de título de vehículo, etc.)
• El prestatario es una entidad comercial (corporación, LLC, sociedad)
• El préstamo involucra términos de pago complejos o pagos globales
• Está prestando entre estados
• Tiene preguntas sobre leyes de usura (tasas de interés máximas)
• Anticipa posibles problemas de cobro o incumplimientos

NOTAS IMPORTANTES SOBRE PAGARÉS:

1. LEYES DE USURA: Cada estado tiene tasas de interés máximas (límites de usura). Cobrar interés por encima del máximo legal puede anular el interés o incluso todo el préstamo. Verifique las leyes de usura de su estado.

2. IMPLICACIONES FISCALES:
   • Para Prestamistas: El ingreso por intereses es imponible y debe reportarse al IRS
   • Para Prestatarios: El interés sobre préstamos personales generalmente NO es deducible de impuestos (los préstamos comerciales pueden serlo)
   • Interés Imputado: Si hace un préstamo sin interés por más de $10,000, el IRS puede imputar ingreso por interés
   • Consulte a un profesional de impuestos para préstamos sobre $10,000

3. ESTATUTO DE FRAUDES: La mayoría de los estados requieren que los préstamos sobre cierta cantidad estén por escrito. Siempre use un pagaré escrito para cualquier préstamo significativo.

4. GARANTIZADO VS. NO GARANTIZADO:
   • GARANTIZADO: El prestamista puede embargar el colateral si el prestatario incumple (requiere documentación adecuada)
   • NO GARANTIZADO: El prestamista solo puede demandar por pago (sin derecho automático a embargar propiedad)

5. PERFECCIÓN DE INTERESES DE SEGURIDAD:
   • Vehículo: Debe presentar gravamen con DMV y anotar en el título
   • Propiedad Personal: Presentar declaración de financiamiento UCC-1 con Secretario de Estado
   • Bienes Raíces: Debe registrar hipoteca o escritura de fideicomiso con registrador del condado
   • Sin perfección adecuada, su interés de seguridad puede ser inválido

6. COBRO:
   • Si el prestatario incumple, puede necesitar demandar y obtener un juicio
   • Los juicios pueden usarse para embargar salarios o cuentas bancarias
   • El cobro a través de tribunales puede ser costoso y llevar tiempo
   • Considere usar un abogado de cobro si el monto es sustancial

7. PRÉSTAMOS ENTRE FAMILIA/AMIGOS:
   • Incluso con familia o amigos, SIEMPRE use un pagaré escrito
   • Sea claro sobre los términos para evitar malentendidos
   • Entienda que la acción legal puede dañar la relación
   • Considere si puede permitirse perder el dinero si no se paga

8. REPORTE DE CRÉDITO:
   • La mayoría de prestamistas personales no pueden reportar a agencias de crédito (solo prestamistas institucionales pueden)
   • Sin embargo, si obtiene un juicio, eso aparecerá en el reporte de crédito del prestatario

ALTERNATIVAS A PAGARÉS:

• SIMPLE IOU: Para préstamos muy pequeños entre familia/amigos (menos de $1,000)
• CONTRATO DE PRÉSTAMO: Contrato más completo con términos detallados
• ACUERDO DE LÍNEA DE CRÉDITO: Para relación de préstamo continua
• CONTRATO DE PRÉSTAMO COMERCIAL: Para préstamos a empresas

CONSIDERACIONES ESPECÍFICAS POR ESTADO:

• Las tasas de interés máximas varían por estado (típicamente 6%-36%)
• Algunos estados requieren notarización para ciertos préstamos garantizados
• El estatuto de limitaciones sobre cobro de deudas varía (típicamente 3-6 años)
• Algunos estados prohíben ciertas penalizaciones por pago anticipado
• Verifique los requisitos específicos de su estado

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Este Pagaré fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.
EL PRESTAMISTA DEBE GUARDAR EL PAGARÉ FIRMADO ORIGINAL EN UN LUGAR SEGURO.`
};

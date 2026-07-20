// PLANTILLA PROFESIONAL DE CONTRATO DE COMPRA-VENTA DE VEHÍCULO
// Acuerdo completo para transacciones privadas de vehículos
// Incluye requisitos federales de declaración de odómetro

import { DocumentTemplate } from '../types/document';

export const billOfSaleVehicleTemplateES: DocumentTemplate = {
  id: 'bill-of-sale-vehicle',
  name: 'Contrato de Compra-Venta de Vehículo',
  description: 'Contrato completo de compra-venta de vehículo para transacciones entre particulares. Incluye detalles del comprador/vendedor, información del vehículo, precio de venta, declaración de odómetro (requisito federal), términos de garantía/tal cual, y sección de notarización.',
  category: 'Negocios y Contratos',
  price: 7.00,
  fields: [
    // Información del Vendedor
    {
      id: 'seller_name',
      label: 'Nombre Legal Completo del Vendedor',
      type: 'text',
      required: true,
      helpText: 'Nombre tal como aparece en el título del vehículo'
    },
    {
      id: 'seller_address',
      label: 'Dirección del Vendedor',
      type: 'text',
      required: true
    },
    {
      id: 'seller_city',
      label: 'Ciudad del Vendedor',
      type: 'text',
      required: true
    },
    {
      id: 'seller_state',
      label: 'Estado del Vendedor',
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
    {
      id: 'seller_zip',
      label: 'Código Postal del Vendedor',
      type: 'text',
      required: true
    },
    {
      id: 'seller_phone',
      label: 'Teléfono del Vendedor',
      type: 'tel',
      required: true
    },
    {
      id: 'seller_email',
      label: 'Correo electrónico del Vendedor',
      type: 'email',
      required: false
    },
    {
      id: 'seller_license',
      label: 'Número de Licencia del Vendedor',
      type: 'text',
      required: false,
      helpText: 'Opcional pero recomendado para verificación'
    },

    // Información del Comprador
    {
      id: 'buyer_name',
      label: 'Nombre Legal Completo del Comprador',
      type: 'text',
      required: true,
      helpText: 'Nombre como aparecerá en el nuevo título'
    },
    {
      id: 'buyer_address',
      label: 'Dirección del Comprador',
      type: 'text',
      required: true
    },
    {
      id: 'buyer_city',
      label: 'Ciudad del Comprador',
      type: 'text',
      required: true
    },
    {
      id: 'buyer_state',
      label: 'Estado del Comprador',
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
    {
      id: 'buyer_zip',
      label: 'Código Postal del Comprador',
      type: 'text',
      required: true
    },
    {
      id: 'buyer_phone',
      label: 'Teléfono del Comprador',
      type: 'tel',
      required: true
    },
    {
      id: 'buyer_email',
      label: 'Correo electrónico del Comprador',
      type: 'email',
      required: false
    },
    {
      id: 'buyer_license',
      label: 'Número de Licencia del Comprador',
      type: 'text',
      required: false,
      helpText: 'Opcional pero recomendado para verificación'
    },

    // Información del Vehículo
    {
      id: 'vehicle_year',
      label: 'Año del Vehículo',
      type: 'number',
      required: true,
      placeholder: 'Ej: 2020'
    },
    {
      id: 'vehicle_make',
      label: 'Marca del Vehículo',
      type: 'text',
      required: true,
      placeholder: 'Toyota, Honda, Ford, etc.',
      helpText: 'Fabricante del vehículo'
    },
    {
      id: 'vehicle_model',
      label: 'Modelo del Vehículo',
      type: 'text',
      required: true,
      placeholder: 'Camry, Civic, F-150, etc.'
    },
    {
      id: 'vehicle_trim',
      label: 'Versión/Estilo del Vehículo (Opcional)',
      type: 'text',
      required: false,
      placeholder: 'EX, Limited, XLT, etc.'
    },
    {
      id: 'vehicle_vin',
      label: 'VIN del Vehículo (Número de Identificación)',
      type: 'text',
      required: true,
      helpText: 'VIN de 17 caracteres ubicado en el tablero o marco de puerta',
      placeholder: 'Ej: 1HGBH41JXMN109186'
    },
    {
      id: 'vehicle_color',
      label: 'Color del Vehículo',
      type: 'text',
      required: true,
      placeholder: 'Plateado, Negro, Azul, etc.'
    },
    {
      id: 'vehicle_body_type',
      label: 'Tipo de Carrocería',
      type: 'select',
      options: [
        'Sedán',
        'Cupé',
        'SUV',
        'Camioneta',
        'Van',
        'Minivan',
        'Convertible',
        'Hatchback',
        'Wagon',
        'Motocicleta',
        'Casa Rodante/RV',
        'Remolque',
        'Otro'
      ],
      required: true
    },
    {
      id: 'vehicle_mileage',
      label: 'Lectura Actual del Odómetro (Millas)',
      type: 'number',
      required: true,
      helpText: 'Millaje exacto mostrado en el odómetro',
      placeholder: 'Ej: 75420'
    },
    {
      id: 'odometer_brand',
      label: 'Estado del Odómetro',
      type: 'select',
      options: [
        'Millaje Real',
        'Millaje Excede Límites Mecánicos',
        'No es Millaje Real - Advertencia',
        'Odómetro Dañado/Inoperante'
      ],
      required: true,
      helpText: 'Requisito federal - elija el estado preciso'
    },
    {
      id: 'title_number',
      label: 'Número de Título/Certificado',
      type: 'text',
      required: false,
      helpText: 'Número en el título del vehículo'
    },

    // Información de la Venta
    {
      id: 'sale_price',
      label: 'Precio de Venta ($)',
      type: 'currency',
      required: true,
      helpText: 'Precio total de compra en dólares estadounidenses'
    },
    {
      id: 'payment_method',
      label: 'Método de Pago',
      type: 'select',
      options: [
        'Efectivo',
        'Cheque de Caja',
        'Cheque Personal',
        'Transferencia Bancaria',
        'Pago Electrónico (Zelle, Venmo, etc.)',
        'Giro Postal',
        'Otro'
      ],
      required: true
    },
    {
      id: 'payment_status',
      label: 'Estado del Pago',
      type: 'select',
      options: [
        'Pagado en Su Totalidad',
        'Pago Parcial - Saldo Pendiente',
        'Pago Pendiente'
      ],
      required: true
    },
    {
      id: 'balance_due',
      label: 'Saldo Pendiente (si aplica)',
      type: 'currency',
      required: false
    },
    {
      id: 'payment_due_date',
      label: 'Fecha de Vencimiento del Saldo (si aplica)',
      type: 'date',
      required: false
    },

    // Condición del Vehículo y Garantía
    {
      id: 'vehicle_condition',
      label: 'Declaración de Condición del Vehículo',
      type: 'select',
      options: [
        'TAL CUAL - SIN GARANTÍA',
        'TAL CUAL con Garantía Limitada del Vendedor',
        'Con Garantía del Fabricante (Aún Válida)',
        'Con Garantía Extendida'
      ],
      required: true,
      helpText: 'La mayoría de ventas privadas son TAL CUAL'
    },
    {
      id: 'warranty_details',
      label: 'Detalles de Garantía (si aplica)',
      type: 'textarea',
      required: false,
      placeholder: 'Describa cualquier cobertura de garantía, fechas de expiración, transferibilidad, etc.'
    },
    {
      id: 'known_defects',
      label: 'Defectos/Problemas Conocidos (si los hay)',
      type: 'textarea',
      required: false,
      placeholder: 'Liste cualquier problema mecánico conocido, daño o defectos. La honestidad protege a ambas partes.',
      helpText: 'Recomendado para transparencia'
    },

    // Información del Título y Gravámenes
    {
      id: 'title_status',
      label: 'Estado del Título',
      type: 'select',
      options: [
        'Título Limpio - Sin Gravámenes',
        'Título de Salvamento',
        'Título Reconstruido',
        'Gravamen/Préstamo Pendiente - A Pagar',
        'Esperando Título del DMV',
        'Otro'
      ],
      required: true,
      helpText: 'Sea honesto sobre el estado del título'
    },
    {
      id: 'lienholder_name',
      label: 'Nombre del Acreedor Prendario (si aplica)',
      type: 'text',
      required: false,
      helpText: 'Banco o prestamista con gravamen sobre el vehículo'
    },
    {
      id: 'lien_payoff',
      label: 'Monto a Pagar del Gravamen (si aplica)',
      type: 'currency',
      required: false
    },

    // Artículos Adicionales Incluidos
    {
      id: 'included_items',
      label: 'Artículos Adicionales Incluidos en la Venta',
      type: 'textarea',
      required: false,
      placeholder: 'Ejemplos: llanta de repuesto, tapetes, portaequipaje, llaves extra, manual del propietario, registros de servicio, etc.',
      helpText: 'Liste cualquier extra incluido con el vehículo'
    },

    // Fecha y Ubicación de Venta
    {
      id: 'sale_date',
      label: 'Fecha de Venta',
      type: 'date',
      required: true,
      helpText: 'Fecha en que la propiedad se transfiere al comprador'
    },
    {
      id: 'sale_location',
      label: 'Ubicación de Venta (Ciudad, Estado)',
      type: 'text',
      required: true,
      placeholder: 'Ej: Los Ángeles, California'
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
      helpText: 'Generalmente el estado donde se realiza la venta'
    },
  ],

  template: `CONTRATO DE COMPRA-VENTA DE VEHÍCULO MOTORIZADO

ESTE CONTRATO DE COMPRA-VENTA se ejecuta el {{sale_date}}, en {{sale_location}}, entre:

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

VENDEDOR:

Nombre: {{seller_name}}
Dirección: {{seller_address}}
           {{seller_city}}, {{seller_state}} {{seller_zip}}
Teléfono: {{seller_phone}}
{{#if seller_email}}Correo electrónico: {{seller_email}}{{/if}}
{{#if seller_license}}Licencia de Conducir: {{seller_license}}{{/if}}

(en adelante denominado "Vendedor")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

COMPRADOR:

Nombre: {{buyer_name}}
Dirección: {{buyer_address}}
           {{buyer_city}}, {{buyer_state}} {{buyer_zip}}
Teléfono: {{buyer_phone}}
{{#if buyer_email}}Correo electrónico: {{buyer_email}}{{/if}}
{{#if buyer_license}}Licencia de Conducir: {{buyer_license}}{{/if}}

(en adelante denominado "Comprador")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCRIPCIÓN DEL VEHÍCULO:

Año:            {{vehicle_year}}
Marca:          {{vehicle_make}}
Modelo:         {{vehicle_model}}
{{#if vehicle_trim}}Versión:        {{vehicle_trim}}{{/if}}
Tipo:           {{vehicle_body_type}}
Color:          {{vehicle_color}}
VIN:            {{vehicle_vin}}
{{#if title_number}}Núm. Título:    {{title_number}}{{/if}}

Lectura Actual del Odómetro: {{vehicle_mileage}} millas
Estado del Odómetro: {{odometer_brand}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 1 - VENTA Y TRANSFERENCIA

1.1. VENTA DEL VEHÍCULO. El Vendedor por este medio vende, transfiere y traspasa al Comprador, y el Comprador por este medio compra del Vendedor, el vehículo motorizado descrito arriba (el "Vehículo"), libre de todo gravamen y restricción, excepto según se divulgue específicamente en este Contrato de Compra-Venta.

1.2. FECHA EFECTIVA. Esta venta será efectiva a partir del {{sale_date}} (la "Fecha de Venta"). El título y el riesgo de pérdida pasarán al Comprador en la Fecha de Venta al recibir el pago completo.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 2 - PRECIO DE COMPRA Y PAGO

2.1. PRECIO DE COMPRA. El precio total de compra del Vehículo es:

    PRECIO DE VENTA: USD {{sale_price}} (Dólares Estadounidenses)

2.2. MÉTODO DE PAGO. El pago se realizará mediante: {{payment_method}}

2.3. ESTADO DEL PAGO: {{payment_status}}

{{#if balance_due}}
2.4. SALDO PENDIENTE. Un saldo de USD {{balance_due}} permanece pendiente y pagadero.
    {{#if payment_due_date}}Fecha de Vencimiento: {{payment_due_date}}{{/if}}

    Hasta que el saldo se pague en su totalidad:
    • El Vendedor retiene el título legal del Vehículo
    • El Comprador no puede vender, transferir o gravar el Vehículo
    • El Vendedor puede recuperar el Vehículo si no se recibe el pago para la fecha de vencimiento
{{/if}}

2.5. RECIBO DE PAGO. El Vendedor reconoce haber recibido {{#if balance_due}}pago parcial{{else}}pago completo{{/if}} del Comprador en la cantidad especificada arriba.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 3 - TÍTULO Y PROPIEDAD

3.1. ESTADO DEL TÍTULO: {{title_status}}

3.2. DECLARACIONES DEL VENDEDOR. El Vendedor declara y garantiza que:
    (a) El Vendedor es el propietario legal del Vehículo con pleno derecho a vender;
    (b) La información de identificación del Vehículo proporcionada es verdadera y precisa;
    (c) La lectura del odómetro divulgada es precisa según el mejor conocimiento del Vendedor;
    (d) {{#if lienholder_name}}Existe un gravamen sobre el Vehículo en manos de {{lienholder_name}} por aproximadamente USD {{lien_payoff}}, el cual el Vendedor se compromete a pagar{{else}}El Vehículo está libre de todo gravamen y restricción{{/if}};
    (e) El Vendedor ha divulgado todos los defectos materiales conocidos;
    (f) El Vendedor no ha recibido notificación de que el Vehículo haya sido robado o esté sujeto a reclamo de robo.

3.3. ENTREGA DEL TÍTULO. El Vendedor se compromete a entregar el Certificado de Título debidamente firmado y notarizado al Comprador {{#if lienholder_name}}dentro de [X] días después del pago del gravamen{{else}}inmediatamente al recibir el pago completo{{/if}}.

{{#if lienholder_name}}
3.4. PAGO DEL GRAVAMEN. El Vendedor se compromete a pagar el gravamen con {{lienholder_name}} y proporcionar al Comprador evidencia de la liberación del gravamen dentro de un tiempo razonable después de recibir el pago del Comprador.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 4 - CONDICIÓN Y GARANTÍA

4.1. CONDICIÓN DEL VEHÍCULO: {{vehicle_condition}}

{{#if warranty_details}}
4.2. INFORMACIÓN DE GARANTÍA:
{{warranty_details}}
{{/if}}

4.3. DESCARGO TAL CUAL (si aplica):
{{#if vehicle_condition}}
ESTE VEHÍCULO SE VENDE "TAL CUAL" Y "DONDE ESTÁ" CON TODOS SUS DEFECTOS. EL VENDEDOR NO OTORGA GARANTÍAS, EXPRESAS O IMPLÍCITAS, INCLUYENDO PERO NO LIMITADO A CUALQUIER GARANTÍA IMPLÍCITA DE COMERCIABILIDAD O IDONEIDAD PARA UN PROPÓSITO PARTICULAR. EL COMPRADOR ACEPTA EL VEHÍCULO EN SU CONDICIÓN ACTUAL Y ASUME TODO RIESGO DE SU CALIDAD Y DESEMPEÑO.

EL COMPRADOR RECONOCE QUE:
• El Comprador ha inspeccionado el Vehículo o ha renunciado al derecho de inspeccionarlo;
• El Comprador está satisfecho con la condición del Vehículo;
• El Comprador asume todo riesgo de reparaciones y defectos;
• El Vendedor no tiene obligación de reparar o pagar por defectos descubiertos después de la venta;
• El Comprador está comprando el Vehículo basándose únicamente en su propia inspección y juicio.
{{/if}}

{{#if known_defects}}
4.4. DEFECTOS Y PROBLEMAS CONOCIDOS DIVULGADOS POR EL VENDEDOR:

{{known_defects}}

El Comprador reconoce haber sido informado de los defectos anteriores y acepta el Vehículo con dichos defectos.
{{/if}}

4.5. ACEPTACIÓN DEL COMPRADOR. Al firmar este Contrato de Compra-Venta, el Comprador reconoce haber tenido la oportunidad de inspeccionar el Vehículo y lo acepta en su condición actual.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 5 - DECLARACIÓN FEDERAL DEL ODÓMETRO
(Requerido por Ley Federal - 49 U.S.C. § 32705)

5.1. LECTURA DEL ODÓMETRO. El odómetro del Vehículo ahora marca {{vehicle_mileage}} millas.

5.2. ESTADO DEL ODÓMETRO: {{odometer_brand}}

Yo, {{seller_name}}, declaro que según mi mejor conocimiento:

☐ La lectura del odómetro refleja el MILLAJE REAL del vehículo.

☐ La lectura del odómetro EXCEDE los límites mecánicos del odómetro y NO es el millaje real. ADVERTENCIA - DISCREPANCIA DE ODÓMETRO.

☐ La lectura del odómetro NO es el millaje real. ADVERTENCIA - DISCREPANCIA DE ODÓMETRO.

☐ El odómetro está dañado, desconectado o no funciona, y el millaje no puede determinarse.

5.3. ADVERTENCIA FEDERAL: La ley federal y estatal requiere que declare el millaje al transferir la propiedad. No completar esta declaración o proporcionar información falsa puede resultar en multas y/o prisión. La divulgación del millaje debe entregarse al cesionario en conjunto con la transferencia de propiedad.

5.4. CERTIFICACIÓN DEL VENDEDOR. Por este medio certifico que la información del odómetro proporcionada arriba es verdadera y precisa según mi mejor conocimiento.

_____________________________________
Firma del Vendedor (Declaración de Odómetro)

Fecha: ___________________________

5.5. RECONOCIMIENTO DEL COMPRADOR. Por este medio reconozco haber recibido esta declaración de odómetro.

_____________________________________
Firma del Comprador

Fecha: ___________________________

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 6 - ARTÍCULOS Y ACCESORIOS ADICIONALES

{{#if included_items}}
6.1. ARTÍCULOS INCLUIDOS EN LA VENTA. Los siguientes artículos están incluidos con el Vehículo:

{{included_items}}

6.2. Los artículos no específicamente listados arriba no están incluidos a menos que se acuerde por separado por escrito.
{{else}}
6.1. ARTÍCULOS INCLUIDOS. Solo el Vehículo mismo está incluido. No se incluyen accesorios, equipos o artículos adicionales a menos que sean específicamente listados por las partes por escrito.
{{/if}}

6.3. LLAVES Y DOCUMENTOS. El Vendedor proporcionará al Comprador:
     ☐ Todas las llaves y controles disponibles
     ☐ Manual del propietario (si está disponible)
     ☐ Registros de mantenimiento (si están disponibles)
     ☐ Certificado de Título firmado
     ☐ Declaración del Odómetro (este documento)

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 7 - RESPONSABILIDADES DEL COMPRADOR

7.1. REGISTRO Y TITULACIÓN. El Comprador es el único responsable de:
    (a) Registrar el Vehículo con el departamento estatal de vehículos motorizados apropiado;
    (b) Transferir el título al nombre del Comprador;
    (c) Pagar todas las tarifas de registro, tarifas de título e impuestos aplicables;
    (d) Obtener seguro vehicular según lo requiera la ley;
    (e) Cumplir con todos los requisitos específicos del estado para el registro de vehículos.

7.2. LÍMITE DE TIEMPO. El Comprador debe completar el registro y la transferencia del título dentro del período de tiempo requerido por la ley estatal (típicamente 10-30 días) para evitar penalidades.

7.3. INSPECCIONES DE EMISIONES Y SEGURIDAD. El Comprador es responsable de cualquier prueba de emisiones requerida, inspecciones de seguridad o verificaciones de smog requeridas por el estado de registro del Comprador.

7.4. IMPUESTOS. El Comprador es responsable de todo impuesto sobre ventas, impuesto sobre uso y otros impuestos adeudados en esta transacción según lo requiera la ley estatal y local aplicable.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 8 - RESPONSABILIDADES DEL VENDEDOR

8.1. NOTIFICACIÓN DE VENTA. El Vendedor notificará al departamento estatal de vehículos motorizados de la venta dentro del tiempo requerido por la ley estatal para evitar responsabilidad por futuros boletos, accidentes u otros incidentes relacionados con el Vehículo.

8.2. LIBERACIÓN DE RESPONSABILIDAD. El Vendedor presentará un formulario de Liberación de Responsabilidad ante el DMV/MVD estatal para notificar formalmente al estado que el Vendedor ya no es el propietario del Vehículo.

8.3. PLACAS. El Vendedor [retendrá/transferirá] las placas según los requisitos de la ley estatal.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 9 - DECLARACIONES Y CERTIFICACIONES

9.1. EL VENDEDOR CERTIFICA:
    ✓ Soy el propietario legal del Vehículo y tengo el derecho de venderlo
    ✓ El VIN e información del vehículo proporcionados son precisos
    ✓ El Vehículo no ha sido reportado como robado
    ✓ {{#if lienholder_name}}Existe un gravamen que pagaré{{else}}El título está libre de gravámenes{{/if}}
    ✓ He divulgado todos los defectos conocidos según mi mejor conocimiento
    ✓ La lectura del odómetro es precisa según mi mejor conocimiento
    ✓ Proporcionaré un título debidamente firmado al Comprador
    ✓ Notificaré al DMV/MVD de esta venta

9.2. EL COMPRADOR CERTIFICA:
    ✓ He inspeccionado el Vehículo o he renunciado a mi derecho de inspección
    ✓ Acepto el Vehículo en su condición actual
    ✓ Entiendo que estoy comprando TAL CUAL (si aplica)
    ✓ Registraré y titularé el Vehículo a mi nombre
    ✓ Obtendré seguro según lo requiera la ley
    ✓ Pagaré todos los impuestos y tarifas aplicables
    ✓ Entiendo que esta transacción está regida por la ley estatal y federal

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 10 - RESPONSABILIDAD Y RIESGO DE PÉRDIDA

10.1. TRANSFERENCIA DE RIESGO. El riesgo de pérdida o daño al Vehículo pasa al Comprador el {{sale_date}} al tomar posesión el Comprador, independientemente de cuándo se transfiera oficialmente el título.

10.2. SEGURO. El Comprador es responsable de obtener cobertura de seguro sobre el Vehículo inmediatamente al tomar posesión. El seguro del Vendedor ya no cubrirá el Vehículo después de la Fecha de Venta.

10.3. LIBERACIÓN DE RESPONSABILIDAD. A partir del {{sale_date}}, el Vendedor no será responsable por boletos, accidentes, daños, lesiones u otros incidentes relacionados con el Vehículo. El Comprador asume toda dicha responsabilidad.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 11 - RESOLUCIÓN DE DISPUTAS

11.1. LEY APLICABLE. Este Contrato de Compra-Venta se regirá e interpretará de acuerdo con las leyes del Estado de {{governing_state}}, sin consideración a sus principios de conflicto de leyes.

11.2. DISPUTAS. Cualquier disputa que surja de esta transacción se resolverá mediante:
    (a) Negociación de buena fe entre las partes;
    (b) Si la negociación falla, mediación o arbitraje según se acuerde mutuamente;
    (c) Si es necesario, acción legal en los tribunales de {{governing_state}}.

11.3. HONORARIOS DE ABOGADO. En caso de una disputa legal, la parte que prevalezca puede tener derecho a recuperar honorarios razonables de abogado y costos.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 12 - DISPOSICIONES GENERALES

12.1. ACUERDO COMPLETO. Este Contrato de Compra-Venta constituye el acuerdo completo entre el Vendedor y el Comprador con respecto a la venta del Vehículo y reemplaza todas las negociaciones, entendimientos y acuerdos previos.

12.2. ENMIENDAS. Este Contrato de Compra-Venta no puede ser enmendado o modificado excepto por un instrumento escrito firmado tanto por el Vendedor como por el Comprador.

12.3. DIVISIBILIDAD. Si cualquier disposición de este Contrato de Compra-Venta se considera inválida o inaplicable, las disposiciones restantes continuarán en pleno vigor y efecto.

12.4. EFECTO VINCULANTE. Este Contrato de Compra-Venta será vinculante y en beneficio de las partes y sus respectivos herederos, ejecutores, administradores, sucesores y cesionarios.

12.5. CONTRAPARTES. Este Contrato de Compra-Venta puede ejecutarse en múltiples contrapartes, cada una de las cuales se considerará un original y todas juntas constituirán un mismo documento.

12.6. SIN GARANTÍAS DEL VENDEDOR (VENTAS TAL CUAL). A menos que se indique expresamente lo contrario en este documento, el Vendedor no hace declaraciones o garantías con respecto a la condición, calidad, comerciabilidad o idoneidad del Vehículo para cualquier propósito particular.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTÍCULO 13 - FIRMAS Y RECONOCIMIENTO

EN FE DE LO CUAL, las partes han ejecutado este Contrato de Compra-Venta en la fecha indicada arriba.


VENDEDOR:

_____________________________________
{{seller_name}}

Firma: ___________________________

Fecha: _______________________________

Nombre en Letra de Molde: ________________________


COMPRADOR:

_____________________________________
{{buyer_name}}

Firma: ___________________________

Fecha: _______________________________

Nombre en Letra de Molde: ________________________


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

RECONOCIMIENTO NOTARIAL (Recomendado - Requerido en Algunos Estados)

ESTADO DE {{seller_state}}     )
                                ) ss.
CONDADO DE _________________    )

En este día _______ de ________________, 20___, ante mí, un Notario Público en y para dicho Estado, comparecieron personalmente {{seller_name}} y {{buyer_name}}, conocidos por mí (o satisfactoriamente comprobados) como las personas cuyos nombres están suscritos al instrumento anterior, y reconocieron que ejecutaron el mismo para los propósitos en él contenidos.

EN FE DE LO CUAL, he puesto mi mano y sello oficial.


_____________________________________
Notario Público

Mi Comisión Expira: _______________

[SELLO NOTARIAL]


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

AVISOS LEGALES IMPORTANTES Y DESCARGOS DE RESPONSABILIDAD

⚠ PRECAUCIÓN AL COMPRADOR - INFORMACIÓN IMPORTANTE DE PROTECCIÓN AL CONSUMIDOR:

1. REPORTE DE HISTORIAL DEL VEHÍCULO: Antes de comprar cualquier vehículo usado, obtenga un reporte de historial del vehículo de Carfax, AutoCheck o el Sistema Nacional de Información de Títulos de Vehículos Motorizados (NMVTIS) usando el VIN. Verifique:
   • Historial de accidentes
   • Daños por inundación
   • Título de salvamento/reconstruido
   • Reversión del odómetro
   • Información de recalls
   • Número de propietarios previos
   • Registros de mantenimiento

2. INSPECCIÓN PREVIA A LA COMPRA: Haga que un mecánico independiente inspeccione el vehículo ANTES de completar la compra. Una inspección previa a la compra ($100-200) puede ahorrar miles en reparaciones inesperadas.

3. PRUEBA DE MANEJO: Siempre pruebe el vehículo bajo varias condiciones (autopista, ciudad, estacionamiento) antes de comprar.

4. VERIFICACIÓN DEL TÍTULO: Verifique que el nombre del vendedor en el título coincida con su identificación y este Contrato de Compra-Venta. Nunca compre un vehículo sin un título limpio a nombre del vendedor.

5. VERIFICACIÓN DE GRAVÁMENES: Contacte al DMV de su estado para verificar que no haya gravámenes no divulgados sobre el vehículo. Una búsqueda de gravámenes puede prevenir que compre un vehículo que el vendedor legalmente no posee.

6. VENTAS TAL CUAL: La mayoría de las ventas entre particulares son "TAL CUAL" sin garantía. Una vez que se vaya, todos los problemas son suyos. Inspeccione cuidadosamente.

7. EMISIONES E INSPECCIÓN: Algunos estados requieren pruebas de emisiones y/o inspección de seguridad antes del registro. Considere este costo y posible falla en su decisión.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

REQUISITOS ESPECÍFICOS POR ESTADO (Ejemplos - Verifique Su Estado):

• CALIFORNIA: Se requiere certificado de smog (a menos que esté exento). El vendedor debe proporcionar dentro de los 90 días de la venta.
• TEXAS: Se requiere inspección vehicular dentro de los 7 días de la venta para el registro.
• NUEVA YORK: El Contrato de Compra-Venta debe ser notarizado para el registro en el DMV.
• FLORIDA: La transferencia del título debe ocurrir dentro de los 30 días para evitar cargos por mora.
• MASSACHUSETTS: Debe pasar la inspección estatal dentro de los 7 días de la compra.

SIEMPRE VERIFIQUE LOS REQUISITOS ESPECÍFICOS DE SU ESTADO para:
☐ Requisitos de notarización para el Contrato de Compra-Venta
☐ Límites de tiempo para transferencia de título y registro
☐ Requisitos de inspección de emisiones y seguridad
☐ Procedimientos de cobro y pago de impuestos sobre ventas
☐ Formularios y divulgaciones requeridas
☐ Protecciones de ley limón (generalmente no aplican a ventas privadas)

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

REQUISITOS FEDERALES:

1. DIVULGACIÓN DE ODÓMETRO (49 U.S.C. § 32705): La ley federal REQUIERE divulgación precisa del odómetro para vehículos de menos de 20 años. Las violaciones pueden resultar en:
   • Penalidades civiles hasta $10,000
   • Penalidades criminales incluyendo multas y prisión
   • El comprador puede demandar por daños de $1,500 o tres veces los daños reales, lo que sea mayor

2. RECALLS: Verifique recalls de seguridad abiertos en www.nhtsa.gov/recalls o llame al fabricante. Los concesionarios deben reparar los recalls gratis, incluso en vehículos usados.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

LISTA DE VERIFICACIÓN DEL VENDEDOR - COMPLETAR ANTES/DESPUÉS DE LA VENTA:

☐ Verificar que el VIN coincida con el título y el vehículo
☐ Completar y firmar la sección de transferencia de título en el reverso del título
☐ Completar divulgación del odómetro (este Contrato de Compra-Venta satisface el requisito federal)
☐ Proporcionar Contrato de Compra-Venta al comprador (este documento)
☐ Proporcionar todas las llaves, manuales y documentos
☐ Retirar las placas (en la mayoría de los estados)
☐ Cancelar el seguro del vehículo
☐ Presentar Aviso de Transferencia y Liberación de Responsabilidad ante el DMV/MVD estatal dentro del plazo requerido
☐ Guardar una copia del Contrato de Compra-Venta firmado para sus registros

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

LISTA DE VERIFICACIÓN DEL COMPRADOR - COMPLETAR INMEDIATAMENTE DESPUÉS DE LA COMPRA:

☐ Obtener reporte de historial del vehículo si no se hizo antes de la compra
☐ Obtener título firmado del vendedor
☐ Obtener Contrato de Compra-Venta (este documento)
☐ Obtener todas las llaves, manuales y documentos
☐ Obtener cobertura de seguro ANTES de conducir el vehículo
☐ Registrar y titular el vehículo con el DMV de su estado dentro del plazo requerido (generalmente 10-30 días)
☐ Pagar impuesto sobre ventas, tarifas de registro y tarifas de título aplicables
☐ Completar inspección de emisiones/seguridad si lo requiere su estado
☐ Actualizar su compañía de seguros con la información del vehículo
☐ Guardar copias de todos los documentos en un lugar seguro

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCARGO DE RESPONSABILIDAD LEGAL:

Esta plantilla de Contrato de Compra-Venta se proporciona solo con fines informativos y no constituye asesoramiento legal. Las ventas de vehículos están regidas por la ley federal (divulgación del odómetro, requisitos de título) y la ley estatal (registro, impuestos, protección al consumidor), que varían significativamente según la jurisdicción.

Consulte con un abogado licenciado en su estado si tiene preguntas o inquietudes sobre:
• Transacciones complejas (títulos de salvamento, ventas fuera del estado, ventas de concesionarios)
• Disputas sobre la condición del vehículo o problemas de título
• Montos de transacción grandes
• Vehículos comerciales o tipos especiales de vehículos
• Planes de pago a plazos o financiamiento del vendedor
• Requisitos legales específicos del estado

Se alienta a ambas partes a:
• Investigar los requisitos específicos del DMV/MVD de su estado
• Entender sus derechos y obligaciones bajo la ley estatal
• Mantener registros detallados de la transacción
• Buscar asesoramiento legal para situaciones complejas

Esta plantilla está diseñada para ventas directas de vehículos entre particulares entre individuos. Puede no ser adecuada para ventas de concesionarios, ventas en subasta, transferencias de regalo, transferencias familiares u otras circunstancias especiales que pueden tener diferentes requisitos legales.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Este Contrato de Compra-Venta fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.`
};

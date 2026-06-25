// PLANTILLA PROFESIONAL DE CONTRATO DE COMPRA-VENTA DE VEHCULO
// Acuerdo completo para transacciones privadas de vehculos
// Incluye requisitos federales de declaracin de odmetro

import { DocumentTemplate } from '../types/document';

export const billOfSaleVehicleTemplateES: DocumentTemplate = {
  id: 'bill-of-sale-vehicle',
  name: 'Contrato de Compra-Venta de Vehculo',
  description: 'Contrato completo de compra-venta de vehculo para transacciones entre particulares. Incluye detalles del comprador/vendedor, informacin del vehculo, precio de venta, declaracin de odmetro (requisito federal), trminos de garanta/tal cual, y seccin de notarizacin.',
  category: 'Negocios y Contratos',
  price: 7.00,
  fields: [
    // Informacin del Vendedor
    { 
      id: 'seller_name', 
      label: 'Nombre Legal Completo del Vendedor', 
      type: 'text', 
      required: true,
      helpText: 'Nombre tal como aparece en el ttulo del vehculo' 
    },
    { 
      id: 'seller_address', 
      label: 'Direccin del Vendedor', 
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
      label: 'Cdigo Postal del Vendedor', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'seller_phone', 
      label: 'Telfono del Vendedor', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'seller_email', 
      label: 'Correo electrnico del Vendedor', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'seller_license', 
      label: 'Nmero de Licencia del Vendedor', 
      type: 'text', 
      required: false,
      helpText: 'Opcional pero recomendado para verificacin' 
    },
    
    // Informacin del Comprador
    { 
      id: 'buyer_name', 
      label: 'Nombre Legal Completo del Comprador', 
      type: 'text', 
      required: true,
      helpText: 'Nombre como aparecer en el nuevo ttulo' 
    },
    { 
      id: 'buyer_address', 
      label: 'Direccin del Comprador', 
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
      label: 'Cdigo Postal del Comprador', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'buyer_phone', 
      label: 'Telfono del Comprador', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'buyer_email', 
      label: 'Correo electrnico del Comprador', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'buyer_license', 
      label: 'Nmero de Licencia del Comprador', 
      type: 'text', 
      required: false,
      helpText: 'Opcional pero recomendado para verificacin' 
    },
    
    // Informacin del Vehculo
    { 
      id: 'vehicle_year', 
      label: 'Ao del Vehculo', 
      type: 'number', 
      required: true,
      placeholder: '2020' 
    },
    { 
      id: 'vehicle_make', 
      label: 'Marca del Vehculo', 
      type: 'text', 
      required: true,
      placeholder: 'Toyota, Honda, Ford, etc.',
      helpText: 'Fabricante del vehculo' 
    },
    { 
      id: 'vehicle_model', 
      label: 'Modelo del Vehculo', 
      type: 'text', 
      required: true,
      placeholder: 'Camry, Civic, F-150, etc.' 
    },
    { 
      id: 'vehicle_trim', 
      label: 'Versin/Estilo del Vehculo (Opcional)', 
      type: 'text', 
      required: false,
      placeholder: 'EX, Limited, XLT, etc.' 
    },
    { 
      id: 'vehicle_vin', 
      label: 'VIN del Vehculo (Nmero de Identificacin)', 
      type: 'text', 
      required: true,
      helpText: 'VIN de 17 caracteres ubicado en el tablero o marco de puerta',
      placeholder: '1HGBH41JXMN109186' 
    },
    { 
      id: 'vehicle_color', 
      label: 'Color del Vehculo', 
      type: 'text', 
      required: true,
      placeholder: 'Plateado, Negro, Azul, etc.' 
    },
    { 
      id: 'vehicle_body_type', 
      label: 'Tipo de Carrocera', 
      type: 'select',
      options: [
        'Sedn',
        'Cup',
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
      label: 'Lectura Actual del Odmetro (Millas)', 
      type: 'number', 
      required: true,
      helpText: 'Millaje exacto mostrado en el odmetro',
      placeholder: '75420' 
    },
    { 
      id: 'odometer_brand', 
      label: 'Estado del Odmetro', 
      type: 'select',
      options: [
        'Millaje Real',
        'Millaje Excede Lmites Mecnicos',
        'No es Millaje Real - Advertencia',
        'Odmetro Daado/Inoperante'
      ],
      required: true,
      helpText: 'Requisito federal - elija el estado preciso' 
    },
    { 
      id: 'title_number', 
      label: 'Nmero de Ttulo/Certificado', 
      type: 'text', 
      required: false,
      helpText: 'Nmero en el ttulo del vehculo' 
    },
    
    // Informacin de la Venta
    { 
      id: 'sale_price', 
      label: 'Precio de Venta ($)', 
      type: 'currency', 
      required: true,
      helpText: 'Precio total de compra en dlares estadounidenses' 
    },
    { 
      id: 'payment_method', 
      label: 'Mtodo de Pago', 
      type: 'select',
      options: [
        'Efectivo',
        'Cheque de Caja',
        'Cheque Personal',
        'Transferencia Bancaria',
        'Pago Electrnico (Zelle, Venmo, etc.)',
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
    
    // Condicin del Vehculo y Garanta
    { 
      id: 'vehicle_condition', 
      label: 'Declaracin de Condicin del Vehculo', 
      type: 'select',
      options: [
        'TAL CUAL - SIN GARANTA',
        'TAL CUAL con Garanta Limitada del Vendedor',
        'Con Garanta del Fabricante (An Vlida)',
        'Con Garanta Extendida'
      ],
      required: true,
      helpText: 'La mayora de ventas privadas son TAL CUAL' 
    },
    { 
      id: 'warranty_details', 
      label: 'Detalles de Garanta (si aplica)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Describa cualquier cobertura de garanta, fechas de expiracin, transferibilidad, etc.' 
    },
    { 
      id: 'known_defects', 
      label: 'Defectos/Problemas Conocidos (si los hay)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Liste cualquier problema mecnico conocido, dao o defectos. La honestidad protege a ambas partes.',
      helpText: 'Recomendado para transparencia' 
    },
    
    // Informacin del Ttulo y Gravmenes
    { 
      id: 'title_status', 
      label: 'Estado del Ttulo', 
      type: 'select',
      options: [
        'Ttulo Limpio - Sin Gravmenes',
        'Ttulo de Salvamento',
        'Ttulo Reconstruido',
        'Gravamen/Prstamo Pendiente - A Pagar',
        'Esperando Ttulo del DMV',
        'Otro'
      ],
      required: true,
      helpText: 'Sea honesto sobre el estado del ttulo' 
    },
    { 
      id: 'lienholder_name', 
      label: 'Nombre del Acreedor Prendario (si aplica)', 
      type: 'text', 
      required: false,
      helpText: 'Banco o prestamista con gravamen sobre el vehculo' 
    },
    { 
      id: 'lien_payoff', 
      label: 'Monto a Pagar del Gravamen (si aplica)', 
      type: 'currency', 
      required: false 
    },
    
    // Artculos Adicionales Incluidos
    { 
      id: 'included_items', 
      label: 'Artculos Adicionales Incluidos en la Venta', 
      type: 'textarea', 
      required: false,
      placeholder: 'Ejemplos: llanta de repuesto, tapetes, portaequipaje, llaves extra, manual del propietario, registros de servicio, etc.',
      helpText: 'Liste cualquier extra incluido con el vehculo' 
    },
    
    // Fecha y Ubicacin de Venta
    { 
      id: 'sale_date', 
      label: 'Fecha de Venta', 
      type: 'date', 
      required: true,
      helpText: 'Fecha en que la propiedad se transfiere al comprador' 
    },
    { 
      id: 'sale_location', 
      label: 'Ubicacin de Venta (Ciudad, Estado)', 
      type: 'text', 
      required: true,
      placeholder: 'Los ngeles, California' 
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
  
  template: `CONTRATO DE COMPRA-VENTA DE VEHCULO MOTORIZADO

ESTE CONTRATO DE COMPRA-VENTA se ejecuta el {{sale_date}}, en {{sale_location}}, entre:

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

VENDEDOR:

Nombre: {{seller_name}}
Direccin: {{seller_address}}
           {{seller_city}}, {{seller_state}} {{seller_zip}}
Telfono: {{seller_phone}}
{{#if seller_email}}Correo electrnico: {{seller_email}}{{/if}}
{{#if seller_license}}Licencia de Conducir: {{seller_license}}{{/if}}

(en adelante denominado "Vendedor")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

COMPRADOR:

Nombre: {{buyer_name}}
Direccin: {{buyer_address}}
           {{buyer_city}}, {{buyer_state}} {{buyer_zip}}
Telfono: {{buyer_phone}}
{{#if buyer_email}}Correo electrnico: {{buyer_email}}{{/if}}
{{#if buyer_license}}Licencia de Conducir: {{buyer_license}}{{/if}}

(en adelante denominado "Comprador")

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCRIPCIN DEL VEHCULO:

Ao:            {{vehicle_year}}
Marca:          {{vehicle_make}}
Modelo:         {{vehicle_model}}
{{#if vehicle_trim}}Versin:        {{vehicle_trim}}{{/if}}
Tipo:           {{vehicle_body_type}}
Color:          {{vehicle_color}}
VIN:            {{vehicle_vin}}
{{#if title_number}}Nm. Ttulo:    {{title_number}}{{/if}}

Lectura Actual del Odmetro: {{vehicle_mileage}} millas
Estado del Odmetro: {{odometer_brand}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 1 - VENTA Y TRANSFERENCIA

1.1. VENTA DEL VEHCULO. El Vendedor por este medio vende, transfiere y traspasa al Comprador, y el Comprador por este medio compra del Vendedor, el vehculo motorizado descrito arriba (el "Vehculo"), libre de todo gravamen y restriccin, excepto segn se divulgue especficamente en este Contrato de Compra-Venta.

1.2. FECHA EFECTIVA. Esta venta ser efectiva a partir del {{sale_date}} (la "Fecha de Venta"). El ttulo y el riesgo de prdida pasarn al Comprador en la Fecha de Venta al recibir el pago completo.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 2 - PRECIO DE COMPRA Y PAGO

2.1. PRECIO DE COMPRA. El precio total de compra del Vehculo es:

    PRECIO DE VENTA: USD {{sale_price}} (Dlares Estadounidenses)

2.2. M0TODO DE PAGO. El pago se realizar mediante: {{payment_method}}

2.3. ESTADO DEL PAGO: {{payment_status}}

{{#if balance_due}}
2.4. SALDO PENDIENTE. Un saldo de USD {{balance_due}} permanece pendiente y pagadero.
    {{#if payment_due_date}}Fecha de Vencimiento: {{payment_due_date}}{{/if}}
    
    Hasta que el saldo se pague en su totalidad:
    " El Vendedor retiene el ttulo legal del Vehculo
    " El Comprador no puede vender, transferir o gravar el Vehculo
    " El Vendedor puede recuperar el Vehculo si no se recibe el pago para la fecha de vencimiento
{{/if}}

2.5. RECIBO DE PAGO. El Vendedor reconoce haber recibido {{#if balance_due}}pago parcial{{else}}pago completo{{/if}} del Comprador en la cantidad especificada arriba.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 3 - TTULO Y PROPIEDAD

3.1. ESTADO DEL TTULO: {{title_status}}

3.2. DECLARACIONES DEL VENDEDOR. El Vendedor declara y garantiza que:
    (a) El Vendedor es el propietario legal del Vehculo con pleno derecho a vender;
    (b) La informacin de identificacin del Vehculo proporcionada es verdadera y precisa;
    (c) La lectura del odmetro divulgada es precisa segn el mejor conocimiento del Vendedor;
    (d) {{#if lienholder_name}}Existe un gravamen sobre el Vehculo en manos de {{lienholder_name}} por aproximadamente USD {{lien_payoff}}, el cual el Vendedor se compromete a pagar{{else}}El Vehculo est libre de todo gravamen y restriccin{{/if}};
    (e) El Vendedor ha divulgado todos los defectos materiales conocidos;
    (f) El Vendedor no ha recibido notificacin de que el Vehculo haya sido robado o est sujeto a reclamo de robo.

3.3. ENTREGA DEL TTULO. El Vendedor se compromete a entregar el Certificado de Ttulo debidamente firmado y notarizado al Comprador {{#if lienholder_name}}dentro de [X] das despus del pago del gravamen{{else}}inmediatamente al recibir el pago completo{{/if}}.

{{#if lienholder_name}}
3.4. PAGO DEL GRAVAMEN. El Vendedor se compromete a pagar el gravamen con {{lienholder_name}} y proporcionar al Comprador evidencia de la liberacin del gravamen dentro de un tiempo razonable despus de recibir el pago del Comprador.
{{/if}}

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 4 - CONDICIN Y GARANTA

4.1. CONDICIN DEL VEHCULO: {{vehicle_condition}}

{{#if warranty_details}}
4.2. INFORMACIN DE GARANTA:
{{warranty_details}}
{{/if}}

4.3. DESCARGO TAL CUAL (si aplica):
{{#if vehicle_condition}}
ESTE VEHCULO SE VENDE "TAL CUAL" Y "DONDE EST" CON TODOS SUS DEFECTOS. EL VENDEDOR NO OTORGA GARANTAS, EXPRESAS O IMPLCITAS, INCLUYENDO PERO NO LIMITADO A CUALQUIER GARANTA IMPLCITA DE COMERCIABILIDAD O IDONEIDAD PARA UN PROPSITO PARTICULAR. EL COMPRADOR ACEPTA EL VEHCULO EN SU CONDICIN ACTUAL Y ASUME TODO RIESGO DE SU CALIDAD Y DESEMPEO.

EL COMPRADOR RECONOCE QUE:
" El Comprador ha inspeccionado el Vehculo o ha renunciado al derecho de inspeccionarlo;
" El Comprador est satisfecho con la condicin del Vehculo;
" El Comprador asume todo riesgo de reparaciones y defectos;
" El Vendedor no tiene obligacin de reparar o pagar por defectos descubiertos despus de la venta;
" El Comprador est comprando el Vehculo basndose nicamente en su propia inspeccin y juicio.
{{/if}}

{{#if known_defects}}
4.4. DEFECTOS Y PROBLEMAS CONOCIDOS DIVULGADOS POR EL VENDEDOR:

{{known_defects}}

El Comprador reconoce haber sido informado de los defectos anteriores y acepta el Vehculo con dichos defectos.
{{/if}}

4.5. ACEPTACIN DEL COMPRADOR. Al firmar este Contrato de Compra-Venta, el Comprador reconoce haber tenido la oportunidad de inspeccionar el Vehculo y lo acepta en su condicin actual.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 5 - DECLARACIN FEDERAL DEL ODMETRO
(Requerido por Ley Federal - 49 U.S.C.  32705)

5.1. LECTURA DEL ODMETRO. El odmetro del Vehculo ahora marca {{vehicle_mileage}} millas.

5.2. ESTADO DEL ODMETRO: {{odometer_brand}}

Yo, {{seller_name}}, declaro que segn mi mejor conocimiento:

 La lectura del odmetro refleja el MILLAJE REAL del vehculo.

 La lectura del odmetro EXCEDE los lmites mecnicos del odmetro y NO es el millaje real. ADVERTENCIA - DISCREPANCIA DE ODMETRO.

 La lectura del odmetro NO es el millaje real. ADVERTENCIA - DISCREPANCIA DE ODMETRO.

 El odmetro est daado, desconectado o no funciona, y el millaje no puede determinarse.

5.3. ADVERTENCIA FEDERAL: La ley federal y estatal requiere que declare el millaje al transferir la propiedad. No completar esta declaracin o proporcionar informacin falsa puede resultar en multas y/o prisin. La divulgacin del millaje debe entregarse al cesionario en conjunto con la transferencia de propiedad.

5.4. CERTIFICACIN DEL VENDEDOR. Por este medio certifico que la informacin del odmetro proporcionada arriba es verdadera y precisa segn mi mejor conocimiento.

_____________________________________
Firma del Vendedor (Declaracin de Odmetro)

Fecha: ___________________________

5.5. RECONOCIMIENTO DEL COMPRADOR. Por este medio reconozco haber recibido esta declaracin de odmetro.

_____________________________________
Firma del Comprador

Fecha: ___________________________

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 6 - ARTCULOS Y ACCESORIOS ADICIONALES

{{#if included_items}}
6.1. ARTCULOS INCLUIDOS EN LA VENTA. Los siguientes artculos estn incluidos con el Vehculo:

{{included_items}}

6.2. Los artculos no especficamente listados arriba no estn incluidos a menos que se acuerde por separado por escrito.
{{else}}
6.1. ARTCULOS INCLUIDOS. Solo el Vehculo mismo est incluido. No se incluyen accesorios, equipos o artculos adicionales a menos que sean especficamente listados por las partes por escrito.
{{/if}}

6.3. LLAVES Y DOCUMENTOS. El Vendedor proporcionar al Comprador:
     Todas las llaves y controles disponibles
     Manual del propietario (si est disponible)
     Registros de mantenimiento (si estn disponibles)
     Certificado de Ttulo firmado
     Declaracin del Odmetro (este documento)

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 7 - RESPONSABILIDADES DEL COMPRADOR

7.1. REGISTRO Y TITULACIN. El Comprador es el nico responsable de:
    (a) Registrar el Vehculo con el departamento estatal de vehculos motorizados apropiado;
    (b) Transferir el ttulo al nombre del Comprador;
    (c) Pagar todas las tarifas de registro, tarifas de ttulo e impuestos aplicables;
    (d) Obtener seguro vehicular segn lo requiera la ley;
    (e) Cumplir con todos los requisitos especficos del estado para el registro de vehculos.

7.2. LMITE DE TIEMPO. El Comprador debe completar el registro y la transferencia del ttulo dentro del perodo de tiempo requerido por la ley estatal (tpicamente 10-30 das) para evitar penalidades.

7.3. INSPECCIONES DE EMISIONES Y SEGURIDAD. El Comprador es responsable de cualquier prueba de emisiones requerida, inspecciones de seguridad o verificaciones de smog requeridas por el estado de registro del Comprador.

7.4. IMPUESTOS. El Comprador es responsable de todo impuesto sobre ventas, impuesto sobre uso y otros impuestos adeudados en esta transaccin segn lo requiera la ley estatal y local aplicable.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 8 - RESPONSABILIDADES DEL VENDEDOR

8.1. NOTIFICACIN DE VENTA. El Vendedor notificar al departamento estatal de vehculos motorizados de la venta dentro del tiempo requerido por la ley estatal para evitar responsabilidad por futuros boletos, accidentes u otros incidentes relacionados con el Vehculo.

8.2. LIBERACIN DE RESPONSABILIDAD. El Vendedor presentar un formulario de Liberacin de Responsabilidad ante el DMV/MVD estatal para notificar formalmente al estado que el Vendedor ya no es el propietario del Vehculo.

8.3. PLACAS. El Vendedor [retendr/transferir] las placas segn los requisitos de la ley estatal.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 9 - DECLARACIONES Y CERTIFICACIONES

9.1. EL VENDEDOR CERTIFICA:
    S Soy el propietario legal del Vehculo y tengo el derecho de venderlo
    S El VIN e informacin del vehculo proporcionados son precisos
    S El Vehculo no ha sido reportado como robado
    S {{#if lienholder_name}}Existe un gravamen que pagar{{else}}El ttulo est libre de gravmenes{{/if}}
    S He divulgado todos los defectos conocidos segn mi mejor conocimiento
    S La lectura del odmetro es precisa segn mi mejor conocimiento
    S Proporcionar un ttulo debidamente firmado al Comprador
    S Notificar al DMV/MVD de esta venta

9.2. EL COMPRADOR CERTIFICA:
    S He inspeccionado el Vehculo o he renunciado a mi derecho de inspeccin
    S Acepto el Vehculo en su condicin actual
    S Entiendo que estoy comprando TAL CUAL (si aplica)
    S Registrar y titular el Vehculo a mi nombre
    S Obtendr seguro segn lo requiera la ley
    S Pagar todos los impuestos y tarifas aplicables
    S Entiendo que esta transaccin est regida por la ley estatal y federal

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 10 - RESPONSABILIDAD Y RIESGO DE P0RDIDA

10.1. TRANSFERENCIA DE RIESGO. El riesgo de prdida o dao al Vehculo pasa al Comprador el {{sale_date}} al tomar posesin el Comprador, independientemente de cundo se transfiera oficialmente el ttulo.

10.2. SEGURO. El Comprador es responsable de obtener cobertura de seguro sobre el Vehculo inmediatamente al tomar posesin. El seguro del Vendedor ya no cubrir el Vehculo despus de la Fecha de Venta.

10.3. LIBERACIN DE RESPONSABILIDAD. A partir del {{sale_date}}, el Vendedor no ser responsable por boletos, accidentes, daos, lesiones u otros incidentes relacionados con el Vehculo. El Comprador asume toda dicha responsabilidad.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 11 - RESOLUCIN DE DISPUTAS

11.1. LEY APLICABLE. Este Contrato de Compra-Venta se regir e interpretar de acuerdo con las leyes del Estado de {{governing_state}}, sin consideracin a sus principios de conflicto de leyes.

11.2. DISPUTAS. Cualquier disputa que surja de esta transaccin se resolver mediante:
    (a) Negociacin de buena fe entre las partes;
    (b) Si la negociacin falla, mediacin o arbitraje segn se acuerde mutuamente;
    (c) Si es necesario, accin legal en los tribunales de {{governing_state}}.

11.3. HONORARIOS DE ABOGADO. En caso de una disputa legal, la parte que prevalezca puede tener derecho a recuperar honorarios razonables de abogado y costos.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 12 - DISPOSICIONES GENERALES

12.1. ACUERDO COMPLETO. Este Contrato de Compra-Venta constituye el acuerdo completo entre el Vendedor y el Comprador con respecto a la venta del Vehculo y reemplaza todas las negociaciones, entendimientos y acuerdos previos.

12.2. ENMIENDAS. Este Contrato de Compra-Venta no puede ser enmendado o modificado excepto por un instrumento escrito firmado tanto por el Vendedor como por el Comprador.

12.3. DIVISIBILIDAD. Si cualquier disposicin de este Contrato de Compra-Venta se considera invlida o inaplicable, las disposiciones restantes continuarn en pleno vigor y efecto.

12.4. EFECTO VINCULANTE. Este Contrato de Compra-Venta ser vinculante y en beneficio de las partes y sus respectivos herederos, ejecutores, administradores, sucesores y cesionarios.

12.5. CONTRAPARTES. Este Contrato de Compra-Venta puede ejecutarse en mltiples contrapartes, cada una de las cuales se considerar un original y todas juntas constituirn un mismo documento.

12.6. SIN GARANTAS DEL VENDEDOR (VENTAS TAL CUAL). A menos que se indique expresamente lo contrario en este documento, el Vendedor no hace declaraciones o garantas con respecto a la condicin, calidad, comerciabilidad o idoneidad del Vehculo para cualquier propsito particular.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

ARTCULO 13 - FIRMAS Y RECONOCIMIENTO

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

En este da _______ de ________________, 20___, ante m, un Notario Pblico en y para dicho Estado, comparecieron personalmente {{seller_name}} y {{buyer_name}}, conocidos por m (o satisfactoriamente comprobados) como las personas cuyos nombres estn suscritos al instrumento anterior, y reconocieron que ejecutaron el mismo para los propsitos en l contenidos.

EN FE DE LO CUAL, he puesto mi mano y sello oficial.


_____________________________________
Notario Pblico

Mi Comisin Expira: _______________

[SELLO NOTARIAL]


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

AVISOS LEGALES IMPORTANTES Y DESCARGOS DE RESPONSABILIDAD

a PRECAUCIN AL COMPRADOR - INFORMACIN IMPORTANTE DE PROTECCIN AL CONSUMIDOR:

1. REPORTE DE HISTORIAL DEL VEHCULO: Antes de comprar cualquier vehculo usado, obtenga un reporte de historial del vehculo de Carfax, AutoCheck o el Sistema Nacional de Informacin de Ttulos de Vehculos Motorizados (NMVTIS) usando el VIN. Verifique:
   " Historial de accidentes
   " Daos por inundacin
   " Ttulo de salvamento/reconstruido
   " Reversin del odmetro
   " Informacin de recalls
   " Nmero de propietarios previos
   " Registros de mantenimiento

2. INSPECCIN PREVIA A LA COMPRA: Haga que un mecnico independiente inspeccione el vehculo ANTES de completar la compra. Una inspeccin previa a la compra ($100-200) puede ahorrar miles en reparaciones inesperadas.

3. PRUEBA DE MANEJO: Siempre pruebe el vehculo bajo varias condiciones (autopista, ciudad, estacionamiento) antes de comprar.

4. VERIFICACIN DEL TTULO: Verifique que el nombre del vendedor en el ttulo coincida con su identificacin y este Contrato de Compra-Venta. Nunca compre un vehculo sin un ttulo limpio a nombre del vendedor.

5. VERIFICACIN DE GRAVMENES: Contacte al DMV de su estado para verificar que no haya gravmenes no divulgados sobre el vehculo. Una bsqueda de gravmenes puede prevenir que compre un vehculo que el vendedor legalmente no posee.

6. VENTAS TAL CUAL: La mayora de las ventas entre particulares son "TAL CUAL" sin garanta. Una vez que se vaya, todos los problemas son suyos. Inspeccione cuidadosamente.

7. EMISIONES E INSPECCIN: Algunos estados requieren pruebas de emisiones y/o inspeccin de seguridad antes del registro. Considere este costo y posible falla en su decisin.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

REQUISITOS ESPECFICOS POR ESTADO (Ejemplos - Verifique Su Estado):

" CALIFORNIA: Se requiere certificado de smog (a menos que est exento). El vendedor debe proporcionar dentro de los 90 das de la venta.
" TEXAS: Se requiere inspeccin vehicular dentro de los 7 das de la venta para el registro.
" NUEVA YORK: El Contrato de Compra-Venta debe ser notarizado para el registro en el DMV.
" FLORIDA: La transferencia del ttulo debe ocurrir dentro de los 30 das para evitar cargos por mora.
" MASSACHUSETTS: Debe pasar la inspeccin estatal dentro de los 7 das de la compra.

SIEMPRE VERIFIQUE LOS REQUISITOS ESPECFICOS DE SU ESTADO para:
S Requisitos de notarizacin para el Contrato de Compra-Venta
S Lmites de tiempo para transferencia de ttulo y registro
S Requisitos de inspeccin de emisiones y seguridad
S Procedimientos de cobro y pago de impuestos sobre ventas
S Formularios y divulgaciones requeridas
S Protecciones de ley limn (generalmente no aplican a ventas privadas)

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

REQUISITOS FEDERALES:

1. DIVULGACIN DE ODMETRO (49 U.S.C.  32705): La ley federal REQUIERE divulgacin precisa del odmetro para vehculos de menos de 20 aos. Las violaciones pueden resultar en:
   " Penalidades civiles hasta $10,000
   " Penalidades criminales incluyendo multas y prisin
   " El comprador puede demandar por daos de $1,500 o tres veces los daos reales, lo que sea mayor

2. RECALLS: Verifique recalls de seguridad abiertos en www.nhtsa.gov/recalls o llame al fabricante. Los concesionarios deben reparar los recalls gratis, incluso en vehculos usados.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

LISTA DE VERIFICACIN DEL VENDEDOR - COMPLETAR ANTES/DESPU0S DE LA VENTA:

 Verificar que el VIN coincida con el ttulo y el vehculo
 Completar y firmar la seccin de transferencia de ttulo en el reverso del ttulo
 Completar divulgacin del odmetro (este Contrato de Compra-Venta satisface el requisito federal)
 Proporcionar Contrato de Compra-Venta al comprador (este documento)
 Proporcionar todas las llaves, manuales y documentos
 Retirar las placas (en la mayora de los estados)
 Cancelar el seguro del vehculo
 Presentar Aviso de Transferencia y Liberacin de Responsabilidad ante el DMV/MVD estatal dentro del plazo requerido
 Guardar una copia del Contrato de Compra-Venta firmado para sus registros

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

LISTA DE VERIFICACIN DEL COMPRADOR - COMPLETAR INMEDIATAMENTE DESPU0S DE LA COMPRA:

 Obtener reporte de historial del vehculo si no se hizo antes de la compra
 Obtener ttulo firmado del vendedor
 Obtener Contrato de Compra-Venta (este documento)
 Obtener todas las llaves, manuales y documentos
 Obtener cobertura de seguro ANTES de conducir el vehculo
 Registrar y titular el vehculo con el DMV de su estado dentro del plazo requerido (generalmente 10-30 das)
 Pagar impuesto sobre ventas, tarifas de registro y tarifas de ttulo aplicables
 Completar inspeccin de emisiones/seguridad si lo requiere su estado
 Actualizar su compaa de seguros con la informacin del vehculo
 Guardar copias de todos los documentos en un lugar seguro

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

DESCARGO DE RESPONSABILIDAD LEGAL:

Esta plantilla de Contrato de Compra-Venta se proporciona solo con fines informativos y no constituye asesoramiento legal. Las ventas de vehculos estn regidas por la ley federal (divulgacin del odmetro, requisitos de ttulo) y la ley estatal (registro, impuestos, proteccin al consumidor), que varan significativamente segn la jurisdiccin.

Consulte con un abogado licenciado en su estado si tiene preguntas o inquietudes sobre:
" Transacciones complejas (ttulos de salvamento, ventas fuera del estado, ventas de concesionarios)
" Disputas sobre la condicin del vehculo o problemas de ttulo
" Montos de transaccin grandes
" Vehculos comerciales o tipos especiales de vehculos
" Planes de pago a plazos o financiamiento del vendedor
" Requisitos legales especficos del estado

Se alienta a ambas partes a:
" Investigar los requisitos especficos del DMV/MVD de su estado
" Entender sus derechos y obligaciones bajo la ley estatal
" Mantener registros detallados de la transaccin
" Buscar asesoramiento legal para situaciones complejas

Esta plantilla est diseada para ventas directas de vehculos entre particulares entre individuos. Puede no ser adecuada para ventas de concesionarios, ventas en subasta, transferencias de regalo, transferencias familiares u otras circunstancias especiales que pueden tener diferentes requisitos legales.

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Este Contrato de Compra-Venta fue generado el {{current_month}} {{current_day}}, {{current_year}}.

AMBAS PARTES DEBEN CONSERVAR UNA COPIA FIRMADA PARA SUS REGISTROS.`
};



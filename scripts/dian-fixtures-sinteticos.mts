// Genera fixtures SINTÉTICOS de los tipos de documento que no aparecieron en
// la muestra real: documento equivalente POS y nota débito.
//
//   npm run fixtures:dian
//
// Por qué existe este archivo
// ───────────────────────────
// Los 10 documentos reales de `fixtures-dian/` son 9 facturas tipo 01 y 1 nota
// crédito. El parser tiene desde el día uno el código para leer documento
// equivalente (InvoiceTypeCode 04/91/92/96) y nota débito (raíz DebitNote,
// cantidad en DebitedQuantity), pero ese código nunca se ejecutó contra un
// documento de verdad. Código que nunca corrió no está probado: está escrito.
//
// El documento equivalente POS es, además, el caso de MAYOR volumen para un
// contador colombiano — un solo cliente tendero le entrega más POS al mes que
// facturas todo el resto de su cartera. Que sea justo el dialecto sin probar
// es el riesgo más caro del motor.
//
// Estos archivos NO vienen de la DIAN. Están construidos a mano siguiendo la
// estructura verificada en los documentos reales, y van marcados como
// sintéticos en tres sitios (nombre de archivo, razón social y una cbc:Note)
// para que nadie los confunda nunca con evidencia real. Por eso mismo sí se
// versionan en git, al contrario que `fixtures-dian/`, que está ignorado.
//
// Cada fixture existe para ejercitar una decisión concreta del parser; el
// comentario sobre cada uno dice cuál.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SALIDA = path.resolve('./fixtures-dian-sinteticos');

/** CUFE/CUDE de mentira pero con la forma correcta: SHA-384 en hexadecimal,
 *  96 caracteres. Determinista, para que regenerar no ensucie el diff. */
const cufeFalso = (semilla: string): string =>
  crypto.createHash('sha384').update(`sintetico:${semilla}`).digest('hex');

const AVISO =
  'DOCUMENTO SINTETICO DE PRUEBA - generado por scripts/dian-fixtures-sinteticos.mts. ' +
  'No proviene de la DIAN ni de ningun contribuyente real.';

const NS_INVOICE = [
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
  'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
  'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"',
  'xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"',
  'xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1"',
].join(' ');

const NS_DEBIT = NS_INVOICE.replace(
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"',
);

const NS_ADJUNTO = [
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:AttachedDocument-2"',
  'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
  'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"',
].join(' ');

const NS_RESPUESTA = [
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"',
  'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
  'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"',
].join(' ');

/** Importe con dos decimales, como lo escriben los emisores reales. */
const m = (n: number): string => n.toFixed(2);

// ── Piezas comunes ────────────────────────────────────────────────────────

/** La extensión DIAN con la autorización de numeración. El parser la busca
 *  por nombre en todo el árbol, así que sirve igual dentro de la factura
 *  suelta que dentro del AttachedDocument. */
const extensionesDian = (opts: {
  resolucion: string;
  prefijo: string;
  desde: string;
  hasta: string;
  cufe: string;
}) => `<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent><sts:DianExtensions>
  <sts:InvoiceControl>
    <sts:InvoiceAuthorization>${opts.resolucion}</sts:InvoiceAuthorization>
    <sts:AuthorizationPeriod><cbc:StartDate>2026-01-01</cbc:StartDate><cbc:EndDate>2027-12-31</cbc:EndDate></sts:AuthorizationPeriod>
    <sts:AuthorizedInvoices><sts:Prefix>${opts.prefijo}</sts:Prefix><sts:From>${opts.desde}</sts:From><sts:To>${opts.hasta}</sts:To></sts:AuthorizedInvoices>
  </sts:InvoiceControl>
  <sts:InvoiceSource><cbc:IdentificationCode listAgencyID="6" listAgencyName="United Nations Economic Commission for Europe" listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1">CO</cbc:IdentificationCode></sts:InvoiceSource>
  <sts:SoftwareProvider><sts:ProviderID schemeID="9" schemeName="31">900555444</sts:ProviderID><sts:SoftwareID schemeAgencyID="195">11111111-2222-3333-4444-555555555555</sts:SoftwareID></sts:SoftwareProvider>
  <sts:QRCode>https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${opts.cufe}</sts:QRCode>
</sts:DianExtensions></ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>`;

interface Parte {
  nit: string;
  dv: string;
  razon: string;
  comercial: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  regimen: string;
}

const EMISOR_POS: Parte = {
  nit: '900123456', dv: '7',
  razon: 'SUPERTIENDA SINTETICA S.A.S. (FIXTURE)',
  comercial: 'SUPERTIENDA SINTETICA',
  ciudad: 'BOGOTA D.C.', departamento: 'Bogota',
  direccion: 'CALLE 100 # 10 - 10', regimen: 'O-13',
};

const EMISOR_RESTAURANTE: Parte = {
  nit: '901222333', dv: '4',
  razon: 'RESTAURANTE SINTETICO LTDA. (FIXTURE)',
  comercial: 'RESTAURANTE SINTETICO',
  ciudad: 'MEDELLIN', departamento: 'Antioquia',
  direccion: 'CARRERA 43A # 5 - 15', regimen: 'O-13',
};

const EMISOR_MAYORISTA: Parte = {
  nit: '830444555', dv: '1',
  razon: 'MAYORISTA SINTETICA S.A. (FIXTURE)',
  comercial: 'MAYORISTA SINTETICA',
  ciudad: 'CALI', departamento: 'Valle del Cauca',
  direccion: 'AVENIDA 6N # 23 - 61', regimen: 'O-13;O-23',
};

const RECEPTOR: Parte = {
  nit: '901987654', dv: '3',
  razon: 'CLIENTE SINTETICO S.A.S. (FIXTURE)',
  comercial: 'CLIENTE SINTETICO',
  ciudad: 'BOGOTA D.C.', departamento: 'Bogota',
  direccion: 'CARRERA 7 # 71 - 21', regimen: 'O-13',
};

const parte = (etiqueta: string, p: Parte, cuenta: string) => `<cac:${etiqueta}>
  <cbc:AdditionalAccountID>${cuenta}</cbc:AdditionalAccountID>
  <cac:Party>
    <cac:PartyName><cbc:Name>${p.comercial}</cbc:Name></cac:PartyName>
    <cac:PhysicalLocation><cac:Address>
      <cbc:ID>11001</cbc:ID>
      <cbc:CityName>${p.ciudad}</cbc:CityName>
      <cbc:CountrySubentity>${p.departamento}</cbc:CountrySubentity>
      <cac:AddressLine><cbc:Line>${p.direccion}</cbc:Line></cac:AddressLine>
      <cac:Country><cbc:IdentificationCode>CO</cbc:IdentificationCode><cbc:Name languageID="es">Colombia</cbc:Name></cac:Country>
    </cac:Address></cac:PhysicalLocation>
    <cac:PartyTaxScheme>
      <cbc:RegistrationName>${p.razon}</cbc:RegistrationName>
      <cbc:CompanyID schemeAgencyID="195" schemeID="${p.dv}" schemeName="31">${p.nit}</cbc:CompanyID>
      <cbc:TaxLevelCode listName="48">${p.regimen}</cbc:TaxLevelCode>
      <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
    </cac:PartyTaxScheme>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${p.razon}</cbc:RegistrationName>
      <cbc:CompanyID schemeAgencyID="195" schemeID="${p.dv}" schemeName="31">${p.nit}</cbc:CompanyID>
    </cac:PartyLegalEntity>
    <cac:Contact><cbc:Telephone>6015550000</cbc:Telephone><cbc:ElectronicMail>fixture@ejemplo.invalid</cbc:ElectronicMail></cac:Contact>
  </cac:Party>
</cac:${etiqueta}>`;

/** Un subtotal de impuesto. `tarifa` va como Percent; los códigos sin tarifa
 *  real (ZZ = No aplica) se escriben igual con 0.00, que es lo que hacen los
 *  emisores de verdad. */
const subtotal = (codigo: string, nombre: string, base: number, tarifa: number, valor: number) =>
  `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${m(base)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${m(valor)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>${m(tarifa)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>${codigo}</cbc:ID><cbc:Name>${nombre}</cbc:Name></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;

const bloqueImpuesto = (total: number, subs: string[]) =>
  `<cac:TaxTotal><cbc:TaxAmount currencyID="COP">${m(total)}</cbc:TaxAmount>${subs.join('')}</cac:TaxTotal>`;

const bloqueRetencion = (total: number, subs: string[]) =>
  `<cac:WithholdingTaxTotal><cbc:TaxAmount currencyID="COP">${m(total)}</cbc:TaxAmount>${subs.join('')}</cac:WithholdingTaxTotal>`;

interface Linea {
  numero: number;
  cantidad: number;
  unidad: string;
  precio: number;
  bruto: number;
  descripcion: string;
  codigo: string;
  impuestos: string;
}

const linea = (etiquetaLinea: string, etiquetaCantidad: string, l: Linea) => `<cac:${etiquetaLinea}>
    <cbc:ID>${l.numero}</cbc:ID>
    <cbc:${etiquetaCantidad} unitCode="${l.unidad}">${l.cantidad}</cbc:${etiquetaCantidad}>
    <cbc:LineExtensionAmount currencyID="COP">${m(l.bruto)}</cbc:LineExtensionAmount>
    ${l.impuestos}
    <cac:Item>
      <cbc:Description>${l.descripcion}</cbc:Description>
      <cac:SellersItemIdentification><cbc:ID>${l.codigo}</cbc:ID></cac:SellersItemIdentification>
      <cac:StandardItemIdentification><cbc:ID schemeID="999">${l.codigo}</cbc:ID></cac:StandardItemIdentification>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="COP">${m(l.precio)}</cbc:PriceAmount><cbc:BaseQuantity unitCode="${l.unidad}">${l.cantidad}</cbc:BaseQuantity></cac:Price>
  </cac:${etiquetaLinea}>`;

interface Totales {
  bruto: number;
  baseGravable: number;
  conImpuestos: number;
  pagar: number;
}

const totales = (t: Totales) => `<cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${m(t.bruto)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${m(t.baseGravable)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${m(t.conImpuestos)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${m(t.pagar)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;

// ── Fixture 1 · documento equivalente POS, el caso corriente ───────────────
//
// Ejercita: InvoiceTypeCode 04 → tipo 'documento_equivalente'. Llega SUELTO,
// sin AttachedDocument: la caja registradora entrega el XML directo, no el
// contenedor del portal. Si el parser sólo supiera desanidar contenedores,
// este archivo — el más frecuente de todos — se caería.

function posSimple(): string {
  const cufe = cufeFalso('pos-simple');
  const l1 = { numero: 1, cantidad: 2, unidad: '94', precio: 8500, bruto: 17000, descripcion: 'ARROZ BLANCO 500 G', codigo: 'P-1001' };
  const l2 = { numero: 2, cantidad: 1, unidad: '94', precio: 12000, bruto: 12000, descripcion: 'ACEITE GIRASOL 1 L', codigo: 'P-1002' };
  const iva1 = 3230;   // 17.000 × 19 %
  const iva2 = 2280;   // 12.000 × 19 %

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${NS_INVOICE}>
${extensionesDian({ resolucion: '18760000001', prefijo: 'POS', desde: '1', hasta: '5000000', cufe })}
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Documento Equivalente Electronico P.O.S.</cbc:ProfileID>
  <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
  <cbc:ID>POS45120</cbc:ID>
  <cbc:UUID schemeID="1" schemeName="CUDE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>2026-08-04</cbc:IssueDate>
  <cbc:IssueTime>10:22:13-05:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode>04</cbc:InvoiceTypeCode>
  <cbc:Note>${AVISO}</cbc:Note>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>2</cbc:LineCountNumeric>
  ${parte('AccountingSupplierParty', EMISOR_POS, '1')}
  ${parte('AccountingCustomerParty', RECEPTOR, '1')}
  <cac:PaymentMeans><cbc:ID>1</cbc:ID><cbc:PaymentMeansCode>10</cbc:PaymentMeansCode></cac:PaymentMeans>
  ${bloqueImpuesto(iva1 + iva2, [subtotal('01', 'IVA', 29000, 19, iva1 + iva2)])}
  ${totales({ bruto: 29000, baseGravable: 29000, conImpuestos: 34510, pagar: 34510 })}
  ${linea('InvoiceLine', 'InvoicedQuantity', { ...l1, impuestos: bloqueImpuesto(iva1, [subtotal('01', 'IVA', 17000, 19, iva1)]) })}
  ${linea('InvoiceLine', 'InvoicedQuantity', { ...l2, impuestos: bloqueImpuesto(iva2, [subtotal('01', 'IVA', 12000, 19, iva2)]) })}
</Invoice>
`;
}

// ── Fixture 2 · POS con gravados y excluidos mezclados ─────────────────────
//
// Ejercita la trampa número uno del dominio, ya documentada en parser.ts:
// TaxExclusiveAmount es la base GRAVABLE, no el subtotal antes de impuestos.
// Aquí valen cosas distintas a propósito (12.600 contra 19.600). Un motor que
// cuadre contra TaxExclusiveAmount calcularía 14.994 y marcaría descuadrada
// una factura perfecta — y en un supermercado son casi todas así.

function posMixto(): string {
  const cufe = cufeFalso('pos-mixto');
  const iva = 2394; // 12.600 × 19 %

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${NS_INVOICE}>
${extensionesDian({ resolucion: '18760000001', prefijo: 'POS', desde: '1', hasta: '5000000', cufe })}
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Documento Equivalente Electronico P.O.S.</cbc:ProfileID>
  <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
  <cbc:ID>POS45121</cbc:ID>
  <cbc:UUID schemeID="1" schemeName="CUDE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>2026-08-04</cbc:IssueDate>
  <cbc:IssueTime>11:05:47-05:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode>04</cbc:InvoiceTypeCode>
  <cbc:Note>${AVISO}</cbc:Note>
  <cbc:Note>Mezcla deliberada de linea gravada y linea excluida de IVA.</cbc:Note>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>2</cbc:LineCountNumeric>
  ${parte('AccountingSupplierParty', EMISOR_POS, '1')}
  ${parte('AccountingCustomerParty', RECEPTOR, '1')}
  <cac:PaymentMeans><cbc:ID>1</cbc:ID><cbc:PaymentMeansCode>10</cbc:PaymentMeansCode></cac:PaymentMeans>
  ${bloqueImpuesto(iva, [
    subtotal('01', 'IVA', 12600, 19, iva),
    subtotal('ZZ', 'No aplica', 7000, 0, 0),
  ])}
  ${totales({ bruto: 19600, baseGravable: 12600, conImpuestos: 21994, pagar: 21994 })}
  ${linea('InvoiceLine', 'InvoicedQuantity', {
    numero: 1, cantidad: 3, unidad: '94', precio: 4200, bruto: 12600,
    descripcion: 'GALLETAS SURTIDAS 300 G', codigo: 'P-2001',
    impuestos: bloqueImpuesto(iva, [subtotal('01', 'IVA', 12600, 19, iva)]),
  })}
  ${linea('InvoiceLine', 'InvoicedQuantity', {
    numero: 2, cantidad: 2, unidad: '94', precio: 3500, bruto: 7000,
    descripcion: 'LECHE ENTERA 1 L (EXCLUIDA)', codigo: 'P-2002',
    impuestos: bloqueImpuesto(0, [subtotal('ZZ', 'No aplica', 7000, 0, 0)]),
  })}
</Invoice>
`;
}

// ── Fixture 3 · POS de restaurante con INC ────────────────────────────────
//
// Ejercita el impuesto 04 (INC) llegando solo, sin IVA. Un restaurante no
// factura IVA sobre el consumo: factura impuesto al consumo al 8 %. Si el
// resumen tratara todo lo que no es IVA como "otros", la hoja de impuestos
// del Excel le saldría mal a un gremio entero.

function posRestaurante(): string {
  const cufe = cufeFalso('pos-restaurante');
  const inc = 4480; // 56.000 × 8 %

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${NS_INVOICE}>
${extensionesDian({ resolucion: '18760000777', prefijo: 'REST', desde: '1', hasta: '1000000', cufe })}
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Documento Equivalente Electronico P.O.S.</cbc:ProfileID>
  <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
  <cbc:ID>REST8890</cbc:ID>
  <cbc:UUID schemeID="1" schemeName="CUDE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>2026-08-05</cbc:IssueDate>
  <cbc:IssueTime>13:40:02-05:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode>04</cbc:InvoiceTypeCode>
  <cbc:Note>${AVISO}</cbc:Note>
  <cbc:Note>Servicio de restaurante: impuesto al consumo del 8 %, sin IVA.</cbc:Note>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  ${parte('AccountingSupplierParty', EMISOR_RESTAURANTE, '1')}
  ${parte('AccountingCustomerParty', RECEPTOR, '1')}
  <cac:PaymentMeans><cbc:ID>1</cbc:ID><cbc:PaymentMeansCode>49</cbc:PaymentMeansCode></cac:PaymentMeans>
  ${bloqueImpuesto(inc, [subtotal('04', 'INC', 56000, 8, inc)])}
  ${totales({ bruto: 56000, baseGravable: 56000, conImpuestos: 60480, pagar: 60480 })}
  ${linea('InvoiceLine', 'InvoicedQuantity', {
    numero: 1, cantidad: 2, unidad: '94', precio: 28000, bruto: 56000,
    descripcion: 'ALMUERZO EJECUTIVO', codigo: 'M-01',
    impuestos: bloqueImpuesto(inc, [subtotal('04', 'INC', 56000, 8, inc)]),
  })}
</Invoice>
`;
}

// ── Fixture 4 · nota débito dentro de AttachedDocument, con retenciones ────
//
// Ejercita tres cosas a la vez:
//  · raíz DebitNote → contenedor DebitNoteLine y cantidad DebitedQuantity.
//    Es el único dialecto que ningún documento real de la muestra tocó.
//  · el contenedor del portal con sus DOS bloques CDATA (nota + acuse).
//  · WithholdingTaxTotal con las tres retenciones, que alimentan la cuarta
//    hoja del Excel y en la muestra real sólo aparecían dos veces.

function notaDebito(): string {
  const cude = cufeFalso('nota-debito');
  const iva = 95000;        // 500.000 × 19 %
  const reteFuente = 12500; // 500.000 × 2,5 %
  const reteIva = 14250;    // 95.000 × 15 %
  const reteIca = 4830;     // 500.000 × 9,66 x mil
  const retenciones = reteFuente + reteIva + reteIca;

  const nota = `<?xml version="1.0" encoding="UTF-8"?>
<DebitNote ${NS_DEBIT}>
${extensionesDian({ resolucion: '18760000342', prefijo: 'ND', desde: '1', hasta: '100000', cufe: cude })}
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>30</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Nota Debito de Factura Electronica de Venta</cbc:ProfileID>
  <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
  <cbc:ID>ND1204</cbc:ID>
  <cbc:UUID schemeID="1" schemeName="CUDE-SHA384">${cude}</cbc:UUID>
  <cbc:IssueDate>2026-08-06</cbc:IssueDate>
  <cbc:IssueTime>09:15:00-05:00</cbc:IssueTime>
  <cbc:DebitNoteTypeCode>92</cbc:DebitNoteTypeCode>
  <cbc:Note>${AVISO}</cbc:Note>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>FE9021</cbc:ReferenceID>
    <cbc:ResponseCode>2</cbc:ResponseCode>
    <cbc:Description>INTERESES POR MORA EN EL PAGO</cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference><cac:InvoiceDocumentReference>
    <cbc:ID>FE9021</cbc:ID>
    <cbc:UUID schemeName="CUFE-SHA384">${cufeFalso('factura-referenciada')}</cbc:UUID>
    <cbc:IssueDate>2026-07-02</cbc:IssueDate>
  </cac:InvoiceDocumentReference></cac:BillingReference>
  ${parte('AccountingSupplierParty', EMISOR_MAYORISTA, '1')}
  ${parte('AccountingCustomerParty', RECEPTOR, '1')}
  <cac:PaymentMeans><cbc:ID>2</cbc:ID><cbc:PaymentMeansCode>46</cbc:PaymentMeansCode><cbc:PaymentDueDate>2026-09-05</cbc:PaymentDueDate></cac:PaymentMeans>
  ${bloqueImpuesto(iva, [subtotal('01', 'IVA', 500000, 19, iva)])}
  ${bloqueRetencion(retenciones, [
    subtotal('06', 'ReteFuente', 500000, 2.5, reteFuente),
    subtotal('05', 'ReteIVA', 95000, 15, reteIva),
    subtotal('07', 'ReteICA', 500000, 0.966, reteIca),
  ])}
  ${totales({ bruto: 500000, baseGravable: 500000, conImpuestos: 595000, pagar: 595000 - retenciones })}
  ${linea('DebitNoteLine', 'DebitedQuantity', {
    numero: 1, cantidad: 1, unidad: '94', precio: 500000, bruto: 500000,
    descripcion: 'INTERESES DE MORA FACTURA FE9021', codigo: 'INT-MORA',
    impuestos: bloqueImpuesto(iva, [subtotal('01', 'IVA', 500000, 19, iva)]),
  })}
</DebitNote>`;

  const acuse = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse ${NS_RESPUESTA}>
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>1</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ID>${cude}</cbc:ID>
  <cbc:IssueDate>2026-08-06</cbc:IssueDate>
  <cbc:IssueTime>09:15:44-05:00</cbc:IssueTime>
  <cac:SenderParty><cac:PartyTaxScheme>
    <cbc:RegistrationName>Unidad Especial Direccion de Impuestos y Aduanas Nacionales</cbc:RegistrationName>
    <cbc:CompanyID schemeAgencyID="195" schemeID="4" schemeName="31">800197268</cbc:CompanyID>
  </cac:PartyTaxScheme></cac:SenderParty>
  <cac:DocumentResponse>
    <cac:Response><cbc:ResponseCode>02</cbc:ResponseCode><cbc:Description>Documento validado por la DIAN</cbc:Description></cac:Response>
    <cac:DocumentReference><cbc:ID>ND1204</cbc:ID><cbc:UUID schemeName="CUDE-SHA384">${cude}</cbc:UUID></cac:DocumentReference>
  </cac:DocumentResponse>
</ApplicationResponse>`;

  // El contenedor real coloca la nota y el acuse en sitios distintos del
  // árbol, no uno detrás del otro. Se replica esa asimetría a propósito:
  // es justo lo que rompe a los motores que asumen un único CDATA.
  return `<?xml version="1.0" encoding="UTF-8"?>
<AttachedDocument ${NS_ADJUNTO}>
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>Documentos adjuntos</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
  <cbc:ID>ND1204</cbc:ID>
  <cbc:IssueDate>2026-08-06</cbc:IssueDate>
  <cbc:IssueTime>09:16:00-05:00</cbc:IssueTime>
  <cbc:DocumentType>Contenedor de Nota Debito Electronica</cbc:DocumentType>
  <cbc:ParentDocumentID>ND1204</cbc:ParentDocumentID>
  <cac:SenderParty><cac:PartyTaxScheme>
    <cbc:RegistrationName>${EMISOR_MAYORISTA.razon}</cbc:RegistrationName>
    <cbc:CompanyID schemeAgencyID="195" schemeID="${EMISOR_MAYORISTA.dv}" schemeName="31">${EMISOR_MAYORISTA.nit}</cbc:CompanyID>
  </cac:PartyTaxScheme></cac:SenderParty>
  <cac:ReceiverParty><cac:PartyTaxScheme>
    <cbc:RegistrationName>${RECEPTOR.razon}</cbc:RegistrationName>
    <cbc:CompanyID schemeAgencyID="195" schemeID="${RECEPTOR.dv}" schemeName="31">${RECEPTOR.nit}</cbc:CompanyID>
  </cac:PartyTaxScheme></cac:ReceiverParty>
  <cac:Attachment><cac:ExternalReference>
    <cbc:MimeCode>text/xml</cbc:MimeCode>
    <cbc:EncodingCode>UTF-8</cbc:EncodingCode>
    <cbc:Description><![CDATA[${nota}]]></cbc:Description>
  </cac:ExternalReference></cac:Attachment>
  <cac:ParentDocumentLineReference>
    <cbc:LineID>1</cbc:LineID>
    <cac:DocumentReference>
      <cbc:ID>${cude}</cbc:ID>
      <cbc:UUID schemeName="CUDE-SHA384">${cude}</cbc:UUID>
      <cbc:IssueDate>2026-08-06</cbc:IssueDate>
      <cbc:DocumentType>ApplicationResponse</cbc:DocumentType>
      <cac:Attachment><cac:ExternalReference>
        <cbc:MimeCode>text/xml</cbc:MimeCode>
        <cbc:EncodingCode>UTF-8</cbc:EncodingCode>
        <cbc:Description><![CDATA[${acuse}]]></cbc:Description>
      </cac:ExternalReference></cac:Attachment>
    </cac:DocumentReference>
  </cac:ParentDocumentLineReference>
</AttachedDocument>
`;
}

// ── Escritura ─────────────────────────────────────────────────────────────

const FIXTURES: Array<{ archivo: string; que: string; genera: () => string }> = [
  { archivo: 'sint-0001-pos-simple.xml', que: 'documento equivalente POS suelto, IVA 19 %', genera: posSimple },
  { archivo: 'sint-0002-pos-mixto.xml', que: 'POS con linea gravada y linea excluida', genera: posMixto },
  { archivo: 'sint-0003-pos-restaurante-inc.xml', que: 'POS de restaurante con INC 8 %', genera: posRestaurante },
  { archivo: 'sint-0004-nota-debito.xml', que: 'nota debito en contenedor, con retenciones', genera: notaDebito },
];

fs.mkdirSync(SALIDA, { recursive: true });

console.log(`\n  Generando ${FIXTURES.length} fixtures sinteticos en ${SALIDA}\n`);
for (const f of FIXTURES) {
  fs.writeFileSync(path.join(SALIDA, f.archivo), f.genera(), 'utf8');
  console.log(`  · ${f.archivo.padEnd(34)} ${f.que}`);
}

fs.writeFileSync(
  path.join(SALIDA, 'LEEME.txt'),
  [
    'FIXTURES SINTETICOS — no son documentos reales',
    '',
    'Generados por scripts/dian-fixtures-sinteticos.mts (npm run fixtures:dian).',
    'No provienen de la DIAN ni de ningun contribuyente. Cubren los dialectos',
    'que la muestra real no tenia: documento equivalente POS y nota debito.',
    '',
    'Para editarlos, cambia el script y vuelve a generarlos. Editar los .xml a',
    'mano se pierde en la siguiente ejecucion.',
    '',
    'Comprobar:  npm run check:dian -- ./fixtures-dian-sinteticos',
    '',
    ...FIXTURES.map((f) => `  ${f.archivo.padEnd(34)} ${f.que}`),
    '',
  ].join('\n'),
  'utf8',
);

console.log(`\n  Listo. Comprueba con:  npm run check:dian -- ./fixtures-dian-sinteticos\n`);

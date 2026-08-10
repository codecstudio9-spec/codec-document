// Anonimizador de documentos electrónicos DIAN — Fase 1 del motor de
// documentos electrónicos.
//
// Toma XML reales (factura de venta, nota crédito, nota débito, documento
// equivalente POS, documento soporte...) y produce copias que conservan la
// ESTRUCTURA EXACTA pero no contienen ningún dato identificable: ni NIT, ni
// razón social, ni correo, ni dirección, ni CUFE real, ni el certificado
// digital del emisor.
//
// Para qué sirve: el parser de la Fase 1 hay que construirlo contra archivos
// reales, porque cada proveedor tecnológico (Facture, Carvajal, The Factory
// HKA, Siigo, Alegra...) emite con variaciones legítimas que no están en
// ningún anexo técnico — namespaces declarados distinto, campos opcionales
// ausentes, decimales con otra precisión, acentos mal codificados. Esas
// rarezas son justamente lo que hay que ver. Este script deja pasar las
// rarezas y bloquea los datos.
//
// ── Por qué NO usa un parser XML ────────────────────────────────────────
// Un ciclo parsear → serializar "limpiaría" el archivo: normaliza espacios,
// reordena atributos, reescribe entidades, pierde el BOM y convierte
// <x></x> en <x/>. Eso destruiría exactamente lo que venimos a estudiar.
// En vez de eso el script tokeniza para saber DÓNDE está parado (necesario:
// <cbc:ID> es el número de factura en la raíz pero el número de línea más
// abajo) y reemplaza únicamente los tramos de texto que toca. Todo lo demás
// sale byte por byte igual que entró.
//
// ── Uso ─────────────────────────────────────────────────────────────────
//   node scripts/anonymize-dian-xml.mjs <entrada> [opciones]
//   npm run anonymize:dian -- <entrada> [opciones]
//
//   <entrada>            archivo .xml, archivo .zip, o carpeta
//   --out <carpeta>      salida            (por defecto: ./fixtures-dian)
//   --seed <texto>       semilla, para que dos corridas den lo mismo
//   --scale-amounts      además altera los valores monetarios (ver abajo)
//   --scrub-notes        vacía las notas libres (pueden traer nombres)
//   --keep-names         conserva los nombres de archivo originales (NO
//                        recomendado: suelen llevar el NIT dentro)
//
// Ejemplo:
//   node scripts/anonymize-dian-xml.mjs "C:\descargas\dian-enero.zip" --out fixtures-dian
//
// ── Sobre los valores monetarios ────────────────────────────────────────
// Por defecto NO se tocan. Un precio unitario, desacoplado de la identidad
// del emisor y del receptor, no identifica a nadie — y conservarlos es lo
// que permite construir el validador de cuadre aritmético (base × tarifa =
// impuesto, suma de líneas = subtotal). Si aun así prefieres alterarlos,
// --scale-amounts multiplica TODOS los montos de un mismo documento por el
// mismo factor, de modo que las relaciones se mantienen; el redondeo a dos
// decimales puede introducir diferencias de centavos, así que los fixtures
// generados con esta opción no sirven para probar el cuadre exacto.
//
// ── Garantía ────────────────────────────────────────────────────────────
// Antes de escribir cada archivo, el script vuelve a leer su propia salida y
// verifica que ningún valor original sobreviva. Si encuentra uno, aborta y
// no escribe nada. Prefiere fallar a filtrar.

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// pizzip (ya es dependencia del proyecto) es CommonJS; se carga bajo demanda
// sólo cuando la entrada es un .zip.
const require = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────
// Argumentos
// ─────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  console.log(`
Anonimizador de documentos electrónicos DIAN

  node scripts/anonymize-dian-xml.mjs <entrada> [opciones]

  <entrada>          archivo .xml, archivo .zip, o carpeta con XML

  --out <carpeta>    carpeta de salida        (por defecto: ./fixtures-dian)
  --seed <texto>     semilla de generación    (por defecto: "codec")
  --scale-amounts    altera también los valores monetarios
  --scrub-notes      vacía las notas de texto libre
  --keep-names       conserva los nombres de archivo originales
`);
  process.exit(0);
}

// Banderas con valor: consumen el argumento siguiente. El resto de valores
// sueltos son la entrada.
const CON_VALOR = new Set(['--out', '--seed']);
const opciones = {};
const sueltos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (CON_VALOR.has(a)) { opciones[a] = argv[++i]; continue; }
  if (a.startsWith('--')) { opciones[a] = true; continue; }
  sueltos.push(a);
}

const INPUT = sueltos[0];
const OUT_DIR = path.resolve(opciones['--out'] ?? './fixtures-dian');
const SEED = opciones['--seed'] ?? 'codec';
const SCALE_AMOUNTS = opciones['--scale-amounts'] === true;
const SCRUB_NOTES = opciones['--scrub-notes'] === true;
const KEEP_NAMES = opciones['--keep-names'] === true;

if (!INPUT || !fs.existsSync(INPUT)) {
  console.error(`\n  No encuentro la entrada: ${INPUT ?? '(ninguna)'}\n`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// Generación determinista de datos falsos
//
// Todo se deriva de hash(semilla + valor real), así que el mismo NIT real
// produce siempre el mismo NIT falso — en este archivo, en los otros 400 del
// lote y en la corrida del mes que viene. Sin esa consistencia, las pruebas
// de deduplicación y de agrupación por tercero no significarían nada.
// ─────────────────────────────────────────────────────────────────────────

function hashInt(kind, value) {
  const h = createHash('sha256').update(`${SEED}|${kind}|${value}`).digest();
  return h.readUInt32BE(0);
}

function hashHex(kind, value, length) {
  let out = '';
  let n = 0;
  while (out.length < length) {
    out += createHash('sha256').update(`${SEED}|${kind}|${value}|${n++}`).digest('hex');
  }
  return out.slice(0, length);
}

/** Dígito de verificación del NIT colombiano. Pesos oficiales aplicados de
 *  derecha a izquierda; residuo 0 o 1 es el DV, en otro caso 11 - residuo. */
const PESOS_DV = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
function digitoVerificacion(nit) {
  const digitos = String(nit).replace(/\D/g, '').split('').reverse();
  let suma = 0;
  for (let i = 0; i < digitos.length && i < PESOS_DV.length; i++) {
    suma += Number(digitos[i]) * PESOS_DV[i];
  }
  const r = suma % 11;
  return r < 2 ? r : 11 - r;
}

const PREFIJOS = ['COMERCIALIZADORA', 'DISTRIBUIDORA', 'INVERSIONES', 'SERVICIOS', 'SUMINISTROS',
  'SOLUCIONES', 'REPRESENTACIONES', 'IMPORTADORA', 'PRODUCTOS', 'GRUPO'];
const NUCLEOS = ['ANDINA', 'DEL VALLE', 'CENTRAL', 'DEL NORTE', 'PACIFICO', 'ORIENTAL',
  'SANTA FE', 'LA ESPERANZA', 'EL PORVENIR', 'MONTERREY', 'SAN MARTIN', 'LOS ALPES'];
const SUFIJOS = ['S.A.S.', 'LTDA.', 'S.A.', 'S. EN C.', 'E.U.'];
const NOMBRES = ['CARLOS', 'MARIA', 'JORGE', 'ANA', 'LUIS', 'CLAUDIA', 'ANDRES', 'PAOLA', 'DIEGO', 'SANDRA'];
const APELLIDOS = ['GOMEZ', 'RODRIGUEZ', 'MARTINEZ', 'LOPEZ', 'RAMIREZ', 'TORRES', 'VARGAS', 'CASTRO'];
const CALLES = ['CALLE', 'CARRERA', 'AVENIDA', 'DIAGONAL', 'TRANSVERSAL'];

const pick = (arr, kind, value, salt = 0) => arr[hashInt(`${kind}:${salt}`, value) % arr.length];

const generadores = {
  // NIT de persona jurídica: 9 dígitos empezando en 8 o 9, como los reales.
  nit(real) {
    const n = hashInt('nit', real);
    return String(800000000 + (n % 199999999));
  },
  razon(real) {
    return `${pick(PREFIJOS, 'razon', real, 1)} ${pick(NUCLEOS, 'razon', real, 2)} ${pick(SUFIJOS, 'razon', real, 3)}`;
  },
  nombre(real) {
    return `${pick(NUCLEOS, 'nombre', real, 1)} ${pick(PREFIJOS, 'nombre', real, 2)}`;
  },
  persona(real) {
    return `${pick(NOMBRES, 'persona', real, 1)} ${pick(APELLIDOS, 'persona', real, 2)}`;
  },
  email(real) {
    return `contacto${hashInt('email', real) % 9000 + 1000}@ejemplo.test`;
  },
  tel(real) {
    return `60${1 + (hashInt('tel', real) % 8)}${String(hashInt('tel2', real) % 10000000).padStart(7, '0')}`;
  },
  dir(real) {
    const n = hashInt('dir', real);
    return `${pick(CALLES, 'dir', real, 1)} ${n % 150 + 1} # ${n % 90 + 1} - ${n % 70 + 1}`;
  },
  // CUFE/CUDE: hex en minúscula conservando la longitud exacta del original
  // (96 en los documentos reales), para que las pruebas de formato y de
  // longitud del parser sigan midiendo lo mismo.
  cufe(real) {
    return hashHex('cufe', real, real.length);
  },
  // Numeración autorizada por la DIAN: sts:InvoiceAuthorization (el número
  // de resolución) y el rango sts:From/sts:To. Identifican al contribuyente
  // tanto como el NIT, así que se sustituyen — y de paso se evita que un
  // rango coincida por casualidad con un teléfono y dispare un falso
  // positivo en el verificador de fugas, que fue justo lo que pasó al
  // probar contra documentos reales.
  rango(real) {
    const h = hashInt('rango', real);
    return String(h % 10 ** real.length).padStart(real.length, '0');
  },
  // sts:SoftwareID es un UUID con guiones; se conserva el patrón exacto para
  // que un parser que valide el formato siga midiendo lo mismo.
  uuid(real) {
    const h = hashHex('uuid', real, real.length);
    let out = '';
    for (let i = 0; i < real.length; i++) out += /[0-9a-fA-F]/.test(real[i]) ? h[i] : real[i];
    return out;
  },
  docnum(real) {
    // Conserva el prefijo alfabético (FE, SETP, POS...) y cambia el consecutivo.
    const m = String(real).match(/^([A-Za-z]*)(\d+)$/);
    if (!m) return `DOC${hashInt('docnum', real) % 100000}`;
    return `${m[1]}${String(hashInt('docnum', real) % 10 ** Math.max(m[2].length, 1)).padStart(m[2].length, '0')}`;
  },
  // El certificado digital del emisor lleva su nombre, su NIT y su correo
  // dentro del base64. Se reemplaza carácter por carácter, conservando la
  // longitud exacta, los saltos de línea y el relleno "=" — así el parser
  // sigue viendo un bloque con la forma de un certificado real.
  b64(real) {
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const h = hashHex('b64', real.replace(/\s/g, '').slice(0, 64), real.length * 2 + 2);
    let out = '';
    for (let i = 0; i < real.length; i++) {
      const c = real[i];
      if (c === '=' || /\s/.test(c)) { out += c; continue; }
      out += abc[parseInt(h.slice(i * 2, i * 2 + 2), 16) % abc.length];
    }
    return out;
  },
};

// Diccionario real → falso, compartido por todos los archivos del lote.
const mapa = { nit: {}, razon: {}, nombre: {}, persona: {}, email: {}, tel: {}, dir: {}, cufe: {}, docnum: {}, uuid: {}, rango: {} };

function sustituir(kind, real) {
  const limpio = String(real).trim();
  if (!limpio) return real;
  if (kind === 'b64') return generadores.b64(real);
  if (!mapa[kind]) return real;
  if (!mapa[kind][limpio]) mapa[kind][limpio] = generadores[kind](limpio);
  return mapa[kind][limpio];
}

// ─────────────────────────────────────────────────────────────────────────
// Reglas: qué nodo contiene qué tipo de dato
//
// Se comparan por nombre local (sin prefijo de namespace), porque el prefijo
// varía entre proveedores: unos usan cbc:, otros lo declaran por defecto.
// ─────────────────────────────────────────────────────────────────────────

const ultimo = (p) => p[p.length - 1];
const padre = (p) => p[p.length - 2];

const REGLAS = [
  // Extensión propia de la DIAN (namespace dian:gov:co:facturaelectronica:
  // Structures-2-1). Confirmado contra documentos reales:
  //   sts:DianExtensions
  //     sts:InvoiceControl → InvoiceAuthorization · AuthorizedInvoices(Prefix/From/To)
  //     sts:SoftwareProvider → ProviderID (NIT) · SoftwareID (UUID)
  //     sts:SoftwareSecurityCode (96 hex)
  //     sts:AuthorizationProvider → AuthorizationProviderID (NIT de la DIAN)
  //     sts:QRCode (URL que lleva el CUFE embebido — la limpia el barrido final)
  { kind: 'nit', test: (p) => ['ProviderID', 'AuthorizationProviderID'].includes(ultimo(p)) },
  { kind: 'rango', test: (p) => ultimo(p) === 'InvoiceAuthorization' || (['From', 'To'].includes(ultimo(p)) && padre(p) === 'AuthorizedInvoices') },
  { kind: 'uuid', test: (p) => ultimo(p) === 'SoftwareID' },
  { kind: 'cufe', test: (p) => ultimo(p) === 'SoftwareSecurityCode' },
  // ApplicationResponse (acuses y eventos RADIAN) nombra al validador aquí.
  { kind: 'razon', test: (p) => ultimo(p) === 'ValidatorID' },

  { kind: 'nit', test: (p) => ultimo(p) === 'CompanyID' || (ultimo(p) === 'ID' && padre(p) === 'PartyIdentification') },
  { kind: 'razon', test: (p) => ultimo(p) === 'RegistrationName' },
  { kind: 'nombre', test: (p) => ultimo(p) === 'Name' && padre(p) === 'PartyName' },
  { kind: 'persona', test: (p) => ['FirstName', 'FamilyName', 'MiddleName', 'OtherName'].includes(ultimo(p)) || (ultimo(p) === 'Name' && padre(p) === 'Contact') },
  { kind: 'email', test: (p) => ultimo(p) === 'ElectronicMail' },
  { kind: 'tel', test: (p) => ['Telephone', 'Telefax'].includes(ultimo(p)) },
  { kind: 'dir', test: (p) => ultimo(p) === 'Line' && padre(p) === 'AddressLine' },
  { kind: 'cufe', test: (p) => ultimo(p) === 'UUID' },
  // <cbc:ID> es ambiguo: en la raíz es el número del documento, pero más
  // abajo es el número de línea o el código de un impuesto. Se cubren los
  // dos sitios donde sí es un número de documento — la raíz y las
  // referencias cruzadas (un ApplicationResponse apunta así a su factura).
  { kind: 'docnum', test: (p) => ultimo(p) === 'ID' && p.length === 2 },
  { kind: 'docnum', test: (p) => ultimo(p) === 'ID' && ['DocumentReference', 'BillingReference', 'InvoiceDocumentReference', 'DespatchDocumentReference', 'ReceiptDocumentReference', 'AdditionalDocumentReference', 'OrderReference'].includes(padre(p)) },
  { kind: 'docnum', test: (p) => ['ParentDocumentID', 'ReferenceID'].includes(ultimo(p)) },
  { kind: 'b64', test: (p) => ['X509Certificate', 'SignatureValue', 'DigestValue', 'Modulus', 'Exponent', 'X509SerialNumber', 'X509IssuerName', 'X509SubjectName'].includes(ultimo(p)) },
];

function reglaPara(pila) {
  for (const r of REGLAS) if (r.test(pila)) return r.kind;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Tokenizador con reemplazo en sitio
// ─────────────────────────────────────────────────────────────────────────

/** Encuentra el '>' que cierra el tag abierto en `desde`, ignorando los que
 *  aparecen dentro de un valor de atributo entre comillas. */
function finDeTag(texto, desde) {
  let comilla = null;
  for (let i = desde + 1; i < texto.length; i++) {
    const c = texto[i];
    if (comilla) { if (c === comilla) comilla = null; continue; }
    if (c === '"' || c === "'") { comilla = c; continue; }
    if (c === '>') return i;
  }
  return texto.length - 1;
}

const nombreLocal = (q) => (q.includes(':') ? q.slice(q.indexOf(':') + 1) : q);

function transformar(texto, informe, factorMonto) {
  let salida = '';
  let i = 0;
  const pila = [];

  while (i < texto.length) {
    const lt = texto.indexOf('<', i);
    if (lt === -1) { salida += texto.slice(i); break; }

    // Nodo de texto entre el punto actual y el próximo '<'
    if (lt > i) {
      const bruto = texto.slice(i, lt);
      salida += transformarTexto(bruto, pila, informe, factorMonto);
    }

    // CDATA: aquí es donde el AttachedDocument esconde la factura real.
    if (texto.startsWith('<![CDATA[', lt)) {
      const fin = texto.indexOf(']]>', lt);
      const corte = fin === -1 ? texto.length : fin;
      const interior = texto.slice(lt + 9, corte);
      const pareceXml = /^\s*(<\?xml|<[A-Za-z])/.test(interior);
      if (pareceXml) {
        informe.cdataAnidado++;
        salida += `<![CDATA[${transformar(interior, informe, factorMonto)}]]>`;
      } else {
        salida += `<![CDATA[${interior}]]>`;
      }
      i = fin === -1 ? texto.length : fin + 3;
      continue;
    }

    if (texto.startsWith('<!--', lt)) {
      const fin = texto.indexOf('-->', lt);
      salida += texto.slice(lt, fin === -1 ? texto.length : fin + 3);
      i = fin === -1 ? texto.length : fin + 3;
      continue;
    }

    if (texto.startsWith('<?', lt)) {
      const fin = texto.indexOf('?>', lt);
      salida += texto.slice(lt, fin === -1 ? texto.length : fin + 2);
      i = fin === -1 ? texto.length : fin + 2;
      continue;
    }

    // DOCTYPE — se conserva tal cual, pero se reporta: es el vector de XXE
    // que el parser de producción tendrá que rechazar.
    if (texto.startsWith('<!', lt)) {
      const fin = texto.indexOf('>', lt);
      informe.doctype++;
      salida += texto.slice(lt, fin === -1 ? texto.length : fin + 1);
      i = fin === -1 ? texto.length : fin + 1;
      continue;
    }

    const gt = finDeTag(texto, lt);
    const bruto = texto.slice(lt, gt + 1);
    const cierra = bruto[1] === '/';
    const autocierra = bruto[bruto.length - 2] === '/';
    const qname = bruto.slice(cierra ? 2 : 1).match(/^[^\s/>]+/)?.[0] ?? '';
    const local = nombreLocal(qname);

    if (cierra) {
      pila.pop();
      salida += bruto;
    } else {
      pila.push(local);
      registrarEnInforme(local, bruto, pila, informe);
      salida += bruto;
      if (autocierra) pila.pop();
    }
    i = gt + 1;
  }

  return salida;
}

function transformarTexto(bruto, pila, informe, factorMonto) {
  if (pila.length === 0 || !bruto.trim()) return bruto;

  const local = ultimo(pila);

  // Notas: se conservan por defecto (suelen decir "Forma de pago: contado")
  // pero se reportan, porque son texto libre y pueden traer un nombre.
  if (local === 'Note') {
    informe.notas++;
    if (SCRUB_NOTES) return bruto.replace(/\S[\s\S]*\S|\S/, 'TEXTO LIBRE REMOVIDO');
    return bruto;
  }

  // Description NUNCA se toca: bajo cac:Item es el nombre del producto (dato
  // de negocio, no personal, y necesario para el Reporte Detallado), y bajo
  // cac:ExternalReference es el contenedor de la factura en CDATA.
  if (local === 'Description') return bruto;

  if (SCALE_AMOUNTS && /Amount$/.test(local)) {
    const n = Number(bruto.trim());
    if (Number.isFinite(n) && n !== 0) {
      const escalado = (n * factorMonto).toFixed(2);
      return bruto.replace(bruto.trim(), escalado);
    }
    return bruto;
  }

  const kind = reglaPara(pila);
  if (!kind) return bruto;

  const valor = bruto.trim();
  const nuevo = sustituir(kind, valor);
  informe.reemplazos[kind] = (informe.reemplazos[kind] ?? 0) + 1;
  return bruto.replace(valor, nuevo);
}

/** El atributo schemeID de <cbc:CompanyID> lleva el dígito de verificación
 *  del NIT. Si el NIT cambia y el DV se queda igual, el archivo queda
 *  internamente incoherente y las pruebas de validación darían un falso
 *  positivo. Se corrige en una segunda pasada, sobre el texto ya
 *  transformado, porque durante el recorrido el atributo se lee antes que
 *  el contenido del elemento — todavía no se sabe cuál será el NIT falso. */
/** Barrido final: reemplaza cualquier valor real que haya sobrevivido, esté
 *  donde esté.
 *
 *  Las reglas por nodo cubren los campos estructurados, pero los datos
 *  vuelven a aparecer en sitios de forma libre que ninguna regla puede
 *  anticipar: <sts:QRCode> es una URL con el CUFE embebido, las notas
 *  suelen traer el nombre del cliente, y los documentos de referencia
 *  repiten números. Antes esto bloqueaba el archivo; ahora se limpia.
 *
 *  Se corre después de las reglas, no en vez de ellas: el paso estructurado
 *  es el que sabe QUÉ es cada dato (y por tanto qué falso generar y cómo
 *  contarlo); esto sólo propaga la decisión ya tomada.
 *
 *  Sólo actúa sobre valores de 8 o más caracteres. Por debajo, la
 *  probabilidad de que una cadena coincida por casualidad con un dato
 *  estructural (un rango de numeración, una cantidad) supera al riesgo que
 *  evita. Los valores cortos siguen cubiertos por el verificador de fugas,
 *  que ahí sí prefiere bloquear el archivo. */
function barridoFinal(texto, informe) {
  const pares = [];
  for (const dicc of Object.values(mapa)) {
    for (const [real, falso] of Object.entries(dicc)) {
      if (real.length >= 8) pares.push([real, falso]);
    }
  }
  // De más largo a más corto: evita que un valor corto rompa a la mitad uno
  // largo que lo contiene (un NIT dentro del CUFE, por ejemplo).
  pares.sort((a, b) => b[0].length - a[0].length);

  for (const [real, falso] of pares) {
    if (!texto.includes(real)) continue;
    informe.barridos += texto.split(real).length - 1;
    texto = texto.split(real).join(falso);
  }
  return texto;
}

function corregirDigitosVerificacion(texto, informe) {
  return texto.replace(
    /<((?:[A-Za-z0-9_.-]+:)?(?:CompanyID|ID))([^>]*?schemeID\s*=\s*")(\d{1,2})("[^>]*)>(\s*)(\d{5,15})(\s*)<\/\1>/g,
    (m, tag, pre, _dv, post, sp1, nit, sp2) => {
      // <cbc:CompanyID> siempre es un NIT. <cbc:ID> es ambiguo (también es
      // número de línea o código de impuesto), así que sólo se toca cuando
      // el propio documento lo declara como NIT con schemeName="31".
      const esNit = /CompanyID$/.test(tag) || /schemeName\s*=\s*"31"/.test(pre + post);
      if (!esNit) return m;
      informe.dvRecalculado++;
      return `<${tag}${pre}${digitoVerificacion(nit)}${post}>${sp1}${nit}${sp2}</${tag}>`;
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Informe — esto es lo que de verdad necesita el parser
// ─────────────────────────────────────────────────────────────────────────

function informeVacio() {
  return {
    archivos: 0, cdataAnidado: 0, doctype: 0, notas: 0, dvRecalculado: 0, barridos: 0,
    reemplazos: {}, tiposRaiz: {}, tiposDocumento: {}, codigosImpuesto: {},
    namespaces: {}, monedas: {}, formasPago: {}, lineasPorDoc: [],
    elementosVistos: new Set(), fugas: [],
  };
}

function registrarEnInforme(local, bruto, pila, informe) {
  informe.elementosVistos.add(local);

  if (pila.length === 1) {
    informe.tiposRaiz[local] = (informe.tiposRaiz[local] ?? 0) + 1;
    for (const m of bruto.matchAll(/xmlns(?::[A-Za-z0-9_.-]+)?\s*=\s*"([^"]+)"/g)) {
      informe.namespaces[m[1]] = (informe.namespaces[m[1]] ?? 0) + 1;
    }
  }
  if (['InvoiceLine', 'CreditNoteLine', 'DebitNoteLine'].includes(local)) {
    informe._lineas = (informe._lineas ?? 0) + 1;
  }
}

/** Datos que sólo se pueden leer del contenido, no de los tags.
 *
 *  El prefijo de namespace se hace opcional pero NO se permite que absorba
 *  parte del nombre: `<[^>]*:?TaxScheme>` casaría también con
 *  `cac:PartyTaxScheme`, que es otro elemento y llevaría a leer el NIT del
 *  emisor como si fuera un código de impuesto. */
const elemento = (nombre) => `<(?:[A-Za-z0-9_.-]+:)?${nombre}(?:\\s[^>]*)?>`;

function escanearContenido(texto, informe) {
  const leer = (nombre) => [...texto.matchAll(new RegExp(`${elemento(nombre)}([^<]+)<`, 'g'))].map((m) => m[1].trim());

  for (const v of leer('InvoiceTypeCode')) informe.tiposDocumento[v] = (informe.tiposDocumento[v] ?? 0) + 1;
  for (const v of leer('CreditNoteTypeCode')) informe.tiposDocumento[`NC-${v}`] = (informe.tiposDocumento[`NC-${v}`] ?? 0) + 1;
  for (const v of leer('DebitNoteTypeCode')) informe.tiposDocumento[`ND-${v}`] = (informe.tiposDocumento[`ND-${v}`] ?? 0) + 1;
  for (const v of leer('DocumentCurrencyCode')) informe.monedas[v] = (informe.monedas[v] ?? 0) + 1;
  for (const v of leer('PaymentMeansCode')) informe.formasPago[v] = (informe.formasPago[v] ?? 0) + 1;

  // Códigos de esquema tributario: 01 IVA, 03 ICA, 04 INC, 05 ReteIVA,
  // 06 ReteRenta, 07 ReteICA, 22 Bolsas... Saber cuáles aparecen de verdad
  // en los documentos del cliente define qué tiene que soportar el motor.
  const reTaxScheme = new RegExp(`${elemento('TaxScheme')}([\\s\\S]*?)</(?:[A-Za-z0-9_.-]+:)?TaxScheme>`, 'g');
  for (const m of texto.matchAll(reTaxScheme)) {
    const id = m[1].match(new RegExp(`${elemento('ID')}([^<]+)<`))?.[1]?.trim();
    const nombre = m[1].match(new RegExp(`${elemento('Name')}([^<]+)<`))?.[1]?.trim();
    if (id) {
      const clave = nombre ? `${id} (${nombre})` : id;
      informe.codigosImpuesto[clave] = (informe.codigosImpuesto[clave] ?? 0) + 1;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Verificación anti-fuga
// ─────────────────────────────────────────────────────────────────────────

// Qué se verifica de verdad. `rango` queda fuera a propósito: un rango de
// numeración autorizada no identifica a nadie por sí solo (se sustituye por
// higiene, no por necesidad), y al ser un número redondo de 7 u 8 cifras
// coincide constantemente con importes en pesos. Verificarlo produce sólo
// falsos positivos.
const KINDS_IDENTIFICADORES = ['nit', 'razon', 'nombre', 'persona', 'email', 'tel', 'dir', 'cufe', 'docnum', 'uuid'];

/** Elementos cuyo contenido es un número de negocio, no un identificador.
 *  Una cadena de dígitos que reaparece aquí es coincidencia, no fuga: en
 *  pesos colombianos los importes son cifras largas y redondas, así que
 *  chocan a menudo con NIT, teléfonos y consecutivos. */
const CONTEXTO_NUMERICO = /(Amount|Quantity|Percent|Numeric|Rate|Units|BaseUnitMeasure)$/;

/** Relee la salida y confirma que ningún valor original sobrevivió. Si algo
 *  se escapó, el archivo no se escribe. Es preferible fallar a filtrar.
 *
 *  Reporta el elemento que envuelve cada fuga, no el valor: con eso se sabe
 *  qué regla falta sin tener que mirar datos reales. */
function verificarSinFugas(salida, nombreArchivo) {
  const fugas = [];
  for (const kind of KINDS_IDENTIFICADORES) {
    for (const real of Object.keys(mapa[kind] ?? {})) {
      // Por debajo de 6 caracteres cualquier cadena aparece en cualquier
      // parte; sólo se verifica lo que identifica de verdad.
      if (real.length < 6) continue;
      const soloDigitos = /^\d+$/.test(real);
      let i = -1;
      while ((i = salida.indexOf(real, i + 1)) !== -1) {
        const antes = salida.slice(Math.max(0, i - 200), i);
        const tag = [...antes.matchAll(/<([A-Za-z0-9_:.-]+)/g)].pop()?.[1] ?? '(desconocido)';
        const dentroDeAtributo = /[A-Za-z0-9_:.-]+\s*=\s*"[^"]*$/.test(antes);

        // Un valor puramente numérico dentro de un campo numérico es
        // coincidencia. Una razón social ahí dentro seguiría siendo fuga.
        if (soloDigitos && CONTEXTO_NUMERICO.test(tag)) continue;

        fugas.push({
          archivo: nombreArchivo,
          kind,
          donde: `<${tag}>${dentroDeAtributo ? ' (atributo)' : ''}`,
        });
      }
    }
  }
  return fugas;
}

// ─────────────────────────────────────────────────────────────────────────
// Entrada / salida
// ─────────────────────────────────────────────────────────────────────────

function recolectarEntradas(entrada) {
  const st = fs.statSync(entrada);

  if (st.isDirectory()) {
    return fs.readdirSync(entrada).flatMap((f) => recolectarEntradas(path.join(entrada, f)));
  }
  if (/\.xml$/i.test(entrada)) {
    return [{ nombre: path.basename(entrada), contenido: fs.readFileSync(entrada, 'utf8') }];
  }
  if (/\.zip$/i.test(entrada)) {
    return leerZip(entrada);
  }
  return [];
}

function leerZip(rutaZip) {
  let PizZip;
  try {
    PizZip = require('pizzip');
  } catch {
    console.error(`\n  Para leer ZIP hace falta pizzip (ya es dependencia del proyecto).`);
    console.error(`  Ejecuta "npm install" en la raíz, o descomprime el ZIP y pásame la carpeta.\n`);
    process.exit(1);
  }
  const zip = new PizZip(fs.readFileSync(rutaZip));
  const salida = [];
  for (const [nombre, archivo] of Object.entries(zip.files)) {
    if (archivo.dir || !/\.xml$/i.test(nombre)) continue;
    // Sólo el nombre base: la ruta interna del ZIP puede traer el NIT, y
    // además es el vector clásico de path traversal.
    salida.push({ nombre: path.basename(nombre), contenido: archivo.asText() });
  }
  return salida;
}

// ─────────────────────────────────────────────────────────────────────────
// Ejecución
// ─────────────────────────────────────────────────────────────────────────

const entradas = recolectarEntradas(path.resolve(INPUT));

if (entradas.length === 0) {
  console.error(`\n  No encontré ningún .xml en: ${INPUT}\n`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const informe = informeVacio();
const fugasTotales = [];
let escritos = 0;

console.log(`\n  Anonimizando ${entradas.length} archivo(s)...\n`);

entradas.forEach((entrada, indice) => {
  informe._lineas = 0;

  // Factor de escala por documento, determinista: entre 0,40 y 2,20.
  const factorMonto = SCALE_AMOUNTS ? 0.4 + (hashInt('factor', entrada.nombre) % 180) / 100 : 1;

  let salida;
  try {
    // Orden: reglas por nodo → barrido de lo que se escapó → DV coherente.
    // El DV va último porque necesita ver el NIT falso ya definitivo.
    salida = transformar(entrada.contenido, informe, factorMonto);
    salida = barridoFinal(salida, informe);
    salida = corregirDigitosVerificacion(salida, informe);
  } catch (err) {
    console.error(`  ✕ ${entrada.nombre} — error al procesar: ${err.message}`);
    return;
  }

  const fugas = verificarSinFugas(salida, entrada.nombre);
  if (fugas.length > 0) {
    fugasTotales.push(...fugas);
    console.error(`  ✕ ${entrada.nombre} — sobrevivieron ${fugas.length} valor(es) original(es). No se escribe.`);
    return;
  }

  escanearContenido(salida, informe);
  informe.lineasPorDoc.push(informe._lineas);
  informe.archivos++;

  // El nombre original suele llevar el NIT dentro (fv900123456_FE1234.xml).
  const nombreSalida = KEEP_NAMES
    ? entrada.nombre
    : `doc-${String(indice + 1).padStart(4, '0')}.xml`;

  fs.writeFileSync(path.join(OUT_DIR, nombreSalida), salida, 'utf8');
  escritos++;
});

// ─────────────────────────────────────────────────────────────────────────
// Salida en consola + archivos auxiliares
// ─────────────────────────────────────────────────────────────────────────

const orden = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const lista = (obj, vacio = '(ninguno)') => {
  const e = orden(obj);
  return e.length ? e.map(([k, v]) => `      ${k}  ×${v}`).join('\n') : `      ${vacio}`;
};

const lineas = informe.lineasPorDoc.filter((n) => n > 0);
const promLineas = lineas.length ? (lineas.reduce((a, b) => a + b, 0) / lineas.length).toFixed(1) : '0';

const resumen = `
  ═══════════════════════════════════════════════════════════════

  Archivos leídos          ${entradas.length}
  Archivos escritos        ${escritos}
  Salida                   ${OUT_DIR}

  ── Estructura encontrada ──────────────────────────────────────

  Elementos raíz
${lista(informe.tiposRaiz)}

  Facturas dentro de CDATA (AttachedDocument)
      ${informe.cdataAnidado}

  Tipos de documento
${lista(informe.tiposDocumento)}

  Códigos de impuesto
${lista(informe.codigosImpuesto)}

  Monedas
${lista(informe.monedas)}

  Formas de pago
${lista(informe.formasPago)}

  Namespaces declarados
${lista(informe.namespaces)}

  Líneas por documento     promedio ${promLineas} · máximo ${lineas.length ? Math.max(...lineas) : 0}

  ── Anonimización ──────────────────────────────────────────────

  Reemplazos por tipo
${lista(informe.reemplazos)}

  Valores únicos          ${Object.values(mapa).reduce((a, d) => a + Object.keys(d).length, 0)}
  Barrido final           ${informe.barridos} (campos libres: QR, notas, referencias)
  Notas conservadas       ${informe.notas}${SCRUB_NOTES ? ' (vaciadas)' : ' — texto libre, conviene revisarlas a ojo'}
  DOCTYPE encontrados     ${informe.doctype}${informe.doctype ? '  ⚠ vector de XXE: el parser de producción debe rechazarlo' : ''}
  Montos                  ${SCALE_AMOUNTS ? 'escalados por documento' : 'conservados'}

  ── Verificación ───────────────────────────────────────────────

  ${fugasTotales.length === 0
    ? 'Sin fugas. Ningún valor original sobrevive en la salida.'
    : `⚠ ${fugasTotales.length} fuga(s). Esos archivos NO se escribieron.

  Dónde quedó cada una (falta una regla para estos nodos):
${lista(fugasTotales.reduce((acc, f) => {
      const k = `${f.donde}  ·  ${f.kind}`;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}))}`}

  ═══════════════════════════════════════════════════════════════
`;

console.log(resumen);

// El mapa queda fuera de la carpeta de fixtures a propósito: contiene los
// valores reales y NO debe compartirse ni subirse al repositorio. Sirve para
// que el cliente pueda auditar qué se sustituyó por qué.
const rutaMapa = path.join(path.dirname(OUT_DIR), '_mapa-PRIVADO-no-compartir.json');
fs.writeFileSync(rutaMapa, JSON.stringify(mapa, null, 2), 'utf8');

fs.writeFileSync(path.join(OUT_DIR, '_informe.txt'), resumen.trim() + '\n', 'utf8');

console.log(`  Informe   ${path.join(OUT_DIR, '_informe.txt')}`);
console.log(`  Mapa      ${rutaMapa}`);
console.log(`            ⚠ contiene los valores reales — no lo compartas ni lo subas al repo\n`);

if (fugasTotales.length > 0) process.exit(2);

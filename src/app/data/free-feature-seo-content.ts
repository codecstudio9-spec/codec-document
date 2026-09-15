// Fase 3 del proyecto LatAm SEO — 7 landing pages built around "gratis"
// search intent. Each targets a DIFFERENT angle/feature on purpose (not
// the same page with a different URL) to avoid a thin/duplicate-content
// problem across the batch:
//   1. firma-electronica-gratis   — general hub for free e-signature
//   2. firmar-pdf-gratis          — signing a PDF you already have (upload flow)
//   3. firma-digital-gratis       — clarifies "firma digital" vs "electrónica" terminology
//   4. firmar-documentos-online-gratis — broader: contracts/agreements, not just PDFs
//   5. documentos-legales-gratis  — free document GENERATION (templates), not signing
//   6. crear-documentos-online-gratis  — creating ANY document (built-in template OR your own upload)
//   7. certificar-documentos-online    — the certification/evidence angle (no "gratis" in the URL on purpose)
//
// Same free-plan facts everywhere (no credit card, one free document
// every 72h, limited free signatures, instant access) per the explicit
// requirement — but framed differently per page's actual topic.

import type { LucideIcon } from 'lucide-react';
import { Upload, PenLine, FileSignature, FileText, FolderOpen, ShieldCheck } from 'lucide-react';
import type { StateHighlight } from './state-seo-content';
import type { FaqItem } from '../components/landing/LandingSections';

export interface FreeFeatureConfig {
  slug: string;
  icon: LucideIcon;
  color: string;
  badgeEs: string;
  h1AccentEs: string;
  h1RestEs: string;
  titleEs: string; // <title> tag
  descEs: string;
  includedHeadingEs: string;
  includedBodyEs: string;
  includedItemsEs: string[];
  faqQEs: string;
  faqAEs: string;
  /** OPTIONAL — only set for firma-digital-gratis so far. Real, unique
   * body paragraphs opening with the reader's actual confusion/problem
   * (which signature type they need), rendered before the includedItems
   * grid. The other 6 pages in this batch keep rendering exactly as
   * before with this left unset — same pattern used for ARTICLES'
   * optional fields in article-content.ts. */
  introParagraphsEs?: string[];
  /** OPTIONAL — real per-country legal facts (reusing the already-verified
   * citations in latam-signature-seo-content.ts, reframed around this
   * page's actual question: when is a certified digital signature legally
   * required vs. when a simple electronic signature is enough). */
  countryHighlights?: StateHighlight[];
  /** OPTIONAL — "before you sign, check" list per the site's article
   * content standard (feedback_seo_article_standard.md). */
  checklistEs?: string[];
  /** OPTIONAL — additional real FAQ entries beyond faqQEs/faqAEs above. */
  extraFaqs?: FaqItem[];
}

export const FREE_FEATURE_PAGES: FreeFeatureConfig[] = [
  {
    slug: 'firma-electronica-gratis',
    icon: PenLine, color: '#2563eb',
    badgeEs: '100% GRATIS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'Gratis, con Validez Legal',
    titleEs: 'Firma Electrónica Gratis | Con Validez Legal — CodecDocument',
    descEs: 'Firma documentos electrónicamente gratis, sin tarjeta de crédito. Verificación de identidad, pista de auditoría SHA-256 y validez legal según tu país.',
    includedHeadingEs: 'Tu firma, sin costo y con respaldo legal',
    includedBodyEs: 'El plan gratuito no es una versión recortada — incluye la misma verificación de identidad y el mismo certificado de firma que el plan premium, solo que con un límite de uso.',
    includedItemsEs: [
      'Sin tarjeta de crédito para empezar.',
      'Un documento gratis cada 72 horas.',
      'Firma electrónica gratuita, con límite de uso diario.',
      'Acceso inmediato — firmas en minutos, no en días.',
    ],
    faqQEs: '¿La firma electrónica gratis tiene la misma validez legal que la de pago?',
    faqAEs: 'Sí. La validez legal de la firma no depende del plan que uses — depende de que se cumplan los requisitos de la ley de firma electrónica de tu país (identidad verificada, consentimiento expreso, pista de auditoría). El plan gratuito incluye exactamente esas mismas garantías; lo único que cambia entre planes es cuántos documentos y firmas puedes hacer por período.',
  },
  {
    slug: 'firmar-pdf-gratis',
    icon: Upload, color: '#7c3aed',
    badgeEs: 'SUBE TU PDF',
    h1AccentEs: 'Firma tu PDF', h1RestEs: 'Gratis, en Minutos',
    titleEs: 'Firmar PDF Gratis Online | Sube y Firma — CodecDocument',
    descEs: 'Sube tu propio PDF y fírmalo online gratis. No necesitas convertir ni editar el archivo — solo subirlo, marcar dónde firmas, y descargar el documento certificado.',
    includedHeadingEs: 'Tu propio PDF, listo para firmar',
    includedBodyEs: 'A diferencia de herramientas que solo unen o comprimen archivos, aquí subes el PDF que ya tienes — un contrato, una autorización, lo que sea — y lo firmas con validez legal real, no solo un dibujo pegado encima.',
    includedItemsEs: [
      'Sube cualquier PDF desde tu computador o celular.',
      'Arrastra tu firma exactamente a donde va.',
      'Verificación de identidad con selfie + documento incluida.',
      'Descarga el PDF certificado al instante, sin marca de agua.',
    ],
    faqQEs: '¿Puedo firmar un PDF que ya tengo sin tener que recrearlo?',
    faqAEs: 'Sí, esa es exactamente la idea — subes el PDF que ya tienes (un contrato enviado por alguien más, un formulario, lo que sea), marcas con un clic dónde va tu firma, y el sistema genera el documento certificado. No necesitas recrear el contenido ni usar una plantilla.',
  },
  {
    slug: 'firma-digital-gratis',
    icon: FileSignature, color: '#059669',
    badgeEs: 'FIRMA DIGITAL',
    h1AccentEs: 'Firma Digital', h1RestEs: 'Gratis y Segura',
    titleEs: 'Firma Digital Gratis | Firma Electrónica con Evidencia | CodecDocument',
    descEs: 'Firma digital gratis con evidencia biométrica y pista de auditoría SHA-256. Entiende la diferencia entre firma digital y firma electrónica, y cuál necesitas.',
    includedHeadingEs: '¿Firma digital o firma electrónica? Te lo explicamos',
    includedBodyEs: 'En el uso diario, "firma digital" y "firma electrónica" se usan casi como sinónimos, pero legalmente son distintas. La firma digital certificada usa un certificado criptográfico emitido por una entidad certificadora, pensado para trámites gubernamentales específicos. La firma electrónica, que es lo que ofrece CodecDocument, es válida para la enorme mayoría de contratos privados (NDA, arrendamientos, acuerdos de servicio) y no requiere ese certificado.',
    includedItemsEs: [
      'Firma electrónica válida para contratos privados, gratis.',
      'Evidencia biométrica (selfie + documento) en cada firma.',
      'Pista de auditoría con hash criptográfico SHA-256.',
      'Sin certificado digital que comprar ni renovar.',
    ],
    faqQEs: '¿La firma electrónica gratuita sirve igual que una firma digital certificada?',
    faqAEs: 'Para la gran mayoría de contratos privados entre personas o empresas (NDA, arrendamientos, acuerdos de servicio, pagarés), sí — la ley de la mayoría de los países no exige una firma digital certificada para que un contrato privado sea válido, basta con una firma electrónica respaldada por evidencia de identidad. Una firma digital certificada solo se exige para trámites gubernamentales específicos (ej. facturación electrónica en algunos países), que están fuera del alcance de esta plataforma.',
    introParagraphsEs: [
      'Antes de firmar un contrato importante, es normal ver un anuncio o escuchar a alguien decir que hace falta una "firma digital", con un certificado que hay que comprar y un trámite que puede tardar varios días. Esa confusión hace que mucha gente pague de más o deje esperando un contrato que en realidad ya podía firmar en minutos, gratis y con total validez legal.',
      'La confusión tiene un costo real. Un certificado digital emitido por una entidad certificadora suele tener un costo recurrente y un proceso de emisión que no es inmediato, y en la enorme mayoría de países de Latinoamérica ese certificado ni siquiera es obligatorio para firmar un NDA, un contrato de arrendamiento, un acuerdo de servicio o un pagaré entre particulares. La ley exige que la firma sea confiable, no que venga con un certificado pagado.',
    ],
    countryHighlights: [
      { titleEn: 'Colombia', titleEs: 'Colombia', factEn: 'Decree 2364 of 2012 requires a certified digital certificate only for specific procedures such as electronic invoicing with the DIAN — a private NDA, lease, or service agreement only needs a simple electronic signature backed by identity verification.', factEs: 'El Decreto 2364 de 2012 exige un certificado digital solo para trámites específicos como la facturación electrónica ante la DIAN. Un NDA, un arrendamiento o un acuerdo de servicio entre particulares solo necesita una firma electrónica simple respaldada por verificación de identidad.' },
      { titleEn: 'Mexico', titleEs: 'México', factEn: 'The Advanced Electronic Signature (e.firma/FIEL) issued by the SAT is mandatory only for tax and government filings — private contracts only need a simple electronic signature under the Código de Comercio (Arts. 89–114).', factEs: 'La Firma Electrónica Avanzada (e.firma/FIEL) del SAT es obligatoria únicamente para trámites fiscales y gubernamentales. Los contratos privados entre particulares o empresas solo requieren una firma electrónica simple para ser exigibles, según el Código de Comercio (Arts. 89 a 114).' },
      { titleEn: 'Chile', titleEs: 'Chile', factEn: 'Law 19.799 distinguishes a simple electronic signature, valid for most private contracts, from an advanced electronic signature, required only for specific regulated acts before the State.', factEs: 'La Ley 19.799 distingue entre firma electrónica simple, válida para la mayoría de los contratos privados, y firma electrónica avanzada, exigida solo para actos regulados específicos ante el Estado.' },
      { titleEn: 'Peru', titleEs: 'Perú', factEn: 'Law 27269 requires a certified digital signature within the Official Electronic Signature Infrastructure (IOFE) only for specific procedures overseen by INDECOPI — NDAs, leases, and service agreements only need a simple electronic signature.', factEs: 'La Ley 27269 exige una firma digital certificada dentro de la Infraestructura Oficial de Firma Electrónica (IOFE) solo para trámites específicos supervisados por INDECOPI. Contratos como NDA, arrendamientos y acuerdos de servicio solo necesitan una firma electrónica simple.' },
      { titleEn: 'Argentina', titleEs: 'Argentina', factEn: 'Law 25.506 distinguishes an electronic signature, where whoever relies on it must prove its authorship, from a certified digital signature, where authorship is presumed by law — for most private contracts, an electronic signature with solid identity evidence is enough.', factEs: 'La Ley 25.506 distingue la firma electrónica, donde quien la invoca debe probar su autoría, de la firma digital certificada, donde la autoría se presume por ley. Para la mayoría de contratos privados, una firma electrónica con buena evidencia de identidad es suficiente.' },
      { titleEn: 'Ecuador', titleEs: 'Ecuador', factEn: 'Law 67 gives an electronic signature the same validity as a handwritten one for the general run of contracts — a certified digital certificate is only required for specific procedures defined in the law\'s regulation.', factEs: 'La Ley 67 da a la firma electrónica la misma validez que una firma manuscrita para la generalidad de los contratos. Un certificado digital solo se exige en trámites específicos definidos por el reglamento de la ley.' },
    ],
    checklistEs: [
      'El documento dice con claridad quién firma y en qué calidad (a título personal o como representante de una empresa).',
      'Cada firmante confirmó su identidad con selfie y documento oficial, no solo con un clic sobre un recuadro.',
      'El contrato no es uno de los pocos casos que sí exige firma digital certificada, como la facturación electrónica ante la autoridad tributaria o ciertos trámites notariales y de registro.',
      'El PDF final incluye un hash o pista de auditoría que demuestre que nadie lo modificó después de firmarse.',
      'Las dos partes recibieron su propia copia del documento firmado, con toda la evidencia incluida dentro del mismo archivo.',
      'Guardaste el documento en un lugar donde puedas recuperarlo fácilmente si algún día alguien lo pone en duda.',
    ],
    extraFaqs: [
      { qEn: 'When do I actually need to pay for a certified digital certificate?', qEs: '¿Cuándo sí necesito pagar por un certificado digital?', aEn: 'Only for specific procedures your country\'s own tax or government authority requires it for, such as electronic invoicing or certain notarial or public registry filings. A private contract between two people or companies almost never falls into that category.', aEs: 'Solo para trámites específicos que exige la propia autoridad tributaria o gubernamental de tu país, como la facturación electrónica o ciertos trámites notariales o de registro público. Un contrato privado entre dos personas o empresas casi nunca cae en esa categoría.' },
      { qEn: 'Is signing for free actually cheaper than buying a certificate?', qEs: '¿Es más barato firmar gratis que comprar un certificado digital?', aEn: 'Yes. A digital certificate from a certification authority usually has a recurring cost and an issuance process that takes days, while a free electronic signature has neither that cost nor that wait.', aEs: 'Sí. Un certificado digital de una entidad certificadora suele tener un costo recurrente y un proceso de emisión que tarda días, mientras que una firma electrónica gratuita no tiene ese costo ni esa espera.' },
      { qEn: 'What if someone tells me my contract is not valid without a certified digital signature?', qEs: '¿Qué pasa si alguien me dice que mi contrato no es válido sin firma digital certificada?', aEn: 'For the vast majority of private contracts, validity depends on identity, real consent, and solid evidence behind the signature, not on the type of signature used. Ask specifically which law requires a certified signature for that exact document — in most cases, none does.', aEs: 'Para la gran mayoría de contratos privados, la validez depende de la identidad, el consentimiento real y la evidencia sólida detrás de la firma, no del tipo de firma usada. Pregunta específicamente qué ley exige firma certificada para ese documento exacto — en la mayoría de los casos, ninguna lo hace.' },
      { qEn: 'How do I know if my document is one of the cases that does require a certificate?', qEs: '¿Cómo sé si mi documento es uno de los casos que sí exige certificado?', aEn: 'Those cases are limited and usually defined by the government entity itself for tax or public registry procedures, such as a country\'s tax authority for electronic invoicing. If it is a private contract between two parties, it almost never applies.', aEs: 'Esos casos son limitados y normalmente los define la propia entidad gubernamental para trámites tributarios o de registro público, como la autoridad tributaria de tu país para la facturación electrónica. Si es un contrato privado entre dos partes, casi nunca aplica.' },
      { qEn: 'Does a free digital signature work the same way across every Latin American country?', qEs: '¿La firma digital gratis funciona igual en todos los países de Latinoamérica?', aEn: 'The underlying principle is the same everywhere in the region — a document signed electronically has the same legal weight as one signed on paper — but each country has its own specific law. See the highlights above for the real citation in your country.', aEs: 'El principio de fondo es el mismo en toda la región: un documento firmado electrónicamente tiene el mismo peso legal que uno firmado en papel, pero cada país tiene su propia ley específica. Revisa los datos por país más arriba para ver la cita real de tu país.' },
      { qEn: 'Can I sign from my phone instead of a computer?', qEs: '¿Puedo firmar desde el celular en vez de un computador?', aEn: 'Yes, the entire process, including identity verification, works from any phone or tablet browser.', aEs: 'Sí, todo el proceso, incluyendo la verificación de identidad, funciona desde el navegador de cualquier celular o tableta.' },
      { qEn: 'What evidence exists if a document signed this way is ever disputed?', qEs: '¿Qué evidencia queda si algún día se disputa un documento firmado así?', aEn: 'A SHA-256 hash proving the document was not altered after signing, plus the verified identity, IP address, and timestamp of every signer, all embedded in the same PDF.', aEs: 'Un hash SHA-256 que prueba que el documento no se alteró después de firmarse, más la identidad verificada, la dirección IP y la marca de tiempo de cada firmante, todo dentro del mismo PDF.' },
    ],
  },
  {
    slug: 'firmar-documentos-online-gratis',
    icon: FileText, color: '#dc2626',
    badgeEs: 'CONTRATOS Y ACUERDOS',
    h1AccentEs: 'Firma tus Documentos', h1RestEs: 'Online, Gratis',
    titleEs: 'Firmar Documentos Online Gratis | Contratos y Acuerdos — CodecDocument',
    descEs: 'Firma contratos, acuerdos y documentos online gratis — NDA, arrendamientos, acuerdos de servicio y más. Firma electrónica con validez legal, sin tarjeta de crédito.',
    includedHeadingEs: 'De un contrato en blanco a firmado, en un solo lugar',
    includedBodyEs: 'No importa si el documento lo creaste en la plataforma o lo trajiste de otro lado — el flujo de firma es el mismo: identidad verificada, firma electrónica, y un certificado de auditoría dentro del PDF final.',
    includedItemsEs: [
      'Firma NDA, arrendamientos, acuerdos de servicio y más.',
      'Envía el documento a otra persona para que también firme.',
      'Sigue el estado de la firma en tiempo real.',
      'Un documento y una firma gratis cada 72 horas.',
    ],
    faqQEs: '¿Puedo enviarle el documento a otra persona para que lo firme también?',
    faqAEs: 'Sí. Puedes generar un enlace de firma y enviarlo por WhatsApp, correo o el medio que prefieras — la otra persona firma desde su propio celular o computador, con su propia verificación de identidad, y tú ves en tiempo real cuándo ya firmó.',
  },
  {
    slug: 'documentos-legales-gratis',
    icon: FileText, color: '#d97706',
    badgeEs: 'PLANTILLAS GRATIS',
    h1AccentEs: 'Documentos Legales', h1RestEs: 'Gratis para Empezar',
    titleEs: 'Documentos Legales Gratis | Genera y Firma — CodecDocument',
    descEs: 'Genera documentos legales gratis: NDA, contratos de arrendamiento, acuerdos de servicio, pagarés y más — con vista previa instantánea y firma electrónica incluida.',
    includedHeadingEs: 'Documentos legales, no solo plantillas en blanco',
    includedBodyEs: 'Cada plantilla se genera con los datos que ingresas — no es un documento genérico para editar tú mismo, el sistema arma el texto legal completo según las respuestas que des.',
    includedItemsEs: [
      'NDA, arrendamientos, contratos de servicio, pagarés y más.',
      'Vista previa instantánea mientras completas el formulario.',
      'Firma electrónica incluida, sin costo adicional.',
      'Un documento gratis cada 72 horas, sin tarjeta de crédito.',
    ],
    faqQEs: '¿Los documentos legales gratuitos tienen marca de agua?',
    faqAEs: 'La vista previa muestra una marca de agua mientras completas el formulario, pero la descarga final dentro de tu cuota gratuita (un documento cada 72 horas) se entrega limpia, sin marca de agua.',
  },
  {
    slug: 'crear-documentos-online-gratis',
    icon: FolderOpen, color: '#0891b2',
    badgeEs: 'CREA TU DOCUMENTO',
    h1AccentEs: 'Crea Documentos', h1RestEs: 'Online, Gratis',
    titleEs: 'Crear Documentos Online Gratis | Plantillas o tu Propio Archivo — CodecDocument',
    descEs: 'Crea documentos online gratis de dos formas: usa una plantilla legal lista para llenar, o sube tu propio Word/PDF y personalízalo con tu logo. Ambas opciones son gratuitas.',
    includedHeadingEs: 'Dos formas de crear tu documento',
    includedBodyEs: 'Si necesitas un contrato estándar (NDA, arrendamiento, etc.), usa una plantilla lista. Si ya tienes tu propio formato de empresa, súbelo una vez, marca los campos con clics, y reúsalo cada vez que lo necesites — con tu logo y marca automáticamente.',
    includedItemsEs: [
      'Plantillas legales listas para llenar y firmar.',
      'O sube tu propio Word/PDF y marca los campos tú mismo.',
      'Reutiliza tu propia plantilla las veces que quieras.',
      'Tu logo, encabezado y pie de página automáticos.',
    ],
    faqQEs: '¿Puedo subir el formato de mi propia empresa en vez de usar una plantilla genérica?',
    faqAEs: 'Sí — esa es la función "Mis Plantillas". Subes tu documento (Word o PDF) una sola vez, marcas con clics dónde van los campos que cambian cada vez (nombre, fecha, monto, firma), y desde entonces solo llenas un formulario corto cada vez que necesitas generarlo, con tu logo y marca puestos automáticamente.',
  },
  {
    slug: 'certificar-documentos-online',
    icon: ShieldCheck, color: '#4f46e5',
    badgeEs: 'EVIDENCIA LEGAL',
    h1AccentEs: 'Certifica tus Documentos', h1RestEs: 'con Evidencia Legal Real',
    titleEs: 'Certificar Documentos Online | Evidencia y Auditoría de Firma — CodecDocument',
    descEs: 'Certifica tus documentos firmados con evidencia legal real: hash SHA-256, identidad verificada, IP, fecha y hora. No es solo una firma dibujada — es un certificado de auditoría completo.',
    includedHeadingEs: 'Lo que hace diferente a un documento certificado',
    includedBodyEs: 'Cualquier herramienta te deja dibujar una firma sobre un PDF. Lo que realmente importa si el documento se cuestiona algún día es la evidencia detrás de esa firma — y eso es lo que CodecDocument certifica automáticamente en cada documento.',
    includedItemsEs: [
      'Hash criptográfico SHA-256 que prueba que el documento no fue alterado.',
      'Identidad verificada con selfie + documento de identidad.',
      'Registro de fecha, hora, país, dirección IP y navegador.',
      'Certificado de firma incluido dentro del mismo PDF, listo para presentar.',
    ],
    faqQEs: '¿Qué diferencia hay entre "firmar" un PDF y "certificarlo"?',
    faqAEs: 'Firmar es solo poner tu rúbrica sobre el documento. Certificar es todo lo que respalda esa firma si algún día alguien la cuestiona: quién firmó (identidad verificada), cuándo y desde dónde (fecha, hora, IP, país), y que el documento no cambió después de firmarse (hash SHA-256). CodecDocument genera ese certificado automáticamente, incluido dentro del mismo PDF firmado.',
  },
];

export const FREE_PLAN_FACTS_ES = [
  'Sin tarjeta de crédito',
  'Un documento gratis cada 72 horas',
  'Firma electrónica gratuita, con límite de uso',
  'Acceso inmediato',
];

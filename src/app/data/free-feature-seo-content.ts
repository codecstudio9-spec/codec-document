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
    titleEs: 'Firma Digital Gratis | Firma Electrónica con Evidencia — CodecDocument',
    descEs: 'Firma digital gratis con evidencia biométrica y pista de auditoría SHA-256. Entiende la diferencia entre firma digital y firma electrónica, y cuál necesitas.',
    includedHeadingEs: '¿Firma digital o firma electrónica? Te lo explicamos',
    includedBodyEs: 'En el uso diario, "firma digital" y "firma electrónica" se usan casi como sinónimos — pero legalmente son distintas. La firma digital certificada usa un certificado criptográfico emitido por una entidad certificadora (para trámites gubernamentales específicos). La firma electrónica —lo que ofrece CodecDocument— es válida para la enorme mayoría de contratos privados (NDA, arrendamientos, acuerdos de servicio) y no requiere ese certificado.',
    includedItemsEs: [
      'Firma electrónica válida para contratos privados, gratis.',
      'Evidencia biométrica (selfie + documento) en cada firma.',
      'Pista de auditoría con hash criptográfico SHA-256.',
      'Sin certificado digital que comprar ni renovar.',
    ],
    faqQEs: '¿La firma electrónica gratuita sirve igual que una firma digital certificada?',
    faqAEs: 'Para la gran mayoría de contratos privados entre personas o empresas (NDA, arrendamientos, acuerdos de servicio, pagarés), sí — la ley de la mayoría de los países no exige una firma digital certificada para que un contrato privado sea válido, basta con una firma electrónica respaldada por evidencia de identidad. Una firma digital certificada solo se exige para trámites gubernamentales específicos (ej. facturación electrónica en algunos países), que están fuera del alcance de esta plataforma.',
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

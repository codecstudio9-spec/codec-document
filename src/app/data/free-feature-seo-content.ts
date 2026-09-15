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
    titleEs: 'Firma Electrónica Gratis | Con Validez Legal | CodecDocument',
    descEs: 'Firma documentos electrónicamente gratis, sin tarjeta de crédito. Verificación de identidad, pista de auditoría SHA-256 y validez legal según tu país.',
    includedHeadingEs: 'Tu firma, sin costo y con respaldo legal',
    includedBodyEs: 'El plan gratuito no es una versión recortada, incluye la misma verificación de identidad y el mismo certificado de firma que el plan premium, solo que con un límite de uso.',
    includedItemsEs: [
      'Sin tarjeta de crédito para empezar.',
      'Un documento gratis cada 72 horas.',
      'Firma electrónica gratuita, con límite de uso diario.',
      'Acceso inmediato, firmas en minutos, no en días.',
    ],
    faqQEs: '¿La firma electrónica gratis tiene la misma validez legal que la de pago?',
    faqAEs: 'Sí. La validez legal de la firma no depende del plan que uses, depende de que se cumplan los requisitos de la ley de firma electrónica de tu país (identidad verificada, consentimiento expreso, pista de auditoría). El plan gratuito incluye exactamente esas mismas garantías; lo único que cambia entre planes es cuántos documentos y firmas puedes hacer por período.',
    introParagraphsEs: [
      'Buscar "firma electrónica gratis" casi siempre termina en el mismo problema: herramientas que dejan dibujar una rúbrica sobre un PDF pero no piden ni un dato de quién la dibujó, o que sí son serias pero exigen una tarjeta de crédito antes de dejarte probar nada. Ninguna de las dos resuelve lo que realmente necesitas, que es firmar hoy mismo con algo que de verdad sostenga si alguien lo cuestiona después.',
      'La pregunta que importa no es si algo es gratis, sino qué evidencia queda detrás de esa firma. Un dibujo sobre un PDF no prueba quién firmó ni cuándo. Una firma electrónica con identidad verificada, hash del documento y registro de fecha y hora sí lo hace, y eso es exactamente lo que incluye el plan gratuito de CodecDocument, sin necesidad de tarjeta de crédito para empezar.',
    ],
    checklistEs: [
      'Confirmaste que la herramienta pide verificación de identidad real (selfie + documento), no solo un clic para "aceptar".',
      'El PDF final incluye una pista de auditoría con fecha, hora, IP y un hash del documento.',
      'No tuviste que ingresar una tarjeta de crédito para hacer tu primera firma.',
      'Sabes cuántos documentos y firmas incluye tu plan gratuito antes de necesitar uno nuevo.',
      'Guardaste una copia del documento firmado en un lugar donde puedas encontrarla más adelante.',
      'Si el documento es para otra persona, confirmaste que ella también puede firmar sin crear una cuenta.',
    ],
    extraFaqs: [
      { qEn: 'Is the free plan really free forever, or just a trial?', qEs: '¿El plan gratuito es gratis para siempre o es solo una prueba?', aEn: 'It renews on a recurring cycle rather than expiring once, so it keeps being usable indefinitely, not just for a first trial period.', aEs: 'Se renueva en un ciclo recurrente en lugar de vencerse una sola vez, así que sigue siendo usable de forma indefinida, no solo durante un primer período de prueba.' },
      { qEn: 'What happens when I use up my free quota?', qEs: '¿Qué pasa cuando se me acaba la cuota gratuita?', aEn: 'You simply wait for the next cycle to reset, or upgrade to a paid plan if you need more documents and signatures right away.', aEs: 'Simplemente esperas a que el siguiente ciclo se reinicie, o subes a un plan de pago si necesitas más documentos y firmas de inmediato.' },
      { qEn: 'Can a business use the free plan, or is it only for individuals?', qEs: '¿Una empresa puede usar el plan gratuito, o es solo para personas?', aEn: 'Any individual or business can use it. It is a good fit for occasional use; a business signing frequently will likely want a paid plan for higher volume.', aEs: 'Cualquier persona o empresa puede usarlo. Es una buena opción para uso ocasional; una empresa que firma con frecuencia probablemente va a querer un plan de pago para mayor volumen.' },
      { qEn: 'Do I need to create an account to sign for free?', qEs: '¿Necesito crear una cuenta para firmar gratis?', aEn: 'To generate and send a document, yes. A guest invited to sign someone else\'s document does not need to create an account at all.', aEs: 'Para generar y enviar un documento, sí. Un invitado que firma el documento de otra persona no necesita crear ninguna cuenta.' },
      { qEn: 'Is my information safe on the free plan?', qEs: '¿Mi información está segura en el plan gratuito?', aEn: 'Yes, the free plan uses the same encryption, identity verification, and audit trail infrastructure as every paid plan. Nothing about security is reduced on the free tier.', aEs: 'Sí, el plan gratuito usa la misma infraestructura de cifrado, verificación de identidad y pista de auditoría que cualquier plan de pago. Nada relacionado con seguridad se reduce en el plan gratuito.' },
      { qEn: 'Can I upgrade later if I start needing more documents?', qEs: '¿Puedo subir de plan más adelante si empiezo a necesitar más documentos?', aEn: 'Yes, at any time, and your existing documents and signatures stay exactly where they are.', aEs: 'Sí, en cualquier momento, y tus documentos y firmas existentes se quedan exactamente donde están.' },
    ],
  },
  {
    slug: 'firmar-pdf-gratis',
    icon: Upload, color: '#7c3aed',
    badgeEs: 'SUBE TU PDF',
    h1AccentEs: 'Firma tu PDF', h1RestEs: 'Gratis, en Minutos',
    titleEs: 'Firmar PDF Gratis Online | Sube y Firma | CodecDocument',
    descEs: 'Sube tu propio PDF y fírmalo online gratis. No necesitas convertir ni editar el archivo, solo subirlo, marcar dónde firmas, y descargar el documento certificado.',
    includedHeadingEs: 'Tu propio PDF, listo para firmar',
    includedBodyEs: 'A diferencia de herramientas que solo unen o comprimen archivos, aquí subes el PDF que ya tienes (un contrato, una autorización, lo que sea) y lo firmas con validez legal real, no solo un dibujo pegado encima.',
    includedItemsEs: [
      'Sube cualquier PDF desde tu computador o celular.',
      'Arrastra tu firma exactamente a donde va.',
      'Verificación de identidad con selfie + documento incluida.',
      'Descarga el PDF certificado al instante, sin marca de agua.',
    ],
    faqQEs: '¿Puedo firmar un PDF que ya tengo sin tener que recrearlo?',
    faqAEs: 'Sí, esa es exactamente la idea: subes el PDF que ya tienes (un contrato enviado por alguien más, un formulario, lo que sea), marcas con un clic dónde va tu firma, y el sistema genera el documento certificado. No necesitas recrear el contenido ni usar una plantilla.',
    introParagraphsEs: [
      'El contrato casi siempre llega de afuera: te lo manda un cliente, un arrendador, un proveedor, ya redactado y en PDF, y lo único que falta es tu firma. Recrearlo en una plantilla no tiene sentido y muchas herramientas gratuitas de "firma" tampoco ayudan, porque solo dejan pegar una imagen encima del PDF sin verificar quién eres ni dejar ningún rastro real.',
      'Subir el PDF tal como llegó y firmarlo ahí mismo, con tu identidad verificada y un certificado de auditoría incluido en el mismo archivo, resuelve el problema de una vez: no hay que transcribir nada, no hay que confiar en que "el dibujo alcanza", y el documento final sigue siendo exactamente el mismo que te enviaron, solo que ahora firmado con evidencia real.',
    ],
    checklistEs: [
      'El PDF que subiste es la versión final del contrato, no un borrador que todavía puede cambiar.',
      'Revisaste que el archivo pese menos de 10 MB, el tamaño máximo recomendado para la carga.',
      'Colocaste tu firma en la página y el lugar exactos donde el documento la pide.',
      'Completaste la verificación de identidad antes de descargar el PDF firmado.',
      'Descargaste o guardaste una copia del PDF certificado, no solo la vista previa.',
      'Si el documento necesita más de una firma, enviaste el enlace a cada persona por separado.',
    ],
    extraFaqs: [
      { qEn: 'Can I upload a PDF that someone scanned instead of exported from a program?', qEs: '¿Puedo subir un PDF que alguien escaneó en vez de uno exportado desde un programa?', aEn: 'Yes, as long as it is a valid PDF file, whether it came from a scanner or was generated digitally.', aEs: 'Sí, siempre que sea un archivo PDF válido, ya sea que venga de un escáner o se haya generado digitalmente.' },
      { qEn: 'Is there a file size limit?', qEs: '¿Hay un límite de tamaño de archivo?', aEn: 'The recommended maximum is 10 MB per PDF, which comfortably covers the vast majority of everyday contracts and forms.', aEs: 'El máximo recomendado es 10 MB por PDF, lo que cubre sin problema la gran mayoría de contratos y formularios comunes.' },
      { qEn: 'What if the PDF has more than one page?', qEs: '¿Qué pasa si el PDF tiene más de una página?', aEn: 'You can place your signature on whichever page it belongs on; multi-page documents are fully supported.', aEs: 'Puedes colocar tu firma en la página que corresponda; los documentos de varias páginas están completamente soportados.' },
      { qEn: 'Can more than one person sign the same uploaded PDF?', qEs: '¿Puede más de una persona firmar el mismo PDF que subí?', aEn: 'Yes. You can send a signing link to each additional signer, and everyone\'s signature and identity verification end up recorded on the same final document.', aEs: 'Sí. Puedes enviar un enlace de firma a cada firmante adicional, y la firma e identidad verificada de cada uno terminan registradas en el mismo documento final.' },
      { qEn: 'Will the uploaded PDF\'s original content change in any way?', qEs: '¿El contenido original del PDF que subí cambia de alguna forma?', aEn: 'No. Only your signature image and a final certification page are added; the original content stays exactly as it was.', aEs: 'No. Solo se añaden la imagen de tu firma y una página final de certificación; el contenido original se mantiene exactamente igual.' },
      { qEn: 'Can I get back the original, unsigned version of my PDF?', qEs: '¿Puedo recuperar la versión original sin firmar de mi PDF?', aEn: 'The file you uploaded is still the one on your own device; the platform only adds the signed version alongside it.', aEs: 'El archivo que subiste sigue siendo el que tienes en tu propio dispositivo; la plataforma solo añade la versión firmada junto a este.' },
    ],
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
    faqAEs: 'Para la gran mayoría de contratos privados entre personas o empresas (NDA, arrendamientos, acuerdos de servicio, pagarés), sí. La ley de la mayoría de los países no exige una firma digital certificada para que un contrato privado sea válido, basta con una firma electrónica respaldada por evidencia de identidad. Una firma digital certificada solo se exige para trámites gubernamentales específicos (ej. facturación electrónica en algunos países), que están fuera del alcance de esta plataforma.',
    introParagraphsEs: [
      'Antes de firmar un contrato importante, es normal ver un anuncio o escuchar a alguien decir que hace falta una "firma digital", con un certificado que hay que comprar y un trámite que puede tardar varios días. Esa confusión hace que mucha gente pague de más o deje esperando un contrato que en realidad ya podía firmar en minutos, gratis y con total validez legal.',
      'La confusión tiene un costo real. Un certificado digital emitido por una entidad certificadora suele tener un costo recurrente y un proceso de emisión que no es inmediato, y en la enorme mayoría de países de Latinoamérica ese certificado ni siquiera es obligatorio para firmar un NDA, un contrato de arrendamiento, un acuerdo de servicio o un pagaré entre particulares. La ley exige que la firma sea confiable, no que venga con un certificado pagado.',
    ],
    countryHighlights: [
      { titleEn: 'Colombia', titleEs: 'Colombia', factEn: 'Decree 2364 of 2012 requires a certified digital certificate only for specific procedures such as electronic invoicing with the DIAN. A private NDA, lease, or service agreement only needs a simple electronic signature backed by identity verification.', factEs: 'El Decreto 2364 de 2012 exige un certificado digital solo para trámites específicos como la facturación electrónica ante la DIAN. Un NDA, un arrendamiento o un acuerdo de servicio entre particulares solo necesita una firma electrónica simple respaldada por verificación de identidad.' },
      { titleEn: 'Mexico', titleEs: 'México', factEn: 'The Advanced Electronic Signature (e.firma/FIEL) issued by the SAT is mandatory only for tax and government filings. Private contracts only need a simple electronic signature under the Código de Comercio (Arts. 89 to 114).', factEs: 'La Firma Electrónica Avanzada (e.firma/FIEL) del SAT es obligatoria únicamente para trámites fiscales y gubernamentales. Los contratos privados entre particulares o empresas solo requieren una firma electrónica simple para ser exigibles, según el Código de Comercio (Arts. 89 a 114).' },
      { titleEn: 'Chile', titleEs: 'Chile', factEn: 'Law 19.799 distinguishes a simple electronic signature, valid for most private contracts, from an advanced electronic signature, required only for specific regulated acts before the State.', factEs: 'La Ley 19.799 distingue entre firma electrónica simple, válida para la mayoría de los contratos privados, y firma electrónica avanzada, exigida solo para actos regulados específicos ante el Estado.' },
      { titleEn: 'Peru', titleEs: 'Perú', factEn: 'Law 27269 requires a certified digital signature within the Official Electronic Signature Infrastructure (IOFE) only for specific procedures overseen by INDECOPI. NDAs, leases, and service agreements only need a simple electronic signature.', factEs: 'La Ley 27269 exige una firma digital certificada dentro de la Infraestructura Oficial de Firma Electrónica (IOFE) solo para trámites específicos supervisados por INDECOPI. Contratos como NDA, arrendamientos y acuerdos de servicio solo necesitan una firma electrónica simple.' },
      { titleEn: 'Argentina', titleEs: 'Argentina', factEn: 'Law 25.506 distinguishes an electronic signature, where whoever relies on it must prove its authorship, from a certified digital signature, where authorship is presumed by law. For most private contracts, an electronic signature with solid identity evidence is enough.', factEs: 'La Ley 25.506 distingue la firma electrónica, donde quien la invoca debe probar su autoría, de la firma digital certificada, donde la autoría se presume por ley. Para la mayoría de contratos privados, una firma electrónica con buena evidencia de identidad es suficiente.' },
      { titleEn: 'Ecuador', titleEs: 'Ecuador', factEn: 'Law 67 gives an electronic signature the same validity as a handwritten one for the general run of contracts. A certified digital certificate is only required for specific procedures defined in the law\'s regulation.', factEs: 'La Ley 67 da a la firma electrónica la misma validez que una firma manuscrita para la generalidad de los contratos. Un certificado digital solo se exige en trámites específicos definidos por el reglamento de la ley.' },
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
      { qEn: 'What if someone tells me my contract is not valid without a certified digital signature?', qEs: '¿Qué pasa si alguien me dice que mi contrato no es válido sin firma digital certificada?', aEn: 'For the vast majority of private contracts, validity depends on identity, real consent, and solid evidence behind the signature, not on the type of signature used. Ask specifically which law requires a certified signature for that exact document. In most cases, none does.', aEs: 'Para la gran mayoría de contratos privados, la validez depende de la identidad, el consentimiento real y la evidencia sólida detrás de la firma, no del tipo de firma usada. Pregunta específicamente qué ley exige firma certificada para ese documento exacto. En la mayoría de los casos, ninguna lo hace.' },
      { qEn: 'How do I know if my document is one of the cases that does require a certificate?', qEs: '¿Cómo sé si mi documento es uno de los casos que sí exige certificado?', aEn: 'Those cases are limited and usually defined by the government entity itself for tax or public registry procedures, such as a country\'s tax authority for electronic invoicing. If it is a private contract between two parties, it almost never applies.', aEs: 'Esos casos son limitados y normalmente los define la propia entidad gubernamental para trámites tributarios o de registro público, como la autoridad tributaria de tu país para la facturación electrónica. Si es un contrato privado entre dos partes, casi nunca aplica.' },
      { qEn: 'Does a free digital signature work the same way across every Latin American country?', qEs: '¿La firma digital gratis funciona igual en todos los países de Latinoamérica?', aEn: 'The underlying principle is the same everywhere in the region: a document signed electronically has the same legal weight as one signed on paper, but each country has its own specific law. See the highlights above for the real citation in your country.', aEs: 'El principio de fondo es el mismo en toda la región: un documento firmado electrónicamente tiene el mismo peso legal que uno firmado en papel, pero cada país tiene su propia ley específica. Revisa los datos por país más arriba para ver la cita real de tu país.' },
      { qEn: 'Can I sign from my phone instead of a computer?', qEs: '¿Puedo firmar desde el celular en vez de un computador?', aEn: 'Yes, the entire process, including identity verification, works from any phone or tablet browser.', aEs: 'Sí, todo el proceso, incluyendo la verificación de identidad, funciona desde el navegador de cualquier celular o tableta.' },
      { qEn: 'What evidence exists if a document signed this way is ever disputed?', qEs: '¿Qué evidencia queda si algún día se disputa un documento firmado así?', aEn: 'A SHA-256 hash proving the document was not altered after signing, plus the verified identity, IP address, and timestamp of every signer, all embedded in the same PDF.', aEs: 'Un hash SHA-256 que prueba que el documento no se alteró después de firmarse, más la identidad verificada, la dirección IP y la marca de tiempo de cada firmante, todo dentro del mismo PDF.' },
    ],
  },
  {
    slug: 'firmar-documentos-online-gratis',
    icon: FileText, color: '#dc2626',
    badgeEs: 'CONTRATOS Y ACUERDOS',
    h1AccentEs: 'Firma tus Documentos', h1RestEs: 'Online, Gratis',
    titleEs: 'Firmar Documentos Online Gratis | Contratos y Acuerdos | CodecDocument',
    descEs: 'Firma contratos, acuerdos y documentos online gratis: NDA, arrendamientos, acuerdos de servicio y más. Firma electrónica con validez legal, sin tarjeta de crédito.',
    includedHeadingEs: 'De un contrato en blanco a firmado, en un solo lugar',
    includedBodyEs: 'No importa si el documento lo creaste en la plataforma o lo trajiste de otro lado, el flujo de firma es el mismo: identidad verificada, firma electrónica, y un certificado de auditoría dentro del PDF final.',
    includedItemsEs: [
      'Firma NDA, arrendamientos, acuerdos de servicio y más.',
      'Envía el documento a otra persona para que también firme.',
      'Sigue el estado de la firma en tiempo real.',
      'Un documento y una firma gratis cada 72 horas.',
    ],
    faqQEs: '¿Puedo enviarle el documento a otra persona para que lo firme también?',
    faqAEs: 'Sí. Puedes generar un enlace de firma y enviarlo por WhatsApp, correo o el medio que prefieras. La otra persona firma desde su propio celular o computador, con su propia verificación de identidad, y tú ves en tiempo real cuándo ya firmó.',
    introParagraphsEs: [
      'Un contrato dejado de firmar rara vez se cae por el contenido, se cae porque alguien tenía que reenviar un correo, esperar respuesta, y no había forma de saber si la otra persona ya lo había visto siquiera. Cuando hay más de una persona involucrada, la firma en papel o por PDF suelto convierte algo simple en una cadena de seguimientos manuales.',
      'Enviar un enlace de firma en vez de un archivo cambia eso: cada persona firma desde su propio dispositivo, con su propia verificación de identidad, y el estado del documento se actualiza solo, sin que nadie tenga que preguntar "¿ya firmaste?" por WhatsApp.',
    ],
    checklistEs: [
      'Confirmaste el correo o número correcto de cada persona antes de enviar el enlace de firma.',
      'El documento incluye a todas las partes que realmente necesitan firmar, ni una de más ni una de menos.',
      'Revisaste el orden en que deben firmar, si es que el documento lo requiere.',
      'Verificaste el estado de cada firma antes de dar el contrato por cerrado.',
      'Todas las partes recibieron su propia copia del documento final firmado.',
      'Guardaste el enlace o el documento en un lugar donde puedas encontrarlo si alguien necesita firmarlo de nuevo.',
    ],
    extraFaqs: [
      { qEn: 'What happens if a signer does not respond to the link?', qEs: '¿Qué pasa si un firmante no responde al enlace?', aEn: 'The link stays active and you can resend it or follow up directly; the document simply stays pending until they sign.', aEs: 'El enlace se mantiene activo y puedes reenviarlo o hacer seguimiento directo; el documento simplemente queda pendiente hasta que la persona firme.' },
      { qEn: 'Can I cancel a signature request after sending it?', qEs: '¿Puedo cancelar una solicitud de firma después de enviarla?', aEn: 'Yes, you can stop the process from your own dashboard before the other party signs.', aEs: 'Sí, puedes detener el proceso desde tu propio panel antes de que la otra parte firme.' },
      { qEn: 'Does the other person need to create an account to sign?', qEs: '¿La otra persona necesita crear una cuenta para firmar?', aEn: 'No, a guest can sign directly from the link with their own identity verification, with no account required.', aEs: 'No, un invitado puede firmar directamente desde el enlace con su propia verificación de identidad, sin necesidad de cuenta.' },
      { qEn: 'Can I see in real time when someone has signed?', qEs: '¿Puedo ver en tiempo real cuándo alguien ya firmó?', aEn: 'Yes, the document status updates as soon as each person completes their signature.', aEs: 'Sí, el estado del documento se actualiza en cuanto cada persona completa su firma.' },
      { qEn: 'Can more than two people sign the same document?', qEs: '¿Pueden firmar el mismo documento más de dos personas?', aEn: 'Yes, a document can collect signatures from several people, each with their own separately recorded identity verification.', aEs: 'Sí, un documento puede reunir firmas de varias personas, cada una con su propia verificación de identidad registrada por separado.' },
      { qEn: 'What if I need to resend the document with a small correction?', qEs: '¿Qué pasa si necesito reenviar el documento con una pequeña corrección?', aEn: 'You can generate a corrected version and send a new signing link; the previous unsigned version simply becomes obsolete.', aEs: 'Puedes generar una versión corregida y enviar un nuevo enlace de firma; la versión anterior sin firmar simplemente queda obsoleta.' },
    ],
  },
  {
    slug: 'documentos-legales-gratis',
    icon: FileText, color: '#d97706',
    badgeEs: 'PLANTILLAS GRATIS',
    h1AccentEs: 'Documentos Legales', h1RestEs: 'Gratis para Empezar',
    titleEs: 'Documentos Legales Gratis | Genera y Firma | CodecDocument',
    descEs: 'Genera documentos legales gratis: NDA, contratos de arrendamiento, acuerdos de servicio, pagarés y más, con vista previa instantánea y firma electrónica incluida.',
    includedHeadingEs: 'Documentos legales, no solo plantillas en blanco',
    includedBodyEs: 'Cada plantilla se genera con los datos que ingresas, no es un documento genérico para editar tú mismo, el sistema arma el texto legal completo según las respuestas que des.',
    includedItemsEs: [
      'NDA, arrendamientos, contratos de servicio, pagarés y más.',
      'Vista previa instantánea mientras completas el formulario.',
      'Firma electrónica incluida, sin costo adicional.',
      'Un documento gratis cada 72 horas, sin tarjeta de crédito.',
    ],
    faqQEs: '¿Los documentos legales gratuitos tienen marca de agua?',
    faqAEs: 'La vista previa muestra una marca de agua mientras completas el formulario, pero la descarga final dentro de tu cuota gratuita (un documento cada 72 horas) se entrega limpia, sin marca de agua.',
    introParagraphsEs: [
      'Buscar un contrato gratis en internet suele terminar en dos malos escenarios: una plantilla genérica en inglés que hay que traducir y adaptar a mano, o un formato tan viejo que ya no refleja ni el nombre correcto de la ley que cita. Ninguno de los dos ahorra tiempo de verdad, porque igual toca revisarlo todo con cuidado antes de usarlo.',
      'Generar el documento a partir de tus propios datos, en vez de editar un archivo genérico, resuelve eso desde la raíz: el texto legal se arma con lo que respondiste, la vista previa se actualiza mientras completas el formulario, y lo que descargas ya está listo para firmar, no para seguir corrigiendo.',
    ],
    checklistEs: [
      'Elegiste el tipo de documento correcto para tu situación real, no el que sonaba más parecido.',
      'Revisaste que los nombres de todas las partes estén escritos exactamente como aparecen en su identificación.',
      'Verificaste la vista previa completa antes de generar la versión final.',
      'No quedó ningún texto de ejemplo o placeholder sin reemplazar.',
      'Confirmaste que el documento va a firmarse por las personas correctas, en el orden correcto si aplica.',
      'Guardaste el PDF final descargado, no solo la vista previa con marca de agua.',
    ],
    extraFaqs: [
      { qEn: 'Does the free document include the right legal language for my country?', qEs: '¿El documento gratuito incluye el lenguaje legal correcto para mi país?', aEn: 'Templates adapt their language to the jurisdiction you select when generating the document.', aEs: 'Las plantillas adaptan su lenguaje a la jurisdicción que selecciones al generar el documento.' },
      { qEn: 'Can I edit the document after generating it?', qEs: '¿Puedo editar el documento después de generarlo?', aEn: 'Yes, you can go back and adjust your answers before the final download, and the preview updates immediately.', aEs: 'Sí, puedes regresar y ajustar tus respuestas antes de la descarga final, y la vista previa se actualiza de inmediato.' },
      { qEn: 'Do I need an account to generate a free document?', qEs: '¿Necesito una cuenta para generar un documento gratis?', aEn: 'Yes, generating and downloading your own document requires a free account, so you can find it again later.', aEs: 'Sí, generar y descargar tu propio documento requiere una cuenta gratuita, para que puedas encontrarlo de nuevo más adelante.' },
      { qEn: 'What happens if I need a second document before 72 hours pass?', qEs: '¿Qué pasa si necesito un segundo documento antes de que pasen 72 horas?', aEn: 'You can upgrade to a paid plan for immediate access, or wait for the next free cycle to reset.', aEs: 'Puedes subir a un plan de pago para acceso inmediato, o esperar a que se reinicie el siguiente ciclo gratuito.' },
      { qEn: 'Is a free legal document actually usable if it ever ends up in a dispute?', qEs: '¿Un documento legal gratuito sirve de verdad si termina en una disputa?', aEn: 'Yes, legal validity depends on the document\'s content and how it was signed, not on whether it was free to generate.', aEs: 'Sí, la validez legal depende del contenido del documento y de cómo se firmó, no de si generarlo costó dinero o no.' },
      { qEn: 'Can I download the document as Word instead of only PDF?', qEs: '¿Puedo descargar el documento en Word en vez de solo PDF?', aEn: 'The generated document downloads as a PDF, ready to sign electronically without needing any other program.', aEs: 'El documento generado se descarga en PDF, listo para firmar electrónicamente sin necesitar ningún otro programa.' },
    ],
  },
  {
    slug: 'crear-documentos-online-gratis',
    icon: FolderOpen, color: '#0891b2',
    badgeEs: 'CREA TU DOCUMENTO',
    h1AccentEs: 'Crea Documentos', h1RestEs: 'Online, Gratis',
    titleEs: 'Crear Documentos Online Gratis | Plantillas o tu Propio Archivo | CodecDocument',
    descEs: 'Crea documentos online gratis de dos formas: usa una plantilla legal lista para llenar, o sube tu propio Word/PDF y personalízalo con tu logo. Ambas opciones son gratuitas.',
    includedHeadingEs: 'Dos formas de crear tu documento',
    includedBodyEs: 'Si necesitas un contrato estándar (NDA, arrendamiento, etc.), usa una plantilla lista. Si ya tienes tu propio formato de empresa, súbelo una vez, marca los campos con clics, y reúsalo cada vez que lo necesites, con tu logo y marca automáticamente.',
    includedItemsEs: [
      'Plantillas legales listas para llenar y firmar.',
      'O sube tu propio Word/PDF y marca los campos tú mismo.',
      'Reutiliza tu propia plantilla las veces que quieras.',
      'Tu logo, encabezado y pie de página automáticos.',
    ],
    faqQEs: '¿Puedo subir el formato de mi propia empresa en vez de usar una plantilla genérica?',
    faqAEs: 'Sí, esa es la función "Mis Plantillas". Subes tu documento (Word o PDF) una sola vez, marcas con clics dónde van los campos que cambian cada vez (nombre, fecha, monto, firma), y desde entonces solo llenas un formulario corto cada vez que necesitas generarlo, con tu logo y marca puestos automáticamente.',
    introParagraphsEs: [
      'Toda empresa que ya tiene su propio formato de contrato conoce el mismo problema: cada vez que hay que generar uno nuevo, alguien abre el archivo de Word anterior, busca y reemplaza el nombre, la fecha y el monto a mano, y cruza los dedos para no dejar pasar un error de copiar y pegar.',
      'Subir ese mismo formato una sola vez y marcar con clics cuáles son los campos que cambian resuelve el problema de raíz: desde ahí en adelante, generar el documento es llenar un formulario corto, con el logo y membrete de la empresa puestos automáticamente, sin volver a tocar el archivo original.',
    ],
    checklistEs: [
      'Marcaste todos los campos que realmente cambian cada vez (nombre, fecha, monto, firma), no solo algunos.',
      'Subiste tu logo y membrete una sola vez, en vez de añadirlos a mano en cada documento.',
      'Probaste generar un documento de prueba antes de usar la plantilla con un cliente real.',
      'Revisaste que el formato final se vea igual de profesional que el original en Word o PDF.',
      'Confirmaste quién en tu equipo puede usar la plantilla guardada.',
      'Guardaste una copia del documento original que subiste, por si necesitas ajustarlo más adelante.',
    ],
    extraFaqs: [
      { qEn: 'Does uploading my own template cost anything?', qEs: '¿Subir mi propia plantilla tiene algún costo?', aEn: 'No, uploading and marking your own template is part of the free plan, within the same usage limits as any other free document.', aEs: 'No, subir y marcar tu propia plantilla es parte del plan gratuito, dentro de los mismos límites de uso que cualquier otro documento gratis.' },
      { qEn: 'Can I upload a Word document, or does it need to be a PDF?', qEs: '¿Puedo subir un documento de Word, o debe ser un PDF?', aEn: 'Both Word and PDF formats are accepted for your own custom template.', aEs: 'Se aceptan tanto formatos Word como PDF para tu propia plantilla personalizada.' },
      { qEn: 'Can my whole team use the same saved template?', qEs: '¿Puede todo mi equipo usar la misma plantilla guardada?', aEn: 'Yes, once saved to your account, it stays available every time you or your team needs to generate that same document again.', aEs: 'Sí, una vez guardada en tu cuenta, queda disponible cada vez que tú o tu equipo necesiten generar ese mismo documento de nuevo.' },
      { qEn: 'What if I need to edit the template later?', qEs: '¿Qué pasa si necesito editar la plantilla más adelante?', aEn: 'You can upload a corrected version and re-mark the fields; it replaces the previous one without losing the setup.', aEs: 'Puedes subir una versión corregida y volver a marcar los campos; reemplaza a la anterior sin perder la configuración.' },
      { qEn: 'Is there a limit to how many custom templates I can save?', qEs: '¿Hay un límite de cuántas plantillas propias puedo guardar?', aEn: 'The free plan is meant for occasional use; a business saving many different templates will likely want a paid plan.', aEs: 'El plan gratuito está pensado para uso ocasional; una empresa que guarda muchas plantillas distintas probablemente va a querer un plan de pago.' },
      { qEn: 'Does the automatic logo and letterhead work the same as manually adding them?', qEs: '¿El logo y membrete automáticos funcionan igual que añadirlos a mano?', aEn: 'Better, since they are placed consistently every time without anyone needing to remember to add them.', aEs: 'Mejor, ya que se colocan de forma consistente cada vez sin que nadie tenga que acordarse de añadirlos.' },
    ],
  },
  {
    slug: 'certificar-documentos-online',
    icon: ShieldCheck, color: '#4f46e5',
    badgeEs: 'EVIDENCIA LEGAL',
    h1AccentEs: 'Certifica tus Documentos', h1RestEs: 'con Evidencia Legal Real',
    titleEs: 'Certificar Documentos Online | Evidencia y Auditoría de Firma | CodecDocument',
    descEs: 'Certifica tus documentos firmados con evidencia legal real: hash SHA-256, identidad verificada, IP, fecha y hora. No es solo una firma dibujada, es un certificado de auditoría completo.',
    includedHeadingEs: 'Lo que hace diferente a un documento certificado',
    includedBodyEs: 'Cualquier herramienta te deja dibujar una firma sobre un PDF. Lo que realmente importa si el documento se cuestiona algún día es la evidencia detrás de esa firma, y eso es lo que CodecDocument certifica automáticamente en cada documento.',
    includedItemsEs: [
      'Hash criptográfico SHA-256 que prueba que el documento no fue alterado.',
      'Identidad verificada con selfie + documento de identidad.',
      'Registro de fecha, hora, país, dirección IP y navegador.',
      'Certificado de firma incluido dentro del mismo PDF, listo para presentar.',
    ],
    faqQEs: '¿Qué diferencia hay entre "firmar" un PDF y "certificarlo"?',
    faqAEs: 'Firmar es solo poner tu rúbrica sobre el documento. Certificar es todo lo que respalda esa firma si algún día alguien la cuestiona: quién firmó (identidad verificada), cuándo y desde dónde (fecha, hora, IP, país), y que el documento no cambió después de firmarse (hash SHA-256). CodecDocument genera ese certificado automáticamente, incluido dentro del mismo PDF firmado.',
    introParagraphsEs: [
      'Una firma dibujada sobre un PDF se ve convincente hasta que alguien la pone en duda. Sin nada detrás que pruebe quién firmó, cuándo y desde dónde, esa firma es solo un trazo: no resiste una revisión seria si la otra parte niega haberla puesto o alega que el documento cambió después.',
      'Certificar el documento es justamente lo que llena ese vacío: identidad verificada con selfie y documento oficial, fecha, hora e IP registradas, y un hash SHA-256 que prueba que nadie tocó el archivo después de firmarse, todo incluido dentro del mismo PDF, sin pasos adicionales ni herramientas externas.',
    ],
    checklistEs: [
      'El PDF final incluye la página de certificación, no solo la firma visible.',
      'La identidad de cada firmante quedó verificada con selfie y documento, no solo con un clic.',
      'El documento registra fecha, hora, IP y país de cada firma.',
      'Puedes ubicar el hash SHA-256 del documento dentro del propio certificado.',
      'Guardaste el PDF certificado completo, no una versión recortada o solo la última página.',
      'Si el documento algún día se cuestiona, sabes dónde encontrar esta evidencia rápidamente.',
    ],
    extraFaqs: [
      { qEn: 'How is the SHA-256 hash actually useful if a document is disputed?', qEs: '¿Para qué sirve realmente el hash SHA-256 si se disputa un documento?', aEn: 'Recalculating the hash of the file in question and comparing it to the one printed on the certificate shows immediately whether the document was altered after signing.', aEs: 'Recalcular el hash del archivo en cuestión y compararlo con el que aparece impreso en el certificado muestra de inmediato si el documento fue alterado después de firmarse.' },
      { qEn: 'Can I verify a certified document myself later, without asking the platform?', qEs: '¿Puedo verificar un documento certificado yo mismo más adelante, sin pedirle nada a la plataforma?', aEn: 'Yes, the hash and all the evidence are printed directly on the certification page inside the PDF itself.', aEs: 'Sí, el hash y toda la evidencia están impresos directamente en la página de certificación dentro del mismo PDF.' },
      { qEn: 'Does certification cost extra on top of signing?', qEs: '¿Certificar tiene un costo adicional además de firmar?', aEn: 'No, certification is generated automatically as part of every signature, on the free plan and every paid plan alike.', aEs: 'No, la certificación se genera automáticamente como parte de cada firma, tanto en el plan gratuito como en cualquier plan de pago.' },
      { qEn: 'What happens if someone claims they never signed the document?', qEs: '¿Qué pasa si alguien afirma que nunca firmó el documento?', aEn: 'The certification page shows their verified identity, IP address, and timestamp captured at the exact moment of signing, which is the evidence that backs up the claim that they did.', aEs: 'La página de certificación muestra su identidad verificada, dirección IP y marca de tiempo capturadas en el momento exacto de firmar, que es la evidencia que respalda que sí lo hizo.' },
      { qEn: 'Does this replace a notary?', qEs: '¿Esto reemplaza a un notario?', aEn: 'For the vast majority of private contracts, yes, a notary is not legally required. A handful of specific document types still need one regardless of the signing method.', aEs: 'Para la gran mayoría de contratos privados, sí, un notario no es legalmente necesario. Un puñado de tipos de documento específicos todavía lo necesitan sin importar el método de firma.' },
      { qEn: 'Is certification available on the free plan too?', qEs: '¿La certificación está disponible también en el plan gratuito?', aEn: 'Yes, every document signed on the free plan gets the exact same certification as one signed on a paid plan.', aEs: 'Sí, cada documento firmado en el plan gratuito recibe exactamente la misma certificación que uno firmado en un plan de pago.' },
    ],
  },
];

export const FREE_PLAN_FACTS_ES = [
  'Sin tarjeta de crédito',
  'Un documento gratis cada 72 horas',
  'Firma electrónica gratuita, con límite de uso',
  'Acceso inmediato',
];

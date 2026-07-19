// Smart Quotes SEO landing pages — 5 for the US market (English search
// intent: quote/proposal/estimate terminology) + 5 for LatAm (Spanish:
// cotización/propuesta terminology). Each targets a different real search
// query and angle (not a find-and-replace of the same page 10 times) —
// same reasoning already applied to the state/doctype/city SEO clusters
// elsewhere in this file tree.

export interface QuoteSeoPageConfig {
  slug: string;
  language: 'es' | 'en';
  badge: string;
  titleTag: string;
  metaDescription: string;
  keywords: string;
  heroAccent: string;
  heroRest: string;
  heroSubtitle: string;
  ctaLabel: string;
  secondaryLabel: string;
  includedHeading: string;
  includedBody: string;
  includedItems: string[];
  faqQ: string;
  faqA: string;
}

export const QUOTE_SEO_PAGES: QuoteSeoPageConfig[] = [
  // ── United States (English) ──────────────────────────────────────────
  {
    slug: 'quote-generator',
    language: 'en',
    badge: 'QUOTE',
    titleTag: 'Free Online Quote Generator | CodecDocument',
    metaDescription: 'Create professional quotes in minutes — live totals, your branding, and a real e-signature request so clients can accept online. Not a static PDF template.',
    keywords: 'quote generator, online quote maker, create a quote, quote software, free quote generator',
    heroAccent: 'Quote Generator',
    heroRest: '— Built, Sent, and Signed Online',
    heroSubtitle: 'Build a professional quote with live totals, send it to your client, and get it accepted with a real electronic signature — all inside one platform, not a spreadsheet.',
    ctaLabel: 'Create My Quote',
    secondaryLabel: 'See Templates',
    includedHeading: 'More than a PDF — a full acceptance workflow',
    includedBody: 'A quote generator should end in a signed deal, not an email attachment nobody replies to.',
    includedItems: [
      'Dynamic line items with quantity, discount, and tax calculated live.',
      'Send a real signing link — track when your client opens and signs it.',
      'Choose from 4 professional designs: Corporate, Modern, Executive, Minimal.',
      'Every accepted quote is backed by an audit trail and identity verification.',
    ],
    faqQ: 'Is this just a PDF template, or something more?',
    faqA: 'Something more. Codec Document\'s quote generator creates a real record with a signing link — your client reviews and accepts electronically, and the quote automatically flips to "Accepted" the moment they sign. A plain PDF template can\'t track opens or capture a legally meaningful acceptance.',
  },
  {
    slug: 'proposal-generator',
    language: 'en',
    badge: 'PROPOSAL',
    titleTag: 'Business Proposal Generator | CodecDocument',
    metaDescription: 'Generate a complete business proposal — executive summary, problem/solution, pricing, and terms — with e-signature acceptance built in. Free to start.',
    keywords: 'proposal generator, business proposal template, sales proposal software, create a proposal online',
    heroAccent: 'Proposal Generator',
    heroRest: '— From Pitch to Signature',
    heroSubtitle: 'Build a real business proposal — executive summary, the problem you solve, your solution, pricing, and terms — and let your client accept it with a legally meaningful e-signature.',
    ctaLabel: 'Start My Proposal',
    secondaryLabel: 'See Templates',
    includedHeading: 'Every section a serious proposal needs',
    includedBody: 'Toggle on only the sections you need: introduction, the client\'s problem, your proposed solution, benefits, scope, exclusions, timeline, terms, warranty, and payment terms.',
    includedItems: [
      '10 activatable proposal sections beyond just pricing.',
      'Executive summary and scope fields, not just a line-item table.',
      'Track when your client opens the proposal and reviews pricing.',
      'One click turns an accepted proposal into a signed, certified record.',
    ],
    faqQ: 'Can I include more than just pricing in the proposal?',
    faqA: 'Yes — beyond the pricing table, you can activate sections for your introduction, the client\'s problem, your proposed solution, benefits, timeline, terms, warranty, and payment terms, so the PDF reads like a real proposal, not just a price sheet.',
  },
  {
    slug: 'business-estimate-generator',
    language: 'en',
    badge: 'ESTIMATE',
    titleTag: 'Business Estimate Generator | CodecDocument',
    metaDescription: 'Create itemized estimates for contractors, agencies, and service businesses — quantities, units, discounts, and taxes calculated automatically.',
    keywords: 'estimate generator, contractor estimate template, service estimate software, itemized estimate maker',
    heroAccent: 'Estimate Generator',
    heroRest: '— Itemized, Accurate, Instant',
    heroSubtitle: 'Built for contractors and service businesses: itemize labor and materials by quantity and unit, apply discounts and taxes, and get client sign-off before you start the job.',
    ctaLabel: 'Build My Estimate',
    secondaryLabel: 'See Templates',
    includedHeading: 'Built for real project estimating',
    includedBody: 'Every line item supports quantity, unit (hours, sq ft, units — whatever fits your trade), unit price, discount %, and tax %.',
    includedItems: [
      'Per-line quantity, unit, discount, and tax — totals update live.',
      'Get the client\'s sign-off before scheduling the work.',
      'A permanent record of exactly what was estimated and accepted.',
      'Duplicate a past estimate for a similar job in seconds.',
    ],
    faqQ: 'Does this work for service businesses, not just software companies?',
    faqA: 'Yes — the line-item table supports arbitrary units (hours, square feet, units, etc.), so it works for contractors, agencies, consultants, and any service business that needs to estimate labor and materials before starting a job.',
  },
  {
    slug: 'professional-quote-template',
    language: 'en',
    badge: 'TEMPLATE',
    titleTag: 'Professional Quote Templates | CodecDocument',
    metaDescription: 'Four professionally designed quote templates — Corporate, Modern, Executive, Minimal — with your logo, brand colors, and banking details built in.',
    keywords: 'professional quote template, quote design, business quote template, quote PDF template',
    heroAccent: 'Professional Templates',
    heroRest: 'for Every Kind of Quote',
    heroSubtitle: 'Four distinct designs — Corporate, Modern, Executive, and Minimal — not a single generic layout. Add your logo, brand colors, and banking details once, and every quote uses them automatically.',
    ctaLabel: 'Try the Templates',
    secondaryLabel: 'See Templates',
    includedHeading: 'Four real designs, not four color swaps',
    includedBody: 'Corporate\'s color bar and classic layout, Modern\'s bold full-color header panel, Executive\'s centered serif cover page, or Minimal\'s clean black-and-white — genuinely different layouts.',
    includedItems: [
      'Preview any template instantly before sending — no guessing.',
      'Your logo, brand colors, and font apply automatically.',
      'Bank details (ACH, Zelle, Nequi, Daviplata, PayPal) shown per your country.',
      'Switch templates any time — your data stays the same.',
    ],
    faqQ: 'Can I use my own logo and colors on these templates?',
    faqA: 'Yes — set your logo, primary and secondary brand colors, and font once in your branding profile, and every quote template (Corporate, Modern, Executive, or Minimal) applies them automatically to the PDF.',
  },
  {
    slug: 'commercial-proposal-generator',
    language: 'en',
    badge: 'COMMERCIAL',
    titleTag: 'Commercial Proposal Generator | CodecDocument',
    metaDescription: 'Send B2B commercial proposals with pricing, scope, and terms — track when your client opens it, and close the deal with a real electronic signature.',
    keywords: 'commercial proposal generator, B2B proposal software, sales proposal maker, commercial quote software',
    heroAccent: 'Commercial Proposals',
    heroRest: 'That Actually Close',
    heroSubtitle: 'Send a complete commercial proposal — scope, pricing, and terms — know exactly when your prospect opens it, and close the deal with a real, auditable electronic signature.',
    ctaLabel: 'Send a Proposal',
    secondaryLabel: 'See Templates',
    includedHeading: 'Built for B2B deal-closing, not just paperwork',
    includedBody: 'Know when a prospect is actually engaging with your proposal, so you follow up at the right moment instead of guessing.',
    includedItems: [
      'See when your prospect opened the proposal and how many times.',
      'Status moves from Sent → Viewed → Accepted automatically.',
      'A signed proposal generates a certificate: hash, IP, timestamp, and audit trail.',
      'Included in the same $29.99/mo plan as unlimited documents — no separate tool to buy.',
    ],
    faqQ: 'Can I see if my prospect has opened the proposal?',
    faqA: 'Yes — Codec Document tracks when the proposal link is opened and how many times, so you know your prospect is reviewing it before you follow up, instead of guessing whether they even saw it.',
  },

  // ── LatAm (Spanish) ───────────────────────────────────────────────────
  {
    slug: 'cotizador-online',
    language: 'es',
    badge: 'COTIZADOR',
    titleTag: 'Cotizador Online Gratis | CodecDocument',
    metaDescription: 'Crea cotizaciones profesionales en minutos — totales en tiempo real, tu marca, y firma electrónica real para que el cliente acepte en línea.',
    keywords: 'cotizador online, crear cotizaciones, hacer cotizaciones, software de cotizaciones, cotizador gratis',
    heroAccent: 'Cotizador Online',
    heroRest: '— Creado, Enviado y Firmado',
    heroSubtitle: 'Crea una cotización profesional con totales en tiempo real, envíasela a tu cliente, y logra que la acepte con una firma electrónica real — todo dentro de una sola plataforma.',
    ctaLabel: 'Crear mi Cotización',
    secondaryLabel: 'Ver Plantillas',
    includedHeading: 'Más que un PDF — un flujo completo de aceptación',
    includedBody: 'Un cotizador de verdad debe terminar en un acuerdo firmado, no en un correo que nadie responde.',
    includedItems: [
      'Ítems dinámicos con cantidad, descuento e impuesto calculados en vivo.',
      'Envía un link real de firma — sabe cuándo tu cliente lo abre y lo firma.',
      'Elige entre 4 diseños profesionales: Corporate, Modern, Executive, Minimal.',
      'Cada cotización aceptada queda respaldada con pista de auditoría e identidad verificada.',
    ],
    faqQ: '¿Esto es solo una plantilla PDF o algo más?',
    faqA: 'Algo más. El cotizador de Codec Document crea un registro real con un link de firma — tu cliente revisa y acepta electrónicamente, y la cotización pasa a "Aceptada" automáticamente en el momento en que firma. Una plantilla PDF plana no puede rastrear aperturas ni capturar una aceptación con validez real.',
  },
  {
    slug: 'crear-cotizacion',
    language: 'es',
    badge: 'CREAR',
    titleTag: 'Crear Cotización Profesional en Minutos | CodecDocument',
    metaDescription: 'Crea una cotización paso a paso: datos del cliente, productos y servicios, condiciones — y envíala para firma electrónica al instante.',
    keywords: 'crear cotizacion, hacer una cotizacion, cotizacion paso a paso, como crear una cotizacion',
    heroAccent: 'Crear Cotización',
    heroRest: 'Paso a Paso',
    heroSubtitle: 'Datos del cliente, productos y servicios con totales automáticos, condiciones comerciales — arma tu cotización completa en minutos y envíala para firma.',
    ctaLabel: 'Empezar Ahora',
    secondaryLabel: 'Ver Plantillas',
    includedHeading: 'Todo lo que necesitas para crear una cotización real',
    includedBody: 'No es solo una tabla de precios — es cliente, proyecto, productos, condiciones y firma, todo en un solo lugar.',
    includedItems: [
      'Formulario guiado: cliente, proyecto, productos y servicios.',
      'Subtotal, descuento, impuesto y total calculados automáticamente.',
      'Guarda como borrador y retómala cuando quieras.',
      'Duplica una cotización anterior para un cliente similar en segundos.',
    ],
    faqQ: '¿Necesito saber diseño para que se vea profesional?',
    faqA: 'No. Eliges una de las 4 plantillas ya diseñadas (Corporate, Modern, Executive o Minimal), agregas tu logo y colores una sola vez, y cada cotización que crees se ve profesional automáticamente.',
  },
  {
    slug: 'propuesta-comercial',
    language: 'es',
    badge: 'PROPUESTA',
    titleTag: 'Propuesta Comercial con Firma Electrónica | CodecDocument',
    metaDescription: 'Crea una propuesta comercial completa — resumen ejecutivo, problema, solución, precios y condiciones — con aceptación por firma electrónica.',
    keywords: 'propuesta comercial, crear propuesta comercial, propuesta de negocio, plantilla de propuesta comercial',
    heroAccent: 'Propuesta Comercial',
    heroRest: 'de Principio a Firma',
    heroSubtitle: 'Arma una propuesta comercial real — resumen ejecutivo, el problema del cliente, tu solución, precios y condiciones — y deja que la acepte con una firma electrónica con validez real.',
    ctaLabel: 'Crear mi Propuesta',
    secondaryLabel: 'Ver Plantillas',
    includedHeading: 'Cada sección que una propuesta seria necesita',
    includedBody: 'Activa solo los bloques que necesites: introducción, problema del cliente, solución propuesta, beneficios, alcance, exclusiones, cronograma, condiciones, garantías y forma de pago.',
    includedItems: [
      '10 bloques de propuesta activables, más allá de solo el precio.',
      'Resumen ejecutivo y alcance, no solo una tabla de productos.',
      'Sabe cuándo tu cliente abrió la propuesta y revisó los precios.',
      'Un clic convierte una propuesta aceptada en un registro firmado y certificado.',
    ],
    faqQ: '¿Puedo incluir más que solo precios en la propuesta?',
    faqA: 'Sí — además de la tabla de precios, puedes activar secciones de introducción, problema del cliente, solución propuesta, beneficios, cronograma, condiciones, garantías y forma de pago, para que el PDF se lea como una propuesta real, no solo una lista de precios.',
  },
  {
    slug: 'generador-de-cotizaciones',
    language: 'es',
    badge: 'GENERADOR',
    titleTag: 'Generador de Cotizaciones con Plantillas Profesionales | CodecDocument',
    metaDescription: 'Genera cotizaciones con 4 plantillas profesionales — Corporate, Modern, Executive, Minimal — tu logo, colores y datos bancarios incluidos.',
    keywords: 'generador de cotizaciones, plantillas de cotizacion, generador de presupuestos, cotizaciones profesionales',
    heroAccent: 'Generador de Cotizaciones',
    heroRest: 'con Plantillas Reales',
    heroSubtitle: 'Cuatro diseños distintos — Corporate, Modern, Executive y Minimal — no un solo formato genérico. Agrega tu logo, colores de marca y datos bancarios una vez, y cada cotización los usa automáticamente.',
    ctaLabel: 'Probar los Diseños',
    secondaryLabel: 'Ver Plantillas',
    includedHeading: 'Cuatro diseños reales, no cuatro colores distintos',
    includedBody: 'La barra de color clásica de Corporate, el panel de color audaz de Modern, la portada centrada y formal de Executive, o el blanco y negro limpio de Minimal — layouts genuinamente diferentes.',
    includedItems: [
      'Previsualiza cualquier plantilla al instante antes de enviar.',
      'Tu logo, colores de marca y fuente se aplican automáticamente.',
      'Datos bancarios (ACH, Zelle, Nequi, Daviplata, PayPal) según tu país.',
      'Cambia de plantilla cuando quieras — tus datos se mantienen.',
    ],
    faqQ: '¿Puedo usar mi propio logo y colores en las plantillas?',
    faqA: 'Sí — configura tu logo, colores primario y secundario, y fuente una vez en tu perfil de marca, y cada plantilla de cotización (Corporate, Modern, Executive o Minimal) los aplica automáticamente al PDF.',
  },
  {
    slug: 'cotizacion-profesional',
    language: 'es',
    badge: 'PROFESIONAL',
    titleTag: 'Cotización Profesional con tu Marca | CodecDocument',
    metaDescription: 'Crea cotizaciones con la calidad visual de una empresa Fortune 500 — tu logo, colores, datos bancarios, y firma electrónica del cliente incluida.',
    keywords: 'cotizacion profesional, cotizacion con marca, plantilla de cotizacion profesional, cotizacion empresarial',
    heroAccent: 'Cotización Profesional',
    heroRest: 'con tu Marca',
    heroSubtitle: 'Cotizaciones con la calidad visual de una empresa grande — tu logo, tus colores, tus datos bancarios — y una firma electrónica real de tu cliente al final.',
    ctaLabel: 'Crear Cotización',
    secondaryLabel: 'Ver Plantillas',
    includedHeading: 'Se ve como la hizo un equipo de diseño',
    includedBody: 'Portada con tu logo y datos, resumen ejecutivo, tabla de productos, resumen financiero, y página final con firma electrónica y código de validación.',
    includedItems: [
      'Portada profesional: logo, empresa, cliente, número y fecha.',
      'Resumen financiero claro: subtotal, descuentos, impuestos, total.',
      'Datos bancarios de tu empresa incluidos según tu país (ACH, Zelle, Nequi, Daviplata, PayPal).',
      'Página final con firma electrónica y evidencia de aceptación.',
    ],
    faqQ: '¿Necesito agregar mis datos bancarios cada vez?',
    faqA: 'No. Configuras tu banco, cuenta, y métodos de pago (ACH, Zelle, Nequi, Daviplata, PayPal) una sola vez en tu perfil de marca, y aparecen automáticamente en cada cotización que generes.',
  },
];

export function getQuoteSeoPage(slug: string): QuoteSeoPageConfig | undefined {
  return QUOTE_SEO_PAGES.find((p) => p.slug === slug);
}

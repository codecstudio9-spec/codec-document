// Curated, state-specific legal facts for the 6 state SEO landing pages
// (California, Texas, Florida, New York, Illinois, Pennsylvania — chosen
// for population/search volume). Pulled from the same real legal research
// already vetted in state-variations.ts (leaseAddendums / stateNotes) —
// not new/unverified content, just re-presented as a dedicated page per
// state instead of only living inside generated document text. Real,
// differentiated facts per state avoid a thin/duplicate-content SEO risk
// that a pure find-and-replace of the state name would create.

export interface StateHighlight {
  titleEn: string;
  titleEs: string;
  factEn: string;
  factEs: string;
}

export interface StateSeoConfig {
  slug: string;
  name: string;
  nameEs: string;
  abbreviation: string;
  highlights: StateHighlight[];
  faqEn: string;
  faqEs: string;
  faqAnswerEn: string;
  faqAnswerEs: string;
}

export const STATE_SEO_CONFIGS: StateSeoConfig[] = [
  {
    slug: 'california',
    name: 'California',
    nameEs: 'California',
    abbreviation: 'CA',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Security deposits are capped at 2 months\' rent (unfurnished) under Cal. Civil Code §1940 et seq., and must be returned within 21 days. Rent control applies in Los Angeles, San Francisco, Oakland, and other cities under AB 1482.',
        factEs: 'Los depósitos de garantía están limitados a 2 meses de renta (sin amueblar) bajo el Código Civil de California §1940 y siguientes, y deben devolverse en 21 días. El control de alquiler aplica en Los Ángeles, San Francisco, Oakland y otras ciudades bajo AB 1482.',
      },
      {
        titleEn: 'Eviction Notices', titleEs: 'Avisos de Desalojo',
        factEn: 'California requires a 3-day notice for non-payment of rent, and 30–60 days for no-fault eviction. AB 1482 rent cap and just-cause eviction rules apply statewide.',
        factEs: 'California requiere un aviso de 3 días por falta de pago de renta, y de 30 a 60 días para desalojo sin causa. Las reglas de tope de renta y causa justa de AB 1482 aplican en todo el estado.',
      },
      {
        titleEn: 'LLC Formation', titleEs: 'Formación de LLC',
        factEn: 'California LLCs pay an $800 annual franchise tax plus a gross receipts fee, and must file a biennial Statement of Information — factor this into your operating agreement.',
        factEs: 'Las LLC de California pagan un impuesto de franquicia anual de $800 más una tarifa por ingresos brutos, y deben presentar un Statement of Information cada dos años — considera esto en tu acuerdo operativo.',
      },
      {
        titleEn: 'Wills & Estates', titleEs: 'Testamentos y Sucesiones',
        factEn: 'California requires two witnesses for a valid will and is a community property state — special rules apply for assets acquired during marriage.',
        factEs: 'California requiere dos testigos para un testamento válido y es un estado de bienes gananciales — aplican reglas especiales para bienes adquiridos durante el matrimonio.',
      },
    ],
    faqEn: 'Are electronic signatures legal in California?',
    faqEs: '¿Las firmas electrónicas son legales en California?',
    faqAnswerEn: 'Yes. California recognizes electronic signatures as legally binding under the Uniform Electronic Transactions Act (UETA), codified in California Civil Code §1633.7, as well as the Federal ESIGN Act. Codec Document\'s signatures include SHA-256 hashing, IP logging, and timestamped audit trails to meet evidentiary standards.',
    faqAnswerEs: 'Sí. California reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley Uniforme de Transacciones Electrónicas (UETA), codificada en el Código Civil de California §1633.7, así como la Ley Federal ESIGN. Las firmas de Codec Document incluyen hash SHA-256, registro de IP y pistas de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
  {
    slug: 'texas',
    name: 'Texas',
    nameEs: 'Texas',
    abbreviation: 'TX',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Texas Property Code Chapter 92 sets no statutory cap on security deposits and requires landlords to return deposits within 30 days with itemized deductions. There is no statewide rent control.',
        factEs: 'El Código de Propiedad de Texas, Capítulo 92, no fija un límite legal para depósitos de garantía y exige que el arrendador los devuelva en 30 días con deducciones detalladas. No existe control de alquiler estatal.',
      },
      {
        titleEn: 'Eviction Notices', titleEs: 'Avisos de Desalojo',
        factEn: 'Texas requires a 3-day notice to vacate before an eviction suit can be filed. Self-help eviction (changing locks, removing belongings) is illegal — evictions must go through Justice Court.',
        factEs: 'Texas requiere un aviso de 3 días para desocupar antes de poder presentar una demanda de desalojo. El desalojo por mano propia (cambiar cerraduras, retirar pertenencias) es ilegal — los desalojos deben pasar por la Corte de Justicia.',
      },
      {
        titleEn: 'LLC Formation', titleEs: 'Formación de LLC',
        factEn: 'Texas has no state income tax, but LLCs must file an annual Public Information Report and may owe franchise tax based on revenue above the no-tax-due threshold.',
        factEs: 'Texas no tiene impuesto estatal sobre la renta, pero las LLC deben presentar un Public Information Report anual y pueden deber impuesto de franquicia según los ingresos por encima del umbral exento.',
      },
      {
        titleEn: 'Wills & Estates', titleEs: 'Testamentos y Sucesiones',
        factEn: 'Texas is a community property state and allows both attested (witnessed) and holographic (handwritten) wills — a flexibility not offered in most other states.',
        factEs: 'Texas es un estado de bienes gananciales y permite tanto testamentos atestiguados (con testigos) como ológrafos (escritos a mano) — una flexibilidad que no ofrecen la mayoría de los demás estados.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Texas?',
    faqEs: '¿Las firmas electrónicas son legales en Texas?',
    faqAnswerEn: 'Yes. The Texas Uniform Electronic Transactions Act (Bus. & Com. Code Ch. 322) gives electronic signatures the same legal effect as handwritten ones, alongside the Federal ESIGN Act. Codec Document adds a SHA-256 audit trail, identity verification, and geolocation evidence to every signed document.',
    faqAnswerEs: 'Sí. La Ley Uniforme de Transacciones Electrónicas de Texas (Código de Negocios y Comercio, Cap. 322) otorga a las firmas electrónicas el mismo efecto legal que las manuscritas, junto con la Ley Federal ESIGN. Codec Document agrega una pista de auditoría SHA-256, verificación de identidad y evidencia de geolocalización a cada documento firmado.',
  },
  {
    slug: 'florida',
    name: 'Florida',
    nameEs: 'Florida',
    abbreviation: 'FL',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Florida Statutes Chapter 83 requires security deposits to be held in a Florida financial institution and returned within 15–30 days. Mold disclosure is mandatory statewide.',
        factEs: 'El Capítulo 83 de los Estatutos de Florida exige que los depósitos de garantía se mantengan en una institución financiera de Florida y se devuelvan en 15 a 30 días. La divulgación de moho es obligatoria en todo el estado.',
      },
      {
        titleEn: 'Eviction Notices', titleEs: 'Avisos de Desalojo',
        factEn: 'Florida requires a 3-day notice for non-payment of rent and a 7-day notice for lease violations, with specific statutory language required for validity.',
        factEs: 'Florida requiere un aviso de 3 días por falta de pago de renta y un aviso de 7 días por violaciones al contrato, con un lenguaje estatutario específico requerido para su validez.',
      },
      {
        titleEn: 'Wills & Estates', titleEs: 'Testamentos y Sucesiones',
        factEn: 'Florida requires two witnesses and notarization for a valid will, and homestead property carries special constitutional protections that affect how it can be inherited.',
        factEs: 'Florida requiere dos testigos y notarización para un testamento válido, y la propiedad de homestead tiene protecciones constitucionales especiales que afectan cómo puede heredarse.',
      },
      {
        titleEn: 'Signing & Records', titleEs: 'Firma y Registros',
        factEn: 'Electronic records and signatures are explicitly valid under Fla. Stat. §668.001 (Florida\'s Electronic Signature Act), covering everything from leases to service agreements.',
        factEs: 'Los registros y firmas electrónicas son explícitamente válidos bajo el Estatuto de Florida §668.001 (Ley de Firma Electrónica de Florida), cubriendo desde contratos de arrendamiento hasta acuerdos de servicio.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Florida?',
    faqEs: '¿Las firmas electrónicas son legales en Florida?',
    faqAnswerEn: 'Yes. Florida\'s Electronic Signature Act (Fla. Stat. §668.001 et seq.) and the Federal ESIGN Act make electronic signatures fully enforceable for most contracts, including leases and service agreements. Codec Document documents every signature with a SHA-256 hash and timestamped audit trail.',
    faqAnswerEs: 'Sí. La Ley de Firma Electrónica de Florida (Estatuto §668.001 y siguientes) y la Ley Federal ESIGN hacen que las firmas electrónicas sean totalmente exigibles para la mayoría de los contratos, incluyendo arrendamientos y acuerdos de servicio. Codec Document documenta cada firma con un hash SHA-256 y una pista de auditoría con marca de tiempo.',
  },
  {
    slug: 'new-york',
    name: 'New York',
    nameEs: 'Nueva York',
    abbreviation: 'NY',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Since the 2019 HSTPA reform, security deposits are capped at 1 month\'s rent statewide and must be returned within 14 days of move-out with an itemized statement.',
        factEs: 'Desde la reforma HSTPA de 2019, los depósitos de garantía están limitados a 1 mes de renta en todo el estado y deben devolverse en 14 días tras la mudanza con un estado de cuenta detallado.',
      },
      {
        titleEn: 'Eviction Notices', titleEs: 'Avisos de Desalojo',
        factEn: 'New York requires a 14-day notice for monthly tenants and a 90-day notice to terminate certain fixed-term leases. NYC has additional rent stabilization protections.',
        factEs: 'Nueva York requiere un aviso de 14 días para inquilinos mensuales y de 90 días para terminar ciertos contratos a plazo fijo. NYC tiene protecciones adicionales de estabilización de renta.',
      },
      {
        titleEn: 'Wills & Estates', titleEs: 'Testamentos y Sucesiones',
        factEn: 'New York requires two witnesses for a valid will, and specific language for residuary clauses is strongly recommended to avoid probate disputes.',
        factEs: 'Nueva York requiere dos testigos para un testamento válido, y se recomienda encarecidamente un lenguaje específico para las cláusulas residuales para evitar disputas en el proceso sucesorio.',
      },
      {
        titleEn: 'Signing & Records', titleEs: 'Firma y Registros',
        factEn: 'Electronic signatures are valid under New York\'s Electronic Signatures and Records Act (ESRA), giving them the same legal weight as ink signatures for most agreements.',
        factEs: 'Las firmas electrónicas son válidas bajo la Ley de Firmas y Registros Electrónicos de Nueva York (ESRA), otorgándoles el mismo peso legal que las firmas a tinta para la mayoría de los acuerdos.',
      },
    ],
    faqEn: 'Are electronic signatures legal in New York?',
    faqEs: '¿Las firmas electrónicas son legales en Nueva York?',
    faqAnswerEn: 'Yes. New York\'s Electronic Signatures and Records Act (ESRA) and the Federal ESIGN Act make electronic signatures legally binding for the vast majority of contracts. Codec Document adds identity verification, geolocation, and a SHA-256 audit trail to every signed document.',
    faqAnswerEs: 'Sí. La Ley de Firmas y Registros Electrónicos de Nueva York (ESRA) y la Ley Federal ESIGN hacen que las firmas electrónicas sean legalmente vinculantes para la gran mayoría de los contratos. Codec Document agrega verificación de identidad, geolocalización y una pista de auditoría SHA-256 a cada documento firmado.',
  },
  {
    slug: 'illinois',
    name: 'Illinois',
    nameEs: 'Illinois',
    abbreviation: 'IL',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Chicago\'s Residential Landlord Tenant Ordinance (RLTO) adds extra protections within city limits, including mandatory security deposit interest in buildings with 6+ units.',
        factEs: 'La Ordenanza de Arrendador-Inquilino Residencial de Chicago (RLTO) agrega protecciones adicionales dentro de los límites de la ciudad, incluyendo interés obligatorio sobre el depósito en edificios con 6 o más unidades.',
      },
      {
        titleEn: 'Eviction Notices', titleEs: 'Avisos de Desalojo',
        factEn: 'Illinois requires a 5-day notice for non-payment of rent in Chicago (10-day notice for lease violations statewide) before an eviction case can be filed.',
        factEs: 'Illinois requiere un aviso de 5 días por falta de pago de renta en Chicago (aviso de 10 días por violaciones al contrato en todo el estado) antes de poder presentar un caso de desalojo.',
      },
      {
        titleEn: 'Signing & Records', titleEs: 'Firma y Registros',
        factEn: 'The Illinois Electronic Commerce Security Act gives electronic signatures the same legal standing as handwritten ones for leases, NDAs, and most business contracts.',
        factEs: 'La Ley de Seguridad del Comercio Electrónico de Illinois otorga a las firmas electrónicas la misma validez legal que las manuscritas para arrendamientos, NDA y la mayoría de los contratos comerciales.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Illinois?',
    faqEs: '¿Las firmas electrónicas son legales en Illinois?',
    faqAnswerEn: 'Yes. The Illinois Electronic Commerce Security Act, together with the Federal ESIGN Act, makes electronic signatures enforceable for leases, NDAs, and most business contracts. Codec Document backs every signature with a SHA-256 hash and full audit trail.',
    faqAnswerEs: 'Sí. La Ley de Seguridad del Comercio Electrónico de Illinois, junto con la Ley Federal ESIGN, hace que las firmas electrónicas sean exigibles para arrendamientos, NDA y la mayoría de los contratos comerciales. Codec Document respalda cada firma con un hash SHA-256 y una pista de auditoría completa.',
  },
  {
    slug: 'pennsylvania',
    name: 'Pennsylvania',
    nameEs: 'Pensilvania',
    abbreviation: 'PA',
    highlights: [
      {
        titleEn: 'Lease Agreements', titleEs: 'Contratos de Arrendamiento',
        factEn: 'Pennsylvania\'s Landlord-Tenant Act caps security deposits at 2 months\' rent for the first year of tenancy (1 month thereafter), returnable within 30 days.',
        factEs: 'La Ley de Arrendador-Inquilino de Pensilvania limita los depósitos de garantía a 2 meses de renta el primer año de arrendamiento (1 mes después), a devolver en 30 días.',
      },
      {
        titleEn: 'Local Ordinances', titleEs: 'Ordenanzas Locales',
        factEn: 'Philadelphia\'s Fair Practices Ordinance adds additional tenant protections beyond state law — leases used within city limits should account for these local rules.',
        factEs: 'La Ordenanza de Prácticas Justas de Filadelfia agrega protecciones adicionales para inquilinos más allá de la ley estatal — los contratos usados dentro de los límites de la ciudad deben considerar estas reglas locales.',
      },
      {
        titleEn: 'Signing & Records', titleEs: 'Firma y Registros',
        factEn: 'Pennsylvania\'s Electronic Transactions Act (73 P.S. §2260.101) gives electronic signatures the same legal effect as handwritten ones for most contracts.',
        factEs: 'La Ley de Transacciones Electrónicas de Pensilvania (73 P.S. §2260.101) otorga a las firmas electrónicas el mismo efecto legal que las manuscritas para la mayoría de los contratos.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Pennsylvania?',
    faqEs: '¿Las firmas electrónicas son legales en Pensilvania?',
    faqAnswerEn: 'Yes. Pennsylvania\'s Electronic Transactions Act, together with the Federal ESIGN Act, makes electronic signatures legally binding for leases, NDAs, and most business agreements. Codec Document adds identity verification and a SHA-256 audit trail to every signature.',
    faqAnswerEs: 'Sí. La Ley de Transacciones Electrónicas de Pensilvania, junto con la Ley Federal ESIGN, hace que las firmas electrónicas sean legalmente vinculantes para arrendamientos, NDA y la mayoría de los acuerdos comerciales. Codec Document agrega verificación de identidad y una pista de auditoría SHA-256 a cada firma.',
  },
];

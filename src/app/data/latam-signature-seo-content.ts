// Country-specific legal content for the LatAm e-signature SEO landing
// pages (src/app/pages/landings/firma-electronica-*.tsx) — same premium
// dark-hero design system as the US state/doctype pages, but scoped to
// e-signature only (not the full document generator), since that's the
// specific expansion requested: same product, same pricing/plans, just
// adapted with each country's real electronic-signature law instead of
// carrying over US ESIGN Act / UETA claims, which don't apply outside
// the US and would be legally inaccurate to show here.
//
// 6 countries chosen for LatAm e-signature demand/market maturity —
// each already has a real, specific electronic-signature statute (not
// just "electronic commerce in general"), and Spanish is the site's
// existing second language, so no new i18n infrastructure is needed.

export interface LatamHighlight {
  titleEn: string;
  titleEs: string;
  factEn: string;
  factEs: string;
}

export interface LatamCountryConfig {
  slug: string;
  name: string;
  nameEs: string;
  code: string; // short badge label, e.g. "CO"
  flag: string; // emoji, used in the badge chip
  lawBadgeEn: string; // short trust-badge label naming the local law
  lawBadgeEs: string;
  highlights: LatamHighlight[];
  faqEn: string;
  faqEs: string;
  faqAnswerEn: string;
  faqAnswerEs: string;
}

export const LATAM_COUNTRIES: LatamCountryConfig[] = [
  {
    slug: 'colombia',
    name: 'Colombia',
    nameEs: 'Colombia',
    code: 'CO',
    flag: '🇨🇴',
    lawBadgeEn: 'Law 527 of 1999',
    lawBadgeEs: 'Ley 527 de 1999',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'Law 527 of 1999 (Arts. 5–13) grants data messages and electronic signatures the same legal validity and evidentiary force as paper documents and handwritten signatures — this is the functional-equivalence principle.',
        factEs: 'La Ley 527 de 1999 (Arts. 5 a 13) otorga a los mensajes de datos y a la firma electrónica la misma validez jurídica y fuerza probatoria que los documentos en papel y la firma manuscrita — este es el principio de equivalencia funcional.',
      },
      {
        titleEn: 'Simple electronic signature', titleEs: 'Firma electrónica simple',
        factEn: 'Decree 2364 of 2012 confirms that an electronic signature does NOT require a certified digital signature to be valid — it only needs to be reliable and appropriate for the purpose of the message, which selfie + ID identity verification satisfies.',
        factEs: 'El Decreto 2364 de 2012 confirma que una firma electrónica NO requiere una firma digital certificada para ser válida — solo debe ser fiable y apropiada para el propósito del mensaje, lo cual la verificación de identidad con selfie + cédula cumple.',
      },
      {
        titleEn: 'Constitutional Court', titleEs: 'Corte Constitucional',
        factEn: 'Ruling C-662 of 2000 by the Constitutional Court upheld Law 527 as constitutional, confirming that electronic documents carry the same evidentiary weight as physical ones.',
        factEs: 'La Sentencia C-662 de 2000 de la Corte Constitucional declaró exequible la Ley 527, confirmando que los documentos electrónicos tienen el mismo peso probatorio que los físicos.',
      },
      {
        titleEn: 'Admissible as evidence', titleEs: 'Admisible como prueba',
        factEn: 'Article 247 of the General Code of Procedure (Law 1564 of 2012) explicitly admits data messages as documentary evidence in Colombian courts.',
        factEs: 'El Artículo 247 del Código General del Proceso (Ley 1564 de 2012) admite expresamente los mensajes de datos como prueba documental en los tribunales colombianos.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Colombia?',
    faqEs: '¿Las firmas electrónicas son legales en Colombia?',
    faqAnswerEn: 'Yes. Colombia recognizes electronic signatures as legally binding under Law 527 of 1999 and Decree 2364 of 2012, upheld by the Constitutional Court (Ruling C-662 of 2000). Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail to meet evidentiary standards.',
    faqAnswerEs: 'Sí. Colombia reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley 527 de 1999 y el Decreto 2364 de 2012, ratificados por la Corte Constitucional (Sentencia C-662 de 2000). Las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + cédula, y una pista de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
  {
    slug: 'mexico',
    name: 'Mexico',
    nameEs: 'México',
    code: 'MX',
    flag: '🇲🇽',
    lawBadgeEn: 'Código de Comercio',
    lawBadgeEs: 'Código de Comercio',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'The Código de Comercio, Title Two "Del Comercio Electrónico" (Arts. 89–114), grants full legal validity to data messages and electronic signatures in commercial transactions between private parties.',
        factEs: 'El Código de Comercio, Título Segundo "Del Comercio Electrónico" (Arts. 89 a 114), otorga plena validez jurídica a los mensajes de datos y a la firma electrónica en transacciones comerciales entre particulares.',
      },
      {
        titleEn: 'Electronic consent', titleEs: 'Consentimiento electrónico',
        factEn: 'Articles 1803 and 1834-Bis of the Federal Civil Code recognize consent expressed through electronic means as valid for forming a contract.',
        factEs: 'Los Artículos 1803 y 1834-Bis del Código Civil Federal reconocen el consentimiento expresado por medios electrónicos como válido para la formación de un contrato.',
      },
      {
        titleEn: 'Simple vs. advanced signature', titleEs: 'Firma simple vs. avanzada',
        factEn: 'The Advanced Electronic Signature (e.firma/FIEL) issued by the SAT is only mandatory for tax and government filings — private contracts between individuals or businesses only need a simple electronic signature to be enforceable.',
        factEs: 'La Firma Electrónica Avanzada (e.firma/FIEL) emitida por el SAT es obligatoria solo para trámites fiscales y gubernamentales — los contratos privados entre particulares o empresas solo requieren una firma electrónica simple para ser exigibles.',
      },
      {
        titleEn: 'Document retention', titleEs: 'Conservación de documentos',
        factEn: 'NOM-151-SCFI-2016 establishes the technical requirements for retaining data messages, including digital time-stamping — the same evidentiary logic behind Codec Document\'s audit trail.',
        factEs: 'La NOM-151-SCFI-2016 establece los requisitos técnicos para la conservación de mensajes de datos, incluyendo el sellado digital de tiempo — la misma lógica probatoria detrás de la pista de auditoría de Codec Document.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Mexico?',
    faqEs: '¿Las firmas electrónicas son legales en México?',
    faqAnswerEn: 'Yes. Mexico recognizes electronic signatures as legally binding under the Código de Comercio (Arts. 89–114) and the Federal Civil Code. For private contracts, a simple electronic signature is enough — Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail.',
    faqAnswerEs: 'Sí. México reconoce las firmas electrónicas como legalmente vinculantes bajo el Código de Comercio (Arts. 89 a 114) y el Código Civil Federal. Para contratos privados, basta una firma electrónica simple — las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + identificación, y una pista de auditoría con marca de tiempo.',
  },
  {
    slug: 'chile',
    name: 'Chile',
    nameEs: 'Chile',
    code: 'CL',
    flag: '🇨🇱',
    lawBadgeEn: 'Law 19.799',
    lawBadgeEs: 'Ley 19.799',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'Law 19.799 on Electronic Documents, Electronic Signatures and Certification Services (2002) states in Article 3 that acts and contracts signed electronically are as valid as those signed on paper.',
        factEs: 'La Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma (2002) establece en su Artículo 3 que los actos y contratos suscritos por firma electrónica son tan válidos como los suscritos en papel.',
      },
      {
        titleEn: 'Two signature types', titleEs: 'Dos tipos de firma',
        factEn: 'Chilean law distinguishes between a simple electronic signature (valid for most private contracts) and an advanced electronic signature (required for specific regulated acts) — Codec Document covers the simple signature use case that applies to most NDAs, leases and service agreements.',
        factEs: 'La ley chilena distingue entre firma electrónica simple (válida para la mayoría de los contratos privados) y firma electrónica avanzada (requerida para actos regulados específicos) — Codec Document cubre el caso de la firma simple que aplica a la mayoría de los NDA, arrendamientos y acuerdos de servicio.',
      },
      {
        titleEn: 'Technical requirements', titleEs: 'Requisitos técnicos',
        factEn: 'Supreme Decree 181 of 2002 develops the technical requirements referenced by Law 19.799, covering integrity and authorship verification for electronic documents.',
        factEs: 'El Decreto Supremo 181 de 2002 desarrolla los requisitos técnicos a los que remite la Ley 19.799, cubriendo la verificación de integridad y autoría de los documentos electrónicos.',
      },
      {
        titleEn: 'Digital transformation', titleEs: 'Transformación digital',
        factEn: 'Law 21.180 on the State\'s Digital Transformation (2019) further expanded the use of electronic signatures across public and private procedures in Chile.',
        factEs: 'La Ley 21.180 de Transformación Digital del Estado (2019) amplió aún más el uso de la firma electrónica en trámites públicos y privados en Chile.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Chile?',
    faqEs: '¿Las firmas electrónicas son legales en Chile?',
    faqAnswerEn: 'Yes. Chile recognizes electronic signatures as legally binding under Law 19.799 (2002), Article 3. Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail to meet evidentiary standards.',
    faqAnswerEs: 'Sí. Chile reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley 19.799 (2002), Artículo 3. Las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + cédula, y una pista de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
  {
    slug: 'peru',
    name: 'Peru',
    nameEs: 'Perú',
    code: 'PE',
    flag: '🇵🇪',
    lawBadgeEn: 'Law 27269',
    lawBadgeEs: 'Ley 27269',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'Law 27269 — Law of Digital Signatures and Certificates (2000) — recognizes electronic and digital signatures with the same legal validity and effect as a handwritten signature.',
        factEs: 'La Ley 27269 — Ley de Firmas y Certificados Digitales (2000) — reconoce a la firma electrónica y digital la misma validez y eficacia jurídica que la firma manuscrita.',
      },
      {
        titleEn: 'Civil Code', titleEs: 'Código Civil',
        factEn: 'Article 141 of the Peruvian Civil Code confirms that a declaration of will may be expressed through any direct means, expressly including electronic means.',
        factEs: 'El Artículo 141 del Código Civil peruano confirma que la manifestación de voluntad puede expresarse por cualquier medio directo, incluyendo expresamente los medios electrónicos.',
      },
      {
        titleEn: 'Regulation', titleEs: 'Reglamento',
        factEn: 'Supreme Decree 052-2008-PCM (amended by DS 026-2016-PCM) regulates Law 27269 and the Official Electronic Signature Infrastructure (IOFE) overseen by INDECOPI.',
        factEs: 'El Decreto Supremo 052-2008-PCM (modificado por el DS 026-2016-PCM) reglamenta la Ley 27269 y la Infraestructura Oficial de Firma Electrónica (IOFE), supervisada por INDECOPI.',
      },
      {
        titleEn: 'Simple electronic signature', titleEs: 'Firma electrónica simple',
        factEn: 'As in most of the region, a simple electronic signature (not a certified digital signature) is enough for private contracts like NDAs, leases and service agreements to be enforceable in Peru.',
        factEs: 'Como en la mayoría de la región, una firma electrónica simple (no una firma digital certificada) es suficiente para que contratos privados como NDA, arrendamientos y acuerdos de servicio sean exigibles en Perú.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Peru?',
    faqEs: '¿Las firmas electrónicas son legales en Perú?',
    faqAnswerEn: 'Yes. Peru recognizes electronic signatures as legally binding under Law 27269 (2000) and Article 141 of the Civil Code. Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail to meet evidentiary standards.',
    faqAnswerEs: 'Sí. Perú reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley 27269 (2000) y el Artículo 141 del Código Civil. Las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + DNI, y una pista de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
  {
    slug: 'argentina',
    name: 'Argentina',
    nameEs: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    lawBadgeEn: 'Law 25.506',
    lawBadgeEs: 'Ley 25.506',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'Law 25.506 on Digital Signature (2001) recognizes the use of electronic and digital signatures and their legal effect throughout Argentina.',
        factEs: 'La Ley 25.506 de Firma Digital (2001) reconoce el empleo de la firma electrónica y la firma digital y su eficacia jurídica en todo el territorio argentino.',
      },
      {
        titleEn: 'Civil and Commercial Code', titleEs: 'Código Civil y Comercial',
        factEn: 'Articles 286–288 of the Civil and Commercial Code (Law 26.994) expressly recognize electronic support as a valid means of expressing consent, and state that the signature requirement in electronic instruments is satisfied by a digital signature.',
        factEs: 'Los Artículos 286 a 288 del Código Civil y Comercial (Ley 26.994) reconocen expresamente el soporte electrónico como medio válido de expresión de la voluntad, y establecen que el requisito de la firma en instrumentos electrónicos queda satisfecho con una firma digital.',
      },
      {
        titleEn: 'Electronic vs. digital signature', titleEs: 'Firma electrónica vs. digital',
        factEn: 'Argentine law distinguishes an electronic signature (authorship presumed by whoever relies on it) from a certified digital signature (authorship and integrity presumed by law) — Codec Document\'s identity verification and audit trail strengthen the evidentiary weight of the electronic signature.',
        factEs: 'La ley argentina distingue la firma electrónica (presunción de autoría a cargo de quien la invoca) de la firma digital certificada (presunción de autoría e integridad por ley) — la verificación de identidad y la pista de auditoría de Codec Document refuerzan el peso probatorio de la firma electrónica.',
      },
      {
        titleEn: 'Admissible as evidence', titleEs: 'Admisible como prueba',
        factEn: 'Electronic documents signed under Law 25.506 are admissible as evidence in Argentine courts, with the same functional-equivalence principle used across the region.',
        factEs: 'Los documentos electrónicos firmados bajo la Ley 25.506 son admisibles como prueba en los tribunales argentinos, bajo el mismo principio de equivalencia funcional utilizado en toda la región.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Argentina?',
    faqEs: '¿Las firmas electrónicas son legales en Argentina?',
    faqAnswerEn: 'Yes. Argentina recognizes electronic signatures as legally binding under Law 25.506 and Articles 286–288 of the Civil and Commercial Code. Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail to meet evidentiary standards.',
    faqAnswerEs: 'Sí. Argentina reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley 25.506 y los Artículos 286 a 288 del Código Civil y Comercial. Las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + DNI, y una pista de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
  {
    slug: 'ecuador',
    name: 'Ecuador',
    nameEs: 'Ecuador',
    code: 'EC',
    flag: '🇪🇨',
    lawBadgeEn: 'Law 67',
    lawBadgeEs: 'Ley 67',
    highlights: [
      {
        titleEn: 'Legal validity', titleEs: 'Validez jurídica',
        factEn: 'Law 67 — Law on Electronic Commerce, Electronic Signatures and Data Messages (2002) — grants an electronic signature the same validity and legal effects as a handwritten signature.',
        factEs: 'La Ley 67 — Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos (2002) — otorga a la firma electrónica igual validez y los mismos efectos jurídicos que una firma manuscrita.',
      },
      {
        titleEn: 'Data messages', titleEs: 'Mensajes de datos',
        factEn: 'Article 14 of Law 67 states that data messages have the same legal value as written documents, establishing the functional-equivalence principle in Ecuadorian law.',
        factEs: 'El Artículo 14 de la Ley 67 establece que los mensajes de datos tendrán igual valor jurídico que los documentos escritos, consagrando el principio de equivalencia funcional en la legislación ecuatoriana.',
      },
      {
        titleEn: 'General regulation', titleEs: 'Reglamento general',
        factEn: 'The General Regulation to Law 67 develops the technical requirements for electronic signatures and data message integrity referenced by the statute.',
        factEs: 'El Reglamento General a la Ley 67 desarrolla los requisitos técnicos de la firma electrónica y de integridad de los mensajes de datos a los que remite la ley.',
      },
      {
        titleEn: 'Admissible as evidence', titleEs: 'Admisible como prueba',
        factEn: 'The General Organic Code of Procedures (COGEP) recognizes electronic documents as admissible evidence in Ecuadorian courts.',
        factEs: 'El Código Orgánico General de Procesos (COGEP) reconoce los documentos electrónicos como medios de prueba admisibles en los tribunales ecuatorianos.',
      },
    ],
    faqEn: 'Are electronic signatures legal in Ecuador?',
    faqEs: '¿Las firmas electrónicas son legales en Ecuador?',
    faqAnswerEn: 'Yes. Ecuador recognizes electronic signatures as legally binding under Law 67 (2002), Article 14. Codec Document\'s signatures include SHA-256 hashing, IP logging, selfie + ID identity verification, and a timestamped audit trail to meet evidentiary standards.',
    faqAnswerEs: 'Sí. Ecuador reconoce las firmas electrónicas como legalmente vinculantes bajo la Ley 67 (2002), Artículo 14. Las firmas de Codec Document incluyen hash SHA-256, registro de IP, verificación de identidad con selfie + cédula, y una pista de auditoría con marca de tiempo para cumplir con estándares probatorios.',
  },
];

// Shared general FAQ across all 6 country pages — deliberately does NOT
// mention ESIGN Act / UETA (US-only) or invented numbers; pricing is
// described in general terms since PricingSection already shows the
// real live figures elsewhere and duplicating them here risks drifting
// out of sync.
export const LATAM_GENERAL_FAQ = [
  {
    qEn: 'Is Codec Document free to use in Latin America?',
    qEs: '¿Es gratis usar Codec Document en Latinoamérica?',
    aEn: 'Yes — the same free plan and premium plans available in the United States apply everywhere Codec Document operates, including Latin America. The free plan includes a limited number of documents and signatures on a rolling basis, no credit card required; premium plans unlock unlimited documents and signatures.',
    aEs: 'Sí — el mismo plan gratuito y los mismos planes premium disponibles en Estados Unidos aplican en toda la plataforma, incluyendo Latinoamérica. El plan gratuito incluye una cantidad limitada de documentos y firmas cada cierto tiempo, sin tarjeta de crédito; los planes premium desbloquean documentos y firmas ilimitadas.',
  },
  {
    qEn: 'Do I need a certified digital signature to use Codec Document?',
    qEs: '¿Necesito una firma digital certificada para usar Codec Document?',
    aEn: 'No. In every country Codec Document covers, a simple electronic signature — backed by identity verification (selfie + ID) and a cryptographic audit trail — is legally sufficient for private contracts like NDAs, leases, service agreements and promissory notes. A certified/advanced digital signature is generally only required for specific regulated government filings.',
    aEs: 'No. En todos los países que cubre Codec Document, una firma electrónica simple — respaldada por verificación de identidad (selfie + identificación) y una pista de auditoría criptográfica — es legalmente suficiente para contratos privados como NDA, arrendamientos, acuerdos de servicio y pagarés. Una firma digital certificada/avanzada generalmente solo se exige para trámites gubernamentales regulados específicos.',
  },
  {
    qEn: 'What is the SHA-256 audit trail and why does it matter?',
    qEs: '¿Qué es la pista de auditoría SHA-256 y por qué importa?',
    aEn: 'Every document signed on Codec Document receives a SHA-256 cryptographic fingerprint — a unique hash that proves the document has not been altered since signing — plus IP address, timestamp, and identity verification evidence embedded in the final PDF. This creates the same functional-equivalence evidentiary trail recognized across every country\'s electronic-signature law.',
    aEs: 'Cada documento firmado en Codec Document recibe una huella criptográfica SHA-256 — un hash único que prueba que el documento no ha sido alterado desde su firma — más evidencia de dirección IP, marca de tiempo y verificación de identidad incrustada en el PDF final. Esto crea la misma pista probatoria de equivalencia funcional reconocida por la ley de firma electrónica de cada país.',
  },
  {
    qEn: 'Can I sign a document from my phone?',
    qEs: '¿Puedo firmar un documento desde mi celular?',
    aEn: 'Yes. Codec Document works entirely from a mobile browser — draw your signature, capture a selfie and ID photo, and download the signed PDF, no app install required.',
    aEs: 'Sí. Codec Document funciona completamente desde el navegador del celular — dibuja tu firma, captura una selfie y foto de tu identificación, y descarga el PDF firmado, sin necesidad de instalar ninguna app.',
  },
];

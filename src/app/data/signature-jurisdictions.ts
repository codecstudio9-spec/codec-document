// Jurisdiction-aware legal text for the ACTUAL signing flow — not the
// marketing landing pages (see latam-signature-seo-content.ts for
// those), but the real consent screen a signer reads before signing,
// and the certification/compliance text permanently embedded in the
// final signed PDF. Both of those used to hardcode US law (Federal
// E-SIGN Act + UETA) for every signer regardless of where they actually
// are — accurate for a US signer, but legally inaccurate (and bad for
// credibility) for a signer in Colombia, Mexico, Chile, Peru, Argentina
// or Ecuador, whose signature is actually governed by a different,
// specific local statute.
//
// US is the DEFAULT_JURISDICTION and its text below is byte-identical
// to what was previously hardcoded everywhere — every call site that
// doesn't (yet) detect/pass a jurisdiction keeps behaving exactly as
// before. Detected LatAm signers get the correct local citation instead.

export interface SignatureJurisdiction {
  countryCode: string;
  /** Lowercase full-name variants this jurisdiction matches against,
   * for the (less common) case where only a country NAME is available
   * (e.g. audit_log.country) instead of an ISO code. */
  countryNames: string[];
  badgeEn: string; badgeEs: string; // short chip label, e.g. "E-SIGN & UETA" / "Ley 527"
  certTitleEn: string; certTitleEs: string; // PDF compliance-section heading
  certBodyEn: string; certBodyEs: string;   // PDF compliance paragraph
  identityDisclaimerEn: string; identityDisclaimerEs: string; // biometric ID page disclaimer
  complianceFrameworkEn: string; complianceFrameworkEs: string; // short summary-table value
  consentTitleEn: string; consentTitleEs: string; // pre-signing consent screen heading
  consentBodyEn: string; consentBodyEs: string;   // pre-signing consent screen paragraph
}

const US: SignatureJurisdiction = {
  countryCode: 'US',
  countryNames: ['united states', 'usa', 'estados unidos'],
  badgeEn: 'E-SIGN & UETA', badgeEs: 'E-SIGN & UETA',
  certTitleEn: 'U.S. ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (EE. UU.)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of the Federal E-SIGN Act (15 U.S.C. Ch. 96) and the Uniform Electronic Transactions Act (UETA). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electronicamente segun la Ley Federal E-SIGN (15 U.S.C. Ch. 96) y la UETA. Las firmas criptograficas, marcas de tiempo y registros de auditoria de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under the federal E-SIGN Act (15 U.S.C. § 7001) and UETA.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo la Ley Federal E-SIGN (15 U.S.C. § 7001) y la UETA.',
  complianceFrameworkEn: 'E-SIGN Act (15 U.S.C. § 7001) · UETA · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley E-SIGN (15 U.S.C. § 7001) · UETA · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (E-SIGN Act)',
  consentTitleEs: 'Consentimiento de Firma Electronica (ESIGN Act)',
  consentBodyEn: 'In accordance with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001) and the Uniform Electronic Transactions Act (UETA), you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley de Firmas Electronicas en el Comercio Global y Nacional (ESIGN Act, 15 U.S.C. SS 7001) y la Ley Uniforme de Transacciones Electronicas (UETA), usted da su consentimiento expreso para usar firmas electronicas en este documento legal. Su firma electronica tiene exactamente la misma validez juridica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningun costo.',
};

const COLOMBIA: SignatureJurisdiction = {
  countryCode: 'CO',
  countryNames: ['colombia'],
  badgeEn: 'Law 527 of 1999', badgeEs: 'Ley 527 de 1999',
  certTitleEn: 'COLOMBIAN ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (COLOMBIA)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of Law 527 of 1999 and Decree 2364 of 2012, upheld by the Constitutional Court (Ruling C-662 of 2000). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012, ratificados por la Corte Constitucional (Sentencia C-662 de 2000). Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes admissible documentary evidence of signer identity under Law 527 of 1999 and Article 247 of the General Code of Procedure (Law 1564 of 2012).',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye prueba documental admisible de la identidad del firmante bajo la Ley 527 de 1999 y el Artículo 247 del Código General del Proceso (Ley 1564 de 2012).',
  complianceFrameworkEn: 'Law 527 of 1999 · Decree 2364 of 2012 · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley 527 de 1999 · Decreto 2364 de 2012 · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Law 527 of 1999)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Ley 527 de 1999)',
  consentBodyEn: 'In accordance with Law 527 of 1999 and Decree 2364 of 2012, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper, under the functional-equivalence principle upheld by the Constitutional Court (Ruling C-662 of 2000). You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley 527 de 1999 y al Decreto 2364 de 2012, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel, bajo el principio de equivalencia funcional ratificado por la Corte Constitucional (Sentencia C-662 de 2000). Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

const MEXICO: SignatureJurisdiction = {
  countryCode: 'MX',
  countryNames: ['mexico', 'méxico'],
  badgeEn: 'Código de Comercio', badgeEs: 'Código de Comercio',
  certTitleEn: 'MEXICAN ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (MÉXICO)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of the Código de Comercio (Arts. 89–114) and the Federal Civil Code (Arts. 1803, 1834-Bis). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties, per NOM-151-SCFI-2016.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme al Código de Comercio (Arts. 89 a 114) y al Código Civil Federal (Arts. 1803, 1834-Bis). Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes, conforme a la NOM-151-SCFI-2016.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under the Código de Comercio and NOM-151-SCFI-2016.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo el Código de Comercio y la NOM-151-SCFI-2016.',
  complianceFrameworkEn: 'Código de Comercio (Arts. 89–114) · NOM-151-SCFI-2016 · ISO/IEC 27001',
  complianceFrameworkEs: 'Código de Comercio (Arts. 89 a 114) · NOM-151-SCFI-2016 · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Código de Comercio)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Código de Comercio)',
  consentBodyEn: 'In accordance with the Código de Comercio (Arts. 89–114) and the Federal Civil Code, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper for private contracts. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme al Código de Comercio (Arts. 89 a 114) y al Código Civil Federal, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel para contratos privados. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

const CHILE: SignatureJurisdiction = {
  countryCode: 'CL',
  countryNames: ['chile'],
  badgeEn: 'Law 19.799', badgeEs: 'Ley 19.799',
  certTitleEn: 'CHILEAN ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (CHILE)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of Law 19.799 on Electronic Documents, Electronic Signatures and Certification Services (Art. 3). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme a la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma (Art. 3). Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under Law 19.799.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo la Ley 19.799.',
  complianceFrameworkEn: 'Law 19.799, Art. 3 · Supreme Decree 181/2002 · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley 19.799, Art. 3 · Decreto Supremo 181/2002 · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Law 19.799)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Ley 19.799)',
  consentBodyEn: 'In accordance with Law 19.799 on Electronic Documents, Electronic Signatures and Certification Services, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de dicha Firma, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

const PERU: SignatureJurisdiction = {
  countryCode: 'PE',
  countryNames: ['peru', 'perú'],
  badgeEn: 'Law 27269', badgeEs: 'Ley 27269',
  certTitleEn: 'PERUVIAN ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (PERÚ)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of Law 27269 — Law of Digital Signatures and Certificates — and Article 141 of the Civil Code. The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme a la Ley 27269 — Ley de Firmas y Certificados Digitales — y al Artículo 141 del Código Civil. Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under Law 27269.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo la Ley 27269.',
  complianceFrameworkEn: 'Law 27269 · Civil Code Art. 141 · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley 27269 · Código Civil Art. 141 · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Law 27269)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Ley 27269)',
  consentBodyEn: 'In accordance with Law 27269 — Law of Digital Signatures and Certificates — and Article 141 of the Civil Code, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley 27269 — Ley de Firmas y Certificados Digitales — y al Artículo 141 del Código Civil, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

const ARGENTINA: SignatureJurisdiction = {
  countryCode: 'AR',
  countryNames: ['argentina'],
  badgeEn: 'Law 25.506', badgeEs: 'Ley 25.506',
  certTitleEn: 'ARGENTINE ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (ARGENTINA)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of Law 25.506 on Digital Signature and Articles 286–288 of the Civil and Commercial Code. The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme a la Ley 25.506 de Firma Digital y a los Artículos 286 a 288 del Código Civil y Comercial. Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under Law 25.506 and the Civil and Commercial Code.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo la Ley 25.506 y el Código Civil y Comercial.',
  complianceFrameworkEn: 'Law 25.506 · Civil and Commercial Code Arts. 286–288 · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley 25.506 · Código Civil y Comercial Arts. 286 a 288 · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Law 25.506)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Ley 25.506)',
  consentBodyEn: 'In accordance with Law 25.506 on Digital Signature and Articles 286–288 of the Civil and Commercial Code, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley 25.506 de Firma Digital y a los Artículos 286 a 288 del Código Civil y Comercial, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

const ECUADOR: SignatureJurisdiction = {
  countryCode: 'EC',
  countryNames: ['ecuador'],
  badgeEn: 'Law 67', badgeEs: 'Ley 67',
  certTitleEn: 'ECUADORIAN ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA (ECUADOR)',
  certBodyEn: 'This document is electronically signed and certified under the provisions of Law 67 — Law on Electronic Commerce, Electronic Signatures and Data Messages (Art. 14). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente conforme a la Ley 67 de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos (Art. 14). Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under Law 67 and the General Organic Code of Procedures (COGEP).',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica. Este registro constituye evidencia legalmente admisible de la identidad del firmante bajo la Ley 67 y el Código Orgánico General de Procesos (COGEP).',
  complianceFrameworkEn: 'Law 67, Art. 14 · COGEP · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley 67, Art. 14 · COGEP · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent (Law 67)',
  consentTitleEs: 'Consentimiento de Firma Electrónica (Ley 67)',
  consentBodyEn: 'In accordance with Law 67 on Electronic Commerce, Electronic Signatures and Data Messages, you give your express consent to use electronic signatures on this legal document. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Conforme a la Ley 67 de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos, usted da su consentimiento expreso para usar firmas electrónicas en este documento legal. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

/** Used only when a country is detected but isn't one of the 7 above —
 * cites the international model law most local statutes are based on
 * instead of guessing/misattributing a specific country's law. */
const GENERIC: SignatureJurisdiction = {
  countryCode: 'GENERIC',
  countryNames: [],
  badgeEn: 'Electronic Signature Compliant', badgeEs: 'Firma Electrónica Válida',
  certTitleEn: 'ELECTRONIC SIGNATURE LEGAL COMPLIANCE', certTitleEs: 'CUMPLIMIENTO LEGAL DE FIRMA ELECTRÓNICA',
  certBodyEn: 'This document is electronically signed and certified following the functional-equivalence principle for electronic signatures recognized under the UNCITRAL Model Law on Electronic Commerce, on which most national electronic-signature statutes are based. The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.',
  certBodyEs: 'Este documento fue firmado y certificado electrónicamente siguiendo el principio de equivalencia funcional para firmas electrónicas reconocido por la Ley Modelo de la CNUDMI sobre Comercio Electrónico, en la cual se basan la mayoría de las leyes nacionales de firma electrónica. Las firmas criptográficas, marcas de tiempo y registros de auditoría de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.',
  identityDisclaimerEn: 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature, providing documentary evidence of signer identity.',
  identityDisclaimerEs: 'Las siguientes imágenes biométricas y metadatos fueron capturados por el firmante en el momento exacto de ejecutar esta firma electrónica, aportando evidencia documental de la identidad del firmante.',
  complianceFrameworkEn: 'UNCITRAL Model Law on Electronic Commerce · ISO/IEC 27001',
  complianceFrameworkEs: 'Ley Modelo CNUDMI sobre Comercio Electrónico · ISO/IEC 27001',
  consentTitleEn: 'Electronic Signature Consent',
  consentTitleEs: 'Consentimiento de Firma Electrónica',
  consentBodyEn: 'You give your express consent to use electronic signatures on this legal document, under the functional-equivalence principle recognized by most national electronic-signature laws. Your electronic signature has exactly the same legal validity as a handwritten signature on paper. You have the right to request a printed copy of this document at any time. You may revoke this consent before signing at no cost.',
  consentBodyEs: 'Usted da su consentimiento expreso para usar firmas electrónicas en este documento legal, bajo el principio de equivalencia funcional reconocido por la mayoría de las leyes nacionales de firma electrónica. Su firma electrónica tiene exactamente la misma validez jurídica que una firma manuscrita en papel. Tiene derecho a solicitar una copia impresa de este documento en cualquier momento. Puede revocar este consentimiento antes de firmar sin ningún costo.',
};

export const SIGNATURE_JURISDICTIONS: SignatureJurisdiction[] = [US, COLOMBIA, MEXICO, CHILE, PERU, ARGENTINA, ECUADOR];

/** Default/fallback — matches every previously-hardcoded string exactly,
 * so any caller that doesn't detect/pass a jurisdiction keeps behaving
 * exactly as before this change. */
export const DEFAULT_JURISDICTION = US;

/**
 * Resolves a jurisdiction from either an ISO 3166-1 alpha-2 code (e.g.
 * from detectSignerCountryCode() in lib/geo.ts) or a full country name
 * (e.g. from an existing audit_log.country string). Falls back to
 * DEFAULT_JURISDICTION (US) for null/undefined/unrecognized input —
 * never GENERIC on a lookup failure, since "no signal" should mean
 * "behave as before", not "show the generic disclaimer".  GENERIC is
 * only used for a country we can positively detect but haven't written
 * specific legal content for yet.
 */
export function resolveJurisdiction(input: string | null | undefined): SignatureJurisdiction {
  if (!input) return DEFAULT_JURISDICTION;
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 2) {
    const byCode = SIGNATURE_JURISDICTIONS.find((j) => j.countryCode.toLowerCase() === normalized);
    if (byCode) return byCode;
  }
  const byName = SIGNATURE_JURISDICTIONS.find((j) => j.countryNames.includes(normalized));
  if (byName) return byName;
  // Recognized country code shape but not one of the 7 above, and not
  // empty — a real detection result for an uncovered country.
  return normalized.length === 2 && /^[a-z]{2}$/.test(normalized) ? GENERIC : DEFAULT_JURISDICTION;
}

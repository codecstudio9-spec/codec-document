export type SignerRoleLanguage = 'es' | 'en';

interface SignerRoleSet {
  primary: Record<SignerRoleLanguage, string>;
  secondary: Record<SignerRoleLanguage, string>;
  tertiary?: Record<SignerRoleLanguage, string>;
}

const SIGNER_ROLE_MAP: Record<string, SignerRoleSet> = {
  'residential-lease': {
    primary: { es: 'Arrendador', en: 'Landlord' },
    secondary: { es: 'Arrendatario', en: 'Tenant' },
  },
  nda: {
    primary: { es: 'Parte Reveladora', en: 'Disclosing Party' },
    secondary: { es: 'Parte Receptora', en: 'Receiving Party' },
  },
  'independent-contractor': {
    primary: { es: 'Contratante', en: 'Hiring Party' },
    secondary: { es: 'Contratista', en: 'Contractor' },
  },
  'bill-of-sale-vehicle': {
    primary: { es: 'Vendedor', en: 'Seller' },
    secondary: { es: 'Comprador', en: 'Buyer' },
  },
  'service-agreement': {
    primary: { es: 'Prestador del Servicio', en: 'Service Provider' },
    secondary: { es: 'Cliente', en: 'Client' },
    tertiary: { es: 'Beneficiario', en: 'Beneficiary' },
  },
  'promissory-note': {
    primary: { es: 'Acreedor', en: 'Creditor' },
    secondary: { es: 'Deudor', en: 'Debtor' },
    tertiary: { es: 'Otorgante', en: 'Grantor' },
  },
};

export function getGenericSignerRoles(language: SignerRoleLanguage = 'es') {
  return {
    primary: language === 'es' ? 'Firmante principal' : 'Primary signer',
    secondary: language === 'es' ? 'Segundo firmante' : 'Second signer',
    tertiary: language === 'es' ? 'Firmante adicional' : 'Additional signer',
  };
}

export function inferDocumentTypeHint(value?: string | null): string | null {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return null;

  const aliases: Record<string, string[]> = {
    'residential-lease': ['residential lease', 'residential-lease', 'lease', 'rental lease', 'lease agreement', 'arrendamiento'],
    nda: ['nda', 'non disclosure agreement', 'non-disclosure agreement', 'confidencialidad'],
    'independent-contractor': ['independent contractor', 'independent-contractor', 'contractor agreement', 'contrato independiente'],
    'bill-of-sale-vehicle': ['bill of sale', 'bill-of-sale', 'bill of sale vehicle', 'vehicle bill of sale', 'venta de vehículo'],
    'service-agreement': ['service agreement', 'service-agreement', 'servicio', 'services agreement'],
    'promissory-note': ['promissory note', 'promissory-note', 'nota promisoria'],
  };

  for (const [key, variants] of Object.entries(aliases)) {
    if (variants.some((variant) => normalized.includes(variant))) return key;
  }

  return null;
}

export function getDocumentSignerRoles(documentType?: string | null, language: SignerRoleLanguage = 'es') {
  const normalized = String(documentType || '').toLowerCase().trim();
  const inferred = inferDocumentTypeHint(normalized);
  const mapped = SIGNER_ROLE_MAP[inferred || normalized];

  if (!mapped) return getGenericSignerRoles(language);

  return {
    primary: mapped.primary[language],
    secondary: mapped.secondary[language],
    tertiary: mapped.tertiary?.[language],
  };
}

export function getSignerRoleLabel(
  documentType: string | null | undefined,
  signerIndex: number,
  language: SignerRoleLanguage = 'es',
  fallback?: string,
) {
  const roles = getDocumentSignerRoles(documentType, language);

  if (signerIndex === 0) return roles.primary || fallback || getGenericSignerRoles(language).primary;
  if (signerIndex === 1) return roles.secondary || fallback || getGenericSignerRoles(language).secondary;
  return roles.tertiary || fallback || getGenericSignerRoles(language).tertiary;
}

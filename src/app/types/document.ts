export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  fields: DocumentField[];
  template: string;
}

export interface DocumentField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'number' | 'currency' | 'checkbox';
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface DocumentData {
  [key: string]: string | number | boolean;
}

export interface DocumentBranding {
  enableLogo?: boolean;
  enableLogoWatermark?: boolean;
  logoDataUrl?: string;
  logoPosition?: 'left' | 'right';
  headerText?: string;
  footerText?: string;
  companyLegalName?: string;
  companyAddressLine1?: string;
  companyAddressLine2?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyCountry?: string;
  companyEIN?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}
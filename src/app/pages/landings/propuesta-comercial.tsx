import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('propuesta-comercial')!;

export default function PropuestaComercialLanding() {
  return <QuoteSeoLanding page={page} />;
}

import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('generador-de-cotizaciones')!;

export default function GeneradorDeCotizacionesLanding() {
  return <QuoteSeoLanding page={page} />;
}

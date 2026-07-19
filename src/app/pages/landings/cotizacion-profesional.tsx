import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('cotizacion-profesional')!;

export default function CotizacionProfesionalLanding() {
  return <QuoteSeoLanding page={page} />;
}

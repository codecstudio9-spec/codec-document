import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('crear-cotizacion')!;

export default function CrearCotizacionLanding() {
  return <QuoteSeoLanding page={page} />;
}

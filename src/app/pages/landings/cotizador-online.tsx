import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('cotizador-online')!;

export default function CotizadorOnlineLanding() {
  return <QuoteSeoLanding page={page} />;
}

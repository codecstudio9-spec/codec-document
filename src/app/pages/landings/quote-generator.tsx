import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('quote-generator')!;

export default function QuoteGeneratorLanding() {
  return <QuoteSeoLanding page={page} />;
}

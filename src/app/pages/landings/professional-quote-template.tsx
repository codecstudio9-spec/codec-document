import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('professional-quote-template')!;

export default function ProfessionalQuoteTemplateLanding() {
  return <QuoteSeoLanding page={page} />;
}

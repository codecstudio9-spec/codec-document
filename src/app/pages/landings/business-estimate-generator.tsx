import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('business-estimate-generator')!;

export default function BusinessEstimateGeneratorLanding() {
  return <QuoteSeoLanding page={page} />;
}

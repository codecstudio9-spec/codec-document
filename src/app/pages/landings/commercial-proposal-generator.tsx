import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('commercial-proposal-generator')!;

export default function CommercialProposalGeneratorLanding() {
  return <QuoteSeoLanding page={page} />;
}

import { QuoteSeoLanding } from '../../components/landing/QuoteSeoLanding';
import { getQuoteSeoPage } from '../../data/quote-seo-content';

const page = getQuoteSeoPage('proposal-generator')!;

export default function ProposalGeneratorLanding() {
  return <QuoteSeoLanding page={page} />;
}

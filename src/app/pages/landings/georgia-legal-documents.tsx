import { StateLegalDocumentsLanding } from '../../components/landing/StateLegalDocumentsLanding';
import { STATE_SEO_CONFIGS } from '../../data/state-seo-content';

const state = STATE_SEO_CONFIGS.find((s) => s.slug === 'georgia')!;

export default function GeorgiaLegalDocuments() {
  return <StateLegalDocumentsLanding state={state} />;
}

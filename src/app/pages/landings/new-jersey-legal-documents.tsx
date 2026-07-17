import { StateLegalDocumentsLanding } from '../../components/landing/StateLegalDocumentsLanding';
import { STATE_SEO_CONFIGS } from '../../data/state-seo-content';

const state = STATE_SEO_CONFIGS.find((s) => s.slug === 'new-jersey')!;

export default function NewJerseyLegalDocuments() {
  return <StateLegalDocumentsLanding state={state} />;
}

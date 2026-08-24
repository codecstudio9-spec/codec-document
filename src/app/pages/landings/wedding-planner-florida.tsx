import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'wedding-planner' && d.stateSlug === 'florida')!;

export default function WeddingPlannerFlorida() {
  return <DocTypeStateLanding data={data} />;
}

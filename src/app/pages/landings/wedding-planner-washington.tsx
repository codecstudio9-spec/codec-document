import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'wedding-planner' && d.stateSlug === 'washington')!;

export default function WeddingPlannerWashington() {
  return <DocTypeStateLanding data={data} />;
}

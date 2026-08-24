import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'wedding-planner' && d.stateSlug === 'new-york')!;

export default function WeddingPlannerNewYork() {
  return <DocTypeStateLanding data={data} />;
}

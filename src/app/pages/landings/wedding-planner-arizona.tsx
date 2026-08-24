import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'wedding-planner' && d.stateSlug === 'arizona')!;

export default function WeddingPlannerArizona() {
  return <DocTypeStateLanding data={data} />;
}

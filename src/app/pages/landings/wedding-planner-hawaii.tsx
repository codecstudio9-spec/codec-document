import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'wedding-planner' && d.stateSlug === 'hawaii')!;

export default function WeddingPlannerHawaii() {
  return <DocTypeStateLanding data={data} />;
}

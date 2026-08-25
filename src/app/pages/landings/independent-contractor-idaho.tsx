import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'independent-contractor' && d.stateSlug === 'idaho')!;

export default function IndependentContractorIdaho() {
  return <DocTypeStateLanding data={data} />;
}

import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'nda' && d.stateSlug === 'new-hampshire')!;

export default function NdaNewHampshire() {
  return <DocTypeStateLanding data={data} />;
}

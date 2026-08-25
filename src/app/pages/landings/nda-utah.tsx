import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'nda' && d.stateSlug === 'utah')!;

export default function NdaUtah() {
  return <DocTypeStateLanding data={data} />;
}

import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'promissory-note' && d.stateSlug === 'mississippi')!;

export default function PromissoryNoteMississippi() {
  return <DocTypeStateLanding data={data} />;
}

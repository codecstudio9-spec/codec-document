import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'promissory-note' && d.stateSlug === 'michigan')!;

export default function PromissoryNoteMichigan() {
  return <DocTypeStateLanding data={data} />;
}

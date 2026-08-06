import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'nda' && d.stateSlug === 'alabama')!;

export default function NdaAlabama() {
  return <DocTypeStateLanding data={data} />;
}

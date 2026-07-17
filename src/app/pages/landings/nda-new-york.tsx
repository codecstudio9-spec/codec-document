import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'nda' && d.stateSlug === 'new-york')!;

export default function NdaNewYork() {
  return <DocTypeStateLanding data={data} />;
}

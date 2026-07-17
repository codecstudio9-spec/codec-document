import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'nda' && d.stateSlug === 'north-carolina')!;

export default function NdaNorthCarolina() {
  return <DocTypeStateLanding data={data} />;
}

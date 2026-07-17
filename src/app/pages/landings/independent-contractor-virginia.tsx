import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'independent-contractor' && d.stateSlug === 'virginia')!;

export default function IndependentContractorVirginia() {
  return <DocTypeStateLanding data={data} />;
}

import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'independent-contractor' && d.stateSlug === 'new-jersey')!;

export default function IndependentContractorNewJersey() {
  return <DocTypeStateLanding data={data} />;
}

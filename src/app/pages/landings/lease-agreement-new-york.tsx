import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'lease-agreement' && d.stateSlug === 'new-york')!;

export default function LeaseAgreementNewYork() {
  return <DocTypeStateLanding data={data} />;
}

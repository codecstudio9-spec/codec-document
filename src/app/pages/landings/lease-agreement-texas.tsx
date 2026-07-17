import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'lease-agreement' && d.stateSlug === 'texas')!;

export default function LeaseAgreementTexas() {
  return <DocTypeStateLanding data={data} />;
}

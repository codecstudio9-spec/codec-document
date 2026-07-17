import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'service-agreement' && d.stateSlug === 'michigan')!;

export default function ServiceAgreementMichigan() {
  return <DocTypeStateLanding data={data} />;
}

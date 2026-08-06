import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'service-agreement' && d.stateSlug === 'south-carolina')!;

export default function ServiceAgreementSouthCarolina() {
  return <DocTypeStateLanding data={data} />;
}

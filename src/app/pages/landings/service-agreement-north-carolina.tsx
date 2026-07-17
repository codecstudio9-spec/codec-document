import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'service-agreement' && d.stateSlug === 'north-carolina')!;

export default function ServiceAgreementNorthCarolina() {
  return <DocTypeStateLanding data={data} />;
}

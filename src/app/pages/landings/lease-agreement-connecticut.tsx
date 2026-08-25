import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'lease-agreement' && d.stateSlug === 'connecticut')!;

export default function LeaseAgreementConnecticut() {
  return <DocTypeStateLanding data={data} />;
}

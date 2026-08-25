import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'service-agreement' && d.stateSlug === 'louisiana')!;

export default function ServiceAgreementLouisiana() {
  return <DocTypeStateLanding data={data} />;
}

import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'vehicle-bill-of-sale' && d.stateSlug === 'florida')!;

export default function VehicleBillOfSaleFlorida() {
  return <DocTypeStateLanding data={data} />;
}

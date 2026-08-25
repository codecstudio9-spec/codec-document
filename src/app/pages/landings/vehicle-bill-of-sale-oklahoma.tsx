import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { STATE_SPOTLIGHT_CONFIGS } from '../../data/state-spotlight-seo-content';

const data = STATE_SPOTLIGHT_CONFIGS.find((d) => d.docType === 'vehicle-bill-of-sale' && d.stateSlug === 'oklahoma')!;

export default function VehicleBillOfSaleOklahoma() {
  return <DocTypeStateLanding data={data} />;
}

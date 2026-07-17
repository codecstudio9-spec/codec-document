import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'vehicle-bill-of-sale' && d.stateSlug === 'ohio')!;

export default function VehicleBillOfSaleOhio() {
  return <DocTypeStateLanding data={data} />;
}

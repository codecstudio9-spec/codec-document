import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'vehicle-bill-of-sale' && d.stateSlug === 'georgia')!;

export default function VehicleBillOfSaleGeorgia() {
  return <DocTypeStateLanding data={data} />;
}

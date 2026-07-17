import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'vehicle-bill-of-sale' && d.stateSlug === 'north-carolina')!;

export default function VehicleBillOfSaleNorthCarolina() {
  return <DocTypeStateLanding data={data} />;
}

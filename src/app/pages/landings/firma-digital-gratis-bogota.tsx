import { COFreeSignatureLanding } from '../../components/landing/COFreeSignatureLanding';
import { CO_FREE_SIGNATURE_CITIES } from '../../data/co-free-signature-city-content';

const city = CO_FREE_SIGNATURE_CITIES.find((c) => c.slug === 'bogota')!;

export default function FirmaDigitalGratisBogota() {
  return <COFreeSignatureLanding city={city} />;
}

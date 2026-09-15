import { COFreeSignatureLanding } from '../../components/landing/COFreeSignatureLanding';
import { CO_FREE_SIGNATURE_CITIES } from '../../data/co-free-signature-city-content';

const city = CO_FREE_SIGNATURE_CITIES.find((c) => c.slug === 'barranquilla')!;

export default function FirmaDigitalGratisBarranquilla() {
  return <COFreeSignatureLanding city={city} />;
}

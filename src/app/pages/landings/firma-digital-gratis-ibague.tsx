import { COFreeSignatureLanding } from '../../components/landing/COFreeSignatureLanding';
import { CO_FREE_SIGNATURE_CITIES } from '../../data/co-free-signature-city-content';

const city = CO_FREE_SIGNATURE_CITIES.find((c) => c.slug === 'ibague')!;

export default function FirmaDigitalGratisIbague() {
  return <COFreeSignatureLanding city={city} />;
}

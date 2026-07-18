import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'chile')!;

export default function FirmaElectronicaChile() {
  return <CountrySignatureLanding country={country} />;
}

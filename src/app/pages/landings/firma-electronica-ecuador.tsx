import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'ecuador')!;

export default function FirmaElectronicaEcuador() {
  return <CountrySignatureLanding country={country} />;
}

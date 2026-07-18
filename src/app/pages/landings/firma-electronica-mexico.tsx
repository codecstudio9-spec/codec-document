import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'mexico')!;

export default function FirmaElectronicaMexico() {
  return <CountrySignatureLanding country={country} />;
}

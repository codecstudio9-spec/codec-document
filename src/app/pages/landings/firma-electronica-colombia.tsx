import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'colombia')!;

export default function FirmaElectronicaColombia() {
  return <CountrySignatureLanding country={country} />;
}

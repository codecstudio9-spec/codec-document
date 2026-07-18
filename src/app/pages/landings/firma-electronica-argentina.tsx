import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'argentina')!;

export default function FirmaElectronicaArgentina() {
  return <CountrySignatureLanding country={country} />;
}

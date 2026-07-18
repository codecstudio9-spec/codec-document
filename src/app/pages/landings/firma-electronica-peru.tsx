import { CountrySignatureLanding } from '../../components/landing/CountrySignatureLanding';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const country = LATAM_COUNTRIES.find((c) => c.slug === 'peru')!;

export default function FirmaElectronicaPeru() {
  return <CountrySignatureLanding country={country} />;
}

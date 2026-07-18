import { CityLegalDocumentsLanding } from '../../components/landing/CityLegalDocumentsLanding';
import { CITY_SEO_CONFIGS } from '../../data/city-seo-content';

const city = CITY_SEO_CONFIGS.find((c) => c.slug === 'san-jose-california')!;

export default function SanJoseCalifornia() {
  return <CityLegalDocumentsLanding city={city} />;
}

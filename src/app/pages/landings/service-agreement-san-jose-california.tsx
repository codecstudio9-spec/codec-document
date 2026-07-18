import { CityDocTypeLanding } from '../../components/landing/CityDocTypeLanding';
import { getCityDocTypeConfig } from '../../data/city-seo-content';

const data = getCityDocTypeConfig('san-jose-california', 'service-agreement')!;

export default function ServiceAgreementSanJoseCalifornia() {
  return <CityDocTypeLanding city={data.city} docState={data.docState} />;
}

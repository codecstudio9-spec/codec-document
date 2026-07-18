import { CityDocTypeLanding } from '../../components/landing/CityDocTypeLanding';
import { getCityDocTypeConfig } from '../../data/city-seo-content';

const data = getCityDocTypeConfig('san-jose-california', 'independent-contractor')!;

export default function IndependentContractorSanJoseCalifornia() {
  return <CityDocTypeLanding city={data.city} docState={data.docState} />;
}

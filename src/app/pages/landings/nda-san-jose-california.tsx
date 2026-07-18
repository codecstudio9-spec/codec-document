import { CityDocTypeLanding } from '../../components/landing/CityDocTypeLanding';
import { getCityDocTypeConfig } from '../../data/city-seo-content';

const data = getCityDocTypeConfig('san-jose-california', 'nda')!;

export default function NdaSanJoseCalifornia() {
  return <CityDocTypeLanding city={data.city} docState={data.docState} />;
}

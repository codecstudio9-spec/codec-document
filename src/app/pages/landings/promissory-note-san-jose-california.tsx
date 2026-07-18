import { CityDocTypeLanding } from '../../components/landing/CityDocTypeLanding';
import { getCityDocTypeConfig } from '../../data/city-seo-content';

const data = getCityDocTypeConfig('san-jose-california', 'promissory-note')!;

export default function PromissoryNoteSanJoseCalifornia() {
  return <CityDocTypeLanding city={data.city} docState={data.docState} />;
}

import { CityDocTypeLanding } from '../../components/landing/CityDocTypeLanding';
import { getCityDocTypeConfig } from '../../data/city-seo-content';

const data = getCityDocTypeConfig('san-jose-california', 'vehicle-bill-of-sale')!;

export default function VehicleBillOfSaleSanJoseCalifornia() {
  return <CityDocTypeLanding city={data.city} docState={data.docState} />;
}

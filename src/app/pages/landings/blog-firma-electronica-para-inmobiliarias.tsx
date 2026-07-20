import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-electronica-para-inmobiliarias')!;

export default function FirmaElectronicaParaInmobiliarias() {
  return <ArticleLanding data={data} />;
}

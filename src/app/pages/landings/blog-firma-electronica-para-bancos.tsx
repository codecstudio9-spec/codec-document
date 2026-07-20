import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-electronica-para-bancos')!;

export default function FirmaElectronicaParaBancos() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-electronica-gratis-para-pymes')!;

export default function FirmaElectronicaGratisParaPymes() {
  return <ArticleLanding data={data} />;
}

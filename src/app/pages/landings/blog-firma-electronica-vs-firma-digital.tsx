import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-electronica-vs-firma-digital')!;

export default function FirmaElectronicaVsFirmaDigital() {
  return <ArticleLanding data={data} />;
}

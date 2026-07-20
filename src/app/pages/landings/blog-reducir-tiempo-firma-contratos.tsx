import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'reducir-tiempo-firma-contratos')!;

export default function ReducirTiempoFirmaContratos() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'clausula-renovacion-automatica-contratos')!;

export default function ClausulaRenovacionAutomaticaContratos() {
  return <ArticleLanding data={data} />;
}

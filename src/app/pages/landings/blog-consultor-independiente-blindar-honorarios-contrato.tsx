import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'consultor-independiente-blindar-honorarios-contrato')!;

export default function ConsultorIndependienteBlindarHonorariosContrato() {
  return <ArticleLanding data={data} />;
}

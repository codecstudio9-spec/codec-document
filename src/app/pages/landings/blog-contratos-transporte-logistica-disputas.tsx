import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contratos-transporte-logistica-disputas')!;

export default function ContratosTransporteLogisticaDisputas() {
  return <ArticleLanding data={data} />;
}

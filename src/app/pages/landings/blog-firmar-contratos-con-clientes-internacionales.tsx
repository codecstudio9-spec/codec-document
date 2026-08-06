import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firmar-contratos-con-clientes-internacionales')!;

export default function FirmarContratosConClientesInternacionales() {
  return <ArticleLanding data={data} />;
}

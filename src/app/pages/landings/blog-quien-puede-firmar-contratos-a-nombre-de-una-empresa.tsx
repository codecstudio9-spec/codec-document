import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'quien-puede-firmar-contratos-a-nombre-de-una-empresa')!;

export default function QuienPuedeFirmarContratosANombreDeUnaEmpresa() {
  return <ArticleLanding data={data} />;
}

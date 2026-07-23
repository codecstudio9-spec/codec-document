import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contratos-proveedores-restaurantes-sin-papeleo')!;

export default function ContratosProveedoresRestaurantesSinPapeleo() {
  return <ArticleLanding data={data} />;
}

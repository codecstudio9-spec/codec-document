import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contratos-proveedores-ecommerce')!;

export default function ContratosProveedoresEcommerce() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'carta-de-autorizacion-representacion')!;

export default function CartaDeAutorizacionRepresentacion() {
  return <ArticleLanding data={data} />;
}

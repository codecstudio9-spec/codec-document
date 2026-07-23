import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'pagare-prestamo-entre-particulares')!;

export default function PagarePrestamoEntreParticulares() {
  return <ArticleLanding data={data} />;
}

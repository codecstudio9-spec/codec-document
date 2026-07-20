import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'como-evitar-perder-ventas-por-demoras-en-firma')!;

export default function ComoEvitarPerderVentasPorDemorasEnFirma() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'clausula-de-indemnizacion-explicada')!;

export default function ClausulaDeIndemnizacionExplicada() {
  return <ArticleLanding data={data} />;
}

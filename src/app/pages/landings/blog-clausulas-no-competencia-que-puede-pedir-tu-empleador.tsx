import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'clausulas-no-competencia-que-puede-pedir-tu-empleador')!;

export default function ClausulasNoCompetenciaQuePuedePedirTuEmpleador() {
  return <ArticleLanding data={data} />;
}

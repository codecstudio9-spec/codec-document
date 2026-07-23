import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contratos-matricula-escuelas-academias')!;

export default function ContratosMatriculaEscuelasAcademias() {
  return <ArticleLanding data={data} />;
}

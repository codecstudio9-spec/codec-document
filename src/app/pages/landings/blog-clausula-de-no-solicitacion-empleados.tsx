import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'clausula-de-no-solicitacion-empleados')!;

export default function ClausulaDeNoSolicitacionEmpleados() {
  return <ArticleLanding data={data} />;
}

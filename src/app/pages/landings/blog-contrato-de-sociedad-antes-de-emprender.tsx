import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contrato-de-sociedad-antes-de-emprender')!;

export default function ContratoDeSociedadAntesDeEmprender() {
  return <ArticleLanding data={data} />;
}

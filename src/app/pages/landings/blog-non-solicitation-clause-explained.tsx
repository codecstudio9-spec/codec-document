import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'non-solicitation-clause-explained')!;

export default function NonSolicitationClauseExplained() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'independent-contractor-vs-employee-paperwork')!;

export default function IndependentContractorVsEmployeePaperwork() {
  return <ArticleLanding data={data} />;
}

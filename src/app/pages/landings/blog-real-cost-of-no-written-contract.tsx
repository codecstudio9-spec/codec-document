import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'real-cost-of-no-written-contract')!;

export default function RealCostOfNoWrittenContract() {
  return <ArticleLanding data={data} />;
}

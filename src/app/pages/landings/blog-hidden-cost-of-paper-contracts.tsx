import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'hidden-cost-of-paper-contracts')!;

export default function HiddenCostOfPaperContracts() {
  return <ArticleLanding data={data} />;
}

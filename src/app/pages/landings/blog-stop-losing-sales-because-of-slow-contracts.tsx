import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'stop-losing-sales-because-of-slow-contracts')!;

export default function StopLosingSalesBecauseOfSlowContracts() {
  return <ArticleLanding data={data} />;
}

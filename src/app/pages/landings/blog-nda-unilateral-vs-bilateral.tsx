import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'nda-unilateral-vs-bilateral')!;

export default function NdaUnilateralVsBilateral() {
  return <ArticleLanding data={data} />;
}

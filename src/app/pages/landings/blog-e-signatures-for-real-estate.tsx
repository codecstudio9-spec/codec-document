import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'e-signatures-for-real-estate')!;

export default function ESignaturesForRealEstate() {
  return <ArticleLanding data={data} />;
}

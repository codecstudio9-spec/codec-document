import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'indemnification-clause-plain-english')!;

export default function IndemnificationClausePlainEnglish() {
  return <ArticleLanding data={data} />;
}

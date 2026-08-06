import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'severance-agreement-basics')!;

export default function SeveranceAgreementBasics() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-to-write-a-service-agreement-that-protects-you')!;

export default function HowToWriteAServiceAgreementThatProtectsYou() {
  return <ArticleLanding data={data} />;
}

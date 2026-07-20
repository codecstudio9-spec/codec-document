import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'digital-signatures-for-hr-onboarding')!;

export default function DigitalSignaturesForHrOnboarding() {
  return <ArticleLanding data={data} />;
}

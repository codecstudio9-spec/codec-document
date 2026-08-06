import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'referral-partner-agreement')!;

export default function ReferralPartnerAgreement() {
  return <ArticleLanding data={data} />;
}

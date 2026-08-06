import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contract-renewal-auto-renewal-clauses')!;

export default function ContractRenewalAutoRenewalClauses() {
  return <ArticleLanding data={data} />;
}

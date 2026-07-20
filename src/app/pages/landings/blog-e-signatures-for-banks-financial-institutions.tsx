import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'e-signatures-for-banks-financial-institutions')!;

export default function ESignaturesForBanksFinancialInstitutions() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'authorized-signer-company-contracts')!;

export default function AuthorizedSignerCompanyContracts() {
  return <ArticleLanding data={data} />;
}

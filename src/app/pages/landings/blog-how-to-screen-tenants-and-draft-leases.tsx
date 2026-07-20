import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-to-screen-tenants-and-draft-leases')!;

export default function HowToScreenTenantsAndDraftLeases() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'poder-notarial-firma-electronica')!;

export default function PoderNotarialFirmaElectronica() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contrato-de-subarriendo')!;

export default function ContratoDeSubarriendo() {
  return <ArticleLanding data={data} />;
}

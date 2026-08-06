import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'e-signature-for-international-clients')!;

export default function ESignatureForInternationalClients() {
  return <ArticleLanding data={data} />;
}

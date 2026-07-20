import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'esign-act-legal-validity-us')!;

export default function EsignActLegalValidityUs() {
  return <ArticleLanding data={data} />;
}

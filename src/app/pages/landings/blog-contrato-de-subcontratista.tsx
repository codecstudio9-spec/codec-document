import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contrato-de-subcontratista')!;

export default function ContratoDeSubcontratista() {
  return <ArticleLanding data={data} />;
}

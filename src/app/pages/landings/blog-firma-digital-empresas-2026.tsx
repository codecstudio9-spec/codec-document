import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-digital-empresas-2026')!;

export default function FirmaDigitalEmpresas2026() {
  return <ArticleLanding data={data} />;
}

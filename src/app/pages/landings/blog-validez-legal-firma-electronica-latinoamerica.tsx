import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'validez-legal-firma-electronica-latinoamerica')!;

export default function ValidezLegalFirmaElectronicaLatinoamerica() {
  return <ArticleLanding data={data} />;
}

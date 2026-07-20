import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'como-organizar-documentos-legales-de-tu-empresa')!;

export default function ComoOrganizarDocumentosLegalesDeTuEmpresa() {
  return <ArticleLanding data={data} />;
}

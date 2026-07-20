import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'simple-document-workflow-small-company')!;

export default function SimpleDocumentWorkflowSmallCompany() {
  return <ArticleLanding data={data} />;
}

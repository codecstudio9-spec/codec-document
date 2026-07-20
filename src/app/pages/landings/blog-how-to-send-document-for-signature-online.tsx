import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-to-send-document-for-signature-online')!;

export default function HowToSendDocumentForSignatureOnline() {
  return <ArticleLanding data={data} />;
}

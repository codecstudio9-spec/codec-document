import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'electronic-signature-vs-digital-signature')!;

export default function ElectronicSignatureVsDigitalSignature() {
  return <ArticleLanding data={data} />;
}

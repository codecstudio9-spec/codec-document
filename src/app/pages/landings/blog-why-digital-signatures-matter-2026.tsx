import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'why-digital-signatures-matter-2026')!;

export default function WhyDigitalSignaturesMatter2026() {
  return <ArticleLanding data={data} />;
}

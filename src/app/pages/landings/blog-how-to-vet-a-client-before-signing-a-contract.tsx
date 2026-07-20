import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-to-vet-a-client-before-signing-a-contract')!;

export default function HowToVetAClientBeforeSigningAContract() {
  return <ArticleLanding data={data} />;
}

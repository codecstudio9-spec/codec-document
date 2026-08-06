import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-long-to-keep-signed-contracts')!;

export default function HowLongToKeepSignedContracts() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'free-e-signature-software-small-business')!;

export default function FreeESignatureSoftwareSmallBusiness() {
  return <ArticleLanding data={data} />;
}

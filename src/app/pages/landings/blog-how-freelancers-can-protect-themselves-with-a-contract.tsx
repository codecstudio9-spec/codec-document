import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'how-freelancers-can-protect-themselves-with-a-contract')!;

export default function HowFreelancersCanProtectThemselvesWithAContract() {
  return <ArticleLanding data={data} />;
}

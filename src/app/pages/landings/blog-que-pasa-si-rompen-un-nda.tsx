import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'que-pasa-si-rompen-un-nda')!;

export default function QuePasaSiRompenUnNda() {
  return <ArticleLanding data={data} />;
}

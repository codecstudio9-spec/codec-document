import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'que-es-un-nda-acuerdo-confidencialidad')!;

export default function QueEsUnNdaAcuerdoConfidencialidad() {
  return <ArticleLanding data={data} />;
}

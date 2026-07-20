import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'firma-electronica-para-recursos-humanos')!;

export default function FirmaElectronicaParaRecursosHumanos() {
  return <ArticleLanding data={data} />;
}

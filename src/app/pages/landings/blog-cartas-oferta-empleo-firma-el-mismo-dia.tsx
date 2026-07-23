import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'cartas-oferta-empleo-firma-el-mismo-dia')!;

export default function CartasOfertaEmpleoFirmaElMismoDia() {
  return <ArticleLanding data={data} />;
}

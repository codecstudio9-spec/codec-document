import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'ahorrar-horas-eliminando-papel-en-tu-empresa')!;

export default function AhorrarHorasEliminandoPapelEnTuEmpresa() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'costo-oculto-del-papel-en-empresas')!;

export default function CostoOcultoDelPapelEnEmpresas() {
  return <ArticleLanding data={data} />;
}

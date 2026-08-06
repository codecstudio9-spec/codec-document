import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'cuanto-tiempo-guardar-contratos-firmados')!;

export default function CuantoTiempoGuardarContratosFirmados() {
  return <ArticleLanding data={data} />;
}

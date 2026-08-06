import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'contrato-de-alquiler-de-equipos')!;

export default function ContratoDeAlquilerDeEquipos() {
  return <ArticleLanding data={data} />;
}

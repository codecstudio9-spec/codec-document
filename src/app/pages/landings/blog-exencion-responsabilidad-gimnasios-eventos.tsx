import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'exencion-responsabilidad-gimnasios-eventos')!;

export default function ExencionResponsabilidadGimnasiosEventos() {
  return <ArticleLanding data={data} />;
}

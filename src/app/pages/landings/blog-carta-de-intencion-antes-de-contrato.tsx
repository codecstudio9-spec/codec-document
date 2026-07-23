import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'carta-de-intencion-antes-de-contrato')!;

export default function CartaDeIntencionAntesDeContrato() {
  return <ArticleLanding data={data} />;
}

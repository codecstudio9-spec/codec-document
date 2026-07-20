import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'errores-comunes-en-contrato-de-arrendamiento')!;

export default function ErroresComunesEnContratoDeArrendamiento() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'errores-vender-auto-usado-sin-contrato')!;

export default function ErroresVenderAutoUsadoSinContrato() {
  return <ArticleLanding data={data} />;
}

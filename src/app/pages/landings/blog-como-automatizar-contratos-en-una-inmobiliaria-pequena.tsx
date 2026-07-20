import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'como-automatizar-contratos-en-una-inmobiliaria-pequena')!;

export default function ComoAutomatizarContratosEnUnaInmobiliariaPequena() {
  return <ArticleLanding data={data} />;
}

import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'como-verificar-identidad-de-un-firmante')!;

export default function ComoVerificarIdentidadDeUnFirmante() {
  return <ArticleLanding data={data} />;
}

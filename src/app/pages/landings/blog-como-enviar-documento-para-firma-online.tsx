import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'como-enviar-documento-para-firma-online')!;

export default function ComoEnviarDocumentoParaFirmaOnline() {
  return <ArticleLanding data={data} />;
}

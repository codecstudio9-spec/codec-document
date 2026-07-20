import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'errores-comunes-al-redactar-un-nda')!;

export default function ErroresComunesAlRedactarUnNda() {
  return <ArticleLanding data={data} />;
}

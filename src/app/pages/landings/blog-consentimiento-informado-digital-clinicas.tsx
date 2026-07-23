import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'consentimiento-informado-digital-clinicas')!;

export default function ConsentimientoInformadoDigitalClinicas() {
  return <ArticleLanding data={data} />;
}

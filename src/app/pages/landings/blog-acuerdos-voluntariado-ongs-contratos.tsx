import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'acuerdos-voluntariado-ongs-contratos')!;

export default function AcuerdosVoluntariadoOngsContratos() {
  return <ArticleLanding data={data} />;
}

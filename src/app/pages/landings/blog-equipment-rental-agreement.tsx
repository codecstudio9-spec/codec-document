import { ArticleLanding } from '../../components/landing/ArticleLanding';
import { ARTICLES } from '../../data/article-content';

const data = ARTICLES.find((a) => a.slug === 'equipment-rental-agreement')!;

export default function EquipmentRentalAgreement() {
  return <ArticleLanding data={data} />;
}

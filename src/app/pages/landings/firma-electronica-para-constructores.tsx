import { ProfessionLanding } from '../../components/landing/ProfessionLanding';
import { PROFESSION_PAGES } from '../../data/profession-seo-content';

const profession = PROFESSION_PAGES.find((p) => p.slug === 'constructores')!;

export default function FirmaElectronicaParaConstructores() {
  return <ProfessionLanding profession={profession} />;
}

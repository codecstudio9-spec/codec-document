import { ProfessionLanding } from '../../components/landing/ProfessionLanding';
import { PROFESSION_PAGES } from '../../data/profession-seo-content';

const profession = PROFESSION_PAGES.find((p) => p.slug === 'empresas')!;

export default function FirmaElectronicaParaEmpresas() {
  return <ProfessionLanding profession={profession} />;
}

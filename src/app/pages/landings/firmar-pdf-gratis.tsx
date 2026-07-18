import { FreeFeatureLanding } from '../../components/landing/FreeFeatureLanding';
import { FREE_FEATURE_PAGES } from '../../data/free-feature-seo-content';

const page = FREE_FEATURE_PAGES.find((p) => p.slug === 'firmar-pdf-gratis')!;

export default function FirmarPdfGratis() {
  return <FreeFeatureLanding page={page} />;
}

import { FreeFeatureLanding } from '../../components/landing/FreeFeatureLanding';
import { FREE_FEATURE_PAGES } from '../../data/free-feature-seo-content';

const page = FREE_FEATURE_PAGES.find((p) => p.slug === 'crear-documentos-online-gratis')!;

export default function CrearDocumentosOnlineGratis() {
  return <FreeFeatureLanding page={page} />;
}

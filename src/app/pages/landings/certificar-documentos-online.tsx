import { FreeFeatureLanding } from '../../components/landing/FreeFeatureLanding';
import { FREE_FEATURE_PAGES } from '../../data/free-feature-seo-content';

const page = FREE_FEATURE_PAGES.find((p) => p.slug === 'certificar-documentos-online')!;

export default function CertificarDocumentosOnline() {
  return <FreeFeatureLanding page={page} />;
}

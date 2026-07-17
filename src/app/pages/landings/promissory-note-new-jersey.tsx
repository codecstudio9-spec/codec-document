import { DocTypeStateLanding } from '../../components/landing/DocTypeStateLanding';
import { DOCTYPE_STATE_CONFIGS } from '../../data/doctype-state-seo-content';

const data = DOCTYPE_STATE_CONFIGS.find((d) => d.docType === 'promissory-note' && d.stateSlug === 'new-jersey')!;

export default function PromissoryNoteNewJersey() {
  return <DocTypeStateLanding data={data} />;
}

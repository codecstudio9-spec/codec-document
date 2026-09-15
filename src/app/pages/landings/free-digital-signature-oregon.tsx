import { USFreeSignatureLanding } from '../../components/landing/USFreeSignatureLanding';
import { US_FREE_SIGNATURE_STATES } from '../../data/us-free-signature-state-content';

const state = US_FREE_SIGNATURE_STATES.find((s) => s.slug === 'oregon')!;

export default function FreeDigitalSignatureOregon() {
  return <USFreeSignatureLanding state={state} />;
}

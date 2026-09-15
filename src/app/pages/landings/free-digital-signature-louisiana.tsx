import { USFreeSignatureLanding } from '../../components/landing/USFreeSignatureLanding';
import { US_FREE_SIGNATURE_STATES } from '../../data/us-free-signature-state-content';

const state = US_FREE_SIGNATURE_STATES.find((s) => s.slug === 'louisiana')!;

export default function FreeDigitalSignatureLouisiana() {
  return <USFreeSignatureLanding state={state} />;
}

/**
 * Biometric verification at signing (Face ID / Touch ID / Android
 * fingerprint) via WebAuthn's platform authenticator — the web standard
 * that triggers the device's own native biometric prompt from the
 * browser. This is a one-time "prove you have a working biometric
 * authenticator on this device, right now" ceremony, not a persistent
 * login: each call creates a fresh, throwaway credential (random
 * challenge + random user id), and its SUCCESS is the evidence itself —
 * there's no later step that verifies it against a stored public key,
 * because there's nothing to log into here.
 *
 * IMPORTANT — what this can and cannot prove: WebAuthn never exposes the
 * actual fingerprint/face image to the website, or to ANY app, native or
 * web — that's enforced by iOS/Android/Windows themselves, not a
 * limitation of this code. What it DOES prove: a real device with a
 * working platform biometric sensor was present and the person passed
 * that device's own biometric check, at this exact timestamp. That's
 * strong identity evidence, just not a visual fingerprint image — no
 * browser or app can produce one of those, so don't build UI that implies
 * otherwise.
 */

export interface BiometricProof {
  verified: true;
  /** Human-readable, for display on the certification page. */
  label: string;
  /** Base64 of the fresh credential's raw id — audit reference only, not
   * reusable to re-authenticate anything (nothing is stored server-side
   * to check it against). */
  credentialId: string;
  verifiedAt: string;
  /** 'platform' always — we deliberately never request 'cross-platform'
   * (a USB/NFC security key), since the ask is specifically Face ID /
   * Touch ID / fingerprint on the signer's own device. */
  authenticatorAttachment: 'platform';
}

/** Cheap capability check — use this to decide whether to even show the
 * "Verificar con Face ID / Huella" button, so it doesn't appear (and
 * then fail) on a desktop browser with no biometric hardware. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Runs the actual Face ID/Touch ID/fingerprint prompt. Throws with a
 * user-facing Spanish message on cancel, timeout, or unsupported browser
 * — callers should catch and show `error.message` directly, never swallow
 * it silently (the signer needs to know verification didn't happen). */
export async function verifyBiometric(signerLabel: string): Promise<BiometricProof> {
  if (!window.PublicKeyCredential) {
    throw new Error('Este navegador no soporta verificación biométrica. Intenta desde el celular o desde Chrome/Safari/Edge actualizado.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Codec Document', id: window.location.hostname },
        user: { id: userId, name: signerLabel || 'firmante', displayName: signerLabel || 'Firmante' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256 — some older Android/Windows authenticators only support this
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        attestation: 'none', // no device-identifying attestation needed — this is a liveness/consent ceremony, not device enrollment
        timeout: 60_000,
      },
    });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'NotAllowedError') {
      throw new Error('Verificación cancelada o denegada.');
    }
    if (name === 'InvalidStateError') {
      throw new Error('Ya existe una verificación en curso — intenta de nuevo.');
    }
    throw new Error('No se pudo completar la verificación biométrica. Verifica que Face ID/Touch ID/huella esté activado en este dispositivo.');
  }

  const pkCredential = credential as PublicKeyCredential | null;
  if (!pkCredential) {
    throw new Error('No se pudo completar la verificación biométrica.');
  }

  return {
    verified: true,
    label: 'Face ID / Touch ID / Huella',
    credentialId: bufferToBase64(pkCredential.rawId),
    verifiedAt: new Date().toISOString(),
    authenticatorAttachment: 'platform',
  };
}

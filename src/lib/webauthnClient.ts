/**
 * Browser-side WebAuthn/FIDO2 client for the "Biometric Authentication"
 * signing requirement. Talks to the `webauthn` Edge Function
 * (supabase/functions/webauthn) which issues single-use challenges and
 * verifies the resulting assertion server-side.
 *
 * Codec Document never receives a fingerprint image or face scan here —
 * `navigator.credentials.create()` triggers the OS's own biometric prompt
 * (Touch ID / Face ID / Windows Hello / Android fingerprint) and the
 * browser only ever hands back a signed cryptographic attestation. That
 * check happens entirely on the signer's device.
 */

import { supabase } from './supabase';

export class BiometricError extends Error {
  code: 'unsupported' | 'cancelled' | 'not_verified' | 'network' | 'other';
  constructor(message: string, code: BiometricError['code'] = 'other') {
    super(message);
    this.code = code;
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function base64urlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface ChallengeOptionsJSON {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
}

async function invokeWebauthn<T>(action: 'challenge' | 'verify', body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(`webauthn?action=${action}`, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    let message = error.message;
    if (context && typeof context.json === 'function') {
      try {
        const parsed = await context.clone().json();
        if (parsed?.error) message = parsed.error;
      } catch { /* body wasn't JSON */ }
    }
    throw new BiometricError(message, 'network');
  }
  if (data?.error) throw new BiometricError(data.error, 'not_verified');
  return data as T;
}

export interface BiometricVerificationResult {
  deviceLabel: string;
  verifiedAt: string;
}

/**
 * Runs one full WebAuthn registration ceremony (challenge → local
 * biometric prompt → server verification) for the given signing
 * transaction. A single `create()` ceremony is sufficient proof here —
 * there's no persistent signer account to log back into afterwards, and
 * the authenticator itself refuses to produce a signed attestation unless
 * the user was just verified by the sensor (userVerification: 'required').
 */
export async function runBiometricVerification(txId: string): Promise<BiometricVerificationResult> {
  if (!(await isBiometricAvailable())) {
    throw new BiometricError('This device has no available fingerprint/Face ID sensor.', 'unsupported');
  }

  const options = await invokeWebauthn<ChallengeOptionsJSON>('challenge', { txId });

  let credential: PublicKeyCredential;
  try {
    credential = (await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        user: { ...options.user, id: base64urlToBuffer(options.user.id) },
      },
    })) as PublicKeyCredential;
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'NotAllowedError') {
      throw new BiometricError('Biometric verification was cancelled or timed out.', 'cancelled');
    }
    throw new BiometricError((err as Error)?.message || 'Biometric verification failed.', 'other');
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialJSON = {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: (credential as unknown as { authenticatorAttachment?: string }).authenticatorAttachment ?? null,
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      transports: response.getTransports?.() ?? [],
    },
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
  };

  return invokeWebauthn<BiometricVerificationResult>('verify', { txId, credential: credentialJSON });
}

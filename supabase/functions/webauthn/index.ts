// Supabase Edge Function — WebAuthn/FIDO2 biometric verification for signers.
//
// Why this exists: the "Biometric Authentication" security option lets a
// document creator require the recipient to prove their identity using
// their device's own fingerprint/Face ID/Windows Hello sensor before
// signing. That proof must be verified server-side against a single-use
// challenge, or it would be trivial to fake from devtools. This function
// is the ONLY place that ever writes recipient_biometric_* columns on
// sign_transactions (see 20260728120000_add_biometric_auth.sql, which
// REVOKEs UPDATE on those columns from anon/authenticated) — it uses the
// service_role key, which bypasses RLS and column grants entirely.
//
// Critically, this function (and Codec Document as a whole) NEVER sees a
// fingerprint image, a face scan, or any raw biometric template. WebAuthn's
// entire design point is that the browser performs the biometric check
// locally against the OS/device's secure enclave and only ever hands the
// server a signed cryptographic assertion (attestationObject +
// clientDataJSON) proving "this device's platform authenticator verified
// its owner". Storing anything more than that would create real exposure
// under biometric privacy statutes (e.g. Illinois BIPA) for zero benefit —
// the crypto proof is what has legal weight, not a picture of a finger.
//
// Deploy:
//   supabase functions deploy webauthn --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// No extra secrets needed beyond the platform-injected SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from 'https://esm.sh/@simplewebauthn/server@9?target=deno';
import type {
  RegistrationResponseJSON,
} from 'https://esm.sh/@simplewebauthn/types@9?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const RP_NAME = 'Codec Document';

// Registrable-domain allowlist. WebAuthn's rpID must be a registrable
// domain suffix of the actual origin — never trust an rpID/origin sent by
// the client, always derive it from this fixed list matched against the
// request's Origin header.
const ALLOWED_RP: Array<{ rpID: string; origins: string[] }> = [
  { rpID: 'codecdocument.com', origins: ['https://codecdocument.com', 'https://www.codecdocument.com'] },
  { rpID: 'localhost', origins: ['http://localhost:5174', 'http://127.0.0.1:5174'] },
];

const CHALLENGE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function resolveRp(origin: string | null): { rpID: string; origin: string } | null {
  if (!origin) return null;
  const match = ALLOWED_RP.find((r) => r.origins.includes(origin));
  return match ? { rpID: match.rpID, origin } : null;
}

/** Human-readable label for the audit trail / PDF. Derived from the
 * signer's User-Agent + authenticatorAttachment rather than the
 * authenticator's AAGUID — AAGUID-to-name mappings require trusting a
 * third-party metadata service (FIDO MDS) we don't integrate here, and a
 * wrong guess would be worse than an honest, slightly generic label. */
function describeDevice(userAgent: string | null, authenticatorAttachment: string | null): string {
  const ua = userAgent ?? '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'Face ID / Touch ID (iOS Platform Authenticator)';
  if (/macintosh|mac os x/i.test(ua)) return 'Touch ID (macOS Platform Authenticator)';
  if (/android/i.test(ua)) return 'Fingerprint / Face Unlock (Android Platform Authenticator)';
  if (/windows/i.test(ua)) return 'Windows Hello (Platform Authenticator)';
  if (authenticatorAttachment === 'cross-platform') return 'External Security Key (FIDO2 Authenticator)';
  return 'Platform Biometric Authenticator';
}

function bufToBase64url(buf: Uint8Array): string {
  let str = '';
  for (const b of buf) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const rp = resolveRp(origin);
  if (!rp) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403, headers: corsHeaders(origin),
    });
  }

  try {
    if (action === 'challenge') {
      const { txId } = (await req.json()) as { txId?: string };
      if (!txId) {
        return new Response(JSON.stringify({ error: 'Missing txId' }), { status: 400, headers: corsHeaders(origin) });
      }

      const { data: tx } = await admin
        .from('sign_transactions')
        .select('id, security_config')
        .eq('id', txId)
        .maybeSingle();

      if (!tx || !(tx.security_config as Record<string, unknown> | null)?.requireBiometric) {
        return new Response(JSON.stringify({ error: 'Biometric verification not required for this document' }), {
          status: 400, headers: corsHeaders(origin),
        });
      }

      // userID must be supplied explicitly — @simplewebauthn/server does not
      // synthesize one, and without it the JSON response comes back with no
      // `user.id` at all, which crashes the browser's
      // navigator.credentials.create() call (it requires user.id).
      const userID = crypto.getRandomValues(new Uint8Array(32));
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rp.rpID,
        userID,
        userName: 'signer',
        userDisplayName: 'Document Signer',
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
      });

      await admin.from('webauthn_challenges').insert({
        tx_id: txId,
        challenge: options.challenge,
        expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      });

      // Force user.id to a base64url string ourselves — the resolved
      // @simplewebauthn/server build echoes back whatever Uint8Array we
      // passed as `userID` without base64url-encoding it, which serializes
      // to `{"0":195,"1":41,...}` over JSON and crashes the browser's
      // navigator.credentials.create() (it needs a BufferSource it can
      // decode, not an array-like object of numbers).
      const optionsJSON = { ...options, user: { ...options.user, id: bufToBase64url(userID) } };

      return new Response(JSON.stringify(optionsJSON), { headers: corsHeaders(origin) });
    }

    if (action === 'verify') {
      const { txId, credential } = (await req.json()) as { txId?: string; credential?: RegistrationResponseJSON };
      if (!txId || !credential) {
        return new Response(JSON.stringify({ error: 'Missing txId or credential' }), { status: 400, headers: corsHeaders(origin) });
      }

      const { data: challengeRow } = await admin
        .from('webauthn_challenges')
        .select('id, challenge, expires_at, used')
        .eq('tx_id', txId)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Verification challenge expired or missing — please try again' }), {
          status: 400, headers: corsHeaders(origin),
        });
      }

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: credential,
          expectedChallenge: challengeRow.challenge,
          expectedOrigin: rp.origin,
          expectedRPID: rp.rpID,
          requireUserVerification: true,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: `Verification failed: ${(err as Error).message}` }), {
          status: 400, headers: corsHeaders(origin),
        });
      }

      // Single-use: burn the challenge whether or not verification passed,
      // so a captured response can never be replayed.
      await admin.from('webauthn_challenges').update({ used: true }).eq('id', challengeRow.id);

      if (!verification.verified || !verification.registrationInfo?.userVerified) {
        return new Response(JSON.stringify({ error: 'Biometric verification did not complete — user was not verified by the device sensor' }), {
          status: 400, headers: corsHeaders(origin),
        });
      }

      const info = verification.registrationInfo;
      const deviceLabel = describeDevice(req.headers.get('user-agent'), credential.authenticatorAttachment ?? null);
      const verifiedAt = new Date().toISOString();

      await admin
        .from('sign_transactions')
        .update({
          recipient_biometric_credential_id: bufToBase64url(info.credentialID),
          recipient_biometric_public_key: bufToBase64url(info.credentialPublicKey),
          recipient_biometric_aaguid: info.aaguid ?? null,
          recipient_biometric_device_label: deviceLabel,
          recipient_biometric_verified_at: verifiedAt,
          recipient_biometric_counter: info.counter ?? 0,
          recipient_biometric_rp_id: rp.rpID,
        })
        .eq('id', txId);

      return new Response(JSON.stringify({ verified: true, deviceLabel, verifiedAt }), { headers: corsHeaders(origin) });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders(origin) });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500, headers: corsHeaders(origin),
    });
  }
});

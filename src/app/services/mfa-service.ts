/**
 * Two-factor authentication (2FA/MFA) for admin accounts — thin wrapper
 * around Supabase Auth's native TOTP support (`supabase.auth.mfa.*`), no
 * external service or credentials needed. An admin scans a QR code with
 * an app like Google Authenticator/Authy once, then re-enters a 6-digit
 * code on every new session (`aal2` — see getMfaStatus below).
 */
import { supabase } from '../../lib/supabase';

export interface MfaFactor {
  id: string;
  friendlyName?: string;
  status: 'verified' | 'unverified';
}

export interface MfaStatus {
  /** 'aal1' = password/OAuth only. 'aal2' = also passed a second factor
   * this session. Typed as `string` (not a literal union) because
   * supabase-js's own AuthenticatorAssuranceLevels type is intentionally
   * open-ended (`'aal1' | 'aal2' | (string & {})`) for forward
   * compatibility — plain string equality below still works fine. */
  currentLevel: string | null;
  /** What the account COULD reach — 'aal2' here (even while currentLevel
   * is still 'aal1') means a verified factor exists and just needs to be
   * challenged this session. */
  nextLevel: string | null;
  hasVerifiedFactor: boolean;
  factors: MfaFactor[];
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const [{ data: aal, error: aalError }, { data: factorsData, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (aalError) throw new Error(`getMfaStatus: ${aalError.message}`);
  if (factorsError) throw new Error(`getMfaStatus: ${factorsError.message}`);

  // `.totp` is typed by supabase-js as always-verified (its generic
  // default), which would make an `=== 'unverified'` check a compile
  // error below — `.all` carries the real per-factor status for every
  // factor type, so filtering that ourselves is what actually works.
  const factors: MfaFactor[] = (factorsData?.all ?? [])
    .filter((f) => f.factor_type === 'totp')
    .map((f) => ({ id: f.id, friendlyName: f.friendly_name, status: f.status }));

  return {
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
    hasVerifiedFactor: factors.some((f) => f.status === 'verified'),
    factors,
  };
}

export async function enrollTotp(friendlyName = 'Codec Document'): Promise<{ factorId: string; qrCode: string; secret: string }> {
  // Clean up any abandoned unverified attempt first — Supabase Auth
  // rejects enrolling a second TOTP factor while one is already pending
  // unverified (e.g. the admin closed the tab mid-setup last time), which
  // would otherwise strand them on this screen with a confusing error.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName });
  if (error) throw new Error(`enrollTotp: ${error.message}`);
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Used both to confirm a fresh enrollment and to re-authenticate an
 * already-verified factor at the start of a new session — Supabase's
 * challenge+verify pair is identical in both cases, only which factorId
 * is passed in differs. */
export async function challengeAndVerify(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw new Error(`challengeAndVerify: ${challengeError.message}`);
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error) throw new Error(`challengeAndVerify: ${error.message}`);
}

export async function unenrollFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(`unenrollFactor: ${error.message}`);
}

// ─── Login enforcement — 2FA is opt-in, off by default ─────────────────────
// Having a verified TOTP factor does NOT by itself block sign-in anymore.
// AdminMfaGate only shows the enroll/challenge screens when the admin has
// explicitly turned this on from Settings, after already confirming their
// code works. This is what makes 2FA impossible to get locked out of: with
// enforcement off (the default), a verified factor just sits there unused.

export async function getMfaLoginEnforced(): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_mfa_login_enforced');
  if (error) throw new Error(`getMfaLoginEnforced: ${error.message}`);
  return Boolean(data);
}

export async function setMfaLoginEnforced(enforce: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_mfa_login_enforced', { p_enforce: enforce });
  if (error) throw new Error(`setMfaLoginEnforced: ${error.message}`);
}

// ─── Backup codes — recovery when the TOTP device is lost ─────────────────
// Supabase Auth has no native backup-code factor type, so these are our
// own one-time codes (see supabase/migrations/20260918150000_add_mfa_
// backup_codes.sql). Redeeming one doesn't fake a Supabase aal2 session —
// it deletes the account's TOTP factor(s) server-side, which makes
// AdminMfaGate fall back to its existing "set up 2FA from scratch" screen
// on the next check. That's deliberate: a recovered account should
// re-enroll cleanly, not silently regain full access.

/** Generates a fresh set of 10 one-time codes, shown ONCE — the server
 * only ever stores their hash. Calling this again invalidates any unused
 * codes from a previous batch. */
export async function generateBackupCodes(): Promise<string[]> {
  const { data, error } = await supabase.rpc('generate_mfa_backup_codes');
  if (error) throw new Error(`generateBackupCodes: ${error.message}`);
  return (data as string[]) ?? [];
}

/** Returns true and clears the account's TOTP factor(s) if `code` is a
 * valid, unused backup code for the current session's user — false
 * otherwise (wrong code, already used, or none ever generated). */
export async function redeemBackupCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('redeem_mfa_backup_code', { p_code: code });
  if (error) throw new Error(`redeemBackupCode: ${error.message}`);
  return Boolean(data);
}

export async function countUnusedBackupCodes(): Promise<number> {
  const { data, error } = await supabase.rpc('count_unused_mfa_backup_codes');
  if (error) throw new Error(`countUnusedBackupCodes: ${error.message}`);
  return (data as number) ?? 0;
}

-- One-off cleanup, not a schema change: removes the MFA TOTP factor(s)
-- left on the admin account (douglastabordasanchez@gmail.com) by live
-- testing of AdminMfaGate.tsx during this session (2026-09-18/19) — each
-- test enrollment used a secret only the testing session ever knew
-- (computed by hand, never scanned into a real authenticator app), so
-- leaving it verified would lock the real account owner out on their next
-- session. Safe to run once: at the time of writing, every TOTP factor on
-- this account is a leftover test artifact, since the real owner has
-- never completed an enrollment yet.
DELETE FROM auth.mfa_factors
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'douglastabordasanchez@gmail.com')
  AND factor_type = 'totp';

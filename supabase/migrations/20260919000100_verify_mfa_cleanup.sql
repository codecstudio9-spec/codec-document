-- Verification-only, no schema change: fails loudly (so `supabase db push`
-- itself reports an error) if any TOTP factor still exists on the admin
-- account after 20260919000000_cleanup_test_mfa_factor.sql — the browser
-- used to confirm this interactively during the same session became
-- unresponsive (host memory pressure) before that could be double-checked
-- there, so this migration is the independent confirmation instead.
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM auth.mfa_factors
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'douglastabordasanchez@gmail.com')
    AND factor_type = 'totp';

  IF v_count > 0 THEN
    RAISE EXCEPTION 'MFA cleanup verification failed: % TOTP factor(s) still present on the admin account', v_count;
  END IF;
END $$;

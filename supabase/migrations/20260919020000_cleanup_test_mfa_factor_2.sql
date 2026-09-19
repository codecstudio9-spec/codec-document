-- Same cleanup as 20260919000000_cleanup_test_mfa_factor.sql — another
-- live test enrollment during this session (testing DesktopAdminInstitutions.tsx),
-- same reasoning: the test secret is never scanned into a real
-- authenticator app, so leaving it verified would lock the real admin
-- out next session.
DELETE FROM auth.mfa_factors
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'douglastabordasanchez@gmail.com')
  AND factor_type = 'totp';

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

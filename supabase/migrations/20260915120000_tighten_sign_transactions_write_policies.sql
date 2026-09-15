-- sign_transactions had "tx_update" (FOR UPDATE USING (true)) and "tx_insert"
-- (FOR INSERT WITH CHECK (true)) policies applying to anon + authenticated —
-- i.e. anyone who knows (or guesses) a transaction id could directly rewrite
-- any column on any row via the Supabase client, with no ownership check.
-- These two policies predate the tracked migration history (created by hand
-- in the dashboard — see the comment above markTransactionViewed() in
-- src/app/services/sign-transaction-service.ts) and were never tightened
-- when the guest-signing write path was moved to SECURITY DEFINER RPCs.
--
-- Verified before writing this migration that nothing in the app still
-- needs the permissive version:
--   - The guest/recipient signing flow (sign-transaction-page.tsx) writes
--     exclusively through complete_sign_transaction() and
--     patch_sign_transaction_evidence() — both SECURITY DEFINER, so they run
--     as the function owner and bypass RLS regardless of these policies.
--   - Transaction creation goes exclusively through the SECURITY DEFINER
--     create_sign_transaction() RPC — no direct
--     `.from('sign_transactions').insert(...)` call exists in src/.
--   - The only direct `.update()` callers left in src/ are
--     markTransactionViewed() and markAllTransactionsViewed(), both called
--     by the authenticated creator against their own rows, and both keep
--     working under an owner-scoped policy.
--
-- Net effect: no behavior change for legitimate use, and anon/authenticated
-- callers can no longer write to a sign_transactions row they don't own by
-- guessing/reusing its id.

DROP POLICY IF EXISTS "tx_update" ON public.sign_transactions;

CREATE POLICY "tx_update_own" ON public.sign_transactions
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = creator_id)
  WITH CHECK (auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "tx_insert" ON public.sign_transactions;

CREATE POLICY "tx_insert_own" ON public.sign_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = creator_id);

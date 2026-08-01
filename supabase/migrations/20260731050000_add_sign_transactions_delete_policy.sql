-- sign_transactions had SELECT ("tx_select_own") and UPDATE ("tx_update")
-- policies but no DELETE policy at all, so RLS denied every delete by
-- default. Needed for the new "select multiple, delete" bulk-delete UI on
-- the Firmas dashboard list (mirrors documents_delete_own's shape).
DO $$ BEGIN
  CREATE POLICY "tx_delete_own" ON public.sign_transactions
    FOR DELETE TO authenticated
    USING (auth.uid()::text = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

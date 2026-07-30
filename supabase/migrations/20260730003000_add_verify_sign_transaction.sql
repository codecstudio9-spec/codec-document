-- Public "verify this document is real" lookup — deliberately a NARROW,
-- purpose-built function instead of reusing get_sign_transaction_public
-- (which returns the whole row: selfies, ID photos, IP addresses, raw
-- signature images). That one is safe only because the guest holding a
-- /sign/:id link IS the subject of that data. This function is meant to
-- be called by ANYONE who has a transaction id printed on a document's
-- audit page, so it returns only what's safe to confirm publicly:
-- whether the transaction exists, its status, document type and dates.
-- No selfies, no ID photos, no IP, no signature image, no personal names.
CREATE OR REPLACE FUNCTION public.verify_sign_transaction(p_id uuid)
RETURNS TABLE (
  found boolean,
  status text,
  document_type text,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    true AS found,
    st.status,
    st.document_type,
    st.signed_at AS completed_at,
    st.created_at
  FROM public.sign_transactions st
  WHERE st.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_sign_transaction(uuid) TO anon, authenticated;

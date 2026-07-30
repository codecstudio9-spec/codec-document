-- Lets a guest signer (no account) regenerate/download their own copy of a
-- custom Word-template document from the public "done" screen at
-- /sign/:transactionId. Mirrors get_template_by_slug_public, keyed by id
-- instead of slug — safe to expose the same way: anyone who already has a
-- transaction's UUID (get_sign_transaction_public's existing trust
-- boundary) is treated as authorized to see the template used to build it.
-- The template file itself (blank, no signer data) is not sensitive; the
-- actual personal data lives in sign_transactions.document_data, which
-- this RPC does not touch.
CREATE OR REPLACE FUNCTION public.get_docx_template_by_id_public(p_id uuid)
RETURNS TABLE (id uuid, name text, docx_file_url text)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url
  FROM public.templates
  WHERE id = p_id AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_docx_template_by_id_public(uuid) TO anon, authenticated;

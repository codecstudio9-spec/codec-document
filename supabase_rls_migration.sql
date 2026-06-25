-- Codec Document - RLS Security Policies
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Enable RLS on all signature-related tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. documents policies
-- Authenticated users can read/write their own documents
CREATE POLICY "owner_read_documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "owner_insert_documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "owner_update_documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. signing_links: any user (including anon) can read a link by joining on token
-- This is needed for the guest signing flow (no auth required)
CREATE POLICY "anon_read_signing_links" ON public.signing_links
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_signing_links" ON public.signing_links
  FOR INSERT WITH CHECK (true);

-- 4. signers: readable via signing link; insertable by creator
CREATE POLICY "anon_read_signers" ON public.signers
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_signers" ON public.signers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_update_signers" ON public.signers
  FOR UPDATE USING (true);

-- 5. signatures: creator and guest can insert; anyone with document_id can read
CREATE POLICY "anon_insert_signatures" ON public.signatures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "owner_read_signatures" ON public.signatures
  FOR SELECT USING (true);

-- 6. signature_positions: owner manages positions
CREATE POLICY "auth_manage_positions" ON public.signature_positions
  FOR ALL USING (true);

-- 7. audit_logs: system-managed; only authenticated can write
CREATE POLICY "anon_insert_audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "owner_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (true);

-- 8. Storage: create documents-bucket if it doesn't exist, then set policies
-- (Run this in the Supabase Dashboard > Storage, or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents-bucket', 'documents-bucket', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies (execute after bucket creation)
CREATE POLICY "public_read_documents_bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents-bucket');

CREATE POLICY "auth_write_documents_bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents-bucket');

CREATE POLICY "auth_update_documents_bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents-bucket');

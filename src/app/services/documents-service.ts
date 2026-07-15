/**
 * Cloud document storage service — persists user-generated documents.
 *
 * Run this SQL once in Supabase SQL Editor:
 *
 * CREATE TABLE IF NOT EXISTS public.user_documents (
 *   id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   template_id   text NOT NULL,
 *   document_name text NOT NULL,
 *   created_at    timestamptz NOT NULL DEFAULT now(),
 *   updated_at    timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "user_documents_own" ON public.user_documents
 *   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 */

import { supabase } from '../../lib/supabase';

export interface UserDocument {
  id: string;
  user_id: string;
  template_id: string;
  document_name: string;
  created_at: string;
  updated_at: string;
}

export async function saveDocumentRecord(
  userId: string,
  templateId: string,
  documentName: string,
): Promise<void> {
  await supabase.from('user_documents').insert({
    user_id: userId,
    template_id: templateId,
    document_name: documentName,
  });
}

export async function fetchUserDocuments(userId: string): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as UserDocument[]) ?? [];
}

export async function renameDocument(documentId: string, newName: string): Promise<void> {
  await supabase
    .from('user_documents')
    .update({ document_name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', documentId);
}

export async function deleteDocumentRecord(documentId: string): Promise<void> {
  await supabase.from('user_documents').delete().eq('id', documentId);
}

// ─── Documents associated via profile_documents (guest-signed docs) ───────
// Separate from `user_documents` above: this is the *signature* flow's
// `documents` table (original_pdf_url/signed_pdf_url — see
// signatureService.ts), linked to a signer's profile after they sign a
// document as a guest while logged in. Different shape, different table —
// merged into the dashboard as its own section rather than forced into the
// template-based UserDocument grid, which has no PDF url / no template_id.
export interface AssociatedDocument {
  id: string;
  name: string;
  status: string;
  original_pdf_url: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  role: string;
}

export async function fetchAssociatedDocuments(userId: string): Promise<AssociatedDocument[]> {
  const { data: links, error: linksError } = await supabase
    .from('profile_documents')
    .select('document_id, role, associated_at')
    .eq('profile_id', userId)
    .order('associated_at', { ascending: false });
  if (linksError || !links || links.length === 0) return [];

  const documentIds = links.map((l) => l.document_id as string);
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, name, status, original_pdf_url, signed_pdf_url, created_at')
    .in('id', documentIds);
  if (docsError || !docs) return [];

  const roleByDocId = new Map(links.map((l) => [l.document_id as string, l.role as string]));
  return (docs as Array<Omit<AssociatedDocument, 'role'>>).map((d) => ({
    ...d,
    role: roleByDocId.get(d.id) ?? 'signer',
  }));
}

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

// ─── Documents associated with this user (owned + guest-signed) ──────────
// Separate from `user_documents` above: this is the *signature* flow's
// `documents` table (original_pdf_url/signed_pdf_url — see
// signatureService.ts). Different shape, different table — merged into
// the dashboard as its own section rather than forced into the
// template-based UserDocument grid, which has no PDF url / no template_id.
//
// Two sources, unioned:
//  1. `documents.user_id` — set via DEFAULT auth.uid() at insert time, so
//     this always finds documents this user directly created/uploaded.
//  2. `profile_documents` — a link table for "documents I signed as a
//     guest on someone else's document" (signer isn't the row's
//     `user_id`). Created, and `documents`' RLS tightened to match, by
//     supabase_lockdown_documents_migration.sql (run once in Supabase
//     SQL Editor) — see that file for the exact schema/policies.
export interface AssociatedDocument {
  id: string;
  name: string;
  status: string;
  original_pdf_url: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  role: string;
}

const DOC_COLUMNS = 'id, name, status, original_pdf_url, signed_pdf_url, created_at';

export async function fetchAssociatedDocuments(userId: string): Promise<AssociatedDocument[]> {
  const [ownedRes, linksRes] = await Promise.all([
    supabase.from('documents').select(DOC_COLUMNS).eq('user_id', userId),
    supabase.from('profile_documents').select('document_id, role, associated_at').eq('profile_id', userId),
  ]);

  const merged = new Map<string, AssociatedDocument>();

  for (const d of (ownedRes.data as Array<Omit<AssociatedDocument, 'role'>>) ?? []) {
    merged.set(d.id, { ...d, role: 'owner' });
  }

  const links = linksRes.data ?? [];
  if (!linksRes.error && links.length > 0) {
    const documentIds = links.map((l) => l.document_id as string);
    const { data: linkedDocs } = await supabase.from('documents').select(DOC_COLUMNS).in('id', documentIds);
    const roleByDocId = new Map(links.map((l) => [l.document_id as string, l.role as string]));
    for (const d of (linkedDocs as Array<Omit<AssociatedDocument, 'role'>>) ?? []) {
      if (!merged.has(d.id)) merged.set(d.id, { ...d, role: roleByDocId.get(d.id) ?? 'signer' });
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Deletes a `documents` row AND its actual files in Storage — unlike
 * deleteDocumentRecord() above (user_documents, which never stores a real
 * file), this is the one that actually frees up space: original.pdf,
 * signed.pdf, and both signature images if they exist. Storage removal is
 * best-effort per path (a signer.png that was never created 404s, which
 * is fine — nothing to clean up); the DB row delete is what's protected
 * by RLS (documents_delete_own — see supabase_add_document_delete_migration.sql)
 * and is what actually determines success, so it runs last, after the
 * storage cleanup, and its result is what this function reports.
 */
export async function deleteAssociatedDocument(documentId: string): Promise<void> {
  const paths = [
    `documents/${documentId}/original.pdf`,
    `documents/${documentId}/signed.pdf`,
    `signatures/${documentId}_creator.png`,
    `signatures/${documentId}_guest.png`,
  ];
  await supabase.storage.from('documents-bucket').remove(paths).catch(() => {});

  const { error, count } = await supabase
    .from('documents')
    .delete({ count: 'exact' })
    .eq('id', documentId);
  if (error) throw new Error(`deleteAssociatedDocument: ${error.message}`);
  if (!count) throw new Error('deleteAssociatedDocument: no matching document was deleted (not found, or not yours)');
}

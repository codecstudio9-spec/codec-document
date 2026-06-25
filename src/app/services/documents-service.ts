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

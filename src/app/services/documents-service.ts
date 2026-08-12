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
import { listMySentTransactions, type SignTransaction } from './sign-transaction-service';
import { getTemplateById } from '../data/templates';
import { nombrePersonaDeValores, tituloDeDocumento } from '../utils/nombre-del-documento';

export interface UserDocument {
  id: string;
  user_id: string;
  template_id: string;
  document_name: string;
  created_at: string;
  updated_at: string;
  color: string | null;
}

/** Fixed accent-color palette — a free-text color field invites
 * inconsistent/ugly values; a small closed set keeps every document card
 * looking intentional regardless of what the user picks. */
export const DOCUMENT_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#D97706', '#16A34A', '#0891B2',
] as const;

/**
 * Deja constancia de un documento generado, para «Mis documentos» y para los
 * recientes del inicio.
 *
 * Se llama desde varios momentos del recorrido —al enviar a firmar, al
 * descargar el PDF— y el mismo documento pasa por más de uno. De ahí la
 * comprobación previa: sin ella, generar y luego descargar dejaba la misma
 * carta dos veces en la lista. La ventana de seis horas acota la búsqueda a la
 * sesión de trabajo actual; alguien que genere el mismo documento la semana
 * siguiente sí quiere verlo aparecer otra vez.
 *
 * El error se registra en consola. Antes se descartaba en silencio —ni
 * comprobación ni log— así que un fallo de permisos dejaba la lista vacía sin
 * ninguna pista de por qué.
 */
export async function saveDocumentRecord(
  userId: string,
  templateId: string,
  documentName: string,
): Promise<void> {
  const desde = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: yaEsta } = await supabase
    .from('user_documents')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .eq('document_name', documentName)
    .gte('created_at', desde)
    .limit(1);
  if (yaEsta && yaEsta.length > 0) return;

  const { error } = await supabase.from('user_documents').insert({
    user_id: userId,
    template_id: templateId,
    document_name: documentName,
  });
  if (error) console.error('saveDocumentRecord: no se pudo guardar:', error);
}

export async function fetchUserDocuments(userId: string): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchUserDocuments: query failed:', error); return []; }
  return (data as UserDocument[]) ?? [];
}

// Goes through a SECURITY DEFINER RPC (update_user_document_details) — a
// raw `.update()` matching 0 rows (wrong owner, or no UPDATE policy)
// reports success with no error, so a silent RLS mismatch could leave a
// rename looking like it worked when it never touched the row. See
// supabase_add_document_name_color_migration.sql.
export async function renameDocument(documentId: string, newName: string, color: string | null = null): Promise<void> {
  await updateUserDocumentDetails(documentId, newName, color);
}

// `name`/`color` are the FULL desired state, not a partial patch — pass
// the current value for whichever one isn't changing.
export async function updateUserDocumentDetails(
  documentId: string,
  name: string,
  color: string | null,
): Promise<void> {
  const { data, error } = await supabase.rpc('update_user_document_details', {
    p_document_id: documentId,
    p_name: name,
    p_color: color,
  });
  if (error) throw new Error(`updateUserDocumentDetails: ${error.message}`);
  if (!data) throw new Error('updateUserDocumentDetails: document not found, or not yours');
}

export async function updateAssociatedDocumentDetails(
  documentId: string,
  name: string,
  color: string | null,
): Promise<void> {
  const { data, error } = await supabase.rpc('update_document_details', {
    p_document_id: documentId,
    p_name: name,
    p_color: color,
  });
  if (error) throw new Error(`updateAssociatedDocumentDetails: ${error.message}`);
  if (!data) throw new Error('updateAssociatedDocumentDetails: document not found, or not yours');
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
  color: string | null;
  /** A dónde lleva al abrirlo, cuando no hay un PDF guardado que abrir — los
   *  documentos enviados a firmar se arman en su propia pantalla. */
  href?: string;
}

const DOC_COLUMNS = 'id, name, status, original_pdf_url, signed_pdf_url, created_at, color';

/**
 * Los documentos enviados a firmar, con la forma que ya renderizan las listas.
 *
 * Es la tercera fuente de «Mis documentos», y la que faltaba. Las otras dos
 * —`user_documents` y `documents`— sólo se escriben en momentos concretos del
 * recorrido, así que un documento enviado a firmar no aparecía en ninguna: el
 * caso más común del producto era justo el que no dejaba rastro.
 *
 * Se leen de `sign_transactions`, que es donde el documento existe de verdad.
 * Eso hace aparecer también los de días anteriores, sin migrar ni rellenar
 * nada: la fila siempre estuvo ahí, nadie la estaba mirando.
 *
 * El `id` lleva prefijo porque estas filas se mezclan con las de `documents` en
 * la misma lista y podrían colisionar en la clave de React.
 */
export async function fetchSignTransactionsAsDocuments(userId: string): Promise<AssociatedDocument[]> {
  if (!userId) return [];
  const txs = await listMySentTransactions(userId, 60).catch((err) => {
    console.error('fetchSignTransactionsAsDocuments:', err);
    return [] as SignTransaction[];
  });

  return txs.map((tx) => {
    const datos = (tx.document_data ?? {}) as Record<string, string | number | boolean>;
    const nombrePlantilla = getTemplateById(tx.document_type)?.name ?? tx.document_type;
    return {
      id: `tx:${tx.id}`,
      name: tituloDeDocumento(nombrePlantilla, nombrePersonaDeValores(datos), 'es'),
      status: tx.status,
      original_pdf_url: null,
      // No hay PDF guardado: el documento se arma al abrirlo. La pantalla de
      // firma es la que sabe hacerlo, y sirve tanto para verlo como para
      // descargarlo.
      signed_pdf_url: null,
      created_at: tx.created_at,
      role: 'owner',
      color: null,
      href: `/sign/${tx.id}`,
    } as AssociatedDocument & { href: string };
  });
}

// Signed documents are kept for 30 days from creation, then dropped from
// the dashboard list — long enough to download/share, short enough that
// the list doesn't accumulate old paperwork forever. Only applies to
// completed (signed) documents; drafts and pending ones never expire this
// way. This only hides them from THIS list — the row/files aren't
// deleted, so the audit trail and the original signing link still work.
const SIGNED_DOCUMENT_TTL_DAYS = 30;

export function getSignedDocumentExpiry(doc: { status: string; created_at: string }): { expiresAt: Date; daysLeft: number; expired: boolean } | null {
  if (doc.status !== 'completed') return null;
  const created = new Date(doc.created_at).getTime();
  if (Number.isNaN(created)) return null;
  const expiresAt = new Date(created + SIGNED_DOCUMENT_TTL_DAYS * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return { expiresAt, daysLeft, expired: daysLeft <= 0 };
}

export async function fetchAssociatedDocuments(userId: string): Promise<AssociatedDocument[]> {
  const [ownedRes, linksRes, enviados] = await Promise.all([
    supabase.from('documents').select(DOC_COLUMNS).eq('user_id', userId),
    supabase.from('profile_documents').select('document_id, role, associated_at').eq('profile_id', userId),
    // Los enviados a firmar entran AQUÍ y no en cada pantalla: media docena de
    // vistas llaman a esta función, y añadirlos una por una dejaría el mismo
    // hueco abierto en la siguiente que se escriba.
    fetchSignTransactionsAsDocuments(userId),
  ]);

  // A query error here (e.g. a column the frontend expects doesn't exist
  // in the live schema) used to be swallowed by the `?? []` fallback below
  // — the list just rendered as "nothing here yet" even for an account
  // with real completed documents, with zero trace in the console. Logging
  // it doesn't fix the underlying issue by itself, but it turns "silently
  // empty" into something that's actually debuggable next time.
  if (ownedRes.error) console.error('fetchAssociatedDocuments: owned query failed:', ownedRes.error);
  if (linksRes.error) console.error('fetchAssociatedDocuments: links query failed:', linksRes.error);

  const merged = new Map<string, AssociatedDocument>();

  for (const d of (ownedRes.data as Array<Omit<AssociatedDocument, 'role'>>) ?? []) {
    merged.set(d.id, { ...d, role: 'owner' });
  }

  for (const d of enviados) merged.set(d.id, d);

  const links = linksRes.data ?? [];
  if (!linksRes.error && links.length > 0) {
    const documentIds = links.map((l) => l.document_id as string);
    const { data: linkedDocs } = await supabase.from('documents').select(DOC_COLUMNS).in('id', documentIds);
    const roleByDocId = new Map(links.map((l) => [l.document_id as string, l.role as string]));
    for (const d of (linkedDocs as Array<Omit<AssociatedDocument, 'role'>>) ?? []) {
      if (!merged.has(d.id)) merged.set(d.id, { ...d, role: roleByDocId.get(d.id) ?? 'signer' });
    }
  }

  return Array.from(merged.values())
    .filter((d) => !getSignedDocumentExpiry(d)?.expired)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
 *
 * The guest-signing flow (guest-sign-page.tsx) writes its final compiled
 * PDF under a timestamped name (`signed-<ts>.pdf`), not the fixed
 * `signed.pdf` the creator's own flow uses — anon storage RLS on this
 * bucket only grants INSERT, never UPDATE/DELETE, so a guest overwriting
 * the creator's already-existing `signed.pdf` 403s (confirmed live).
 * A fixed-name guess here would miss that file, so the `documents/`
 * folder is listed and every real object under it is removed instead of
 * guessing two hardcoded names.
 */
export async function deleteAssociatedDocument(documentId: string): Promise<void> {
  const folder = `documents/${documentId}`;
  const { data: listed } = await supabase.storage.from('documents-bucket').list(folder).catch(() => ({ data: null }));
  const paths = [
    ...(listed ?? []).map((f) => `${folder}/${f.name}`),
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

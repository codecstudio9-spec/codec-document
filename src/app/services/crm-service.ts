/**
 * Fase 4 del modulo empresarial — CRM basico. Los contactos se
 * auto-completan server-side (trigger sobre `signers`, ver
 * supabase_add_crm_contacts_migration.sql) cada vez que alguien firma
 * un documento que generaste — no hay que "agregarlos a mano" para que
 * empiecen a aparecer aqui.
 */
import { supabase } from '../../lib/supabase';

export interface Contact {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  documents_sent: number;
  documents_signed: number;
  last_activity_at: string | null;
}

export async function getMyContacts(): Promise<Contact[]> {
  const { data, error } = await supabase.rpc('get_my_contacts');
  if (error || !data) return [];
  return data as Contact[];
}

export async function updateContactNotes(contactId: string, notes: string, phone?: string, company?: string): Promise<void> {
  const { error } = await supabase.rpc('update_contact_notes', {
    p_contact_id: contactId, p_notes: notes, p_phone: phone || null, p_company: company || null,
  });
  if (error) throw new Error(`updateContactNotes: ${error.message}`);
}

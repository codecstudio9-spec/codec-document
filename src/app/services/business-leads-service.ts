/**
 * Business Intelligence (solo admin) — leads del formulario "Soluciones
 * para Empresas" de la landing. El INSERT público pasa por
 * submit_business_lead() (SECURITY DEFINER); la lectura/actualización solo
 * la puede hacer la cuenta admin, vía get_business_leads()/
 * update_lead_status() (ver supabase_add_business_intelligence_migration.sql).
 */
import { supabase, publicSupabase } from '../../lib/supabase';

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';

export interface BusinessLead {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string;
  phone: string | null;
  employees: string | null;
  country: string | null;
  city: string | null;
  language: 'es' | 'en' | null;
  message: string | null;
  status: LeadStatus;
}

let geoCache: { country: string | null; city: string | null } | null = null;

/** Same ipwho.is lookup already used independently in analytics-service.ts,
 * geo.ts and language-context.tsx — kept as its own small call here rather
 * than importing a private helper from another module. */
async function resolveLeadGeo(): Promise<{ country: string | null; city: string | null }> {
  if (geoCache) return geoCache;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timeout);
    const data = await res.json() as { success?: boolean; country?: string; city?: string };
    geoCache = data?.success ? { country: data.country ?? null, city: data.city ?? null } : { country: null, city: null };
  } catch {
    geoCache = { country: null, city: null };
  }
  return geoCache;
}

export interface SubmitLeadInput {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  employees: string;
  country: string;
  message: string;
  language: 'es' | 'en';
}

export async function submitBusinessLead(input: SubmitLeadInput): Promise<void> {
  // City comes from IP geolocation (not asked in the form); country is
  // whatever the lead typed themselves — more accurate than IP for a B2B
  // inquiry (e.g. a reseller in the US asking on behalf of an office in
  // Colombia), so the declared value wins over the detected one.
  const geo = await resolveLeadGeo();
  const { error } = await publicSupabase.rpc('submit_business_lead', {
    p_name: input.name,
    p_company: input.company || null,
    p_position: input.position || null,
    p_email: input.email,
    p_phone: input.phone || null,
    p_employees: input.employees || null,
    p_country: input.country || geo.country,
    p_city: geo.city,
    p_language: input.language,
    p_message: input.message || null,
  });
  if (error) throw new Error(error.message);
}

export async function fetchBusinessLeads(): Promise<BusinessLead[]> {
  const { data, error } = await supabase.rpc('get_business_leads');
  if (error || !data) return [];
  return data as BusinessLead[];
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.rpc('update_lead_status', { p_id: id, p_status: status });
  if (error) throw new Error(error.message);
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, { en: string; es: string; color: string }> = {
  new: { en: 'New', es: 'Nuevo', color: '#2563EB' },
  contacted: { en: 'Contacted', es: 'Contactado', color: '#F59E0B' },
  negotiating: { en: 'Negotiating', es: 'En negociación', color: '#7C3AED' },
  closed: { en: 'Closed', es: 'Cerrado', color: '#10B981' },
  lost: { en: 'Lost', es: 'Perdido', color: '#EF4444' },
};

/** Client-side CSV export — no server round-trip needed, the admin already
 * has the full leads array loaded from fetchBusinessLeads(). */
export function leadsToCsv(leads: BusinessLead[]): string {
  const headers = ['Fecha', 'Nombre', 'Empresa', 'Cargo', 'Correo', 'Teléfono', 'Empleados', 'País', 'Ciudad', 'Idioma', 'Estado', 'Mensaje'];
  const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const rows = leads.map((l) => [
    new Date(l.created_at).toISOString(),
    l.name, l.company, l.position, l.email, l.phone, l.employees, l.country, l.city,
    l.language, LEAD_STATUS_LABELS[l.status].es, l.message,
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

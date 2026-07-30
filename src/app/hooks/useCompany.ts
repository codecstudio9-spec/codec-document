import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { getMyCompany, type MyCompany, type CompanyRole } from '../services/company-service';

/**
 * Resolves once per session "does the current user belong to a company,
 * and are they an admin or a regular employee" — so any page can cheaply
 * gate UI (e.g. hide "Company Settings" from non-admins) instead of
 * calling get_my_company_full ad-hoc wherever that's needed. Mirrors the
 * two-tier split actually enforced in RLS/RPCs (see
 * supabase_add_company_workspace_migration.sql and
 * 20260730001000_add_company_document_scoping.sql): owner/admin = company
 * admin, manager/user = regular employee.
 */
export function useCompany() {
  const { user } = useAuth();
  const [data, setData] = useState<MyCompany | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    if (!user?.id) { setData(null); return; }
    let cancelled = false;
    getMyCompany().then((result) => { if (!cancelled) setData(result); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const role: CompanyRole | null = data?.myRole ?? null;
  const isCompanyAdmin = role === 'owner' || role === 'admin';

  return {
    loading: data === undefined,
    company: data?.company ?? null,
    role,
    isCompanyAdmin,
    members: data?.members ?? [],
  };
}

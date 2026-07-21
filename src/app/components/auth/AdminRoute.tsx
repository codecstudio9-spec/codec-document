import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/auth-context';

/** `allowAnalyticsViewer`: also lets in emails granted analytics-only
 * access (see analytics-admin-service.ts) — used solely by the two
 * /admin/analytics routes. Every other AdminRoute-wrapped page stays
 * isAdmin-only. */
export function AdminRoute({ children, allowAnalyticsViewer = false }: { children: ReactNode; allowAnalyticsViewer?: boolean }) {
  const { user, isAdmin, isAnalyticsAdmin, loading } = useAuth();

  if (loading) return null;
  const permitted = isAdmin || (allowAnalyticsViewer && isAnalyticsAdmin);
  if (!user || !permitted) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/auth-context';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

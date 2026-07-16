import { Link, useLocation } from 'react-router';
import { Home, FileText, PenLine, FolderOpen, User } from 'lucide-react';

const TABS = [
  { to: '/app', label: 'Inicio', icon: Home },
  { to: '/app/templates', label: 'Plantillas', icon: FileText },
  { to: '/app/signatures', label: 'Firmas', icon: PenLine },
  { to: '/app/documents', label: 'Documentos', icon: FolderOpen },
  { to: '/app/profile', label: 'Perfil', icon: User },
] as const;

/**
 * Fixed bottom tab bar for the mobile app shell — persists across
 * /app/* navigation. `/app` itself only matches exactly (not as a prefix
 * of every other /app/* tab), everything else matches by prefix.
 */
export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-slate-100 bg-white/95 backdrop-blur-xl"
      style={{
        height: 72,
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.08)',
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => {
        const active = to === '/app' ? pathname === '/app' : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition active:scale-95"
          >
            <Icon
              className="size-5 transition-colors"
              style={{ color: active ? '#2563EB' : '#9CA3AF' }}
              strokeWidth={active ? 2.4 : 2}
            />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{ color: active ? '#2563EB' : '#9CA3AF' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

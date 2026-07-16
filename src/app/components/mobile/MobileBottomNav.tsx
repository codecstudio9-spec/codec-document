import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Home, FileText, PenLine, FolderOpen, User } from 'lucide-react';
import { GLASS_SURFACE } from '../../styles/mobile-theme';

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
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/60"
      style={{
        ...GLASS_SURFACE,
        height: 72,
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: '0 -16px 40px rgba(15,23,42,0.10)',
      }}
    >
      {TABS.map(({ to, label, icon: Icon }) => {
        const active = to === '/app' ? pathname === '/app' : pathname.startsWith(to);
        return (
          <Link key={to} to={to} className="relative flex flex-1 flex-col items-center justify-center gap-1">
            <motion.div whileTap={{ scale: 0.88 }} className="relative flex flex-col items-center gap-1">
              {active && (
                <motion.span
                  layoutId="mobile-nav-active-glow"
                  className="absolute -top-2 size-8 rounded-full"
                  style={{ background: 'rgba(37,99,235,0.14)', filter: 'blur(2px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className="relative size-5 transition-colors"
                style={{ color: active ? '#2563EB' : '#9CA3AF' }}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className="relative text-[10px] font-semibold transition-colors"
                style={{ color: active ? '#2563EB' : '#9CA3AF' }}
              >
                {label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

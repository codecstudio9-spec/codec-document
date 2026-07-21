import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Home, FileText, PenLine, LayoutTemplate, FolderOpen, Sparkles, Settings, User, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { Logo } from '../brand/Logo';

const NAV_ITEMS = [
  { to: '/dashboard', labelEs: 'Dashboard', labelEn: 'Dashboard', icon: Home },
  { to: '/dashboard/documents', labelEs: 'Mis Documentos', labelEn: 'My Documents', icon: FileText },
  { to: '/dashboard/signatures', labelEs: 'Firmas', labelEn: 'Signatures', icon: PenLine },
  { to: '/dashboard/templates', labelEs: 'Plantillas', labelEn: 'Templates', icon: LayoutTemplate },
  { to: '/my-templates', labelEs: 'Mis Plantillas', labelEn: 'My Templates', icon: FolderOpen },
  { to: '/dashboard/ai', labelEs: 'Asistente IA', labelEn: 'AI Assistant', icon: Sparkles },
  { to: '/dashboard/settings', labelEs: 'Configuración', labelEn: 'Settings', icon: Settings },
] as const;

const ADMIN_NAV_ITEM = {
  to: '/dashboard/admin/analytics', labelEs: 'Analytics', labelEn: 'Analytics', icon: BarChart3,
} as const;

/** Fixed 280px sidebar for the /dashboard/* private app — the desktop
 * counterpart to MobileBottomNav, same active-tab-by-pathname logic. */
export function DesktopSidebar() {
  const { pathname } = useLocation();
  const { user, isAdmin, isAnalyticsAdmin, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const navItems = (isAdmin || isAnalyticsAdmin) ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200/70 bg-white/90"
      style={{ width: 280, backdropFilter: 'blur(12px)' }}
    >
      <div className="px-6 pb-5 pt-7">
        <Logo size="md" tagline={language === 'en' ? 'Legal Document Platform' : 'Plataforma de Documentos Legales'} href="" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, labelEs, labelEn, icon: Icon }) => {
          const label = language === 'en' ? labelEn : labelEs;
          const active = to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(to);
          return (
            <Link key={to} to={to} className="relative block">
              <motion.div
                whileHover={{ x: active ? 0 : 2 }}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors"
                style={active
                  ? { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#fff', boxShadow: '0 8px 20px rgba(37,99,235,0.28)' }
                  : { color: '#475569' }}
              >
                <Icon className="size-4.5 shrink-0" />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-3 py-4 space-y-1">
        <Link
          to="/dashboard/profile"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          {user?.picture ? (
            <img src={user.picture} alt={user.name || 'Perfil'} referrerPolicy="no-referrer" className="size-6 shrink-0 rounded-full object-cover" />
          ) : (
            <User className="size-4.5 shrink-0" />
          )}
          <span className="truncate">{user?.name || (language === 'en' ? 'My account' : 'Mi cuenta')}</span>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
        >
          <LogOut className="size-4.5 shrink-0" />
          {language === 'en' ? 'Sign out' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}

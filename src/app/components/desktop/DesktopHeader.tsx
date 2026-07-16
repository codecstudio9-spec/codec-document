import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { fetchUnreadSignedCount } from '../../services/mobile-dashboard-service';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Minimal top header for /dashboard/* — greeting on the left, real
 * notifications + avatar on the right. Reuses fetchUnreadSignedCount,
 * the same honest "documents signed that you haven't opened yet" signal
 * already built for the mobile bell. */
export function DesktopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const firstName = (user?.name || user?.email || '').split(' ')[0].split('@')[0];

  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadSignedCount(user.id).then(setUnreadCount).catch(() => setUnreadCount(0));
  }, [user?.id]);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/70 px-8" style={{ backdropFilter: 'blur(12px)' }}>
      <div>
        <p className="text-lg font-black text-slate-900">{greeting()}, {firstName || 'bienvenido'}</p>
        <p className="text-xs text-slate-400">Codec Document</p>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => navigate('/dashboard/notifications')}
          className="relative flex size-11 items-center justify-center rounded-2xl bg-white"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
        >
          <Bell className="size-4.5 text-slate-500" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
              style={{ height: 18, background: '#EF4444' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/dashboard/profile')}
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
        >
          {user?.picture ? (
            <img src={user.picture} alt={user.name || 'Perfil'} referrerPolicy="no-referrer" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-black text-slate-400">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
          )}
        </button>
      </div>
    </header>
  );
}

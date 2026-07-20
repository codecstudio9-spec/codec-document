import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, Upload, Receipt, FileText, PenLine, ArrowRight, Check, Clock, FolderOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { Logo } from '../../components/brand/Logo';
import { MobileLandingIntro } from '../../components/mobile/MobileLandingIntro';
import { fetchDashboardStats, fetchUnreadSignedCount, type DashboardStats } from '../../services/mobile-dashboard-service';
import { fetchUserDocuments, fetchAssociatedDocuments, type UserDocument, type AssociatedDocument } from '../../services/documents-service';
import { BLUE_GRADIENT, DARK_GRADIENT, CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

function greeting(language: 'en' | 'es'): string {
  const h = new Date().getHours();
  if (language === 'en') {
    if (h < 12) return 'Good morning';
    if (h < 19) return 'Good afternoon';
    return 'Good evening';
  }
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

type RecentItem = { id: string; name: string; status: string; date: string; href: string };

function statusLabel(status: string, language: 'en' | 'es'): { text: string; color: string; bg: string } {
  if (status === 'completed') return { text: language === 'en' ? 'Signed' : 'Firmado', color: '#10B981', bg: '#ECFDF5' };
  if (!status || status === 'pending' || status === 'draft') return { text: language === 'en' ? 'Draft' : 'Borrador', color: '#F59E0B', bg: '#FFFBEB' };
  return { text: language === 'en' ? 'Pending' : 'Pendiente', color: '#F59E0B', bg: '#FFFBEB' };
}

function StatColumn({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex-1 text-center">
      {value === null ? (
        <div className="mx-auto mb-1.5 h-7 w-8 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="text-2xl font-black text-white">{value}</p>
      )}
      <p className="mt-0.5 text-[11px] font-medium text-white/50">{label}</p>
    </div>
  );
}

export function MobileDashboardHome() {
  return (
    <MobileAppShell>
      <DashboardContent />
    </MobileAppShell>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentItem[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const firstName = (user?.name || user?.email || (language === 'en' ? 'there' : 'ahí')).split(' ')[0].split('@')[0];

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardStats(user.id).then(setStats).catch(() => setStats({ documentsCreated: 0, pending: 0, signed: 0, templatesUsed: 0 }));
    fetchUnreadSignedCount(user.id).then(setUnreadCount).catch(() => setUnreadCount(0));

    Promise.all([
      fetchUserDocuments(user.id).catch(() => [] as UserDocument[]),
      fetchAssociatedDocuments(user.id).catch(() => [] as AssociatedDocument[]),
    ]).then(([own, associated]) => {
      const combined: RecentItem[] = [
        ...own.map((d) => ({ id: d.id, name: d.document_name, status: 'draft', date: d.created_at, href: `/preview/${d.template_id}` })),
        ...associated.map((d) => ({ id: d.id, name: d.name, status: d.status, date: d.created_at, href: d.signed_pdf_url || d.original_pdf_url || '' })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecent(combined);
    });
  }, [user?.id]);

  // Signed-out visitor: this IS the mobile home screen for them too — a
  // compact intro instead of personalized stats, but still inside the
  // app shell (bottom nav visible, real view navigation, no marketing
  // scroll page underneath).
  if (!user) {
    return (
      <div>
        <div className="flex items-center justify-between px-4 pt-5">
          <Logo size="sm" tagline={language === 'en' ? 'Legal · Signatures · Verification' : 'Legal · Firmas · Verificación'} href="" />
        </div>
        <MobileLandingIntro />
      </div>
    );
  }

  return (
    <div className="px-4 pt-5">
      {/* Header — Part 4: wordmark + tagline + more breathing room */}
      <div className="flex items-center justify-between">
        <Logo size="sm" tagline={language === 'en' ? 'Legal · Signatures · Verification' : 'Legal · Firmas · Verificación'} href="" />
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => navigate('/app/profile/notifications')}
            className="relative flex size-10 items-center justify-center rounded-2xl bg-white"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <motion.div
              animate={unreadCount > 0 ? { rotate: [0, -14, 11, -8, 5, -2, 0] } : { rotate: 0 }}
              transition={unreadCount > 0 ? { duration: 0.7, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' } : undefined}
            >
              <Bell className="size-4.5 text-slate-500" />
            </motion.div>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -right-1 -top-1 flex min-w-[17px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-white"
                  style={{ height: 17, background: '#EF4444' }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: '#EF4444' }}
                    animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => navigate('/app/profile')}
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
            style={{ boxShadow: CARD_SHADOW }}
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name || 'Profile'} className="size-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-sm font-black text-slate-400">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-xl font-black" style={{ color: '#111827' }}>
          {language === 'en' ? `Hi ${firstName}` : `Hola ${firstName}`} 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{greeting(language)}</p>
      </div>

      {/* Stats — dark highlighted panel (Revolut/Stripe-style summary
          block) instead of 3 separate white cards, so the screen actually
          mixes light + blue + dark instead of staying all-white. */}
      <div
        className="mt-5 flex gap-3 px-2 py-5"
        style={{ background: DARK_GRADIENT, borderRadius: CARD_RADIUS, boxShadow: '0 20px 40px rgba(15,23,42,0.22)' }}
      >
        <StatColumn value={stats?.documentsCreated ?? null} label={language === 'en' ? 'Documents' : 'Documentos'} />
        <div className="w-px bg-white/10" />
        <StatColumn value={stats?.pending ?? null} label={language === 'en' ? 'Pending' : 'Pendientes'} />
        <div className="w-px bg-white/10" />
        <StatColumn value={stats?.signed ?? null} label={language === 'en' ? 'Signed' : 'Firmados'} />
      </div>

      {/* Quick actions */}
      <div className="mt-6 space-y-2.5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/app/templates')}
          className="flex w-full items-center justify-center gap-2 text-white"
          style={{
            background: BLUE_GRADIENT,
            borderRadius: 16,
            height: 56,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: '0 14px 28px rgba(37,99,235,0.35)',
          }}
        >
          <Plus className="size-5" /> {language === 'en' ? 'Create document' : 'Crear documento'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/firma-electronica')}
          className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700"
          style={{ borderRadius: 16, height: 52, fontWeight: 600, fontSize: 14 }}
        >
          <Upload className="size-4" /> {language === 'en' ? 'Sign a document' : 'Firmar documento'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/my-quotes')}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden text-white"
          style={{
            borderRadius: 16, height: 52, fontWeight: 700, fontSize: 14,
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
            boxShadow: '0 10px 22px rgba(67,56,202,0.32)',
          }}
        >
          <Receipt className="size-4" />
          {language === 'en' ? 'Smart Quotes' : 'Cotizaciones Inteligentes'}
          <span className="absolute right-3 flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
            <Sparkles className="size-2.5" /> {language === 'en' ? 'New' : 'Nuevo'}
          </span>
        </motion.button>
      </div>

      {/* Custom templates promo */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => navigate('/my-templates')}
        className="mt-4 flex w-full items-center gap-3 p-4 text-left"
        style={{ borderRadius: CARD_RADIUS, background: 'linear-gradient(135deg,#312e81,#1e1b4b)' }}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <FolderOpen className="size-5 text-indigo-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{language === 'en' ? 'Upload your own templates' : 'Sube tus propias plantillas'}</p>
          <p className="mt-0.5 text-xs text-white/50">{language === 'en' ? 'Mark the fields once, reuse forever' : 'Marca los campos una vez, reúsalo siempre'}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-white/40" />
      </motion.button>

      {/* Recent documents */}
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{language === 'en' ? 'Recent documents' : 'Documentos recientes'}</h2>
          <button type="button" onClick={() => navigate('/app/documents')} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
            {language === 'en' ? 'View all' : 'Ver todos'} <ArrowRight className="size-3" />
          </button>
        </div>

        {recent === null ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white px-4 py-8 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <FileText className="mx-auto mb-2 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">{language === 'en' ? "You don't have any documents yet" : 'Aún no tienes documentos'}</p>
            <p className="mt-0.5 text-xs text-slate-400">{language === 'en' ? 'Create your first one above' : 'Crea el primero desde arriba'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map((doc) => {
              const s = statusLabel(doc.status, language);
              const openDoc = () => {
                if (!doc.href) return;
                if (doc.href.startsWith('http')) window.open(doc.href, '_blank', 'noopener,noreferrer');
                else navigate(doc.href);
              };
              return (
                <motion.button
                  key={doc.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={openDoc}
                  disabled={!doc.href}
                  className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left disabled:opacity-70"
                  style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <PenLine className="size-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.text} · {new Date(doc.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: s.bg }}
                  >
                    {doc.status === 'completed'
                      ? <Check className="size-3.5" style={{ color: s.color }} />
                      : <Clock className="size-3.5" style={{ color: s.color }} />}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

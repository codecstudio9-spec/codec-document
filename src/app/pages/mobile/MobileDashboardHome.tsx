import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Bell, Plus, Upload, Camera, FileText, PenLine, ArrowRight, Check, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { Logo } from '../../components/brand/Logo';
import { MobileLandingIntro } from '../../components/mobile/MobileLandingIntro';
import { fetchDashboardStats, type DashboardStats } from '../../services/mobile-dashboard-service';
import { fetchUserDocuments, fetchAssociatedDocuments, type UserDocument, type AssociatedDocument } from '../../services/documents-service';
import { toast } from 'sonner';
import { BLUE_GRADIENT, DARK_GRADIENT, CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

type RecentItem = { id: string; name: string; status: string; date: string; href: string };

function statusLabel(status: string): { text: string; color: string; bg: string } {
  if (status === 'completed') return { text: 'Firmado', color: '#10B981', bg: '#ECFDF5' };
  if (!status || status === 'pending' || status === 'draft') return { text: 'Borrador', color: '#F59E0B', bg: '#FFFBEB' };
  return { text: 'Pendiente', color: '#F59E0B', bg: '#FFFBEB' };
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentItem[] | null>(null);

  const firstName = (user?.name || user?.email || 'ahí').split(' ')[0].split('@')[0];

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardStats(user.id).then(setStats).catch(() => setStats({ documentsCreated: 0, pending: 0, signed: 0 }));

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

  const handleScan = (file?: File | null) => {
    if (!file) return;
    toast.success('Foto capturada. Continúa desde "Subir documento".');
    navigate('/firma-electronica');
  };

  // Signed-out visitor: this IS the mobile home screen for them too — a
  // compact intro instead of personalized stats, but still inside the
  // app shell (bottom nav visible, real view navigation, no marketing
  // scroll page underneath).
  if (!user) {
    return (
      <div>
        <div className="flex items-center justify-between px-4 pt-5">
          <Logo size="sm" tagline="Legal · Firmas · Verificación" href="" />
        </div>
        <MobileLandingIntro />
      </div>
    );
  }

  return (
    <div className="px-4 pt-5">
      {/* Header — Part 4: wordmark + tagline + more breathing room */}
      <div className="flex items-center justify-between">
        <Logo size="sm" tagline="Legal · Firmas · Verificación" href="" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          className="relative flex size-10 items-center justify-center rounded-2xl bg-white"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <Bell className="size-4.5 text-slate-500" />
        </motion.button>
      </div>

      <div className="mt-6">
        <h1 className="text-xl font-black" style={{ color: '#111827' }}>Hola {firstName} 👋</h1>
        <p className="mt-0.5 text-sm text-slate-500">{greeting()}</p>
      </div>

      {/* Stats — dark highlighted panel (Revolut/Stripe-style summary
          block) instead of 3 separate white cards, so the screen actually
          mixes light + blue + dark instead of staying all-white. */}
      <div
        className="mt-5 flex gap-3 px-2 py-5"
        style={{ background: DARK_GRADIENT, borderRadius: CARD_RADIUS, boxShadow: '0 20px 40px rgba(15,23,42,0.22)' }}
      >
        <StatColumn value={stats?.documentsCreated ?? null} label="Documentos" />
        <div className="w-px bg-white/10" />
        <StatColumn value={stats?.pending ?? null} label="Pendientes" />
        <div className="w-px bg-white/10" />
        <StatColumn value={stats?.signed ?? null} label="Firmados" />
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
          <Plus className="size-5" /> Crear documento
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/firma-electronica')}
          className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700"
          style={{ borderRadius: 16, height: 52, fontWeight: 600, fontSize: 14 }}
        >
          <Upload className="size-4" /> Subir PDF
        </motion.button>

        <motion.label
          whileTap={{ scale: 0.97 }}
          className="flex w-full cursor-pointer items-center justify-center gap-2"
          style={{
            borderRadius: 16, height: 52, fontWeight: 600, fontSize: 14,
            border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857',
          }}
        >
          <Camera className="size-4" /> Escanear documento
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => handleScan(e.target.files?.[0])}
          />
        </motion.label>
      </div>

      {/* Recent documents */}
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Documentos recientes</h2>
          <button type="button" onClick={() => navigate('/app/documents')} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
            Ver todos <ArrowRight className="size-3" />
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
            <p className="text-sm font-semibold text-slate-600">Aún no tienes documentos</p>
            <p className="mt-0.5 text-xs text-slate-400">Crea el primero desde arriba</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map((doc) => {
              const s = statusLabel(doc.status);
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
                      {s.text} · {new Date(doc.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
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

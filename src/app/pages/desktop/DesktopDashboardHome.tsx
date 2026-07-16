import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { FileText, PenLine, Clock, LayoutTemplate, Plus, Send, Upload, FolderOpen, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { fetchDashboardStats, type DashboardStats } from '../../services/mobile-dashboard-service';
import { fetchUserDocuments, fetchAssociatedDocuments, type UserDocument, type AssociatedDocument } from '../../services/documents-service';
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';

type RecentItem = { id: string; name: string; status: string; date: string; href: string };

function statusBadge(status: string): { text: string; color: string; bg: string; dot: string } {
  if (status === 'completed') return { text: 'Firmado', color: '#059669', bg: '#ECFDF5', dot: '#10B981' };
  if (!status || status === 'draft') return { text: 'Borrador', color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' };
  return { text: 'Pendiente', color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' };
}

function MetricCard({ icon: Icon, value, label, accent }: { icon: typeof FileText; value: number | null; label: string; accent: string }) {
  return (
    <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
      <div className="flex size-11 items-center justify-center rounded-2xl" style={{ background: `${accent}18` }}>
        <Icon className="size-5" style={{ color: accent }} />
      </div>
      {value === null ? (
        <div className="mt-4 h-8 w-12 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-sm font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function DesktopDashboardHome() {
  return (
    <DesktopAppShell>
      <DashboardHomeContent />
    </DesktopAppShell>
  );
}

function DashboardHomeContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentItem[] | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardStats(user.id).then(setStats).catch(() => setStats({ documentsCreated: 0, pending: 0, signed: 0, templatesUsed: 0 }));

    Promise.all([
      fetchUserDocuments(user.id).catch(() => [] as UserDocument[]),
      fetchAssociatedDocuments(user.id).catch(() => [] as AssociatedDocument[]),
    ]).then(([own, associated]) => {
      const combined: RecentItem[] = [
        ...own.map((d) => ({ id: d.id, name: d.document_name, status: 'draft', date: d.created_at, href: `/preview/${d.template_id}` })),
        ...associated.map((d) => ({ id: d.id, name: d.name, status: d.status, date: d.created_at, href: d.signed_pdf_url || d.original_pdf_url || '' })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
      setRecent(combined);
    });
  }, [user?.id]);

  const openDoc = (href: string) => {
    if (!href) return;
    if (href.startsWith('http')) window.open(href, '_blank', 'noopener,noreferrer');
    else navigate(href);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-5">
        <MetricCard icon={FileText} value={stats?.documentsCreated ?? null} label="Documentos creados" accent="#2563EB" />
        <MetricCard icon={Check} value={stats?.signed ?? null} label="Firmas completadas" accent="#10B981" />
        <MetricCard icon={Clock} value={stats?.pending ?? null} label="Pendientes" accent="#F59E0B" />
        <MetricCard icon={LayoutTemplate} value={stats?.templatesUsed ?? null} label="Plantillas utilizadas" accent="#7C3AED" />
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { icon: Plus, label: 'Crear Documento', onClick: () => navigate('/dashboard/templates'), primary: true },
          { icon: Send, label: 'Solicitar Firma', onClick: () => navigate('/dashboard/templates'), primary: false },
          { icon: Upload, label: 'Firmar Documento', onClick: () => navigate('/firma-electronica'), primary: false },
          { icon: FolderOpen, label: 'Ver Plantillas', onClick: () => navigate('/dashboard/templates'), primary: false },
        ].map(({ icon: Icon, label, onClick, primary }) => (
          <motion.button
            key={label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 p-5 text-left"
            style={{
              borderRadius: CARD_RADIUS,
              background: primary ? BLUE_GRADIENT : '#FFFFFF',
              boxShadow: primary ? '0 14px 28px rgba(37,99,235,0.30)' : CARD_SHADOW,
            }}
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: primary ? 'rgba(255,255,255,0.18)' : '#EFF6FF' }}
            >
              <Icon className="size-4.5" style={{ color: primary ? '#fff' : '#2563EB' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: primary ? '#fff' : '#111827' }}>{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Actividad reciente</h2>
          <button type="button" onClick={() => navigate('/dashboard/documents')} className="flex items-center gap-1 text-xs font-bold text-blue-600">
            Ver todos <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="overflow-hidden bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          {recent === null ? (
            <div className="space-y-px">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-slate-50" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FileText className="mx-auto mb-2 size-7 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">Aún no tienes documentos</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-bold">Documento</th>
                  <th className="px-6 py-3 font-bold">Estado</th>
                  <th className="px-6 py-3 font-bold">Fecha</th>
                  <th className="px-6 py-3 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((doc) => {
                  const s = statusBadge(doc.status);
                  return (
                    <tr key={doc.id} className="border-b border-slate-50 last:border-0 transition hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                            <PenLine className="size-3.5 text-indigo-500" />
                          </span>
                          <span className="max-w-[280px] truncate font-semibold text-slate-800">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: s.color, background: s.bg }}>
                          <span className="size-1.5 rounded-full" style={{ background: s.dot }} />
                          {s.text}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {new Date(doc.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openDoc(doc.href)}
                          disabled={!doc.href}
                          className="text-xs font-bold text-blue-600 disabled:text-slate-300"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

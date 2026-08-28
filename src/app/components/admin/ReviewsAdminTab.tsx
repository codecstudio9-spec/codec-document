/**
 * Moderación de reseñas — solo admin real (moderate_review/list_reviews_for_admin
 * lo verifican server-side vía is_admin_user(), esto es solo la UI). Ninguna
 * reseña llega al público hasta que se aprueba aquí. Ver
 * supabase/migrations/20260828120000_add_reviews.sql para las reglas completas.
 */
import { useCallback, useEffect, useState } from 'react';
import { Star, Loader, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { listReviewsForAdmin, moderateReview, type AdminReview } from '../../services/reviews-service';

const card = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

function StatusChip({ status, es }: { status: AdminReview['status']; es: boolean }) {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-3" /> {es ? 'Publicada' : 'Published'}</span>;
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"><XCircle className="size-3" /> {es ? 'Rechazada' : 'Rejected'}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Clock className="size-3" /> {es ? 'Pendiente' : 'Pending'}</span>;
}

export function ReviewsAdminTab({ language }: { language: 'en' | 'es' }) {
  const es = language === 'es';
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    listReviewsForAdmin().then(setReviews).catch((e) => {
      toast.error(e?.message || (es ? 'No se pudieron cargar las reseñas' : "Couldn't load reviews"));
      setReviews([]);
    });
  }, [es]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      await moderateReview(id, approve);
      toast.success(approve ? (es ? 'Reseña publicada' : 'Review published') : (es ? 'Reseña rechazada' : 'Review rejected'));
      load();
    } catch (e: any) {
      toast.error(e?.message || (es ? 'No se pudo actualizar' : "Couldn't update"));
    } finally {
      setBusyId(null);
    }
  };

  const pending = (reviews ?? []).filter((r) => r.status === 'pending');
  const decided = (reviews ?? []).filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="text-sm font-black text-slate-900">
          {es ? `Pendientes de revisión (${pending.length})` : `Pending review (${pending.length})`}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {es
            ? 'Cada una viene de un cliente verificado (ya generó un documento real). Revisa el texto antes de publicar.'
            : 'Each one comes from a verified customer (already created a real document). Review the text before publishing.'}
        </p>

        {reviews === null ? (
          <div className="mt-6 flex justify-center py-8 text-slate-400"><Loader className="size-5 animate-spin" /></div>
        ) : pending.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-slate-400">{es ? 'No hay reseñas pendientes.' : 'No pending reviews.'}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{r.authorName}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{r.body}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleString(es ? 'es-ES' : 'en-US')}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => act(r.id, true)}
                      className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      title={es ? 'Publicar' : 'Publish'}
                    >
                      {busyId === r.id ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => act(r.id, false)}
                      className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      title={es ? 'Rechazar' : 'Reject'}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <h2 className="text-sm font-black text-slate-900">{es ? 'Historial' : 'History'}</h2>
        {decided.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">{es ? 'Aún nada moderado.' : 'Nothing moderated yet.'}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.authorName} <span className="text-slate-400">· {r.rating}★</span></p>
                </div>
                <StatusChip status={r.status} es={es} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

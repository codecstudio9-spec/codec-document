/**
 * Formulario para dejar una reseña real. Solo se abre para un usuario ya
 * logueado (ver modern-home-page.tsx: si no hay sesión, se abre
 * OnboardingModal en su lugar). El backend (submit_review, ver
 * supabase/migrations/20260828120000_add_reviews.sql) es quien de verdad
 * decide si la persona "califica" — ya generó al menos un documento real —
 * este componente solo muestra el mensaje de error si no califica todavía.
 */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Star, X, Loader, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { getMyReview, submitReview, type AdminReview } from '../services/reviews-service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'es';
  /** Called after a successful submit so the homepage can refresh its
   * approved-reviews list (won't include the new one yet — it's pending —
   * but keeps the summary/count logic simple to re-check later). */
  onSubmitted?: () => void;
}

const t = (language: 'en' | 'es', en: string, es: string) => (language === 'en' ? en : es);

export function ReviewFormModal({ open, onOpenChange, language, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<AdminReview | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecking(true);
    setSubmitted(false);
    setAuthorName(user?.name || user?.email?.split('@')[0] || '');
    getMyReview()
      .then(setExisting)
      .catch(() => setExisting(null))
      .finally(() => setChecking(false));
  }, [open, user]);

  const close = () => onOpenChange(false);

  const handleSubmit = async () => {
    if (body.trim().length < 10) {
      toast.error(t(language, 'Tell us a bit more about your experience.', 'Cuéntanos un poco más sobre tu experiencia.'));
      return;
    }
    if (authorName.trim().length < 2) {
      toast.error(t(language, 'Enter your name.', 'Escribe tu nombre.'));
      return;
    }
    setLoading(true);
    try {
      await submitReview(rating, body.trim(), authorName.trim());
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e?.message || t(language, "Couldn't submit your review", 'No se pudo enviar tu reseña'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/98 shadow-[0_0_100px_rgba(99,102,241,0.3)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>

          <div className="relative p-8">
            {checking ? (
              <div className="flex flex-col items-center gap-3 py-8 text-white/50">
                <Loader className="size-5 animate-spin" />
                <p className="text-sm">{t(language, 'Loading…', 'Cargando…')}</p>
              </div>
            ) : submitted || existing?.status === 'pending' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Clock className="size-10 text-amber-400" />
                <h3 className="text-lg font-black text-white">{t(language, 'Thanks — under review', 'Gracias, en revisión')}</h3>
                <p className="text-sm text-white/50">
                  {t(
                    language,
                    "We manually check every review before it goes live, so it doesn't show up instantly. We'll publish it soon.",
                    'Revisamos cada reseña a mano antes de publicarla, por eso no aparece de inmediato. La publicaremos pronto.',
                  )}
                </p>
                <button type="button" onClick={close} className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                  {t(language, 'Got it', 'Entendido')}
                </button>
              </div>
            ) : existing?.status === 'approved' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="size-10 text-emerald-400" />
                <h3 className="text-lg font-black text-white">{t(language, 'Your review is live', 'Tu reseña ya está publicada')}</h3>
                <p className="text-sm text-white/50">{t(language, 'Thanks for sharing your experience.', 'Gracias por compartir tu experiencia.')}</p>
                <button type="button" onClick={close} className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                  {t(language, 'Close', 'Cerrar')}
                </button>
              </div>
            ) : existing?.status === 'rejected' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <XCircle className="size-10 text-rose-400" />
                <h3 className="text-lg font-black text-white">{t(language, "Wasn't published", 'No se publicó')}</h3>
                <p className="text-sm text-white/50">{existing.adminNote || t(language, "This review didn't meet our guidelines. Contact support if you think this is a mistake.", 'Esta reseña no cumplió nuestras pautas. Escribe a soporte si crees que es un error.')}</p>
                <button type="button" onClick={close} className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                  {t(language, 'Close', 'Cerrar')}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-black text-white">{t(language, 'Rate your experience', 'Califica tu experiencia')}</h2>
                  <p className="mt-1.5 text-sm text-white/40">
                    {t(
                      language,
                      'Only customers who have created a real document can leave a review — every submission is checked before publishing.',
                      'Solo clientes que ya generaron un documento real pueden reseñar — revisamos cada envío antes de publicarlo.',
                    )}
                  </p>
                </div>

                <div className="mb-5 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`size-8 ${n <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`} />
                    </button>
                  ))}
                </div>

                <label className="mb-1.5 block text-xs font-semibold text-white/50">{t(language, 'Your name', 'Tu nombre')}</label>
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={60}
                  className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
                  placeholder={t(language, 'Full name or first name', 'Nombre completo o solo tu nombre')}
                />

                <label className="mb-1.5 block text-xs font-semibold text-white/50">{t(language, 'Your review', 'Tu reseña')}</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="mb-6 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
                  placeholder={t(language, 'What was your experience creating or signing a document?', '¿Cómo fue tu experiencia creando o firmando un documento?')}
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? <Loader className="size-4 animate-spin" /> : t(language, 'Submit review', 'Enviar reseña')}
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

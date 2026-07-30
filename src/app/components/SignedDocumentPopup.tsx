import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Download, X } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { supabase } from '../../lib/supabase';
import { stashSignedTransactionForDownload, markTransactionViewed, type SignTransaction } from '../services/sign-transaction-service';

/**
 * Mounted once at the app root (App.tsx), next to <Toaster />, so it fires
 * on ANY page while the creator is logged in — not just while they happen
 * to be looking at the Firmas tab. Listens for sign_transactions rows
 * THIS user created (creator_id) turning into status: 'completed', and
 * surfaces a small elevated card (same "3D modern" visual language as
 * GenerateSendModal/template-fill-public-page) with a direct Download
 * action, instead of requiring them to go check a list themselves.
 *
 * Realtime only pushes changes that happen AFTER subscribing (no
 * historical backlog), so this never replays old completions from before
 * the tab was open — exactly the "while I'm using the app" behavior asked
 * for, distinct from the Firmas tab which shows the full history.
 *
 * Uses a plain `window.location.href` navigation instead of react-router's
 * useNavigate() — this component is mounted as a sibling of <RouterProvider>
 * in App.tsx (so it's active on every route, not just ones already inside
 * the router tree), and useNavigate() throws immediately if called outside
 * a Router's component tree, which crashed the entire app on every page.
 *
 * Dedup: viewed_at is the same "have I already seen this" signal the
 * Firmas tab/notification badge already use (see markTransactionViewed) —
 * gating on `!viewed_at` means a later UPDATE on the same row (e.g. the
 * viewed_at write itself, or something unrelated) never re-shows a popup
 * for a transaction already surfaced. A local `shownIds` set is an extra
 * guard within the same session in case of duplicate realtime events.
 */
export function SignedDocumentPopup() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [queue, setQueue] = useState<SignTransaction[]>([]);
  const shownIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`creator-signed-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sign_transactions', filter: `creator_id=eq.${user.id}` },
        (payload) => {
          const tx = payload.new as SignTransaction;
          if (tx.status !== 'completed' || tx.viewed_at || shownIds.current.has(tx.id)) return;
          shownIds.current.add(tx.id);
          setQueue((prev) => [...prev, tx]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const current = queue[0];
  const dismiss = () => setQueue((prev) => prev.slice(1));

  const handleDownload = () => {
    if (!current) return;
    void markTransactionViewed(current.id);
    stashSignedTransactionForDownload(current, language);
    window.location.href = current.document_type === 'custom-template' ? '/preview/custom-template' : `/preview/${current.document_type}`;
    dismiss();
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-[9997] w-[calc(100vw-2rem)] max-w-sm overflow-hidden bg-white"
          style={{
            borderRadius: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(15,23,42,0.12), 0 32px 80px rgba(15,23,42,0.18)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg,#34d399 0%,#059669 55%,#0891b2 100%)' }} />
          <div className="flex items-start gap-3 p-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#34d399 0%,#059669 100%)', boxShadow: '0 3px 10px rgba(5,150,105,0.4)' }}
            >
              <CheckCircle2 className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900">{language === 'en' ? 'Document signed!' : '¡Documento firmado!'}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {language === 'en'
                  ? 'Your recipient just finished signing — it’s ready to download.'
                  : 'Tu destinatario acaba de firmar — ya está listo para descargar.'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(180deg,#34d399 0%,#059669 68%,#065f46 100%)', boxShadow: '0 3px 0 #065f46' }}
                >
                  <Download className="size-3.5" /> {language === 'en' ? 'Download' : 'Descargar'}
                </button>
                <button type="button" onClick={dismiss} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">
                  {language === 'en' ? 'Later' : 'Después'}
                </button>
              </div>
            </div>
            <button type="button" onClick={dismiss} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

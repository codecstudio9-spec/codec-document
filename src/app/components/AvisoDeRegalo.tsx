/**
 * El aviso que ve quien ha recibido documentos de regalo.
 *
 * Aparece una sola vez por regalo: en cuanto se muestra se marca como
 * anunciado en la base de datos, así que no vuelve a salir en cada recarga.
 *
 * ── El sonido ────────────────────────────────────────────────────────────
 *
 * Se sintetiza con la Web Audio API en vez de cargar un archivo. Un mp3 son
 * unos 20 KB que hay que servir, cachear y mantener; dos notas generadas
 * pesan cero y no dependen de que la descarga llegue antes que el aviso.
 *
 * Los navegadores bloquean el audio hasta que la persona ha interactuado con
 * la página. Si está bloqueado no se insiste ni se pide permiso: el aviso se
 * ve igual, que es lo que de verdad importa. Un aviso mudo es un
 * inconveniente; un cuadro de permisos sin venir a cuento es una molestia.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { getUnnotifiedGifts, markGiftsNotified, type DocumentGift } from '../services/document-gifts-service';

/** Dos notas ascendentes, corto y alegre. Se cierra el contexto al terminar
 *  para no dejar un AudioContext vivo por cada aviso. */
function sonarCampanita() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') { void ctx.close(); return; }

    const notas = [880, 1318.5]; // La5 y Mi6
    notas.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = hz;
      const t0 = ctx.currentTime + i * 0.14;
      // Ataque muy corto y caída suave: sin la rampa, el corte seco suena a
      // chasquido en vez de a campana.
      gan.gain.setValueAtTime(0.0001, t0);
      gan.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.connect(gan).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });

    setTimeout(() => { void ctx.close(); }, 1200);
  } catch { /* sin sonido, el aviso se ve igual */ }
}

export function AvisoDeRegalo() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const es = language === 'es';
  const [regalos, setRegalos] = useState<DocumentGift[] | null>(null);
  // Sin esto, un re-render de React volvería a consultar y, en el peor caso,
  // a sonar por segunda vez.
  const yaBuscado = useRef(false);

  useEffect(() => {
    if (!user?.id || yaBuscado.current) return;
    yaBuscado.current = true;

    let vivo = true;
    void (async () => {
      const pendientes = await getUnnotifiedGifts();
      if (!vivo || pendientes.length === 0) return;
      setRegalos(pendientes);
      sonarCampanita();
      // Se marca al mostrarlo, no al cerrarlo: si la persona cierra la
      // pestaña sin tocar nada, ya lo vio y no hace falta repetirlo.
      await markGiftsNotified();
    })();

    return () => { vivo = false; };
  }, [user?.id]);

  if (!regalos || regalos.length === 0) return null;

  const total = regalos.reduce((n, g) => n + g.quantity, 0);
  const mensaje = regalos.find((g) => g.message)?.message ?? null;
  const uno = total === 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onClick={() => setRegalos(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-7 text-center shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setRegalos(null)}
            className="absolute right-4 top-4 text-slate-300 transition hover:text-slate-500"
            aria-label={es ? 'Cerrar' : 'Close'}
          >
            <X className="size-4" />
          </button>

          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
            <Gift className="size-8 text-white" />
          </div>

          <p className="text-lg font-black text-slate-900">
            {es
              ? (uno ? '¡Has recibido un documento gratis!' : `¡Has recibido ${total} documentos gratis!`)
              : (uno ? "You've received a free document!" : `You've received ${total} free documents!`)}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {es
              ? `Ya ${uno ? 'lo puedes usar' : 'los puedes usar'}: escoge la plantilla que quieras, edítala a tu gusto y descárgala.`
              : `You can use ${uno ? 'it' : 'them'} right away: pick any template, edit it however you like and download it.`}
          </p>

          {mensaje && (
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm italic text-slate-600">
              «{mensaje}»
            </p>
          )}

          <button
            type="button"
            // Navegación dura y no `useNavigate`: este aviso se monta fuera
            // del RouterProvider (junto al resto de avisos globales en
            // App.tsx), donde el hook del router no tiene contexto.
            onClick={() => { setRegalos(null); window.location.assign('/'); }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            <Sparkles className="size-4" />
            {es ? 'Escoger un documento' : 'Pick a document'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

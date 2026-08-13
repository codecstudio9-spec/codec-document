import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CreditCard, Sparkles, AlertTriangle, Mail, CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CARD_RADIUS, MOV } from '../../styles/contador-theme';
import type { Notificacion, TipoNotificacion } from '../../hooks/use-notificaciones';

/**
 * La campana de avisos del panel del contador.
 *
 * ── Por qué esta campana sí y la del dashboard no valía ─────────────────
 * `DesktopHeader` tiene la suya, pero cuenta «documentos firmados que no has
 * abierto», que en el módulo del contador no existe. Poner esa campana aquí
 * habría dejado un icono que nunca puede tener nada — y una campana que jamás
 * suena se deja de mirar a la semana, incluida la del dashboard.
 *
 * Ésta avisa de las cuatro cosas que de verdad pasan aquí y que el contador se
 * pierde si no está mirando la pestaña: que entró un pago, que le cambió el
 * plan, que terminó de procesar un lote, y que llegaron facturas al buzón.
 */

const ICONO: Record<TipoNotificacion, LucideIcon> = {
  pago: CreditCard,
  plan: Sparkles,
  proceso: CheckCircle2,
  revision: AlertTriangle,
  correo: Mail,
};

/** El color dice de qué va sin leer. Son los mismos de cada etapa en el resto
 *  de la pantalla, no una paleta aparte para los avisos. */
const COLOR: Record<TipoNotificacion, string> = {
  pago: '#10B981',
  plan: '#7C3AED',
  proceso: '#2563EB',
  revision: '#F59E0B',
  correo: '#0284C7',
};

function haceCuanto(fecha: number): string {
  const s = Math.max(0, Math.round((Date.now() - fecha) / 1000));
  if (s < 60) return 'ahora mismo';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function Campana({
  lista, sinLeer, onAbrir, onLimpiar,
}: {
  lista: Notificacion[];
  sinLeer: number;
  /** Se llama al desplegar: es cuando dejan de estar sin leer. */
  onAbrir: () => void;
  onLimpiar: () => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera y con Escape. Un desplegable que sólo se cierra
  // con su propio botón obliga a volver a apuntar justo donde se pulsó.
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(false);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false); };
    document.addEventListener('mousedown', fuera);
    window.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', tecla);
    };
  }, [abierta]);

  const alternar = () => {
    setAbierta((v) => {
      if (!v) onAbrir();
      return !v;
    });
  };

  return (
    <div className="relative" ref={caja}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={alternar}
        className="relative flex size-11 items-center justify-center rounded-2xl bg-white"
        style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
        aria-label={sinLeer > 0 ? `${sinLeer} avisos sin leer` : 'Avisos'}
      >
        {/* La campana se agita cuando hay algo, y con pausas largas. Un
            movimiento continuo se convierte en ruido visual en dos minutos. */}
        <motion.div
          animate={sinLeer > 0 ? { rotate: [0, -14, 11, -8, 5, -2, 0] } : { rotate: 0 }}
          transition={sinLeer > 0
            ? { duration: 0.7, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }
            : undefined}
        >
          <Bell className="size-4.5 text-slate-500" />
        </motion.div>

        <AnimatePresence>
          {sinLeer > 0 && (
            <motion.span
              key={sinLeer}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
              style={{ height: 18, background: '#EF4444' }}
            >
              <span className="relative">{sinLeer > 9 ? '9+' : sinLeer}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {abierta && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={MOV.suave}
            className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden bg-white"
            style={{ borderRadius: CARD_RADIUS, boxShadow: '0 24px 60px rgba(15,23,42,0.20)' }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <p className="text-sm font-black text-slate-900">Avisos</p>
              {lista.length > 0 && (
                <button
                  type="button"
                  onClick={() => { onLimpiar(); setAbierta(false); }}
                  className="text-[11.5px] font-bold text-slate-400 transition hover:text-slate-700"
                >
                  Vaciar
                </button>
              )}
            </div>

            {lista.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell className="mx-auto mb-2.5 size-7 text-slate-200" />
                <p className="text-[13px] font-bold text-slate-600">No hay avisos</p>
                <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-relaxed text-slate-400">
                  Te aviso cuando termine de procesar un lote, entre un pago o lleguen
                  facturas a tu buzón.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] divide-y divide-slate-50 overflow-y-auto">
                {lista.map((n, i) => {
                  const Icono = ICONO[n.tipo];
                  const color = COLOR[n.tipo];
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...MOV.entrada, delay: Math.min(i, 6) * 0.04 }}
                      className={`flex gap-3 px-5 py-3.5 ${n.leida ? '' : 'bg-blue-50/40'}`}
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${color}18` }}
                      >
                        <Icono className="size-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-snug text-slate-800">{n.titulo}</p>
                        {n.detalle && (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{n.detalle}</p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-400">{haceCuanto(n.fecha)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

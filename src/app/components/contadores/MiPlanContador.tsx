import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, CheckCircle2, Lock, Sparkles, Loader2, FileText, Building2, CalendarClock, Gift, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Cabecera, Tarjeta, Boton } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_EXITO } from '../../styles/contador-theme';
import {
  estadoPlan, cotizar, pagarPlan, iniciarPruebaContador, ultimoPago, pesos, fechaLarga, tamanoPara,
  type EstadoPlan, type Cotizacion, type Modulo, type Tamano, type Ciclo,
} from '../../services/contador-planes';

/**
 * «Mi plan»: comprar en una pantalla, con tres decisiones y un botón.
 *
 * 1. ¿Qué necesitas?  Plan XML o Plan Contador.
 * 2. ¿Cuántas empresas llevas? (o cuántos XML, si es sólo XML)
 * 3. Mensual o anual.
 *
 * Arranca marcado en lo más probable (Plan Contador, anual, el tamaño de las
 * empresas que ya tiene) para que la mayoría sólo tenga que pulsar «Pagar».
 * Lo que se paga hoy lo calcula la base: si ya tiene plan, sólo la diferencia
 * de los días que faltan, sin mover su fecha de corte.
 */

const QUE_INCLUYE: Record<Modulo, string[]> = {
  xml: [
    'Descarga automática de la DIAN',
    'XML a Excel y plantillas de tu programa contable',
    'Cruce DIAN contra tu contabilidad',
    'Facturas por correo, sin ir a buscarlas',
    'Tus empresas organizadas por NIT',
  ],
  contador: [
    'Todo lo del Plan XML',
    'Causación automática con tus cuentas',
    'Comprobantes, libros y reportes',
    'Codec POS: ventas, gastos y cierres de tus clientes',
  ],
};

const TAMANOS: Array<{ id: Tamano; nombre: string }> = [
  { id: 'independiente', nombre: 'Independiente' },
  { id: 'oficina', nombre: 'Oficina' },
  { id: 'firma', nombre: 'Firma' },
];

export function MiPlanContador({
  cuota, preseleccion, motivo, onCambio,
}: {
  /** Consumo de XML del mes, si la pantalla que lo monta ya lo tiene. */
  cuota?: { usados: number; limite: number | null; renuevaEl?: string | null } | null;
  /** Qué se quiere comprar al llegar desde un candado. */
  preseleccion?: Modulo;
  /** La frase que explica por qué llegó aquí («Para causar facturas…»). */
  motivo?: string;
  onCambio?: (e: EstadoPlan) => void;
}) {
  const [estado, setEstado] = useState<EstadoPlan | null>(null);
  const [modulo, setModulo] = useState<Modulo>(preseleccion ?? 'contador');
  const [tamano, setTamano] = useState<Tamano>('independiente');
  const [ciclo, setCiclo] = useState<Ciclo>('anual');
  const [cot, setCot] = useState<Cotizacion | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const inicializado = useRef(false);

  const cargar = async () => {
    const e = await estadoPlan();
    setEstado(e);
    onCambio?.(e);
    return e;
  };

  useEffect(() => {
    cargar().then((e) => {
      if (inicializado.current) return;
      inicializado.current = true;
      // Si ya tiene un plan pagado, se arranca en el suyo; si no, en el que le queda.
      if (e.plan && e.plan.modulo !== 'prueba') {
        setModulo(preseleccion ?? e.plan.modulo);
        setTamano(e.plan.tamano ?? 'independiente');
        setCiclo(e.ciclo ?? 'anual');
      } else {
        setTamano(tamanoPara(e.empresasUsadas));
      }
    }).catch((err) => toast.error(err instanceof Error ? err.message : 'No pude cargar tu plan'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelta de Wompi: el webhook puede tardar unos segundos.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('pago') !== '1') return;
    const desde = Date.now() - 30 * 60_000;
    const id = toast.loading('Confirmando tu pago con Wompi…');
    let intentos = 0;
    const t = window.setInterval(async () => {
      intentos++;
      const ultimo = await ultimoPago().catch(() => null);
      if (ultimo && new Date(ultimo).getTime() > desde) {
        window.clearInterval(t);
        const e = await cargar();
        toast.success(`¡Listo! ${e.plan?.nombre ?? 'Tu plan'} quedó activo. Gracias.`, { id });
        limpiarUrl();
      } else if (intentos >= 12) {
        window.clearInterval(t);
        toast.message('El pago todavía no aparece. Si Wompi te lo cobró, se activa en unos minutos.', { id });
        limpiarUrl();
      }
    }, 3000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = useMemo(
    () => estado?.planes.find((p) => p.modulo === modulo && p.tamano === tamano) ?? null,
    [estado, modulo, tamano],
  );

  // Cada cambio de selección se cotiza en la base: así lo que se ve es lo que se cobra.
  useEffect(() => {
    if (!plan) return;
    let vivo = true;
    setCotizando(true);
    cotizar(plan.code, ciclo)
      .then((c) => { if (vivo) setCot(c); })
      .catch(() => { if (vivo) setCot(null); })
      .finally(() => { if (vivo) setCotizando(false); });
    return () => { vivo = false; };
  }, [plan, ciclo]);

  const pagar = async () => {
    if (!plan) return;
    setTrabajando(true);
    try {
      window.location.href = await pagarPlan(plan.code, ciclo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude abrir el pago');
      setTrabajando(false);
    }
  };

  const probar = async () => {
    setTrabajando(true);
    try {
      const e = await iniciarPruebaContador();
      setEstado(e);
      onCambio?.(e);
      toast.success('¡Listo! Tienes 15 días con todo. Empieza agregando tu primera empresa.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude iniciar la prueba');
    } finally {
      setTrabajando(false);
    }
  };

  if (!estado) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;

  const ahorroAnual = plan ? plan.precio_mes * 12 - plan.precio_anual : 0;
  const diasPrueba = estado.enPrueba && estado.hasta
    ? Math.max(0, Math.ceil((new Date(estado.hasta).getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <div>
      <Cabecera
        titulo="Mi plan"
        descripcion="Un solo plan para todo Contadores, con una sola fecha de corte. Cambias cuando quieras y solo pagas la diferencia."
        icono={CreditCard}
        color="#7C3AED"
      />

      {motivo && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 ring-1 ring-blue-200">
          <Lock className="size-4 shrink-0 text-blue-600" /> {motivo}
        </p>
      )}

      {/* ── Lo que tiene hoy ─────────────────────────────────────────── */}
      <Tarjeta className="mb-5 p-5" indice={0}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tu plan actual</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {estado.activo && estado.plan ? estado.plan.nombre : 'Gratis'}
              {estado.activo && !estado.enPrueba && estado.ciclo && (
                <span className="ml-2 text-sm font-bold text-slate-400">{estado.ciclo === 'anual' ? 'anual' : 'mensual'}</span>
              )}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              {estado.enPrueba && diasPrueba !== null
                ? `Prueba gratis: ${diasPrueba === 0 ? 'termina hoy' : `te quedan ${diasPrueba} ${diasPrueba === 1 ? 'día' : 'días'}`}. Elige tu plan para no perder el acceso.`
                : estado.activo && estado.hasta
                  ? `Vence el ${fechaLarga(estado.hasta)}${estado.renuevaPor ? ` · renueva por ${pesos(estado.renuevaPor)}` : ''}`
                  : estado.vencido && estado.vencioEl
                    ? `Tu plan venció el ${fechaLarga(estado.vencioEl)}. Puedes ver todo lo tuyo, pero para usar las herramientas elige un plan.`
                    : '50 XML gratis cada mes, descarga de la DIAN y Excel.'}
            </p>
            {estado.precioEspecial && !estado.enPrueba && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                <Gift className="size-3" /> Tienes un precio especial: {pesos(estado.precioEspecial)}
              </p>
            )}
            {estado.programado && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                <CalendarClock className="size-3.5" />
                Desde el {fechaLarga(estado.programado.desde)} pasas a {estado.programado.nombre} ({estado.programado.ciclo}), ya pagado.
              </p>
            )}
          </div>
          <div className="grid min-w-[240px] flex-1 gap-2 sm:max-w-sm">
            {cuota && (
              <Barra
                icono={FileText}
                etiqueta="XML este mes"
                usados={cuota.usados}
                limite={cuota.limite}
              />
            )}
            <Barra icono={Building2} etiqueta="Empresas activas" usados={estado.empresasUsadas} limite={estado.maxEmpresas} />
          </div>
        </div>

        {estado.pruebaDisponible && !estado.admin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-violet-50 px-4 py-3 ring-1 ring-blue-200">
            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">Pruébalo todo gratis 15 días.</strong> Hasta 5 empresas y 300 XML, sin tarjeta.
            </p>
            <Boton estilo={BOTON_EXITO} className="text-white" icono={trabajando ? Loader2 : Sparkles} disabled={trabajando} onClick={() => void probar()}>
              Empezar prueba gratis
            </Boton>
          </div>
        )}
      </Tarjeta>

      {/* ── 1. ¿Qué necesitas? ───────────────────────────────────────── */}
      <Paso numero={1} titulo="¿Qué necesitas?">
        <div className="grid gap-3 md:grid-cols-2">
          {(['xml', 'contador'] as Modulo[]).map((m) => {
            const activo = modulo === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setModulo(m)}
                className={`relative rounded-2xl bg-white p-4 text-left transition ${
                  activo ? 'ring-2 ring-blue-600 shadow-[0_12px_32px_rgba(37,99,235,0.16)]' : 'ring-1 ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-black text-slate-900">{m === 'xml' ? 'Plan XML' : 'Plan Contador'}</p>
                  {m === 'contador' && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">Recomendado</span>
                  )}
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {QUE_INCLUYE[m].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <CheckCircle2 className={`mt-0.5 size-3.5 shrink-0 ${activo ? 'text-blue-600' : 'text-emerald-500'}`} /> {t}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </Paso>

      {/* ── 2. Tamaño ────────────────────────────────────────────────── */}
      <Paso numero={2} titulo={modulo === 'contador' ? '¿Cuántas empresas llevas?' : '¿Cuántos XML bajas al mes?'}>
        <div className="grid grid-cols-3 gap-2">
          {TAMANOS.map((t) => {
            const p = estado.planes.find((x) => x.modulo === modulo && x.tamano === t.id);
            if (!p) return null;
            const activo = tamano === t.id;
            const principal = modulo === 'contador' ? `Hasta ${p.max_empresas}` : `${p.xml_mes.toLocaleString('es-CO')} XML`;
            const secundario = modulo === 'contador' ? `${p.xml_mes.toLocaleString('es-CO')} XML al mes` : `hasta ${p.max_empresas} empresas`;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTamano(t.id)}
                className={`rounded-2xl bg-white px-3 py-3 text-center transition ${
                  activo ? 'ring-2 ring-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.14)]' : 'ring-1 ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t.nombre}</p>
                <p className="mt-0.5 text-[15px] font-black text-slate-900">{principal}</p>
                <p className="text-[11.5px] text-slate-500">{secundario}</p>
              </button>
            );
          })}
        </div>
      </Paso>

      {/* ── 3. Ciclo ─────────────────────────────────────────────────── */}
      <Paso numero={3} titulo="¿Cómo quieres pagar?">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          {(['mensual', 'anual'] as Ciclo[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCiclo(c)}
              className={`rounded-xl px-5 py-2 text-sm font-bold transition ${ciclo === c ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {c === 'mensual' ? 'Mensual' : 'Anual'}
              {c === 'anual' && <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">2 meses gratis</span>}
            </button>
          ))}
        </div>
      </Paso>

      {/* ── Resumen y pago ───────────────────────────────────────────── */}
      {plan && (
        <motion.div layout className="mt-5 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-[0_24px_56px_rgba(15,23,42,0.28)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wide text-white/50">
                {plan.nombre} · {ciclo === 'anual' ? 'anual' : 'mensual'}
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {ciclo === 'anual' ? pesos(plan.precio_anual) : pesos(plan.precio_mes)}
                <span className="ml-1 text-base font-bold text-white/50">{ciclo === 'anual' ? '/año' : '/mes'}</span>
              </p>
              {ciclo === 'anual' && (
                <p className="mt-1 text-[13px] text-white/70">
                  Equivale a {pesos(Math.round(plan.precio_anual / 12))} al mes · ahorras {pesos(ahorroAnual)}
                </p>
              )}
            </div>

            <div className="min-w-[240px] text-right">
              {cotizando || !cot ? (
                <Loader2 className="ml-auto size-5 animate-spin text-white/40" />
              ) : (
                <>
                  <p className="text-[13px] text-white/60">{textoTipo(cot)}</p>
                  <p className="text-2xl font-black tabular-nums">Hoy pagas {pesos(cot.hoy)}</p>
                  <p className="text-[12px] text-white/60">
                    {cot.tipo === 'programado'
                      ? `Empieza el ${fechaLarga(cot.desde)} · vence el ${fechaLarga(cot.hasta)}`
                      : `Vence el ${fechaLarga(cot.hasta)} · luego renueva por ${pesos(cot.renueva_por)}`}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="flex items-center gap-2 text-[12px] text-white/60">
              <Lock className="size-3.5 shrink-0" /> Pago seguro con Wompi: tarjeta, PSE, Nequi o corresponsal.
            </p>
            <Boton
              estilo={BOTON_PRIMARIO}
              className="px-6 py-3 text-[14px] text-white"
              icono={trabajando ? Loader2 : ArrowRight}
              disabled={trabajando || cotizando || !cot || cot.hoy <= 0}
              onClick={() => void pagar()}
            >
              {cot ? (cot.tipo === 'renovacion' ? `Renovar por ${pesos(cot.hoy)}` : `Pagar ${pesos(cot.hoy)}`) : 'Pagar'}
            </Boton>
          </div>
        </motion.div>
      )}

      <p className="mt-4 text-center text-[12px] leading-relaxed text-slate-400">
        Si subes de plan a mitad de periodo, pagas solo la diferencia de los días que faltan y tu fecha de corte no cambia.
        Bajar de plan se aplica cuando termine lo que ya pagaste. Tus datos nunca se borran.
      </p>
    </div>
  );
}

function limpiarUrl() {
  const u = new URL(window.location.href);
  u.searchParams.delete('pago');
  window.history.replaceState(null, '', u.toString());
}

function textoTipo(c: Cotizacion): string {
  switch (c.tipo) {
    case 'renovacion': return c.precio_especial ? 'Renuevas con tu precio especial' : 'Renuevas tu plan';
    case 'mejora': return `Pagas solo los días que faltan de ${c.actual?.plan_nombre ?? 'tu plan'}`;
    case 'cambio_anual': return 'Descontamos lo que te quedaba del mes';
    case 'programado': return 'Se aplica cuando termine lo que ya pagaste';
    default: return c.precio_especial ? 'Con tu precio especial' : 'Plan nuevo';
  }
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <p className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-800">
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">{numero}</span>
        {titulo}
      </p>
      {children}
    </section>
  );
}

function Barra({ icono: Icono, etiqueta, usados, limite }: {
  icono: typeof FileText; etiqueta: string; usados: number; limite: number | null;
}) {
  const pct = limite ? Math.min(100, Math.round((usados / Math.max(1, limite)) * 100)) : 0;
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="flex items-center gap-1.5 font-semibold text-slate-600"><Icono className="size-3.5" /> {etiqueta}</span>
        <span className="font-bold tabular-nums text-slate-800">
          {usados.toLocaleString('es-CO')}{limite === null ? ' · sin tope' : ` de ${limite.toLocaleString('es-CO')}`}
        </span>
      </div>
      {limite !== null && limite > 0 && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: pct >= 100 ? '#F43F5E' : pct >= 85 ? '#F59E0B' : 'linear-gradient(90deg,#10B981,#059669)' }}
          />
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, CreditCard, FileText, Wallet, Gift, RefreshCw,
  MapPin, AlertTriangle, Search,
} from 'lucide-react';
import {
  resumenAdmin, usuariosAdmin, pagosAdmin, concederPlan, retirarPlan,
  type ResumenAdmin, type UsuarioAdmin, type PagoAdmin,
} from '../../services/dian-admin-service';
import { fetchLocationSummary } from '../../services/analytics-service';
import { listarPlanes, type PlanCatalogo } from '../../services/dian-service';
import { Cabecera, Tarjeta, Boton, Cifra, Vacio } from './PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO, ESTADO, MOV } from '../../styles/contador-theme';

/**
 * Analítica del dueño.
 *
 * ── Qué pregunta responde ───────────────────────────────────────────────
 * No es un panel de métricas bonitas: es la lista de a quién llamar. Por eso
 * la tabla se ordena por actividad reciente y cada fila lleva lo que decide
 * esa llamada — plan, consumo del mes y cuánto ha pagado — en vez de repartir
 * esos datos por tres pestañas.
 *
 * ── Sólo lo ve el dueño ─────────────────────────────────────────────────
 * El componente ni siquiera se monta para nadie más, pero eso es cortesía:
 * el cierre está en la base, donde cada función comprueba is_admin_user().
 * Esconder un componente no protege datos.
 */

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fecha = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const diasDesde = (s: string | null): number | null =>
  s ? Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000) : null;

export function VistaAnalitica() {
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [lugares, setLugares] = useState<Array<{ city: string; country: string; visitors: number }>>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pestana, setPestana] = useState<'usuarios' | 'pagos' | 'lugares'>('usuarios');

  // Conceder acceso
  const [correoRegalo, setCorreoRegalo] = useState('');
  const [planRegalo, setPlanRegalo] = useState('basico');
  const [mesesRegalo, setMesesRegalo] = useState(1);
  const [concediendo, setConcediendo] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      // Los lugares vienen del módulo de analítica del sitio, que mide
      // visitantes anónimos. Es otra población que la de esta tabla, así que
      // va en su propia pestaña y no mezclado con las cuentas.
      const [r, u, p, pl, lg] = await Promise.all([
        resumenAdmin(),
        usuariosAdmin(300),
        pagosAdmin(150),
        listarPlanes(),
        fetchLocationSummary().catch(() => []),
      ]);
      setResumen(r); setUsuarios(u); setPagos(p); setPlanes(pl); setLugares(lg);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const conceder = async () => {
    const correo = correoRegalo.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
      toast.error('Escribe un correo válido'); return;
    }
    setConcediendo(true);
    try {
      const r = await concederPlan(correo, planRegalo, mesesRegalo);
      toast.success(`${r.plan} concedido a ${r.email} hasta ${fecha(r.hasta)}`);
      setCorreoRegalo('');
      await cargar();
    } catch (e) { toast.error((e as Error).message); }
    finally { setConcediendo(false); }
  };

  const quitar = async (email: string) => {
    try {
      await retirarPlan(email);
      toast.success(`Plan retirado a ${email}`);
      await cargar();
    } catch (e) { toast.error((e as Error).message); }
  };

  const filtrados = usuarios.filter((u) =>
    !busqueda || u.email.toLowerCase().includes(busqueda.toLowerCase()));

  const dePago = filtrados.filter((u) => u.planCode !== 'gratis');
  const gratis = filtrados.filter((u) => u.planCode === 'gratis');

  return (
    <div>
      <Cabecera
        titulo="Analítica"
        descripcion="Quién entra, quién paga y quién no. Sólo tú ves esta sección."
        icono={Users}
        color="#7C3AED"
        acciones={
          <Boton estilo={BOTON_NEUTRO} icono={RefreshCw} onClick={() => void cargar()} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </Boton>
        }
      />

      {/* ── Cifras ───────────────────────────────────────────────────── */}
      {resumen && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra etiqueta="Contadores" valor={resumen.usuariosTotal} icono={Users}
                 color="#2563EB" indice={0} pie={`${resumen.usuariosMes} activos este mes`} />
          <Cifra etiqueta="Con plan" valor={resumen.dePago} icono={CreditCard}
                 color="#10B981" indice={1} resalta={resumen.dePago > 0}
                 pie={`${pesos(resumen.ingresosMes)} este mes`} />
          <Cifra etiqueta="Documentos" valor={resumen.docsMes} icono={FileText}
                 color="#0EA5E9" indice={2} pie={`${resumen.docsTotal.toLocaleString('es-CO')} en total`} />
          <Cifra etiqueta="Ingresos totales" valor={pesos(resumen.ingresosTotal)} icono={Wallet}
                 color="#7C3AED" indice={3}
                 pie={resumen.pagosPendientes > 0 ? `${resumen.pagosPendientes} pago(s) sin confirmar` : 'Todo confirmado'} />
        </div>
      )}

      {/* Un pago colgado significa que alguien pagó y no recibió su plan. Va
          arriba y en rojo: es lo único de esta pantalla que cuesta dinero y
          confianza si se queda sin mirar. */}
      {resumen && resumen.pagosPendientes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={MOV.entrada}
          className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: ESTADO.error.fondo, border: `1px solid ${ESTADO.error.borde}` }}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: ESTADO.error.trazo }} />
          <p className="text-[13px] leading-relaxed" style={{ color: ESTADO.error.texto }}>
            Hay <strong>{resumen.pagosPendientes}</strong> cobro(s) abierto(s) sin confirmar. Si alguno
            corresponde a un pago real que Wompi cobró, revísalo en la pestaña Pagos: el contador
            está pagando sin tener su plan activo.
          </p>
        </motion.div>
      )}

      {/* ── Conceder acceso ──────────────────────────────────────────── */}
      <Tarjeta className="mb-6 p-5" indice={4}>
        <div className="mb-3 flex items-center gap-2.5">
          <Gift className="size-4 text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">Dar acceso sin cobrar</h3>
        </div>
        <p className="mb-3.5 max-w-2xl text-[12px] leading-relaxed text-slate-500">
          Para cerrar un cliente por teléfono, compensar un fallo o abrirle la herramienta a
          alguien que la está probando en serio. Si ya tiene plan, el tiempo se suma al que le
          quede — nunca se le recorta.
        </p>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Correo de la cuenta
            </label>
            <input
              value={correoRegalo}
              onChange={(e) => setCorreoRegalo(e.target.value)}
              placeholder="contador@ejemplo.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-violet-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Plan</label>
            <select
              value={planRegalo}
              onChange={(e) => setPlanRegalo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] outline-none focus:border-violet-400 focus:bg-white"
            >
              {planes.filter((p) => p.code !== 'gratis').map((p) => (
                <option key={p.code} value={p.code}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Meses</label>
            <input
              type="number" min={1} max={24} value={mesesRegalo}
              onChange={(e) => setMesesRegalo(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
              className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] tabular-nums outline-none focus:border-violet-400 focus:bg-white"
            />
          </div>
          <Boton estilo={BOTON_PRIMARIO} onClick={() => void conceder()} disabled={concediendo}>
            {concediendo ? 'Concediendo…' : 'Conceder'}
          </Boton>
        </div>
      </Tarjeta>

      {/* ── Pestañas ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([
          ['usuarios', `Cuentas (${filtrados.length})`],
          ['pagos', `Pagos (${pagos.length})`],
          ['lugares', `Ciudades (${lugares.length})`],
        ] as const).map(([id, txt]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPestana(id)}
            className={`relative rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
              pestana === id ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {pestana === id && (
              <motion.span layoutId="pestana-admin" transition={MOV.suave}
                className="absolute inset-0 rounded-xl bg-slate-900" />
            )}
            <span className="relative">{txt}</span>
          </button>
        ))}

        {pestana === 'usuarios' && (
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar correo…"
              className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-violet-400"
            />
          </div>
        )}
      </div>

      {/* ── Cuentas ──────────────────────────────────────────────────── */}
      {pestana === 'usuarios' && (
        <Tarjeta className="overflow-hidden" indice={5}>
          {filtrados.length === 0 ? (
            <Vacio icono={Users} titulo="Todavía no hay cuentas"
                   descripcion="Aquí aparecerá cada contador que use la herramienta, con su plan y su consumo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2.5 font-bold">Correo</th>
                    <th className="px-4 py-2.5 font-bold">Plan</th>
                    <th className="px-4 py-2.5 text-right font-bold">Docs mes</th>
                    <th className="px-4 py-2.5 text-right font-bold">Pagado</th>
                    <th className="px-4 py-2.5 font-bold">Última actividad</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {/* Los de pago primero: son los clientes. */}
                  {[...dePago, ...gratis].map((u) => {
                    const dias = diasDesde(u.ultimaActividad ?? u.ultimoAcceso);
                    const dormido = dias !== null && dias > 21;
                    return (
                      <tr key={u.userId} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-slate-800">{u.email}</span>
                          {dormido && (
                            <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                              {dias} días sin entrar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={u.planCode === 'gratis'
                              ? { background: ESTADO.neutro.fondo, color: ESTADO.neutro.texto }
                              : { background: ESTADO.ok.fondo, color: ESTADO.ok.texto }}
                          >
                            {u.planNombre}
                          </span>
                          {u.planHasta && (
                            <span className="ml-1.5 text-[11px] text-slate-400">→ {fecha(u.planHasta)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                          {u.docsMes.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                          {u.pagadoTotal > 0 ? pesos(u.pagadoTotal) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{fecha(u.ultimaActividad ?? u.ultimoAcceso)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {u.planCode !== 'gratis' && (
                            <button
                              type="button"
                              onClick={() => void quitar(u.email)}
                              className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              Retirar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      )}

      {/* ── Pagos ────────────────────────────────────────────────────── */}
      {pestana === 'pagos' && (
        <Tarjeta className="overflow-hidden" indice={5}>
          {pagos.length === 0 ? (
            <Vacio icono={CreditCard} titulo="Todavía no hay cobros"
                   descripcion="Cada intento de pago aparecerá aquí, se haya aprobado o no." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2.5 font-bold">Fecha</th>
                    <th className="px-4 py-2.5 font-bold">Correo</th>
                    <th className="px-4 py-2.5 font-bold">Plan</th>
                    <th className="px-4 py-2.5 text-right font-bold">Valor</th>
                    <th className="px-4 py-2.5 font-bold">Estado</th>
                    <th className="px-4 py-2.5 font-bold">Medio</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const c = p.status === 'APPROVED' ? ESTADO.ok
                      : p.status === 'PENDING' ? ESTADO.revision : ESTADO.error;
                    return (
                      <tr key={p.reference} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 text-slate-500">{fecha(p.creado)}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{p.email}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.planCode ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                          {pesos(p.cop)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                style={{ background: c.fondo, color: c.texto }}>
                            {p.status}
                          </span>
                          {p.manual && (
                            <span className="ml-1.5 text-[10px] font-bold text-violet-600">a mano</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{p.metodo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      )}

      {/* ── Ciudades ─────────────────────────────────────────────────── */}
      {pestana === 'lugares' && (
        <Tarjeta className="overflow-hidden" indice={5}>
          {lugares.length === 0 ? (
            <Vacio icono={MapPin} titulo="Sin datos de ubicación todavía"
                   descripcion="Esto sale del módulo de analítica del sitio y mide visitantes, no cuentas: dice desde dónde se conecta la gente que llega a Codec Document." />
          ) : (
            <div className="divide-y divide-slate-50">
              {lugares.slice(0, 40).map((l, i) => {
                const max = Math.max(...lugares.map((x) => x.visitors), 1);
                return (
                  <div key={`${l.city}-${l.country}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                    <MapPin className="size-3.5 shrink-0 text-slate-300" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700">
                      {l.city || 'Sin ciudad'}
                      <span className="ml-1.5 font-normal text-slate-400">{l.country}</span>
                    </span>
                    {/* La barra deja comparar de un vistazo sin leer cifras. */}
                    <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-slate-100 sm:block">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(l.visitors / max) * 100}%` }}
                        transition={{ ...MOV.lenta, delay: Math.min(i, 8) * 0.03 }}
                        className="h-full rounded-full bg-violet-500"
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[13px] font-bold tabular-nums text-slate-800">
                      {l.visitors.toLocaleString('es-CO')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  );
}

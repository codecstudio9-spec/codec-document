/**
 * Contabilidad: el módulo de pago para contadores que llevan varias empresas.
 *
 * ── Quién ve qué ────────────────────────────────────────────────────────
 * Sin plan (ni prueba) sólo se ve la oferta: qué hace, la prueba gratis de
 * 15 días y los planes. Con plan, el módulo completo. La base es la que
 * manda (cont_acceso_activo en cada escritura); esconder pantallas aquí es
 * cortesía, no seguridad.
 *
 * ── Cómo está organizado ────────────────────────────────────────────────
 * Es el mismo panel del contador que Documentos DIAN (misma barra lateral,
 * misma cabecera, mismas tarjetas), para que pasar de uno a otro no se sienta
 * como cambiar de programa. La portada son las empresas; al abrir una, el
 * menú muestra lo de esa empresa: carpetas, causar XML, comprobantes,
 * reportes y plan de cuentas. Arriba siempre se ve en qué empresa se está, y
 * se cambia de una a otra sin volver a la portada.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, BellRing, FolderOpen, BookOpenCheck, BookOpen, BarChart3, ListTree, Store, CreditCard,
  ArrowLeft, ChevronDown, Search, Loader2, ArrowRight, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { PanelLateral, ANCHO_LATERAL, ANCHO_LATERAL_PLEGADA, type GrupoLateral } from '../components/dian/PanelLateral';
import { Bienvenida } from '../components/dian/Bienvenida';
import { Campana } from '../components/dian/Campana';
import { CajonDerecho } from '../components/dian/CajonDerecho';
import { CausacionContable } from '../components/dian/CausacionContable';
import { Cabecera, Tarjeta, Boton, Vacio } from '../components/dian/PiezasPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfertaContabilidad } from '../components/contabilidad/OfertaContabilidad';
import { MisEmpresas, COLORES_EMPRESA, nitBonito } from '../components/contabilidad/MisEmpresas';
import { CarpetasEmpresa } from '../components/contabilidad/CarpetasEmpresa';
import { ComprobantesEmpresa } from '../components/contabilidad/ComprobantesEmpresa';
import { PlanCuentas } from '../components/contabilidad/PlanCuentas';
import { ReportesEmpresa } from '../components/contabilidad/ReportesEmpresa';
import { CarpetaCodecPos } from '../components/contabilidad/CarpetaCodecPos';
import { FONDO_APP, RESPLANDOR_DERECHA, RESPLANDOR_IZQUIERDA, BOTON_NEUTRO, CARD } from '../styles/contador-theme';
import { useAuth } from '../contexts/auth-context';
import type { Notificacion } from '../hooks/use-notificaciones';
import {
  estadoContabilidad, listarEmpresas, resumenEmpresas, listarAvisos, marcarAvisosLeidos, periodosEmpresa,
  cuentasPropias, datosCausacionEmpresa, contabilizarCausacion, facturasPosPendientes,
  type EstadoContabilidad, type Empresa, type ResumenEmpresa, type AvisoContable,
} from '../services/contabilidad-service';
import { planDeCuentas, type Cuenta } from '../../lib/contabilidad/puc';
import { importarBandeja } from '../services/dian-service';
import { causarEmpresasAutomaticamente, avisarCausacion, type ResultadoAutomatico } from '../services/causacion-automatica';

type Seccion = 'empresas' | 'avisos' | 'carpetas' | 'comprobantes' | 'reportes' | 'cuentas' | 'pos';

const CLAVE_EMPRESA = 'codec_cont_empresa';
const CLAVE_PLEGADA = 'codec_dian_lateral_plegada';

const leerLocal = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardarLocal = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* da igual */ }
};

export default function ContabilidadPage() {
  const { user, logout } = useAuth();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();

  const [estado, setEstado] = useState<EstadoContabilidad | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [resumen, setResumen] = useState<Map<string, ResumenEmpresa>>(new Map());
  const [avisos, setAvisos] = useState<AvisoContable[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(() => leerLocal(CLAVE_EMPRESA));
  const [seccion, setSeccion] = useState<Seccion>('empresas');
  const [periodos, setPeriodos] = useState<string[] | null>(null);
  const [propias, setPropias] = useState<Awaited<ReturnType<typeof cuentasPropias>>>([]);
  const [causando, setCausando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [plegada, setPlegada] = useState(() => leerLocal(CLAVE_PLEGADA) === '1');
  const [error, setError] = useState<string | null>(null);

  const empresa = empresas.find((e) => e.id === empresaId) ?? null;
  const plan: Cuenta[] = useMemo(() => planDeCuentas(propias), [propias]);
  const puedeEditar = Boolean(estado?.activo);

  const refrescar = useCallback(async () => {
    try {
      const e = await estadoContabilidad();
      setEstado(e);
      if (!e.activo && !e.admin) return;
      const [emp, res, av] = await Promise.all([listarEmpresas(), resumenEmpresas(), listarAvisos()]);
      setEmpresas(emp);
      setResumen(res);
      setAvisos(av);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pude cargar Contabilidad');
    }
  }, []);

  useEffect(() => { void refrescar(); }, [refrescar]);

  useEffect(() => {
    const antes = document.title;
    document.title = 'Mis empresas · Contabilidad | Codec Document';
    return () => { document.title = antes; };
  }, []);

  // Las facturas electrónicas que mandó Codec POS esperan en la bandeja. Se
  // leen solas al abrir Contabilidad, con el mismo motor de los XML, y quedan
  // en la carpeta de su empresa.
  const leyendoPos = useRef(false);
  useEffect(() => {
    if (!estado?.activo || leyendoPos.current) return;
    leyendoPos.current = true;
    void (async () => {
      const n = await facturasPosPendientes();
      if (n > 0) {
        const t = toast.loading(`Leyendo ${n} ${n === 1 ? 'factura' : 'facturas'} de Codec POS…`);
        try {
          const r = await importarBandeja(() => {});
          toast.success(`${r.procesados} ${r.procesados === 1 ? 'factura' : 'facturas'} de Codec POS en sus carpetas`, { id: t });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'No pude leer las facturas de Codec POS', { id: t });
        }
      }
      // Después, la causación automática de lo que esté pendiente.
      const res = await causarEmpresasAutomaticamente(await listarEmpresas()).catch(() => [] as ResultadoAutomatico[]);
      avisarCausacion(res);
      void refrescar();
    })();
  }, [estado?.activo, refrescar]);

  // Vuelta de Wompi: el webhook puede tardar unos segundos en activar el
  // plan, así que se pregunta un par de veces antes de rendirse.
  const intentosPago = useRef(0);
  useEffect(() => {
    if (params.get('pago') !== '1') return;
    toast.info('Confirmando tu pago con Wompi…');
    const t = setInterval(async () => {
      intentosPago.current++;
      const e = await estadoContabilidad().catch(() => null);
      if (e?.activo && !e.enPrueba) {
        clearInterval(t);
        toast.success(`Plan ${e.planNombre} activo. ¡Gracias!`);
        setParams({}, { replace: true });
        void refrescar();
      } else if (intentosPago.current >= 10) {
        clearInterval(t);
        toast.message('El pago todavía no aparece confirmado. Si Wompi te lo cobró, se activa en unos minutos.');
        setParams({}, { replace: true });
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de empresa: sus periodos y su plan de cuentas.
  useEffect(() => {
    if (!empresa) { setPeriodos(null); setPropias([]); return; }
    let vivo = true;
    setPeriodos(null);
    Promise.all([periodosEmpresa(empresa), cuentasPropias(empresa.id)])
      .then(([p, c]) => { if (vivo) { setPeriodos(p); setPropias(c); } })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No pude abrir la empresa'));
    return () => { vivo = false; };
  }, [empresa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirEmpresa = (e: Empresa, destino: Seccion = 'carpetas') => {
    setEmpresaId(e.id);
    guardarLocal(CLAVE_EMPRESA, e.id);
    setSeccion(destino);
    // Entrar a la carpeta es haber visto lo nuevo.
    if ((resumen.get(e.id)?.avisos ?? 0) > 0) {
      void marcarAvisosLeidos(e.id).then(() => {
        setAvisos((a) => a.map((x) => (x.empresa_id === e.id ? { ...x, leido: true } : x)));
        setResumen((r) => {
          const n = new Map(r);
          const x = n.get(e.id);
          if (x) n.set(e.id, { ...x, avisos: 0 });
          return n;
        });
      });
    }
  };

  const sinLeer = avisos.filter((a) => !a.leido).reduce((v, a) => v + a.cantidad, 0);
  const nombreDe = (id: string | null) => {
    const e = empresas.find((x) => x.id === id);
    return e ? e.nombre_comercial || e.razon_social : 'Empresa';
  };

  const notificaciones: Notificacion[] = avisos.slice(0, 20).map((a) => ({
    id: a.id,
    tipo: a.tipo === 'pos_nuevos' ? 'pago' : 'proceso',
    titulo: a.tipo === 'pos_nuevos'
      ? `${a.cantidad} ${a.cantidad === 1 ? 'venta' : 'ventas'} de Codec POS en ${nombreDe(a.empresa_id)}`
      : `${a.cantidad} ${a.cantidad === 1 ? 'documento nuevo' : 'documentos nuevos'} de ${nombreDe(a.empresa_id)}`,
    detalle: [a.detalle.compras ? `${a.detalle.compras} de compra` : '', a.detalle.ventas ? `${a.detalle.ventas} de venta` : '']
      .filter(Boolean).join(' · ') || undefined,
    fecha: new Date(a.updated_at).getTime(),
    leida: a.leido,
  }));

  const menu: GrupoLateral[] = useMemo(() => {
    // La flecha de volver va primero: Contabilidad es una parte de Documentos
    // DIAN, no otro programa.
    const volver = { items: [{ id: 'dian', etiqueta: 'Documentos DIAN', icono: ArrowLeft }] };
    if (!estado?.activo) {
      return [
        volver,
        { items: [{ id: 'empresas', etiqueta: 'Mis empresas', icono: Building2, marca: estado?.pruebaDisponible ? '15 días' : undefined }] },
      ];
    }
    const grupos: GrupoLateral[] = [
      volver,
      {
        items: [
          { id: 'empresas', etiqueta: 'Mis empresas', icono: Building2 },
          { id: 'avisos', etiqueta: 'Avisos', icono: BellRing, pendientes: sinLeer },
        ],
      },
    ];
    if (empresa) {
      const r = resumen.get(empresa.id);
      grupos.push({
        titulo: (empresa.nombre_comercial || empresa.razon_social).slice(0, 26),
        items: [
          { id: 'carpetas', etiqueta: 'Carpetas', icono: FolderOpen },
          { id: 'causar', etiqueta: 'Causar XML', icono: BookOpenCheck, pendientes: r?.por_causar ?? 0 },
          { id: 'comprobantes', etiqueta: 'Comprobantes', icono: BookOpen },
          { id: 'reportes', etiqueta: 'Reportes', icono: BarChart3 },
          { id: 'cuentas', etiqueta: 'Plan de cuentas', icono: ListTree },
          { id: 'pos', etiqueta: 'Codec POS', icono: Store },
        ],
      });
    }
    grupos.push(
      { titulo: 'Cuenta', items: [{ id: 'plan', etiqueta: 'Planes y consumo', icono: CreditCard, marca: estado.enPrueba ? 'Prueba' : undefined }] },
    );
    return grupos;
  }, [estado, empresa, resumen, sinLeer]);

  const verPlanes = () => navegar('/documentos-electronicos?seccion=planes');

  const seleccionar = (id: string) => {
    if (id === 'dian') { navegar('/documentos-electronicos'); return; }
    // Los precios viven en un solo lugar: «Planes y consumo» de Documentos DIAN.
    if (id === 'plan') { verPlanes(); return; }
    if (id === 'causar') { setCausando(true); return; }
    setSeccion(id as Seccion);
  };

  const nombreCorto = (user?.name ?? '').trim().split(/\s+/)[0] || undefined;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ background: FONDO_APP }}>
        <Tarjeta className="max-w-md p-6 text-center">
          <p className="font-bold text-slate-800">No pude abrir Contabilidad</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <Boton estilo={BOTON_NEUTRO} className="mt-4 text-slate-700" onClick={() => { setError(null); void refrescar(); }}>Reintentar</Boton>
        </Tarjeta>
      </div>
    );
  }

  const diasPrueba = estado?.enPrueba && estado.hasta
    ? Math.max(0, Math.ceil((new Date(estado.hasta).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="relative min-h-screen" style={{ background: FONDO_APP }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: RESPLANDOR_DERECHA }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: RESPLANDOR_IZQUIERDA }} />

      <PanelLateral
        grupos={menu}
        activo={seccion}
        onSeleccionar={seleccionar}
        nombre={nombreCorto}
        correo={user?.email ?? undefined}
        foto={user?.picture ?? undefined}
        plan={estado?.activo && estado.planNombre
          ? { nombre: estado.planNombre, limite: estado.maxEmpresas, usados: estado.empresasUsadas }
          : undefined}
        onVerPlan={verPlanes}
        onSalir={() => { void logout().then(() => navegar('/', { replace: true })); }}
        abierta={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        plegada={plegada}
        onAlternarPlegado={() => setPlegada((p) => { guardarLocal(CLAVE_PLEGADA, p ? '0' : '1'); return !p; })}
      />

      <div
        className="relative transition-[padding] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--lateral)]"
        style={{ '--lateral': `${plegada ? ANCHO_LATERAL_PLEGADA : ANCHO_LATERAL}px` } as CSSProperties}
      >
        <Bienvenida
          nombre={nombreCorto}
          foto={user?.picture ?? undefined}
          onAbrirMenu={() => setMenuAbierto(true)}
          onPerfil={verPlanes}
          campana={estado?.activo ? (
            <Campana
              lista={notificaciones}
              sinLeer={avisos.filter((a) => !a.leido).length}
              onAbrir={() => {}}
              onLimpiar={() => { void marcarAvisosLeidos().then(refrescar); }}
            />
          ) : undefined}
        />

        <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
          {!estado ? (
            <div className="flex justify-center py-24"><Loader2 className="size-7 animate-spin text-slate-300" /></div>
          ) : (
            <ErrorBoundary zona="Contabilidad">
              {diasPrueba !== null && (
                <button
                  type="button"
                  onClick={verPlanes}
                  className="mb-5 flex w-full items-center justify-between gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-left text-sm text-blue-900 ring-1 ring-blue-200 hover:bg-blue-100"
                >
                  <span>
                    <strong>Prueba gratis:</strong> {diasPrueba === 0 ? 'termina hoy' : `te quedan ${diasPrueba} ${diasPrueba === 1 ? 'día' : 'días'}`}.
                    Elige un plan para no perder el acceso.
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </button>
              )}

              {!estado.activo ? (
                <OfertaContabilidad
                  estado={estado}
                  modo="presentacion"
                  onVerPlanes={verPlanes}
                  vencido={!estado.activo && Boolean(estado.planCode)}
                  onActualizado={(e) => { setEstado(e); setSeccion('empresas'); void refrescar(); }}
                />
              ) : (
                <>
                  {empresa && seccion !== 'empresas' && seccion !== 'avisos' && (
                    <SelectorEmpresa
                      empresa={empresa}
                      empresas={empresas.filter((e) => e.activo)}
                      resumen={resumen}
                      onCambiar={(e) => abrirEmpresa(e, seccion)}
                    />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${seccion}-${empresa?.id ?? ''}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {seccion === 'empresas' && (
                        <MisEmpresas
                          empresas={empresas}
                          resumen={resumen}
                          maxEmpresas={estado.maxEmpresas}
                          puedeEditar={puedeEditar}
                          onAbrir={(e) => abrirEmpresa(e)}
                          onCambio={() => void refrescar()}
                        />
                      )}
                      {seccion === 'avisos' && (
                        <VistaAvisos
                          avisos={avisos}
                          nombreDe={nombreDe}
                          onAbrir={(id) => { const e = empresas.find((x) => x.id === id); if (e) abrirEmpresa(e); }}
                          onMarcar={() => void marcarAvisosLeidos().then(refrescar)}
                        />
                      )}
                      {seccion !== 'empresas' && seccion !== 'avisos' && !empresa && (
                        <Tarjeta>
                          <Vacio
                            icono={Building2}
                            titulo="Elige una empresa"
                            descripcion="Abre una empresa para ver sus carpetas, comprobantes y reportes."
                            accion={<Boton estilo={BOTON_NEUTRO} className="text-slate-700" onClick={() => setSeccion('empresas')}>Ver mis empresas</Boton>}
                          />
                        </Tarjeta>
                      )}
                      {empresa && seccion === 'carpetas' && (
                        periodos === null
                          ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
                          : <CarpetasEmpresa empresa={empresa} periodos={periodos} puedeEditar={puedeEditar} onCausar={() => setCausando(true)} />
                      )}
                      {empresa && seccion === 'comprobantes' && <ComprobantesEmpresa empresa={empresa} plan={plan} puedeEditar={puedeEditar} />}
                      {empresa && seccion === 'reportes' && <ReportesEmpresa empresa={empresa} plan={plan} />}
                      {empresa && seccion === 'cuentas' && (
                        <PlanCuentas
                          empresa={empresa}
                          plan={plan}
                          puedeEditar={puedeEditar}
                          onCambio={() => void cuentasPropias(empresa.id).then(setPropias)}
                        />
                      )}
                      {empresa && seccion === 'pos' && (
                        <>
                          <div className="mb-5 flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-slate-200">
                              <img src="/brand/codec-pos.png" alt="Codec POS" className="size-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                            </div>
                            <div>
                              <h2 className="text-lg font-black tracking-tight text-slate-900">Codec POS</h2>
                              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">Las ventas y gastos del negocio, directo a su contabilidad.</p>
                            </div>
                          </div>
                          <Tarjeta className="p-5"><CarpetaCodecPos empresa={empresa} puedeEditar={puedeEditar} /></Tarjeta>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </ErrorBoundary>
          )}
        </div>
      </div>

      <CajonDerecho abierto={causando && Boolean(empresa)} onCerrar={() => setCausando(false)} ancho="max-w-4xl" etiqueta="Causar XML">
        {empresa && (
          <CausacionContable
            key={empresa.id}
            onCerrar={() => setCausando(false)}
            empresaFija={{ nit: empresa.nit, nombre: empresa.nombre_comercial || empresa.razon_social }}
            cargarDatos={() => datosCausacionEmpresa(empresa)}
            onContabilizar={async (r) => {
              const t = toast.loading('Guardando en la contabilidad…');
              const res = await contabilizarCausacion(empresa.id, r, (h, total) => {
                toast.loading(`Guardando en la contabilidad… ${h} de ${total}`, { id: t });
              });
              toast.dismiss(t);
              if (res.errores.length) {
                toast.error(`${res.errores.length} no se pudieron guardar. ${res.errores[0]}`);
              }
              toast.success(
                `${res.nuevos} comprobante(s) creados`
                + (res.repetidos ? `, ${res.repetidos} ya estaban contabilizados` : ''),
              );
              void refrescar();
            }}
          />
        )}
      </CajonDerecho>
    </div>
  );
}

/** La empresa en la que se está trabajando, y el cambio rápido a otra
 *  (como el selector de empresa de Siigo, pero buscando también por NIT). */
function SelectorEmpresa({
  empresa, empresas, resumen, onCambiar,
}: {
  empresa: Empresa;
  empresas: Empresa[];
  resumen: Map<string, ResumenEmpresa>;
  onCambiar: (e: Empresa) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const color = empresa.color || COLORES_EMPRESA[0];
  const lista = empresas.filter((e) => {
    const t = q.trim().toLowerCase();
    const n = t.replace(/[^0-9]/g, '');
    return !t || e.razon_social.toLowerCase().includes(t) || (e.nombre_comercial ?? '').toLowerCase().includes(t) || (n.length >= 3 && e.nit.includes(n));
  });

  return (
    <div className="relative mb-5">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center gap-3 p-3.5 text-left sm:w-auto sm:min-w-[380px]"
        style={CARD}
      >
        <div className="flex size-10 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: color }}>
          {(empresa.nombre_comercial || empresa.razon_social).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-black text-slate-900">{empresa.nombre_comercial || empresa.razon_social}</p>
          <p className="text-xs text-slate-500">NIT {nitBonito(empresa.nit, empresa.dv)}</p>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Cambiar</span>
        <ChevronDown className={`size-4 text-slate-400 transition ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 z-40 mt-2 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="relative border-b border-slate-100 p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa o NIT" className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none" />
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {lista.map((e, i) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => { setAbierto(false); setQ(''); onCambiar(e); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.color || COLORES_EMPRESA[i % COLORES_EMPRESA.length] }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{e.nombre_comercial || e.razon_social}</span>
                      <span className="text-[11px] text-slate-400">NIT {nitBonito(e.nit, e.dv)}</span>
                    </span>
                    {(resumen.get(e.id)?.avisos ?? 0) > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">{resumen.get(e.id)!.avisos}</span>
                    )}
                    {e.id === empresa.id && <Check className="size-4 text-blue-600" />}
                  </button>
                </li>
              ))}
              {lista.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Sin resultados</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function VistaAvisos({
  avisos, nombreDe, onAbrir, onMarcar,
}: {
  avisos: AvisoContable[];
  nombreDe: (id: string | null) => string;
  onAbrir: (empresaId: string) => void;
  onMarcar: () => void;
}) {
  const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  return (
    <div>
      <Cabecera
        titulo="Avisos"
        descripcion="Cada vez que entran XML (subidos, por correo o descargados de la DIAN), el sistema los reparte por NIT y te avisa aquí cuántos llegaron a cada empresa."
        icono={BellRing}
        acciones={avisos.some((a) => !a.leido) ? (
          <Boton estilo={BOTON_NEUTRO} className="text-slate-700" onClick={onMarcar}>Marcar todo como visto</Boton>
        ) : undefined}
      />
      {avisos.length === 0 ? (
        <Tarjeta>
          <Vacio icono={BellRing} titulo="Sin avisos todavía" descripcion="Cuando traigas XML de tus empresas, aquí verás lo que llegó a cada una." />
        </Tarjeta>
      ) : (
        <Tarjeta className="divide-y divide-slate-100 overflow-hidden" sinAnimar>
          {avisos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => a.empresa_id && onAbrir(a.empresa_id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 ${a.leido ? '' : 'bg-blue-50/40'}`}
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${a.leido ? 'bg-slate-100' : 'bg-blue-600'}`}>
                <FolderOpen className={`size-4 ${a.leido ? 'text-slate-400' : 'text-white'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {a.tipo === 'pos_nuevos'
                    ? `${a.cantidad} ${a.cantidad === 1 ? 'venta' : 'ventas'} de Codec POS en ${nombreDe(a.empresa_id)}`
                    : `${a.cantidad} ${a.cantidad === 1 ? 'documento nuevo' : 'documentos nuevos'} de ${nombreDe(a.empresa_id)}`}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(`${a.fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {a.detalle.compras ? ` · ${a.detalle.compras} de compra` : ''}
                  {a.detalle.ventas ? ` · ${a.detalle.ventas} de venta` : ''}
                  {` · ${pesos(Number(a.monto))}`}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-600">Abrir carpeta <ArrowRight className="size-3.5" /></span>
            </button>
          ))}
        </Tarjeta>
      )}
    </div>
  );
}

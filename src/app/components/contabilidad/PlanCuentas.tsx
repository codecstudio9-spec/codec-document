import { useMemo, useState, type ReactElement } from 'react';
import { ListTree, ChevronRight, Search, Plus, Loader2, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Cabecera, Tarjeta, Boton } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO } from '../../styles/contador-theme';
import { guardarCuenta, type Empresa } from '../../services/contabilidad-service';
import { naturalezaDe, type Cuenta, type Naturaleza } from '../../../lib/contabilidad/puc';
import { generarXlsx } from '../../../lib/dian/xlsx';
import { triggerDownload } from '../../utils/download';

/**
 * Plan de cuentas de la empresa, como árbol: clase → grupo → cuenta →
 * subcuenta. Se despliega por niveles para que las nueve clases se lean de un
 * vistazo (la vista de Siigo que el contador ya conoce), y la búsqueda por
 * código o nombre lo abre todo.
 */
export function PlanCuentas({
  empresa, plan, puedeEditar, onCambio,
}: {
  empresa: Empresa;
  plan: Cuenta[];
  puedeEditar: boolean;
  onCambio: () => void;
}) {
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [nueva, setNueva] = useState<{ padre: string } | null>(null);

  const hijos = useMemo(() => {
    const m = new Map<string, Cuenta[]>();
    for (const c of plan) {
      const padre = padreDe(c.codigo, plan);
      const l = m.get(padre) ?? [];
      l.push(c);
      m.set(padre, l);
    }
    return m;
  }, [plan]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return plan.filter((c) => c.codigo.startsWith(t) || c.nombre.toLowerCase().includes(t)).slice(0, 200);
  }, [q, plan]);

  const alternar = (cod: string) => setAbiertas((s) => {
    const n = new Set(s);
    if (n.has(cod)) n.delete(cod); else n.add(cod);
    return n;
  });

  const exportar = () => {
    const bytes = generarXlsx([{
      nombre: 'Plan de cuentas',
      encabezados: ['Código', 'Cuenta', 'Naturaleza', 'Nivel', 'Propia', 'Activa'],
      filas: plan.map((c) => [c.codigo, c.nombre, c.naturaleza === 'D' ? 'Débito' : 'Crédito', c.nivel, c.propia ? 'Sí' : '', c.activa === false ? 'No' : 'Sí']),
      anchos: [12, 50, 10, 6, 7, 7],
    }]);
    void triggerDownload(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Plan de cuentas ${empresa.nombre_comercial || empresa.razon_social}.xlsx`.replace(/[\\/:*?"<>|]/g, ''));
  };

  const fila = (c: Cuenta, profundidad: number, conHijos: boolean) => (
    <div
      key={c.codigo}
      className={`group flex items-center gap-2 border-t border-slate-100 py-2 pr-3 text-sm ${c.activa === false ? 'opacity-40' : ''}`}
      style={{ paddingLeft: 12 + profundidad * 18 }}
    >
      <button
        type="button"
        onClick={() => conHijos && alternar(c.codigo)}
        className={`flex size-5 items-center justify-center rounded ${conHijos ? 'text-slate-400 hover:bg-slate-100' : 'invisible'}`}
        aria-label="Desplegar"
      >
        <ChevronRight className={`size-3.5 transition ${abiertas.has(c.codigo) ? 'rotate-90' : ''}`} />
      </button>
      <span className={`w-24 shrink-0 font-mono ${c.nivel <= 2 ? 'font-black' : 'font-semibold'} text-slate-800`}>{c.codigo}</span>
      <span className={`min-w-0 flex-1 truncate ${c.nivel === 1 ? 'font-black text-slate-900' : 'text-slate-700'}`}>{c.nombre}</span>
      {c.propia && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Propia</span>}
      <span className="w-8 text-center text-[11px] font-bold text-slate-400" title={c.naturaleza === 'D' ? 'Naturaleza débito' : 'Naturaleza crédito'}>{c.naturaleza}</span>
      {puedeEditar && c.nivel >= 4 && (
        <button
          type="button"
          onClick={() => setNueva({ padre: c.codigo })}
          className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
          title="Crear subcuenta"
        >
          <Plus className="size-4" />
        </button>
      )}
    </div>
  );

  const arbol = (padre: string, profundidad: number): ReactElement[] =>
    (hijos.get(padre) ?? []).flatMap((c) => {
      const tiene = (hijos.get(c.codigo)?.length ?? 0) > 0;
      return [fila(c, profundidad, tiene), ...(abiertas.has(c.codigo) ? arbol(c.codigo, profundidad + 1) : [])];
    });

  return (
    <div>
      <Cabecera
        titulo="Plan de cuentas"
        descripcion="PUC de comerciantes (Decreto 2650 de 1993) más las cuentas propias de esta empresa. Crea subcuentas desde el botón + de cada cuenta."
        icono={ListTree}
        acciones={(
          <>
            <Boton estilo={BOTON_NEUTRO} className="text-slate-700" icono={Download} onClick={exportar}>Excel</Boton>
            {puedeEditar && <Boton estilo={BOTON_PRIMARIO} className="text-white" icono={Plus} onClick={() => setNueva({ padre: '' })}>Nueva cuenta</Boton>}
          </>
        )}
      />
      <Tarjeta className="overflow-hidden" sinAnimar>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código o nombre" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" />
          </div>
          <button type="button" onClick={() => setAbiertas(new Set(plan.filter((c) => c.nivel <= 2).map((c) => c.codigo)))} className="text-xs font-bold text-blue-600 hover:underline">
            Expandir grupos
          </button>
          <button type="button" onClick={() => setAbiertas(new Set())} className="text-xs font-bold text-slate-400 hover:underline">Contraer</button>
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50 py-2 pl-[44px] pr-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          <span className="w-24">Código</span><span className="flex-1">Cuenta contable</span><span className="w-8 text-center">Nat.</span>
        </div>
        {filtradas ? filtradas.map((c) => fila(c, 0, false)) : arbol('', 0)}
      </Tarjeta>

      {nueva && (
        <NuevaCuenta
          empresa={empresa}
          padre={nueva.padre}
          existentes={new Set(plan.map((c) => c.codigo))}
          onCerrar={() => setNueva(null)}
          onGuardada={(cod) => {
            setNueva(null);
            setAbiertas((s) => new Set([...s, ...prefijos(cod)]));
            onCambio();
          }}
        />
      )}
    </div>
  );
}

function prefijos(cod: string): string[] {
  return [1, 2, 4, 6, 8, 10].filter((n) => n < cod.length).map((n) => cod.slice(0, n));
}

function padreDe(codigo: string, plan: Cuenta[]): string {
  const existentes = new Set(plan.map((c) => c.codigo));
  for (const p of prefijos(codigo).reverse()) if (existentes.has(p)) return p;
  return '';
}

function NuevaCuenta({
  empresa, padre, existentes, onCerrar, onGuardada,
}: {
  empresa: Empresa; padre: string; existentes: Set<string>; onCerrar: () => void; onGuardada: (codigo: string) => void;
}) {
  const [codigo, setCodigo] = useState(padre);
  const [nombre, setNombre] = useState('');
  const [naturaleza, setNaturaleza] = useState<Naturaleza>(padre ? naturalezaDe(padre) : 'D');
  const [guardando, setGuardando] = useState(false);

  const error = !/^\d{4,12}$/.test(codigo) ? 'El código va de 4 a 12 dígitos'
    : existentes.has(codigo) ? 'Ese código ya existe'
      : padre && !codigo.startsWith(padre) ? `Debe empezar por ${padre}`
        : !nombre.trim() ? 'Escribe el nombre' : '';

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarCuenta(empresa.id, { codigo, nombre, naturaleza, activa: true });
      toast.success(`Cuenta ${codigo} creada`);
      onGuardada(codigo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude crear la cuenta');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCerrar}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{padre ? `Subcuenta de ${padre}` : 'Nueva cuenta'}</h3>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>
        <label className="block text-xs font-semibold text-slate-600">Código
          <input value={codigo} autoFocus inputMode="numeric" onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '');
            setCodigo(v);
            if (v) setNaturaleza(naturalezaDe(v));
          }} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-400" />
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Naturaleza
          <select value={naturaleza} onChange={(e) => setNaturaleza(e.target.value as Naturaleza)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="D">Débito</option><option value="C">Crédito</option>
          </select>
        </label>
        {error && codigo.length > 0 && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        <Boton estilo={BOTON_PRIMARIO} className="mt-5 w-full text-white" disabled={Boolean(error) || guardando} onClick={() => void guardar()}>
          {guardando ? <Loader2 className="size-4 animate-spin" /> : null} Crear cuenta
        </Boton>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, FolderOpen, BellRing, BookOpenCheck, Loader2, X, Archive, Sparkles, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Cabecera, Tarjeta, Boton, Vacio } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO, CARD } from '../../styles/contador-theme';
import {
  guardarEmpresa, nitsSinRegistrar, type Empresa, type ResumenEmpresa, type DatosEmpresa,
} from '../../services/contabilidad-service';

/**
 * «Mis empresas»: la portada del módulo.
 *
 * Una tarjeta por cliente, con el color que el contador le eligió y tres
 * cifras que dicen si hay trabajo: documentos del mes, XML por causar y
 * avisos sin leer. La tarjeta entera es la carpeta: un clic y se está dentro.
 *
 * El buscador encuentra por nombre o por NIT (con o sin puntos), que es como
 * el contador busca: «el de 900.123…».
 */

export const COLORES_EMPRESA = ['#2563EB', '#059669', '#7C3AED', '#DB2777', '#EA580C', '#0891B2', '#CA8A04', '#475569'];

export const nitBonito = (nit: string, dv?: string | null) =>
  `${nit.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${dv ? `-${dv}` : ''}`;

export function MisEmpresas({
  empresas, resumen, maxEmpresas, puedeEditar, onAbrir, onCambio,
}: {
  empresas: Empresa[];
  resumen: Map<string, ResumenEmpresa>;
  maxEmpresas: number | null;
  puedeEditar: boolean;
  onAbrir: (e: Empresa) => void;
  onCambio: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [editando, setEditando] = useState<Empresa | 'nueva' | null>(null);
  const [prefill, setPrefill] = useState<{ nit: string; nombre: string } | null>(null);
  const [sugeridas, setSugeridas] = useState<Array<{ nit: string; nombre: string; documentos: number }>>([]);

  const activas = empresas.filter((e) => e.activo);
  const archivadas = empresas.filter((e) => !e.activo);

  useEffect(() => {
    if (!puedeEditar) return;
    nitsSinRegistrar(new Set(empresas.map((e) => e.nit))).then(setSugeridas).catch(() => setSugeridas([]));
  }, [empresas, puedeEditar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const qNit = q.replace(/[^0-9]/g, '');
    return (verArchivadas ? archivadas : activas).filter((e) =>
      !q
      || e.razon_social.toLowerCase().includes(q)
      || (e.nombre_comercial ?? '').toLowerCase().includes(q)
      || (qNit.length >= 3 && e.nit.includes(qNit)));
  }, [busqueda, verArchivadas, activas, archivadas]);

  const lleno = maxEmpresas !== null && activas.length >= maxEmpresas;

  return (
    <div>
      <Cabecera
        titulo="Mis empresas"
        descripcion="Cada empresa es una carpeta, identificada por su NIT. Los XML que traigas se reparten solos en la carpeta de su empresa."
        icono={Building2}
        acciones={puedeEditar ? (
          <Boton
            estilo={BOTON_PRIMARIO}
            className="text-white"
            icono={Plus}
            disabled={lleno}
            onClick={() => { setPrefill(null); setEditando('nueva'); }}
          >
            Agregar empresa
          </Boton>
        ) : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o NIT"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          {activas.length}{maxEmpresas !== null ? ` de ${maxEmpresas}` : ''} empresas activas
        </p>
        {archivadas.length > 0 && (
          <button
            type="button"
            onClick={() => setVerArchivadas((v) => !v)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {verArchivadas ? 'Ver activas' : `Ver archivadas (${archivadas.length})`}
          </button>
        )}
      </div>

      {lleno && puedeEditar && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Llegaste al tope de tu plan ({maxEmpresas} empresas). Archiva una que ya no lleves o pasa a un plan más grande en «Mi plan».
        </p>
      )}

      {sugeridas.length > 0 && puedeEditar && !lleno && (
        <Tarjeta className="mb-5 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
            <Sparkles className="size-3.5 text-blue-500" /> Encontré estos NIT en tus XML
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sugeridas.map((s) => (
              <button
                key={s.nit}
                type="button"
                onClick={() => { setPrefill({ nit: s.nit, nombre: s.nombre }); setEditando('nueva'); }}
                className="flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-left text-xs transition hover:bg-blue-50"
              >
                <Plus className="size-3.5 text-blue-600" />
                <span>
                  <span className="block max-w-[220px] truncate font-bold text-slate-800">{s.nombre || 'Sin nombre'}</span>
                  <span className="text-slate-500">NIT {nitBonito(s.nit)} · {s.documentos} XML</span>
                </span>
              </button>
            ))}
          </div>
        </Tarjeta>
      )}

      {empresas.length === 0 ? (
        <Tarjeta>
          <Vacio
            icono={FolderOpen}
            titulo="Todavía no tienes empresas"
            descripcion="Agrega la primera con su NIT. Si ya subiste XML en Documentos DIAN, al crearla se pasan solos a su carpeta."
            accion={puedeEditar ? (
              <Boton estilo={BOTON_PRIMARIO} className="text-white" icono={Plus} onClick={() => setEditando('nueva')}>
                Agregar empresa
              </Boton>
            ) : undefined}
          />
        </Tarjeta>
      ) : visibles.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Ninguna empresa coincide con «{busqueda}».</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((e, i) => {
            const r = resumen.get(e.id);
            const color = e.color || COLORES_EMPRESA[i % COLORES_EMPRESA.length];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                whileHover={{ y: -3 }}
                className="group relative cursor-pointer overflow-hidden p-5"
                style={{ ...CARD, opacity: e.activo ? 1 : 0.7 }}
                onClick={() => onAbrir(e)}
              >
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ background: color, boxShadow: `0 8px 18px ${color}40` }}
                  >
                    {(e.nombre_comercial || e.razon_social).trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-black text-slate-900">{e.nombre_comercial || e.razon_social}</p>
                    <p className="truncate text-xs text-slate-500">NIT {nitBonito(e.nit, e.dv)}{e.ciudad ? ` · ${e.ciudad}` : ''}</p>
                  </div>
                  {puedeEditar && (
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); setEditando(e); }}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                      aria-label="Editar empresa"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Mini icono={FolderOpen} valor={r?.documentos_mes ?? 0} etiqueta="XML del mes" />
                  <Mini icono={BookOpenCheck} valor={r?.por_causar ?? 0} etiqueta="Por causar" alerta={(r?.por_causar ?? 0) > 0} />
                  <Mini icono={BellRing} valor={r?.avisos ?? 0} etiqueta="Nuevos" alerta={(r?.avisos ?? 0) > 0} color="#2563EB" />
                </div>
                {!e.activo && (
                  <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-400"><Archive className="size-3" /> Archivada</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {editando && (
        <EmpresaModal
          empresa={editando === 'nueva' ? null : editando}
          prefill={prefill}
          colorSugerido={COLORES_EMPRESA[empresas.length % COLORES_EMPRESA.length]}
          onCerrar={() => setEditando(null)}
          onGuardada={() => { setEditando(null); onCambio(); }}
        />
      )}
    </div>
  );
}

function Mini({ icono: Icono, valor, etiqueta, alerta, color = '#D97706' }: {
  icono: typeof FolderOpen; valor: number; etiqueta: string; alerta?: boolean; color?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2">
      <p className="flex items-center justify-center gap-1 text-base font-black tabular-nums" style={{ color: alerta ? color : '#0F172A' }}>
        <Icono className="size-3.5 opacity-60" />{valor.toLocaleString('es-CO')}
      </p>
      <p className="text-[10.5px] font-semibold text-slate-400">{etiqueta}</p>
    </div>
  );
}

export function EmpresaModal({
  empresa, prefill, colorSugerido, onCerrar, onGuardada,
}: {
  empresa: Empresa | null;
  prefill?: { nit: string; nombre: string } | null;
  colorSugerido: string;
  onCerrar: () => void;
  onGuardada: (e: Empresa) => void;
}) {
  const [d, setD] = useState<DatosEmpresa>(() => ({
    nit: empresa?.nit ?? prefill?.nit ?? '',
    dv: empresa?.dv ?? '',
    razon_social: empresa?.razon_social ?? prefill?.nombre ?? '',
    nombre_comercial: empresa?.nombre_comercial ?? '',
    regimen: empresa?.regimen ?? '',
    ciudad: empresa?.ciudad ?? '',
    email: empresa?.email ?? '',
    telefono: empresa?.telefono ?? '',
    notas: empresa?.notas ?? '',
    color: empresa?.color ?? colorSugerido,
    activo: empresa?.activo ?? true,
    causacion_automatica: empresa?.causacion_automatica ?? true,
  }));
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof DatosEmpresa, v: string | boolean) => setD((x) => ({ ...x, [k]: v }));

  const guardar = async (cambio?: Partial<DatosEmpresa>) => {
    const datos = { ...d, ...cambio };
    if (!datos.razon_social.trim()) { toast.error('Escribe la razón social'); return; }
    setGuardando(true);
    try {
      const e = await guardarEmpresa(datos, empresa?.id);
      toast.success(empresa ? 'Empresa actualizada' : 'Empresa agregada. Sus XML ya están en su carpeta.');
      onGuardada(e);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pude guardar');
    } finally {
      setGuardando(false);
    }
  };

  const campo = 'mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white p-6 sm:rounded-3xl"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{empresa ? 'Editar empresa' : 'Agregar empresa'}</h3>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <label className="text-xs font-semibold text-slate-600">
            NIT (sin dígito de verificación)
            <input value={d.nit} inputMode="numeric" disabled={Boolean(empresa)} onChange={(e) => set('nit', e.target.value)} className={campo} placeholder="900123456" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            DV
            <input value={d.dv ?? ''} maxLength={1} inputMode="numeric" onChange={(e) => set('dv', e.target.value.replace(/[^0-9]/g, ''))} className={campo} />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Razón social
          <input value={d.razon_social} onChange={(e) => set('razon_social', e.target.value)} className={campo} />
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Nombre corto (opcional, el que verás en las carpetas)
          <input value={d.nombre_comercial ?? ''} onChange={(e) => set('nombre_comercial', e.target.value)} className={campo} />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Régimen
            <select value={d.regimen ?? ''} onChange={(e) => set('regimen', e.target.value)} className={campo}>
              <option value="">Sin definir</option>
              <option value="responsable_iva">Responsable de IVA</option>
              <option value="no_responsable_iva">No responsable de IVA</option>
              <option value="simple">Régimen simple</option>
              <option value="gran_contribuyente">Gran contribuyente</option>
              <option value="esal">Entidad sin ánimo de lucro</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Ciudad
            <input value={d.ciudad ?? ''} onChange={(e) => set('ciudad', e.target.value)} className={campo} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Correo
            <input value={d.email ?? ''} type="email" onChange={(e) => set('email', e.target.value)} className={campo} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Teléfono
            <input value={d.telefono ?? ''} inputMode="tel" onChange={(e) => set('telefono', e.target.value)} className={campo} />
          </label>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-600">Color de la carpeta</p>
        <div className="mt-1.5 flex gap-2">
          {COLORES_EMPRESA.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set('color', c)}
              className="size-8 rounded-full transition"
              style={{ background: c, outline: d.color === c ? `3px solid ${c}55` : 'none', outlineOffset: 2 }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
          <input
            type="checkbox"
            checked={d.causacion_automatica !== false}
            onChange={(e) => set('causacion_automatica', e.target.checked)}
            className="mt-0.5 size-4 accent-emerald-600"
          />
          <span className="text-xs text-emerald-900">
            <span className="block font-bold">Causar sola las facturas que lleguen</span>
            Solo de proveedores que ya causaste antes, con la misma cuenta y retención. Los proveedores nuevos te esperan para que los revises.
          </span>
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Notas
          <textarea value={d.notas ?? ''} rows={2} onChange={(e) => set('notas', e.target.value)} className={campo} />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <Boton estilo={BOTON_PRIMARIO} className="flex-1 text-white" disabled={guardando} onClick={() => void guardar()}>
            {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
            {empresa ? 'Guardar cambios' : 'Agregar empresa'}
          </Boton>
          {empresa && (
            <Boton
              estilo={BOTON_NEUTRO}
              className="text-slate-700"
              icono={Archive}
              disabled={guardando}
              onClick={() => void guardar({ activo: !empresa.activo })}
            >
              {empresa.activo ? 'Archivar' : 'Reactivar'}
            </Boton>
          )}
        </div>
        {empresa && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Archivar libera el cupo del plan y conserva toda su información. Puedes reactivarla cuando quieras.
          </p>
        )}
      </motion.div>
    </div>
  );
}

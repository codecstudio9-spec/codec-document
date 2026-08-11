/**
 * Plantillas contables: el contador sube la suya y se la devolvemos llena.
 *
 * ── Por qué así y no con perfiles precargados ───────────────────────────
 * Cada programa (Siigo, Alegra, World Office, Helisa y los regionales que
 * no conocemos) espera columnas exactas, en orden exacto. Adivinarlas y
 * fallar es peor que no ofrecer la función: el contador lo intenta, su
 * programa lo rechaza, y deja de confiar en toda la herramienta.
 *
 * Con este enfoque funciona con cualquier programa, porque el formato lo
 * aporta quien lo tiene.
 *
 * El emparejamiento se guarda. El mes siguiente el contador elige el perfil
 * y descarga — no vuelve a configurar nada. Ese guardado es lo que
 * convierte la función en una razón para volver cada mes.
 */

import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Loader2, Check, Trash2, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { analizarPlantilla, rellenarPlantilla, bytesABase64, XlsxRellenoError, type HojaDetectada } from '../../../lib/dian/xlsx-relleno';
import {
  emparejarAutomatico, construirFilas, CAMPOS,
  type Emparejamiento, type Granularidad,
} from '../../../lib/dian/mapeo-plantilla';
import {
  listarPerfiles, guardarPerfil, obtenerPlantilla, borrarPerfil,
  type PerfilPlantilla,
} from '../../services/dian-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const PROGRAMAS = ['Siigo', 'Alegra', 'World Office', 'Helisa', 'ContaPyme', 'Otro'];
const FORMATOS_FECHA = [
  { v: 'DD/MM/YYYY', l: '31/12/2026' },
  { v: 'YYYY-MM-DD', l: '2026-12-31' },
  { v: 'MM/DD/YYYY', l: '12/31/2026' },
];

interface Props {
  /** Devuelve los documentos y líneas ya filtrados que hay que exportar. */
  cargarDatos: () => Promise<{ documentos: Record<string, unknown>[]; lineas: Record<string, unknown>[] }>;
}

export function PlantillaContable({ cargarDatos }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [perfiles, setPerfiles] = useState<PerfilPlantilla[] | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuración de una plantilla recién subida
  const [archivo, setArchivo] = useState<{ nombre: string; bytes: Uint8Array } | null>(null);
  const [hojas, setHojas] = useState<HojaDetectada[]>([]);
  const [hojaSel, setHojaSel] = useState(0);
  const [programa, setPrograma] = useState('Siigo');
  const [nombrePerfil, setNombrePerfil] = useState('');
  const [granularidad, setGranularidad] = useState<Granularidad>('documento');
  const [formatoFecha, setFormatoFecha] = useState('DD/MM/YYYY');
  const [mapeo, setMapeo] = useState<Emparejamiento[]>([]);

  const abrir = async () => {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && perfiles === null) {
      try { setPerfiles(await listarPerfiles()); }
      catch { setPerfiles([]); }
    }
  };

  const elegirArchivo = async (f: File | undefined) => {
    if (!f) return;
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const detectadas = analizarPlantilla(bytes);
      setArchivo({ nombre: f.name, bytes });
      setHojas(detectadas);
      setHojaSel(0);
      setNombrePerfil(f.name.replace(/\.[^.]+$/, ''));
      setMapeo(emparejarAutomatico(detectadas[0].encabezados, granularidad));
    } catch (e) {
      const err = e as XlsxRellenoError;
      toast.error(err.message, { duration: 7000 });
    }
  };

  const cambiarHoja = (i: number) => {
    setHojaSel(i);
    setMapeo(emparejarAutomatico(hojas[i].encabezados, granularidad));
  };

  const cambiarGranularidad = (g: Granularidad) => {
    setGranularidad(g);
    if (hojas[hojaSel]) setMapeo(emparejarAutomatico(hojas[hojaSel].encabezados, g));
  };

  const descargar = (bytes: Uint8Array, nombre: string) => {
    const url = URL.createObjectURL(
      new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Llena la plantilla recién configurada y, de paso, guarda el perfil. */
  const llenarNueva = async () => {
    if (!archivo) return;
    if (!mapeo.some((m) => m.campo)) {
      toast.error('Asigna al menos una columna antes de llenar');
      return;
    }
    setTrabajando(true);
    try {
      const { documentos, lineas } = await cargarDatos();
      if (documentos.length === 0) { toast.error('No hay documentos para exportar'); return; }

      const filas = construirFilas(documentos, lineas, mapeo, granularidad, { formatoFecha });
      const lleno = rellenarPlantilla(archivo.bytes, hojas[hojaSel].ruta, filas);
      descargar(lleno, archivo.nombre.replace(/\.xlsx$/i, '') + ' - lleno.xlsx');

      await guardarPerfil({
        nombre: nombrePerfil || archivo.nombre,
        programa,
        formatoFecha,
        granularidad,
        rutaHoja: hojas[hojaSel].ruta,
        nombreHoja: hojas[hojaSel].nombre,
        filaEncabezados: hojas[hojaSel].filaEncabezados,
        nombreArchivo: archivo.nombre,
        plantillaB64: bytesABase64(archivo.bytes),
        columnas: mapeo,
      });

      setPerfiles(await listarPerfiles());
      setArchivo(null);
      setHojas([]);
      toast.success(`${filas.length} fila(s) escritas. La plantilla quedó guardada para el mes siguiente.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTrabajando(false);
    }
  };

  /** Usa un perfil ya guardado: sin configurar nada. */
  const llenarGuardada = async (p: PerfilPlantilla) => {
    setTrabajando(true);
    try {
      const [bytes, { documentos, lineas }] = await Promise.all([obtenerPlantilla(p.id), cargarDatos()]);
      if (documentos.length === 0) { toast.error('No hay documentos para exportar'); return; }

      const filas = construirFilas(
        documentos, lineas,
        p.columns as Emparejamiento[],
        p.granularity,
        { formatoFecha: p.date_format },
      );
      descargar(rellenarPlantilla(bytes, p.sheet_path, filas), `${p.name} - lleno.xlsx`);
      toast.success(`${filas.length} fila(s) escritas en tu plantilla de ${p.target}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTrabajando(false);
    }
  };

  const eliminar = async (p: PerfilPlantilla) => {
    try {
      await borrarPerfil(p.id);
      setPerfiles(await listarPerfiles());
      toast.success('Plantilla eliminada');
    } catch (e) { toast.error((e as Error).message); }
  };

  const campos = CAMPOS.filter((c) => granularidad === 'linea' || c.nivel === 'documento');
  const sinAsignar = mapeo.filter((m) => m.encabezado && !m.campo).length;

  return (
    <section className="mb-6 overflow-hidden bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
      <button type="button" onClick={() => void abrir()} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-600">
          <FileSpreadsheet className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-base font-bold text-slate-900">Llevar a tu programa contable</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Sube la plantilla de Siigo, Alegra, World Office o el que uses, y te la devolvemos llena
          </span>
        </div>
        <ChevronRight className={`size-4 shrink-0 text-slate-400 transition ${abierto ? 'rotate-90' : ''}`} />
      </button>

      {abierto && (
        <div className="border-t border-slate-100 px-5 py-5">
          {/* ── Plantillas ya configuradas ─────────────────────────── */}
          {perfiles === null ? (
            <Loader2 className="size-5 animate-spin text-slate-300" />
          ) : perfiles.length > 0 ? (
            <div className="mb-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Tus plantillas</p>
              <div className="space-y-2">
                {perfiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                      <span className="block text-xs text-slate-400">
                        {p.target} · hoja «{p.sheet_name}» · una fila por {p.granularity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void llenarGuardada(p)}
                      disabled={trabajando}
                      className="shrink-0 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      Llenar y descargar
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminar(p)}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200"
                      aria-label={`Eliminar ${p.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Subir una plantilla nueva ──────────────────────────── */}
          {!archivo ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 px-5 py-6 text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => { void elegirArchivo(e.target.files?.[0]); e.target.value = ''; }}
              />
              <Upload className="mx-auto mb-2 size-6 text-slate-300" />
              <p className="text-sm font-semibold text-slate-800">Sube tu plantilla vacía</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                La que ya usas para cargar en tu programa contable, sin datos. Leemos sus
                columnas y te devolvemos el mismo archivo con la información de tus documentos.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                Seleccionar plantilla
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Check className="size-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">{archivo.nombre}</span>
                <button
                  type="button"
                  onClick={() => { setArchivo(null); setHojas([]); }}
                  className="text-xs font-semibold text-slate-400 underline"
                >
                  cambiar
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  ¿De qué programa es?
                  <select
                    value={programa}
                    onChange={(e) => setPrograma(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:bg-white"
                  >
                    {PROGRAMAS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Nómbrala para reconocerla después
                  <input
                    value={nombrePerfil}
                    onChange={(e) => setNombrePerfil(e.target.value)}
                    placeholder="Compras Siigo"
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                  />
                </label>

                {hojas.length > 1 && (
                  <label className="text-xs font-semibold text-slate-600">
                    ¿En qué hoja van los datos?
                    <select
                      value={hojaSel}
                      onChange={(e) => cambiarHoja(Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                    >
                      {hojas.map((h, i) => (
                        <option key={h.ruta} value={i}>{h.nombre} ({h.encabezados.filter(Boolean).length} columnas)</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="text-xs font-semibold text-slate-600">
                  Formato de fecha
                  <select
                    value={formatoFecha}
                    onChange={(e) => setFormatoFecha(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                  >
                    {FORMATOS_FECHA.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-slate-600">¿Qué lleva cada fila?</p>
                <div className="flex gap-2">
                  {([
                    ['documento', 'Una fila por factura'],
                    ['linea', 'Una fila por producto'],
                  ] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => cambiarGranularidad(v)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                        granularidad === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Emparejamiento ──────────────────────────────────── */}
              <div className="mt-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Tus columnas
                  </p>
                  <span className="text-xs text-slate-500">
                    {mapeo.filter((m) => m.campo).length} reconocidas
                    {sinAsignar > 0 && ` · ${sinAsignar} por asignar`}
                  </span>
                </div>

                <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3">
                  {mapeo.filter((m) => m.encabezado).map((m) => (
                    <div key={m.columna} className="flex items-center gap-2">
                      <span className="w-2/5 shrink-0 truncate text-xs font-medium text-slate-700" title={m.encabezado}>
                        {m.encabezado}
                      </span>
                      <select
                        value={m.campo}
                        onChange={(e) => setMapeo((prev) => prev.map((x) =>
                          x.columna === m.columna ? { ...x, campo: e.target.value, automatico: false } : x,
                        ))}
                        className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none ${
                          m.campo ? 'border-slate-200 bg-white text-slate-800' : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="">— dejar vacía —</option>
                        {campos.map((c) => (
                          <option key={c.id} value={c.id}>{c.grupo}: {c.etiqueta}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <span>
                    Si tu plantilla pide <strong>cuenta contable</strong> o <strong>centro de costo</strong>,
                    esos datos no vienen en el XML de la DIAN: salen de tu plan de cuentas.
                    Déjalos vacíos y complétalos en tu programa, o dinos que agreguemos
                    reglas por proveedor.
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => void llenarNueva()}
                disabled={trabajando}
                className="mt-4 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {trabajando ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                Llenar y descargar
              </button>
              <p className="mt-2 text-[11px] text-slate-400">
                Se guarda para que el mes que viene solo tengas que darle a descargar.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

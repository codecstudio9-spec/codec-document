/**
 * Descarga masiva por rango de fechas, manejada desde Codec.
 *
 * La descarga la hace la extensión dentro del Chrome del contador, con su
 * sesión de la DIAN (ver extension-dian/download-worker.js, procesarRango):
 * busca el rango en "Documentos recibidos" o "enviados" y baja cada fila con
 * un clic real. Esta pantalla sólo da la orden, muestra el avance (se le
 * pregunta a la extensión cada segundo y medio) y al final importa los .zip
 * a Codec leyendo la carpeta que el contador elige una vez.
 *
 * Funciona igual en Mac y en Windows: todo corre dentro de Chrome.
 */

import { useEffect, useRef, useState } from 'react';
import { CloudDownload, Loader2, Square, FolderOpen, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import { toast } from 'sonner';

type Enviar = <T = unknown>(msg: Record<string, unknown>, ms?: number) => Promise<T | undefined>;

interface EstadoExt {
  total: number;
  completados: number;
  errores: number;
  pendientes: number;
  reintentando: number;
  corriendo: boolean;
  pausadoPorValidacion: boolean;
  ultimoBloqueo?: { detalle?: string } | null;
  velocidadPorMin?: number;
  etaSeg?: number | null;
  modo?: string;
  rango?: { desde: string; hasta: string; listado: string } | null;
  ultimoLog?: string;
  carpeta?: string;
}

interface Props {
  enviar: Enviar;
  onImportar: (archivos: File[]) => void;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DescargaPorRango({ enviar, onImportar }: Props) {
  const hoy = new Date();
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)));
  const [hasta, setHasta] = useState(iso(hoy));
  const [listado, setListado] = useState<'recibidos' | 'enviados'>('recibidos');
  const [enlace, setEnlace] = useState('');
  const [estado, setEstado] = useState<EstadoExt | null>(null);
  const [registro, setRegistro] = useState<string[]>([]);
  const [iniciando, setIniciando] = useState(false);
  const [importando, setImportando] = useState(false);
  const ultimoLog = useRef('');

  // Avance en vivo: se consulta a la extensión mientras haya algo corriendo
  // (o una vez al abrir, por si quedó una descarga a medias).
  useEffect(() => {
    let vivo = true;
    const tic = async () => {
      const e = await enviar<EstadoExt>({ tipo: 'estado' }, 3000);
      if (!vivo || !e) return;
      if (e.modo === 'rango') setEstado(e);
      if (e.ultimoLog && e.ultimoLog !== ultimoLog.current) {
        ultimoLog.current = e.ultimoLog;
        const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setRegistro((r) => [`${hora}  ${e.ultimoLog}`, ...r].slice(0, 200));
      }
    };
    void tic();
    const id = setInterval(() => { void tic(); }, 1500);
    return () => { vivo = false; clearInterval(id); };
  }, [enviar]);

  const iniciar = async () => {
    if (!desde || !hasta || desde > hasta) { toast.error('Revisa las fechas.'); return; }
    setIniciando(true);
    setRegistro([]);
    ultimoLog.current = '';
    const r = await enviar<{ ok: boolean; error?: string }>({
      tipo: 'iniciarRango', desde, hasta, listado, urlDian: enlace.trim() || undefined,
    }, 15000);
    setIniciando(false);
    if (!r?.ok) { toast.error(r?.error ?? 'La extensión no respondió.'); return; }
    toast.success('Descarga iniciada. Se abrió una ventana de la DIAN: déjala abierta.');
  };

  const importar = async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) { toast.error('Tu navegador no permite elegir carpetas. Usa Chrome, o arrastra la carpeta al recuadro de XML en Inicio.'); return; }
    try {
      const dir = await picker();
      setImportando(true);
      const archivos: File[] = [];
      const recorrer = async (h: FileSystemDirectoryHandle, prof = 0) => {
        if (prof > 3) return;
        for await (const entrada of (h as unknown as { values: () => AsyncIterable<FileSystemHandle> }).values()) {
          if (entrada.kind === 'file' && /\.(zip|xml)$/i.test(entrada.name)) {
            archivos.push(await (entrada as FileSystemFileHandle).getFile());
          } else if (entrada.kind === 'directory') {
            await recorrer(entrada as FileSystemDirectoryHandle, prof + 1);
          }
        }
      };
      await recorrer(dir);
      setImportando(false);
      if (archivos.length === 0) { toast.error('No encontré archivos .zip ni .xml en esa carpeta.'); return; }
      onImportar(archivos);
    } catch (e) {
      setImportando(false);
      if ((e as { name?: string })?.name !== 'AbortError') toast.error('No pude leer esa carpeta.');
    }
  };

  const corriendo = Boolean(estado?.corriendo);
  const pct = estado && estado.total > 0 ? Math.round(((estado.completados + estado.errores) / estado.total) * 100) : 0;

  return (
    <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-indigo-950">
        <CloudDownload className="size-4" /> Descargar todo un rango de fechas
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-indigo-900/70">
        Entra primero a la DIAN con el enlace del token en este mismo Chrome (o pégalo abajo). La extensión busca el
        rango y baja el XML y el PDF de cada documento, sin pegar CUFEs.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-[11px] font-semibold text-slate-600">Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} disabled={corriendo}
            className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-[11px] font-semibold text-slate-600">Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} disabled={corriendo}
            className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-[11px] font-semibold text-slate-600">Documentos
          <select value={listado} onChange={(e) => setListado(e.target.value as 'recibidos' | 'enviados')} disabled={corriendo}
            className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm">
            <option value="recibidos">Recibidos (compras)</option>
            <option value="enviados">Enviados (ventas)</option>
          </select>
        </label>
      </div>
      <div className="mt-3 space-y-2">
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-[11.5px] leading-relaxed text-blue-900">
          <b>Puedes seguir usando tu computador</b> mientras descarga. Solo no cierres ni minimices la ventana de la DIAN que se abre.
        </p>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">
          <b>La DIAN puede pedirte que confirmes que eres humano</b> (casilla de "no soy un robot"). Si pasa, la ventana de la DIAN
          sale al frente y aquí aparece un aviso: haz el clic allá y luego dale continuar.
        </p>
      </div>
      <input
        value={enlace}
        onChange={(e) => setEnlace(e.target.value)}
        disabled={corriendo}
        placeholder="Enlace del token de la DIAN (opcional si ya entraste)"
        className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {!corriendo ? (
          <button type="button" onClick={() => void iniciar()} disabled={iniciando}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            {iniciando ? <Loader2 className="size-3.5 animate-spin" /> : <CloudDownload className="size-3.5" />}
            Iniciar descarga
          </button>
        ) : (
          <button type="button" onClick={() => void enviar({ tipo: 'detener' })}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">
            <Square className="size-3.5" /> Detener
          </button>
        )}
        <button type="button" onClick={() => void enviar({ tipo: 'abrirCarpeta' })}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <FolderOpen className="size-3.5" /> Ver carpeta
        </button>
        <button type="button" onClick={() => void importar()} disabled={importando}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {importando ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
          Importar a Codec
        </button>
      </div>

      {estado && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-600">
            <span>
              {estado.completados} descargados de {estado.total} encontrados
              {estado.errores > 0 ? `, ${estado.errores} con error` : ''}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          {estado.carpeta && (
            <p className="mt-1 text-[10.5px] text-slate-400">Se guardan en Descargas/{estado.carpeta}</p>
          )}
          {estado.pausadoPorValidacion && (
            <div className="mt-3 rounded-xl bg-amber-100 px-3 py-2.5 text-xs text-amber-950">
              <p className="flex items-center gap-1.5 font-bold"><AlertTriangle className="size-3.5" /> La DIAN pidió una verificación</p>
              <p className="mt-0.5">Resuélvela en la ventana de la DIAN que se abrió y luego dale continuar.</p>
              <button type="button" onClick={() => void enviar({ tipo: 'reanudarValidacion' })}
                className="mt-2 rounded-lg bg-amber-900 px-3 py-1.5 font-bold text-white">Ya la resolví, continuar</button>
            </div>
          )}
          {!estado.corriendo && estado.total > 0 && !estado.pausadoPorValidacion && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="size-3.5" /> Terminó. Dale «Importar a Codec» y elige la carpeta Descargas/{estado.carpeta ?? 'DIAN'}.
            </p>
          )}
        </div>
      )}

      {registro.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-emerald-200">
          {registro.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}
    </div>
  );
}

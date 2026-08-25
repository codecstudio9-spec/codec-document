/**
 * Panel de "subir documentos" para el contrato de wedding-planner — PARTE 2
 * del pedido del usuario (2026-08-25). Distinto de AbonosPanel (que es
 * sólo para pagos con monto): aquí cualquiera de las dos partes sube
 * CUALQUIER archivo de seguimiento —captura de pantalla, comprobante de
 * pago, foto de una página del contrato firmado— clasificado por tipo, y
 * ambas partes ven la lista completa. Vive junto a AbonosPanel dentro de
 * sign-transaction-page.tsx ('done' / 'already_signed'), montado sólo
 * cuando tx.document_type === 'wedding-planner'.
 */
import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Loader, Plus, X, ExternalLink, Trash2, Receipt, Camera, FileSignature, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import {
  listarEvidencias, crearEvidencia, borrarEvidencia, getEvidenciaUrl,
  type DocumentEvidence, type TipoEvidencia,
} from '../../services/document-evidence-service';

const TIPOS: { valor: TipoEvidencia; icono: typeof Receipt; es: string; en: string }[] = [
  { valor: 'comprobante_pago', icono: Receipt, es: 'Comprobante de pago', en: 'Payment proof' },
  { valor: 'captura_pantalla', icono: Camera, es: 'Captura de pantalla', en: 'Screenshot' },
  { valor: 'pagina_contrato', icono: FileSignature, es: 'Página del contrato firmado', en: 'Signed contract page' },
  { valor: 'otro', icono: Paperclip, es: 'Otro documento', en: 'Other document' },
];

function etiquetaTipo(tipo: TipoEvidencia, language: 'en' | 'es'): string {
  const t = TIPOS.find((x) => x.valor === tipo);
  if (!t) return tipo;
  return language === 'en' ? t.en : t.es;
}

function IconoTipo({ tipo }: { tipo: TipoEvidencia }) {
  const t = TIPOS.find((x) => x.valor === tipo);
  const Icono = t?.icono ?? FileText;
  return <Icono className="size-3.5" />;
}

function VerArchivo({ path, etiqueta }: { path: string; etiqueta: string }) {
  const [cargando, setCargando] = useState(false);
  const abrir = async () => {
    setCargando(true);
    const url = await getEvidenciaUrl(path).finally(() => setCargando(false));
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('No se pudo abrir el archivo.');
  };
  return (
    <button type="button" onClick={() => void abrir()} disabled={cargando} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50">
      {cargando ? <Loader className="size-3 animate-spin" /> : <ExternalLink className="size-3" />}
      {etiqueta}
    </button>
  );
}

export function DocumentEvidencePanel({ transactionId, esPlanner, language }: {
  transactionId: string;
  esPlanner: boolean;
  language: 'en' | 'es';
}) {
  const tr = (en: string, es: string) => (language === 'en' ? en : es);
  const [items, setItems] = useState<DocumentEvidence[] | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = () => { listarEvidencias(transactionId).then(setItems).catch(() => setItems([])); };
  useEffect(() => { cargar(); }, [transactionId]);

  if (items === null) {
    return (
      <div className="flex justify-center py-4"><Loader className="size-4 animate-spin text-slate-300" /></div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm text-left w-full max-w-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800">{tr('Documents', 'Documentos')}</h2>
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
        >
          {mostrarForm ? <X className="size-3" /> : <Plus className="size-3" />}
          {tr('Upload document', 'Subir documento')}
        </button>
      </div>

      {mostrarForm && (
        <FormularioNuevaEvidencia
          transactionId={transactionId}
          esPlanner={esPlanner}
          language={language}
          onCreado={() => { setMostrarForm(false); cargar(); }}
        />
      )}

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">
            {tr('No documents uploaded yet.', 'Todavía no hay documentos subidos.')}
          </p>
        ) : items.map((it) => (
          <div key={it.id} className="rounded-xl border border-slate-100 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <IconoTipo tipo={it.tipo} />
                  {etiquetaTipo(it.tipo, language)}
                </p>
                {it.descripcion && <p className="mt-0.5 text-[11px] text-slate-500">{it.descripcion}</p>}
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {tr('Uploaded by', 'Subido por')} {it.subido_por === 'planner' ? tr('the planner', 'la planner') : tr('the client', 'el cliente')}
                  {' · '}
                  {new Date(it.creado_en).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <FilaAcciones evidencia={it} onBorrado={cargar} etiqueta={tr('View', 'Ver')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilaAcciones({ evidencia, onBorrado, etiqueta }: { evidencia: DocumentEvidence; onBorrado: () => void; etiqueta: string }) {
  const [borrando, setBorrando] = useState(false);
  const borrar = async () => {
    setBorrando(true);
    try {
      await borrarEvidencia(evidencia.id);
      onBorrado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setBorrando(false);
    }
  };
  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <VerArchivo path={evidencia.archivo_path} etiqueta={etiqueta} />
      <button type="button" disabled={borrando} onClick={() => void borrar()} className="text-slate-300 hover:text-red-500 disabled:opacity-50">
        {borrando ? <Loader className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
      </button>
    </div>
  );
}

function FormularioNuevaEvidencia({ transactionId, esPlanner, language, onCreado }: {
  transactionId: string;
  esPlanner: boolean;
  language: 'en' | 'es';
  onCreado: () => void;
}) {
  const tr = (en: string, es: string) => (language === 'en' ? en : es);
  const [tipo, setTipo] = useState<TipoEvidencia>('comprobante_pago');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const enviar = async () => {
    if (!archivo) { toast.error(tr('Attach a file first.', 'Adjunta un archivo primero.')); return; }
    setEnviando(true);
    try {
      await crearEvidencia({
        transactionId,
        tipo,
        descripcion,
        archivo,
        subidoPor: esPlanner ? 'planner' : 'cliente',
      });
      toast.success(tr('Document uploaded.', 'Documento subido.'));
      setDescripcion(''); setArchivo(null);
      onCreado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-slate-500">
          {tr('What type of document is this?', 'Qué tipo de documento es')}
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEvidencia)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-blue-400"
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>{language === 'en' ? t.en : t.es}</option>
          ))}
        </select>
      </div>
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder={tr('Short note (optional)', 'Nota corta (opcional)')}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-400"
      />
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-[11px] font-semibold text-slate-500"
      >
        <Upload className="size-3.5" />
        {archivo ? archivo.name : tr('Choose file', 'Elegir archivo')}
      </button>
      <button
        type="button"
        disabled={enviando}
        onClick={() => void enviar()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {enviando ? <Loader className="size-3.5 animate-spin" /> : tr('Upload', 'Subir')}
      </button>
    </div>
  );
}

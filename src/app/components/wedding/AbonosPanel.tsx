/**
 * Panel de abonos para el contrato de wedding-planner — PARTE 1 del pedido
 * del usuario (2026-08-23). Vive dentro de sign-transaction-page.tsx
 * ('done' / 'already_signed'), montado sólo cuando
 * tx.document_type === 'wedding-planner'.
 *
 * `esPlanner` decide qué controles se muestran (subir vs revisar), pero es
 * sólo UI — quien de verdad decide si puede aceptar/rechazar es
 * review_document_installment en el servidor (chequea auth.uid() contra el
 * creator_id real de la transacción). Ver document-installments-service.ts.
 */
import { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, XCircle, Clock, FileText, Loader, Plus, X, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listarAbonos, crearAbono, adjuntarComprobanteCliente, revisarAbono, borrarAbonoPendiente, getComprobanteUrl,
  type DocumentInstallment,
} from '../../services/document-installments-service';

function formatoMoneda(monto: number, moneda: string, language: 'en' | 'es'): string {
  try {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-CO', { style: 'currency', currency: moneda || 'COP', maximumFractionDigits: 0 }).format(monto);
  } catch {
    return `${moneda} ${monto.toLocaleString()}`;
  }
}

function VerComprobante({ path, etiqueta }: { path: string; etiqueta: string }) {
  const [cargando, setCargando] = useState(false);
  const abrir = async () => {
    setCargando(true);
    const url = await getComprobanteUrl(path).finally(() => setCargando(false));
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('No se pudo abrir el comprobante.');
  };
  return (
    <button type="button" onClick={() => void abrir()} disabled={cargando} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50">
      {cargando ? <Loader className="size-3 animate-spin" /> : <ExternalLink className="size-3" />}
      {etiqueta}
    </button>
  );
}

function Badge({ estado, language }: { estado: DocumentInstallment['estado']; language: 'en' | 'es' }) {
  const mapa = {
    pendiente_revision: { color: '#D97706', bg: '#FFFBEB', Icono: Clock, en: 'Awaiting review', es: 'Por revisar' },
    aceptado: { color: '#059669', bg: '#ECFDF5', Icono: CheckCircle2, en: 'Accepted', es: 'Aceptado' },
    rechazado: { color: '#DC2626', bg: '#FEF2F2', Icono: XCircle, en: 'Rejected', es: 'Rechazado' },
  } as const;
  const m = mapa[estado];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ color: m.color, background: m.bg }}>
      <m.Icono className="size-3" />
      {language === 'en' ? m.en : m.es}
    </span>
  );
}

export function AbonosPanel({ transactionId, esPlanner, language }: {
  transactionId: string;
  esPlanner: boolean;
  language: 'en' | 'es';
}) {
  const tr = (en: string, es: string) => (language === 'en' ? en : es);
  const [abonos, setAbonos] = useState<DocumentInstallment[] | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = () => { listarAbonos(transactionId).then(setAbonos).catch(() => setAbonos([])); };
  useEffect(() => { cargar(); }, [transactionId]);

  if (abonos === null) {
    return (
      <div className="flex justify-center py-4"><Loader className="size-4 animate-spin text-slate-300" /></div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm text-left w-full max-w-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800">{tr('Payments', 'Abonos')}</h2>
        {!esPlanner && (
          <button
            type="button"
            onClick={() => setMostrarForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
          >
            {mostrarForm ? <X className="size-3" /> : <Plus className="size-3" />}
            {tr('Register payment', 'Registrar abono')}
          </button>
        )}
      </div>

      {!esPlanner && mostrarForm && (
        <FormularioNuevoAbono
          transactionId={transactionId}
          language={language}
          onCreado={() => { setMostrarForm(false); cargar(); }}
        />
      )}

      <div className="mt-3 space-y-2.5">
        {abonos.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">
            {tr('No payments registered yet.', 'Todavía no hay abonos registrados.')}
          </p>
        ) : abonos.map((a) => (
          <FilaAbono
            key={a.id}
            abono={a}
            esPlanner={esPlanner}
            language={language}
            onCambio={cargar}
          />
        ))}
      </div>
    </div>
  );
}

function FormularioNuevoAbono({ transactionId, language, onCreado }: {
  transactionId: string;
  language: 'en' | 'es';
  onCreado: () => void;
}) {
  const tr = (en: string, es: string) => (language === 'en' ? en : es);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const enviar = async () => {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) { toast.error(tr('Enter a valid amount.', 'Escribe un monto válido.')); return; }
    if (!archivo) { toast.error(tr('Attach your payment proof.', 'Adjunta tu comprobante de pago.')); return; }
    setEnviando(true);
    try {
      const abono = await crearAbono({ transactionId, descripcion, monto: montoNum, moneda });
      await adjuntarComprobanteCliente(abono.id, transactionId, archivo);
      toast.success(tr('Payment sent for review.', 'Abono enviado a revisión.'));
      setDescripcion(''); setMonto(''); setArchivo(null);
      onCreado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder={tr('What is this payment for (optional)', 'Para qué es este abono (opcional)')}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-400"
      />
      <div className="flex gap-2">
        <input
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder={tr('Amount', 'Monto')}
          inputMode="decimal"
          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-400"
        />
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-blue-400"
        >
          {['COP', 'USD', 'MXN', 'EUR', 'ARS', 'CLP', 'PEN'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-[11px] font-semibold text-slate-500"
      >
        <Upload className="size-3.5" />
        {archivo ? archivo.name : tr('Attach payment proof', 'Adjuntar comprobante de pago')}
      </button>
      <button
        type="button"
        disabled={enviando}
        onClick={() => void enviar()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {enviando ? <Loader className="size-3.5 animate-spin" /> : tr('Send for review', 'Enviar a revisión')}
      </button>
    </div>
  );
}

function FilaAbono({ abono, esPlanner, language, onCambio }: {
  abono: DocumentInstallment;
  esPlanner: boolean;
  language: 'en' | 'es';
  onCambio: () => void;
}) {
  const tr = (en: string, es: string) => (language === 'en' ? en : es);
  const [revisando, setRevisando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivoPropio, setArchivoPropio] = useState<File | null>(null);

  const aceptar = async () => {
    setRevisando(true);
    try {
      await revisarAbono({ installmentId: abono.id, transactionId: abono.transaction_id, aceptar: true, archivoPropio });
      toast.success(tr('Payment accepted.', 'Abono aceptado.'));
      onCambio();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setRevisando(false);
    }
  };

  const rechazar = async () => {
    setRevisando(true);
    try {
      await revisarAbono({ installmentId: abono.id, transactionId: abono.transaction_id, aceptar: false, motivoRechazo: motivo, archivoPropio });
      toast.success(tr('Payment rejected.', 'Abono rechazado.'));
      onCambio();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setRevisando(false);
    }
  };

  const borrar = async () => {
    setRevisando(true);
    try {
      await borrarAbonoPendiente(abono.id);
      onCambio();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setRevisando(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">
            {tr('Payment', 'Abono')} #{abono.numero} — {formatoMoneda(abono.monto, abono.moneda, language)}
          </p>
          {abono.descripcion && <p className="mt-0.5 text-[11px] text-slate-500">{abono.descripcion}</p>}
        </div>
        <Badge estado={abono.estado} language={language} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {abono.comprobante_cliente_path && (
          <VerComprobante path={abono.comprobante_cliente_path} etiqueta={tr('Client proof', 'Comprobante del cliente')} />
        )}
        {abono.comprobante_planner_path && (
          <VerComprobante path={abono.comprobante_planner_path} etiqueta={tr('Planner proof', 'Comprobante de la planner')} />
        )}
      </div>

      {abono.estado === 'rechazado' && abono.motivo_rechazo && (
        <p className="mt-1.5 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-700">{abono.motivo_rechazo}</p>
      )}

      {abono.estado === 'pendiente_revision' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
          {esPlanner ? (
            <>
              <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setArchivoPropio(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <FileText className="size-3" />
                {archivoPropio ? archivoPropio.name : tr('Attach my receipt (optional)', 'Adjuntar mi comprobante (opcional)')}
              </button>
              <div className="flex w-full gap-2">
                <button type="button" disabled={revisando} onClick={() => void aceptar()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
                  {revisando ? <Loader className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} {tr('Accept', 'Aceptar')}
                </button>
                <button type="button" disabled={revisando} onClick={() => setMostrarRechazo((v) => !v)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 text-[11px] font-bold text-red-600 disabled:opacity-50">
                  <XCircle className="size-3" /> {tr('Reject', 'Rechazar')}
                </button>
              </div>
              {mostrarRechazo && (
                <div className="flex w-full gap-2">
                  <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={tr('Reason (optional)', 'Motivo (opcional)')} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] outline-none" />
                  <button type="button" disabled={revisando} onClick={() => void rechazar()} className="rounded-lg bg-red-600 px-3 text-[11px] font-bold text-white disabled:opacity-50">
                    {tr('Confirm', 'Confirmar')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <button type="button" disabled={revisando} onClick={() => void borrar()} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-slate-400 disabled:opacity-50">
              <Trash2 className="size-3" /> {tr('Remove', 'Quitar')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

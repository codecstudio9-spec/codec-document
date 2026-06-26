import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CheckCircle2, FileText, PenLine, Clock, User } from 'lucide-react';
import { getSignerRoleLabel } from '../../utils/signer-roles';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface PreviewSigner {
  name: string;
  color: string;
  role: string;
  signatureDataUrl?: string;
  canSign?: boolean;
  onSign?: () => void;
  identification?: string;
  signedAt?: string;
}

interface PdfSignaturePreviewProps {
  pdfBytes: Uint8Array | null;
  signers: PreviewSigner[];
}

// ── Signer block — matches the exact spec the creator requested ───────────────
function SignerBlock({ signer, index }: { signer: PreviewSigner; index: number }) {
  const signed = Boolean(signer.signatureDataUrl);

  return (
    <div
      style={{
        border: `1.5px dashed ${signer.color}55`,
        borderRadius: '10px',
        padding: '20px 16px 16px',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* Corner badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          borderRadius: 99,
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 7px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          backgroundColor: signed ? '#d1fae5' : `${signer.color}18`,
          color: signed ? '#065f46' : signer.color,
        }}
      >
        {signed ? '✓ Firmado' : signer.role || `Firmante ${index + 1}`}
      </div>

      {signed ? (
        /* ── SIGNED STATE ─────────────────────────────────────────────── */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={signer.signatureDataUrl}
            alt={`Firma de ${signer.name}`}
            style={{
              width: '100%',
              maxHeight: 90,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
          />
          <div
            style={{
              width: '90%',
              borderTop: `1px solid ${signer.color}55`,
              marginTop: 12,
              marginBottom: 8,
            }}
          />
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0 }}>
            {signer.name}
          </p>
          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
            {signer.role}
            {signer.identification ? ` · CC: ${signer.identification}` : ''}
          </p>
          {signer.signedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#94a3b8' }}>
                {new Date(signer.signedAt).toLocaleString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      ) : signer.canSign ? (
        /* ── PENDING (interactive) ────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Espacio reservado para: <strong style={{ color: '#1e293b' }}>{signer.name}</strong>
          </p>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); signer.onSign?.(); }}
            style={{
              backgroundColor: signer.color,
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PenLine size={14} />
            Firmar aquí
          </button>
        </div>
      ) : (
        /* ── PENDING (waiting for another party) ──────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.45 }}>
          <User size={22} color={signer.color} />
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Espacio reservado para: <strong>{signer.name}</strong>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={10} color="#94a3b8" />
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pendiente de firma
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main preview component ─────────────────────────────────────────────────────
export function PdfSignaturePreview({ pdfBytes, signers }: PdfSignaturePreviewProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    if (!pdfBytes) return;
    if (pdfBytes === renderedRef.current) return;
    renderedRef.current = pdfBytes;

    void (async () => {
      try {
        setLoading(true); setReady(false);

        let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
        try {
          pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0), disableWorker: true } as any).promise;
        }

        const page = await pdf.getPage(pdf.numPages);
        const vp   = page.getViewport({ scale: 1.0 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width        = vp.width;
        canvas.height       = vp.height;
        canvas.style.width  = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        setReady(true);
      } catch (e) {
        console.error('PdfSignaturePreview render error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [pdfBytes]);

  // Universal 2-column mirror grid regardless of signer count
  const displaySigners = signers.slice(0, 4);
  const count          = displaySigners.length;
  const needFiller     = count > 0 && count % 2 === 1;

  // gridColumns is always repeat(2, 1fr) per spec
  const gridColumns = 'repeat(2, 1fr)';

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <FileText className="size-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Vista previa del documento</p>
          <p className="text-[10px] text-slate-400">
            {count > 0
              ? `${count} firmante${count !== 1 ? 's' : ''} · cuadrícula espejo`
              : 'Posición de firmas'}
          </p>
        </div>
        {count > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            {displaySigners.map((s, i) => (
              <div
                key={i}
                title={s.name}
                style={{ backgroundColor: s.color }}
                className="size-2.5 rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* ── PDF last-page canvas ────────────────────────────────────────────── */}
      <div className="relative border-b border-slate-100 bg-slate-50">
        {loading && (
          <div className="flex h-44 items-center justify-center">
            <p className="text-xs text-slate-400">Cargando documento…</p>
          </div>
        )}
        <canvas ref={canvasRef} className={`block w-full ${loading ? 'invisible h-0' : ''}`} />
        {ready && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-1.5"
            style={{
              height: '28%',
              background: 'linear-gradient(to top, rgba(99,102,241,0.10) 0%, transparent 100%)',
            }}
          >
            <span
              className="rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest text-indigo-400"
              style={{ background: 'rgba(255,255,255,0.90)' }}
            >
              ↓ Zona de firmas
            </span>
          </div>
        )}
      </div>

      {/* ── Signature grid — universal repeat(2, 1fr) ───────────────────────── */}
      <div className="bg-white p-4">
        <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
          Sección de firmas
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: 16,
            width: '100%',
          }}
        >
          {count === 0 ? (
            <>
              <SignerBlock
                signer={{ name: 'Firmante 1', color: '#3B82F6', role: getSignerRoleLabel(null, 0, 'es') }}
                index={0}
              />
              <SignerBlock
                signer={{ name: 'Firmante 2', color: '#F59E0B', role: getSignerRoleLabel(null, 1, 'es') }}
                index={1}
              />
            </>
          ) : (
            <>
              {displaySigners.map((s, i) => (
                <SignerBlock key={i} signer={s} index={i} />
              ))}
              {needFiller && (
                <div
                  style={{
                    border: '1.5px dashed #e2e8f0',
                    borderRadius: 10,
                    minHeight: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Firmante adicional
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Legal strip */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2">
          <CheckCircle2 className="size-3 text-emerald-500" />
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            E-SIGN Act · UETA · SHA-256 · Codec Document
          </span>
        </div>
      </div>
    </div>
  );
}

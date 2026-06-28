import { ShieldCheck, Download, FileCheck } from 'lucide-react';
import { triggerDownloadFromUrl } from '../../utils/download';

interface SignedSuccessScreenProps {
  onFinish: () => void;
  downloadUrl?: string;
  documentName?: string;
  documentId?: string;
}

export function SignedSuccessScreen({
  onFinish,
  downloadUrl,
  documentName = 'Documento firmado',
  documentId,
}: SignedSuccessScreenProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Premium glassmorphism card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-8 text-center shadow-[0_0_80px_rgba(16,185,129,0.15),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

          {/* Animated shield */}
          <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/20" />
            <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/40 to-teal-600/40 ring-1 ring-emerald-400/20">
              <ShieldCheck className="size-9 text-emerald-300" />
            </div>
          </div>

          {/* Badge */}
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">100% Legalmente Verificado</span>
          </div>

          <h2 className="text-2xl font-bold text-white">Documento firmado con éxito</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Ambas firmas han sido registradas, auditadas y compiladas de forma inmutable bajo los estándares de Codec Studio.
          </p>

          {documentName && (
            <div className="mx-auto mt-4 flex max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
              <FileCheck className="size-4 shrink-0 text-emerald-400" />
              <span className="truncate text-sm text-white/70">{documentName}</span>
            </div>
          )}

          {documentId && (
            <p className="mt-3 text-[10px] text-white/25 font-mono">ID: {documentId}</p>
          )}

          {/* Download + Finish buttons */}
          <div className="mt-7 flex flex-col gap-3">
            {downloadUrl && (
              <button
                type="button"
                onClick={() => {
                  void triggerDownloadFromUrl(downloadUrl, `${documentName}.pdf`).catch(() => {
                    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                  });
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-500 hover:to-teal-500"
              >
                <Download className="size-4" />
                Descargar PDF certificado
              </button>
            )}
            <button
              type="button"
              onClick={onFinish}
              className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Volver al inicio
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-white/30">
          <span>SHA-256 verificado</span>
          <span>·</span>
          <span>Trazabilidad biométrica</span>
          <span>·</span>
          <span>Codec Studio</span>
        </div>
      </div>
    </div>
  );
}

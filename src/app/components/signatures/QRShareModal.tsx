import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, MessageCircle, Mail, Shield, X } from 'lucide-react';

interface QRShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string;
  onCopy: () => void;
}

/*
 * Render INLINE (no createPortal / no Radix Dialog) intentionally.
 *
 * Radix Dialog uses ReactDOM.createPortal(content, document.body) internally,
 * which causes the same insertBefore crash as explicit createPortal calls when
 * browser extensions (Grammarly, LastPass, Supabase Studio, etc.) have mutated
 * document.body.  position:fixed with z-index handles viewport coverage without
 * needing to escape the React tree.
 */
export function QRShareModal({ open, onOpenChange, link, onCopy }: QRShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlace de firma generado"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9998 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 shadow-[0_0_60px_rgba(99,102,241,0.2)] backdrop-blur-2xl">
        {/* Top gradient line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
            <Shield className="size-4 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Enlace de firma generado</h2>
            <p className="mt-0.5 text-xs text-white/50">Válido por 48 horas · Codec Document</p>
          </div>
        </div>

        {/* QR code */}
        <div className="mx-auto mb-5 flex w-fit overflow-hidden rounded-2xl border border-white/10 bg-white p-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <QRCodeSVG
            value={link || 'https://codec.document'}
            size={200}
            bgColor="#ffffff"
            fgColor="#1e1b4b"
          />
        </div>

        {/* Link display */}
        <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
          <p className="break-all text-xs text-white/60">{link}</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={[
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300',
              copied
                ? 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                : 'border border-indigo-400/30 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30',
            ].join(' ')}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(`Firma este documento: ${link}`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </button>

          <button
            type="button"
            onClick={() => {
              const subject = encodeURIComponent('Solicitud de firma – Codec Document');
              const body = encodeURIComponent(
                `Por favor firma este documento mediante el siguiente enlace:\n\n${link}\n\nEste enlace caduca en 48 horas.`,
              );
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Mail className="size-4" />
            Email
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-3 w-full rounded-xl border border-white/8 bg-white/5 py-2.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          Cerrar y esperar firma
        </button>
      </div>
    </div>
  );
}

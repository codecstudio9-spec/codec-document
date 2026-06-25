import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import SignatureCanvas from 'react-signature-canvas';
import { Check, Trash2, ShieldCheck } from 'lucide-react';
import { submitMobileSignature, pollMobileSignature } from '../services/signature-storage-service';

export function QuickSignPage() {
  const { token } = useParams<{ token: string }>();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<'ready' | 'submitting' | 'done' | 'error' | 'invalid'>('ready');
  const [errorMsg, setErrorMsg] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    pollMobileSignature(token).then((sig) => {
      // If sig_data already filled, link already used
      if (sig) setStatus('invalid');
    }).catch(() => setStatus('invalid'));
  }, [token]);

  // Canvas resize — ResizeObserver fires after layout, handles portal/modal timing
  useEffect(() => {
    if (status !== 'ready') return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let rafId: ReturnType<typeof requestAnimationFrame>;

    const syncSize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const pad = sigRef.current;
        if (!pad) return;
        const canvas = pad.getCanvas();
        const w = wrap.offsetWidth || 320;
        const h = canvas.offsetHeight || 220;
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        pad.clear();
      });
    };

    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);
    syncSize();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [status]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrorMsg('Please draw your signature before confirming.');
      return;
    }
    setErrorMsg('');
    setStatus('submitting');

    try {
      const rawCanvas = sigRef.current.getCanvas();
      const out = document.createElement('canvas');
      out.width = rawCanvas.width;
      out.height = rawCanvas.height;
      const ctx = out.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(rawCanvas, 0, 0);
      const dataUrl = out.toDataURL('image/png');

      await submitMobileSignature(token, dataUrl);
      setStatus('done');
    } catch (err) {
      setErrorMsg('Could not send signature. Please try again.');
      setStatus('ready');
    }
  };

  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-xs">
          <p className="text-lg font-bold text-slate-800">Link not found</p>
          <p className="mt-1 text-sm text-slate-500">This signing link is invalid or has already been used. Return to the desktop and generate a new QR code.</p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="size-9 text-emerald-600" />
        </div>
        <div>
          <p className="text-xl font-extrabold text-slate-900">Signature sent!</p>
          <p className="mt-1.5 text-sm text-slate-500">Your signature has been submitted. You can close this tab — the desktop will update automatically.</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="size-3.5" />
          E-SIGN &amp; UETA Compliant
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">Codec Document</span>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">E-SIGN Compliant</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Sign Document</h1>
          <p className="mt-1 text-sm text-slate-500">Draw your signature below. This will be applied to the document on the other device.</p>
        </div>

        {/* Canvas */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-inner">
          <div ref={wrapRef}>
            <SignatureCanvas
              ref={(r) => { sigRef.current = r; }}
              penColor="#1e3a8a"
              backgroundColor="rgb(255,255,255)"
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{
                className: 'block w-full',
                style: { height: 220, touchAction: 'none', display: 'block', background: 'white' },
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}

        <button
          type="button"
          onClick={() => sigRef.current?.clear()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <Trash2 className="size-4" />
          Clear &amp; Redraw
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          {status === 'submitting' ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending…
            </>
          ) : (
            <>
              <Check className="size-5" />
              Confirm &amp; Send Signature
            </>
          )}
        </button>
      </div>
    </div>
  );
}

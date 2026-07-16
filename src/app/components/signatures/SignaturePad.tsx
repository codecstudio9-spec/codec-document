import { useMemo, useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeSVG } from 'qrcode.react';
import {
  Trash2, Check, X, Minus, Plus, Smartphone,
  RefreshCw, RotateCcw, Copy, ShieldCheck, MessageCircle, Undo2, Redo2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  getSavedSignature,
  saveSavedSignature,
  createMobileSignToken,
  pollMobileSignature,
  deleteMobileSignToken,
} from '../../services/signature-storage-service';
import { getGuestSignature, saveGuestSignature } from '../../services/guest-signature-storage';

interface SignaturePadProps {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
  signerName?: string;
  userId?: string;
}

type StrokeData = ReturnType<SignatureCanvas['toData']>;

// Crops a drawn signature to the bounding box of its actual ink (plus a
// small margin), discarding the empty transparent space around it. Without
// this, a small signature drawn in a corner of the pad still occupies the
// pad's full canvas size once embedded in the document — this is why
// signatures looked "too big" even though the ink itself was reasonably
// sized.
function trimTransparentMargins(canvas: HTMLCanvasElement, marginPx = 14): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');
  const { width, height } = canvas;
  if (width === 0 || height === 0) return canvas.toDataURL('image/png');
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width, minY = height, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return canvas.toDataURL('image/png');
  minX = Math.max(0, minX - marginPx);
  minY = Math.max(0, minY - marginPx);
  maxX = Math.min(width, maxX + marginPx);
  maxY = Math.min(height, maxY + marginPx);
  const cropW = maxX - minX, cropH = maxY - minY;
  const out = document.createElement('canvas');
  out.width = cropW; out.height = cropH;
  const octx = out.getContext('2d');
  if (!octx) return canvas.toDataURL('image/png');
  octx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return out.toDataURL('image/png');
}

const FONTS = [
  { value: 'cursive',                   label: 'Manuscrita' },
  { value: '"Dancing Script", cursive',  label: 'Script'     },
  { value: 'serif',                      label: 'Serif'       },
  { value: 'sans-serif',                 label: 'Sans'        },
];

type Tab       = 'draw' | 'type' | 'upload' | 'mobile';
type SavedView = 'saved' | 'new';

// ─── Underline tab button ─────────────────────────────────────────────────────
function TabBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-11 flex-1 border-b-2 pb-2 pt-2 text-xs font-semibold transition-all active:scale-[0.97]',
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-400 hover:text-slate-600',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function SignaturePad({ onConfirm, onCancel, signerName = '', userId }: SignaturePadProps) {
  const sigRef        = useRef<SignatureCanvas | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const undoStack     = useRef<StrokeData[]>([]);
  const redoStack     = useRef<StrokeData[]>([]);

  const [tab,           setTab]           = useState<Tab>('draw');
  const [savedView,     setSavedView]     = useState<SavedView>('saved');
  const [savedSigUrl,   setSavedSigUrl]   = useState<string | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [typedName,     setTypedName]     = useState(signerName);
  const [fontFamily,    setFontFamily]    = useState('cursive');
  const [strokeWidth,   setStrokeWidth]   = useState(2.5);
  const [uploadedImage, setUploadedImage] = useState('');
  const [linkCopied,    setLinkCopied]    = useState(false);

  // Tracks whether the user has drawn at least one stroke on the canvas
  const [isDrawn,   setIsDrawn]   = useState(false);
  const [drawError, setDrawError] = useState(false);
  const [canUndo,   setCanUndo]   = useState(false);
  const [canRedo,   setCanRedo]   = useState(false);
  const [drawPreview, setDrawPreview] = useState('');

  // (no two-step confirm — clicking Confirmar Firma stamps immediately)

  const [mobileToken,    setMobileToken]    = useState<string | null>(null);
  const [mobilePolling,  setMobilePolling]  = useState(false);
  const [mobileReceived, setMobileReceived] = useState(false);
  const [mobileSignData, setMobileSignData] = useState('');

  // ── Load saved signature (account, or this browser for guests) ──────────
  useEffect(() => {
    if (!userId) {
      const guestUrl = getGuestSignature();
      if (guestUrl) { setSavedSigUrl(guestUrl); setSavedView('saved'); }
      else setSavedView('new');
      return;
    }
    getSavedSignature(userId)
      .then((url) => {
        if (url) { setSavedSigUrl(url); setSavedView('saved'); }
        else setSavedView('new');
      })
      .catch(() => setSavedView('new'));
  }, [userId]);

  // ── Canvas resize sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'draw' || savedView !== 'new') return;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    let rafId: ReturnType<typeof requestAnimationFrame>;
    const syncSize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const pad = sigRef.current;
        if (!pad) return;
        const canvas = pad.getCanvas();
        const w = wrap.offsetWidth || 380;
        const h = canvas.offsetHeight || 144;
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w; canvas.height = h; pad.clear(); setIsDrawn(false);
      });
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap); syncSize();
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, [tab, savedView]);

  // ── Auto-confirm when mobile signature arrives ───────────────────────────
  useEffect(() => {
    if (!mobileReceived || !mobileSignData) return;
    if (saveForFuture) {
      if (userId) void saveSavedSignature(userId, mobileSignData);
      else saveGuestSignature(mobileSignData);
    }
    onConfirm(mobileSignData);
  // onConfirm identity is stable per parent; intentionally omit to avoid loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileReceived, mobileSignData]);

  // ── Global cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
      if (mobileToken) void deleteMobileSignToken(mobileToken);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Typed signature preview ──────────────────────────────────────────────
  const typedSignature = useMemo(() => {
    if (!typedName.trim()) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 560; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = `italic 62px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), 20, 82);
    return canvas.toDataURL('image/png');
  }, [typedName, fontFamily]);

  // ── Mobile QR — Realtime subscription + polling fallback ─────────────────
  const startMobileSigning = async () => {
    const token = await createMobileSignToken();
    setMobileToken(token); setMobilePolling(true); setMobileReceived(false); setMobileSignData('');

    // Primary: Supabase Realtime (instant, no delay)
    const channel = supabase
      .channel(`mobile-sig-${token}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'mobile_signatures',
          filter: `token=eq.${token}`,
        },
        (payload) => {
          const updated = payload.new as { sig_data?: string };
          if (updated.sig_data) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            void supabase.removeChannel(channel);
            setMobilePolling(false); setMobileReceived(true); setMobileSignData(updated.sig_data);
          }
        },
      )
      .subscribe();
    channelRef.current = channel;

    // Fallback: polling every 4 s (works even if Realtime is not enabled on table)
    pollingRef.current = setInterval(async () => {
      try {
        const sig = await pollMobileSignature(token);
        if (sig) {
          clearInterval(pollingRef.current!);
          void supabase.removeChannel(channel);
          setMobilePolling(false); setMobileReceived(true); setMobileSignData(sig);
        }
      } catch { /* network error — next tick will retry */ }
    }, 4000);
  };

  const cancelMobileSigning = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (mobileToken) void deleteMobileSignToken(mobileToken);
    setMobileToken(null); setMobilePolling(false); setMobileReceived(false);
  };

  const switchToMobile = () => {
    cancelMobileSigning();
    setTab('mobile');
    void startMobileSigning();
  };

  const mobileSignUrl = mobileToken ? `${window.location.origin}/quick-sign/${mobileToken}` : '';

  const copyMobileLink = () => {
    if (!mobileSignUrl) return;
    void navigator.clipboard.writeText(mobileSignUrl);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  // ── Tab switch helpers ────────────────────────────────────────────────────
  const switchTab = (next: Tab) => {
    cancelMobileSigning();
    setTab(next);
    setIsDrawn(false);
    setDrawError(false);
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setDrawPreview('');
  };

  // ── Draw tab: stroke history + live cropped preview ──────────────────────
  const handleClearDraw = () => {
    sigRef.current?.clear();
    setIsDrawn(false);
    setDrawError(false);
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setDrawPreview('');
  };

  const refreshDrawPreview = () => {
    const pad = sigRef.current;
    if (!pad || pad.isEmpty()) { setDrawPreview(''); return; }
    setDrawPreview(trimTransparentMargins(pad.getCanvas()));
  };

  const handleStrokeBegin = () => {
    undoStack.current.push(sigRef.current?.toData() ?? []);
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setIsDrawn(true);
    setDrawError(false);
  };

  const handleStrokeEnd = () => refreshDrawPreview();

  const handleUndo = () => {
    const pad = sigRef.current;
    if (!pad || undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(pad.toData());
    pad.fromData(prev);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setIsDrawn(prev.length > 0);
    refreshDrawPreview();
  };

  const handleRedo = () => {
    const pad = sigRef.current;
    if (!pad || redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(pad.toData());
    pad.fromData(next);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setIsDrawn(next.length > 0);
    refreshDrawPreview();
  };

  // ── Validate and stamp immediately — no confirmation dialog ──────────────
  const handleConfirmClick = () => {
    let dataUrl = '';

    if (savedView === 'saved' && savedSigUrl) {
      dataUrl = savedSigUrl;
    } else if (tab === 'draw') {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        setDrawError(true);
        setTimeout(() => setDrawError(false), 1400);
        return;
      }
      dataUrl = trimTransparentMargins(sigRef.current.getCanvas());
    } else if (tab === 'type' && typedSignature) {
      dataUrl = typedSignature;
    } else if (tab === 'upload' && uploadedImage) {
      dataUrl = uploadedImage;
    } else if (tab === 'mobile' && mobileSignData) {
      dataUrl = mobileSignData;
    }

    if (!dataUrl) return;
    if (saveForFuture && dataUrl !== savedSigUrl) {
      if (userId) void saveSavedSignature(userId, dataUrl);
      else saveGuestSignature(dataUrl);
    }
    onConfirm(dataUrl);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER A: Saved signature quick-use
  // ══════════════════════════════════════════════════════════════════════════
  if (savedView === 'saved' && savedSigUrl) {
    return (
      <div className="space-y-3.5">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Firma guardada
          </p>
          <div className="flex min-h-[56px] items-center justify-center rounded-lg border border-slate-100 bg-white px-3">
            <img src={savedSigUrl} alt="Firma guardada" className="max-h-12 max-w-full object-contain" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirmClick}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[12px] font-bold text-white transition hover:bg-blue-700"
          >
            <Check className="size-3.5" /> Usar esta firma
          </button>
          <button
            type="button"
            onClick={() => { setSavedView('new'); setSaveForFuture(false); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5" /> Nueva
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-1 text-[11px] text-slate-400 transition hover:text-slate-600"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER C: Full pad (draw / type / upload / mobile)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3.5">

      {/* ── Underline tabs ─────────────────────────────────────────────────── */}
      {tab !== 'mobile' && (
        <div className="flex border-b border-slate-100">
          <TabBtn label="Dibujar" active={tab === 'draw'}   onClick={() => switchTab('draw')}   />
          <TabBtn label="Texto"   active={tab === 'type'}   onClick={() => switchTab('type')}   />
          <TabBtn label="Imagen"  active={tab === 'upload'} onClick={() => switchTab('upload')} />
        </div>
      )}

      {/* ── Draw ─────────────────────────────────────────────────────────── */}
      {tab === 'draw' && (
        <div className="space-y-2">
          <div
            ref={canvasWrapRef}
            className="overflow-hidden bg-white transition-all"
            style={{
              border: drawError ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: 12,
            }}
          >
            <SignatureCanvas
              ref={(r) => { sigRef.current = r; }}
              penColor="#1a1a2e"
              backgroundColor="rgba(0,0,0,0)"
              minWidth={strokeWidth * 0.6}
              maxWidth={strokeWidth}
              onBegin={handleStrokeBegin}
              onEnd={handleStrokeEnd}
              canvasProps={{
                className: 'block w-full',
                style: { touchAction: 'none', display: 'block', background: 'transparent', height: 220 },
              }}
            />
          </div>

          {/* Error hint */}
          {drawError && (
            <p className="text-center text-[10px] font-semibold text-red-500">
              Dibuja tu firma antes de continuar
            </p>
          )}

          {/* Controls row — 44px+ tap targets via padding, not just the
              visible icon size, so a thumb doesn't need pixel precision. */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleClearDraw}
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
              >
                <Trash2 className="size-3.5" /> Borrar
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex size-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                title="Deshacer"
              >
                <Undo2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex size-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                title="Rehacer"
              >
                <Redo2 className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="mr-0.5">Grosor</span>
              <button
                type="button"
                onClick={() => setStrokeWidth((w) => Math.max(1, w - 0.5))}
                className="flex size-11 items-center justify-center rounded-lg transition hover:bg-slate-50 hover:text-slate-700 active:scale-90"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-5 text-center">{strokeWidth.toFixed(1)}</span>
              <button
                type="button"
                onClick={() => setStrokeWidth((w) => Math.min(6, w + 0.5))}
                className="flex size-11 items-center justify-center rounded-lg transition hover:bg-slate-50 hover:text-slate-700 active:scale-90"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Live preview of the cropped signature — shows exactly what
              gets stamped on the document, since the auto-crop removes the
              empty transparent margins around the ink. */}
          {drawPreview && (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
              <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Vista previa
              </p>
              <div className="flex min-h-[44px] items-center justify-center rounded-lg bg-white px-3 py-1.5">
                <img src={drawPreview} alt="Vista previa de la firma" className="max-h-10 max-w-full object-contain" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Type ─────────────────────────────────────────────────────────── */}
      {tab === 'type' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Escribe tu nombre completo"
              className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-[13px] outline-none transition"
              style={{ border: '1px solid #e2e8f0' }}
            />
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="rounded-xl bg-white px-2 py-2 text-[11px] text-slate-600 outline-none"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div
            className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-xl bg-white px-4 py-2"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {typedSignature
              ? <img src={typedSignature} alt="Vista previa" className="max-h-20 w-full object-contain" />
              : <p className="text-[12px] text-slate-300">Vista previa de la firma</p>
            }
          </div>
        </div>
      )}

      {/* ── Upload ───────────────────────────────────────────────────────── */}
      {tab === 'upload' && (
        <div className="space-y-2">
          <label
            className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center transition hover:bg-slate-100"
            style={{ border: '1.5px dashed #cbd5e1' }}
          >
            <span className="text-[11px] text-slate-400">Arrastra tu firma o haz clic</span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
              Seleccionar PNG / JPG
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setUploadedImage(String(ev.target?.result || ''));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {uploadedImage && (
            <div className="overflow-hidden rounded-xl bg-white p-2" style={{ border: '1px solid #e2e8f0' }}>
              <img src={uploadedImage} alt="Firma subida" className="max-h-16 w-full object-contain" />
            </div>
          )}
        </div>
      )}

      {/* ── Mobile QR panel ──────────────────────────────────────────────── */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          {/* Back row */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => switchTab('draw')}
              className="flex items-center gap-1.5 pb-2 pt-0.5 text-[11px] font-semibold text-slate-400 transition hover:text-slate-600"
            >
              ← Volver
            </button>
          </div>

          {/* State 1: generating token */}
          {!mobileToken && !mobileReceived && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Smartphone className="size-9 text-blue-400" />
              <div>
                <p className="text-[13px] font-bold text-slate-800">Firma desde tu celular</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Se genera un código QR. Ábrelo desde tu móvil, dibuja tu firma y se sincroniza aquí al instante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void startMobileSigning()}
                className="rounded-xl bg-blue-600 px-5 py-2 text-[12px] font-bold text-white transition hover:bg-blue-700"
              >
                Generar código QR
              </button>
            </div>
          )}

          {/* State 2: QR visible, waiting for mobile signature */}
          {mobileToken && !mobileReceived && (
            <div className="flex flex-col items-center gap-3">
              <div
                className="overflow-hidden rounded-2xl bg-white p-2.5 shadow-md"
                style={{ border: '3px solid #e0e7ff' }}
              >
                <QRCodeSVG value={mobileSignUrl} size={148} bgColor="#ffffff" fgColor="#1e1b4b" level="M" />
              </div>

              <div className="text-center">
                <p className="text-[12px] font-semibold text-slate-700">Escanea con tu celular</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  O envía el link por WhatsApp para firmar desde tu dispositivo táctil
                </p>
                {mobilePolling && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-blue-400">
                    <RefreshCw className="size-3 animate-spin" /> Esperando firma en tiempo real…
                  </p>
                )}
              </div>

              {/* WhatsApp share button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Necesito que firmes este documento: ${mobileSignUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <MessageCircle className="size-3.5" /> Enviar link por WhatsApp
              </a>

              {/* Link copy row */}
              <div
                className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <p className="flex-1 truncate text-[9px] text-slate-400">{mobileSignUrl}</p>
                <button
                  type="button"
                  onClick={copyMobileLink}
                  className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-bold transition ${
                    linkCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {linkCopied ? (<><Check className="size-3" /> Copiado</>) : <Copy className="size-3" />}
                </button>
              </div>

              <button
                type="button"
                onClick={cancelMobileSigning}
                className="text-[11px] text-slate-400 transition hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* State 3: signature received from mobile */}
          {mobileReceived && mobileSignData && (
            <div className="space-y-3">
              <div
                className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-50 py-3 text-center"
                style={{ border: '1px solid #a7f3d0' }}
              >
                <Check className="size-6 text-emerald-600" />
                <p className="text-[12px] font-semibold text-emerald-800">¡Firma recibida desde el celular!</p>
              </div>
              <div className="overflow-hidden rounded-xl bg-white p-2" style={{ border: '1px solid #e2e8f0' }}>
                <img src={mobileSignData} alt="Firma celular" className="max-h-16 w-full object-contain" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile CTA banner (only on draw/type/upload tabs) ───────────── */}
      {tab !== 'mobile' && (
        <button
          type="button"
          onClick={switchToMobile}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             12,
            width:           '100%',
            padding:         '11px 14px',
            borderRadius:    12,
            border:          '1.5px solid #c7d2fe',
            background:      'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
            cursor:          'pointer',
            textAlign:       'left',
            transition:      'filter 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.97)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Smartphone size={18} color="#ffffff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1e40af', lineHeight: 1.4 }}>
              ¿Prefieres firmar con el dedo?
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#2563eb', lineHeight: 1.4 }}>
              Firmar desde el celular (Código QR) →
            </p>
          </div>
        </button>
      )}

      {/* ── Save for future ───────────────────────────────────────────────── */}
      {tab !== 'mobile' && (
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={saveForFuture}
            onChange={(e) => setSaveForFuture(e.target.checked)}
            className="size-3 rounded border-slate-300 accent-blue-600"
          />
          <span className="text-[10px] text-slate-400">Guardar para futuros documentos</span>
        </label>
      )}

      {/* ── Action row: Cancelar | Confirmar Firma ──────────────────────────
          min-h-12 (48px) on every screen size — the accessibility-standard
          minimum touch target, not just a desktop-comfortable click area. */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.97]"
        >
          <X className="size-4" /> Cancelar
        </button>

        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={
            (tab === 'draw'   && !isDrawn)        ||
            (tab === 'mobile' && !mobileReceived) ||
            (tab === 'type'   && !typedSignature) ||
            (tab === 'upload' && !uploadedImage)
          }
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          <Check className="size-4" /> Confirmar Firma
        </button>
      </div>
    </div>
  );
}

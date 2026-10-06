import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Loader, Nfc, X } from 'lucide-react';

/*
 * "Firmar en persona": the creator hands their phone/screen to the signer
 * (or holds it up), and the signer opens their own /guest-sign/ link by
 * pointing their camera at a big QR — works on every iPhone and Android
 * with zero install.
 *
 * Optional extra: on Chrome for Android (the only browser with Web NFC),
 * the creator can write the same link onto a blank NFC sticker/card. Any
 * phone, iPhone included, then opens the link just by tapping the card.
 * True phone-to-phone NFC is NOT possible from a web app (Android Beam was
 * removed in Android 10, iOS never allowed it) — see CLAUDE.md.
 *
 * Rendered inline (no portal), same reason as QRShareModal.
 */

// Web NFC isn't in TypeScript's DOM lib yet.
type NdefWriter = { write: (msg: { records: { recordType: 'url'; data: string }[] }) => Promise<void> };
type WakeLockSentinelLike = { release: () => Promise<void> };

const nfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

export function InPersonSignModal({
  open, onClose, link, signerName, signed = false,
}: {
  open: boolean;
  onClose: () => void;
  link: string;
  signerName: string;
  signed?: boolean;
}) {
  const [nfcState, setNfcState] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle');
  const [nfcError, setNfcError] = useState('');

  // Keep the screen on while the signer scans — phones dim/lock fast.
  useEffect(() => {
    if (!open) return;
    let lock: WakeLockSentinelLike | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => { if (!open) { setNfcState('idle'); setNfcError(''); } }, [open]);

  if (!open || !link?.trim()) return null;

  const handleWriteNfc = async () => {
    setNfcState('waiting');
    setNfcError('');
    try {
      const Ctor = (window as unknown as { NDEFReader: new () => NdefWriter }).NDEFReader;
      await new Ctor().write({ records: [{ recordType: 'url', data: link }] });
      setNfcState('done');
    } catch (err) {
      setNfcState('error');
      const name = (err as { name?: string })?.name;
      setNfcError(
        name === 'NotAllowedError'
          ? 'Permiso de NFC denegado. Actívalo en la configuración del navegador.'
          : name === 'NotSupportedError'
            ? 'NFC está apagado o este teléfono no tiene NFC.'
            : 'No se pudo grabar la tarjeta. Mantenla quieta contra el teléfono e inténtalo otra vez.',
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Firmar en persona"
      className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto bg-white px-4 py-8"
      style={{ zIndex: 9998 }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Cerrar"
      >
        <X className="size-5" />
      </button>

      {signed ? (
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="size-20 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">¡{signerName || 'El firmante'} ya firmó!</h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Firmar en persona</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {signerName ? `${signerName}, escanea con tu cámara` : 'Escanea con la cámara de tu teléfono'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Se abrirá el documento listo para firmar. No necesitas instalar nada.</p>

          <div className="mt-6 w-full max-w-[320px] rounded-3xl border-2 border-indigo-100 bg-white p-4 shadow-lg">
            <QRCodeSVG
              value={link}
              size={512}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs font-medium text-amber-700">
            <Loader className="size-3.5 animate-spin" />
            Esperando la firma… esta pantalla se actualiza sola
          </div>

          {nfcSupported && (
            <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Nfc className="size-4 text-indigo-600" /> ¿Tienes una tarjeta NFC?
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Graba el enlace en un sticker o tarjeta NFC. El firmante solo tiene que acercar su teléfono (iPhone o Android) a la tarjeta.
                La tarjeta sirve solo para este firmante: grábala de nuevo para el siguiente documento.
              </p>
              {nfcState === 'done' ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="size-4" /> Tarjeta lista. Pídele al firmante que la toque con su teléfono.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleWriteNfc()}
                  disabled={nfcState === 'waiting'}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-70"
                >
                  {nfcState === 'waiting'
                    ? <><Loader className="size-4 animate-spin" /> Acerca la tarjeta a la parte trasera del teléfono…</>
                    : <><Nfc className="size-4" /> Grabar en tarjeta NFC</>}
                </button>
              )}
              {nfcState === 'error' && <p className="mt-2 text-xs text-red-600">{nfcError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

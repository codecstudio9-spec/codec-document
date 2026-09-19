import { useState } from 'react';
import { KeyRound, Download, Copy, Check } from 'lucide-react';
import { triggerDownload } from '../../utils/download';

interface Props {
  codes: string[];
  onContinue: () => void;
  continueLabel?: string;
}

/** Shown exactly once, right after codes are (re)generated — the server
 * only ever stores their hash, so this is the only chance to save them.
 * Reused by the first-time enrollment flow and by the Settings "generate
 * new codes" action. */
export function BackupCodesReveal({ codes, onContinue, continueLabel }: Props) {
  const [copied, setCopied] = useState(false);
  const text = codes.join('\n');

  const download = () => {
    const blob = new Blob(
      [`Códigos de respaldo — Codec Document\n\nGuarda esto en un lugar seguro. Cada código solo funciona una vez y reemplaza tu app autenticadora si pierdes el teléfono.\n\n${text}\n`],
      { type: 'text/plain' },
    );
    // triggerDownload — iOS Safari doesn't reliably honor `download` on a
    // blob: URL (it just opens/previews it instead of saving), so this
    // routes through the native share sheet on iOS. See utils/download.ts.
    void triggerDownload(blob, 'codec-document-codigos-respaldo.txt');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied — the codes are still visible to copy by hand
    }
  };

  return (
    <div>
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50">
        <KeyRound className="size-7 text-amber-600" />
      </div>
      <h2 className="text-center text-lg font-bold text-slate-900">Guarda tus códigos de respaldo</h2>
      <p className="mt-1.5 text-center text-sm text-slate-500">
        Úsalos si pierdes tu teléfono con la app autenticadora. Cada uno funciona una sola vez —
        no podrás volver a verlos después de esto.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-4">
        {codes.map((c) => (
          <div key={c} className="text-center font-mono text-sm text-slate-700">{c}</div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={download}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Download className="size-3.5" /> Descargar .txt
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white"
      >
        {continueLabel ?? 'Ya los guardé, continuar'}
      </button>
    </div>
  );
}

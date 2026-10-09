import { useState } from 'react';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { elegirArchivoDeDrive, googleDriveDisponible } from '../../services/google-drive-picker';

/** Logo de Google Drive en SVG (sin dependencias externas). */
function DriveLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" className={className} aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

/** "Google Drive" junto a "Subir", como en Dropbox Sign. El archivo elegido
 *  llega a `onFile` igual que uno arrastrado desde el computador. */
export function GoogleDriveButton({
  mimeTypes, language, onFile, className = '',
}: {
  mimeTypes: string[];
  language: 'en' | 'es';
  onFile: (file: File) => void | Promise<void>;
  className?: string;
}) {
  const [cargando, setCargando] = useState(false);
  if (!googleDriveDisponible()) return null;

  const abrir = async () => {
    setCargando(true);
    try {
      const file = await elegirArchivoDeDrive({ mimeTypes, language });
      if (file) await onFile(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google Drive');
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void abrir()}
      disabled={cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60 ${className}`}
    >
      {cargando ? <Loader className="size-4 animate-spin" /> : <DriveLogo className="size-4" />}
      {cargando
        ? (language === 'en' ? 'Opening Drive…' : 'Abriendo Drive…')
        : 'Google Drive'}
    </button>
  );
}

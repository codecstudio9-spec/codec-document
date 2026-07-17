import { useEffect, useState } from 'react';
import { Check, Loader, X } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { DOCUMENT_COLORS } from '../services/documents-service';

interface DocumentEditModalProps {
  open: boolean;
  initialName: string;
  initialColor: string | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (name: string, color: string | null) => void;
}

/** Rename + accent-color editor, shared by the desktop and mobile
 * document lists — a document card only reads "Contrato" or "Acuerdo"
 * out of context; letting the owner rename it and tag it with a color is
 * how they actually recognize whose document it is at a glance later. */
export function DocumentEditModal({ open, initialName, initialColor, isSaving, onClose, onSave }: DocumentEditModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<string | null>(initialColor);

  useEffect(() => {
    if (open) { setName(initialName); setColor(initialColor); }
  }, [open, initialName, initialColor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? 'Edit document' : 'Editar documento'}
          </h2>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-slate-500">
          {language === 'en' ? 'Name' : 'Nombre'}
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder={language === 'en' ? 'e.g. "Lease — John Smith"' : 'ej. "Contrato — Juan Pérez"'}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
        />

        <label className="mb-2 block text-xs font-semibold text-slate-500">
          {language === 'en' ? 'Color' : 'Color'}
        </label>
        <div className="mb-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setColor(null)}
            title={language === 'en' ? 'No color' : 'Sin color'}
            className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400"
            style={color === null ? { borderColor: '#334155', borderStyle: 'solid' } : undefined}
          >
            <X className="size-3.5" />
          </button>
          {DOCUMENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="flex size-9 items-center justify-center rounded-full transition"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
            >
              {color === c && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!name.trim() || isSaving}
          onClick={() => onSave(name.trim(), color)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? <><Loader className="size-4 animate-spin" />{language === 'en' ? 'Saving…' : 'Guardando…'}</> : (language === 'en' ? 'Save' : 'Guardar')}
        </button>
      </div>
    </div>
  );
}

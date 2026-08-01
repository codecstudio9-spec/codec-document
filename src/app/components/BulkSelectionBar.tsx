import { Trash2, X, CheckSquare, Square } from 'lucide-react';
import { CARD_RADIUS, CARD_SHADOW } from '../styles/mobile-theme';

interface BulkSelectionBarProps {
  language: 'en' | 'es';
  selectedCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onCancel: () => void;
  confirming: boolean;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelConfirm: () => void;
  deleting: boolean;
}

/** Sticky bar shown once a long-press enters selection mode on a document/
 * signature list — lets the user select-all and bulk-delete instead of
 * removing items one at a time. Shared across the 4 dashboard list
 * surfaces (desktop+mobile × documents+signatures). */
export function BulkSelectionBar({
  language, selectedCount, allSelected, onToggleSelectAll,
  onCancel, confirming, onRequestDelete, onConfirmDelete, onCancelConfirm, deleting,
}: BulkSelectionBarProps) {
  if (confirming) {
    return (
      <div
        className="sticky top-0 z-20 mb-3 flex items-center gap-3 p-4"
        style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, background: '#FEF2F2' }}
      >
        <Trash2 className="size-5 shrink-0 text-red-500" />
        <p className="min-w-0 flex-1 text-sm font-semibold text-red-700">
          {language === 'en'
            ? `Delete ${selectedCount} item${selectedCount === 1 ? '' : 's'}? This can't be undone.`
            : `¿Eliminar ${selectedCount} elemento${selectedCount === 1 ? '' : 's'}? No se puede deshacer.`}
        </p>
        <button type="button" onClick={onCancelConfirm} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600">
          {language === 'en' ? 'Cancel' : 'Cancelar'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onConfirmDelete}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {deleting ? '...' : (language === 'en' ? 'Delete' : 'Eliminar')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-20 mb-3 flex items-center gap-2 bg-white p-3"
      style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
    >
      <button type="button" onClick={onCancel} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
        <X className="size-4 text-slate-500" />
      </button>
      <p className="flex-1 text-sm font-bold text-slate-900">
        {language === 'en'
          ? `${selectedCount} selected`
          : `${selectedCount} seleccionado${selectedCount === 1 ? '' : 's'}`}
      </p>
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
      >
        {allSelected ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
        {language === 'en'
          ? (allSelected ? 'Deselect all' : 'Select all')
          : (allSelected ? 'Deseleccionar todo' : 'Seleccionar todo')}
      </button>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onRequestDelete}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

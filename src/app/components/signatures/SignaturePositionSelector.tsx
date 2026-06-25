import type { Signer } from './types';

interface SignaturePositionSelectorProps {
  signer: Signer;
}

export function SignaturePositionSelector({ signer }: SignaturePositionSelectorProps) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/signer-id', signer.id);
      }}
      className="cursor-grab rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:scale-[1.02] active:cursor-grabbing"
    >
      <span className="mr-2 inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: signer.color }} />
      {signer.chipLabel}
    </div>
  );
}


import type { Signer } from './types';
import { SignerCard } from './SignerCard';
import { SignaturePositionSelector } from './SignaturePositionSelector';

interface SignatureSidebarProps {
  signers: Signer[];
  onSignerChange: (id: Signer['id'], patch: Partial<Signer>) => void;
  onAddSigner: () => void;
  onRemoveSigner: (id: Signer['id']) => void;
}

export function SignatureSidebar({ signers, onSignerChange, onAddSigner, onRemoveSigner }: SignatureSidebarProps) {
  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Firmantes</h3>

      <div className="space-y-3">
        {signers.map((signer) => (
          <SignerCard key={signer.id} signer={signer} onChange={onSignerChange} onRemove={signers.length > 1 ? onRemoveSigner : undefined} />
        ))}
        <button type="button" onClick={onAddSigner} className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
          + Agregar persona
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-semibold text-slate-800">Arrastra las firmas al documento</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {signers.map((signer) => (
            <SignaturePositionSelector key={`${signer.id}-chip`} signer={signer} />
          ))}
        </div>
      </div>
    </aside>
  );
}


import { Input } from '../ui/input';
import type { Signer } from './types';

interface SignerCardProps {
  signer: Signer;
  onChange: (id: Signer['id'], patch: Partial<Signer>) => void;
  onRemove?: (id: Signer['id']) => void;
}

export function SignerCard({ signer, onChange, onRemove }: SignerCardProps) {
  const readImageAsDataUrl = (file?: File | null, cb?: (value: string) => void) => {
    if (!file || !cb) return;
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: signer.color }} />
          <h4 className="text-sm font-semibold text-slate-900">{signer.title}</h4>
        </div>
        {onRemove && (
          <button className="text-xs font-semibold text-red-600" onClick={() => onRemove(signer.id)} type="button">
            Quitar
          </button>
        )}
      </div>
      <div className="space-y-3">
        <Input
          value={signer.name}
          onChange={(e) => onChange(signer.id, { name: e.target.value })}
          placeholder="Nombre"
          className="h-10"
        />
        <Input
          value={signer.email}
          onChange={(e) => onChange(signer.id, { email: e.target.value })}
          placeholder="Email"
          type="email"
          className="h-10"
        />

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`rounded-lg border px-2 py-1 text-xs ${signer.signatureMode !== 'upload' && signer.signatureMode !== 'draw' ? 'border-blue-500 text-blue-700' : 'border-slate-300 text-slate-600'}`} onClick={() => onChange(signer.id, { signatureMode: 'typed' })}>Texto</button>
          <button type="button" className={`rounded-lg border px-2 py-1 text-xs ${signer.signatureMode === 'upload' ? 'border-blue-500 text-blue-700' : 'border-slate-300 text-slate-600'}`} onClick={() => onChange(signer.id, { signatureMode: 'upload' })}>Subir firma</button>
        </div>

        {(signer.signatureMode === 'typed' || !signer.signatureMode) && (
          <>
            <Input
              value={signer.signatureText || signer.name}
              onChange={(e) => onChange(signer.id, { signatureText: e.target.value })}
              placeholder="Texto de firma"
              className="h-10"
            />
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={signer.fontFamily || 'cursive'}
              onChange={(e) => onChange(signer.id, { fontFamily: e.target.value })}
            >
              <option value="cursive">Firma manuscrita</option>
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans</option>
            </select>
          </>
        )}

        {signer.signatureMode === 'upload' && (
          <label className="block rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-700">
            Subir imagen de firma (PNG/JPG)
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="mt-1 block w-full text-xs"
              onChange={(e) => readImageAsDataUrl(e.target.files?.[0], (value) => onChange(signer.id, { signatureImageDataUrl: value }))}
            />
          </label>
        )}

        <label className="block rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-700">
          Logo de empresa (opcional)
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="mt-1 block w-full text-xs"
            onChange={(e) => readImageAsDataUrl(e.target.files?.[0], (value) => onChange(signer.id, { logoDataUrl: value }))}
          />
        </label>
      </div>
    </article>
  );
}


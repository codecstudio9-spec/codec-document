import { useEffect, useState } from 'react';
import { ShieldCheck, Loader, LogOut, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { enrollTotp, challengeAndVerify, generateBackupCodes } from '../../services/mfa-service';
import { BackupCodesReveal } from './BackupCodesReveal';

interface Props {
  onDone: () => void;
  onLogout: () => void;
}

/** Full-screen, blocking — an admin account can't reach the app at all
 * until 2FA is set up. Shown once, the first time an admin ever signs in
 * after this feature shipped (or after they reset it from Settings). */
export function MfaEnrollScreen({ onDone, onLogout }: Props) {
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Codes only appear once verification succeeds — showing them before
  // 2FA is actually active would hand out a recovery path for a factor
  // that was never confirmed.
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    enrollTotp()
      .then(({ factorId: id, qrCode: qr, secret: s }) => { setFactorId(id); setQrCode(qr); setSecret(s); })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo iniciar la configuración de 2FA'))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async () => {
    if (code.trim().length !== 6) return;
    setVerifying(true);
    setError('');
    try {
      await challengeAndVerify(factorId, code.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código incorrecto, intenta de nuevo');
      setVerifying(false);
      return;
    }
    // 2FA is already active at this point (challengeAndVerify succeeded) —
    // backup codes are a bonus on top, not a gate. If generating them
    // fails (e.g. the migration that creates their RPC hasn't been
    // deployed yet), the admin must still be let into the app rather than
    // stuck on this screen with a factor that's verified but unusable.
    toast.success('Verificación en dos pasos activada');
    try {
      const codes = await generateBackupCodes();
      setBackupCodes(codes);
    } catch (e) {
      console.error('MfaEnrollScreen: generateBackupCodes failed, continuing without them:', e);
      toast.warning('No se pudieron generar códigos de respaldo por ahora — podrás generarlos después desde Configuración.');
      onDone();
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied — the secret is still visible to copy by hand
    }
  };

  if (backupCodes) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/95 p-4">
        <div className="my-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
          <BackupCodesReveal codes={backupCodes} onContinue={onDone} continueLabel="Ya los guardé, entrar a Codec Document" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/95 p-4">
      <div className="my-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50">
          <ShieldCheck className="size-7 text-indigo-600" />
        </div>
        <h1 className="text-center text-lg font-bold text-slate-900">Protege tu cuenta de administrador</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Antes de continuar, activa la verificación en dos pasos con una app como Google Authenticator o Authy.
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader className="size-6 animate-spin text-indigo-500" />
          </div>
        ) : !factorId ? (
          <p className="mt-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              {/* Supabase returns `qrCode` as a full data: URI (image/svg+xml)
                  — an <img> handles that directly. An earlier version used
                  dangerouslySetInnerHTML expecting raw SVG markup, which
                  instead rendered the "data:image/svg+xml;utf-8," prefix as
                  literal text above the code. */}
              <img src={qrCode} alt="Código QR para 2FA" className="size-40 rounded-2xl border border-slate-100 p-3" />
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Escanea este código QR, o ingresa la clave manualmente:
            </p>
            <button
              type="button"
              onClick={() => void copySecret()}
              className="mx-auto mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-600"
            >
              {secret}
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-slate-400" />}
            </button>

            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleVerify(); }}
              placeholder="Código de 6 dígitos"
              inputMode="numeric"
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-widest outline-none focus:border-indigo-400"
            />
            {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}

            <button
              type="button"
              disabled={code.length !== 6 || verifying}
              onClick={() => void handleVerify()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verifying && <Loader className="size-4 animate-spin" />}
              Activar y continuar
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          <LogOut className="size-3.5" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

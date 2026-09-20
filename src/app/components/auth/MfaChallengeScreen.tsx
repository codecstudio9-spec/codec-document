import { useState } from 'react';
import { ShieldCheck, Loader, LogOut, KeyRound, ArrowLeft } from 'lucide-react';
import { challengeAndVerify, redeemBackupCode } from '../../services/mfa-service';

interface Props {
  factorId?: string;
  onDone: () => void;
  onLogout: () => void;
  /** Turns off "pedir código al iniciar sesión" and lets the admin straight
   * in — the escape hatch for when the code from the app simply won't
   * match (phone clock out of sync, or a re-enrollment that quietly
   * generated a new secret). 2FA is opt-in, so getting stuck here should
   * never be the only way this screen ends. */
  onDisable: () => void;
}

/** Full-screen, blocking — shown when an admin's account already has a
 * verified 2FA factor but THIS session hasn't passed it yet (a fresh
 * sign-in, or a new device/browser). */
export function MfaChallengeScreen({ factorId, onDone, onLogout, onDisable }: Props) {
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!factorId || code.trim().length !== 6) return;
    setVerifying(true);
    setError('');
    try {
      await challengeAndVerify(factorId, code.trim());
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código incorrecto, intenta de nuevo');
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeemBackup = async () => {
    if (!backupCode.trim()) return;
    setVerifying(true);
    setError('');
    try {
      const ok = await redeemBackupCode(backupCode.trim());
      if (!ok) { setError('Código de respaldo inválido o ya usado'); return; }
      // Redeeming clears the account's TOTP factor server-side — the next
      // check lands on the "set up 2FA from scratch" screen, not straight
      // into the app.
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo verificar el código');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/95 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50">
          <ShieldCheck className="size-7 text-indigo-600" />
        </div>

        {mode === 'totp' ? (
          <>
            <h1 className="text-center text-lg font-bold text-slate-900">Verificación en dos pasos</h1>
            <p className="mt-1.5 text-center text-sm text-slate-500">
              Abre tu app de autenticación (Google Authenticator, Authy...) y escribe el código
              de 6 dígitos que te muestra en este momento.
            </p>

            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleVerify(); }}
              placeholder="Código de 6 dígitos"
              inputMode="numeric"
              className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-widest outline-none focus:border-indigo-400"
            />
            {error && (
              <p className="mt-2 text-center text-xs text-red-600">
                {error}. Si el código de la app nunca coincide, revisa que la hora de tu
                celular esté en automático (no manual). Si sigue sin funcionar, usa la opción
                de abajo para entrar sin 2FA por ahora.
              </p>
            )}

            <button
              type="button"
              disabled={!factorId || code.length !== 6 || verifying}
              onClick={() => void handleVerify()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verifying && <Loader className="size-4 animate-spin" />}
              Verificar
            </button>

            <button
              type="button"
              onClick={() => { setMode('backup'); setError(''); }}
              className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <KeyRound className="size-3.5" /> Perdí mi teléfono, usar código de respaldo
            </button>

            <button
              type="button"
              onClick={onDisable}
              className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              No puedo usar el código ahora, entrar sin 2FA
            </button>
          </>
        ) : (
          <>
            <h1 className="text-center text-lg font-bold text-slate-900">Código de respaldo</h1>
            <p className="mt-1.5 text-center text-sm text-slate-500">
              Ingresa uno de los códigos de un solo uso que guardaste al activar 2FA. Se te pedirá
              configurar la verificación de nuevo después de esto.
            </p>

            <input
              autoFocus
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase().slice(0, 9))}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleRedeemBackup(); }}
              placeholder="XXXX-XXXX"
              className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-widest outline-none focus:border-indigo-400"
            />
            {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}

            <button
              type="button"
              disabled={!backupCode.trim() || verifying}
              onClick={() => void handleRedeemBackup()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verifying && <Loader className="size-4 animate-spin" />}
              Usar código y reconfigurar 2FA
            </button>

            <button
              type="button"
              onClick={() => { setMode('totp'); setError(''); }}
              className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="size-3.5" /> Volver al código de la app
            </button>

            <button
              type="button"
              onClick={onDisable}
              className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Tampoco tengo los códigos de respaldo, entrar sin 2FA
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

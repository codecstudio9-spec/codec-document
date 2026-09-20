import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import {
  getMfaStatus, unenrollFactor, generateBackupCodes, countUnusedBackupCodes,
  getMfaLoginEnforced, setMfaLoginEnforced, type MfaStatus,
} from '../../services/mfa-service';
import { BackupCodesReveal } from '../auth/BackupCodesReveal';
import { MfaEnrollScreen } from '../auth/MfaEnrollScreen';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/** Status + controls for the admin-only 2FA gated by AdminMfaGate.tsx.
 * 2FA is opt-in and OFF by default: setting up a factor here doesn't by
 * itself require it at login — "Pedir código al iniciar sesión" is a
 * separate toggle the admin flips only once they've confirmed their code
 * works, and it can always be turned back off from here (or from the
 * escape hatch on the login challenge itself). Renders nothing for
 * non-admins, same pattern as AdminMarketingSettings. */
export function MfaSecuritySettings() {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [backupCount, setBackupCount] = useState<number | null>(null);
  const [enforced, setEnforced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [togglingEnforced, setTogglingEnforced] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [revealCodes, setRevealCodes] = useState<string[] | null>(null);

  const reloadStatus = () => {
    // Independent calls, not Promise.all — the backup-codes RPCs are a
    // separate, newer migration that may not be deployed yet (see
    // AdminMfaGate.tsx's note on backup codes being best-effort). If that
    // one rejects it must not also wipe out the real, already-succeeded
    // 2FA status, which would wrongly show "not set up" for an account
    // that actually has it active.
    getMfaStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
    countUnusedBackupCodes().then(setBackupCount).catch(() => setBackupCount(null));
    getMfaLoginEnforced().then(setEnforced).catch(() => setEnforced(false));
  };

  useEffect(() => {
    if (!isAdmin) return;
    reloadStatus();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const verifiedFactor = status?.factors.find((f) => f.status === 'verified');

  const handleToggleEnforced = async (next: boolean) => {
    if (next && !verifiedFactor) { setEnrolling(true); return; }
    setTogglingEnforced(true);
    try {
      await setMfaLoginEnforced(next);
      setEnforced(next);
      toast.success(next
        ? (language === 'en' ? 'Now required on every new session' : 'Ahora se pedirá en cada nueva sesión')
        : (language === 'en' ? 'No longer required to sign in' : 'Ya no se pedirá para iniciar sesión'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not update' : 'No se pudo actualizar'));
    } finally {
      setTogglingEnforced(false);
    }
  };

  const handleReset = async () => {
    if (!verifiedFactor) return;
    const confirmed = window.confirm(
      language === 'en'
        ? 'Turn off two-factor authentication? You can set it up again anytime.'
        : '¿Desactivar la verificación en dos pasos? Puedes volver a configurarla cuando quieras.',
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      // Enforcement off FIRST — otherwise removing the only verified
      // factor while enforcement is still on would immediately land the
      // next session check on the forced "set up 2FA" screen.
      await setMfaLoginEnforced(false).catch(() => {});
      await unenrollFactor(verifiedFactor.id);
      toast.success(language === 'en' ? 'Two-factor authentication turned off' : 'Verificación en dos pasos desactivada');
      reloadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not reset' : 'No se pudo reiniciar'));
    } finally {
      setResetting(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (backupCount && backupCount > 0) {
      const confirmed = window.confirm(
        language === 'en'
          ? `You still have ${backupCount} unused codes. Generating new ones invalidates them. Continue?`
          : `Aún te quedan ${backupCount} códigos sin usar. Generar nuevos invalida esos. ¿Continuar?`,
      );
      if (!confirmed) return;
    }
    setGenerating(true);
    try {
      const codes = await generateBackupCodes();
      setRevealCodes(codes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not generate codes' : 'No se pudieron generar los códigos'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {language === 'en' ? 'Admin security' : 'Seguridad de administrador'}
      </p>
      <p className="mb-2.5 px-1 text-xs text-slate-400">
        {language === 'en'
          ? 'Optional. Adds a second code when signing in, on top of your password. You can turn it on and off whenever you want.'
          : 'Es opcional. Agrega un código adicional al iniciar sesión, además de tu contraseña. Puedes activarla y desactivarla cuando quieras.'}
      </p>

      <div className="flex items-center gap-3 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">
          <ShieldCheck className="size-4 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">
            {language === 'en' ? 'Two-factor authentication (2FA)' : 'Verificación en dos pasos (2FA)'}
          </span>
          <span className="block text-xs text-slate-400">
            {loading
              ? '…'
              : verifiedFactor
                ? (language === 'en' ? 'Configured on this account' : 'Configurada en esta cuenta')
                : (language === 'en' ? 'Not set up' : 'Sin configurar')}
          </span>
        </div>
        {!loading && !verifiedFactor && (
          <button
            type="button"
            onClick={() => setEnrolling(true)}
            className="shrink-0 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            {language === 'en' ? 'Set up' : 'Activar'}
          </button>
        )}
      </div>

      {!loading && verifiedFactor && (
        <>
          <button
            type="button"
            disabled={togglingEnforced}
            onClick={() => void handleToggleEnforced(!enforced)}
            className="mt-2.5 flex w-full items-center gap-3 bg-white p-5 text-left disabled:opacity-50"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">
              <ShieldCheck className="size-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">
                {language === 'en' ? 'Ask for code when signing in' : 'Pedir código al iniciar sesión'}
              </span>
              <span className="block text-xs text-slate-400">
                {enforced
                  ? (language === 'en' ? 'On, required every new session' : 'Activo, se pide en cada nueva sesión')
                  : (language === 'en' ? 'Off, you sign in with just your password' : 'Apagado, inicias sesión solo con tu contraseña')}
              </span>
            </div>
            <span
              className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors"
              style={{ background: enforced ? '#4338CA' : '#E2E8F0' }}
            >
              <span
                className="size-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: enforced ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </span>
          </button>

          <button
            type="button"
            disabled={generating}
            onClick={() => void handleGenerateBackupCodes()}
            className="mt-2.5 flex w-full items-center gap-3 bg-white p-5 text-left disabled:opacity-50"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">
              <KeyRound className="size-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">
                {language === 'en' ? 'Backup codes' : 'Códigos de respaldo'}
              </span>
              <span className="block text-xs text-slate-400">
                {generating
                  ? (language === 'en' ? 'Generating…' : 'Generando…')
                  : backupCount !== null
                    ? (language === 'en'
                        ? `${backupCount} unused, tap to generate new ones`
                        : `${backupCount} sin usar, toca para generar nuevos`)
                    : (language === 'en' ? 'Generate recovery codes' : 'Generar códigos de recuperación')}
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={() => void handleReset()}
            className="mt-2.5 flex w-full items-center gap-3 bg-white p-5 text-left disabled:opacity-50"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: '#FEF2F2' }}>
              <Trash2 className="size-4" style={{ color: '#EF4444' }} />
            </div>
            <span className="flex-1 text-sm font-semibold" style={{ color: '#EF4444' }}>
              {resetting
                ? (language === 'en' ? 'Turning off…' : 'Desactivando…')
                : (language === 'en' ? 'Turn off 2FA (lost your device?)' : 'Desactivar 2FA (¿perdiste tu dispositivo?)')}
            </span>
          </button>
        </>
      )}

      {enrolling && (
        <MfaEnrollScreen
          onDone={() => { setEnrolling(false); reloadStatus(); }}
          onCancel={() => setEnrolling(false)}
        />
      )}

      {revealCodes && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/95 p-4">
          <div className="my-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <BackupCodesReveal
              codes={revealCodes}
              onContinue={() => { setRevealCodes(null); setBackupCount(revealCodes.length); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

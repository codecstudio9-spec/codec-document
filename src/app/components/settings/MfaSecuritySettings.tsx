import { useEffect, useState } from 'react';
import { ShieldCheck, Check, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import {
  getMfaStatus, unenrollFactor, generateBackupCodes, countUnusedBackupCodes, type MfaStatus,
} from '../../services/mfa-service';
import { BackupCodesReveal } from '../auth/BackupCodesReveal';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/** Status + reset for the admin-only 2FA enforced by AdminMfaGate.tsx.
 * Resetting doesn't leave the account unprotected: the gate immediately
 * re-shows the enrollment screen on the next check since it has no
 * verified factor anymore — this is only useful for "I'm switching
 * phones and need to re-scan a QR code", not a way to turn 2FA off.
 * Renders nothing for non-admins, same pattern as AdminMarketingSettings. */
export function MfaSecuritySettings() {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [backupCount, setBackupCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revealCodes, setRevealCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    // Independent calls, not Promise.all — the backup-codes RPCs are a
    // separate, newer migration that may not be deployed yet (see
    // AdminMfaGate.tsx's note on backup codes being best-effort). If that
    // one rejects it must not also wipe out the real, already-succeeded
    // 2FA status, which would wrongly show "not set up" for an account
    // that actually has it active.
    getMfaStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
    countUnusedBackupCodes().then(setBackupCount).catch(() => setBackupCount(null));
  }, [isAdmin]);

  if (!isAdmin) return null;

  const verifiedFactor = status?.factors.find((f) => f.status === 'verified');

  const handleReset = async () => {
    if (!verifiedFactor) return;
    const confirmed = window.confirm(
      language === 'en'
        ? 'Reset two-factor authentication? You will be asked to set it up again immediately.'
        : '¿Reiniciar la verificación en dos pasos? Se te pedirá configurarla de nuevo enseguida.',
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await unenrollFactor(verifiedFactor.id);
      toast.success(language === 'en' ? 'Two-factor reset — reloading…' : 'Verificación reiniciada — recargando…');
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not reset' : 'No se pudo reiniciar'));
      setResetting(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (backupCount && backupCount > 0) {
      const confirmed = window.confirm(
        language === 'en'
          ? `You still have ${backupCount} unused codes — generating new ones invalidates them. Continue?`
          : `Aún te quedan ${backupCount} códigos sin usar — generar nuevos invalida esos. ¿Continuar?`,
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
                ? (language === 'en' ? 'Active — required on every new session' : 'Activa — se pide en cada nueva sesión')
                : (language === 'en' ? 'Not set up yet' : 'Aún no configurada')}
          </span>
        </div>
        {!loading && verifiedFactor && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <Check className="size-3" /> {language === 'en' ? 'On' : 'Activa'}
          </span>
        )}
      </div>

      {!loading && verifiedFactor && (
        <>
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
                        ? `${backupCount} unused — tap to generate new ones`
                        : `${backupCount} sin usar — toca para generar nuevos`)
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
                ? (language === 'en' ? 'Resetting…' : 'Reiniciando…')
                : (language === 'en' ? 'Reset 2FA (lost your device?)' : 'Reiniciar 2FA (¿perdiste tu dispositivo?)')}
            </span>
          </button>
        </>
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

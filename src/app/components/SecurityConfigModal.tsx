import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Camera, CreditCard, FileCheck, BarChart3, PenLine, X } from 'lucide-react';
import type { SecurityConfig } from '../services/sign-transaction-service';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';

interface SecurityConfigModalProps {
  open:      boolean;
  language:  'en' | 'es';
  onConfirm: (config: SecurityConfig) => void;
  onCancel:  () => void;
}

interface Toggle {
  key:     keyof SecurityConfig;
  icon:    React.ComponentType<{ className?: string }>;
  title:   { en: string; es: string };
  desc:    { en: string; es: string };
  locked?: boolean;
  activeGradient: string;
  activeShadow:   string;
  activeBg:       string;
}

const TOGGLES: Toggle[] = [
  {
    key:            'standardSignature',
    icon:           PenLine,
    title:          { en: 'Standard Digital Signature', es: 'Firma Digital Estandar' },
    desc:           { en: 'Handwritten or typed signature captured on-screen.', es: 'Firma manuscrita o escrita capturada en pantalla.' },
    locked:         true,
    activeGradient: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)',
    activeShadow:   '0 3px 10px rgba(37,99,235,0.4)',
    activeBg:       '#eff6ff',
  },
  {
    key:            'requireSelfie',
    icon:           Camera,
    title:          { en: 'Identity Selfie', es: 'Selfie de Identidad' },
    desc:           { en: 'Recipient takes a live selfie to verify identity.', es: 'El destinatario toma una selfie en vivo para verificar su identidad.' },
    activeGradient: 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
    activeShadow:   '0 3px 10px rgba(5,150,105,0.4)',
    activeBg:       '#f0fdf4',
  },
  {
    key:            'requireIdPhoto',
    icon:           CreditCard,
    title:          { en: 'ID Document Photo', es: 'Foto de Documento de Identidad' },
    desc:           { en: 'Photo of a government-issued ID (passport, license, national ID).', es: 'Foto de identificacion oficial (pasaporte, licencia de conducir, INE).' },
    activeGradient: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)',
    activeShadow:   '0 3px 10px rgba(124,58,237,0.4)',
    activeBg:       '#faf5ff',
  },
  {
    key:            'requireEsignConsent',
    icon:           FileCheck,
    title:          { en: 'ESIGN Act Consent', es: 'Consentimiento ESIGN' },
    desc:           { en: 'Recipient must explicitly accept the ESIGN Act disclosure before signing.', es: 'El destinatario debe aceptar explicitamente la declaracion ESIGN antes de firmar.' },
    activeGradient: 'linear-gradient(135deg,#fb923c 0%,#ea580c 100%)',
    activeShadow:   '0 3px 10px rgba(234,88,12,0.4)',
    activeBg:       '#fff7ed',
  },
  {
    key:            'advancedAuditTrail',
    icon:           BarChart3,
    title:          { en: 'Advanced Audit Trail', es: 'Auditoria Digital Avanzada' },
    desc:           { en: 'Records IP address, geolocation, timestamps, and device fingerprint.', es: 'Registra IP, geolocalizacion, timestamps y huella del dispositivo.' },
    activeGradient: 'linear-gradient(135deg,#22d3ee 0%,#0891b2 100%)',
    activeShadow:   '0 3px 10px rgba(8,145,178,0.4)',
    activeBg:       '#ecfeff',
  },
];

const DEFAULT: SecurityConfig = {
  standardSignature:   true,
  requireSelfie:       false,
  requireIdPhoto:      false,
  requireSmsOtp:       false,
  requireEsignConsent: false,
  advancedAuditTrail:  false,
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show:   (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06 + 0.18, duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function SecurityConfigModal({ open, language, onConfirm, onCancel }: SecurityConfigModalProps) {
  const [config, setConfig] = useState<SecurityConfig>(DEFAULT);
  const { speak } = useVoiceSpeak();

  // Explains what this screen is actually for the first time it opens —
  // the copy alone ("Security & Verification") doesn't make clear this is
  // the CREATOR choosing requirements for the SIGNER, not something the
  // creator must personally complete.
  useEffect(() => {
    if (!open) return;
    speak({
      es: 'Aquí eliges qué debe completar la persona que va a firmar, antes de firmar. La firma digital ya es obligatoria. Si quieres más seguridad, puedes pedirle también una selfie, una foto de su documento de identidad, o su consentimiento explícito.',
      en: 'Here you choose what the person signing must complete before they sign. The digital signature is already required. For extra security, you can also ask for a selfie, a photo of their ID, or their explicit consent.',
    }, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (key: keyof SecurityConfig) => {
    if (key === 'standardSignature' || key === 'requireSmsOtp') return;
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => { onConfirm(config); setConfig(DEFAULT); };

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden bg-white"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.94,  y: 12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              borderRadius: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.12)',
            }}
          >
            {/* Header */}
            <div
              className="relative overflow-hidden px-6 py-5"
              style={{
                background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]"
                style={{ background: 'linear-gradient(90deg,#2563eb 0%,#7c3aed 60%,#0891b2 100%)' }}
              />
              <div className="flex items-start justify-between">
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="mt-1 flex items-center gap-2.5 text-lg font-black text-slate-900">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)',
                        boxShadow: '0 3px 10px rgba(37,99,235,0.4)',
                      }}
                    >
                      <Shield className="size-4 text-white" />
                    </div>
                    {language === 'en' ? 'Security & Verification' : 'Seguridad y Verificacion'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {language === 'en'
                      ? 'Choose what the recipient must complete before signing.'
                      : 'Elige lo que el destinatario debe completar antes de firmar.'}
                  </p>
                </motion.div>
                <button
                  onClick={onCancel}
                  className="ml-4 mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Toggle list */}
            <div className="max-h-[52vh] divide-y divide-slate-50 overflow-y-auto px-2 py-1">
              {TOGGLES.map((t, i) => {
                const Icon = t.icon;
                const active = config[t.key];
                return (
                  <motion.div
                    key={t.key}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    onClick={() => toggle(t.key)}
                    className="flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-150"
                    style={{
                      background: active ? t.activeBg : 'transparent',
                    }}
                    whileHover={{ backgroundColor: active ? t.activeBg : '#f8fafc' }}
                  >
                    {/* Icon */}
                    <motion.div
                      className="shrink-0 rounded-xl p-2.5"
                      animate={active ? {
                        background: t.activeGradient,
                        boxShadow: t.activeShadow,
                      } : {
                        background: '#f1f5f9',
                        boxShadow: 'none',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className={['size-4 transition-colors duration-200', active ? 'text-white' : 'text-slate-400'].join(' ')} />
                    </motion.div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={['text-sm font-semibold transition-colors duration-200', active ? 'text-slate-900' : 'text-slate-600'].join(' ')}>
                          {t.title[language]}
                        </span>
                        {t.locked && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white"
                            style={{
                              background: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)',
                              boxShadow: '0 2px 6px rgba(37,99,235,0.35)',
                            }}
                          >
                            {language === 'en' ? 'Required' : 'Requerido'}
                          </span>
                        )}
                      </div>
                      <p className={['mt-0.5 text-xs leading-relaxed transition-colors duration-200', active ? 'text-slate-500' : 'text-slate-400'].join(' ')}>
                        {t.desc[language]}
                      </p>
                    </div>

                    {/* Toggle switch */}
                    <div
                      className={['relative shrink-0 h-6 w-11 rounded-full transition-all duration-250', t.locked ? 'cursor-not-allowed' : ''].join(' ')}
                      style={active ? {
                        background: t.activeGradient,
                        boxShadow: t.activeShadow,
                      } : {
                        background: '#e2e8f0',
                      }}
                    >
                      <motion.span
                        className="absolute top-1 size-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                        animate={{ x: active ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Active count bar */}
            <motion.div
              className="px-6 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}
            >
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? `${activeCount} verification ${activeCount === 1 ? 'step' : 'steps'} required for the recipient`
                  : `${activeCount} ${activeCount === 1 ? 'paso de verificacion requerido' : 'pasos de verificacion requeridos'} para el destinatario`}
              </p>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="flex gap-3 border-t border-slate-100 px-5 py-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              >
                {language === 'en' ? 'Back' : 'Atras'}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] rounded-xl py-2.5 text-sm font-black text-white transition-all active:translate-y-0.5 active:brightness-90"
                style={{
                  background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)',
                  boxShadow: '0 3px 0 #172554, 0 5px 14px rgba(29,78,216,0.45), 0 1px 0 rgba(255,255,255,0.25) inset',
                }}
              >
                {language === 'en' ? 'Generate Secure Link' : 'Generar Enlace Seguro'}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { FileSignature, Send, UserCheck, ClipboardList } from 'lucide-react';
import { SigningIntent } from '../services/sign-transaction-service';

interface IntentModalProps {
  open:     boolean;
  language: 'en' | 'es';
  onSelect: (intent: SigningIntent) => void;
}

interface IntentOption {
  id:      SigningIntent;
  icon:    React.ComponentType<{ className?: string }>;
  title:   { en: string; es: string };
  desc:    { en: string; es: string };
  iconGradient: string;
  iconShadow:   string;
  borderColor:  string;
  hoverGlow:    string;
}

const OPTIONS: IntentOption[] = [
  {
    id:           'fill_send',
    icon:         Send,
    title:        { en: 'Fill & Send to Signer', es: 'Llenar y Enviar al Firmante' },
    desc:         { en: 'You complete the form, then send a secure link for the other party to sign.', es: 'Tu rellenas el formulario y envias un enlace seguro para que la otra parte firme.' },
    iconGradient: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)',
    iconShadow:   '0 3px 10px rgba(37,99,235,0.45)',
    borderColor:  '#bfdbfe',
    hoverGlow:    'rgba(37,99,235,0.08)',
  },
  {
    id:           'fill_self',
    icon:         FileSignature,
    title:        { en: 'Fill & Sign Yourself', es: 'Llenar y Firmar Yo Mismo' },
    desc:         { en: 'Complete the form and sign the document on this device — no link needed.', es: 'Rellena el formulario y firma en este dispositivo, sin necesidad de enlace.' },
    iconGradient: 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
    iconShadow:   '0 3px 10px rgba(5,150,105,0.45)',
    borderColor:  '#a7f3d0',
    hoverGlow:    'rgba(5,150,105,0.08)',
  },
  {
    id:           'blank_send',
    icon:         ClipboardList,
    title:        { en: 'Send Blank to Recipient', es: 'Enviar Formulario en Blanco' },
    desc:         { en: 'Send a blank template so the recipient fills all fields and signs.', es: 'Envia una plantilla en blanco para que el destinatario complete los campos y firme.' },
    iconGradient: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)',
    iconShadow:   '0 3px 10px rgba(124,58,237,0.45)',
    borderColor:  '#ddd6fe',
    hoverGlow:    'rgba(124,58,237,0.08)',
  },
  {
    id:           'fill_approve',
    icon:         UserCheck,
    title:        { en: 'Fill, Send & Co-Sign', es: 'Llenar, Enviar y Co-Firmar' },
    desc:         { en: 'You fill the form, recipient signs first, then you countersign to finalize.', es: 'Tu rellenas, el destinatario firma primero y luego tu contrafirmas.' },
    iconGradient: 'linear-gradient(135deg,#fb923c 0%,#ea580c 100%)',
    iconShadow:   '0 3px 10px rgba(234,88,12,0.45)',
    borderColor:  '#fed7aa',
    hoverGlow:    'rgba(234,88,12,0.08)',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function IntentModal({ open, language, onSelect }: IntentModalProps) {
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
            className="w-full max-w-2xl overflow-hidden bg-white"
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
              className="relative overflow-hidden px-8 py-6"
              style={{
                background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              {/* Subtle top accent */}
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]"
                style={{ background: 'linear-gradient(90deg,#2563eb,#7c3aed,#059669,#ea580c)' }}
              />
              <motion.h2
                className="mt-1 text-xl font-black text-slate-900"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {language === 'en'
                  ? 'How do you want to use this document?'
                  : '\xBFComo quieres usar este documento?'}
              </motion.h2>
              <motion.p
                className="mt-1 text-sm text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.16, duration: 0.3 }}
              >
                {language === 'en'
                  ? 'Choose a workflow to get started.'
                  : 'Elige un flujo de trabajo para comenzar.'}
              </motion.p>
            </div>

            {/* Options grid */}
            <motion.div
              className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.id}
                    variants={cardVariants}
                    onClick={() => onSelect(opt.id)}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: [0.22,1,0.36,1] } }}
                    whileTap={{ scale: 0.98, y: 0 }}
                    className="group relative flex items-start gap-4 rounded-2xl border bg-white p-5 text-left"
                    style={{
                      borderColor: opt.borderColor,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'box-shadow 0.2s ease, background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = [
                        '0 4px 16px rgba(0,0,0,0.10)',
                        '0 8px 32px rgba(0,0,0,0.07)',
                        `0 0 0 1px ${opt.borderColor}`,
                      ].join(', ');
                      (e.currentTarget as HTMLButtonElement).style.background = opt.hoverGlow;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)';
                      (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="shrink-0 rounded-xl p-3"
                      style={{
                        background: opt.iconGradient,
                        boxShadow: opt.iconShadow,
                      }}
                    >
                      <Icon className="size-5 text-white" />
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 leading-snug">
                        {opt.title[language]}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        {opt.desc[language]}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            <motion.div
              className="border-t border-slate-100 px-6 pb-5 pt-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'All workflows include an audit trail and legally binding signatures.'
                  : 'Todos los flujos incluyen registro de auditoria y firmas con validez legal.'}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

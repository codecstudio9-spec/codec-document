import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from '../ui/dialog';
import { useAuth } from '../../contexts/auth-context';
import { toast } from 'sonner';
import { Building2, User, ArrowRight, X, Shield, Check, Sparkles, Loader } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PlanType = 'personal' | 'business';
type Step = 'segmentation' | 'auth';

export function OnboardingModal({ open, onOpenChange }: Props) {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [step, setStep] = useState<Step>('segmentation');
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('segmentation');
      setPlanType(null);
      setEmail('');
      setMagicSent(false);
    }, 300);
  };

  const handlePlanSelect = (type: PlanType) => {
    setPlanType(type);
    setStep('auth');
  };

  const handleGoogleSignIn = async () => {
    if (planType) localStorage.setItem('codec_pending_plan_type', planType);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo iniciar con Google');
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }
    if (planType) localStorage.setItem('codec_pending_plan_type', planType);
    setLoading(true);
    try {
      await signInWithMagicLink(email.trim());
      setMagicSent(true);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar el enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/98 shadow-[0_0_100px_rgba(99,102,241,0.3)] backdrop-blur-2xl">
          {/* Gradient accent line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent" />
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />

          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>

          <div className="relative p-8">
            <AnimatePresence mode="wait">
              {step === 'segmentation' ? (
                <motion.div
                  key="segmentation"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Header */}
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 ring-1 ring-indigo-400/20">
                      <Shield className="size-7 text-indigo-400" />
                    </div>
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                      <Sparkles className="size-3" />
                      Únete a Codec Document
                    </div>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      ¿Para qué vas a usar<br />Codec Document?
                    </h2>
                    <p className="mt-2 text-sm text-white/40">
                      Tu respuesta nos ayuda a personalizar tu experiencia
                    </p>
                  </div>

                  {/* Segmentation cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handlePlanSelect('personal')}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all duration-300 hover:border-blue-400/40 hover:bg-blue-500/8 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08), transparent 70%)' }} />
                      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
                        <User className="size-5 text-blue-400" />
                      </div>
                      <p className="font-bold text-white">Personal</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/40">
                        Freelance, autónomo o uso individual de documentos
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Seleccionar <ArrowRight className="size-3" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlanSelect('business')}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all duration-300 hover:border-violet-400/40 hover:bg-violet-500/8 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08), transparent 70%)' }} />
                      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/20">
                        <Building2 className="size-5 text-violet-400" />
                      </div>
                      <p className="font-bold text-white">Empresarial</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/40">
                        Empresa, startup, equipo legal o uso corporativo
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Seleccionar <ArrowRight className="size-3" />
                      </div>
                    </button>
                  </div>

                  <p className="mt-6 text-center text-[11px] text-white/20">
                    Podrás cambiar esto en cualquier momento desde tu perfil
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Plan badge + back */}
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('segmentation')}
                      className="text-xs text-white/35 transition hover:text-white/70"
                    >
                      ← Cambiar selección
                    </button>
                    <div className={[
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                      planType === 'business'
                        ? 'border-violet-400/30 bg-violet-400/10 text-violet-300'
                        : 'border-blue-400/30 bg-blue-400/10 text-blue-300',
                    ].join(' ')}>
                      {planType === 'business' ? <Building2 className="size-3" /> : <User className="size-3" />}
                      {planType === 'business' ? 'Empresarial' : 'Personal'}
                      <Check className="size-3" />
                    </div>
                  </div>

                  {/* Header */}
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-white">Crear tu cuenta</h2>
                    <p className="mt-1.5 text-sm text-white/40">
                      Únete a más de 10,000 profesionales
                    </p>
                  </div>

                  {magicSent ? (
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-5 py-8 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
                        <Check className="size-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">¡Enlace enviado!</p>
                        <p className="mt-1 text-sm text-white/50">
                          Revisa <span className="text-white">{email}</span> y haz clic en el enlace mágico.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMagicSent(false)}
                        className="text-xs text-indigo-400 underline hover:text-indigo-300"
                      >
                        Usar otro correo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Google OAuth */}
                      <button
                        type="button"
                        onClick={() => void handleGoogleSignIn()}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/25 hover:bg-white/12 hover:shadow-[0_0_20px_rgba(255,255,255,0.04)]"
                      >
                        {/* Official Google logo */}
                        <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Registrarse con Google
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/8" />
                        <span className="text-xs text-white/30">o usa tu correo</span>
                        <div className="h-px flex-1 bg-white/8" />
                      </div>

                      {/* Magic Link */}
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        onKeyDown={(e) => e.key === 'Enter' && void handleMagicLink()}
                        className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/30"
                      />
                      <button
                        type="button"
                        onClick={() => void handleMagicLink()}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
                      >
                        {loading && <Loader className="size-4 animate-spin" />}
                        Enviar Magic Link
                      </button>
                    </div>
                  )}

                  <p className="mt-5 text-center text-[11px] text-white/20">
                    Al registrarte aceptas nuestros{' '}
                    <a href="/terms" className="text-indigo-400 underline hover:text-indigo-300">Términos de Uso</a>
                    {' '}y{' '}
                    <a href="/privacy" className="text-indigo-400 underline hover:text-indigo-300">Política de Privacidad</a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

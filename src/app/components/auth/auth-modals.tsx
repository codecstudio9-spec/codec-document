import { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { useAuth } from '../../contexts/auth-context';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Chrome, SendHorizonal, Loader, Check } from 'lucide-react';

type Props = {
  loginOpen: boolean;
  registerOpen: boolean;
  onLoginOpenChange: (open: boolean) => void;
  onRegisterOpenChange: (open: boolean) => void;
};

type LoginTab = 'password' | 'magic' | 'google';

function GlassInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/30"
    />
  );
}

function GlassLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-white/60">{children}</label>;
}

export function AuthModals({ loginOpen, registerOpen, onLoginOpenChange, onRegisterOpenChange }: Props) {
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink } = useAuth();

  const [tab, setTab] = useState<LoginTab>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const close = () => {
    onLoginOpenChange(false);
    onRegisterOpenChange(false);
    setMagicSent(false);
    setEmail('');
    setPassword('');
  };

  const onGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.toLowerCase().includes('unsupported provider')) {
        toast.error('El inicio de sesión con Google no está disponible en este momento. Intenta de nuevo más tarde.');
        return;
      }
      toast.error(msg || 'No se pudo iniciar con Google');
    }
  };

  const onMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) { toast.error('Ingresa un email válido'); return; }
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

  const onLogin = async () => {
    if (!email.trim() || !password) { toast.error('Completa todos los campos'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success('Sesión iniciada');
      close();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    if (!email.trim() || !password) { toast.error('Completa todos los campos'); return; }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      toast.success('Cuenta creada. Revisa tu correo para confirmar.');
      close();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = loginOpen;

  const ModalContent = (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_0_80px_rgba(99,102,241,0.25)] backdrop-blur-2xl sm:p-8">
      {/* Gradient top line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 ring-1 ring-indigo-400/20">
          <Shield className="size-6 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h2>
        <p className="mt-1 text-sm text-white/45">
          {isLogin ? 'Accede a todas las funciones premium' : 'Únete a miles de profesionales'}
        </p>
      </div>

      {/* Tab bar (only for login) */}
      {isLogin && (
        <div className="mb-5 flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {([
            { id: 'magic' as LoginTab, label: '✉️ Magic Link', desc: 'Sin contraseña' },
            { id: 'password' as LoginTab, label: '🔑 Contraseña', desc: 'Clásico' },
            { id: 'google' as LoginTab, label: '🔵 Google', desc: 'OAuth' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setMagicSent(false); }}
              className={[
                'flex-1 rounded-xl py-2 text-center text-xs font-semibold transition-all',
                tab === t.id ? 'bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]' : 'text-white/45 hover:text-white/70',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Magic Link tab */}
      {(isLogin ? tab === 'magic' : true) && !isLogin ? null : null}

      {isLogin && tab === 'magic' && (
        magicSent ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-5 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
              <Check className="size-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-white">¡Enlace enviado!</p>
              <p className="mt-1 text-sm text-white/50">Revisa tu bandeja de entrada en <span className="text-white">{email}</span> y haz clic en el enlace mágico.</p>
            </div>
            <button type="button" onClick={() => setMagicSent(false)} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
              Usar otro correo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <GlassLabel>Correo electrónico</GlassLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <GlassInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email.com" className="pl-10" onKeyDown={(e) => e.key === 'Enter' && void onMagicLink()} />
              </div>
            </div>
            <button type="button" onClick={() => void onMagicLink()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60">
              {loading ? <Loader className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
              Enviar Magic Link
            </button>
            <p className="text-center text-[11px] text-white/35">Recibirás un enlace de acceso sin necesidad de contraseña</p>
          </div>
        )
      )}

      {/* Password tab */}
      {(isLogin ? tab === 'password' : true) && (
        <div className="space-y-4">
          <div>
            <GlassLabel>Correo electrónico</GlassLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <GlassInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email.com" className="pl-10" />
            </div>
          </div>
          <div>
            <GlassLabel>Contraseña</GlassLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <GlassInput value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="pl-10" onKeyDown={(e) => e.key === 'Enter' && (isLogin ? void onLogin() : void onRegister())} />
            </div>
          </div>
          <button type="button" onClick={isLogin ? () => void onLogin() : () => void onRegister()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60">
            {loading ? <Loader className="size-4 animate-spin" /> : null}
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      )}

      {/* Google tab */}
      {isLogin && tab === 'google' && (
        <div className="space-y-3">
          <button type="button" onClick={() => void onGoogle()} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/8 py-3.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/12">
            <Chrome className="size-5 text-blue-400" />
            Continuar con Google
          </button>
          <p className="text-center text-[11px] text-white/35">Se abrirá la ventana de autenticación de Google</p>
        </div>
      )}

      {/* Divider + extras */}
      <div className="mt-5 space-y-3">
        {(!isLogin || (isLogin && tab !== 'google')) && (
          <button type="button" onClick={() => void onGoogle()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white/80">
            <Chrome className="size-4 text-blue-400" />
            Continuar con Google
          </button>
        )}
        <p className="text-center text-[11px] text-white/30">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button type="button" onClick={() => { isLogin ? onRegisterOpenChange(true) : onLoginOpenChange(true); close(); }} className="text-indigo-400 underline hover:text-indigo-300">
            {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={loginOpen} onOpenChange={onLoginOpenChange}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
          {ModalContent}
        </DialogContent>
      </Dialog>
      <Dialog open={registerOpen} onOpenChange={onRegisterOpenChange}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
          {ModalContent}
        </DialogContent>
      </Dialog>
    </>
  );
}

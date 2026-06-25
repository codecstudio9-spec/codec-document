import { useState } from 'react';
import { Link } from 'react-router';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { AuthModals } from '../auth/auth-modals';

export function Navbar() {
  const { user, logout, signInWithGoogle } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {!user ? (
          <>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setLoginOpen(true)}>
              Iniciar sesión
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRegisterOpen(true)}>
              Registrarse
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void signInWithGoogle()}>
              Continuar con Google
            </button>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              {user.picture ? <img src={user.picture} alt="avatar" className="size-6 rounded-full" /> : <User className="size-4" />}
              <span className="max-w-[180px] truncate">{user.email}</span>
            </div>
            <Link to="/dashboard" className="rounded-lg border px-3 py-2 text-sm">
              Dashboard
            </Link>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void logout()}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>

      <AuthModals
        loginOpen={loginOpen}
        registerOpen={registerOpen}
        onLoginOpenChange={setLoginOpen}
        onRegisterOpenChange={setRegisterOpen}
      />
    </>
  );
}

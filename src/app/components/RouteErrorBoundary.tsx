import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { language } = useLanguage();

  if (import.meta.env.DEV) {
    console.error('RouteErrorBoundary caught:', error);
  } else {
    console.error(
      'Route error:',
      isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h1 className="text-lg font-black text-slate-900">
          {language === 'en' ? 'Something went wrong' : 'Ocurrió un inconveniente'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {language === 'en'
            ? 'Please try again. If this keeps happening, contact support.'
            : 'Intenta nuevamente. Si el problema continúa, contáctanos.'}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            <RotateCcw className="size-4" /> {language === 'en' ? 'Retry' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <Home className="size-4" /> {language === 'en' ? 'Home' : 'Inicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

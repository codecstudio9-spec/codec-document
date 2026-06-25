import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { FileQuestion, Home } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

export function NotFoundPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <FileQuestion className="size-24 text-slate-300 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-3">
          {language === 'en' ? 'Page Not Found' : 'Página no encontrada'}
        </h2>
        <p className="text-slate-600 mb-8">
          {language === 'en'
            ? "The page you're looking for doesn't exist or has been moved."
            : 'La página que buscas no existe o fue movida.'}
        </p>
        <Link to="/">
          <Button size="lg">
            <Home className="size-5 mr-2" />
            {language === 'en' ? 'Back to Home' : 'Volver al inicio'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

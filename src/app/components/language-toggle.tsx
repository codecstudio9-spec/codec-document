import { useLanguage } from '../contexts/language-context';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="gap-1.5"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Globe className="size-4" />
      <span className="font-bold">{language === 'en' ? 'EN' : 'ES'}</span>
      <span className="text-[10px] font-normal opacity-45">/ {language === 'en' ? 'ES' : 'EN'}</span>
    </Button>
  );
}

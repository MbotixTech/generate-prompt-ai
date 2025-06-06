import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      aria-label={`Switch to ${i18n.language === 'en' ? 'Bahasa Indonesia' : 'English'}`}
      title={`Switch to ${i18n.language === 'en' ? 'Bahasa Indonesia' : 'English'}`}
    >
      <Globe className="h-5 w-5" />
      <span className="ml-1 text-xs font-medium">{i18n.language.toUpperCase()}</span>
    </Button>
  );
}

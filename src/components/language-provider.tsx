import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageContext, LanguageContextType } from '@/components/language-context';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const languageState = useLanguage();

  return (
    <LanguageContext.Provider value={languageState as LanguageContextType}>
      {children}
    </LanguageContext.Provider>
  );
}

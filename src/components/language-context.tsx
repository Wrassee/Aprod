import { createContext, useContext } from 'react';
import { Translation } from '@/lib/translations';

export interface LanguageContextType {
  language: 'hu' | 'de';
  setLanguage: (lang: 'hu' | 'de') => void;
  t: Translation;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}

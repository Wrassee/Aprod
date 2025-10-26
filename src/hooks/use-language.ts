// src/hooks/use-language.ts

import { useState, useEffect, useMemo } from 'react';
import { translations, Translation } from '@/lib/translations';

export function useLanguage() {
  // Betöltjük a mentett nyelvet AZONNAL az inicializáláskor
  const [language, setLanguage] = useState<'hu' | 'de'>(() => {
    const saved = localStorage.getItem('otis-protocol-language') as 'hu' | 'de';
    return (saved === 'hu' || saved === 'de') ? saved : 'hu';
  });
  
  // === DERIVED STATE: A fordítások közvetlenül a language állapotból ===
  // A useMemo biztosítja, hogy a fordítási objektum azonnal elérhető legyen
  // a renderelési fázisban, nem kell várni egy következő render ciklusra.
  const t = useMemo(() => {
    console.log(`✅ Translations derived for language: ${language}`);
    // A localStorage mentést is itt végezzük, csak akkor, ha a nyelv változik
    localStorage.setItem('otis-protocol-language', language);
    return translations[language];
  }, [language]);

  // Load saved language on initialization and listen for storage changes
  useEffect(() => {
    const checkLanguage = () => {
      const saved = localStorage.getItem('otis-protocol-language') as 'hu' | 'de';
      if (saved && (saved === 'hu' || saved === 'de') && saved !== language) {
        console.log('📥 Loading/updating saved language:', saved, 'current:', language);
        setLanguage(saved);
      }
    };
    
    // Check immediately on mount
    checkLanguage();
    
    // Check periodically to catch localStorage changes
    const interval = setInterval(checkLanguage, 500);
    
    // Listen for localStorage changes from other parts of the app
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'otis-protocol-language' && e.newValue) {
        const newLang = e.newValue as 'hu' | 'de';
        if (newLang === 'hu' || newLang === 'de') {
          console.log('🔄 Storage event language change:', newLang);
          setLanguage(newLang);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  return {
    language,
    setLanguage,
    t, // Most már azonnal elérhető a helyes fordítás
  };
}
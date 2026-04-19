// src/hooks/use-language.ts
import { useState, useEffect, useMemo } from "react";
import { translations } from "@/lib/translations";

const VALID_LANGUAGES = ['hu', 'de', 'en', 'fr', 'it'] as const;
type ValidLanguage = typeof VALID_LANGUAGES[number];

function isValidLanguage(v: string | null): v is ValidLanguage {
  return !!v && (VALID_LANGUAGES as readonly string[]).includes(v);
}

export function useLanguage() {
  const [language, setLanguage] = useState<ValidLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("otis-protocol-language");
      return isValidLanguage(saved) ? saved : "hu";
    }
    return "hu";
  });

  // ----- TRANSLATION FUNCTION -----
  const t = useMemo(() => {
    localStorage.setItem("otis-protocol-language", language);

    const translate = (key: string): string => {
      if (!key) return "";
      
      const langSet = translations[language] as any;
      
      try {
        // 1. Próbáljuk meg pontos egyezéssel
        let value = key.split('.').reduce((acc, currentKey) => {
          return acc ? acc[currentKey] : undefined;
        }, langSet);

        // 2. Ha nem találtuk, próbáljuk meg a "csoport" nevét nagybetűsíteni (pl. admin -> Admin)
        if (value === undefined && key.includes('.')) {
            const parts = key.split('.');
            parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            const upperKey = parts.join('.');
            
            value = upperKey.split('.').reduce((acc, currentKey) => {
                return acc ? acc[currentKey] : undefined;
            }, langSet);
        }

        if (typeof value === 'string') {
            return value;
        }

        if (process.env.NODE_ENV === 'development') {
            console.warn(`[i18n] Hiányzó fordítás (${language}): "${key}"`);
        }

        return key;
      } catch (e) {
        return key;
      }
    };

    return translate;
  }, [language]);

  // ----- LOCAL STORAGE SYNC -----
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "otis-protocol-language" && e.newValue) {
        if (isValidLanguage(e.newValue)) {
          setLanguage(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { language, setLanguage, t };
}

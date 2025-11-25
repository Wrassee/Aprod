// src/hooks/use-language.ts
import { useState, useEffect, useMemo } from "react";
import { translations } from "@/lib/translations";

export function useLanguage() {
  const [language, setLanguage] = useState<"hu" | "de">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("otis-protocol-language");
      // Biztosítjuk, hogy csak érvényes nyelvet töltsünk vissza
      return saved === "de" ? "de" : "hu";
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
        // Ez segít, ha a kódban kisbetűvel van, de a szótárban nagybetűvel
        if (value === undefined && key.includes('.')) {
            const parts = key.split('.');
            // Csak az első elemet nagybetűsítjük (pl. admin -> Admin)
            parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            const upperKey = parts.join('.');
            
            value = upperKey.split('.').reduce((acc, currentKey) => {
                return acc ? acc[currentKey] : undefined;
            }, langSet);
        }

        if (typeof value === 'string') {
            return value;
        }

        // DEBUG: Ha itt tartunk, akkor NINCS meg a fordítás
        // Csak fejlesztés alatt hasznos, production buildben kivehető
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[i18n] Hiányzó fordítás (${language}): "${key}"`);
        }

        return key; // Visszaadjuk a kulcsot, hogy legalább látszódjon valami
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
        if (e.newValue === "hu" || e.newValue === "de") {
          setLanguage(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { language, setLanguage, t };
}
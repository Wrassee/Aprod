import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, language: 'hu' | 'de' | 'en' | 'fr' | 'it'): string {
  const localeMap: Record<string, string> = {
    hu: 'hu-HU',
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
  };
  
  const locale = localeMap[language] || 'hu-HU';
  
  if (language === 'de') {
    // German format: DD.MM.YYYY
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } else if (language === 'en') {
    // English format: MM/DD/YYYY
    return date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } else if (language === 'fr' || language === 'it') {
    // French/Italian format: DD/MM/YYYY
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } else {
    // Hungarian format: YYYY.MM.DD
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

export function formatDateForInput(date: Date): string {
  // HTML date input always expects YYYY-MM-DD format (ISO 8601)
  return date.toISOString().split('T')[0];
}

export function parseDateFromInput(dateString: string): Date {
  // Parse YYYY-MM-DD format from HTML date input
  return new Date(dateString + 'T00:00:00');
}

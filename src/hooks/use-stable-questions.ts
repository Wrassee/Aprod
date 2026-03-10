import { useState, useEffect, useRef } from 'react';
import { Question } from '@shared/schema';

function getCacheKey(language: string, templateId?: string): string {
  return `otis-questions-cache-${language}${templateId ? `-${templateId}` : ''}`;
}

function loadFromCache(language: string, templateId?: string): Question[] | null {
  try {
    const key = getCacheKey(language, templateId);
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`📦 Loaded ${parsed.length} questions from offline cache (${key})`);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load questions from cache:', e);
  }
  return null;
}

function saveToCache(questions: Question[], language: string, templateId?: string) {
  try {
    const key = getCacheKey(language, templateId);
    localStorage.setItem(key, JSON.stringify(questions));
    console.log(`💾 Cached ${questions.length} questions for offline use (${key})`);
  } catch (e) {
    console.warn('Failed to cache questions:', e);
  }
}

export function useStableQuestions(language: 'hu' | 'de' | 'en' | 'fr' | 'it', templateId?: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const currentLanguageRef = useRef(language);
  const currentTemplateRef = useRef(templateId);
  
  useEffect(() => {
    if (currentLanguageRef.current === language && currentTemplateRef.current === templateId && questions.length > 0) {
      return;
    }
    
    currentLanguageRef.current = language;
    currentTemplateRef.current = templateId;
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setFromCache(false);
        
        const url = templateId
          ? `/api/questions/${language}?templateId=${templateId}`
          : `/api/questions/${language}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const questionsData = await response.json();
          setQuestions(questionsData);
          saveToCache(questionsData, language, templateId);
        } else {
          const cached = loadFromCache(language, templateId);
          if (cached) {
            setQuestions(cached);
            setFromCache(true);
          } else {
            setQuestions([]);
          }
        }
      } catch (error) {
        console.warn('⚡ Network error fetching questions, trying offline cache...');
        const cached = loadFromCache(language, templateId);
        if (cached) {
          setQuestions(cached);
          setFromCache(true);
        } else {
          console.error('❌ No cached questions available offline');
          setQuestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [language, templateId, questions.length]);

  return { questions, loading, fromCache };
}
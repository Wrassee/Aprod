// src/components/measurement-block.tsx - THEME AWARE VERSION
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Ruler, AlertTriangle, Sparkles } from 'lucide-react';
import { useLanguageContext } from '@/components/language-provider';
import { useTheme } from '@/contexts/theme-context'; // ← HOZZÁADVA!

interface Question {
  id: string;
  title: string;
  titleDe?: string;
  titleHu?: string;
  type: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  calculationFormula?: string;
  calculationInputs?: string | string[];
}

interface MeasurementBlockProps {
  questions: Question[];
  values: Record<string, any>;
  onChange: (questionId: string, value: string | number | undefined) => void;
  onAddError?: (error: { title: string; description: string; severity: 'low' | 'medium' | 'critical' }) => void;
}

export function MeasurementBlock({ questions, values, onChange, onAddError }: MeasurementBlockProps) {
  const { language, t } = useLanguageContext();
  const { theme } = useTheme(); // ← HOZZÁADVA!

  // Nyelvfüggő cím kiválasztása
  const getTranslatedTitle = (question: Question) => {
    if (language === 'de' && question.titleDe) {
      return question.titleDe;
    }
    return question.titleHu || question.title;
  };

  const measurementQuestions = questions.filter(q => q.type === 'measurement');
  const calculatedQuestions = questions.filter(q => q.type === 'calculated');

  // Mérés bevitele
  const handleMeasurementChange = useCallback((questionId: string, inputValue: string) => {
    console.log(`📊 MeasurementBlock - Input change for ${questionId}: "${inputValue}"`);
    if (inputValue === '' || inputValue === '.') {
      onChange(questionId, undefined);
    } else {
      const parsedValue = parseFloat(inputValue);
      if (!isNaN(parsedValue)) {
        onChange(questionId, parsedValue);
      }
    }
  }, [onChange]);

  // Számított érték kiszámítása
  const calculateValue = useCallback((question: Question): number | null => {
    if (!question.calculationFormula || !question.calculationInputs) return null;
    try {
      let formula = question.calculationFormula;
      const inputIds = Array.isArray(question.calculationInputs)
        ? question.calculationInputs
        : question.calculationInputs.split(',').map((id: string) => id.trim());

      for (const inputId of inputIds) {
        const value = values[inputId];
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (!isNaN(numValue)) {
            formula = formula.replace(new RegExp(`\\b${inputId}\\b`, 'g'), numValue.toString());
          } else {
            console.log(`⚠️ Invalid value for ${inputId} in calculation`);
            return null;
          }
        } else {
          console.log(`⚠️ Missing value for ${inputId} in calculation`);
          return null;
        }
      }

      const result = Function(`"use strict"; return (${formula})`)();
      const roundedResult = typeof result === 'number' && !isNaN(result) ? Math.round(result) : null;
      console.log(`🧮 Calculated ${question.id}: ${roundedResult} (formula: ${question.calculationFormula})`);
      return roundedResult;
    } catch (error) {
      console.error(`❌ Calculation error for ${question.id}:`, error);
      return null;
    }
  }, [values]);

  // Számított értékek memoizálása
  const calculatedValues = useMemo(() => {
    const results: Record<string, number | null> = {};
    calculatedQuestions.forEach(q => {
      results[q.id] = calculateValue(q);
    });
    return results;
  }, [calculatedQuestions, calculateValue]);

  // ========================================
  // MODERN THEME
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="space-y-6">
        {/* MEASUREMENT QUESTIONS (Modern) */}
        {measurementQuestions.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl">
              <div className="p-6 border-b border-blue-100 dark:border-blue-900/50">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                    <Ruler className="h-5 w-5 text-white" />
                  </div>
                  {t.measurementData}
                  <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                {measurementQuestions.map((question, index) => {
                  const currentValue = values[question.id];
                  return (
                    <div key={question.id} className="relative overflow-hidden rounded-xl border-2 border-blue-100 dark:border-blue-900/50 p-4 bg-gradient-to-r from-white to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        {/* Number Badge */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold text-lg flex items-center justify-center shadow-md flex-shrink-0">
                          {index + 1}
                        </div>
                        
                        {/* Question Title */}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {getTranslatedTitle(question)}
                          </p>
                          {question.unit && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-cyan-500" />
                              {question.unit}
                            </p>
                          )}
                        </div>
                        
                        {/* Input Field */}
                        <div className="relative flex-shrink-0 w-28">
                          <input
                            type="text"
                            value={currentValue?.toString() || ''}
                            onChange={(e) => {
                              let inputValue = e.target.value.replace(/[^0-9.]/g, '');
                              if (inputValue.length > 5) {
                                inputValue = inputValue.slice(0, 5);
                                e.target.value = inputValue;
                              }
                              handleMeasurementChange(question.id, inputValue);
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const focusableElements = document.querySelectorAll(
                                  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                                );
                                const currentIndex = Array.from(focusableElements).indexOf(e.currentTarget);
                                const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
                                if (nextElement) {
                                  nextElement.focus();
                                  if (nextElement.tagName === 'INPUT') {
                                    (nextElement as HTMLInputElement).select();
                                  }
                                }
                              }
                            }}
                            placeholder="0.0"
                            className="w-full h-12 px-3 text-center text-lg font-bold border-2 border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-inner"
                            maxLength={5}
                          />
                          {question.unit && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                              {question.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CALCULATED QUESTIONS (Modern) */}
        {calculatedQuestions.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-30 animate-pulse" />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl">
              <div className="p-6 border-b border-green-100 dark:border-green-900/50">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  {t.calculatedValues}
                  <Sparkles className="h-5 w-5 text-teal-500 animate-pulse" />
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                {calculatedQuestions.map((question, index) => {
                  const calculatedValue = calculatedValues[question.id];
                  const isOutOfBounds =
                    calculatedValue !== null &&
                    question.minValue !== undefined &&
                    question.maxValue !== undefined &&
                    (calculatedValue < question.minValue || calculatedValue > question.maxValue);

                  return (
                    <div key={question.id} className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
                      isOutOfBounds 
                        ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30' 
                        : 'border-green-100 bg-gradient-to-r from-white to-green-50/20 dark:from-gray-900 dark:to-green-950/20 hover:shadow-md'
                    }`}>
                      <div className="flex items-center gap-4">
                        {/* Number Badge */}
                        <div className={`w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center shadow-md flex-shrink-0 ${
                          isOutOfBounds
                            ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white'
                            : 'bg-gradient-to-br from-green-500 to-emerald-400 text-white'
                        }`}>
                          {measurementQuestions.length + index + 1}
                        </div>
                        
                        {/* Question Title */}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {getTranslatedTitle(question)}
                          </p>
                          {question.minValue !== undefined && question.maxValue !== undefined && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-teal-500" />
                              {language === 'de' ? 'Zulässiger Bereich' : 'Megengedett tartomány'}: {question.minValue} - {question.maxValue} {question.unit}
                            </p>
                          )}
                          {isOutOfBounds && (
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              {t.outOfRange || 'Határértéken kívül'}
                            </p>
                          )}
                        </div>
                        
                        {/* Calculated Value */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className={`text-center font-mono text-xl font-bold px-4 py-3 rounded-xl min-w-[100px] shadow-lg ${
                            calculatedValue === null
                              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                              : isOutOfBounds
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          }`}>
                            {calculatedValue !== null ? calculatedValue.toFixed(0) : '-'}
                          </div>
                          
                          {question.unit && (
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-10">
                              {question.unit}
                            </div>
                          )}

                          {/* Error Button */}
                          {isOutOfBounds && onAddError && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const newError = {
                                  title: language === 'de'
                                    ? `Berechneter Wert außerhalb der Grenzen: ${getTranslatedTitle(question)}`
                                    : `Határértéken kívüli számított érték: ${getTranslatedTitle(question)}`,
                                  description: language === 'de'
                                    ? `Der berechnete Wert ${calculatedValue} ${question.unit} liegt außerhalb der zulässigen Grenzen (${question.minValue}-${question.maxValue} ${question.unit}).`
                                    : `A számított érték ${calculatedValue} ${question.unit} kívül esik a megengedett határokon (${question.minValue}-${question.maxValue} ${question.unit}).`,
                                  severity: 'critical' as const,
                                };

                                onAddError(newError);

                                const toast = document.createElement('div');
                                toast.textContent = language === 'de'
                                  ? 'Fehler zur Fehlerliste hinzugefügt!'
                                  : 'Hiba hozzáadva a hibalistához!';
                                toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-weight:500;';
                                document.body.appendChild(toast);
                                setTimeout(() => document.body.removeChild(toast), 2000);
                              }}
                              className="group relative p-3 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/50 transition-all"
                              title={t.errorRecordingRequired}
                            >
                              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME
  // ========================================
  return (
    <div className="space-y-6">
      {measurementQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              {t.measurementData}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {measurementQuestions.map((question, index) => {
                const currentValue = values[question.id];
                return (
                  <div key={question.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 font-semibold rounded-full shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">
                        {getTranslatedTitle(question)}
                      </p>
                      {question.unit && (
                        <p className="text-base text-gray-500 mt-1">{question.unit}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={currentValue?.toString() || ''}
                        onChange={(e) => {
                          let inputValue = e.target.value.replace(/[^0-9.]/g, '');
                          if (inputValue.length > 5) {
                            inputValue = inputValue.slice(0, 5);
                            e.target.value = inputValue;
                          }
                          handleMeasurementChange(question.id, inputValue);
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const focusableElements = document.querySelectorAll(
                              'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                            );
                            const currentIndex = Array.from(focusableElements).indexOf(e.currentTarget);
                            const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
                            if (nextElement) {
                              nextElement.focus();
                              if (nextElement.tagName === 'INPUT') {
                                (nextElement as HTMLInputElement).select();
                              }
                            }
                          }
                        }}
                        placeholder="0"
                        className="text-center font-mono border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                        maxLength={5}
                      />
                      {question.unit && (
                        <span className="text-sm text-gray-500 w-8">{question.unit}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                {t.calculatedValuesValidated}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {calculatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              {t.calculatedValues}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculatedQuestions.map((question, index) => {
                const calculatedValue = calculatedValues[question.id];
                const isOutOfBounds =
                  calculatedValue !== null &&
                  question.minValue !== undefined &&
                  question.maxValue !== undefined &&
                  (calculatedValue < question.minValue || calculatedValue > question.maxValue);

                return (
                  <div key={question.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 font-semibold rounded-full shrink-0">
                      {measurementQuestions.length + index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">
                        {getTranslatedTitle(question)}
                      </p>
                      {question.minValue !== undefined && question.maxValue !== undefined && (
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'de' ? 'Zulässiger Bereich' : 'Megengedett tartomány'}: {question.minValue} - {question.maxValue} {question.unit}
                        </p>
                      )}
                      {isOutOfBounds && (
                        <p className="text-sm text-red-500 font-medium mt-1">
                          ⚠️ {t.outOfRange || 'Határértéken kívül'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`text-center font-mono text-lg font-bold px-3 py-2 rounded-md min-w-[80px] ${
                        calculatedValue === null
                          ? 'bg-gray-50 text-gray-400'
                          : isOutOfBounds
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600'
                      }`}>
                        {calculatedValue !== null ? calculatedValue.toFixed(0) : '-'}
                      </div>
                      {question.unit && (
                        <span className="text-sm text-gray-500 w-8">{question.unit}</span>
                      )}

                      {isOutOfBounds && onAddError && (
                        <div className="ml-2 text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              const newError = {
                                title: language === 'de'
                                  ? `Berechneter Wert außerhalb der Grenzen: ${getTranslatedTitle(question)}`
                                  : `Határértéken kívüli számított érték: ${getTranslatedTitle(question)}`,
                                description: language === 'de'
                                  ? `Der berechnete Wert ${calculatedValue} ${question.unit} liegt außerhalb der zulässigen Grenzen (${question.minValue}-${question.maxValue} ${question.unit}).`
                                  : `A számított érték ${calculatedValue} ${question.unit} kívül esik a megengedett határokon (${question.minValue}-${question.maxValue} ${question.unit}).`,
                                severity: 'critical' as const,
                              };

                              if (onAddError) {
                                onAddError(newError);
                              }

                              const toast = document.createElement('div');
                              toast.textContent = language === 'de'
                                ? 'Fehler zur Fehlerliste hinzugefügt!'
                                : 'Hiba hozzáadva a hibalistához!';
                              toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-weight:500;';
                              document.body.appendChild(toast);
                              setTimeout(() => document.body.removeChild(toast), 2000);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors block"
                          >
                            <AlertTriangle className="h-6 w-6" />
                          </button>
                          <p className="text-xs text-red-600 font-medium mt-1">
                            {t.errorRecordingRequired}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Deprecated helper functions
export const clearAllCalculatedValues = () => {
  console.warn('⚠️ clearAllCalculatedValues() is deprecated. Use React state instead.');
};

export const getAllCalculatedValues = (): Record<string, any> => {
  console.warn('⚠️ getAllCalculatedValues() is deprecated. Use React state instead.');
  return {};
};
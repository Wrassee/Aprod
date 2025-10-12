import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Ruler, AlertTriangle } from 'lucide-react';
import { useLanguageContext } from '@/components/language-provider';

interface Question {
  id: string;
  title: string;
  titleDe?: string;
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

  // 1. LÉPÉS: Ezt a blokkot másold be a `useLanguageContext` hívás után
  const getTranslatedTitle = (question: Question) => {
    if (language === 'de' && question.titleDe) {
      return question.titleDe; // Ha van német fordítás, azt használjuk
    }
    // Bármely más esetben (vagy ha nincs német fordítás), a magyar címet használjuk
    return question.titleHu || question.title; 
  };
  
  const measurementQuestions = questions.filter(q => q.type === 'measurement');
  const calculatedQuestions = questions.filter(q => q.type === 'calculated');

  // Handle input change for measurement fields
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

  // Calculate value for calculated questions based on current values
  const calculateValue = useCallback((question: Question): number | null => {
    if (!question.calculationFormula || !question.calculationInputs) {
      return null;
    }

    try {
      let formula = question.calculationFormula;
      
      const inputIds = Array.isArray(question.calculationInputs) 
        ? question.calculationInputs 
        : question.calculationInputs.split(',').map((id: string) => id.trim());
      
      // Replace all input IDs with their current values
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
      
      try {
        const result = Function(`"use strict"; return (${formula})`)();
        const roundedResult = typeof result === 'number' && !isNaN(result) ? Math.round(result) : null;
        
        console.log(`🧮 Calculated ${question.id}: ${roundedResult} (formula: ${question.calculationFormula})`);
        return roundedResult;
      } catch (evalError) {
        console.error(`❌ Calculation error for ${question.id}:`, evalError);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Calculation setup error for ${question.id}:`, error);
      return null;
    }
  }, [values]);

  // Memoize calculated values to avoid unnecessary recalculations
  const calculatedValues = useMemo(() => {
    const results: Record<string, number | null> = {};
    calculatedQuestions.forEach(q => {
      results[q.id] = calculateValue(q);
    });
    return results;
  }, [calculatedQuestions, calculateValue]);

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
                        <p className="text-base text-gray-500 mt-1">
                          {question.unit}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={currentValue?.toString() || ''}
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          
                          // Only allow numbers and decimal point
                          inputValue = inputValue.replace(/[^0-9.]/g, '');
                          
                          // Limit to 5 characters maximum
                          if (inputValue.length > 5) {
                            inputValue = inputValue.slice(0, 5);
                            e.target.value = inputValue;
                          }
                          
                          handleMeasurementChange(question.id, inputValue);
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Find next focusable element
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
                const isOutOfBounds = calculatedValue !== null && 
                  question.minValue !== undefined && question.maxValue !== undefined &&
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
                              
                              const currentErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
                              
                              const newError = {
                                id: `boundary-${question.id}-${Date.now()}`,
                                title: language === 'de' 
                                  ? `Berechneter Wert außerhalb der Grenzen: ${question.titleDe || question.title}`
                                  : `Határértéken kívüli számított érték: ${question.title}`,
                                description: language === 'de'
                                  ? `Der berechnete Wert ${calculatedValue} ${question.unit} liegt außerhalb der zulässigen Grenzen (${question.minValue}-${question.maxValue} ${question.unit}).`
                                  : `A számított érték ${calculatedValue} ${question.unit} kívül esik a megengedett határokon (${question.minValue}-${question.maxValue} ${question.unit}).`,
                                severity: 'critical' as const
                              };
                              currentErrors.push(newError);
                              localStorage.setItem('protocol-errors', JSON.stringify(currentErrors));
                              
                              // Dispatch custom event to notify ErrorList component
                              window.dispatchEvent(new CustomEvent('protocol-error-added'));
                              
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

// DEPRECATED: These functions are no longer needed
export const clearAllCalculatedValues = () => {
  console.warn('⚠️ clearAllCalculatedValues() is deprecated. Use React state instead.');
};

export const getAllCalculatedValues = (): Record<string, any> => {
  console.warn('⚠️ getAllCalculatedValues() is deprecated. Use React state instead.');
  return {};
};
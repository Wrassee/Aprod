// src/components/measurement-question.tsx - FIXED VERSION
import React, { useCallback } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { Label } from '@/components/ui/label';
import { Question } from '@shared/schema';
import { useTheme } from '@/contexts/theme-context';
import { Zap, Sparkles } from 'lucide-react';

interface MeasurementQuestionProps {
  question: Question;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function MeasurementQuestion({ question, value, onChange }: MeasurementQuestionProps) {
  const { language } = useLanguageContext();
  const { theme } = useTheme();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Only allow numbers and decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Limit to 5 characters maximum
    if (inputValue.length > 5) {
      inputValue = inputValue.slice(0, 5);
      e.target.value = inputValue;
    }
    
    // Parse and validate the value
    if (inputValue === '' || inputValue === '.') {
      onChange(undefined);
    } else {
      const parsedValue = parseFloat(inputValue);
      if (!isNaN(parsedValue)) {
        onChange(parsedValue);
      }
    }
    
    console.log(`✏️ Measurement input ${question.id}: "${inputValue}" -> ${parseFloat(inputValue) || 'undefined'}`);
  }, [question.id, onChange]);

  const getTitle = () => {
    if (language === 'de' && question.titleDe) return question.titleDe;
    if (language === 'hu' && question.titleHu) return question.titleHu;
    return question.title;
  };

  // Check if value is out of range
  const isOutOfRange = value !== undefined && !isNaN(value) && (
    (question.minValue !== undefined && value < question.minValue) ||
    (question.maxValue !== undefined && value > question.maxValue)
  );

  // ========================================
  // MODERN THEME
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50/20 to-cyan-50/10 border-2 border-blue-100 dark:border-blue-900/50 p-5 shadow-md hover:shadow-lg transition-all duration-300">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-cyan-400/5 pointer-events-none" />
        
        <div className="relative flex items-center gap-4">
          {/* Question Title */}
          <div className="flex-1">
            <Label htmlFor={question.id} className="block">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
                {getTitle()}
              </span>
              {question.required && (
                <span className="text-red-500 ml-1 text-xl">*</span>
              )}
            </Label>
            
            {/* Range info */}
            {question.minValue !== undefined && question.maxValue !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-500" />
                {language === 'de' ? 'Bereich' : 'Tartomány'}: {question.minValue} - {question.maxValue} {question.unit || ''}
              </p>
            )}
          </div>
          
          {/* Input Field */}
          <div className="relative flex-shrink-0 w-32">
            <input
              id={question.id}
              type="text"
              inputMode="decimal"
              value={value?.toString() || ''}
              onChange={handleInputChange}
              placeholder="0.0"
              maxLength={5}
              className={`
                w-full h-14 px-4 text-center text-xl font-bold rounded-xl transition-all shadow-lg
                ${isOutOfRange 
                  ? 'border-2 border-red-500 dark:border-red-400 focus:border-red-600 focus:ring-4 focus:ring-red-500/30 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200' 
                  : 'border-2 border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                }
              `}
            />
            
            {/* Unit Badge */}
            {question.unit && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {question.unit}
              </div>
            )}
          </div>
        </div>
        
        {/* Out of Range Warning */}
        {isOutOfRange && (
          <div className="relative mt-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-2 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {language === 'de' 
                ? 'Wert außerhalb des zulässigen Bereichs' 
                : 'Az érték a megengedett tartományon kívül esik'
              }
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME
  // ========================================
  return (
    <div className="space-y-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Question Title */}
        <div className="flex-1">
          <Label htmlFor={question.id} className="text-base font-bold text-gray-900 block">
            {getTitle()}
            {question.unit && (
              <span className="ml-2 text-gray-600 font-medium text-sm">({question.unit})</span>
            )}
            {question.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          
          {/* Range info */}
          {question.minValue !== undefined && question.maxValue !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {language === 'de' ? 'Bereich' : 'Tartomány'}: {question.minValue} - {question.maxValue} {question.unit || ''}
            </p>
          )}
        </div>
        
        {/* Input Field */}
        <div className="flex-shrink-0">
          <input
            id={question.id}
            type="text"
            inputMode="decimal"
            value={value?.toString() || ''}
            onChange={handleInputChange}
            placeholder="0"
            maxLength={5}
            className={`
              w-20 h-10 px-2 text-center text-sm font-semibold border-2 rounded-md transition-colors
              ${isOutOfRange 
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/30 bg-red-50 text-red-900' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 bg-white text-gray-900'
              }
            `}
          />
        </div>
      </div>
      
      {/* Out of Range Warning */}
      {isOutOfRange && (
        <div className="p-2 rounded-md bg-red-50 border border-red-200">
          <p className="text-xs text-red-600 font-medium">
            {language === 'de' 
              ? 'Wert außerhalb des zulässigen Bereichs' 
              : 'Az érték a megengedett tartományon kívül esik'
            }
          </p>
        </div>
      )}
    </div>
  );
}

// DEPRECATED: These global functions are no longer needed
export function getAllMeasurementValues(): Record<string, number> {
  console.warn('⚠️ getAllMeasurementValues() is deprecated. Use React state instead.');
  return {};
}

export function clearAllMeasurementValues() {
  console.warn('⚠️ clearAllMeasurementValues() is deprecated. Use React state instead.');
}
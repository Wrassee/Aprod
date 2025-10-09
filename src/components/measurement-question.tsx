import React, { useCallback } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { Label } from '@/components/ui/label';
import { Question } from '@shared/schema';

interface MeasurementQuestionProps {
  question: Question;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function MeasurementQuestion({ question, value, onChange }: MeasurementQuestionProps) {
  const { language } = useLanguageContext();

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
      // Empty or just a decimal point - clear the value
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor={question.id} className="text-xl font-bold text-gray-900 flex-1 leading-relaxed">
          {getTitle()}
          {question.unit && (
            <span className="ml-2 text-gray-700 font-medium">({question.unit})</span>
          )}
          {question.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        
        <div className="flex-shrink-0" style={{width: "70px"}}>
          <input
            id={question.id}
            type="text"
            value={value?.toString() || ''}
            onChange={handleInputChange}
            placeholder="0"
            className={`text-center text-sm px-1 border-2 rounded-lg py-1 ${isOutOfRange ? 'border-red-500' : 'border-gray-200'}`}
            maxLength={5}
            style={{width: "70px", fontSize: "12px", minWidth: "70px", maxWidth: "70px"}}
          />
        </div>
      </div>
      
      {question.minValue !== undefined && question.maxValue !== undefined && (
        <p className="text-xs text-gray-500 ml-1">
          {language === 'de' ? 'Bereich' : 'Tartomány'}: {question.minValue} - {question.maxValue} {question.unit || ''}
        </p>
      )}
      
      {isOutOfRange && (
        <p className="text-xs text-red-500 ml-1">
          {language === 'de' 
            ? 'Wert außerhalb des zulässigen Bereichs' 
            : 'Az érték a megengedett tartományon kívül esik'
          }
        </p>
      )}
    </div>
  );
}

// DEPRECATED: These global functions are no longer needed
// They're kept for backward compatibility but should not be used
export function getAllMeasurementValues(): Record<string, number> {
  console.warn('⚠️ getAllMeasurementValues() is deprecated. Use React state instead.');
  return {};
}

export function clearAllMeasurementValues() {
  console.warn('⚠️ clearAllMeasurementValues() is deprecated. Use React state instead.');
}
// src/components/StyledRadioGroup.tsx
import { memo } from 'react';
// UI Komponensek
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
// Modern téma ikonjai
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
// Téma Hook
import { useTheme } from '../contexts/theme-context';

interface Option {
  value: string;
  label: string;
}

interface StyledRadioGroupProps {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export const StyledRadioGroup = memo(({ questionId, value, onChange, options }: StyledRadioGroupProps) => {
  const { theme } = useTheme();

  // -------------------------
  // |    MODERN OTIS TÉMA   |
  // -------------------------
  if (theme === 'modern') {
    const getColorClasses = (value: string, currentValue: string) => {
      const isSelected = currentValue === value;
      
      switch (value) {
        case 'yes':
        case 'true':
          return isSelected
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg scale-105'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300';
        case 'no':
        case 'false':
          return isSelected
            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-500 shadow-lg scale-105'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300';
        case 'na':
          return isSelected
            ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-500 shadow-lg scale-105'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-300';
        default:
          return isSelected
            ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white border-blue-500 shadow-lg scale-105'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300';
      }
    };

    const getIcon = (value: string, isSelected: boolean) => {
      const iconClass = `h-3 w-3 sm:h-4 sm:w-4 transition-transform pointer-events-none ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`;
      
      switch (value) {
        case 'yes':
        case 'true':
          return <CheckCircle2 className={iconClass} />;
        case 'no':
        case 'false':
          return <XCircle className={iconClass} />;
        case 'na':
          return <MinusCircle className={iconClass} />;
        default:
          return null;
      }
    };
    
    return (
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex items-center gap-2"
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem 
                value={option.value} 
                id={`${questionId}_${option.value}`} 
                className="sr-only" 
              />
              <Label
                htmlFor={`${questionId}_${option.value}`}
                className={`
                  group relative inline-flex items-center justify-center gap-1 sm:gap-2 
                  rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold border-2 
                  cursor-pointer transition-all duration-300 
                  shadow-sm hover:shadow-md whitespace-nowrap
                  ${getColorClasses(option.value, value)}
                `}
              >
                {getIcon(option.value, isSelected)}
                <span>{option.label}</span>
                
                {/* Shine effect on hover */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700 pointer-events-none"></div>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  }

  // -------------------------
  // |     CLASSIC TÉMA      |
  // -------------------------
  // (Alapértelmezett return)
  
  const getColorClasses = (value: string, currentValue: string) => {
    switch (value) {
      case 'yes':
      case 'true':
        return currentValue === value
          ? 'bg-green-600 text-white border-green-600 shadow-md'
          : 'bg-white text-gray-800 border-gray-300 hover:bg-green-50';
      case 'no':
      case 'false':
        return currentValue === value
          ? 'bg-red-600 text-white border-red-600 shadow-md'
          : 'bg-white text-gray-800 border-gray-300 hover:bg-red-50';
      case 'na':
        return currentValue === value
          ? 'bg-gray-600 text-white border-gray-600 shadow-md'
          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100';
      default:
        return 'bg-white text-gray-800 border-gray-300';
    }
  };

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex items-center gap-x-2 sm:gap-x-3"
    >
      {options.map((option) => (
        <div key={option.value}>
          <RadioGroupItem value={option.value} id={`${questionId}_${option.value}`} className="sr-only" />
          <Label
            htmlFor={`${questionId}_${option.value}`}
            className={`
              inline-flex items-center justify-center rounded-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold border cursor-pointer transition-all whitespace-nowrap
              ${getColorClasses(option.value, value)}
            `}
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
});

StyledRadioGroup.displayName = 'StyledRadioGroup';


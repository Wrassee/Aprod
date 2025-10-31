// src/components/StyledRadioGroup.tsx
import { memo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

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
  const iconClass = `h-4 w-4 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`;
  
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

export const StyledRadioGroup = memo(({ questionId, value, onChange, options }: StyledRadioGroupProps) => {
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
                group relative inline-flex items-center justify-center gap-2 
                rounded-xl px-4 py-2.5 text-sm font-bold border-2 
                cursor-pointer transition-all duration-300 
                shadow-sm hover:shadow-md
                ${getColorClasses(option.value, value)}
              `}
            >
              {getIcon(option.value, isSelected)}
              <span>{option.label}</span>
              
              {/* Shine effect on hover */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
              )}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
});

StyledRadioGroup.displayName = 'StyledRadioGroup';
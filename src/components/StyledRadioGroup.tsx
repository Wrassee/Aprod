// src/components/StyledRadioGroup.tsx

import { memo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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

export const StyledRadioGroup = memo(({ questionId, value, onChange, options }: StyledRadioGroupProps) => {
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
              inline-flex items-center justify-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-sm font-semibold border cursor-pointer transition-all
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
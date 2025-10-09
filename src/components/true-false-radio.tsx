// src/components/true-false-radio.tsx - TELJES, ÚJ VERZIÓ

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { StyledRadioGroup } from './StyledRadioGroup'; // Importáljuk az új komponenst

interface TrueFalseRadioProps {
  questionId: string;
  questionTitle: string;
  value: string;
  onChange: (value: string) => void;
  // Új prop, hogy tudjuk, milyen gombokat kell megjeleníteni
  questionType: 'radio' | 'checkbox' | string; 
}

// Opciók definiálása a különböző típusokhoz
const trueFalseOptions = [
  { value: 'true', label: 'Igen' },
  { value: 'false', label: 'Nem' },
];

const yesNoNaOptions = [
  { value: 'yes', label: 'Igen' },
  { value: 'no', label: 'Nem' },
  { value: 'na', label: 'N.A.' },
];

export const TrueFalseRadio = memo(({ questionId, questionTitle, value, onChange, questionType }: TrueFalseRadioProps) => {
  // A `parser` a `true_false` kérdéseket `radio`-vá, a `yes_no_na` kérdéseket `checkbox`-szá alakítja.
  // Ezt a logikát használjuk a megfelelő gombok kiválasztásához.
  const options = questionType === 'radio' ? trueFalseOptions : yesNoNaOptions;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-3 border-b border-gray-100 last:border-b-0">
      {/* Kérdés Címe */}
      <Label className="text-sm font-medium text-gray-800 pr-4">
        {questionTitle}
      </Label>
      
      {/* Új, stílusos rádiógomb csoport */}
      <div className="flex justify-center">
        <StyledRadioGroup
          questionId={questionId}
          value={value}
          onChange={onChange}
          options={options}
        />
      </div>
    </div>
  );
});

TrueFalseRadio.displayName = 'TrueFalseRadio';
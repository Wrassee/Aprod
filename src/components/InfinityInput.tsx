import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface InfinityInputProps {
  value: string | number;
  onChange: (value: string) => void;
}

export function InfinityInput({ value, onChange }: InfinityInputProps) {
  // Ez a belső állapot kezeli, hogy mi jelenjen meg a szám beviteli mezőben
  const isNumeric = value !== '∞' && value !== '-';
  const [inputValue, setInputValue] = useState(isNumeric ? value.toString() : '');

  // Biztosítja, hogy a belső állapot frissüljön, ha a külső érték változik
  useEffect(() => {
    const isNumericProp = value !== '∞' && value !== '-';
    setInputValue(isNumericProp ? value.toString() : '');
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
    setInputValue(numericValue);
    onChange(numericValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
  variant="outline"
  className={`w-full font-normal ${
    (value === '∞' || value === '-')
      ? 'text-xl font-bold justify-center' // <-- ÚJ STÍLUSOK, HA ∞ VAGY -
      : 'justify-start'                    // <-- Eredeti stílus egyébként
  }`}
>
  {value || <span className="text-muted-foreground">-</span>}
</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-40"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* "-" (Nem releváns) opció */}
        <DropdownMenuItem onSelect={() => onChange('-')}>
          <span className="text-lg font-bold mx-auto">-</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Végtelen jel kiválasztása */}
        <DropdownMenuItem onSelect={() => onChange('∞')}>
          <span className="text-lg font-bold mx-auto">∞</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        {/* Numerikus érték bevitele */}
        <div className="p-2">
          <Input
            type="text"
            placeholder="Érték (MΩ)"
            className="text-center"
            value={inputValue}
            onChange={handleNumberChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
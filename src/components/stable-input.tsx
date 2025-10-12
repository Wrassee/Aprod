// src/components/stable-input.tsx
import React from "react";
// ÚJ IMPORT-ok a shadcn/ui komponensekből
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StableInputProps {
  questionId: string;
  // Bővítjük a lehetséges típusokat
  type?: 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  maxLength?: number; // Új prop a karakter limithez
  step?: string | number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  options?: string; // Új prop a select opciókhoz (vesszővel elválasztva)
  required?: boolean;
}

export function StableInput({
  questionId,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  min,
  max,
  maxLength,
  step,
  onKeyDown,
  options,
  required,
}: StableInputProps) {

  // Speciális eseménykezelő a telefonszámhoz
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validPhoneRegex = /^[0-9+\-() ]*$/;
    if (validPhoneRegex.test(e.target.value)) {
      onChange(e.target.value);
    }
  };

  const baseClassName = "w-full focus:outline-none focus:ring-2 focus:ring-otis-blue focus:border-transparent";

  // A `type` alapján a megfelelő komponenst adjuk vissza
  switch (type) {
    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`${baseClassName} ${className || ''}`}
        />
      );

    case 'select':
      const selectOptions = options ? options.split(',') : [];
      return (
        <Select value={value || ''} onValueChange={onChange} required={required}>
          <SelectTrigger className={`${baseClassName} ${className || ''}`}>
            <SelectValue placeholder={placeholder || "Válasszon..."} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.trim()} value={option.trim()}>
                {option.trim()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'phone':
      return (
        <Input
          type="tel" // HTML `tel` típus a mobil billentyűzet miatt
          value={value || ''}
          onChange={handlePhoneChange} // Itt használjuk a szűrőt
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${baseClassName} ${className || ''}`}
        />
      );
    
    // Az összes többi `<input>`-alapú típus
    case 'text':
    case 'number':
    case 'email':
    default:
      return (
        <Input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
          step={step}
          required={required}
          className={`${baseClassName} ${className || ''}`}
        />
      );
  }
}
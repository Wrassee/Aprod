// src/components/stable-input.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StableInputProps {
  questionId: string;
  type?: 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'measurement' | 'multi_select' | 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  step?: string | number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  options?: string;
  required?: boolean;
  unit?: string;
  calculationConfig?: any;
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
  unit,
  calculationConfig,
}: StableInputProps) {

  // Speciális eseménykezelő a telefonszámhoz
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validPhoneRegex = /^[0-9+\-() ]*$/;
    if (validPhoneRegex.test(e.target.value)) {
      onChange(e.target.value);
    }
  };

  // 🎯 EGYSÉGES FÓKUSZ STÍLUS - vastag kék keret minden mezőn
  const baseClassName = `
    w-full 
    border border-gray-300 
    rounded-md
    focus:outline-none 
    focus:ring-2 
    focus:ring-otis-blue 
    focus:border-transparent
    focus:shadow-md
    transition-all duration-150
  `;

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
    case 'multi_select':
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
          type="tel"
          value={value || ''}
          onChange={handlePhoneChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${baseClassName} ${className || ''}`}
        />
      );
    
    case 'date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${baseClassName} ${className || ''}`}
        />
      );
    
    case 'time':
      return (
        <Input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${baseClassName} ${className || ''}`}
        />
      );
    
    case 'measurement':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            required={required}
            className={`${baseClassName} ${className || ''}`}
          />
          {unit && (
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {unit}
            </span>
          )}
        </div>
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
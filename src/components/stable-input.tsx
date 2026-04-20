// src/components/stable-input.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Supported languages in order — MUST match the order used in the Excel template options column
// Format: "hu_value|de_value|en_value|fr_value|it_value"
const LANG_ORDER = ['hu', 'de', 'en', 'fr', 'it'] as const;

interface ParsedOption {
  label: string;       // current-language display label
  value: string;       // stored value (same as label)
  allVariants: string[]; // all language variants for reverse lookup
}

/**
 * Parses the raw options string from the Excel template.
 * Supports both plain ("Hospital,Hotel,Office") and
 * multilingual ("Kórház|Krankenhaus|Hospital|Hôpital|Ospedale,Hotel|Hotel|...") formats.
 */
function parseOptions(rawOptions: string, language: string): ParsedOption[] {
  const langIndex = LANG_ORDER.indexOf(language as any);
  const idx = langIndex >= 0 ? langIndex : 0;

  return rawOptions.split(',').map(opt => {
    const trimmed = opt.trim();
    if (!trimmed) return null;

    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim());
      const label = parts[idx] || parts[0];
      return { label, value: label, allVariants: parts };
    }

    return { label: trimmed, value: trimmed, allVariants: [trimmed] };
  }).filter(Boolean) as ParsedOption[];
}

/**
 * Resolves the SELECT display value from a stored answer.
 * If the stored answer is in a different language (e.g. "Krankenhaus" but UI is in Hungarian),
 * it finds the matching option by checking all language variants and returns the current-language label.
 */
function resolveDisplayValue(storedAnswer: string, parsedOptions: ParsedOption[]): string {
  if (!storedAnswer) return '';
  for (const opt of parsedOptions) {
    if (opt.allVariants.includes(storedAnswer)) {
      return opt.label;
    }
  }
  return storedAnswer; // fallback: show as-is (plain / old format)
}

interface StableInputProps {
  questionId: string;
  type?: 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'select_extended' | 'measurement' | 'multi_select' | 'date' | 'time';
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
  language?: string;
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
  language = 'hu',
}: StableInputProps) {

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validPhoneRegex = /^[0-9+\-() ]*$/;
    if (validPhoneRegex.test(e.target.value)) {
      onChange(e.target.value);
    }
  };

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
    case 'select_extended':
    case 'multi_select': {
      const parsedOptions = options ? parseOptions(options, language) : [];
      const displayValue = resolveDisplayValue(value, parsedOptions);

      return (
        <Select
          value={displayValue}
          onValueChange={(selected) => onChange(selected)}
          required={required}
        >
          <SelectTrigger className={`${baseClassName} ${className || ''}`}>
            <SelectValue placeholder={placeholder || "Válasszon..."} />
          </SelectTrigger>
          <SelectContent>
            {parsedOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

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

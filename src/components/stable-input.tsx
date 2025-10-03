// src/components/stable-input.tsx - JAVÍTOTT, KONTROLLÁLT VERZIÓ
import { Input } from "@/components/ui/input";
import React from "react";

interface StableInputProps {
  questionId: string;
  type?: 'text' | 'number' | 'email';
  value: string; // A value mostantól kötelező
  onChange: (value: string) => void; // Az onChange is kötelező
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: string | number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
  step,
  onKeyDown
}: StableInputProps) {

  // A handleChange most már csak egyetlen dolgot csinál:
  // Meghívja a szülőtől kapott onChange függvényt.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type={type}
      value={value || ''} // Az érték mindig a prop-ból jön
      onChange={handleChange} // A változás mindig a szülőnek megy
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`${questionId?.startsWith('m') ? 'w-auto' : 'w-full'} px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-otis-blue focus:border-transparent ${className || ''}`}
      style={{
        fontSize: '16px',
        backgroundColor: 'white',
        color: '#000',
        ...(questionId?.startsWith('m') ? { width: '70px', textAlign: 'center' } : {})
      }}
    />
  );
}
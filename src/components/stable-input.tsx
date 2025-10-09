// src/components/stable-input.tsx
import React from "react";

interface StableInputProps {
  questionId: string;
  type?: 'text' | 'number' | 'email';
  value: string;
  onChange?: (value: string) => void;   // opcionális
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);   // csak akkor hívjuk meg, ha van onChange
    }
  };

  return (
    <input
      type={type}
      value={value || ''} // biztosítjuk, hogy mindig string legyen
      onChange={handleChange}
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

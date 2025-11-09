// src/components/type-selector.tsx - JAVÍTOTT, FORDÍTOTT VERZIÓ

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/theme-context'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Sparkles } from 'lucide-react';

// 1. LÉPÉS: Importáld a nyelvi kontextust
import { useLanguageContext } from "@/components/language-context";

interface TypeSelectorInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Előre definiált német szabvány szerinti típusok
const PREDEFINED_TYPES = ["LS", "FI", "RCBO", "DI", "T", "HH", "NH"];

export function TypeSelectorInput({ value, onChange }: TypeSelectorInputProps) {
  const { theme } = useTheme(); 
  // 2. LÉPÉS: Kérd le az aktuális nyelvet
  const { language } = useLanguageContext();
  
  const isCustom = value && !PREDEFINED_TYPES.includes(value);
  const [customValue, setCustomValue] = useState(isCustom ? value : '');

  useEffect(() => {
    const isCustomProp = value && !PREDEFINED_TYPES.includes(value);
    setCustomValue(isCustomProp ? value : '');
  }, [value]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  // ========================================
  // MODERN THEME RENDER
  // ========================================
  if (theme === 'modern') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal text-center relative overflow-hidden group
                       border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50
                       transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 
                            opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <span className="relative z-10">
              {value ? (
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  {value}
                </span>
              ) : (
                // 3. LÉPÉS: JAVÍTVA
                <span className="text-gray-400 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {language === 'de' ? 'Typ auswählen...' : 'Válassz típust...'}
                </span>
              )}
            </span>
            
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-blue-600 transition-transform 
                                    group-hover:rotate-180 duration-300" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          className="w-48 rounded-xl border-2 border-blue-100 shadow-xl bg-white/95 backdrop-blur-sm"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Predefined Types */}
          {PREDEFINED_TYPES.map((type) => (
            <DropdownMenuItem 
              key={type} 
              onSelect={() => onChange(type)}
              className="rounded-lg mx-1 my-0.5 cursor-pointer transition-all
                         hover:bg-gradient-to-r hover:from-blue-500 hover:to-sky-500 
                         hover:text-white hover:scale-[1.02] hover:shadow-md
                         data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-blue-500 
                         data-[highlighted]:to-sky-500 data-[highlighted]:text-white"
            >
              <span className="font-semibold">{type}</span>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          
          {/* Custom Input */}
          <div className="p-2">
            <div className="relative group">
              <Input
                // 4. LÉPÉS: JAVÍTVA
                placeholder={language === 'de' ? 'Eigener Typ...' : 'Egyedi típus...'}
                value={customValue}
                onChange={handleCustomChange}
                onClick={(e) => e.stopPropagation()}
                autoFocus={isCustom}
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 
                           focus:ring-blue-500/30 rounded-lg transition-all"
              />
              {/* Pulse indicator on focus */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full 
                              bg-blue-500 opacity-0 group-focus-within:opacity-100 
                              animate-pulse transition-opacity" />
            </div>
            {isCustom && (
              // 5. LÉPÉS: JAVÍTVA
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {language === 'de' ? 'Eigener Typ wird verwendet' : 'Egyedi típus használva'}
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ========================================
  // CLASSIC THEME RENDER
  // ========================================
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal text-center border-gray-300 
                     hover:bg-gray-50 transition-colors"
        >
          {value || <span className="text-muted-foreground">-</span>}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-48 border border-gray-300 shadow-lg bg-white"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Predefined Types */}
        {PREDEFINED_TYPES.map((type) => (
          <DropdownMenuItem 
            key={type} 
            onSelect={() => onChange(type)}
            className="cursor-pointer hover:bg-blue-50"
          >
            {type}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Custom Input */}
        <div className="p-2">
          <Input
            // 6. LÉPÉS: JAVÍTVA
            placeholder={language === 'de' ? 'Eigener Typ...' : 'Egyedi típus...'}
            value={customValue}
            onChange={handleCustomChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus={isCustom}
            className="border-gray-300"
          />
          {isCustom && (
            // 7. LÉPÉS: JAVÍTVA
            <p className="text-xs text-gray-600 mt-1">
              ℹ️ {language === 'de' ? 'Eigener Typ' : 'Egyedi típus'}
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
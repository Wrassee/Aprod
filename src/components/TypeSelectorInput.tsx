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
// 1. LÉPÉS: Ikon cseréje ChevronDown-ra
import { ChevronDown } from 'lucide-react'; 

interface TypeSelectorInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Előre definiált német szabvány szerinti típusok
const PREDEFINED_TYPES = ["LS", "FI", "RCBO", "DI", "T", "HH", "NH"];

export function TypeSelectorInput({ value, onChange }: TypeSelectorInputProps) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal text-center" // A középre igazítás megmarad
        >
          {value || <span className="text-muted-foreground">-</span>}
          
          {/* 2. LÉPÉS: A komponens cseréje a JSX-ben */}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {PREDEFINED_TYPES.map((type) => (
          <DropdownMenuItem key={type} onSelect={() => onChange(type)}>
            {type}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />

        <div className="p-2">
          <Input
            placeholder="Egyedi típus..."
            value={customValue}
            onChange={handleCustomChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus={isCustom}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { memo, useCallback } from 'react';

// JAVÍTVA: A props interface most már value-t és onChange-et vár
interface CacheRadioProps {
  questionId: string;
  value: string | undefined; // Az aktuális kiválasztott érték a szülőtől
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void; // Függvény, amivel a szülőnek jelzünk
}

// JAVÍTVA: Nincs többé globális cache és belső állapot
export const CacheRadio = memo(({ questionId, value, options, onChange }: CacheRadioProps) => {

  // JAVÍTVA: A handleChange most már csak a szülőt hívja meg.
  // A useCallback használata itt is jó gyakorlat.
  const handleChange = useCallback((newValue: string) => {
    console.log(`Radio changed: ${questionId} = ${newValue}`);
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const inputId = `${questionId}-${option.value}`;
        return (
          <div key={option.value} className="flex items-center space-x-3">
            <input
              type="radio"
              id={inputId}
              name={questionId}
              value={option.value}
              // JAVÍTVA: A `checked` állapotot a szülőtől kapott `value` prop határozza meg
              checked={value === option.value}
              onChange={(e) => {
                // Nem kell stopPropagation, és a handleChange már useCallback-be van csomagolva
                if (e.target.checked) {
                  handleChange(option.value);
                }
              }}
              className="w-5 h-5 text-otis-blue bg-gray-100 border-gray-300 focus:ring-otis-blue focus:ring-2 focus:outline-none"
            />
            <label 
              htmlFor={inputId}
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </div>
  );
});

CacheRadio.displayName = 'CacheRadio';

// A globális cache-re épülő függvények feleslegessé váltak, törölhetők.
// Vagy a korábbi mintához hasonlóan kiürítheted őket egy figyelmeztetéssel.
export const getAllCachedValues = (): Record<string, string> => {
  console.warn('⚠️ getAllCachedValues() is deprecated. Use React state instead.');
  return {};
};
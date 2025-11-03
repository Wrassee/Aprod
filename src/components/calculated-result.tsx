import { useMemo } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { useTheme } from '@/contexts/theme-context';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { Question } from '@shared/schema';

interface CalculatedResultProps {
  question: Question;
  inputValues: Record<string, number | string | undefined>;
}

export function CalculatedResult({ question, inputValues }: CalculatedResultProps) {
  const { language } = useLanguageContext();
  const { theme } = useTheme();

  const calculationResult = useMemo(() => {
    if (!question.calculationFormula || !question.calculationInputs) {
      return { value: null, error: 'No calculation formula defined' };
    }

    try {
      const inputIds = question.calculationInputs.split(',').map(id => id.trim());
      let formula = question.calculationFormula;
      let hasAllInputs = true;

      const numericInputs: Record<string, number> = {};
      Object.entries(inputValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const numValue = typeof value === 'number' ? value : parseFloat(value as string);
          if (!isNaN(numValue)) {
            numericInputs[key] = numValue;
          }
        }
      });

      console.log(`🧮 [CalculatedResult ${question.id}] Input IDs:`, inputIds);
      console.log(`🧮 [CalculatedResult ${question.id}] Numeric inputs:`, numericInputs);
      console.log(`🧮 [CalculatedResult ${question.id}] Original formula:`, formula);

      inputIds.forEach(inputId => {
        const value = numericInputs[inputId];
        if (value === undefined || value === null || isNaN(value)) {
          console.log(`⚠️ [CalculatedResult ${question.id}] Missing value for ${inputId}`);
          hasAllInputs = false;
          return;
        }
        formula = formula.replace(new RegExp(`\\b${inputId}\\b`, 'g'), value.toString());
      });

      if (!hasAllInputs) {
        return { value: null, error: 'Missing input values' };
      }

      console.log(`🧮 [CalculatedResult ${question.id}] Substituted formula:`, formula);

      const result = Function(`"use strict"; return (${formula})`)();
      
      if (isNaN(result)) {
        return { value: null, error: 'Invalid calculation result' };
      }

      const roundedResult = Math.round(result * 100) / 100;
      console.log(`✅ [CalculatedResult ${question.id}] Final result:`, roundedResult);

      return { value: roundedResult, error: null };
    } catch (error) {
      console.error(`❌ [CalculatedResult ${question.id}] Calculation error:`, error);
      return { value: null, error: `Calculation error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }, [question, inputValues]);

  const getTitle = () => {
    if (language === 'de' && question.titleDe) return question.titleDe;
    if (language === 'hu' && question.titleHu) return question.titleHu;
    return question.title;
  };

  const isValid = calculationResult.value !== null && !calculationResult.error;
  const isOutOfRange = isValid && calculationResult.value !== null && (
    (question.minValue !== undefined && calculationResult.value < question.minValue) ||
    (question.maxValue !== undefined && calculationResult.value > question.maxValue)
  );

  const getStatusBadge = () => {
    if (!isValid) {
      return (
        <Badge variant="secondary" className={theme === 'modern' 
          ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0' 
          : ''}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {language === 'de' ? 'Berechnung nicht möglich' : 'Számítás nem lehetséges'}
        </Badge>
      );
    }
    
    if (isOutOfRange) {
      return (
        <Badge variant="destructive" className={theme === 'modern' 
          ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0' 
          : ''}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {language === 'de' ? 'Außerhalb der Grenzwerte' : 'Határértéken kívül'}
        </Badge>
      );
    }

    return (
      <Badge className={theme === 'modern' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
        : 'bg-green-600 text-white'}>
        <CheckCircle className="h-3 w-3 mr-1" />
        {language === 'de' ? 'Innerhalb der Grenzwerte' : 'Határértéken belül'}
      </Badge>
    );
  };

  // MODERN THEME RENDER
  if (theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300 mb-4">
        {/* Glow animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-30 animate-pulse" />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-400 flex items-center justify-center shadow-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                {getTitle()}
                <Sparkles className="h-4 w-4 text-teal-500" />
              </h4>
            </div>
            {getStatusBadge()}
          </div>

          {/* Result Display */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 p-6 mb-4 border-2 border-green-100">
            <div className="text-4xl font-mono font-bold text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {isValid && calculationResult.value !== null
                ? `${calculationResult.value} ${question.unit || ''}`
                : `-- ${question.unit || ''}`
              }
            </div>
            {/* Glow effect on value */}
            {isValid && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-teal-400/20 blur-xl" />
            )}
          </div>

          {/* Formula Display */}
          <div className="mb-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-green-600" />
              <strong className="text-sm text-gray-700">
                {language === 'de' ? 'Formel' : 'Képlet'}:
              </strong>
            </div>
            <code className="text-sm text-gray-800 font-mono">{question.calculationFormula}</code>
          </div>

          {/* Range Info */}
          {question.minValue !== undefined && question.maxValue !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>
                {language === 'de' ? 'Zulässiger Bereich' : 'Megengedett tartomány'}: 
                <strong className="text-blue-700 ml-1">
                  {question.minValue} - {question.maxValue} {question.unit || ''}
                </strong>
              </span>
            </div>
          )}

          {/* Error Alert */}
          {calculationResult.error && (
            <Alert className="border-2 border-red-200 bg-red-50/50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {language === 'de' ? 'Berechnungsfehler' : 'Számítási hiba'}: {calculationResult.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Out of Range Alert */}
          {isOutOfRange && calculationResult.value !== null && (
            <Alert className="border-2 border-red-200 bg-red-50/50 mt-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {language === 'de' 
                  ? `Wert ${calculationResult.value} ${question.unit || ''} liegt außerhalb des zulässigen Bereichs`
                  : `Az érték ${calculationResult.value} ${question.unit || ''} a megengedett tartományon kívül esik`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // CLASSIC THEME RENDER
  return (
    <Card className="mb-4 shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-800">{getTitle()}</h4>
          </div>
          {getStatusBadge()}
        </div>

        <div className="text-2xl font-mono bg-gray-50 p-3 rounded-lg mb-3 text-center border border-gray-200">
          {isValid && calculationResult.value !== null
            ? `${calculationResult.value} ${question.unit || ''}`
            : `-- ${question.unit || ''}`
          }
        </div>

        <div className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
          <strong>{language === 'de' ? 'Formel' : 'Képlet'}:</strong> 
          <code className="ml-2 font-mono">{question.calculationFormula}</code>
        </div>

        {question.minValue !== undefined && question.maxValue !== undefined && (
          <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 rounded border border-blue-200">
            {language === 'de' ? 'Zulässiger Bereich' : 'Megengedett tartomány'}: 
            <strong className="ml-1">{question.minValue} - {question.maxValue} {question.unit || ''}</strong>
          </div>
        )}

        {calculationResult.error && (
          <Alert className="border border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {language === 'de' ? 'Berechnungsfehler' : 'Számítási hiba'}: {calculationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {isOutOfRange && calculationResult.value !== null && (
          <Alert className="border border-red-300 bg-red-50 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {language === 'de' 
                ? `Wert ${calculationResult.value} ${question.unit || ''} liegt außerhalb des zulässigen Bereichs`
                : `Az érték ${calculationResult.value} ${question.unit || ''} a megengedett tartományon kívül esik`
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
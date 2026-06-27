import { memo } from 'react';
import { Question, AnswerValue } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StyledRadioGroup } from './StyledRadioGroup';
import { useLanguageContext } from "@/components/language-context";
import { AlertTriangle } from 'lucide-react';

interface TrueFalseGroupProps {
  questions: Question[];
  values: Record<string, AnswerValue>;
  onChange: (questionId: string, value: AnswerValue) => void;
  groupName: string;  // Display name (already localized from parent)
  language?: 'hu' | 'de' | 'en' | 'fr' | 'it';  // Optional language for direct group.title access
  onRequestAddError?: (questionTitle: string) => void;
}

export const TrueFalseGroup = memo(({ questions, values, onChange, groupName, language, onRequestAddError }: TrueFalseGroupProps) => {
  const { t, language: contextLanguage } = useLanguageContext();
  
  // Use NEW group.title structure if available, fallback to groupName prop
  const lang = language || contextLanguage;
  const displayName = (questions[0]?.group?.title as any)?.[lang] || groupName;

  if (questions.length === 0) return null;

  const hasThreeOptionQuestion = questions.some(q => q.type === 'checkbox' || q.type === 'yes_no_na');

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {displayName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* === ITT VAN A VÁLTOZTATÁS A FEJLÉCBEN === */}
        <div className="flex items-center px-3 pb-3 border-b-2 border-gray-200 mb-2">
          <span className="flex-1 text-sm font-semibold text-gray-700">{t("question") || 'Kérdés'}</span>
          
          <div 
            style={{ width: hasThreeOptionQuestion ? '280px' : '220px' }} 
            className="flex-shrink-0"
          >
            <div className={`grid ${hasThreeOptionQuestion ? 'grid-cols-3' : 'grid-cols-2'} gap-x-2 sm:gap-x-3 text-center`}>
              <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                <span className="font-bold">✓</span>
                {t("yes") || 'Igen'}
              </div>
              <div className="text-sm font-semibold text-red-600 flex items-center justify-center gap-1">
                <span className="font-bold">✗</span>
                {t("no") || 'Nem'}
              </div>
              {hasThreeOptionQuestion && (
                <div className="text-sm font-semibold text-gray-600 flex items-center justify-center">
                  {t("notApplicable") || 'N.A.'}
                </div>
              )}
            </div>
          </div>
          {/* Spacer a háromszög gomb oszlopához */}
          {onRequestAddError && <div className="w-9 flex-shrink-0 ml-1" />}
        </div>

        <div className="space-y-1">
          {questions.map((question) => {
            const isThreeOption = question.type === 'checkbox' || question.type === 'yes_no_na';
            const currentOptions = isThreeOption 
              ? [
                  { value: 'yes', label: t("yes") || 'Igen' },
                  { value: 'no', label: t("no") || 'Nem' },
                  { value: 'na', label: t("notApplicable") || 'N.A.' }
                ] 
              : [
                  { value: 'true', label: t("yes") || 'Igen' },
                  { value: 'false', label: t("no") || 'Nem' }
                ];

            const currentValue = values[question.id]?.toString() || '';
            const isNegative = currentValue === 'no' || currentValue === 'false';
            const questionTitle = (question.title as any)?.[lang] || (question.title as unknown as string) || '';
              
            return (
              <div key={question.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 min-h-[60px]">
                <span className="flex-1 text-gray-800 text-sm sm:text-base font-medium">
                  {questionTitle}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </span>

                <div 
                  style={{ width: isThreeOption ? '280px' : '220px' }} 
                  className="flex justify-center flex-shrink-0"
                >
                  <StyledRadioGroup
                    questionId={question.id}
                    value={currentValue}
                    onChange={(val) => onChange(question.id, val as AnswerValue)}
                    options={currentOptions}
                  />
                </div>

                {/* Hibalistára adás gomb — csak ha prop megvan ÉS error_reportable=true ÉS "Nem" van kiválasztva */}
                {onRequestAddError && (
                  <div className="w-9 flex-shrink-0 ml-1 flex justify-center">
                    {question.error_reportable && isNegative && (
                      <button
                        type="button"
                        onClick={() => onRequestAddError(questionTitle)}
                        title={t("addErrorTitle") || 'Hiba hozzáadása'}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors animate-pulse hover:animate-none"
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
});

TrueFalseGroup.displayName = 'TrueFalseGroup';
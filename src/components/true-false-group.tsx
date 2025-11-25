import { memo } from 'react';
import { Question, AnswerValue } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StyledRadioGroup } from './StyledRadioGroup';
import { useLanguageContext } from "@/components/language-context";

interface TrueFalseGroupProps {
  questions: Question[];
  values: Record<string, AnswerValue>;
  onChange: (questionId: string, value: AnswerValue) => void;
  groupName: string;  // Display name (already localized from parent)
  language?: 'hu' | 'de';  // Optional language for direct group.title access
}

export const TrueFalseGroup = memo(({ questions, values, onChange, groupName, language }: TrueFalseGroupProps) => {
  const { t, language: contextLanguage } = useLanguageContext();
  
  // Use NEW group.title structure if available, fallback to groupName prop
  const lang = language || contextLanguage;
  const displayName = questions[0]?.group?.title?.[lang] || groupName;

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
            {/* A fix szélességű részen belül egy rácsot hozunk létre a címkéknek */}
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
        </div>

        {/* === A KÉRDÉS SOROK RÉSZ VÁLTOZATLAN MARADT === */}
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
              
            return (
              <div key={question.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 min-h-[60px]">
                <span className="flex-1 text-gray-800 text-sm">
                  {/* NEW: Use localized title object if available */}
                  {question.title?.[lang] || question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </span>

                <div 
                  style={{ width: isThreeOption ? '280px' : '220px' }} 
                  className="flex justify-center flex-shrink-0"
                >
                  <StyledRadioGroup
                    questionId={question.id}
                    value={values[question.id]?.toString() || ''}
                    onChange={(val) => onChange(question.id, val as AnswerValue)}
                    options={currentOptions}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
});

TrueFalseGroup.displayName = 'TrueFalseGroup';
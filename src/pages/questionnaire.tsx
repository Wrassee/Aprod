import { useState, useEffect, useMemo, useCallback } from 'react';
import { create, all } from 'mathjs';
import { Question, AnswerValue, ProtocolError } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { SmartHelpWizard } from '@/components/smart-help-wizard';
import PageHeader from '@/components/PageHeader';
import { IsolatedQuestion } from '@/components/isolated-question';
import { TrueFalseGroup } from '@/components/true-false-group';
import { ErrorList } from '@/components/error-list';
import { QuestionGroupHeader } from '@/components/question-group-header';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Check, X } from 'lucide-react';
import { MeasurementBlock } from '@/components/measurement-block';
import { useConditionalQuestionFilter, updateAnswersWithDisabled } from '@/components/conditional-question-filter';

interface QuestionnaireProps {
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  answers: Record<string, AnswerValue>;
  onAnswerChange: (questionId: string, value: AnswerValue) => void;
  errors: ProtocolError[];
  onErrorsChange: (errors: ProtocolError[]) => void;
  onNext: () => void;
  onSave: () => void;
  language: 'hu' | 'de';
  onAdminAccess?: () => void;
  onHome?: () => void;
  onStartNew?: () => void;
  onPageChange?: (page: number) => void;
  onQuestionChange?: (questionId: string) => void;
  currentPage: number;
  currentQuestionId: string;
}

const math = create(all);

// Fallback questions if no template is loaded
const FALLBACK_QUESTIONS: Partial<Question>[] = [
  {
    id: 'q1',
    questionId: 'q1',
    title: 'Receiver name / Átvevő neve',
    type: 'text' as const,
    required: true,
  },
  {
    id: 'q2',
    questionId: 'q2',
    title: 'Elevator installation complete? / Lift telepítés kész?',
    type: 'checkbox' as const,
    required: true,
  },
] as Question[];

// === JAVÍTÁS 1: ELTÁVOLÍTOTTUK A memo() WRAPPERT ===
function Questionnaire({
  receptionDate,
  onReceptionDateChange,
  answers,
  onAnswerChange,
  errors,
  onErrorsChange,
  onNext,
  onSave,
  language,
  onAdminAccess,
  onHome,
  onStartNew,
  onPageChange,
  onQuestionChange,
  currentPage: pageFromApp,
  currentQuestionId,
}: QuestionnaireProps) {
  const { t } = useLanguageContext();

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Local answers for immediate UI response
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerValue>>(answers);
  
  // Sync with parent answers
  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  // Apply conditional filtering
  const { filteredQuestions, filteredCount } = useConditionalQuestionFilter(allQuestions, localAnswers);

  // Auto-set disabled questions to "n.a."
  useEffect(() => {
    if (allQuestions.length > 0 && filteredQuestions.length > 0) {
      const updatedAnswers = updateAnswersWithDisabled(localAnswers, allQuestions, filteredQuestions);
      
      const hasChanges = Object.keys(updatedAnswers).some(key => 
        updatedAnswers[key] !== localAnswers[key]
      );
      
      if (hasChanges) {
        console.log('🎯 Auto-setting disabled questions to "n.a."', {
          totalQuestions: allQuestions.length,
          visibleQuestions: filteredQuestions.length,
          disabledCount: allQuestions.length - filteredQuestions.length
        });
        
        setLocalAnswers(updatedAnswers);
        
        // Update parent
        Object.entries(updatedAnswers).forEach(([questionKey, value]) => {
          if (value !== localAnswers[questionKey]) {
            onAnswerChange(questionKey, value);
          }
        });
      }
    }
  }, [filteredQuestions, allQuestions, localAnswers, onAnswerChange]);

  // Load questions ONCE on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const response = await fetch(`/api/questions/${language}`);
        
        if (response.ok) {
          const questionsData = await response.json();
          console.log('✅ Questions loaded:', questionsData.length);
          setAllQuestions(questionsData);
        } else {
          console.warn('⚠️ No active template found, using empty question list');
          setAllQuestions([]);
        }
      } catch (error) {
        console.error('❌ Error loading questions:', error);
        setAllQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, [language]);

  // Group questions and paginate
  const { questionGroups, totalPages, currentQuestions, currentGroup } = useMemo(() => {
    const groups = filteredQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
      const groupName = question.groupName;
      
      if (!groupName) {
        return acc;
      }
      
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(question);
      return acc;
    }, {} as Record<string, Question[]>);

    // Sort questions by groupOrder
    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a: Question, b: Question) => (a.groupOrder || 0) - (b.groupOrder || 0));
    });

    // Convert to array
    const groupsArray = Object.entries(groups)
      .filter(([groupName, questions]) => questions.length > 0)
      .map(([groupName, questions]) => ({
        name: groupName,
        questions,
        questionCount: questions.length
      }));

    const total = groupsArray.length;
    const currentGroupData = groupsArray[pageFromApp] || { name: '', questions: [], questionCount: 0 };
    
    return { 
      questionGroups: groupsArray, 
      totalPages: total, 
      currentQuestions: currentGroupData.questions,
      currentGroup: currentGroupData
    };
  }, [filteredQuestions, pageFromApp, filteredCount]);

  // Calculate derived values for calculated questions
  useEffect(() => {
    const calculatedQuestions = allQuestions.filter(q => q.type === 'calculated');

    calculatedQuestions.forEach(q => {
      if (q.calculationFormula && q.calculationInputs) {
        try {
          const scope: Record<string, any> = {};
          
          Object.entries(localAnswers).forEach(([key, value]) => {
            if (typeof value === 'string' && !isNaN(Number(value))) {
              scope[key] = Number(value);
            } else {
              scope[key] = value;
            }
          });

          const result = math.evaluate(q.calculationFormula, scope);

          if (typeof result === 'number' && !isNaN(result)) {
            const roundedResult = Math.round(result * 100) / 100;
            if (localAnswers[q.id] !== roundedResult) {
              setLocalAnswers(prev => ({ ...prev, [q.id]: roundedResult }));
              onAnswerChange(q.id, roundedResult);
            }
          }
        } catch (error) {
          if (localAnswers[q.id] !== undefined) {
            setLocalAnswers(prev => {
              const newAnswers = { ...prev };
              delete newAnswers[q.id];
              return newAnswers;
            });
            onAnswerChange(q.id, undefined);
          }
        }
      }
    });
  }, [allQuestions, localAnswers, onAnswerChange]);

  // Error handlers
  const handleAddError = useCallback((error: Omit<ProtocolError, 'id'>) => {
    const newError: ProtocolError = {
      ...error,
      id: Date.now().toString(),
    };
    onErrorsChange([...errors, newError]);
  }, [onErrorsChange, errors]);

  const handleEditError = useCallback((id: string, updatedError: Omit<ProtocolError, 'id'>) => {
    onErrorsChange(
      errors.map((error: ProtocolError) =>
        error.id === id ? { ...updatedError, id } : error
      )
    );
  }, [onErrorsChange, errors]);

  const handleDeleteError = useCallback((id: string) => {
    onErrorsChange(errors.filter((error: ProtocolError) => error.id !== id));
  }, [onErrorsChange, errors]);

  // Local answer change handler
  const handleLocalAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    onAnswerChange(questionId, value);
    onQuestionChange?.(questionId);
  }, [onAnswerChange, onQuestionChange]);

  // Check if can proceed
  const canProceed = useMemo(() => {
    const requiredQuestionsOnPage = (currentQuestions as Question[]).filter(q => q.required);
    if (requiredQuestionsOnPage.length === 0) return true;

    return requiredQuestionsOnPage.every(q => {
      const answer = localAnswers[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }, [currentQuestions, localAnswers]);

  const isLastPage = pageFromApp === totalPages - 1;
  const progressPercent = totalPages > 0 ? Math.round(((pageFromApp + 1) / totalPages) * 100) : 0;

  // Save handler
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    try {
      onSave?.();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [onSave]);

  // Navigation handlers
  const handleNextPage = useCallback(() => {
    onPageChange?.(pageFromApp + 1);
  }, [pageFromApp, onPageChange]);

  const handlePreviousPage = useCallback(() => {
    onPageChange?.(Math.max(0, pageFromApp - 1));
  }, [pageFromApp, onPageChange]);

  return (
    <div className="min-h-screen bg-light-surface relative">
      {/* === JAVÍTÁS 2: ELTÁVOLÍTOTTUK A FIX TITLE PROPOT === */}
      <PageHeader
        onHome={onHome}
        onStartNew={onStartNew}
        onAdminAccess={onAdminAccess}
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        totalSteps={totalPages + 1}
        currentStep={pageFromApp}
        stepType="questionnaire"
        currentPage={pageFromApp + 1}
        currentQuestionId={currentQuestionId}
        errors={errors}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {questionGroups.length > 0 && currentGroup && (
          <QuestionGroupHeader
            groupName={currentGroup.name}
            questionCount={currentGroup.questionCount}
            totalGroups={totalPages}
            currentGroupIndex={pageFromApp}
            language={language}
          />
        )}

        <div className="mb-8">
          {pageFromApp === 0 || pageFromApp === 1 ? (
            <div className="grid grid-cols-2 gap-8">
              {(currentQuestions as Question[]).map((question: Question) => (
                <IsolatedQuestion
                  key={question.id}
                  question={question}
                  value={localAnswers[question.id] ?? ""}
                  onChange={(value) => handleLocalAnswerChange(question.id, value)}
                />
              ))}
            </div>
          ) : (() => {
            // FIXED: Smart rendering based on question type composition
            const radioQuestions = (currentQuestions as Question[]).filter(q => q.type === 'radio' || q.type === 'checkbox' || q.type === 'yes_no_na');
            const measurementQuestions = (currentQuestions as Question[]).filter(q => q.type === 'measurement' || q.type === 'calculated');
            const otherQuestions = (currentQuestions as Question[]).filter(q => 
              q.type !== 'radio' && 
              q.type !== 'checkbox' && 
              q.type !== 'yes_no_na' && 
              q.type !== 'measurement' && 
              q.type !== 'calculated'
            );

            const hasOnlyRadio = radioQuestions.length === currentQuestions.length;
            const hasOnlyMeasurement = measurementQuestions.length === currentQuestions.length;
            const isMixed = radioQuestions.length > 0 && otherQuestions.length > 0;

            // If ONLY radio/checkbox questions → use TrueFalseGroup
            if (hasOnlyRadio) {
              return (
                <TrueFalseGroup
                  questions={radioQuestions}
                  values={localAnswers}
                  onChange={handleLocalAnswerChange}
                  groupName={currentGroup?.name || 'Kérdések'}
                />
              );
            }

            // If ONLY measurement/calculated questions → use MeasurementBlock
            if (hasOnlyMeasurement) {
              return (
                <MeasurementBlock
                  questions={measurementQuestions}
                  values={localAnswers}
                  onChange={handleLocalAnswerChange}
                  onAddError={handleAddError}
                />
              );
            }

            // If MIXED types or other types → render each question individually
            return (
              <div className="space-y-6">
                {radioQuestions.length > 0 && (
                  <TrueFalseGroup
                    questions={radioQuestions}
                    values={localAnswers}
                    onChange={handleLocalAnswerChange}
                    groupName={currentGroup?.name || 'Kérdések'}
                  />
                )}
                {measurementQuestions.length > 0 && (
                  <MeasurementBlock
                    questions={measurementQuestions}
                    values={localAnswers}
                    onChange={handleLocalAnswerChange}
                    onAddError={handleAddError}
                  />
                )}
                {otherQuestions.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {otherQuestions.map((question: Question) => (
                      <IsolatedQuestion
                        key={question.id}
                        question={question}
                        value={localAnswers[question.id] ?? ""}
                        onChange={(value) => handleLocalAnswerChange(question.id, value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="mb-8">
          <ErrorList
            errors={errors}
            onAddError={handleAddError}
            onEditError={handleEditError}
            onDeleteError={handleDeleteError}
          />
        </div>

        <div className="flex justify-between items-center">
  {/* Bal oldali gomb (Vissza) */}
  <Button
  variant="outline"
  onClick={handlePreviousPage}
  disabled={pageFromApp === 0}
  className="flex items-center border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
>
  <ArrowLeft className="h-4 w-4 mr-2" />
  {t.previous}
</Button>

  {/* ===== EZ AZ ÚJ, BEILLESZTETT RÉSZ ===== */}
  {/* Középső gomb (AI) */}
  <SmartHelpWizard
    currentPage={pageFromApp + 1}
    formData={localAnswers}
    currentQuestionId={currentQuestionId}
    errors={errors}
  />
  {/* ======================================= */}

  {/* Jobb oldali gombok (Mentés, Tovább) */}
  <div className="flex space-x-4">
    <Button
  variant="outline"
  onClick={handleSave}
  disabled={saveStatus === 'saving'}
  className={`flex items-center space-x-2 ${
    saveStatus === 'saved' ? 'bg-green-100 border-green-300 text-green-700' :
    saveStatus === 'error' ? 'bg-red-100 border-red-300 text-red-700' :
    'border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white' // EZ AZ ÚJ ALAPÉRTELMEZETT STÍLUS
  }`}
>
              {saveStatus === 'saving' ? (
    <>
      <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      {t.saving}
    </>
  ) : saveStatus === 'saved' ? (
    <>
      <Check className="h-4 w-4 mr-2 text-green-600" />
      {t.saved}
    </>
  ) : saveStatus === 'error' ? (
    <>
      <X className="h-4 w-4 mr-2 text-red-600" />
      {t.error}
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      {t.save}
    </>
  )}
</Button>
            
            {isLastPage ? (
              <Button
    type="button"
    onClick={onNext}
    disabled={!canProceed}
    className={`flex items-center border border-otis-blue disabled:bg-gray-400 disabled:cursor-not-allowed ${
      canProceed 
        ? 'bg-otis-blue text-white hover:bg-white hover:text-otis-blue cursor-pointer' 
        : 'bg-gray-400 text-white cursor-not-allowed'
    }`}
  >
                {t.next}
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
) : (
  <Button
    type="button"
    onClick={handleNextPage}
    disabled={!canProceed}
    className={`flex items-center border border-otis-blue disabled:bg-gray-400 disabled:cursor-not-allowed ${
      canProceed 
        ? 'bg-otis-blue text-white hover:bg-white hover:text-otis-blue cursor-pointer' 
        : 'bg-gray-400 text-white cursor-not-allowed'
    }`}
  >
    {t.next} {canProceed ? '✓' : '✗'}
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Questionnaire;
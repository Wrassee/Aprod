import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { create, all } from 'mathjs';
import { Question, AnswerValue, ProtocolError, QuestionType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { IsolatedQuestion } from '@/components/isolated-question';
import { TrueFalseGroup } from '@/components/true-false-group';
import { ErrorList } from '@/components/error-list';
import { QuestionGroupHeader } from '@/components/question-group-header';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Settings, Home, Check, X, RotateCcw } from 'lucide-react';
import { CalculatedResult } from '@/components/calculated-result';
import { MeasurementBlock } from '@/components/measurement-block';
import { useConditionalQuestionFilter, updateAnswersWithDisabled } from '@/components/conditional-question-filter';
import { FormData } from '@/lib/types';

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

const Questionnaire = memo(function Questionnaire({
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
  const { t, language: contextLanguage } = useLanguageContext();
  
  // Debug: Show current language and translations
  console.log('🌍 Questionnaire Language Debug:', {
    contextLanguage,
    propLanguage: language,
    titleTranslation: t.title,
    progressTranslation: t.progress
  });
  
  // Debug: Check if this is a real mount or just re-render
  const mountCountRef = useRef(0);
  mountCountRef.current += 1;
  console.log('🔄 Questionnaire component rendered/mounted - RENDER COUNT:', mountCountRef.current);
  
  console.log('📄 Current page from parent (pageFromApp):', pageFromApp);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [measurementErrors, setMeasurementErrors] = useState<ProtocolError[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // KRITIKUS: Belső state az answers-nek, hogy az input mezők azonnal reagáljanak
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerValue>>(answers);
  
  // Szinkronizáljuk a parent answers-szel
  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  // Apply conditional filtering to questions - használjuk a localAnswers-t
  const { filteredQuestions, activeConditions, totalQuestions, filteredCount } = 
    useConditionalQuestionFilter(allQuestions, localAnswers);

  // Automatically set disabled questions to "n.a."
  useEffect(() => {
    if (allQuestions.length > 0 && filteredQuestions.length > 0) {
      const updatedAnswers = updateAnswersWithDisabled(localAnswers, allQuestions, filteredQuestions);
      
      // Only update if there are actual changes
      const hasChanges = Object.keys(updatedAnswers).some(key => 
        updatedAnswers[key] !== localAnswers[key]
      );
      
      if (hasChanges) {
        console.log('🎯 Auto-setting disabled questions to "n.a."', {
          totalQuestions: allQuestions.length,
          visibleQuestions: filteredQuestions.length,
          disabledCount: allQuestions.length - filteredQuestions.length
        });
        
        // Frissítjük a localAnswers-t
        setLocalAnswers(updatedAnswers);
        
        // Update answers through the parent component using question_id as key
        Object.entries(updatedAnswers).forEach(([questionKey, value]) => {
          if (value !== localAnswers[questionKey]) {
            onAnswerChange(questionKey, value);
          }
        });
      }
    }
  }, [filteredQuestions, allQuestions, localAnswers, onAnswerChange]);

  // Load questions ONCE on mount only
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const response = await fetch(`/api/questions/${language}`);
        
        if (response.ok) {
          const questionsData = await response.json();
          console.log('Questions loaded for language:', language, 'count:', questionsData.length);
          setAllQuestions(questionsData);
        } else {
          console.warn('No active template found, using fallback questions');
          // Fallback static questions only if no template exists
          const fallbackQuestions: Question[] = [
            {
              id: 'q1',
              questionId: 'q1',
              title: language === 'hu' ? 'Átvevő neve' : 'Name des Empfängers',
              type: 'text' as const,
              required: true,
            },
            {
              id: 'q2',
              questionId: 'q2',
              title: language === 'hu' ? 'Lift telepítés kész?' : 'Aufzuginstallation abgeschlossen?',
              type: 'checkbox' as const,
              required: true,
            },
            {
              id: 'q3',
              questionId: 'q3',
              title: language === 'hu' ? 'Biztonsági rendszerek működnek?' : 'Sicherheitssysteme funktionsfähig?',
              type: 'radio' as const,
              required: true,
            },
            {
              id: 'q4',
              questionId: 'q4',
              title: language === 'hu' ? 'Teherbírás (kg)' : 'Tragfähigkeit (kg)',
              type: 'number' as const,
              required: true,
              placeholder: 'Enter load capacity',
            },
            {
              id: 'q5',
              questionId: 'q5',
              title: language === 'hu' ? 'További megjegyzések' : 'Zusätzliche Kommentare',
              type: 'text' as const,
              required: false,
              placeholder: 'Enter any additional comments or observations',
            },
          ];
          setAllQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setAllQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    // Load questions only on mount
    loadQuestions();
  }, [language]);

  // Group questions by groupName and organize by groups
  // *** JAVÍTVA: pageFromApp használata mindenütt ***
  const { questionGroups, totalPages, currentQuestions, progress, currentGroup } = useMemo(() => {
    // Group questions by groupName - use filteredQuestions for dynamic filtering
    const groups = filteredQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
      const groupName = question.groupName;
      
      // Skip questions without groupName (don't create empty groups)
      if (!groupName) {
        return acc;
      }
      
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(question);
      return acc;
    }, {} as Record<string, Question[]>);

    // Sort questions within each group by groupOrder
    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a: Question, b: Question) => (a.groupOrder || 0) - (b.groupOrder || 0));
    });

    // Convert to array format for pagination, filter out empty groups
    const groupsArray = Object.entries(groups)
      .filter(([name, questions]) => questions.length > 0)
      .map(([name, questions]) => ({
        name,
        questions,
        questionCount: questions.length
      }));

    // Calculate pagination based on groups (1 group per page)
    const total = groupsArray.length;
    const currentGroupData = groupsArray[pageFromApp] || { name: '', questions: [], questionCount: 0 };
    const prog = total > 0 ? ((pageFromApp + 1) / total) * 100 : 0;
    
    console.log(`DEBUG: Found ${groupsArray.length} groups, total pages: ${total}, current page: ${pageFromApp + 1}/${total}`);
    
    return { 
      questionGroups: groupsArray, 
      totalPages: total, 
      currentQuestions: currentGroupData.questions, 
      progress: prog,
      currentGroup: currentGroupData
    };
  }, [filteredQuestions, pageFromApp, filteredCount]);

  // Calculate derived values for calculated questions
  useEffect(() => {
    // Find all calculated questions
    const calculatedQuestions = allQuestions.filter(q => q.type === 'calculated');

    // Perform calculations
    calculatedQuestions.forEach(q => {
      if (q.calculationFormula && q.calculationInputs) {
        try {
          // Create a scope object with all current answer values
          const scope: Record<string, any> = {};
          
          // Add all answers to scope - használjuk a localAnswers-t
          Object.entries(localAnswers).forEach(([key, value]) => {
            // Convert numeric strings to numbers for calculation
            if (typeof value === 'string' && !isNaN(Number(value))) {
              scope[key] = Number(value);
            } else {
              scope[key] = value;
            }
          });

          // Evaluate the formula with current values
          const result = math.evaluate(q.calculationFormula, scope);

          if (typeof result === 'number' && !isNaN(result)) {
            const roundedResult = Math.round(result * 100) / 100;
            // Update if value changed
            if (localAnswers[q.id] !== roundedResult) {
              setLocalAnswers(prev => ({ ...prev, [q.id]: roundedResult }));
              onAnswerChange(q.id, roundedResult);
            }
          }
        } catch (error) {
          // Clear the value if calculation fails
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
    const currentErrors = Array.isArray(errors) ? errors : [];
    onErrorsChange([...currentErrors, newError]);
  }, [onErrorsChange, errors]);

  const handleEditError = useCallback((id: string, updatedError: Omit<ProtocolError, 'id'>) => {
    const currentErrors = Array.isArray(errors) ? errors : [];
    onErrorsChange(
      currentErrors.map((error: ProtocolError) =>
        error.id === id ? { ...updatedError, id } : error
      )
    );
  }, [onErrorsChange, errors]);

  const handleDeleteError = useCallback((id: string) => {
    const currentErrors = Array.isArray(errors) ? errors : [];
    onErrorsChange(currentErrors.filter((error: ProtocolError) => error.id !== id));
  }, [onErrorsChange, errors]);

  // KRITIKUS: handleLocalAnswerChange - helyi state frissítése + parent értesítése
  const handleLocalAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    // Azonnal frissítjük a helyi állapotot a gyors UI válaszért
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Értesítjük a parent-et is
    onAnswerChange(questionId, value);
    onQuestionChange?.(questionId);
  }, [onAnswerChange, onQuestionChange]);

  // Check if can proceed to next page - használjuk a localAnswers-t
  const checkCanProceed = useCallback(() => {
    const requiredQuestionsOnPage = (currentQuestions as Question[]).filter(q => q.required);
    if (requiredQuestionsOnPage.length === 0) return true;

    return requiredQuestionsOnPage.every(q => {
      const answer = localAnswers[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }, [currentQuestions, localAnswers]);

  const canProceedState = useMemo(() => {
    return checkCanProceed();
  }, [checkCanProceed]);

  // *** JAVÍTVA: pageFromApp használata ***
  const isLastPage = pageFromApp === totalPages - 1;
  const progressPercent = totalPages > 0 ? Math.round(((pageFromApp + 1) / totalPages) * 100) : 0;

  // Simple save handler - just save the formData from props
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    try {
      // Simply call parent's onSave - parent handles the actual saving
      onSave?.();
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [onSave]);

  // *** JAVÍTVA: pageFromApp használata a lapozásban ***
  const handleNextPage = useCallback(() => {
    const nextPage = pageFromApp + 1;
    console.log('Moving to next page:', nextPage);
    onPageChange?.(nextPage);
  }, [pageFromApp, onPageChange]);

  const handlePreviousPage = useCallback(() => {
    const prevPage = Math.max(0, pageFromApp - 1);
    console.log('Moving to previous page:', prevPage);
    onPageChange?.(prevPage);
  }, [pageFromApp, onPageChange]);

  return (
    <div className="min-h-screen bg-light-surface">
      <PageHeader
        onHome={onHome}
        onStartNew={onStartNew}
        onAdminAccess={onAdminAccess}
        title="OTIS APROD - Átvételi Protokoll"
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        language={language}
        totalSteps={totalPages + 1}
        currentStep={pageFromApp}
        stepType="questionnaire"
        currentPage={pageFromApp + 1}
        currentQuestionId={currentQuestionId}
        errors={errors}
      />

      {/* Main Content */}
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
          {/* *** JAVÍTVA: pageFromApp használata a feltételekben *** */}
          {pageFromApp === 0 || pageFromApp === 1 ? (
            <div className="grid grid-cols-2 gap-8">
              {(currentQuestions as Question[]).map((question: Question) => {
                return (
                  <IsolatedQuestion
                    key={question.id}
                    question={question}
                    value={localAnswers[question.id] ?? ""}
                    onChange={(value) => handleLocalAnswerChange(question.id, value)}
                  />
                );
              })}
            </div>
          ) : (
            (currentQuestions as Question[]).some(q => q.type === 'radio' || q.type === 'checkbox') ? (
    <TrueFalseGroup
      questions={currentQuestions as Question[]}
      values={localAnswers}
      onChange={handleLocalAnswerChange}
      groupName={currentGroup?.name || 'Kérdések'}
    />
            ) : (
              (currentQuestions as Question[]).some((q: Question) => q.type === 'measurement' || q.type === 'calculated') ? (
                <MeasurementBlock
                  questions={(currentQuestions as Question[]).filter((q: Question) => q.type === 'measurement' || q.type === 'calculated')}
                  values={localAnswers}
                  onChange={handleLocalAnswerChange}
                  onAddError={handleAddError}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {(currentQuestions as Question[]).map((question: Question) => {
                    return (
                      <IsolatedQuestion
                        key={question.id}
                        question={question}
                        value={localAnswers[question.id] ?? ""}
                        onChange={(value) => handleLocalAnswerChange(question.id, value)}
                      />
                    );
                  })}
                </div>
              )
            )
          )}
        </div>

        {/* Error List Section */}
        <div className="mb-8">
          <ErrorList
            errors={errors}
            onAddError={handleAddError}
            onEditError={handleEditError}
            onDeleteError={handleDeleteError}
          />
        </div>

        {/* Navigation - *** JAVÍTVA: pageFromApp használata *** */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={pageFromApp === 0}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.previous}
          </Button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input h-10 px-4 py-2 ${
                saveStatus === 'saved' ? 'bg-green-100 border-green-300 text-green-700' :
                saveStatus === 'error' ? 'bg-red-100 border-red-300 text-red-700' :
                'bg-background hover:bg-accent hover:text-accent-foreground'
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
            </button>
            
            {isLastPage ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={!canProceedState}
                className={`flex items-center text-white ${
                  canProceedState 
                    ? 'bg-otis-blue hover:bg-blue-700 cursor-pointer' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {t.next}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextPage}
                disabled={!canProceedState}
                className={`flex items-center text-white ${
                  canProceedState 
                    ? 'bg-otis-blue hover:bg-blue-700 cursor-pointer' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {t.next} {canProceedState ? '✓' : '✗'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
});

export default Questionnaire;
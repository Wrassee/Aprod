import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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
import { getAllCachedValues } from '@/components/cache-radio';
import { getAllTrueFalseValues } from '@/components/true-false-radio';
import { getAllStableInputValues } from '@/components/stable-input';
import { getAllMeasurementValues } from '@/components/measurement-question';
import { CalculatedResult } from '@/components/calculated-result';
import { MeasurementBlock, getAllCalculatedValues } from '@/components/measurement-block';

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
}

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
  
  // Use a stable ref for currentPage to prevent re-mounting
  const currentPageRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('questionnaire-current-page');
    const initialPage = saved ? parseInt(saved, 10) : 0;
    currentPageRef.current = initialPage;
    return initialPage;
  });
  
  console.log('📄 Current page:', currentPage);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);
  const [measurementValues, setMeasurementValues] = useState<Record<string, number>>({});
  const [calculatedResults, setCalculatedResults] = useState<Record<string, any>>({});
  const [measurementErrors, setMeasurementErrors] = useState<ProtocolError[]>([]);

  // Save current page to localStorage and notify parent component
  useEffect(() => {
    currentPageRef.current = currentPage;
    localStorage.setItem('questionnaire-current-page', currentPage.toString());
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Load questions ONCE on mount only - no dependency array to prevent re-runs
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
              type: 'checkbox' as const, // JAVÍTVA
              required: true,
            },
            {
              id: 'q3',
              questionId: 'q3',
              title: language === 'hu' ? 'Biztonsági rendszerek működnek?' : 'Sicherheitssysteme funktionsfähig?',
              type: 'radio' as const, // JAVÍTVA
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
  }, [language]); // Depend on language

  // Group questions by groupName and organize by groups
  const { questionGroups, totalPages, currentQuestions, progress, currentGroup } = useMemo(() => {
    // Group questions by groupName
    const groups = allQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
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
    const currentGroupData = groupsArray[currentPage] || { name: '', questions: [], questionCount: 0 };
    const prog = total > 0 ? ((currentPage + 1) / total) * 100 : 0;
    
    console.log(`DEBUG: Found ${groupsArray.length} groups, total pages: ${total}, current page: ${currentPage + 1}/${total}`);
    
    return { 
      questionGroups: groupsArray, 
      totalPages: total, 
      currentQuestions: currentGroupData.questions, 
      progress: prog,
      currentGroup: currentGroupData
    };
  }, [allQuestions, currentPage]);

  // Listen for cache changes to trigger re-calculation
  useEffect(() => {
    const handleCacheChange = () => {
      console.log('Cache change detected, checking can proceed...');
      setCacheUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('radio-change', handleCacheChange);
    window.addEventListener('button-check', handleCacheChange); // Button validation only
    window.addEventListener('measurement-change', handleCacheChange);

    return () => {
      window.removeEventListener('radio-change', handleCacheChange);
      window.removeEventListener('button-check', handleCacheChange);
      window.removeEventListener('measurement-change', handleCacheChange);
    };
  }, []);

  // Ultra-stable error handlers with proper typing
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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const checkCanProceed = () => {
    const requiredQuestions = (currentQuestions as Question[]).filter((q: Question) => q.required);
    
    if (requiredQuestions.length === 0) return true;
    
    const cachedRadioValues = getAllCachedValues();
    const cachedTrueFalseValues = getAllTrueFalseValues();
    const cachedInputValues = getAllStableInputValues();
    const cachedMeasurementValues = getAllMeasurementValues();
    
    const savedFormData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{"answers":{}}');
    
    const calculatedValues = getAllCalculatedValues();
    
    const calculatedQuestions = (currentQuestions as Question[]).filter((q: Question) => q.type === 'calculated');
    calculatedQuestions.forEach(question => {
      if (question.calculationFormula && question.calculationInputs) {
        const inputIds = question.calculationInputs.split(',').map(id => id.trim());
        let formula = question.calculationFormula;
        let hasAllInputs = true;
        
        const allInputValues = { ...cachedMeasurementValues, ...cachedInputValues };
        
        inputIds.forEach(inputId => {
          const value = allInputValues[inputId];
          if (value === undefined || value === null || isNaN(parseFloat(value.toString()))) {
            hasAllInputs = false;
            return;
          }
          formula = formula.replace(new RegExp(`\\b${inputId}\\b`, 'g'), value.toString());
        });
        
        if (hasAllInputs) {
          try {
            const result = Function(`"use strict"; return (${formula})`)();
            if (!isNaN(result)) {
              calculatedValues[question.id] = Math.round(result * 100) / 100;
            }
          } catch (error) {
            console.error(`Calculation error for ${question.id}:`, error);
          }
        }
      }
    });

    const combinedAnswers = {
      ...answers,
      ...savedFormData.answers,
      ...cachedRadioValues,
      ...cachedTrueFalseValues,
      ...cachedInputValues,
      ...cachedMeasurementValues,
      ...calculatedValues,
    };
    
    const result = requiredQuestions.every((q: Question) => {
      const answer = combinedAnswers[q.id];
      const hasAnswer = answer !== undefined && answer !== null && answer !== '';
      return hasAnswer;
    });
    
    return result;
  };
  
  const canProceedState = useMemo(() => {
    return checkCanProceed();
  }, [currentQuestions, answers, cacheUpdateTrigger]);

  const isLastPage = currentPage === totalPages - 1;
  const progressPercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

  return (
    <div className="min-h-screen bg-light-surface" onSubmit={(e) => e.preventDefault()}>
      <PageHeader
  progressPercent={progressPercent}       // Javított: most a számított progressPercent-et adja
  onHome={onHome}                         // Javított: a prop-ot adja át
  onStartNew={onStartNew}                 // Javított: a prop-ot adja át
  onAdminAccess={onAdminAccess}           // Javított: a prop-ot adja át
  title="OTIS APROD - Átvételi Protokoll"
  receptionDate={receptionDate}           // Javított: prop-ot adja át
  onReceptionDateChange={onReceptionDateChange} // Javított: prop-ot adja át
  language={language}
/>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8" onSubmit={(e) => e.preventDefault()}>
        {questionGroups.length > 0 && currentGroup && (
          <QuestionGroupHeader
            groupName={currentGroup.name}
            questionCount={currentGroup.questionCount}
            totalGroups={totalPages}
            currentGroupIndex={currentPage}
            language={language}
          />
        )}

        <div className="mb-8">
          {currentPage === 0 || currentPage === 1 ? (
            <div className="grid grid-cols-2 gap-8">
              {(currentQuestions as Question[]).map((question: Question) => {
                return (
                  <IsolatedQuestion
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) => {
                      onAnswerChange(question.id, value);
                      onQuestionChange?.(question.id);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            // ======================= KÖZPONTI JAVÍTÁS ITT =======================
            // A 'true_false' típust 'radio'-ra cseréljük, ahogy a backend küldi.
            (currentQuestions as Question[]).length > 0 && 
            (currentGroup?.name === 'Modernizációban érintett') ? (
              <TrueFalseGroup
                questions={currentQuestions as Question[]}
                values={answers}
                onChange={onAnswerChange}
                groupName={currentGroup?.name || 'Kérdések'}
              />
            ) : (
              (currentQuestions as Question[]).some((q: Question) => q.type === 'measurement' || q.type === 'calculated') ? (
                <MeasurementBlock
                  questions={(currentQuestions as Question[]).filter((q: Question) => q.type === 'measurement' || q.type === 'calculated')}
                  values={answers}
                  onChange={(questionId, value) => {
                    onAnswerChange(questionId, value);
                    if (typeof value === 'number') {
                      setMeasurementValues(prev => ({ ...prev, [questionId]: value }));
                    }
                  }}
                  onAddError={handleAddError}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {(currentQuestions as Question[]).map((question: Question) => {
                    return (
                      <IsolatedQuestion
                        key={question.id}
                        question={question}
                        value={answers[question.id]}
                        onChange={(value) => {
                          onAnswerChange(question.id, value);
                          onQuestionChange?.(question.id);
                        }}
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

        {/* Navigation */}
        <div className="flex justify-between items-center" onSubmit={(e) => e.preventDefault()}>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.previous}
          </Button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Save button clicked on page:', currentPage);
                setSaveStatus('saving');
                try {
                  const cachedRadioValues = getAllCachedValues();
                  const cachedTrueFalseValues = getAllTrueFalseValues();
                  const cachedInputValues = getAllStableInputValues();
                  const cachedMeasurementValues = getAllMeasurementValues();
                  const cachedCalculatedValues = getAllCalculatedValues();
                  
                  console.log('Save: Syncing cached values on page', currentPage);
                  
                  const currentFormData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{"answers":{}}');
                  const updatedFormData = {
                    ...currentFormData,
                    answers: {
                      ...currentFormData.answers,
                      ...cachedRadioValues,
                      ...cachedTrueFalseValues,
                      ...cachedInputValues,
                      ...cachedMeasurementValues,
                      ...cachedCalculatedValues,
                    }
                  };
                  
                  localStorage.setItem('otis-protocol-form-data', JSON.stringify(updatedFormData));
                  console.log('Save: Data saved directly to localStorage - NO React state updates');
                  setSaveStatus('saved');
                  setLastSaved(new Date());
                  
                  setTimeout(() => setSaveStatus('idle'), 3000);
                  
                } catch (error) {
                  console.error('Save: Failed with error:', error);
                  setSaveStatus('error');
                  setTimeout(() => setSaveStatus('idle'), 3000);
                }
              }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Sync all cached values before completing
                  const cachedRadioValues = getAllCachedValues();
                  const cachedTrueFalseValues = getAllTrueFalseValues();
                  const cachedInputValues = getAllStableInputValues();
                  const cachedMeasurementValues = getAllMeasurementValues();
                  const cachedCalculatedValues = getAllCalculatedValues();
                  
                  console.log('Complete button: Syncing cached values...');
                  
                  Object.entries(cachedRadioValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedTrueFalseValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedInputValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedCalculatedValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as number);
                  });
                  
                  // Small delay to ensure state updates before proceeding
                  setTimeout(() => {
                    onNext();
                  }, 100);
                }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Next button clicked, canProceedState:', canProceedState);
                  
                  // Sync cached values before moving to next page
                  const cachedRadioValues = getAllCachedValues();
                  const cachedTrueFalseValues = getAllTrueFalseValues();
                  const cachedInputValues = getAllStableInputValues();
                  
                  Object.entries(cachedRadioValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedTrueFalseValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedInputValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  
                  const nextPage = currentPage + 1;
                  console.log('Setting next page from', currentPage, 'to', nextPage);
                  setCurrentPage(nextPage);
                  localStorage.setItem('questionnaire-current-page', nextPage.toString());
                }}
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
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Question, AnswerValue, ProtocolError } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { IsolatedQuestion } from '@/components/isolated-question';
import { TrueFalseGroup } from '@/components/true-false-group';
import { ErrorList } from '@/components/error-list';
import { QuestionGroupHeader } from '@/components/question-group-header';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Settings, Home, Check, X } from 'lucide-react';
import { getAllCachedValues } from '@/components/cache-radio';
import { getAllTrueFalseValues } from '@/components/true-false-radio';
import { getAllStableInputValues, StableInput } from '@/components/stable-input';
import { getAllMeasurementValues, MeasurementQuestion } from '@/components/measurement-question';
import { CalculatedResult } from '@/components/calculated-result';
import { CacheRadio } from '@/components/cache-radio';
import { TrueFalseRadio } from '@/components/true-false-radio';

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
  
  console.log('📁 Current page:', currentPage);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);
  const [measurementValues, setMeasurementValues] = useState<Record<string, number>>({});
  const [calculatedResults, setCalculatedResults] = useState<Record<string, any>>({});
  const [measurementErrors, setMeasurementErrors] = useState<ProtocolError[]>([]);

  // Save current page to localStorage - immediate with ref update
  useEffect(() => {
    currentPageRef.current = currentPage;
    localStorage.setItem('questionnaire-current-page', currentPage.toString());
  }, [currentPage]);

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
          const fallbackQuestions = [
            {
              id: 'q1',
              title: language === 'hu' ? 'Átvevő neve' : 'Name des Empfängers',
              type: 'text' as const,
              required: true,
            },
            {
              id: 'q2',
              title: language === 'hu' ? 'Lift telepítés kész?' : 'Aufzuginstallation abgeschlossen?',
              type: 'yes_no_na' as const,
              required: true,
            },
            {
              id: 'q3',
              title: language === 'hu' ? 'Biztonsági rendszerek működnek?' : 'Sicherheitssysteme funktionsfähig?',
              type: 'yes_no_na' as const,
              required: true,
            },
            {
              id: 'q4',
              title: language === 'hu' ? 'Teherbírás (kg)' : 'Tragfähigkeit (kg)',
              type: 'number' as const,
              required: true,
              placeholder: 'Enter load capacity',
            },
            {
              id: 'q5',
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
  }, []); // Load questions only once on mount

  // Group questions by groupName and organize by groups
  const { questionGroups, totalPages, currentQuestions, progress, currentGroup } = useMemo(() => {
    // Group questions by groupName
    const groups = allQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
      const groupName = question.groupName || 'Egyéb';
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

    // Convert to array format for pagination
    const groupsArray = Object.entries(groups).map(([name, questions]) => ({
      name,
      questions,
      questionCount: questions.length
    }));

    // Calculate pagination based on groups (1 group per page)
    const total = groupsArray.length;
    const currentGroupData = groupsArray[currentPage] || { name: 'Egyéb', questions: [], questionCount: 0 };
    const prog = total > 0 ? ((currentPage + 1) / total) * 100 : 0;
    
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
    window.addEventListener('input-change', handleCacheChange);
    window.addEventListener('measurement-change', handleCacheChange);

    return () => {
      window.removeEventListener('radio-change', handleCacheChange);
      window.removeEventListener('input-change', handleCacheChange);
      window.removeEventListener('measurement-change', handleCacheChange);
    };
  }, []);

  // Ultra-stable error handlers with proper typing
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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const checkCanProceed = () => {
    const requiredQuestions = (currentQuestions as Question[]).filter((q: Question) => q.required);
    
    if (requiredQuestions.length === 0) return true;
    
    // Check both answers prop and cached values
    const cachedRadioValues = getAllCachedValues();
    const cachedTrueFalseValues = getAllTrueFalseValues();
    const cachedInputValues = getAllStableInputValues();
    const cachedMeasurementValues = getAllMeasurementValues();
    
    // ALSO check localStorage for any saved data
    const savedFormData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{"answers":{}}');
    
    // Include calculated values from CalculatedResult components
    const calculatedValues: Record<string, number> = {};
    
    // Calculate values for calculated questions based on current measurements
    const calculatedQuestions = (currentQuestions as Question[]).filter((q: Question) => q.type === 'calculated');
    calculatedQuestions.forEach(question => {
      if (question.calculationFormula && question.calculationInputs) {
        const inputIds = question.calculationInputs.split(',').map((id: string) => id.trim());
        let formula = question.calculationFormula;
        let hasAllInputs = true;
        
        const allInputValues = { ...cachedMeasurementValues, ...cachedInputValues };
        
        inputIds.forEach((inputId: string) => {
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
    
    console.log('checkCanProceed: Combined answers:', combinedAnswers);
    console.log('checkCanProceed: Cached input values:', cachedInputValues);
    console.log('checkCanProceed: Cached measurement values:', cachedMeasurementValues);
    console.log('checkCanProceed: Calculated values:', calculatedValues);
    console.log('checkCanProceed: localStorage answers:', savedFormData.answers);
    
    const result = requiredQuestions.every((q: Question) => {
      const answer = combinedAnswers[q.id];
      const hasAnswer = answer !== undefined && answer !== null && answer !== '';
      console.log(`Question ${q.id} (${q.title}): ${hasAnswer ? 'OK' : 'MISSING'} (value: "${answer}")`);
      return hasAnswer;
    });
    
    console.log('Can proceed check result:', result, 'Required questions:', requiredQuestions.length, 'Current page:', currentPage);
    return result;
  };
  
  // Calculate canProceed directly without useEffect
  const canProceedState = useMemo(() => {
    return checkCanProceed();
  }, [currentQuestions, answers, cacheUpdateTrigger]);

  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="min-h-screen bg-light-surface" onSubmit={(e) => e.preventDefault()}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo, Home and Title */}
            <div className="flex items-center">
              <img 
                src="/otis-elevators-seeklogo_1753525178175.png" 
                alt="OTIS Logo" 
                className="h-12 w-12 mr-4"
              />
              {onHome && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onHome}
                  className="text-gray-600 hover:text-gray-800 mr-4"
                  title={language === 'de' ? 'Startseite' : 'Kezdőlap'}
                >
                  <Home className="h-4 w-4" />
                </Button>
              )}
              <span className="text-lg font-medium text-gray-800">{t.title}</span>
            </div>
            
            {/* Date Picker and Admin */}
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-gray-600">{t.receptionDate}</Label>
              <Input
                type="date"
                value={receptionDate}
                onChange={(e) => {
                  e.preventDefault();
                  onReceptionDateChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="w-auto"
              />
              {onAdminAccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAdminAccess}
                  className="text-gray-600 hover:text-gray-800"
                  title={t.admin}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">{t.progress}</span>
                {lastSaved && saveStatus === 'idle' && (
                  <span className="text-xs text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full">
                    <Check className="h-3 w-3 mr-1" />
                    {t.autoSaved}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-otis-blue">
                {currentPage + 1} / {totalPages}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8" onSubmit={(e) => e.preventDefault()}>
        {/* Group Header */}
        {questionGroups.length > 0 && currentGroup && (
          <QuestionGroupHeader
            groupName={currentGroup.name}
            questionCount={currentGroup.questionCount}
            totalGroups={questionGroups.length}
            currentGroupIndex={currentPage}
            language={language}
          />
        )}

        {/* Question Content */}
        <div className="mb-8">
          {/* Check if current group has only true_false questions */}
          {(currentQuestions as Question[]).length > 0 && (currentQuestions as Question[]).every((q: Question) => q.type === 'true_false') ? (
            <TrueFalseGroup
              questions={currentQuestions as Question[]}
              values={answers}
              onChange={onAnswerChange}
              groupName={currentGroup?.name || 'Kérdések'}
            />
          ) : (currentQuestions as Question[]).length > 0 && (currentQuestions as Question[]).some((q: Question) => q.type === 'measurement' || q.type === 'calculated') ? (
            /* Table-like Layout for Measurement/Calculated: Questions on left, Answers on right */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side - Questions list */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    Mérési Kérdések
                  </h3>
                  {(currentQuestions as Question[]).map((question: Question, index: number) => (
                    <div key={`q-${question.id}`} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {question.title}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        {question.placeholder && (
                          <p className="text-xs text-gray-600">{question.placeholder}</p>
                        )}
                        {question.unit && (
                          <p className="text-xs text-gray-500">
                            Egység: {question.unit}
                          </p>
                        )}
                        {(question.minValue !== undefined || question.maxValue !== undefined) && (
                          <p className="text-xs text-gray-500">
                            Tartomány: 
                            {question.minValue !== undefined ? ` ${question.minValue}` : ' -∞'} - 
                            {question.maxValue !== undefined ? `${question.maxValue}` : '+∞'} 
                            {question.unit || ''}
                          </p>
                        )}
                        {question.type === 'calculated' && question.calculationFormula && (
                          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Számított érték: {question.calculationFormula}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right side - Answer inputs (only measurement/calculated) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    Válaszok
                  </h3>
                  {(currentQuestions as Question[]).map((question: Question, index: number) => {
                    const combinedAnswers = { 
                      ...answers, 
                      ...getAllStableInputValues(),
                      ...getAllMeasurementValues(),
                      ...measurementValues
                    };
                    
                    return (
                      <div key={`a-${question.id}`} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0 min-h-[60px]">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          {question.type === 'text' && (
                            <StableInput
                              questionId={question.id}
                              type="text"
                              initialValue={combinedAnswers[question.id]?.toString() || ''}
                              onValueChange={(value) => onAnswerChange(question.id, value)}
                              placeholder={question.placeholder || ''}
                              className="w-full"
                            />
                          )}

                          {question.type === 'number' && (
                            <StableInput
                              questionId={question.id}
                              type="number"
                              initialValue={combinedAnswers[question.id]?.toString() || ''}
                              onValueChange={(value) => onAnswerChange(question.id, parseFloat(value) || 0)}
                              placeholder={question.placeholder || '0'}
                              className="w-full"
                            />
                          )}

                          {question.type === 'email' && (
                            <StableInput
                              questionId={question.id}
                              type="email"
                              initialValue={combinedAnswers[question.id]?.toString() || ''}
                              onValueChange={(value) => onAnswerChange(question.id, value)}
                              placeholder={question.placeholder || ''}
                              className="w-full"
                            />
                          )}

                          {question.type === 'yes_no_na' && (
                            <CacheRadio
                              questionId={question.id}
                              initialValue={combinedAnswers[question.id]?.toString() || ''}
                              options={[
                                { value: 'yes', label: t.yes },
                                { value: 'no', label: t.no },
                                { value: 'na', label: t.notApplicable }
                              ]}
                            />
                          )}

                          {question.type === 'true_false' && (
                            <TrueFalseRadio
                              questionId={question.id}
                              questionTitle={question.title}
                              value={combinedAnswers[question.id]?.toString() || ''}
                              onChange={(value) => onAnswerChange(question.id, value)}
                            />
                          )}

                          {question.type === 'measurement' && (
                            <MeasurementQuestion
                              question={question}
                              value={typeof combinedAnswers[question.id] === 'number' ? combinedAnswers[question.id] as number : undefined}
                              onChange={(value) => {
                                onAnswerChange(question.id, value);
                                setMeasurementValues(prev => ({ ...prev, [question.id]: value }));
                              }}
                            />
                          )}

                          {question.type === 'calculated' && (
                            <CalculatedResult
                              question={question}
                              inputValues={Object.fromEntries(
                                Object.entries(combinedAnswers).filter(([_, value]) => typeof value === 'number')
                              ) as Record<string, number>}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Layout for other question types */
            <div className="space-y-6">
              {(currentQuestions as Question[]).map((question: Question) => (
                <IsolatedQuestion
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => onAnswerChange(question.id, value)}
                />
              ))}
            </div>
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
                // e.stopImmediatePropagation(); // Not available on button click events
                
                console.log('Save button clicked on page:', currentPage);
                setSaveStatus('saving');
                try {
                  // Sync all cached values to parent
                  const cachedRadioValues = getAllCachedValues();
                  const cachedTrueFalseValues = getAllTrueFalseValues();
                  const cachedInputValues = getAllStableInputValues();
                  const cachedMeasurementValues = getAllMeasurementValues();
                  
                  console.log('Save: Syncing cached values on page', currentPage);
                  console.log('Save: Radio values:', cachedRadioValues);
                  console.log('Save: True/False values:', cachedTrueFalseValues);
                  console.log('Save: Input values:', cachedInputValues);
                  console.log('Save: Measurement values:', cachedMeasurementValues);
                  
                  // DON'T call onAnswerChange - it causes re-mounting!
                  // Instead save directly to localStorage
                  const currentFormData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{"answers":{}}');
                  const updatedFormData = {
                    ...currentFormData,
                    answers: {
                      ...currentFormData.answers,
                      ...cachedRadioValues,
                      ...cachedTrueFalseValues,
                      ...cachedInputValues,
                      ...cachedMeasurementValues,
                    }
                  };
                  
                  localStorage.setItem('otis-protocol-form-data', JSON.stringify(updatedFormData));
                  console.log('Save: Data saved directly to localStorage - NO React state updates');
                  setSaveStatus('saved');
                  setLastSaved(new Date());
                  
                  // Auto-clear saved status after 3 seconds
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
                  
                  console.log('Complete button: Syncing cached values...');
                  console.log('Radio values:', cachedRadioValues);
                  console.log('True/False values:', cachedTrueFalseValues);
                  console.log('Input values:', cachedInputValues);
                  console.log('Measurement values:', cachedMeasurementValues);
                  console.log('Input values:', cachedInputValues);
                  
                  Object.entries(cachedRadioValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedTrueFalseValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
                  });
                  Object.entries(cachedInputValues).forEach(([questionId, value]) => {
                    onAnswerChange(questionId, value as string);
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
                {t.complete}
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

// Debug - log current language context
console.log('Current Questionnaire component - Language context:', window.localStorage.getItem('otis-protocol-language'));

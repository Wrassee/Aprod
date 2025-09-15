import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Question, AnswerValue, ProtocolError, QuestionType } from '@shared/schema';
import { Button } from '@/components/ui/button';
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
  onSave: () => void;
  language: 'hu' | 'de';
  onAdminAccess?: () => void;
  onHome?: () => void;
  onStartNew?: () => void;
  onQuestionChange?: (questionId: string) => void;
  globalCurrentStep: number;
  totalSteps: number;
  globalProgress: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
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
  onQuestionChange,
  globalCurrentStep,
  totalSteps,
  globalProgress,
  onStepChange,
  onPrevious,
}: QuestionnaireProps) {
  const { t, language: contextLanguage } = useLanguageContext();
  
  const [currentPage, setCurrentPage] = useState(() => {
    return globalCurrentStep > 0 ? globalCurrentStep - 1 : 0;
  });
  
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);
  const [measurementValues, setMeasurementValues] = useState<Record<string, number>>({});
  const [calculatedResults, setCalculatedResults] = useState<Record<string, any>>({});
  const [measurementErrors, setMeasurementErrors] = useState<ProtocolError[]>([]);

  useEffect(() => {
      const newPage = globalCurrentStep > 0 ? globalCurrentStep - 1 : 0;
      if (currentPage !== newPage) {
          setCurrentPage(newPage);
      }
  }, [globalCurrentStep]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const response = await fetch(`/api/questions/${language}`);
        if (response.ok) {
          const questionsData = await response.json();
          setAllQuestions(questionsData);
        } else {
          setAllQuestions([]);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setAllQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };
    loadQuestions();
  }, [language]);

  const { questionGroups, totalPages, currentQuestions, progress, currentGroup } = useMemo(() => {
    const groups = allQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
      const groupName = question.groupName;
      if (!groupName) return acc;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(question);
      return acc;
    }, {});

    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a: Question, b: Question) => (a.groupOrder || 0) - (b.groupOrder || 0));
    });

    const groupsArray = Object.entries(groups)
      .filter(([name, questions]) => questions.length > 0)
      .map(([name, questions]) => ({
        name,
        questions,
        questionCount: questions.length
      }));
      
    const total = groupsArray.length;
    const currentGroupData = groupsArray[currentPage] || { name: '', questions: [], questionCount: 0 };
    const prog = total > 0 ? ((currentPage + 1) / total) * 100 : 0;
      
    return { 
      questionGroups: groupsArray, 
      totalPages: total, 
      currentQuestions: currentGroupData.questions, 
      progress: prog,
      currentGroup: currentGroupData
    };
  }, [allQuestions, currentPage]);

  useEffect(() => {
    const handleCacheChange = () => {
      setCacheUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('radio-change', handleCacheChange);
    window.addEventListener('button-check', handleCacheChange);
    window.addEventListener('measurement-change', handleCacheChange);

    return () => {
      window.removeEventListener('radio-change', handleCacheChange);
      window.removeEventListener('button-check', handleCacheChange);
      window.removeEventListener('measurement-change', handleCacheChange);
    };
  }, []);

  const handleAddError = useCallback((error: Omit<ProtocolError, 'id'>) => {
    const newError: ProtocolError = { ...error, id: Date.now().toString() };
    const currentErrors = Array.isArray(errors) ? errors : [];
    onErrorsChange([...currentErrors, newError]);
  }, [onErrorsChange, errors]);

  const handleEditError = useCallback((id: string, updatedError: Omit<ProtocolError, 'id'>) => {
    const currentErrors = Array.isArray(errors) ? errors : [];
    onErrorsChange(currentErrors.map((error: ProtocolError) => error.id === id ? { ...updatedError, id } : error));
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
    
    const combinedAnswers = {
      ...answers,
      ...JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{"answers":{}}').answers,
      ...getAllCachedValues(),
      ...getAllTrueFalseValues(),
      ...getAllStableInputValues(),
      ...getAllMeasurementValues(),
      ...getAllCalculatedValues(),
    };
    
    return requiredQuestions.every((q: Question) => {
      const answer = combinedAnswers[q.id];
      const hasAnswer = answer !== undefined && answer !== null && answer !== '';
      return hasAnswer;
    });
  };
  
  const canProceedState = useMemo(() => {
    return checkCanProceed();
  }, [currentQuestions, answers, cacheUpdateTrigger]);

  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="min-h-screen bg-light-surface" onSubmit={(e) => e.preventDefault()}>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img 
                src="/otis-elevators-seeklogo_1753525178175.png" 
                alt="OTIS Logo" 
                className="h-12 w-12 mr-4"
              />
              {onHome && (
                <Button variant="ghost" size="sm" onClick={onHome} className="text-gray-600 hover:text-gray-800 mr-4" title={language === 'de' ? 'Startseite' : 'Kezdőlap'}>
                  <Home className="h-4 w-4" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">OTIS APROD - Átvételi Protokoll</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-gray-600">{t.receptionDate}</Label>
              <Input
                type="date"
                value={receptionDate}
                onChange={(e) => onReceptionDateChange(e.target.value)}
                className="w-auto"
              />
              {onStartNew && (
                <Button onClick={onStartNew} className="bg-green-600 hover:bg-green-700 text-white flex items-center" size="sm" title={t.startNew || 'Új protokoll indítása'}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t.startNew || 'Új protokoll indítása'}
                </Button>
              )}
              {onAdminAccess && (
                <Button variant="ghost" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800" title={t.admin}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-700">
                  {t.progress}
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {globalCurrentStep} / {totalSteps} {t.groupOf || 'csoport'}
                </span>
              </div>
              <Progress value={globalProgress} className="w-full h-2.5" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8" onSubmit={(e) => e.preventDefault()}>
        {currentGroup && (
          <QuestionGroupHeader
            groupName={currentGroup.name}
            questionCount={currentGroup.questions.length}
            totalGroups={totalPages}
            currentGroupIndex={currentPage}
            language={language}
          />
        )}

        <div className="mb-8">
          {currentPage === 0 || currentPage === 1 ? (
            <div className="grid grid-cols-2 gap-8">
              {(currentQuestions as Question[]).map((question: Question) => (
                <IsolatedQuestion
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => {
                    onAnswerChange(question.id, value);
                    onQuestionChange?.(question.id);
                  }}
                />
              ))}
            </div>
          ) : (
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
                  }}
                  onAddError={handleAddError}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {(currentQuestions as Question[]).map((question: Question) => (
                    <IsolatedQuestion
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => {
                        onAnswerChange(question.id, value);
                        onQuestionChange?.(question.id);
                      }}
                    />
                  ))}
                </div>
              )
            )
          )}
        </div>

        <div className="mb-8">
          <ErrorList
            errors={errors}
            onAddError={handleAddError}
            onEditError={handleEditError}
            onDeleteError={handleDeleteError}
          />
        </div>

        <div className="flex justify-between items-center" onSubmit={(e) => e.preventDefault()}>
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={globalCurrentStep <= 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.previous}
          </Button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                setSaveStatus('saving');
                try {
                  const cachedRadioValues = getAllCachedValues();
                  const cachedTrueFalseValues = getAllTrueFalseValues();
                  const cachedInputValues = getAllStableInputValues();
                  const cachedMeasurementValues = getAllMeasurementValues();
                  const cachedCalculatedValues = getAllCalculatedValues();
                  
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
                  setSaveStatus('saved');
                  setLastSaved(new Date());
                  setTimeout(() => setSaveStatus('idle'), 3000);
                } catch (error) {
                  console.error('Save failed:', error);
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
              {saveStatus === 'saving' ? (<><div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>{t.saving}</>) 
              : saveStatus === 'saved' ? (<><Check className="h-4 w-4 mr-2 text-green-600" />{t.saved}</>) 
              : saveStatus === 'error' ? (<><X className="h-4 w-4 mr-2 text-red-600" />{t.error}</>) 
              : (<><Save className="h-4 w-4 mr-2" />{t.save}</>)}
            </button>
            
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceedState}
              className={`flex items-center text-white ${canProceedState ? 'bg-otis-blue hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {t.next}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
});

export default Questionnaire;
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
import { ArrowLeft, ArrowRight, Save, Check, X, Sparkles, Zap } from 'lucide-react';
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
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerValue>>(answers);
  
  // Sync with parent answers
  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  // Apply conditional filtering
  const { filteredQuestions, filteredCount } = useConditionalQuestionFilter(allQuestions, localAnswers);

  // Auto-set disabled questions to "n.a." AND clear "n.a." from re-enabled questions
  useEffect(() => {
    if (allQuestions.length > 0 && filteredQuestions.length > 0) {
      const updatedAnswers = updateAnswersWithDisabled(localAnswers, allQuestions, filteredQuestions);
      
      filteredQuestions.forEach(q => {
        if (updatedAnswers[q.id] === 'n.a.') {
          updatedAnswers[q.id] = '';
        }
      });
      
      const hasChanges = Object.keys(updatedAnswers).some(key => 
        updatedAnswers[key] !== localAnswers[key]
      );
      
      if (hasChanges) {
        setLocalAnswers(updatedAnswers);
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
          setAllQuestions(questionsData);
        } else {
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

    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a: Question, b: Question) => (a.groupOrder || 0) - (b.groupOrder || 0));
    });

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

  // Save handler with animation
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

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

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* 🎨 MODERN PROGRESS BAR WITH GLOW */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.progress || 'Haladás'}: {pageFromApp + 1} / {totalPages}
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {progressPercent}%
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* 🎨 MODERN GROUP HEADER */}
        {questionGroups.length > 0 && currentGroup && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {pageFromApp + 1}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      {currentGroup.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-cyan-500" />
                      {currentGroup.questionCount} {language === 'hu' ? 'kérdés' : 'Fragen'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS CONTENT */}
        <div className="mb-8">
          {pageFromApp === 0 || pageFromApp === 1 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            const allRadioAreBoolean = radioQuestions.every(q => 
              !q.options || q.options.length === 0 || 
              (Array.isArray(q.options) && q.options.every((opt: string) => 
                ['true', 'false', 'n.a.', 'yes', 'no', 'igen', 'nem'].includes(opt.toLowerCase())
              ))
            );
            
            if (hasOnlyRadio && allRadioAreBoolean) {
              return (
                <TrueFalseGroup
                  questions={radioQuestions}
                  values={localAnswers}
                  onChange={handleLocalAnswerChange}
                  groupName={currentGroup?.name || 'Kérdések'}
                />
              );
            }

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

            return (
              <div className="space-y-6">
                {measurementQuestions.length > 0 && (
                  <MeasurementBlock
                    questions={measurementQuestions}
                    values={localAnswers}
                    onChange={handleLocalAnswerChange}
                    onAddError={handleAddError}
                  />
                )}
                {(radioQuestions.length > 0 || otherQuestions.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...radioQuestions, ...otherQuestions].map((question: Question) => (
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

        {/* ERROR LIST */}
        <div className="mb-8">
          <ErrorList
            errors={errors}
            onAddError={handleAddError}
            onEditError={handleEditError}
            onDeleteError={handleDeleteError}
          />
        </div>

        {/* 🎨 MODERN NAVIGATION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          {/* Back Button */}
          <button
            onClick={handlePreviousPage}
            disabled={pageFromApp === 0}
            className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-semibold">{t.previous}</span>
            </div>
          </button>

          {/* Center AI Button */}
          <SmartHelpWizard
            currentPage={pageFromApp + 1}
            formData={localAnswers}
            currentQuestionId={currentQuestionId}
            errors={errors}
          />

          {/* Right Side Buttons */}
          <div className="flex gap-3">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                saveStatus === 'saved' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                  : 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                    <span>{t.saving}</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>{t.saved}</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <X className="h-5 w-5" />
                    <span>{t.error}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{t.save}</span>
                  </>
                )}
              </div>
            </button>

            {/* Next/Complete Button */}
            <button
              onClick={isLastPage ? onNext : handleNextPage}
              disabled={!canProceed}
              className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 transition-opacity ${canProceed ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
              </div>
              
              {/* Disabled state */}
              {!canProceed && (
                <div className="absolute inset-0 bg-gray-400"></div>
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center gap-2 text-white">
                <span>{t.next}</span>
                {canProceed ? (
                  <>
                    <Check className="h-5 w-5" />
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                ) : (
                  <X className="h-5 w-5" />
                )}
              </div>

              {/* Shine effect */}
              <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${canProceed ? '' : 'hidden'}`}></div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Questionnaire;
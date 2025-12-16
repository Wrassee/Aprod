// src/pages/questionnaire.tsx - LIFT SELECTOR INTEGRÁCIÓ
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
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { ArrowLeft, ArrowRight, Save, Check, X, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { MeasurementBlock } from '@/components/measurement-block';
import { useConditionalQuestionFilter, updateAnswersWithDisabled } from '@/components/conditional-question-filter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getApiUrl } from '@/lib/queryClient';

interface QuestionnaireProps {
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  answers: Record<string, AnswerValue>;
  onAnswerChange: (questionId: string, value: AnswerValue) => void;
  errors: ProtocolError[];
  onErrorsChange: (errors: ProtocolError[]) => void;
  onNext: () => void;
  onSave: () => void;
  language: 'hu' | 'de' | 'en' | 'fr' | 'it';
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
  const { theme } = useTheme();

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [liftSelectionError, setLiftSelectionError] = useState<string | null>(null); // 🔥 ÚJ
  
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerValue>>(answers);
  
  // Sync with parent answers
  useEffect(() => {
    setLocalAnswers(answers);
  }, [answers]);

  // 🔥 ÚJ: LIFT SELECTION VALIDATION + QUICK START SUPPORT
  useEffect(() => {
    // 1. Check for Quick Start templates first
    const quickStartQuestionTemplate = localStorage.getItem("otis-quick-start-question-template");
    const quickStartProtocolTemplate = localStorage.getItem("otis-quick-start-protocol-template");
    
    if (quickStartQuestionTemplate) {
      console.log("🚀 Quick Start mode detected:", {
        questionTemplateId: quickStartQuestionTemplate,
        protocolTemplateId: quickStartProtocolTemplate,
      });
      
      // Create a virtual lift selection for quick start
      const quickStartSelection = {
        liftType: "quick-start",
        liftSubtype: null,
        questionTemplateId: quickStartQuestionTemplate,
        protocolTemplateId: quickStartProtocolTemplate,
        isQuickStart: true,
      };
      
      // Store it in the standard liftSelection location
      localStorage.setItem("liftSelection", JSON.stringify(quickStartSelection));
      
      // Clear the quick start flags (one-time use)
      localStorage.removeItem("otis-quick-start-question-template");
      localStorage.removeItem("otis-quick-start-protocol-template");
      
      setLiftSelectionError(null);
      return;
    }
    
    // 2. Check if user has selected a lift type (normal flow)
    const liftSelectionStr = localStorage.getItem("liftSelection");
    
    if (!liftSelectionStr) {
      // No lift selection - show warning but don't redirect yet
      console.warn("⚠️ No lift selection found in localStorage");
      setLiftSelectionError("Nincs kiválasztott lift típus. Kérjük, válasszon egy típust.");
      return;
    }

    try {
      const liftSelection = JSON.parse(liftSelectionStr);
      
      // Validate required fields
      if (!liftSelection.questionTemplateId) {
        console.error("❌ Invalid lift selection - missing questionTemplateId");
        setLiftSelectionError("Érvénytelen lift választás - hiányzó sablon azonosító.");
        return;
      }

      console.log("✅ Lift selection loaded:", {
        type: liftSelection.liftType,
        subtype: liftSelection.liftSubtype,
        questionTemplateId: liftSelection.questionTemplateId,
        protocolTemplateId: liftSelection.protocolTemplateId,
        isQuickStart: liftSelection.isQuickStart || false,
      });
      
      // Clear any previous error
      setLiftSelectionError(null);
      
    } catch (error) {
      console.error("❌ Error parsing lift selection:", error);
      setLiftSelectionError("Hibás lift választás formátum.");
    }
  }, []);

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
        console.log('🎯 Auto-setting disabled questions to "n.a." and clearing re-enabled questions', {
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

  // 🔥 MÓDOSÍTOTT: Load questions with template ID support
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        
        // 🔥 ÚJ: Get template ID from lift selection
        const liftSelectionStr = localStorage.getItem("liftSelection");
        let templateId: string | null = null;
        
        if (liftSelectionStr) {
          try {
            const liftSelection = JSON.parse(liftSelectionStr);
            templateId = liftSelection.questionTemplateId;
            console.log('📦 Loading questions for template:', templateId);
          } catch (error) {
            console.error('❌ Error parsing lift selection:', error);
          }
        }
        
        // 🔥 MÓDOSÍTOTT: Build URL with optional templateId
        const relativePath = templateId 
          ? `/api/questions/${language}?templateId=${templateId}`
          : `/api/questions/${language}`;
        
        const url = getApiUrl(relativePath); // 👈 EZ A KULCS!
        
        console.log('🔗 Fetching questions from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const questionsData = await response.json();
          console.log('✅ Questions loaded:', questionsData.length);

          // Nyelvi placeholder beállítása
          const langSuffix = language.toUpperCase(); // 'HU' vagy 'DE'
          const placeholderKey = `placeholder${langSuffix}`; // 'placeholderHU' vagy 'placeholderDE'

          const transformedQuestions = questionsData.map((q: any) => ({
            ...q,
            placeholder: q[placeholderKey] || q.placeholder || ''
          }));

          setAllQuestions(transformedQuestions);
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
  }, [language]); // 🔥 NEM függ a templateId-től, mert localStorage-ból olvassuk

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

  // 🔥 ÚJ: Lift selection info display
  const LiftSelectionInfo = () => {
    const liftSelectionStr = localStorage.getItem("liftSelection");
    if (!liftSelectionStr) return null;
    
    try {
      const liftSelection = JSON.parse(liftSelectionStr);
      return (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            {/* ITT VOLT A HIBA: Beégetett szöveg helyett t("...") */}
            <span className="font-medium">{t("selectedLiftType")}</span>
            <span>{liftSelection.liftType} - {liftSelection.liftSubtype}</span>
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* PageHeader KÍVÜL (sticky működhet) */}
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

      {/* Görgethető tartalom */}
      <div className={`min-h-screen relative overflow-hidden ${
        theme === 'modern'
          ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20'
          : 'bg-light-surface'
      }`}>
        
        {/* Modern animált háttér */}
        {theme === 'modern' && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </>
        )}

        <main className={`max-w-7xl mx-auto px-6 py-8 ${theme === 'modern' ? 'relative z-10' : ''}`}>
          
          {/* 🔥 ÚJ: Lift Selection Error Alert */}
          {liftSelectionError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {liftSelectionError}
                <Button 
                  onClick={onHome} 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                >
                  Vissza a választáshoz
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* 🔥 ÚJ: Lift Selection Info */}
          <LiftSelectionInfo />
          
          {/* Csoport fejléc */}
          {questionGroups.length > 0 && currentGroup && (
            theme === 'modern' ? (
              // Modern Group Header
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
                          {currentGroup.questionCount} {t("questionsSuffix")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Classic Group Header
              <QuestionGroupHeader
                groupName={currentGroup.name}
                questionCount={currentGroup.questionCount}
                totalGroups={totalPages}
                currentGroupIndex={pageFromApp}
                language={language}
              />
            )
          )}

          {/* Kérdések renderelése */}
          <div className="mb-8">
            {pageFromApp === 0 || pageFromApp === 1 ? (
              <div className={`grid gap-8 ${theme === 'modern' ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-2'}`}>
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
                    groupName={currentGroup?.name || t("questions")}
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
                    <div className={`grid gap-8 ${theme === 'modern' ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1 lg:grid-cols-2'}`}>
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

          {/* Hibalista */}
          <div className="mb-8">
            <ErrorList
              errors={errors}
              onAddError={handleAddError}
              onEditError={handleEditError}
              onDeleteError={handleDeleteError}
            />
          </div>

          {/* Navigáció */}
          <div className={`flex justify-between ${
            theme === 'modern' 
              ? 'flex-col sm:flex-row items-stretch sm:items-center gap-4' 
              : 'items-center'
          }`}>
            {/* Vissza gomb */}
            {theme === 'modern' ? (
              <button
                onClick={handlePreviousPage}
                disabled={pageFromApp === 0}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{t("previous")}</span>
                </div>
              </button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={pageFromApp === 0}
                className="flex items-center border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("previous")}
              </Button>
            )}

            {/* AI segítség */}
            <SmartHelpWizard
              currentPage={pageFromApp + 1}
              formData={localAnswers}
              currentQuestionId={currentQuestionId}
              errors={errors}
            />

            {/* Mentés és Tovább gombok */}
            <div className={`flex ${theme === 'modern' ? 'gap-3' : 'space-x-4'}`}>
              {/* Mentés */}
              {theme === 'modern' ? (
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
                        <span>{t("saving")}</span>
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>{t("saved")}</span>
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <X className="h-5 w-5" />
                        <span>{t("error")}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{t("save")}</span>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center space-x-2 ${
                    saveStatus === 'saved' ? 'bg-green-100 border-green-300 text-green-700' :
                    saveStatus === 'error' ? 'bg-red-100 border-red-300 text-red-700' :
                    'border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                      {t("saving")}
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      {t("saved")}
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <X className="h-4 w-4 mr-2 text-red-600" />
                      {t("error")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t("save")}
                    </>
                  )}
                </Button>
              )}
              
              {/* Tovább gomb */}
              {theme === 'modern' ? (
                <button
                  onClick={isLastPage ? onNext : handleNextPage}
                  disabled={!canProceed}
                  className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`absolute inset-0 transition-opacity ${canProceed ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  </div>
                  
                  {!canProceed && (
                    <div className="absolute inset-0 bg-gray-400"></div>
                  )}

                  <div className="relative z-10 flex items-center gap-2 text-white">
                    <span>{t("next")}</span>
                    {canProceed ? (
                      <>
                        <Check className="h-5 w-5" />
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </div>

                  <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${canProceed ? 'pointer-events-none' : 'hidden'}`}></div>
                </button>
              ) : (
                isLastPage ? (
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
                    {t("next")}
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
                    {t("next")} {canProceed ? '✓' : '✗'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Questionnaire;
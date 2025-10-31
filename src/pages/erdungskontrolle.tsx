// src/pages/erdungskontrolle.tsx - ULTRA MODERN OTIS BLUE VERSION

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import PageHeader from '@/components/PageHeader';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2, XCircle, MinusCircle, Sparkles, AlertTriangle, Plus } from 'lucide-react';
import { FormData, GroundingAnswer } from '@/lib/types';

interface GroundingQuestion {
  id: string;
  text: string;
  isCustom?: boolean;
  pdfTextFieldName?: string;
}

interface GroundingGroup {
  id: string;
  title: string;
  questions: GroundingQuestion[];
}

interface GroundingData {
  groups: GroundingGroup[];
}

interface ErdungskontrolleProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  onHome?: () => void;
  onAdminAccess?: () => void;
  onStartNew?: () => void;
  language: 'hu' | 'de';
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
}

// 🎨 MODERN QUESTION ITEM COMPONENT
const GroundingQuestionItem = memo(function GroundingQuestionItem({
  question,
  currentAnswer,
  language,
  onChange,
}: {
  question: GroundingQuestion;
  currentAnswer?: GroundingAnswer;
  language: 'hu' | 'de';
  onChange: (id: string, value: GroundingAnswer) => void;
}) {
  const hasError = currentAnswer === undefined;

  return (
    <div
      className={`
        relative border-b last:border-b-0 transition-all duration-300
        ${currentAnswer === 'ok' ? 'bg-gradient-to-r from-green-50 to-transparent border-l-4 border-l-green-500' : ''}
        ${currentAnswer === 'not_ok' ? 'bg-gradient-to-r from-red-50 to-transparent border-l-4 border-l-red-500' : ''}
        ${currentAnswer === 'not_applicable' ? 'bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-l-gray-400' : ''}
        ${hasError ? 'bg-amber-50/50 animate-pulse' : 'bg-white hover:bg-blue-50/30'}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4">
        <Label className="text-base font-medium text-gray-800 dark:text-gray-200 flex-1 pr-4">
          {question.text}
        </Label>

        <RadioGroup
          value={currentAnswer || ''}
          onValueChange={(value) => onChange(question.id, value as GroundingAnswer)}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {/* OK Button */}
          <div className="relative">
            <RadioGroupItem value="ok" id={`${question.id}_ok`} className="sr-only" />
            <Label
              htmlFor={`${question.id}_ok`}
              className={`
                group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md
                ${currentAnswer === 'ok'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'}
              `}
            >
              <CheckCircle2 className={`h-4 w-4 transition-transform ${currentAnswer === 'ok' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span>OK</span>
            </Label>
          </div>

          {/* NOT OK Button */}
          <div className="relative">
            <RadioGroupItem value="not_ok" id={`${question.id}_not_ok`} className="sr-only" />
            <Label
              htmlFor={`${question.id}_not_ok`}
              className={`
                group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md
                ${currentAnswer === 'not_ok'
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-500 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300'}
              `}
            >
              <XCircle className={`h-4 w-4 transition-transform ${currentAnswer === 'not_ok' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span>{language === 'hu' ? 'Nem OK' : 'Nicht OK'}</span>
            </Label>
          </div>

          {/* N.A. Button */}
          <div className="relative">
            <RadioGroupItem value="not_applicable" id={`${question.id}_na`} className="sr-only" />
            <Label
              htmlFor={`${question.id}_na`}
              className={`
                group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md
                ${currentAnswer === 'not_applicable'
                  ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-500 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-300'}
              `}
            >
              <MinusCircle className={`h-4 w-4 transition-transform ${currentAnswer === 'not_applicable' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span>N.A.</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Error Warning */}
      {currentAnswer === 'not_ok' && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-100 to-rose-100 border-l-4 border-red-500 rounded-lg shadow-sm">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              {language === 'hu'
                ? 'Ez a hiba automatikusan hozzáadva a hibalistához'
                : 'Dieser Fehler wurde automatisch zur Fehlerliste hinzugefügt'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export function Erdungskontrolle({
  formData,
  setFormData,
  onNext,
  onBack,
  onHome,
  onAdminAccess,
  onStartNew,
  language,
  receptionDate,
  onReceptionDateChange,
}: ErdungskontrolleProps) {
  const { t } = useLanguageContext();
  const [groundingData, setGroundingData] = useState<GroundingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeCustomRows, setActiveCustomRows] = useState<{ [key: string]: boolean }>({});
  const [customRowTexts, setCustomRowTexts] = useState<{ [key: string]: string }>({});

  const cacheRef = useRef<{ [lang: string]: GroundingData }>({});

  useEffect(() => {
    const loadGroundingQuestions = async () => {
      if (cacheRef.current[language]) {
        setGroundingData(cacheRef.current[language]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/questions_grounding_${language}.json`);
        if (!response.ok) throw new Error('Failed to fetch grounding questions');
        const data = await response.json();
        
        cacheRef.current[language] = data;
        setGroundingData(data);
      } catch (error) {
        console.error('Error loading grounding questions:', error);
        setGroundingData({ groups: [] });
      } finally {
        setLoading(false);
      }
    };
    loadGroundingQuestions();
  }, [language]);

  useEffect(() => {
    if (formData.customGroundingTexts) {
      setCustomRowTexts(formData.customGroundingTexts);
      const active: { [key: string]: boolean } = {};
      Object.keys(formData.customGroundingTexts).forEach(key => {
        groundingData?.groups.forEach(group => {
          group.questions.forEach(q => {
            if (q.isCustom && q.pdfTextFieldName === key) {
              active[q.id] = true;
            }
          });
        });
      });
      setActiveCustomRows(active);
    }
  }, [formData.customGroundingTexts, groundingData]);

  const answers = formData.groundingCheckAnswers || {};

  const handleAnswerChange = useCallback(
    (questionId: string, value: GroundingAnswer | undefined) => {
      setFormData((currentFormData) => {
        const newAnswers = { ...(currentFormData.groundingCheckAnswers || {}) };
        
        if (value === undefined) {
          delete newAnswers[questionId];
        } else {
          newAnswers[questionId] = value;
        }
        
        let newErrors = [...(currentFormData.errors || [])].filter(
          (error) => (error as any).context !== questionId
        );

        if (value === 'not_ok' && groundingData) {
          for (const group of groundingData.groups) {
            const question = group.questions.find((q) => q.id === questionId);
            if (question) {
              const questionText = question.isCustom && question.pdfTextFieldName
                ? customRowTexts[question.pdfTextFieldName] || question.text
                : question.text;
              
              newErrors.push({
                id: `grounding_${questionId}`,
                title: language === 'hu' ? 'Földelési hiba' : 'Erdungsfehler',
                description: `${group.title}: ${questionText}`,
                severity: 'medium' as const,
                context: questionId,
                images: [],
              } as any);
              break;
            }
          }
        }

        return {
          ...currentFormData,
          groundingCheckAnswers: newAnswers,
          errors: newErrors,
        };
      });
    },
    [setFormData, groundingData, language, customRowTexts]
  );

  const totalQuestions = useMemo(() => {
    if (!groundingData) return 0;
    return groundingData.groups.reduce((sum, group) => {
      return sum + group.questions.filter(q => 
        !q.isCustom || activeCustomRows[q.id]
      ).length;
    }, 0);
  }, [groundingData, activeCustomRows]);

  const answeredQuestions = useMemo(() => {
    if (!groundingData) return 0;
    let count = 0;
    groundingData.groups.forEach(group => {
      group.questions.forEach(q => {
        if ((!q.isCustom || activeCustomRows[q.id]) && answers[q.id]) {
          count++;
        }
      });
    });
    return count;
  }, [groundingData, answers, activeCustomRows]);
  
  const progressPercent = useMemo(
    () => (totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0),
    [answeredQuestions, totalQuestions]
  );

  const canProceed = useMemo(() => {
    if (!groundingData) return false;
    return groundingData.groups.every((group) =>
      group.questions.every((question) => {
        if (question.isCustom && !activeCustomRows[question.id]) return true;
        return Object.prototype.hasOwnProperty.call(answers, question.id);
      })
    ) && totalQuestions > 0;
  }, [groundingData, answers, activeCustomRows, totalQuestions]);

  const handleManualSave = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
      const saveData = () => {
        const dataToSave = {
          ...formData,
          customGroundingTexts: customRowTexts
        };
        localStorage.setItem('otis-protocol-form-data', JSON.stringify(dataToSave));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      };
      
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(saveData);
      } else {
        setTimeout(saveData, 0);
      }
    }, 400);
  }, [formData, customRowTexts]);

  const handleNextPage = useCallback(() => {
    setFormData(currentFormData => ({
      ...currentFormData,
      customGroundingTexts: customRowTexts
    }));
    onNext();
  }, [setFormData, customRowTexts, onNext]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="relative h-16 w-16 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium">
            {language === 'hu' ? 'Betöltés folyamatban...' : 'Wird geladen...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <PageHeader
        title={
          language === 'hu'
            ? 'OTIS APROD - Földelés Ellenőrzés'
            : 'OTIS APROD - Erdungskontrolle'
        }
        onHome={onHome}
        onAdminAccess={onAdminAccess}
        onStartNew={onStartNew}
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        progressPercent={progressPercent}
        showProgress={true}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* 🎨 MODERN HEADER CARD */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {language === 'hu' ? 'Földelési Mérések' : 'Erdungskontrolle'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  {language === 'hu'
                    ? 'Minden mérési pontnál jelölje be a megfelelő választ'
                    : 'Wählen Sie bei jedem Messpunkt die entsprechende Antwort'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {answeredQuestions} / {totalQuestions} {language === 'hu' ? 'kitöltve' : 'ausgefüllt'}
                </div>
                <div className="text-xs text-gray-500">
                  {progressPercent}% {language === 'hu' ? 'kész' : 'fertig'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* GROUPS */}
        <div className="space-y-6">
          {groundingData?.groups.map((group, groupIndex) => (
            <Card key={group.id} className="shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {groupIndex + 1}
                  </div>
                  <CardTitle className="text-xl font-bold">{group.title}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Regular Questions */}
                {group.questions.filter(q => !q.isCustom).map((q) => (
                  <GroundingQuestionItem
                    key={q.id}
                    question={q}
                    currentAnswer={answers[q.id]}
                    language={language}
                    onChange={handleAnswerChange}
                  />
                ))}

                {/* Custom Items */}
                {group.questions.filter(q => q.isCustom).map(customQuestion => (
                  <div key={customQuestion.id} className="border-t-2 border-blue-100 p-4 bg-gradient-to-r from-blue-50/50 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor={`switch-${customQuestion.id}`} className="font-bold text-gray-800 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        {language === 'hu' ? 'Egyéni tétel hozzáadása' : 'Benutzerdefinierter Artikel hinzufügen'}
                      </Label>
                      <Switch
                        id={`switch-${customQuestion.id}`}
                        checked={!!activeCustomRows[customQuestion.id]}
                        onCheckedChange={(isChecked) => {
                          setActiveCustomRows(prev => ({ ...prev, [customQuestion.id]: isChecked }));
                          if (!isChecked) {
                            handleAnswerChange(customQuestion.id, undefined);
                          }
                        }}
                      />
                    </div>

                    {activeCustomRows[customQuestion.id] && customQuestion.pdfTextFieldName && (
                      <div className="mt-4 space-y-4">
                        <div className="relative group">
                          <Input
                            placeholder={language === 'hu' ? 'Mért eszköz leírása...' : 'Beschreibung des gemessenen Geräts...'}
                            value={customRowTexts[customQuestion.pdfTextFieldName] || ''}
                            onChange={(e) => {
                              setCustomRowTexts(prev => ({ ...prev, [customQuestion.pdfTextFieldName!]: e.target.value }));
                            }}
                            className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse"></div>
                        </div>
                        <GroundingQuestionItem
                          question={{ 
                            id: customQuestion.id, 
                            text: customRowTexts[customQuestion.pdfTextFieldName] || (language === 'hu' ? 'Egyéni tétel' : 'Benutzerdefiniert')
                          }}
                          currentAnswer={answers[customQuestion.id]}
                          language={language}
                          onChange={handleAnswerChange}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 🎨 MODERN NAVIGATION */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 pt-6 border-t-2 border-blue-100">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-semibold">{language === 'hu' ? 'Vissza' : 'Zurück'}</span>
            </div>
          </button>

          <div className="flex gap-3">
            {/* Save Button */}
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                saveStatus === 'saved' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === 'hu' ? 'Mentés...' : 'Speichern...'}</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{language === 'hu' ? 'Mentve' : 'Gespeichert'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{language === 'hu' ? 'Mentés' : 'Speichern'}</span>
                  </>
                )}
              </div>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
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
                <span>
                  {language === 'hu'
                    ? 'Tovább a Niedervolt mérésekhez'
                    : 'Weiter zu Niedervolt Messungen'}
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>

              <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${canProceed ? '' : 'hidden'}`}></div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
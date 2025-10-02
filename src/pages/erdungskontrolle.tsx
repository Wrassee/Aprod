// src/pages/erdungskontrolle.tsx (TELJES, JAVÍTOTT FÁJL)

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/PageHeader';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Check, X } from 'lucide-react';
import { FormData, GroundingAnswer } from '@/lib/types'; // <-- Típus importálása
import { ProtocolError } from '../../shared/schema';

interface GroundingQuestion {
  id: string;
  text: string;
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
  onReceptionDateChange
}: ErdungskontrolleProps) {
  const { t } = useLanguageContext();
  const [groundingData, setGroundingData] = useState<GroundingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadGroundingQuestions = async () => {
      try {
        const response = await fetch(`/questions_grounding_${language}.json`);
        if (!response.ok) throw new Error('Failed to fetch grounding questions');
        const data = await response.json();
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

  const answers = formData.groundingCheckAnswers || {};

  // ====================================================================
  // ===== 1. MÓDOSÍTÁS: A handleAnswerChange függvény cseréje =====
  // ====================================================================
  const handleAnswerChange = (questionId: string, value: GroundingAnswer) => {
    const newAnswers = { ...answers, [questionId]: value };
    
    let questionText = '';
    if (groundingData) {
      for (const group of groundingData.groups) {
        const question = group.questions.find(q => q.id === questionId);
        if (question) {
          questionText = `${group.title}: ${question.text}`;
          break;
        }
      }
    }

    let newErrors = [...(formData.errors || [])];
    const existingErrorIndex = newErrors.findIndex(error => (error as any).context === questionId);

    let globalErrors: any[] = [];
    try {
      globalErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
    } catch {
      globalErrors = [];
    }
    const globalErrorIndex = globalErrors.findIndex((error: any) => error.context === questionId);

    if (value === 'not_ok') {
      if (existingErrorIndex === -1) {
        const newError: ProtocolError & { context: string } = {
          id: `grounding_${questionId}`,
          title: language === 'hu' ? 'Földelési hiba' : 'Erdungsfehler',
          description: questionText,
          severity: 'medium' as const,
          context: questionId,
          images: []
        } as any;
        newErrors.push(newError);
      }

      if (globalErrorIndex === -1) {
        const globalError = {
          id: `grounding_${questionId}`,
          title: language === 'hu' ? 'Földelési hiba' : 'Erdungsfehler',
          description: questionText,
          severity: 'medium',
          context: questionId,
          images: [],
          category: language === 'hu' ? 'Földelési ellenőrzés' : 'Erdungskontrolle'
        };
        globalErrors.push(globalError);
        localStorage.setItem('protocol-errors', JSON.stringify(globalErrors));
        window.dispatchEvent(new CustomEvent('protocol-errors-updated', { detail: globalErrors }));
      }
    } else {
      // minden más esetben (ok, not_applicable) töröljük a hibát
      if (existingErrorIndex !== -1) {
        newErrors.splice(existingErrorIndex, 1);
      }
      if (globalErrorIndex !== -1) {
        globalErrors.splice(globalErrorIndex, 1);
        localStorage.setItem('protocol-errors', JSON.stringify(globalErrors));
        window.dispatchEvent(new CustomEvent('protocol-errors-updated', { detail: globalErrors }));
      }
    }

    const updatedFormData = {
      ...formData,
      groundingCheckAnswers: newAnswers,
      errors: newErrors
    };

    setFormData(updatedFormData);

    // Auto save
    setSaveStatus('saving');
    localStorage.setItem('otis-protocol-form-data', JSON.stringify(updatedFormData));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const totalQuestions = groundingData?.groups.reduce((sum, group) => sum + group.questions.length, 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const canProceed = groundingData
    ? groundingData.groups.every(group =>
        group.questions.every(question =>
          Object.prototype.hasOwnProperty.call(answers, question.id)
        )
      ) && totalQuestions > 0
    : false;

  const handleManualSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(formData));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface">
      <PageHeader
        title={language === 'hu' ? 'OTIS APROD - Földelés Ellenőrzés' : 'OTIS APROD - Erdungskontrolle'}
        onHome={onHome}
        onAdminAccess={onAdminAccess}
        onStartNew={onStartNew}
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        language={language}
        progressPercent={progressPercent}
        showProgress={true}
        currentPage={5}
        formData={formData}
        currentQuestionId="grounding-check"
        errors={formData.errors || []}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-dark-text">
              {language === 'hu' 
                ? 'Földelési Mérések' 
                : 'Erdungskontrolle'}
            </h2>
            <div className="text-sm text-gray-600">
              {answeredQuestions} / {totalQuestions} {language === 'hu' ? 'kitöltve' : 'ausgefüllt'}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            {language === 'hu' 
              ? 'Minden mérési pontnál jelölje be a megfelelő választ. A "Nem OK" válaszok automatikusan bekerülnek a hibalistába.'
              : 'Wählen Sie bei jedem Messpunkt die entsprechende Antwort. "Nicht OK" Antworten werden automatisch zur Fehlerliste hinzugefügt.'
            }
          </p>
        </div>
       {/* ==================================================================== */}
        {/* ======================= EZ A VÉGLEGES KÓD ========================== */}
        {/* ==================================================================== */}

        <div className="space-y-6">
          {groundingData?.groups.map((group) => (
            <Card key={group.id} className="shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {group.questions.map((question) => {
                    const currentAnswer = answers[question.id];
                    const hasError = currentAnswer === undefined;
                    
                    return (
                      <div
                        key={question.id}
                        className={`
                          border-b last:border-b-0 transition-all duration-200
                          ${currentAnswer === 'ok' ? 'border-l-4 border-l-green-500' : ''}
                          ${currentAnswer === 'not_ok' ? 'border-l-4 border-l-red-500' : ''}
                          ${currentAnswer === 'not_applicable' ? 'border-l-4 border-l-gray-400' : ''}
                          ${hasError ? 'bg-orange-50' : 'bg-white'}
                        `}
                      >
                        {/* A fő konténer a szövegnek és a gomboknak */}
                        <div className="flex justify-between items-center p-4">
                          {/* 1. Kérdés szövege (bal oldal) */}
                          <Label className="text-base font-medium text-dark-text flex-1 pr-4">
                            {question.text}
                          </Label>
                          
                          {/* 2. Gomb-stílusú választók (jobb oldal) */}
                          <RadioGroup
                            value={currentAnswer || ''}
                            onValueChange={(value) => handleAnswerChange(question.id, value as GroundingAnswer)}
                            className="flex items-center gap-x-2 sm:gap-x-3" // Kisebb térköz mobilon
                          >
                            <div>
                              <RadioGroupItem value="ok" id={`${question.id}_ok`} className="sr-only" />
                              <Label
                                htmlFor={`${question.id}_ok`}
                                className={`
                                  inline-flex items-center justify-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-sm font-semibold border cursor-pointer transition-all
                                  ${currentAnswer === 'ok' 
                                    ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-green-50'
                                  }
                                `}
                              >
                                OK
                              </Label>
                            </div>

                            <div>
                              <RadioGroupItem value="not_ok" id={`${question.id}_not_ok`} className="sr-only" />
                              <Label
                                htmlFor={`${question.id}_not_ok`}
                                className={`
                                  inline-flex items-center justify-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-sm font-semibold border cursor-pointer transition-all
                                  ${currentAnswer === 'not_ok' 
                                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-red-50'
                                  }
                                `}
                              >
                                {language === 'hu' ? 'Nem OK' : 'Nicht OK'}
                              </Label>
                            </div>

                            <div>
                              <RadioGroupItem value="not_applicable" id={`${question.id}_na`} className="sr-only" />
                              <Label
                                htmlFor={`${question.id}_na`}
                                className={`
                                  inline-flex items-center justify-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-sm font-semibold border cursor-pointer transition-all
                                  ${currentAnswer === 'not_applicable' 
                                    ? 'bg-gray-600 text-white border-gray-600 shadow-md' 
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                                  }
                                `}
                              >
                                N.A.
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        {/* Hibaüzenet a konténer alatt jelenik meg, ha kell */}
                        {currentAnswer === 'not_ok' && (
                            <div className="px-4 pb-3">
                                <div className="p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                                    {language === 'hu' 
                                        ? '⚠️ Ez a hiba automatikusan hozzáadva a hibalistához'
                                        : '⚠️ Dieser Fehler wurde automatisch zur Fehlerliste hinzugefügt'
                                    }
                                </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'hu' ? 'Vissza' : 'Zurück'}</span>
          </Button>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>
                {saveStatus === 'saving' 
                  ? (language === 'hu' ? 'Mentés...' : 'Speichern...') 
                  : saveStatus === 'saved' 
                  ? (language === 'hu' ? 'Mentve' : 'Gespeichert')
                  : (language === 'hu' ? 'Mentés' : 'Speichern')
                }
              </span>
            </Button>

            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>{language === 'hu' ? 'Tovább a Niedervolt mérésekhez' : 'Weiter zu Niedervolt Messungen'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
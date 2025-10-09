// src/pages/erdungskontrolle.tsx (TELJES OPTIMALIZÁLT VERZIÓ)

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/PageHeader';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { FormData, GroundingAnswer } from '@/lib/types';
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

// ===================================================
// === OPTIMALIZÁLT: Memoizált komponens az egyes kérdésekhez ===
// ===================================================
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
        border-b last:border-b-0 transition-all duration-200
        ${currentAnswer === 'ok' ? 'border-l-4 border-l-green-500' : ''}
        ${currentAnswer === 'not_ok' ? 'border-l-4 border-l-red-500' : ''}
        ${currentAnswer === 'not_applicable' ? 'border-l-4 border-l-gray-400' : ''}
        ${hasError ? 'bg-orange-50' : 'bg-white'}
      `}
    >
      <div className="flex justify-between items-center p-4">
        <Label className="text-base font-medium text-dark-text flex-1 pr-4">
          {question.text}
        </Label>

        <RadioGroup
          value={currentAnswer || ''}
          onValueChange={(value) => onChange(question.id, value as GroundingAnswer)}
          className="flex items-center gap-x-2 sm:gap-x-3"
        >
          <div>
            <RadioGroupItem value="ok" id={`${question.id}_ok`} className="sr-only" />
            <Label
              htmlFor={`${question.id}_ok`}
              className={`
                inline-flex items-center justify-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-sm font-semibold border cursor-pointer transition-all
                ${currentAnswer === 'ok'
                  ? 'bg-green-600 text-white border-green-600 shadow-md'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-green-50'}
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
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-red-50'}
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
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}
              `}
            >
              N.A.
            </Label>
          </div>
        </RadioGroup>
      </div>

      {currentAnswer === 'not_ok' && (
        <div className="px-4 pb-3">
          <div className="p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
            {language === 'hu'
              ? '⚠️ Ez a hiba automatikusan hozzáadva a hibalistához'
              : '⚠️ Dieser Fehler wurde automatisch zur Fehlerliste hinzugefügt'}
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

  // OPTIMALIZÁCIÓ: JSON cache a nyelvváltásnál
  const cacheRef = useRef<{ [lang: string]: GroundingData }>({});

  useEffect(() => {
    const loadGroundingQuestions = async () => {
      // Ha már van cache-elt adat, használjuk azt
      if (cacheRef.current[language]) {
        setGroundingData(cacheRef.current[language]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/questions_grounding_${language}.json`);
        if (!response.ok) throw new Error('Failed to fetch grounding questions');
        const data = await response.json();
        
        // Cache-eljük a betöltött adatot
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

  const answers = formData.groundingCheckAnswers || {};

  // ===========================================================
  // === OPTIMALIZÁLT handleAnswerChange – O(1) hiba frissítés ===
  // ===========================================================
  const handleAnswerChange = useCallback(
    (questionId: string, value: GroundingAnswer) => {
      setFormData((currentFormData) => {
        const newAnswers = { ...(currentFormData.groundingCheckAnswers || {}), [questionId]: value };
        
        // Csak az adott kérdéshez tartozó hibát kezeljük
        let newErrors = [...(currentFormData.errors || [])].filter(
          (error) => (error as any).context !== questionId
        );

        // Ha 'not_ok', hozzáadjuk a hibát
        if (value === 'not_ok' && groundingData) {
          for (const group of groundingData.groups) {
            const question = group.questions.find((q) => q.id === questionId);
            if (question) {
              newErrors.push({
                id: `grounding_${questionId}`,
                title: language === 'hu' ? 'Földelési hiba' : 'Erdungsfehler',
                description: `${group.title}: ${question.text}`,
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
    [setFormData, groundingData, language]
  );

  // OPTIMALIZÁCIÓ: useMemo a számított értékekhez
  const totalQuestions = useMemo(
    () => groundingData?.groups.reduce((sum, group) => sum + group.questions.length, 0) || 0,
    [groundingData]
  );

  const answeredQuestions = Object.keys(answers).length;
  
  const progressPercent = useMemo(
    () => (totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0),
    [answeredQuestions, totalQuestions]
  );

  const canProceed = useMemo(
    () =>
      groundingData
        ? groundingData.groups.every((group) =>
            group.questions.every((question) =>
              Object.prototype.hasOwnProperty.call(answers, question.id)
            )
          ) && totalQuestions > 0
        : false,
    [groundingData, answers, totalQuestions]
  );

  // OPTIMALIZÁCIÓ: Async mentés requestIdleCallback-kel
  const handleManualSave = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
      const saveData = () => {
        localStorage.setItem('otis-protocol-form-data', JSON.stringify(formData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      };
      
      // Ha elérhető, használjunk requestIdleCallback-et
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(saveData);
      } else {
        setTimeout(saveData, 0);
      }
    }, 400);
  }, [formData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {language === 'hu' ? 'Betöltés folyamatban...' : 'Wird geladen...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface">
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
              {language === 'hu' ? 'Földelési Mérések' : 'Erdungskontrolle'}
            </h2>
            <div className="text-sm text-gray-600">
              {answeredQuestions} / {totalQuestions}{' '}
              {language === 'hu' ? 'kitöltve' : 'ausgefüllt'}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            {language === 'hu'
              ? 'Minden mérési pontnál jelölje be a megfelelő választ. A "Nem OK" válaszok automatikusan bekerülnek a hibalistába.'
              : 'Wählen Sie bei jedem Messpunkt die entsprechende Antwort. "Nicht OK" Antworten werden automatisch zur Fehlerliste hinzugefügt.'}
          </p>
        </div>

        <div className="space-y-6">
          {groundingData?.groups.map((group) => (
            <Card key={group.id} className="shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* OPTIMALIZÁCIÓ: Memoizált komponensek használata */}
                {group.questions.map((q) => (
                  <GroundingQuestionItem
                    key={q.id}
                    question={q}
                    currentAnswer={answers[q.id]}
                    language={language}
                    onChange={handleAnswerChange}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
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
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {saveStatus === 'saving'
                  ? language === 'hu'
                    ? 'Mentés...'
                    : 'Speichern...'
                  : saveStatus === 'saved'
                  ? language === 'hu'
                    ? 'Mentve'
                    : 'Gespeichert'
                  : language === 'hu'
                  ? 'Mentés'
                  : 'Speichern'}
              </span>
            </Button>

            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>
                {language === 'hu'
                  ? 'Tovább a Niedervolt mérésekhez'
                  : 'Weiter zu Niedervolt Messungen'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
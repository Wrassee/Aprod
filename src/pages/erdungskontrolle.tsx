import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/PageHeader';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Check, X } from 'lucide-react';
import { FormData } from '@/lib/types';
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

  // Load grounding questions from JSON
  useEffect(() => {
    const loadGroundingQuestions = async () => {
      try {
        const response = await fetch(`/questions_grounding_${language}.json`);
        if (!response.ok) throw new Error('Failed to fetch grounding questions');
        const data = await response.json();
        setGroundingData(data);
      } catch (error) {
        console.error('Error loading grounding questions:', error);
        // Fallback to empty structure
        setGroundingData({ groups: [] });
      } finally {
        setLoading(false);
      }
    };

    loadGroundingQuestions();
  }, [language]);

  // Get current answers
  const answers = formData.groundingCheckAnswers || {};

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: boolean) => {
    const newAnswers = { ...answers, [questionId]: value };
    
    // Find the question text for error handling
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

    // Handle error list updates (both formData.errors and global protocol-errors)
    let newErrors = [...(formData.errors || [])];
    const existingErrorIndex = newErrors.findIndex(error => 
      (error as any).context === questionId
    );

    // Also handle global error list for consistency with other components
    let globalErrors = [];
    try {
      globalErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
    } catch (e) {
      globalErrors = [];
    }
    const globalErrorIndex = globalErrors.findIndex((error: any) => 
      error.context === questionId
    );

    if (!value) { // "Nem OK" selected
      if (existingErrorIndex === -1) {
        // Add new error to formData.errors
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
        // Also add to global error list
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
    } else { // "OK" selected
      if (existingErrorIndex !== -1) {
        // Remove existing error from formData.errors
        newErrors.splice(existingErrorIndex, 1);
      }

      if (globalErrorIndex !== -1) {
        // Also remove from global error list
        globalErrors.splice(globalErrorIndex, 1);
        localStorage.setItem('protocol-errors', JSON.stringify(globalErrors));
        window.dispatchEvent(new CustomEvent('protocol-errors-updated', { detail: globalErrors }));
      }
    }

    // Update form data
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

  // Calculate progress
  const totalQuestions = groundingData?.groups.reduce((sum, group) => sum + group.questions.length, 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Check if can proceed (all questions answered)
  const canProceed = answeredQuestions === totalQuestions && totalQuestions > 0;

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
        // AI Segítő props:
        currentPage={5}
        formData={formData}
        currentQuestionId="grounding-check"
        errors={formData.errors || []}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-dark-text">
              {language === 'hu' 
                ? 'Földelési Mérések Ellenőrzése' 
                : 'Erdungsmessungen Kontrolle'}
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

        {/* Groups and Questions */}
        <div className="space-y-6">
          {groundingData?.groups.map((group) => (
            <Card key={group.id} className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {group.questions.map((question) => {
                    const currentAnswer = answers[question.id];
                    const hasError = currentAnswer === undefined;
                    
                    return (
                      <div key={question.id} className={`p-4 border-2 rounded-lg transition-colors ${
                        hasError ? 'border-orange-200 bg-orange-50' :
                        currentAnswer === true ? 'border-green-200 bg-green-50' :
                        currentAnswer === false ? 'border-red-200 bg-red-50' :
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <Label className="text-base font-medium text-dark-text flex-1">
                            {question.text}
                          </Label>
                          {currentAnswer === true && <Check className="h-5 w-5 text-green-600" />}
                          {currentAnswer === false && <X className="h-5 w-5 text-red-600" />}
                        </div>
                        
                        <RadioGroup
                          value={currentAnswer?.toString() || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value="true" 
                              id={`${question.id}_ok`}
                              className="text-green-600"
                            />
                            <Label 
                              htmlFor={`${question.id}_ok`} 
                              className="text-green-600 font-medium cursor-pointer"
                            >
                              OK
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value="false" 
                              id={`${question.id}_not_ok`}
                              className="text-red-600"
                            />
                            <Label 
                              htmlFor={`${question.id}_not_ok`} 
                              className="text-red-600 font-medium cursor-pointer"
                            >
                              {language === 'hu' ? 'Nem OK' : 'Nicht OK'}
                            </Label>
                          </div>
                        </RadioGroup>

                        {currentAnswer === false && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                            {language === 'hu' 
                              ? '⚠️ Ez a hiba automatikusan hozzáadva a hibalistához'
                              : '⚠️ Dieser Fehler wurde automatisch zur Fehlerliste hinzugefügt'
                            }
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

        {/* Action buttons */}
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
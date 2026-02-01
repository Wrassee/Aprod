import { memo, useCallback, useState } from 'react';
import { Question, AnswerValue } from '../../shared/schema.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StyledRadioGroup } from './StyledRadioGroup';
import { Camera, Image, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { StableInput } from './stable-input';

interface IsolatedQuestionProps {
  question: Question;
  value?: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onImageUpload?: (files: File[]) => void;
  images?: string[];
}

const IsolatedQuestionComponent = memo(({
  question,
  value,
  onChange,
  onImageUpload,
  images = []
}: IsolatedQuestionProps) => {
  const { t } = useLanguageContext();
  const { theme } = useTheme();
  
  // Fókusz állapot követése - MINDEN kérdésen
  const [isFocused, setIsFocused] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onImageUpload) {
      onImageUpload(files);
    }
  }, [onImageUpload]);

  const handleEnterKeyNavigation = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const focusableElements = document.querySelectorAll(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const currentIndex = Array.from(focusableElements).indexOf(e.currentTarget);
      const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
      if (nextElement) {
        nextElement.focus();
        if (nextElement.tagName === 'INPUT') {
          (nextElement as HTMLInputElement).select();
        }
      }
    }
  }, []);

  const renderInput = useCallback(() => {
    // Radio-alapú komponensek kezelése
    if (question.type === 'radio' || question.type === 'checkbox' || question.type === 'yes_no_na' || question.type === 'true_false') {
      let options: Array<{ value: string; label: string }> = [];
      
      switch (question.type) {
        case 'radio':
        case 'true_false':
          options = [
            { value: 'true', label: t("yes") || 'Igen' },
            { value: 'false', label: t("no") || 'Nem' }
          ];
          break;
          
        case 'checkbox':
        case 'yes_no_na':
          options = [
            { value: 'yes', label: t("yes") || 'Igen' },
            { value: 'no', label: t("no") || 'Nem' },
            { value: 'na', label: t("notApplicable") || 'N.A.' }
          ];
          break;
      }
      
      return (
        <div className="flex justify-center py-2">
          <StyledRadioGroup
            questionId={question.id}
            value={value?.toString() || ''}
            onChange={onChange}
            options={options}
          />
        </div>
      );
    }
    
    // Speciális esetek - Calculated field
    if (question.type === 'calculated') {
      if (theme === 'modern') {
        return (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-blue-50/50 to-cyan-50/30 p-4 border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  Számított mező
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Értéket automatikusan meghatározza a rendszer
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Számított mező - értéket automatikusan meghatározza
            </p>
          </div>
        );
      }
    }
    
    // Minden más input típus esetén a StableInput komponenst használjuk
    return (
      <StableInput
        questionId={question.id}
        type={question.type as 'text' | 'number' | 'measurement' | 'select' | 'select_extended' | 'multi_select' | 'date' | 'time'}
        value={value?.toString() || ''}
        onChange={onChange}
        placeholder={question.placeholder}
        onKeyDown={handleEnterKeyNavigation}
        options={question.options}
        required={question.required}
        min={question.min_value}
        max={question.max_value}
        maxLength={question.maxLength}
        unit={question.unit}
        calculationConfig={question.calculationConfig}
      />
    );
  }, [question, value, onChange, t, theme, handleEnterKeyNavigation]);

  // MODERN THEME RENDER - Vastag kék gradient keret MINDEN kérdésen fókuszban
  if (theme === 'modern') {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
          isFocused 
            ? 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1' 
            : 'bg-transparent p-0'
        }`}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={() => setIsFocused(false)}
      >
        {/* Glow animation - csak fókusz esetén */}
        {isFocused && (
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        )}
        
        <Card className={`relative bg-white rounded-2xl transition-all duration-300 ${
          isFocused ? 'border-0' : 'border-2 border-gray-200 hover:border-blue-300'
        }`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  {question.title}
                  {question.required && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold">
                      *
                    </span>
                  )}
                </h3>
                
                {renderInput()}
              </div>
              
              {onImageUpload && (
                <div className="border-t-2 border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-600" />
                      {t("attachPhotos") || 'Fotók csatolása'}
                    </span>
                    <button
                      type="button"
                      onClick={() => document.getElementById(`file-${question.id}`)?.click()}
                      className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                        <Camera className="h-4 w-4" />
                        {t("selectFiles") || 'Fájlok kiválasztása'}
                      </span>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                    </button>
                  </div>
                  
                  <input
                    id={`file-${question.id}`}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                          <img
                            src={image}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Image className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="absolute bottom-2 left-2 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Kép #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CLASSIC THEME RENDER
  return (
    <Card className="w-full shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              {question.title}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            
            {renderInput()}
          </div>
          
          {onImageUpload && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {t("attachPhotos") || 'Fotók csatolása'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-${question.id}`)?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t("selectFiles") || 'Fájlok kiválasztása'}
                </Button>
              </div>
              
              <input
                id={`file-${question.id}`}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <div className="absolute top-1 right-1 bg-white rounded-full p-1">
                        <Image className="h-3 w-3 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export const IsolatedQuestion = memo(IsolatedQuestionComponent);
IsolatedQuestion.displayName = 'IsolatedQuestion';
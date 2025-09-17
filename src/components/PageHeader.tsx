// src/components/PageHeader.tsx
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PageHeaderProps {
  title?: string;
  onHome?: () => void;
  onAdminAccess?: () => void;
  onStartNew?: () => void;
  progressPercent?: number; // 0-100
  language?: 'hu' | 'de';
  receptionDate?: string;
  onReceptionDateChange?: (date: string) => void;
  // ÚJ PROPOK az egységes progress kezeléshez
  totalSteps?: number;
  currentStep?: number;
  stepType?: 'questionnaire' | 'niedervolt';
  progressText?: string; // Custom progress text (optional)
}

const PageHeader: FC<PageHeaderProps> = ({
  title = "OTIS APROD - Átvételi Protokoll",
  onHome,
  onAdminAccess,
  onStartNew,
  progressPercent = 0,
  language = 'hu',
  receptionDate,
  onReceptionDateChange,
  totalSteps,
  currentStep,
  stepType = 'questionnaire',
  progressText,
}) => {
  // Számítsd ki az egységes progress százalékot
  const calculateUnifiedProgress = (): number => {
    if (totalSteps && currentStep !== undefined) {
      if (stepType === 'questionnaire') {
        // Kérdés oldalak: 0 - (totalSteps-1)/totalSteps * 100
        const questionnaireProgress = (currentStep / totalSteps) * 100;
        return Math.round(questionnaireProgress);
      } else if (stepType === 'niedervolt') {
        // Niedervolt oldal: (totalSteps-1)/totalSteps * 100 - 100%
        const baseProgress = ((totalSteps - 1) / totalSteps) * 100;
        const niedervoltProgress = baseProgress + (progressPercent * (100 - baseProgress) / 100);
        return Math.round(niedervoltProgress);
      }
    }
    
    // Fallback: eredeti progressPercent
    return Math.round(progressPercent);
  };

  const unifiedProgress = calculateUnifiedProgress();

  // Progress text logika
  const getProgressText = (): string => {
    if (progressText) {
      return progressText;
    }

    if (totalSteps && currentStep !== undefined) {
      if (stepType === 'questionnaire') {
        return language === 'hu' 
          ? `Kérdések: ${currentStep + 1}. oldal / ${totalSteps} lépés` 
          : `Fragen: Seite ${currentStep + 1} / ${totalSteps} Schritte`;
      } else if (stepType === 'niedervolt') {
        return language === 'hu' 
          ? `Utolsó lépés: Niedervolt táblázat` 
          : `Letzter Schritt: Niedervolt Tabelle`;
      }
    }

    return language === 'hu' ? 'Folyamat' : 'Fortschritt';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Felső sor: Logo + Home + Cím + Gombok */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <img
              src="/otis-elevators-seeklogo_1753525178175.png"
              alt="OTIS Logo"
              className="h-12 w-12"
            />
            {onHome && (
              <Home
                className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={onHome}
              />
            )}
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {receptionDate !== undefined && onReceptionDateChange && (
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-600">
                  {language === 'hu' ? 'Átvétel dátuma' : 'Übernahmedatum'}
                </Label>
                <Input
                  type="date"
                  value={receptionDate}
                  onChange={(e) => onReceptionDateChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
            {onStartNew && (
              <Button
                onClick={onStartNew}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Új protokoll</span>
              </Button>
            )}
            {onAdminAccess && (
              <Settings
                className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={onAdminAccess}
              />
            )}
          </div>
        </div>

        {/* Alsó sor: Egységes Folyamatjelző */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-blue-700">{getProgressText()}</span>
          <span className="text-base font-medium text-blue-700">{unifiedProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${unifiedProgress}%` }}
          />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
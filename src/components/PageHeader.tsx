// src/components/PageHeader.tsx
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SmartHelpWizard } from "@/components/smart-help-wizard";
import { useLanguageContext } from "@/components/language-provider";

interface PageHeaderProps {
  title?: string;
  onHome?: () => void;
  onAdminAccess?: () => void;
  onStartNew?: () => void;
  progressPercent?: number;
  receptionDate?: string;
  onReceptionDateChange?: (date: string) => void;
  totalSteps?: number;
  currentStep?: number;
  stepType?: "questionnaire" | "niedervolt";
  progressText?: string;
  showProgress?: boolean;
  currentPage?: number;
  formData?: any;
  currentQuestionId?: string;
  errors?: any[];
}

const PageHeader: FC<PageHeaderProps> = ({
  title,
  onHome,
  onAdminAccess,
  onStartNew,
  progressPercent = 0,
  receptionDate,
  onReceptionDateChange,
  totalSteps,
  currentStep,
  stepType = "questionnaire",
  progressText,
  showProgress = true,
  currentPage = 1,
  formData = {},
  currentQuestionId,
  errors = [],
}) => {
  // === HASZNÁLJUK A NYELVI KONTEXTUST ===
  const { language, t } = useLanguageContext();

  // === DINAMIKUS CÍM ===
  const displayTitle = title || t.title || "OTIS APROD - Protokoll";

  // === EGYSÉGES PROGRESS KALKULÁCIÓ ===
  const calculateUnifiedProgress = (): number => {
    if (totalSteps && currentStep !== undefined) {
      if (stepType === "questionnaire") {
        const questionnaireProgress = (currentStep / totalSteps) * 100;
        return Math.round(questionnaireProgress);
      } else if (stepType === "niedervolt") {
        const baseProgress = ((totalSteps - 1) / totalSteps) * 100;
        const niedervoltProgress =
          baseProgress + (progressPercent * (100 - baseProgress)) / 100;
        return Math.round(niedervoltProgress);
      }
    }
    return Math.round(progressPercent);
  };

  const unifiedProgress = calculateUnifiedProgress();

  // === PROGRESS SZÖVEG DINAMIKUS FORDÍTÁSSAL ===
  const getProgressText = (): string => {
    if (progressText) return progressText;
    if (totalSteps && currentStep !== undefined) {
      return language === "hu"
        ? `Folyamat: ${currentStep + 1} / ${totalSteps}`
        : `Fortschritt: ${currentStep + 1} / ${totalSteps}`;
    }
    return language === "hu" ? "Folyamat" : "Fortschritt";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* ===== FELSŐ SOR ===== */}
        <div className="flex items-center justify-between mb-4 w-full">

          {/* ----- 1. BAL OLDAL ----- */}
          <div className="flex-1 flex justify-start items-center space-x-2 overflow-hidden">
            <img
              src="/otis-elevators-seeklogo_1753525178175.png"
              alt="OTIS Logo"
              className="h-12 w-12 flex-shrink-0"
            />
            {onHome && (
              <Home
                className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-600 flex-shrink-0"
                onClick={onHome}
              />
            )}
            <h1 className="text-[17px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                {displayTitle}
                </h1>
          </div>

          {/* ----- 3. JOBB OLDAL ----- */}
          <div className="flex-1 flex justify-end items-center space-x-4">
            {receptionDate !== undefined && onReceptionDateChange && (
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  {t.receptionDate ||
                    (language === "hu"
                      ? "Átvétel dátuma"
                      : "Übernahmedatum")}
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
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{t.startNew || "Új protokoll"}</span>
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

        {/* ===== ALSÓ SOR: PROGRESS BAR ===== */}
        {showProgress && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-blue-700">
                {getProgressText()}
              </span>
              <span className="text-base font-medium text-blue-700">
                {unifiedProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${unifiedProgress}%` }}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default PageHeader;

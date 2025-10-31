// src/components/PageHeader.tsx
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
}) => {
  const { language, t } = useLanguageContext();

  const displayTitle = title || t.title || "OTIS APROD - Protokoll";

  // Unified progress calculation
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
    <header className="relative bg-white dark:bg-gray-900 shadow-lg border-b-2 border-blue-100 dark:border-blue-900/50 sticky top-0 z-50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-4">
        {/* TOP ROW */}
        <div className="flex items-center justify-between mb-4 w-full gap-4">
          
          {/* LEFT SIDE - Logo as Home Button + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* OTIS Logo -ClickAble Home Button */}
            <button
              onClick={onHome}
              className="group relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              aria-label="Home"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
              
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-lg group-hover:shadow-xl transition-shadow">
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/otis-elevators-seeklogo_1753525178175.png"
                    alt="OTIS Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {language === 'hu' ? 'Kezdőlap' : 'Startseite'}
              </div>
            </button>

            {/* Title with gradient */}
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent truncate">
              {displayTitle}
            </h1>
          </div>

          {/* RIGHT SIDE - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Reception Date */}
            {receptionDate !== undefined && onReceptionDateChange && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {t.receptionDate || (language === "hu" ? "Átvétel" : "Übernahme")}
                </Label>
                <Input
                  type="date"
                  value={receptionDate}
                  onChange={(e) => onReceptionDateChange(e.target.value)}
                  className="w-auto border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Start New Button */}
            {onStartNew && (
              <button
                onClick={onStartNew}
                className="group relative overflow-hidden px-4 py-2 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Content */}
                <div className="relative flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                  <span className="hidden sm:inline">{t.startNew || "Új protokoll"}</span>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
              </button>
            )}

            {/* Settings Button */}
            {onAdminAccess && (
              <button
                onClick={onAdminAccess}
                className="group relative w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform group-hover:rotate-90 duration-300" />
                
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {language === 'hu' ? 'Beállítások' : 'Einstellungen'}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Reception Date (below on small screens) */}
        {receptionDate !== undefined && onReceptionDateChange && (
          <div className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {t.receptionDate || (language === "hu" ? "Átvétel dátuma" : "Übernahmedatum")}
            </Label>
            <Input
              type="date"
              value={receptionDate}
              onChange={(e) => onReceptionDateChange(e.target.value)}
              className="flex-1 border-blue-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* PROGRESS BAR */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                {getProgressText()}
              </span>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {unifiedProgress}%
              </span>
            </div>
            
            {/* Modern Progress Bar */}
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${unifiedProgress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
              
              {/* Glow effect at progress end */}
              {unifiedProgress > 5 && (
                <div 
                  className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-cyan-300/50 blur-sm"
                  style={{ left: `${Math.max(0, unifiedProgress - 5)}%` }}
                ></div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
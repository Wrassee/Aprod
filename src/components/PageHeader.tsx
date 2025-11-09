// src/components/PageHeader.tsx
import { FC } from "react";
// CLASSIC importok
import { Button } from "@/components/ui/button";
// MODERN/COMMON importok
import { RotateCcw, Settings, Home, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// CLASSIC (bár nem használt a JSX-ben, de az interfész része volt)
import { SmartHelpWizard } from "@/components/smart-help-wizard";
// KÖZÖS importok
import { useLanguageContext } from "@/components/language-context";
// TÉMA import
import { useTheme } from "@/contexts/theme-context";

// Az interfész a classic verzióból származik, mivel az tartalmazott minden propot
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
  currentPage = 1, // Prop nem használt a JSX-ben, de megtartva
  formData = {}, // Prop nem használt a JSX-ben, de megtartva
  currentQuestionId, // Prop nem használt a JSX-ben, de megtartva
  errors = [], // Prop nem használt a JSX-ben, de megtartva
}) => {
  // === NYELVI KONTEXTUS ===
  const { language, t } = useLanguageContext();
  
  // === TÉMA KONTEXTUS ===
  const { theme } = useTheme();
  
  // === DINAMIKUS CÍM ===
  const displayTitle = title || t.title || "OTIS APROD - Protokoll";

  // === EGYSÉGES PROGRESS KALKULÁCIÁ ===
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

  // === TÉMA ALAPÚ RENDERELÉS ===

  // -------------------------
  // |    MODERN OTIS TÉMA   |
  // -------------------------
  if (theme === 'modern') {
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
  }

  // -------------------------
  // |     CLASSIC TÉMA      |
  // -------------------------
  // (Alapértelmezett return)
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


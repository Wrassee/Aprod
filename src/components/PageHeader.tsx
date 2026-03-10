// src/components/PageHeader.tsx - RESZPONZÍV CÍM JAVÍTÁS (Mobil: Rövid, PC: Hosszú)

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings, Sparkles, CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from "@/contexts/theme-context";
import { format, parse, isValid } from "date-fns";
import { hu, de, enUS, fr, it } from "date-fns/locale";
import type { Locale } from "date-fns";

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
  const { theme } = useTheme();
  
  // Biztonságos fordítás segédfüggvény (hogy ne legyen [object Object] vagy null)
  const safeT = (key: string, fallback: string): string => {
    const val = t(key);
    return typeof val === 'string' ? val : fallback;
  };

  const displayTitle = title || safeT("title", "OTIS APROD - Protokoll");

  const dateLocaleMap: Record<string, Locale> = { hu, de, en: enUS, fr, it };
  const dateLocale = dateLocaleMap[language] || hu;

  const parsedDate = receptionDate
    ? parse(receptionDate, 'yyyy-MM-dd', new Date())
    : undefined;
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  const handleCalendarSelect = (day: Date | undefined) => {
    if (day && onReceptionDateChange) {
      onReceptionDateChange(format(day, 'yyyy-MM-dd'));
    }
  };

  const formattedDate = selectedDate
    ? format(selectedDate, 'PP', { locale: dateLocale })
    : safeT("receptionDate", "Átvétel dátuma");

  const DatePickerButton = ({ className: btnClass }: { className?: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={btnClass || "flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"}
        >
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formattedDate}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0 border-0 bg-transparent shadow-none">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          locale={dateLocale}
          defaultMonth={selectedDate || new Date()}
        />
      </PopoverContent>
    </Popover>
  );

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
    const progressLabel = safeT("progress", "Folyamat");
    if (totalSteps && currentStep !== undefined) {
      return `${progressLabel}: ${currentStep + 1} / ${totalSteps}`;
    }
    return progressLabel;
  };

  // -------------------------
  // |     MODERN OTIS TÉMA   |
  // -------------------------
  if (theme === 'modern') {
    return (
      <header className="relative bg-white dark:bg-gray-900 shadow-lg border-b-2 border-blue-100 dark:border-blue-900/50 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4 w-full gap-4">
            
            {/* LEFT SIDE */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {onHome && (
                <button
                  onClick={onHome}
                  className="group relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  aria-label="Home"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-lg group-hover:shadow-xl transition-shadow">
                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src="/otis-logo.png"
                        onError={(e) => {
                           // Fallback ha a png nem töltene be, bár elvileg jó a path
                           (e.target as HTMLImageElement).src = "/otis-elevators-seeklogo_1753525178175.png"; 
                        }}
                        alt="OTIS Logo"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {safeT("home", "Kezdőlap")}
                  </div>
                </button>
              )}

              {/* 🔥 MÓDOSÍTÁS: MOBILON RÖVID CÍM, PC-N HOSSZÚ 🔥 */}
              <div className="flex flex-col justify-center min-w-0">
                {/* Mobilon ez látszik: Csak "OTIS APROD" */}
                <h1 className="md:hidden text-lg font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent truncate">
                  OTIS APROD
                </h1>
                
                {/* PC-n/Tableten ez látszik: Teljes cím */}
                <h1 className="hidden md:block text-xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent truncate">
                  {displayTitle}
                </h1>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {receptionDate !== undefined && onReceptionDateChange && (
                <div className="hidden lg:block">
                  <DatePickerButton />
                </div>
              )}

              {onStartNew && (
                <button
                  onClick={onStartNew}
                  className="group relative overflow-hidden px-4 py-2 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                    <span className="hidden sm:inline">{safeT("startNew", "Új indítása")}</span>
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              )}

              {onAdminAccess && (
                <button
                  onClick={onAdminAccess}
                  className="group relative w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform group-hover:rotate-90 duration-300" />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {safeT("settings", "Beállítások")}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Reception Date */}
          {receptionDate !== undefined && onReceptionDateChange && (
            <div className="lg:hidden mb-4">
              <DatePickerButton className="flex items-center gap-2 w-full px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer" />
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
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${unifiedProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
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
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4 w-full">

          <div className="flex-1 flex justify-start items-center space-x-2 overflow-hidden">
            {onHome ? (
              <button
                onClick={onHome}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label="Home"
              >
                <img
                  src="/otis-elevators-seeklogo_1753525178175.png"
                  alt="OTIS Logo"
                  className="h-12 w-12"
                />
              </button>
            ) : (
              <img
                src="/otis-elevators-seeklogo_1753525178175.png"
                alt="OTIS Logo"
                className="h-12 w-12 flex-shrink-0"
              />
            )}
            
            {/* 🔥 MÓDOSÍTÁS: MOBILON RÖVID CÍM, PC-N HOSSZÚ (CLASSIC TÉMA) 🔥 */}
            <div className="flex flex-col justify-center overflow-hidden">
              <h1 className="md:hidden text-[17px] font-semibold text-gray-800">
                OTIS APROD
              </h1>
              <h1 className="hidden md:block text-[17px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                {displayTitle}
              </h1>
            </div>
          </div>

          <div className="flex-1 flex justify-end items-center space-x-4">
            {receptionDate !== undefined && onReceptionDateChange && (
              <DatePickerButton className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 hover:border-blue-400 transition-colors cursor-pointer" />
            )}
            {onStartNew && (
              <Button
                onClick={onStartNew}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{safeT("startNew", "Új indítása")}</span>
              </Button>
            )}
            {onAdminAccess && (
              <button
                onClick={onAdminAccess}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-gray-600 hover:text-blue-600" />
              </button>
            )}
          </div>
        </div>

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
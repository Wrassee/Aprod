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
}) => {
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

        {/* Alsó sor: Folyamatjelző */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-blue-700">Folyamat</span>
          <span className="text-base font-medium text-blue-700">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;

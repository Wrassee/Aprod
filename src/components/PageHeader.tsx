import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, Save, Settings, Home, Check, X, RotateCcw } from 'lucide-react';

// Definiáljuk a szükséges prop-okat. Szinte mindent átadunk a szülőtől.
interface PageHeaderProps {
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  onHome?: () => void;
  onStartNew?: () => void;
  onAdminAccess?: () => void;
  
  // A legfontosabb új prop-ok a folyamatkezeléshez!
  currentStep: number;
  totalSteps: number;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  receptionDate,
  onReceptionDateChange,
  onHome,
  onStartNew,
  onAdminAccess,
  currentStep,
  totalSteps,
}) => {
  const { t } = useLanguageContext();
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Felső sor: logó, gombok, dátum */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img 
              src="/otis-elevators-seeklogo_1753525178175.png" 
              alt="OTIS Logo" 
              className="h-12 w-12 mr-4"
            />
            {onHome && (
              <Button variant="ghost" size="sm" onClick={onHome} className="text-gray-600 hover:text-gray-800 mr-4" title={t.home || 'Kezdőlap'}>
                <Home className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-xl font-semibold text-gray-800">OTIS APROD - Átvételi Protokoll</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Label className="text-sm font-medium text-gray-600">{t.receptionDate}</Label>
            <Input
              type="date"
              value={receptionDate}
              onChange={(e) => onReceptionDateChange(e.target.value)}
              className="w-auto"
            />
            {onStartNew && (
              <Button onClick={onStartNew} className="bg-green-600 hover:bg-green-700 text-white flex items-center" size="sm" title={t.startNew || 'Új protokoll indítása'}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t.startNew || 'Új protokoll indítása'}
              </Button>
            )}
            {onAdminAccess && (
              <Button variant="ghost" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800" title={t.admin}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Alsó sor: folyamatjelző */}
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex justify-between mb-1">
              <span className="text-base font-medium text-blue-700">
                {t.progress}
              </span>
              <span className="text-sm font-medium text-blue-700">
                {/* A megbízható, prop-ként kapott értékeket használjuk */}
                {currentStep} / {totalSteps}
              </span>
            </div>
            {/* A százalékot is az új értékekből számoljuk */}
            <Progress value={progressPercentage} className="w-full h-2.5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
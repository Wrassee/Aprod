import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageContext } from '@/components/language-provider';
import { ArrowLeft, Plus, Trash2, Save, Settings, Home, RotateCcw, Check } from 'lucide-react';
import { MeasurementRow } from '@/lib/types';
import { MegaStableInput } from '@/components/mega-stable-input';
import { QuestionGroupHeader } from '@/components/question-group-header';

// --- MÓDOSÍTÁS: Definiáljuk az összes localStorage kulcsot egy helyen ---
const LOCAL_STORAGE_KEYS = {
  measurements: 'niedervolt-measurements',
  tableMeasurements: 'niedervolt-table-measurements',
  selectedDevices: 'niedervolt-selected-devices',
  customDevices: 'niedervolt-custom-devices'
};

const MEASUREMENT_TYPES = {
  hu: [ { id: 'isolation', name: 'Isolationsmessung', unit: 'Ohm' }, /* ...többi... */ ],
  de: [ { id: 'isolation', name: 'Isolationsmessung', unit: 'Ohm' }, /* ...többi... */ ]
};

interface NiedervoltMeasurementsProps {
  measurements: MeasurementRow[];
  onMeasurementsChange: (measurements: MeasurementRow[]) => void;
  onBack: () => void;
  onNext: () => void;
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  onAdminAccess?: () => void;
  onHome?: () => void;
  onStartNew?: () => void;
}

export function NiedervoltMeasurements({
  measurements,
  onMeasurementsChange,
  onBack,
  onNext,
  receptionDate,
  onReceptionDateChange,
  onAdminAccess,
  onHome,
  onStartNew,
}: NiedervoltMeasurementsProps) {
  const { t, language } = useLanguageContext();
  const nextIdRef = useRef(Date.now());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.measurements);
    if (saved && measurements.length === 0) {
      try {
        onMeasurementsChange(JSON.parse(saved));
      } catch (e) { console.error('Error loading saved measurements:', e); }
    }
  }, [measurements.length, onMeasurementsChange]);

  const measurementTypes = MEASUREMENT_TYPES[language] || MEASUREMENT_TYPES.hu;

  const addNewRow = () => { /* ... (változatlan) ... */ };
  const removeRow = (rowId: string) => { /* ... (változatlan) ... */ };
  const stableUpdateFunctions = useMemo(() => { /* ... (változatlan) ... */ }, [measurements, measurementTypes, onMeasurementsChange]);

  const saveToStorage = async () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.measurements, JSON.stringify(measurements));
      onMeasurementsChange(measurements);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving niedervolt measurements:', error);
      setSaveStatus('error');
    }
  };

  // --- MÓDOSÍTÁS: Új funkció, ami törli az összes releváns adatot ---
  const handleStartNew = () => {
    if (window.confirm(language === 'hu' ? 'Biztosan új protokollt kezd? Minden nem mentett adat törlődik.' : 'Neues Protokoll starten? Alle ungespeicherten Daten gehen verloren.')) {
      console.log('Clearing all Niedervolt data from localStorage...');
      // Töröljük az összes kapcsolódó localStorage bejegyzést
      Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Meghívjuk a szülőtől kapott eredeti funkciót (ami valószínűleg oldalt vált vagy állapotot töröl)
      if (onStartNew) {
        onStartNew();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* ... (Logo, Home, Title) ... */}
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-gray-600">{t.receptionDate}</Label>
              <Input
                type="date"
                value={receptionDate}
                onChange={(e) => onReceptionDateChange(e.target.value)}
                className="w-auto"
              />
              {onStartNew && (
                <Button
                  // --- MÓDOSÍTÁS: Az új törlő funkciót hívjuk meg ---
                  onClick={handleStartNew} 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                  size="sm"
                  title={t.startNew || 'Új protokoll indítása'}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t.startNew || 'Új protokoll'}
                </Button>
              )}
              {onAdminAccess && (
                <Button variant="ghost" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800" title="Admin">
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ... (A JSX kód többi része változatlan) ... */}
      </main>
    </div>
  );
}
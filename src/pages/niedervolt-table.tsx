// src/pages/niedervolt-table.tsx - THEME AWARE VERSION WITH STICKY HEADER FIX
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useLanguageContext } from "@/components/language-context";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Save, Settings, Check, Plus, Trash2, Filter, Sparkles, CheckCircle, BarChart3, Zap } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { NiedervoltMeasurement } from '@/types/niedervolt-devices';
import { FormData } from '@/lib/types';
import { InfinityInput } from '@/components/InfinityInput';
import { TypeSelectorInput } from '@/components/TypeSelectorInput';
import { useTheme } from '@/contexts/theme-context';

interface CustomDevice {
  id: string;
  name: { de: string; hu: string };
}

interface NiedervoltTableProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  measurements: Record<string, NiedervoltMeasurement>;
  onMeasurementsChange: (measurements: Record<string, NiedervoltMeasurement>) => void;
  onBack: () => void;
  onNext: () => void;
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  onAdminAccess?: () => void;
  onHome?: () => void;
  onStartNew?: () => void;
  totalProtocolSteps?: number;
  currentProtocolStep?: number;
}

export function NiedervoltTable({
  formData,
  setFormData,
  measurements,
  onMeasurementsChange,
  onBack,
  onNext,
  receptionDate,
  onReceptionDateChange,
  onAdminAccess,
  onHome,
  onStartNew,
  totalProtocolSteps,
  currentProtocolStep,
}: NiedervoltTableProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const { data: niedervoltData, isLoading } = useQuery({
    queryKey: ['/api/niedervolt/devices'],
    retry: 1,
  });

  const devices = (niedervoltData as any)?.devices || [];
  const dropdownOptions = (niedervoltData as any)?.dropdownOptions || {
    biztositek: [],
    kismegszakito: [],
    fiTest: []
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleClear = () => {
      onMeasurementsChange({});
      setSelectedDevices(new Set());
      setCustomDevices([]);
      setIsInitialized(false);
    };
    window.addEventListener('protocolClear', handleClear);
    return () => {
      window.removeEventListener('protocolClear', handleClear);
    };
  }, [onMeasurementsChange]);

  useEffect(() => {
    if (devices.length > 0 && !isInitialized) {
      const savedMeasurements = localStorage.getItem('niedervolt-table-measurements');
      const savedDeviceSelection = localStorage.getItem('niedervolt-selected-devices');
      const savedCustomDevices = localStorage.getItem('niedervolt-custom-devices');
      
      if (savedMeasurements && Object.keys(measurements).length === 0) {
        try { onMeasurementsChange(JSON.parse(savedMeasurements)); } catch (e) { console.error('Error loading measurements:', e); }
      }
      
      if (savedDeviceSelection) {
        try {
          const savedArray = JSON.parse(savedDeviceSelection) as string[];
          const savedSet = new Set(savedArray);
          setSelectedDevices(savedSet);
        } catch (e) {
          setSelectedDevices(new Set(devices.slice(0, 7).map((d: any) => d.id)));
        }
      } else {
        setSelectedDevices(new Set(devices.slice(0, 7).map((d: any) => d.id)));
      }
      
      if (savedCustomDevices) {
        try { setCustomDevices(JSON.parse(savedCustomDevices)); } catch (e) { console.error('Error loading custom devices:', e); }
      }
      
      setIsInitialized(true);
    }
  }, [devices, isInitialized, onMeasurementsChange, measurements]);

  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements)); } }, [measurements, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-selected-devices', JSON.stringify(Array.from(selectedDevices))); } }, [selectedDevices, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-custom-devices', JSON.stringify(customDevices)); } }, [customDevices, isInitialized]);

  const getDeviceName = (device: any) => {
    if (device.name && typeof device.name === 'object') {
      // Support 5 languages with fallback to DE
      return device.name[language] || device.name.de || device.name.hu || '';
    }
    // Legacy format support
    const langMap: Record<string, string> = {
      hu: device.nameHU || device.name?.hu || '',
      de: device.nameDE || device.name?.de || '',
      en: device.nameEN || device.name?.en || device.nameDE || device.name?.de || '',
      fr: device.nameFR || device.name?.fr || device.nameDE || device.name?.de || '',
      it: device.nameIT || device.name?.it || device.nameDE || device.name?.de || ''
    };
    return langMap[language] || langMap.de;
  };

  const updateMeasurement = useCallback(
    (deviceId: string, field: keyof NiedervoltMeasurement, value: string) => {
      const numericOnlyFields: (keyof NiedervoltMeasurement)[] = [
        'iccLN',
        'iccLPE',
        'fiIn',
        'fiDin',
      ];
      let cleanValue = value;

      if (numericOnlyFields.includes(field)) {
        if (value !== '-') {
          cleanValue = value.replace(/[^0-9.]/g, '');
        }
      }
      
      const current = measurements[deviceId] || {};
      const updated: NiedervoltMeasurement = {
        ...current,
        deviceId: deviceId,
        [field]: cleanValue,
      };

      if (field === 'biztositek' && cleanValue !== '') {
        updated.kismegszakito = '';
      }
      if (field === 'kismegszakito' && cleanValue !== '') {
        updated.biztositek = '';
      }

      const newMeasurements: Record<string, NiedervoltMeasurement> = {
        ...measurements,
        [deviceId]: updated,
      };
      onMeasurementsChange(newMeasurements);
    },
    [measurements, onMeasurementsChange]
  );
    
  const getFieldLabel = (field: string) => {
    const labels: Record<string, Record<string, string>> = {
      nevlegesAram: { hu: 'Névleges áram (A)', de: 'Nennstrom (A)', en: 'Rated current (A)', fr: 'Courant nominal (A)', it: 'Corrente nominale (A)' },
      tipusjelzes: { hu: 'Típusjelzés', de: 'Merkmal', en: 'Type marking', fr: 'Marquage type', it: 'Marcatura tipo' },
      szigetelesVizsgalat: { hu: 'Szigetelés vizsgálat (MΩ)', de: 'Isolationsprüfung (MΩ)', en: 'Insulation test (MΩ)', fr: 'Test d\'isolation (MΩ)', it: 'Test isolamento (MΩ)' },
      rovidzarasiAram: { hu: 'Rövidzárási áram (Icc)', de: 'Kurzschlussstrom (Icc)', en: 'Short-circuit current (Icc)', fr: 'Courant de court-circuit (Icc)', it: 'Corrente di cortocircuito (Icc)' },
      biztositek: { hu: 'Biztosíték', de: 'Sicherung', en: 'Fuse', fr: 'Fusible', it: 'Fusibile' },
      kismegszakito: { hu: 'Kismegszakító', de: 'LS-Schalter', en: 'Circuit breaker', fr: 'Disjoncteur', it: 'Interruttore' },
      npe: { hu: 'N-PE', de: 'N-PE', en: 'N-PE', fr: 'N-PE', it: 'N-PE' },
      l1pe: { hu: 'L1-PE', de: 'L1-PE', en: 'L1-PE', fr: 'L1-PE', it: 'L1-PE' },
      l2pe: { hu: 'L2-PE', de: 'L2-PE', en: 'L2-PE', fr: 'L2-PE', it: 'L2-PE' },
      l3pe: { hu: 'L3-PE', de: 'L3-PE', en: 'L3-PE', fr: 'L3-PE', it: 'L3-PE' },
      ln: { hu: 'L-N', de: 'L-N', en: 'L-N', fr: 'L-N', it: 'L-N' },
      lpe: { hu: 'L-PE', de: 'L-PE', en: 'L-PE', fr: 'L-PE', it: 'L-PE' },
      fiIn: { hu: 'FI In (mA)', de: 'FI In (mA)', en: 'RCD In (mA)', fr: 'DDR In (mA)', it: 'FI In (mA)' },
      fiDin: { hu: 'FI ΔIn (ms)', de: 'FI ΔIn (ms)', en: 'RCD ΔIn (ms)', fr: 'DDR ΔIn (ms)', it: 'FI ΔIn (ms)' },
      fiTest: { hu: 'FI teszt', de: 'FI Test', en: 'RCD test', fr: 'Test DDR', it: 'Test FI' },
    };
    return labels[field]?.[language] || labels[field]?.de || field;
  };

  const toggleDeviceSelection = useCallback((deviceId: string, forceState?: boolean) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      const shouldBeSelected = forceState !== undefined ? forceState : !newSet.has(deviceId);
      
      if (shouldBeSelected) { newSet.add(deviceId); } else { newSet.delete(deviceId); }
      return newSet;
    });
  }, []);

  const addCustomDevice = () => {
    const name = newDeviceName.trim();
    
    if (name) {
      const id = `custom-${Date.now()}`;
      const device: CustomDevice = { id, name: { de: name, hu: name } };
      setCustomDevices(prev => [...prev, device]);
      setSelectedDevices(prev => new Set(prev).add(id));
      setNewDeviceName('');
    }
  };

  const generateNiedervoltQuestionIds = (measurements: Record<string, NiedervoltMeasurement>) => {
    const questionAnswers: Record<string, string> = {};
    
    Object.entries(measurements).forEach(([deviceId, measurement]) => {
      const fieldMappings = [
        'biztositek', 'kismegszakito', 'tipusjelzes', 'szigetelesNPE',
        'szigetelesL1PE', 'szigetelesL2PE', 'szigetelesL3PE', 
        'iccLN', 'iccLPE', 'fiIn', 'fiDin', 'fiTest'
      ];
      
      fieldMappings.forEach(field => {
        const value = measurement[field as keyof NiedervoltMeasurement];
        if (value && value !== '') {
          const questionId = `Q_NID_${deviceId}_${field}`;
          questionAnswers[questionId] = value.toString();
        }
      });
    });
    
    return questionAnswers;
  };

  const handleSaveAndProceed = () => {
    console.log('📄 Niedervolt: Saving data and proceeding to next page...');
    
    setFormData(prev => ({
      ...prev,
      niedervoltTableMeasurements: measurements,
      answers: {
        ...prev.answers,
        ...generateNiedervoltQuestionIds(measurements)
      }
    }));

    localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements));
    
    console.log('✅ Niedervolt data saved to central formData with question IDs');
    
    onNext();
  };

  const removeCustomDevice = (deviceId: string) => {
    setCustomDevices(prev => prev.filter(d => d.id !== deviceId));
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      newSet.delete(deviceId);
      return newSet;
    });
    const newMeasurements = { ...measurements };
    delete newMeasurements[deviceId];
    onMeasurementsChange(newMeasurements);
  };

  const allDevices = [...devices, ...customDevices];
  const activeDevices = allDevices.filter(device => selectedDevices.has(device.id));
  const totalDevices = activeDevices.length;
  const filledDevices = Object.keys(measurements).filter(deviceId => {
    const measurement = measurements[deviceId];
    return measurement && selectedDevices.has(deviceId) && 
            Object.values(measurement).some(value => value && value !== deviceId);
  }).length;
  const tableProgressPercent = totalDevices > 0 ? Math.round((filledDevices / totalDevices) * 100) : 0;
  
  const handleManualSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  if (isLoading) {
    if (theme === 'modern') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ JAVÍTOTT SZERKEZET - MODERN THEME
  if (theme === 'modern') {
    return (
      <div className="min-h-screen">
        {/* ✅ PageHeader KÍVÜL (sticky működhet) */}
        <PageHeader
          receptionDate={receptionDate}
          onReceptionDateChange={onReceptionDateChange}
          onStartNew={onStartNew}
          onHome={onHome}
          onAdminAccess={onAdminAccess}
          totalSteps={totalProtocolSteps}
          currentStep={currentProtocolStep}
          stepType="niedervolt"
          progressPercent={tableProgressPercent}
        />

        {/* ✅ Görgethető tartalom (overflow-hidden itt van, de NEM takarja a headert) */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {{hu: 'Összes Eszköz', de: 'Gesamte Geräte', en: 'Total Devices', fr: 'Total Appareils', it: 'Totale Dispositivi'}[language]}
                        </p>
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        {totalDevices}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {{hu: 'Kitöltött', de: 'Ausgefüllt', en: 'Filled', fr: 'Rempli', it: 'Compilato'}[language]}
                        </p>
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                        {filledDevices}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Check className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {{hu: 'Kitöltöttség', de: 'Fortschritt', en: 'Progress', fr: 'Progression', it: 'Progresso'}[language]}
                        </p>
                      </div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                        {tableProgressPercent}%
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-2xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden">
              <CardHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {{hu: 'Niedervolt Installációk Mérései', de: 'Niedervolt Installations Messungen', en: 'Low Voltage Installation Measurements', fr: 'Mesures des Installations Basse Tension', it: 'Misure Impianti Bassa Tensione'}[language]}
                      </CardTitle>
                      <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3" />
                        Niedervolt Installations Verordnung art.14
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeviceSelector(true)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {{hu: 'Eszközök', de: 'Geräte', en: 'Devices', fr: 'Appareils', it: 'Dispositivi'}[language]} ({activeDevices.length})
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20">
                      <tr>
                        <th rowSpan={2} className="border-r border-blue-200 p-4 text-left text-sm font-bold text-blue-800 dark:text-blue-300 align-bottom min-w-[200px]">
                          {{hu: 'Eszköz / Baugruppe', de: 'Gerät / Baugruppe', en: 'Device / Assembly', fr: 'Appareil / Assemblage', it: 'Dispositivo / Gruppo'}[language]}
                        </th>
                        <th colSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">
                          {getFieldLabel('nevlegesAram')}
                        </th>
                        <th rowSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 align-bottom">
                          {getFieldLabel('tipusjelzes')}
                        </th>
                        <th colSpan={4} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">
                          {getFieldLabel('szigetelesVizsgalat')}
                        </th>
                        <th colSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">
                          {getFieldLabel('rovidzarasiAram')}
                        </th>
                        <th rowSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-green-600 dark:text-green-400 align-bottom">
                          {getFieldLabel('fiIn')}
                        </th>
                        <th rowSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-green-600 dark:text-green-400 align-bottom">
                          {getFieldLabel('fiDin')}
                        </th>
                        <th rowSpan={2} className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 align-bottom">
                          {getFieldLabel('fiTest')}
                        </th>
                      </tr>
                      <tr>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('biztositek')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('kismegszakito')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('npe')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('l1pe')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('l2pe')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('l3pe')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('ln')}</th>
                        <th className="border-r border-blue-200 p-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300">{getFieldLabel('lpe')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeDevices.map((device, index) => {
                        const measurement = measurements[device.id] || {};
                        
                        return (
                          <tr key={device.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-l-blue-500">
                            <td className="border-r border-gray-200 p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-sky-500 px-2.5 py-1 rounded-lg shadow-sm">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{getDeviceName(device)}</span>
                              </div>
                            </td>
                            {['biztositek','kismegszakito','tipusjelzes','szigetelesNPE','szigetelesL1PE','szigetelesL2PE','szigetelesL3PE','iccLN','iccLPE','fiIn','fiDin','fiTest'].map((field) => {
                              const szigetelesFields = ['szigetelesNPE', 'szigetelesL1PE', 'szigetelesL2PE', 'szigetelesL3PE'];
                              
                              return (
                                <td key={field} className="border-r border-gray-200 p-2">
                                  {field === 'biztositek' || field === 'kismegszakito' || field === 'fiTest' ? (
                                    <Select
                                      value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                      onValueChange={(value) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, value)}
                                    >
                                      <SelectTrigger className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500/20">
                                        <SelectValue placeholder="-" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(dropdownOptions[field as keyof typeof dropdownOptions] || []).map((option: string, index: number) => (
                                          <SelectItem key={index} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : szigetelesFields.includes(field) ? (
                                    <InfinityInput
                                      value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                      onChange={(value) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, value)}
                                    />
                                  ) : field === 'tipusjelzes' ? (
                                    <TypeSelectorInput
                                      value={measurement.tipusjelzes || ''}
                                      onChange={(value) => updateMeasurement(device.id, 'tipusjelzes', value)}
                                    />
                                  ) : (
                                    <Input
                                      type="text"
                                      value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                      onChange={(e) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, e.target.value)}
                                      className={`w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                                        ['tipusjelzes', 'iccLN', 'iccLPE', 'fiIn', 'fiDin'].includes(field) ? 'text-center' : ''
                                      }`}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <button
                onClick={onBack}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{{hu: 'Vissza', de: 'Zurück', en: 'Back', fr: 'Retour', it: 'Indietro'}[language]}</span>
                </div>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleManualSave}
                  disabled={saveStatus === 'saving'}
                  className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    saveStatus === 'saved' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                      : 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                        <span>{{hu: 'Mentés...', de: 'Speichern...', en: 'Saving...', fr: 'Sauvegarde...', it: 'Salvataggio...'}[language]}</span>
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>{{hu: 'Elmentve', de: 'Gespeichert', en: 'Saved', fr: 'Sauvegardé', it: 'Salvato'}[language]}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{{hu: 'Mentés', de: 'Speichern', en: 'Save', fr: 'Sauvegarder', it: 'Salva'}[language]}</span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleSaveAndProceed}
                  className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <span>{{hu: 'Tovább', de: 'Weiter', en: 'Next', fr: 'Suivant', it: 'Avanti'}[language]}</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </main>

          <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                  <Filter className="h-6 w-6 text-blue-600" />
                  {t("deviceSelection") || ({hu: 'Eszközök kiválasztása', de: 'Geräteauswahl', en: 'Device Selection', fr: 'Sélection des Appareils', it: 'Selezione Dispositivi'}[language])}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allDevices.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => toggleDeviceSelection(device.id)}
                      className={`group relative overflow-hidden rounded-xl p-4 border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedDevices.has(device.id)
                          ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-500 shadow-lg'
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-medium text-sm ${
                          selectedDevices.has(device.id) ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {getDeviceName(device)}
                        </span>
                        <div className="flex gap-2">
                          {selectedDevices.has(device.id) && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {customDevices.some(d => d.id === device.id) && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                removeCustomDevice(device.id); 
                              }}
                              className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-blue-100 pt-6">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        {{hu: 'Saját eszköz hozzáadása', de: 'Eigenes Gerät hinzufügen', en: 'Add custom device', fr: 'Ajouter un appareil personnalisé', it: 'Aggiungi dispositivo personalizzato'}[language]}
                      </h4>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative group flex-1">
                          <Input
                            placeholder={{hu: 'Eszköz neve', de: 'Gerätename', en: 'Device name', fr: 'Nom de l\'appareil', it: 'Nome dispositivo'}[language]}
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomDevice()}
                            className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse"></div>
                        </div>
                        <button
                          onClick={addCustomDevice}
                          disabled={!newDeviceName.trim()}
                          className="group relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <span>{{hu: 'Hozzáadás', de: 'Hinzufügen', en: 'Add', fr: 'Ajouter', it: 'Aggiungi'}[language]}</span>
                          </div>
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex-shrink-0 border-t-2 border-blue-100">
                <DialogClose asChild>
                  <button className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>{t("ok") || 'OK'}</span>
                    </div>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // ✅ JAVÍTOTT SZERKEZET - CLASSIC THEME
  return (
    <div className="min-h-screen">
      {/* ✅ PageHeader KÍVÜL (sticky működhet) */}
      <PageHeader
        language={language} 
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        onStartNew={onStartNew}
        onHome={onHome}
        onAdminAccess={onAdminAccess}
        totalSteps={totalProtocolSteps}
        currentStep={currentProtocolStep}
        stepType="niedervolt"
        progressPercent={tableProgressPercent}
        currentPage={5}
        formData={{ measurements }}
        currentQuestionId="niedervolt-table"
        errors={[]}
      />

      {/* ✅ Görgethető tartalom */}
      <div className="min-h-screen bg-light-surface">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">{{hu: 'Összes Eszköz', de: 'Gesamte Geräte', en: 'Total Devices', fr: 'Total Appareils', it: 'Totale Dispositivi'}[language]}</p>
                    <p className="text-3xl font-bold">{totalDevices}</p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">{{hu: 'Kitöltött', de: 'Ausgefüllt', en: 'Filled', fr: 'Rempli', it: 'Compilato'}[language]}</p>
                    <p className="text-3xl font-bold">{filledDevices}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">{{hu: 'Kitöltöttség', de: 'Fortschritt', en: 'Progress', fr: 'Progression', it: 'Progresso'}[language]}</p>
                    <p className="text-3xl font-bold">{tableProgressPercent}%</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{{hu: 'Niedervolt Installációk Mérései', de: 'Niedervolt Installations Messungen', en: 'Low Voltage Installation Measurements', fr: 'Mesures des Installations Basse Tension', it: 'Misure Impianti Bassa Tensione'}[language]}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowDeviceSelector(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  {{hu: 'Eszközök', de: 'Geräte', en: 'Devices', fr: 'Appareils', it: 'Dispositivi'}[language]} ({activeDevices.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="border border-gray-300 p-3 text-left font-semibold align-bottom">{{hu: 'Eszköz / Baugruppe', de: 'Gerät / Baugruppe', en: 'Device / Assembly', fr: 'Appareil / Assemblage', it: 'Dispositivo / Gruppo'}[language]}</th>
                      <th colSpan={2} className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('nevlegesAram')}</th>
                      <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom">{getFieldLabel('tipusjelzes')}</th>
                      <th colSpan={4} className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('szigetelesVizsgalat')}</th>
                      <th colSpan={2} className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('rovidzarasiAram')}</th>
                      <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom text-blue-600">{getFieldLabel('fiIn')}</th>
                      <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom text-blue-600">{getFieldLabel('fiDin')}</th>
                      <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom">{getFieldLabel('fiTest')}</th>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('biztositek')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('kismegszakito')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('npe')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('l1pe')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('l2pe')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('l3pe')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('ln')}</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">{getFieldLabel('lpe')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDevices.map((device) => {
                      const measurement = measurements[device.id] || {};
                      
                      return (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">{getDeviceName(device)}</td>
                          {['biztositek','kismegszakito','tipusjelzes','szigetelesNPE','szigetelesL1PE','szigetelesL2PE','szigetelesL3PE','iccLN','iccLPE','fiIn','fiDin','fiTest'].map((field) => {
                            const szigetelesFields = ['szigetelesNPE', 'szigetelesL1PE', 'szigetelesL2PE', 'szigetelesL3PE'];
                            
                            return (
                              <td key={field} className="border border-gray-300 p-2">
                                {field === 'biztositek' || field === 'kismegszakito' || field === 'fiTest' ? (
                                  <Select
                                    value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                    onValueChange={(value) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, value)}
                                  >
                                    <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                                    <SelectContent>
                                      {(dropdownOptions[field as keyof typeof dropdownOptions] || []).map((option: string, index: number) => (
                                        <SelectItem key={index} value={option}>{option}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : szigetelesFields.includes(field) ? (
                                  <InfinityInput
                                    value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                    onChange={(value) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, value)}
                                  />
                                ) : field === 'tipusjelzes' ? (
                                  <TypeSelectorInput
                                    value={measurement.tipusjelzes || ''}
                                    onChange={(value) => updateMeasurement(device.id, 'tipusjelzes', value)}
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                    onChange={(e) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, e.target.value)}
                                    className={`w-full ${
                                      ['tipusjelzes', 'iccLN', 'iccLPE', 'fiIn', 'fiDin'].includes(field) ? 'text-center' : ''
                                    }`}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {{hu: 'Vissza', de: 'Zurück', en: 'Back', fr: 'Retour', it: 'Indietro'}[language]}
            </Button>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleManualSave}
                className="border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    {{hu: 'Mentés...', de: 'Speichern...', en: 'Saving...', fr: 'Sauvegarde...', it: 'Salvataggio...'}[language]}
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {{hu: 'Elmentve', de: 'Gespeichert', en: 'Saved', fr: 'Sauvegardé', it: 'Salvato'}[language]}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {{hu: 'Mentés', de: 'Speichern', en: 'Save', fr: 'Sauvegarder', it: 'Salva'}[language]}
                  </>
                )}
              </Button> 

              <Button
                onClick={handleSaveAndProceed}
                className="bg-otis-blue text-white hover:bg-white hover:text-otis-blue border border-otis-blue"
              >
                {{hu: 'Tovább', de: 'Weiter', en: 'Next', fr: 'Suivant', it: 'Avanti'}[language]}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("deviceSelection") || ({hu: 'Eszközök kiválasztása', de: 'Geräteauswahl', en: 'Device Selection', fr: 'Sélection des Appareils', it: 'Selezione Dispositivi'}[language])}</DialogTitle>
            </DialogHeader>

            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-3 border rounded cursor-pointer transition-all ${
                      selectedDevices.has(device.id)
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDeviceSelection(device.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span>{getDeviceName(device)}</span>
                      {customDevices.some(d => d.id === device.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); removeCustomDevice(device.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 p-1">
                <h4 className="font-medium mb-2">{{hu: 'Saját eszköz hozzáadása', de: 'Eigenes Gerät hinzufügen', en: 'Add custom device', fr: 'Ajouter un appareil personnalisé', it: 'Aggiungi dispositivo personalizzato'}[language]}</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder={{hu: 'Eszköz neve', de: 'Gerätename', en: 'Device name', fr: 'Nom de l\'appareil', it: 'Nome dispositivo'}[language]}
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomDevice()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addCustomDevice}
                    disabled={!newDeviceName.trim()}
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {{hu: 'Hozzáadás', de: 'Hinzufügen', en: 'Add', fr: 'Ajouter', it: 'Aggiungi'}[language]}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex-shrink-0">
              <DialogClose asChild>
                <Button type="button">
                  {t("ok") || 'OK'}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
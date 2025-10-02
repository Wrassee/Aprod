import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Save, Settings, Check, Plus, Trash2, Filter } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { NiedervoltMeasurement } from '@/types/niedervolt-devices';
import { FormData } from '@/lib/types';

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
  const { toast } = useToast();
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState({ de: '', hu: '' });
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
  }, [devices.length, isInitialized, measurements, onMeasurementsChange]);

  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements)); } }, [measurements, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-selected-devices', JSON.stringify(Array.from(selectedDevices))); } }, [selectedDevices, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('niedervolt-custom-devices', JSON.stringify(customDevices)); } }, [customDevices, isInitialized]);

  const getDeviceName = (device: any) => {
    if (device.name && typeof device.name === 'object') {
      return language === 'hu' ? device.name.hu : device.name.de;
    }
    return language === 'hu' ? device.nameHU : device.nameDE;
  };

  const updateMeasurement = useCallback((deviceId: string, field: keyof NiedervoltMeasurement, value: string) => {
    const cleanValue = value === "-" ? "" : value;
    onMeasurementsChange({ ...measurements, [deviceId]: { ...measurements[deviceId], deviceId, [field]: cleanValue } });
  }, [measurements, onMeasurementsChange]);
    
  const getFieldLabel = (field: string) => {
    const labels = {
      nevlegesAram: { hu: 'Névleges áram (A)', de: 'Nennstrom (A)' },
      tipusjelzes: { hu: 'Típusjelzés', de: 'Merkmal' },
      szigetelesVizsgalat: { hu: 'Szigetelés vizsgálat (MΩ)', de: 'Isolationsprüfung (MΩ)' },
      rovidzarasiAram: { hu: 'Rövidzárási áram (Icc)', de: 'Kurzschlussstrom (Icc)' },
      biztositek: { hu: 'Biztosíték', de: 'Sicherung' },
      kismegszakito: { hu: 'Kismegszakító', de: 'LS-Schalter' },
      npe: { hu: 'N-PE', de: 'N-PE' },
      l1pe: { hu: 'L1-PE', de: 'L1-PE' },
      l2pe: { hu: 'L2-PE', de: 'L2-PE' },
      l3pe: { hu: 'L3-PE', de: 'L3-PE' },
      ln: { hu: 'L-N', de: 'L-N' },
      lpe: { hu: 'L-PE', de: 'L-PE' },
      fiIn: { hu: 'FI In (mA)', de: 'FI In (mA)' },
      fiDin: { hu: 'FI ΔIn (ms)', de: 'FI ΔIn (ms)' },
      fiTest: { hu: 'FI teszt', de: 'FI teszt' },
    } as any;
    return language === 'hu' ? labels[field]?.hu || field : labels[field]?.de || field;
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
    if (newDeviceName.de.trim() && newDeviceName.hu.trim()) {
      const id = `custom-${Date.now()}`;
      const device: CustomDevice = { id, name: { de: newDeviceName.de.trim(), hu: newDeviceName.hu.trim() } };
      setCustomDevices(prev => [...prev, device]);
      setSelectedDevices(prev => new Set(prev).add(id));
      setNewDeviceName({ de: '', hu: '' });
    }
  };

  // *** MÓDOSÍTVA: stabil deviceId alapú questionId generálás ***
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
    console.log('🔄 Niedervolt: Saving data and proceeding to next page...');
    
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
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface">
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{language === 'hu' ? 'Összes Eszköz' : 'Gesamte Geräte'}</p>
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
                  <p className="text-green-100">{language === 'hu' ? 'Kitöltött' : 'Ausgefüllt'}</p>
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
                  <p className="text-purple-100">{language === 'hu' ? 'Kitöltöttség' : 'Fortschritt'}</p>
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
              <CardTitle className="text-xl">{language === 'hu' ? 'Niedervolt Installációk Mérései' : 'Niedervolt Installations Messungen'}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowDeviceSelector(true)}>
                <Filter className="h-4 w-4 mr-2" />
                {language === 'hu' ? 'Eszközök' : 'Geräte'} ({activeDevices.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-left font-semibold align-bottom">{language === 'hu' ? 'Eszköz / Baugruppe' : 'Gerät / Baugruppe'}</th>
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
                    const getQuestionId = (field: string) => `Q_NID_${device.id}_${field}`;
                    
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{getDeviceName(device)}</td>
                        {['biztositek','kismegszakito','tipusjelzes','szigetelesNPE','szigetelesL1PE','szigetelesL2PE','szigetelesL3PE','iccLN','iccLPE','fiIn','fiDin','fiTest'].map((field) => (
                          <td key={field} className="border border-gray-300 p-2">
                            {field === 'biztositek' || field === 'kismegszakito' || field === 'fiTest' ? (
                              <Select
                                value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                onValueChange={(value) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(dropdownOptions[field] || []).map((option: string, index: number) => (
                                    <SelectItem key={index} value={option}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type="text"
                                value={measurement[field as keyof NiedervoltMeasurement] || ''}
                                onChange={(e) => updateMeasurement(device.id, field as keyof NiedervoltMeasurement, e.target.value)}
                                className="w-full"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'hu' ? 'Vissza' : 'Zurück'}
          </Button>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleManualSave}>
              {saveStatus === 'saving' ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'hu' ? 'Mentés...' : 'Speichern...'}
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {language === 'hu' ? 'Elmentve' : 'Gespeichert'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {language === 'hu' ? 'Mentés' : 'Speichern'}
                </>
              )}
            </Button>
            <Button onClick={handleSaveAndProceed}>
              {language === 'hu' ? 'Tovább' : 'Weiter'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'hu' ? 'Eszközök kiválasztása' : 'Geräteauswahl'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">{language === 'hu' ? 'Saját eszköz hozzáadása' : 'Eigenes Gerät hinzufügen'}</h4>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="DE"
                  value={newDeviceName.de}
                  onChange={(e) => setNewDeviceName(prev => ({ ...prev, de: e.target.value }))}
                />
                <Input
                  placeholder="HU"
                  value={newDeviceName.hu}
                  onChange={(e) => setNewDeviceName(prev => ({ ...prev, hu: e.target.value }))}
                />
                <Button onClick={addCustomDevice}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'hu' ? 'Hozzáadás' : 'Hinzufügen'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

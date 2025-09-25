import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, queryClient } from '@tanstack/react-query';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { mappingService } from '@/services/mappingService';
import { ArrowLeft, ArrowRight, Save, Settings, Home, Check, RotateCcw, Plus, Trash2, Filter } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { NiedervoltMeasurement } from '@/types/niedervolt-devices';

interface CustomDevice {
  id: string;
  name: { de: string; hu: string };
}

interface NiedervoltTableProps {
  measurements: Record<string, NiedervoltMeasurement>;
  onMeasurementsChange: (measurements: Record<string, NiedervoltMeasurement>) => void;
  onBack: () => void;
  onNext: () => void;
  receptionDate: string;
  onReceptionDateChange: (date: string) => void;
  onAdminAccess?: () => void;
  onHome?: () => void;
  onStartNew?: () => void;
  // ÚJ PROPOK az egységes progress-hez
  totalProtocolSteps?: number; // Összes protokoll lépés (kérdések + niedervolt)
  currentProtocolStep?: number; // Jelenlegi protokoll lépés
}

export function NiedervoltTable({
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
  const [otisStatus, setOtisStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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

  const handleSaveToOtis = async () => {
    setOtisStatus('saving');
    
    try {
      console.log('🔄 Starting Otis Excel mapping...');
      
      // Niedervolt mérések összegyűjtése mapping-hez alkalmas formátumban
      const niedervoltMappings = Object.entries(measurements).map(([deviceId, measurement]) => {
        const device = [...devices, ...customDevices].find(d => d.id === deviceId);
        const deviceName = device ? getDeviceName(device) : deviceId;
        
        return {
          deviceId,
          deviceName,
          measurements: measurement
        };
      });
      
      // Protocol mapping API hívás
      const result = await mappingService.mapToOtisProtocol({
        protocolId: 'current-protocol', // TODO: Valódi protokoll ID használata
        niedervoltData: niedervoltMappings,
        receptionDate
      });
      
      if (result.success) {
        setOtisStatus('saved');
        toast({
          title: language === 'hu' ? '✅ Sikeres Otis mentés' : '✅ Otis Speicherung erfolgreich',
          description: language === 'hu' 
            ? `${result.modifiedCells} cella frissítve az Otis protokollban.`
            : `${result.modifiedCells} Zellen im Otis-Protokoll aktualisiert.`,
        });
        
        // Status visszaállítása 5 másodperc után
        setTimeout(() => setOtisStatus('idle'), 5000);
      } else {
        throw new Error(result.errors?.join(', ') || 'Ismeretlen hiba');
      }
      
    } catch (error) {
      console.error('❌ Otis Excel mapping error:', error);
      setOtisStatus('error');
      
      toast({
        title: language === 'hu' ? '❌ Otis mentés sikertelen' : '❌ Otis Speicherung fehlgeschlagen',
        description: language === 'hu' 
          ? `Hiba történt: ${error}`
          : `Fehler aufgetreten: ${error}`,
        variant: 'destructive',
      });
      
      // Status visszaállítása 5 másodperc után
      setTimeout(() => setOtisStatus('idle'), 5000);
    }
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
  // A táblázat kitöltöttségi százaléka most csak belső használatra
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
  // EGYSÉGES PROGRESS PROPOK:
  totalSteps={totalProtocolSteps}
  currentStep={currentProtocolStep}
  stepType="niedervolt"
  progressPercent={tableProgressPercent} // A táblázat kitöltöttségének a százaléka
  // AI Segítő props:
  currentPage={5}
  formData={{ measurements }}
  currentQuestionId="niedervolt-table"
  errors={[]}
/>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-blue-100">{language === 'hu' ? 'Összes Eszköz' : 'Gesamte Geräte'}</p><p className="text-3xl font-bold">{totalDevices}</p></div><Settings className="h-8 w-8 text-blue-200" /></div></CardContent></Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-green-100">{language === 'hu' ? 'Kitöltött' : 'Ausgefüllt'}</p><p className="text-3xl font-bold">{filledDevices}</p></div><Check className="h-8 w-8 text-green-200" /></div></CardContent></Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-purple-100">{language === 'hu' ? 'Kitöltöttség' : 'Fortschritt'}</p><p className="text-3xl font-bold">{totalDevices > 0 ? Math.round((filledDevices / totalDevices) * 100) : 0}%</p></div><ArrowRight className="h-8 w-8 text-purple-200" /></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{language === 'hu' ? 'Niedervolt Installációk Mérései' : 'Niedervolt Installations Messungen'}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowDeviceSelector(true)}><Filter className="h-4 w-4 mr-2" />{language === 'hu' ? 'Eszközök' : 'Geräte'} ({activeDevices.length})</Button>
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
                  {activeDevices.map((device, rowIndex) => {
                    const measurement = measurements[device.id] || {};
                    // Niedervolt Question ID generálás: Q_NID_{row}_{field}
                    const getQuestionId = (field: string) => `Q_NID_${rowIndex + 1}_${field}`;
                    
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-medium">{getDeviceName(device)}</td>
                        <td className="border border-gray-300 p-2">
                          <Select 
                            value={measurement.biztositek || ''} 
                            onValueChange={(v) => updateMeasurement(device.id, 'biztositek', v)}
                            data-question-id={getQuestionId('biztositek')}
                          >
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{(dropdownOptions.biztositek || []).map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Select 
                            value={measurement.kismegszakito || ''} 
                            onValueChange={(v) => updateMeasurement(device.id, 'kismegszakito', v)}
                            data-question-id={getQuestionId('kismegszakito')}
                          >
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{(dropdownOptions.kismegszakito || []).map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.tipusjelzes || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'tipusjelzes', e.target.value)}
                            data-question-id={getQuestionId('tipusjelzes')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.szigetelesNPE || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'szigetelesNPE', e.target.value)}
                            data-question-id={getQuestionId('szigetelesNPE')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.szigetelesL1PE || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'szigetelesL1PE', e.target.value)}
                            data-question-id={getQuestionId('szigetelesL1PE')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.szigetelesL2PE || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'szigetelesL2PE', e.target.value)}
                            data-question-id={getQuestionId('szigetelesL2PE')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.szigetelesL3PE || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'szigetelesL3PE', e.target.value)}
                            data-question-id={getQuestionId('szigetelesL3PE')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.iccLN || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'iccLN', e.target.value)}
                            data-question-id={getQuestionId('iccLN')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.iccLPE || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'iccLPE', e.target.value)}
                            data-question-id={getQuestionId('iccLPE')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center bg-blue-50" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.fiIn || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'fiIn', e.target.value.replace(/[^0-9.,\-]/g, ''))}
                            data-question-id={getQuestionId('fiIn')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input 
                            className="w-full text-center bg-blue-50" 
                            type="text" 
                            placeholder="-" 
                            value={measurement.fiDin || ''} 
                            onChange={(e) => updateMeasurement(device.id, 'fiDin', e.target.value.replace(/[^0-9.,\-]/g, ''))}
                            data-question-id={getQuestionId('fiDin')}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Select 
                            value={measurement.fiTest || ''} 
                            onValueChange={(v) => updateMeasurement(device.id, 'fiTest', v)}
                            data-question-id={getQuestionId('fiTest')}
                          >
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{(dropdownOptions.fiTest || []).map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={onBack} className="flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />{language === 'hu' ? 'Előző' : 'Zurück'}</Button>
          <div className="flex items-center space-x-3">
            <Button onClick={handleManualSave} className={`transition-all duration-300 ${saveStatus === 'saved' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white hover:bg-gray-50'}`} variant="outline" disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' && (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />)}
              {saveStatus === 'saved' && <Check className="h-4 w-4 mr-2" />}
              {saveStatus !== 'saving' && saveStatus !== 'saved' && <Save className="h-4 w-4 mr-2" />}
              {saveStatus === 'saving' ? (language === 'hu' ? 'Mentés...' : 'Speichern...') : saveStatus === 'saved' ? (language === 'hu' ? 'Mentve' : 'Gespeichert') : (language === 'hu' ? 'Mentés' : 'Speichern')}
            </Button>
            <Button 
              onClick={handleSaveToOtis} 
              className={`transition-all duration-300 ${
                otisStatus === 'saved' ? 'bg-green-100 text-green-700 border-green-300' : 
                otisStatus === 'error' ? 'bg-red-100 text-red-700 border-red-300' : 
                'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
              }`} 
              variant="outline" 
              disabled={otisStatus === 'saving' || Object.keys(measurements).length === 0}
              data-testid="button-save-otis"
            >
              {otisStatus === 'saving' && (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />)}
              {otisStatus === 'saved' && <Check className="h-4 w-4 mr-2" />}
              {otisStatus === 'error' && <span className="mr-2">❌</span>}
              {otisStatus === 'idle' && <Save className="h-4 w-4 mr-2" />}
              {otisStatus === 'saving' ? (language === 'hu' ? 'Otis mentés...' : 'Otis speichern...') : 
               otisStatus === 'saved' ? (language === 'hu' ? 'Otis mentve' : 'Otis gespeichert') :
               otisStatus === 'error' ? (language === 'hu' ? 'Hiba' : 'Fehler') :
               (language === 'hu' ? 'Mentés Otis Excel-be' : 'In Otis Excel speichern')}
            </Button>
            <Button onClick={onNext} className="flex items-center">{language === 'hu' ? 'Következő' : 'Weiter'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
          </div>
        </div>
      </main>
      <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
        <DialogTrigger asChild><div style={{ display: 'none' }} /></DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === 'hu' ? 'Eszközök Kiválasztása' : 'Geräteauswahl'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">{language === 'hu' ? 'Standard Eszközök' : 'Standard Geräte'}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {devices.map((device: any) => (
                  <div key={device.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={device.id} checked={selectedDevices.has(device.id)} onChange={(e) => { toggleDeviceSelection(device.id, e.target.checked); }} className="h-4 w-4 rounded-full border border-input bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50" />
                    <Label htmlFor={device.id} className="flex-1 cursor-pointer">{getDeviceName(device)}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">{language === 'hu' ? 'Egyedi Eszközök' : 'Individuelle Geräte'}</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Input placeholder={language === 'hu' ? 'Név (német)' : 'Name (Deutsch)'} value={newDeviceName.de} onChange={(e) => setNewDeviceName(prev => ({ ...prev, de: e.target.value }))} />
                <Input placeholder={language === 'hu' ? 'Név (magyar)' : 'Name (Ungarisch)'} value={newDeviceName.hu} onChange={(e) => setNewDeviceName(prev => ({ ...prev, hu: e.target.value }))} />
                <Button onClick={addCustomDevice} disabled={!newDeviceName.de.trim() || !newDeviceName.hu.trim()} className="col-span-2" size="sm"><Plus className="h-4 w-4 mr-2" />{language === 'hu' ? 'Hozzáadás' : 'Hinzufügen'}</Button>
              </div>
              <div className="space-y-2">
                {customDevices.map((device) => (
                  <div key={device.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={device.id} checked={selectedDevices.has(device.id)} onChange={(e) => { toggleDeviceSelection(device.id, e.target.checked); }} className="h-4 w-4 rounded-full border border-input bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50" />
                    <Label htmlFor={device.id} className="flex-1 cursor-pointer">{getDeviceName(device)}</Label>
                    <Button onClick={() => removeCustomDevice(device.id)} variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeviceSelector(false)}>{language === 'hu' ? 'Mentés' : 'Speichern'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NiedervoltTable;
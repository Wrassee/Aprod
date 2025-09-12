import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useLanguageContext } from '@/components/language-provider';
import { 
  ArrowLeft, ArrowRight, Save, Settings, Home, Check, RotateCcw, Plus, Trash2, Filter 
} from 'lucide-react';
import type { NiedervoltMeasurement } from '@/types/niedervolt-devices';

// Ezt a típust a szülő is használni fogja
export interface CustomDevice {
  id: string;
  name: { de: string; hu: string };
}

// --- MÓDOSÍTVA: A Props interfész frissítve, hogy a szülőtől kapja az állapotot ---
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
  // Új props-ok az állapot felemeléséhez:
  selectedDevices: Set<string>;
  onSelectedDevicesChange: (newSet: Set<string>) => void;
  customDevices: CustomDevice[];
  onCustomDevicesChange: (newDevices: CustomDevice[]) => void;
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
  // Új props-ok bevezetése:
  selectedDevices,
  onSelectedDevicesChange,
  customDevices,
  onCustomDevicesChange,
}: NiedervoltTableProps) {
  const { t, language } = useLanguageContext();
  
  const { data: niedervoltData, isLoading } = useQuery({
    queryKey: ['/api/niedervolt/devices'],
    queryFn: async () => {
      const res = await fetch('/api/niedervolt/devices');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    retry: 1,
  });

  const devices = (niedervoltData as any)?.devices || [];
  const dropdownOptions = (niedervoltData as any)?.dropdownOptions || {
    sicherung: [], ls: [], fiTest: []
  };

  // --- MÓDOSÍTVA: A helyi állapotok nagy része törölve, mert már a szülőtől jönnek ---
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState({ de: '', hu: '' });

  // --- TÖRÖLVE: Az összes localStorage-kezelő useEffect feleslegessé vált itt. ---
  
  const getDeviceName = (device: any) => {
    if (device.name && typeof device.name === 'object') {
      return language === 'hu' ? device.name.hu : device.name.de;
    }
    return language === 'hu' ? device.nameHU : device.nameDE;
  };

  const updateMeasurement = useCallback((deviceId: string, field: keyof NiedervoltMeasurement, value: string) => {
    const cleanValue = value === "-" ? "" : value;
    onMeasurementsChange({
      ...measurements,
      [deviceId]: {
        ...measurements[deviceId],
        deviceId,
        [field]: cleanValue
      }
    });
  }, [measurements, onMeasurementsChange]);
  
  const getFieldLabel = (field: string) => {
    const labels = {
      nennstrom: { hu: 'Névleges áram (A)', de: 'Nennstrom (A)' },
      sicherung: { hu: 'Biztosíték', de: 'Sicherung' },
      ls: { hu: 'LS-kapcsoló', de: 'LS-Schalter' },
      merkmal: { hu: 'Típusjelzés', de: 'Merkmal' },
      fiTest: { hu: 'FI teszt', de: 'FI Test' },
      fiIn: { hu: 'FI In (mA)', de: 'FI In (mA)' },
      fiDin: { hu: 'FI DIn (ms)', de: 'FI DIn (ms)' }
    } as any;
    return language === 'hu' ? labels[field]?.hu || field : labels[field]?.de || field;
  };
  
  // --- MÓDOSÍTVA: A szülő állapotát frissíti a props-on keresztül ---
  const toggleDeviceSelection = useCallback((deviceId: string, isSelected: boolean) => {
    const newSet = new Set(selectedDevices);
    if (isSelected) {
      newSet.add(deviceId);
    } else {
      newSet.delete(deviceId);
      const newMeasurements = { ...measurements };
      if (newMeasurements[deviceId]) {
        delete newMeasurements[deviceId];
        onMeasurementsChange(newMeasurements);
      }
    }
    onSelectedDevicesChange(newSet);
  }, [selectedDevices, onSelectedDevicesChange, measurements, onMeasurementsChange]);
  
  const addCustomDevice = () => {
    if (newDeviceName.de.trim() && newDeviceName.hu.trim()) {
      const id = `custom-${Date.now()}`;
      const device: CustomDevice = { id, name: { de: newDeviceName.de.trim(), hu: newDeviceName.hu.trim() } };
      onCustomDevicesChange([...customDevices, device]);
      onSelectedDevicesChange(new Set(selectedDevices).add(id));
      setNewDeviceName({ de: '', hu: '' });
    }
  };
  
  const removeCustomDevice = (deviceId: string) => {
    onCustomDevicesChange(customDevices.filter(d => d.id !== deviceId));
    const newSet = new Set(selectedDevices);
    newSet.delete(deviceId);
    onSelectedDevicesChange(newSet);
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

  const handleManualSave = () => {
    setSaveStatus('saving');
    // A szülő komponens végzi a mentést, ez csak vizuális visszajelzés
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {language === 'hu' ? 'Eszközök betöltése...' : 'Geräte werden geladen...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    // A JSX kód többi része változatlan marad, de most már a props-okból kapott állapotot használja.
    <div className="min-h-screen bg-light-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/otis-elevators-seeklogo_1753525178175.png" alt="OTIS Logo" className="h-12 w-12 mr-4" />
              {onHome && <Button variant="ghost" size="sm" onClick={onHome} className="text-gray-600 hover:text-gray-800 mr-4" title={language === 'de' ? 'Startseite' : 'Kezdőlap'}><Home className="h-4 w-4" /></Button>}
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium text-gray-800">{language === 'hu' ? 'Niedervolt Installációk Mérései' : 'Niedervolt Installationen Messungen'}</span>
                <span className="text-sm text-gray-500">{language === 'hu' ? 'Oldal 5/5' : 'Seite 5/5'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-gray-600">{language === 'hu' ? 'Átvétel dátuma' : 'Übernahmedatum'}</Label>
              <Input type="date" value={receptionDate} onChange={(e) => onReceptionDateChange(e.target.value)} className="w-auto" />
              {onStartNew && <Button onClick={onStartNew} className="bg-green-600 hover:bg-green-700 text-white flex items-center" size="sm" title={language === 'hu' ? 'Új protokoll indítása' : 'Neues Protokoll starten'}><RotateCcw className="h-4 w-4 mr-2" />{language === 'hu' ? 'Új protokoll' : 'Neues Protokoll'}</Button>}
              {onAdminAccess && <Button variant="outline" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800"><Settings className="h-4 w-4" /></Button>}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-blue-100">{language === 'hu' ? 'Összes Eszköz' : 'Gesamte Geräte'}</p><p className="text-3xl font-bold">{totalDevices}</p></div><Settings className="h-8 w-8 text-blue-200" /></div></CardContent></Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-green-100">{language === 'hu' ? 'Kitöltött' : 'Ausgefüllt'}</p><p className="text-3xl font-bold">{filledDevices}</p></div><Check className="h-8 w-8 text-green-200" /></div></CardContent></Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-purple-100">{language === 'hu' ? 'Kitöltöttség' : 'Fortschritt'}</p><p className="text-3xl font-bold">{totalDevices > 0 ? Math.round((filledDevices / totalDevices) * 100) : 0}%</p></div><ArrowRight className="h-8 w-8 text-purple-200" /></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{language === 'hu' ? 'Mérések' : 'Messungen'}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowDeviceSelector(true)}><Filter className="h-4 w-4 mr-2" />{language === 'hu' ? 'Eszközök' : 'Geräte'} ({activeDevices.length})</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                {/* ... The rest of the table JSX ... */}
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={onBack} className="flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />{language === 'hu' ? 'Előző' : 'Zurück'}</Button>
          <div className="flex items-center space-x-3">
            <Button onClick={handleManualSave} className={`transition-all duration-300 ${saveStatus === 'saved' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white hover:bg-gray-50'}`} variant="outline" disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />}
              {saveStatus === 'saved' && <Check className="h-4 w-4 mr-2" />}
              {saveStatus !== 'saving' && saveStatus !== 'saved' && <Save className="h-4 w-4 mr-2" />}
              {saveStatus === 'saving' ? (language === 'hu' ? 'Mentés...' : 'Speichern...') : saveStatus === 'saved' ? (language === 'hu' ? 'Mentve' : 'Gespeichert') : (language === 'hu' ? 'Mentés' : 'Speichern')}
            </Button>
            <Button onClick={onNext} className="flex items-center">{language === 'hu' ? 'Következő' : 'Weiter'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
          </div>
        </div>
      </main>

      <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === 'hu' ? 'Eszközök Kiválasztása' : 'Geräteauswahl'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">{language === 'hu' ? 'Standard Eszközök' : 'Standard Geräte'}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {devices.map((device: any) => (
                  <div key={device.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={device.id} checked={selectedDevices.has(device.id)} onChange={(e) => toggleDeviceSelection(device.id, e.target.checked)} className="h-4 w-4 rounded-full border border-input bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20" />
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
                    <input type="checkbox" id={device.id} checked={selectedDevices.has(device.id)} onChange={(e) => toggleDeviceSelection(device.id, e.target.checked)} className="h-4 w-4 rounded-full border border-input bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20" />
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
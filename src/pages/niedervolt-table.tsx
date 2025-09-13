import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useLanguageContext } from '@/components/language-provider';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Settings,
  Home,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Filter
} from 'lucide-react';
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
}: NiedervoltTableProps) {
  const { language } = useLanguageContext();

  const { data: niedervoltData, isLoading } = useQuery({
    queryKey: ['/api/niedervolt/devices'],
    retry: 1,
  });

  const devices = (niedervoltData as any)?.devices || [];
  const dropdownOptions = (niedervoltData as any)?.dropdownOptions || {
    biztositek: [],
    kismegszakito: [],
    fiTest: ['OK', 'NOK']
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState({ de: '', hu: '' });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleClear = () => {
      console.log('🧹 NiedervoltTable (event listener): Clearing internal state...');
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
      console.log('Initializing device data...');
      
      const savedMeasurements = localStorage.getItem('niedervolt-table-measurements');
      const savedDeviceSelection = localStorage.getItem('niedervolt-selected-devices');
      const savedCustomDevices = localStorage.getItem('niedervolt-custom-devices');
      
      if (savedMeasurements && Object.keys(measurements).length === 0) {
        try {
          onMeasurementsChange(JSON.parse(savedMeasurements));
        } catch (e) { console.error('Error loading measurements:', e); }
      }
      
      if (savedDeviceSelection) {
        try {
          const savedSet = new Set(JSON.parse(savedDeviceSelection));
          console.log('Loading saved device selection:', Array.from(savedSet));
          setSelectedDevices(savedSet);
        } catch (e) {
          console.error('Error loading saved selection, defaulting to first 7:', e);
          setSelectedDevices(new Set(devices.slice(0, 7).map((d: any) => d.id)));
        }
      } else {
        console.log('No saved selection found. Defaulting to the first 7 devices.');
        setSelectedDevices(new Set(devices.slice(0, 7).map((d: any) => d.id)));
      }
      
      if (savedCustomDevices) {
        try {
          setCustomDevices(JSON.parse(savedCustomDevices));
        } catch (e) { console.error('Error loading custom devices:', e); }
      }
      
      setIsInitialized(true);
    }
  }, [devices.length, isInitialized, measurements, onMeasurementsChange]);

  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements));
    }
  }, [measurements, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem('niedervolt-selected-devices', JSON.stringify(Array.from(selectedDevices)));
    }
  }, [selectedDevices, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem('niedervolt-custom-devices', JSON.stringify(customDevices));
    }
  }, [customDevices, isInitialized]);

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
      const isCurrentlySelected = newSet.has(deviceId);
      const shouldBeSelected = forceState !== undefined ? forceState : !isCurrentlySelected;
      
      if (shouldBeSelected) {
        newSet.add(deviceId);
      } else {
        newSet.delete(deviceId);
        
        setTimeout(() => {
          const newMeasurements = { ...measurements };
          if (newMeasurements[deviceId]) {
            delete newMeasurements[deviceId];
            onMeasurementsChange(newMeasurements);
          }
        }, 0);
      }
      return newSet;
    });
  }, [measurements, onMeasurementsChange]);

  const addCustomDevice = () => {
    if (newDeviceName.de.trim() && newDeviceName.hu.trim()) {
      const id = `custom-${Date.now()}`;
      const device: CustomDevice = {
        id,
        name: { de: newDeviceName.de.trim(), hu: newDeviceName.hu.trim() }
      };
      setCustomDevices(prev => [...prev, device]);
      setSelectedDevices(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      setNewDeviceName({ de: '', hu: '' });
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

  const handleManualSave = () => {
    setSaveStatus('saving');
    localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements));
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        {/* ... Loading spinner ... */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface">
      <header className="bg-white shadow-sm border-b border-gray-200">
        {/* ... A header tartalma változatlan ... */}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* ... A statisztikai kártyák változatlanok ... */}
        </div>

        <Card>
          <CardHeader>
             {/* ... A CardHeader tartalma változatlan ... */}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                {/* ==================================================================== */}
                {/* === MÓDOSÍTÁS KEZDETE: ÚJ TÁBLÁZAT STRUKTÚRA === */}
                {/* ==================================================================== */}
                <thead>
                  {/* Első sor: Főcímek */}
                  <tr>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-left font-semibold align-bottom">
                      {language === 'hu' ? 'Eszköz / Baugruppe' : 'Gerät / Baugruppe'}
                    </th>
                    <th colSpan={2} className="border border-gray-300 p-3 text-center font-semibold">
                      {getFieldLabel('nevlegesAram')}
                    </th>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom">
                      {getFieldLabel('tipusjelzes')}
                    </th>
                    <th colSpan={4} className="border border-gray-300 p-3 text-center font-semibold">
                      {getFieldLabel('szigetelesVizsgalat')}
                    </th>
                    <th colSpan={2} className="border border-gray-300 p-3 text-center font-semibold">
                      {getFieldLabel('rovidzarasiAram')}
                    </th>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom text-blue-600">
                      {getFieldLabel('fiIn')}
                    </th>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom text-blue-600">
                      {getFieldLabel('fiDin')}
                    </th>
                    <th rowSpan={2} className="border border-gray-300 p-3 text-center font-semibold align-bottom">
                      {getFieldLabel('fiTest')}
                    </th>
                  </tr>
                  {/* Második sor: Alcímek */}
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
                        {/* Eszköz neve */}
                        <td className="border border-gray-300 p-3 font-medium">{getDeviceName(device)}</td>

                        {/* 1. Névleges áram */}
                        <td className="border border-gray-300 p-2">
                          <Select value={measurement.biztositek || ''} onValueChange={(value) => updateMeasurement(device.id, 'biztositek', value)}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{dropdownOptions.biztositek.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Select value={measurement.kismegszakito || ''} onValueChange={(value) => updateMeasurement(device.id, 'kismegszakito', value)}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{dropdownOptions.kismegszakito.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>

                        {/* 2. Típusjelzés */}
                        <td className="border border-gray-300 p-2">
                          <Input type="text" placeholder="-" value={measurement.tipusjelzes || ''} onChange={(e) => updateMeasurement(device.id, 'tipusjelzes', e.target.value)} className="w-full text-center" />
                        </td>

                        {/* 3. Szigetelés vizsgálat */}
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.szigetelesNPE || ''} onChange={(e) => updateMeasurement(device.id, 'szigetelesNPE', e.target.value)} className="w-full text-center" /></td>
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.szigetelesL1PE || ''} onChange={(e) => updateMeasurement(device.id, 'szigetelesL1PE', e.target.value)} className="w-full text-center" /></td>
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.szigetelesL2PE || ''} onChange={(e) => updateMeasurement(device.id, 'szigetelesL2PE', e.target.value)} className="w-full text-center" /></td>
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.szigetelesL3PE || ''} onChange={(e) => updateMeasurement(device.id, 'szigetelesL3PE', e.target.value)} className="w-full text-center" /></td>

                        {/* 4. Rövidzárási áram */}
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.iccLN || ''} onChange={(e) => updateMeasurement(device.id, 'iccLN', e.target.value)} className="w-full text-center" /></td>
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.iccLPE || ''} onChange={(e) => updateMeasurement(device.id, 'iccLPE', e.target.value)} className="w-full text-center" /></td>
                        
                        {/* 5, 6, 7. FI Relé */}
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.fiIn || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9.,\-]/g, ''); updateMeasurement(device.id, 'fiIn', v); }} className="w-full text-center bg-blue-50" /></td>
                        <td className="border border-gray-300 p-2"><Input type="text" placeholder="-" value={measurement.fiDin || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9.,\-]/g, ''); updateMeasurement(device.id, 'fiDin', v); }} className="w-full text-center bg-blue-50" /></td>
                        <td className="border border-gray-300 p-2">
                          <Select value={measurement.fiTest || ''} onValueChange={(value) => updateMeasurement(device.id, 'fiTest', value)}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{dropdownOptions.fiTest.map((o: string) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* ==================================================================== */}
                {/* === MÓDOSÍTÁS VÉGE === */}
                {/* ==================================================================== */}
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8">
           {/* ... A navigációs gombok változatlanok ... */}
        </div>
      </main>

      <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
        {/* ... A dialógus ablak tartalma változatlan ... */}
      </Dialog>
    </div>
  );
}

export default NiedervoltTable;
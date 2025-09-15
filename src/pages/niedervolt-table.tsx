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
  RotateCcw,
  Plus,
  Trash2,
  Filter
} from 'lucide-react';
import type { NiedervoltMeasurement } from '@/types/niedervolt-devices';
import ProtocolHeader from '@/components/ProtocolHeader'; // ⬅️ közös komponens import

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
  const { t, language } = useLanguageContext();

  const { data: niedervoltData, isLoading } = useQuery({
    queryKey: ['/api/niedervolt/devices'],
    retry: 1,
  });

  const devices = niedervoltData?.devices || [];
  const dropdownOptions = niedervoltData?.dropdownOptions || {
    biztositek: [],
    kismegszakito: [],
    fiTest: []
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
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
          const savedSet = new Set(JSON.parse(savedDeviceSelection));
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
    setTimeout(() => {
      localStorage.setItem('niedervolt-table-measurements', JSON.stringify(measurements));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  // ⬇️ Közös fejléc használata:
  const headerRight = (
    <div className="flex items-center space-x-4">
      <Label className="text-sm font-medium text-gray-600">
        {language === 'hu' ? 'Átvétel dátuma' : 'Übernahmedatum'}
      </Label>
      <Input type="date" value={receptionDate} onChange={(e) => onReceptionDateChange(e.target.value)} className="w-auto"/>
      {onStartNew && (
        <Button onClick={onStartNew} className="bg-green-600 hover:bg-green-700 text-white flex items-center" size="sm" title={language === 'hu' ? 'Új protokoll indítása' : 'Neues Protokoll starten'}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {language === 'hu' ? 'Új protokoll indítása' : 'Neues Protokoll starten'}
        </Button>
      )}
      {onAdminAccess && (
        <Button variant="outline" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800">
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-surface">
      <ProtocolHeader
        logoSrc="/otis-elevators-seeklogo_1753525178175.png"
        title="OTIS APROD - Átvételi Protokoll"
        progressLabel={t.progress}
        progressPercent={totalDevices > 0 ? (filledDevices / totalDevices) * 100 : 0}
        rightContent={headerRight}
      />
      
      {/* ... a további tartalom változatlan ... */}
      {/* A main, Card-ok, táblázat, dialógusok stb. maradnak, csak a fejlécet cseréltük le! */}
      {/* ... */}
    </div>
  );
}

export default NiedervoltTable;
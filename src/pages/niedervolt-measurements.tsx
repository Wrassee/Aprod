import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageContext } from "@/components/language-context";
import { ArrowLeft, Plus, Trash2, Save, Check, BarChart3, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { MeasurementRow } from '@/lib/types';
import { MegaStableInput } from '@/components/mega-stable-input';
import PageHeader from '@/components/PageHeader';

const MEASUREMENT_TYPES = {
  hu: [
    { id: 'isolation', name: 'Isolationsmessung', unit: 'Ohm', icon: '⚡' },
    { id: 'shortcircuit', name: 'Kurzschluss-strommessung', unit: 'Ampere', icon: '🔌' },
    { id: 'voltage', name: 'Spannungsmessung', unit: 'Volt', icon: '⚙️' },
    { id: 'continuity', name: 'Durchgangsprüfung', unit: 'Ohm', icon: '🔧' },
    { id: 'insulation_resistance', name: 'Isolationswiderstand', unit: 'MOhm', icon: '🛡️' },
    { id: 'earth_resistance', name: 'Erdungswiderstand', unit: 'Ohm', icon: '🌍' }
  ],
  de: [
    { id: 'isolation', name: 'Isolationsmessung', unit: 'Ohm', icon: '⚡' },
    { id: 'shortcircuit', name: 'Kurzschluss-strommessung', unit: 'Ampere', icon: '🔌' },
    { id: 'voltage', name: 'Spannungsmessung', unit: 'Volt', icon: '⚙️' },
    { id: 'continuity', name: 'Durchgangsprüfung', unit: 'Ohm', icon: '🔧' },
    { id: 'insulation_resistance', name: 'Isolationswiderstand', unit: 'MOhm', icon: '🛡️' },
    { id: 'earth_resistance', name: 'Erdungswiderstand', unit: 'Ohm', icon: '🌍' }
  ]
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

  useEffect(() => {
    const saved = localStorage.getItem('niedervolt-measurements');
    if (saved && measurements.length === 0) {
      try {
        const savedMeasurements = JSON.parse(saved);
        onMeasurementsChange(savedMeasurements);
      } catch (e) {
        console.error('Error loading saved measurements:', e);
      }
    }
  }, [measurements.length, onMeasurementsChange]);

  const measurementTypes = MEASUREMENT_TYPES[language] || MEASUREMENT_TYPES.hu;

  const addNewRow = () => {
    const newRow: MeasurementRow = {
      id: `row-${nextIdRef.current++}`,
      measurementType: '',
      description: '',
      value1: '',
      value2: '',
      value3: '',
      unit: '',
      notes: ''
    };
    onMeasurementsChange([...measurements, newRow]);
  };

  const removeRow = (rowId: string) => {
    onMeasurementsChange(measurements.filter(row => row.id !== rowId));
  };

  const stableUpdateFunctions = useMemo(() => {
    const functions: { [key: string]: { [field: string]: (value: string) => void } } = {};
    
    measurements.forEach(row => {
      functions[row.id] = {};
      (['measurementType', 'description', 'value1', 'value2', 'value3', 'unit', 'notes'] as (keyof MeasurementRow)[]).forEach(field => {
        functions[row.id][field] = (value: string) => {
          onMeasurementsChange(measurements.map(r => {
            if (r.id === row.id) {
              const updatedRow = { ...r, [field]: value };
              
              if (field === 'measurementType') {
                const selectedType = measurementTypes.find(type => type.id === value);
                if (selectedType) {
                  updatedRow.unit = selectedType.unit;
                }
              }
              
              return updatedRow;
            }
            return r;
          }));
        };
      });
    });
    
    return functions;
  }, [measurements, measurementTypes, onMeasurementsChange]);

  const saveToStorage = async () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('niedervolt-measurements', JSON.stringify(measurements));
      onMeasurementsChange(measurements);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving niedervolt measurements:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const filledMeasurements = measurements.filter(m => m.value1 || m.value2 || m.value3).length;
  const completionRate = measurements.length > 0 ? Math.round((filledMeasurements / measurements.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <PageHeader
        title="OTIS APROD - Niedervolt Installations Verordnung art.14"
        onHome={onHome}
        onAdminAccess={onAdminAccess}
        onStartNew={onStartNew}
        receptionDate={receptionDate}
        onReceptionDateChange={onReceptionDateChange}
        progressPercent={100}
        showProgress={true}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* 🎨 MODERN STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Measurements Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {language === 'hu' ? 'Összes mérés' : 'Gesamt Messungen'}
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {measurements.length}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filled Measurements Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {language === 'hu' ? 'Kitöltött értékek' : 'Ausgefüllte Werte'}
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                    {filledMeasurements}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Rate Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {language === 'hu' ? 'Készültség' : 'Fertigstellung'}
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                    {completionRate}%
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎨 MODERN TABLE CARD */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border-2 border-blue-100 dark:border-blue-900/50">
          {/* Table Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-6 py-6">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {language === 'hu' ? 'Mérési adatok táblázata' : 'Messdaten Tabelle'}
                  </h2>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Niedervolt mérések rögzítése
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Save Button */}
                <button
                  onClick={saveToStorage}
                  disabled={saveStatus === 'saving'}
                  className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    saveStatus === 'saved' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                        <span>{t("saving")}</span>
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>{t("saved")}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{t("save")}</span>
                      </>
                    )}
                  </div>
                </button>
                
                {/* Add Row Button */}
                <button
                  onClick={addNewRow}
                  className="group relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>{language === 'hu' ? 'Új sor' : 'Neue Zeile'}</span>
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[180px] border-r border-blue-100">
                    🔧 Mérés típusa
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[200px] border-r border-blue-100">
                    📝 Leírás
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[100px] border-r border-blue-100">
                    📊 Érték 1
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[100px] border-r border-blue-100">
                    📊 Érték 2
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[100px] border-r border-blue-100">
                    📊 Érték 3
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[80px] border-r border-blue-100">
                    ⚡ Egység
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-blue-800 dark:text-blue-300 min-w-[150px] border-r border-blue-100">
                    💭 Megjegyzések
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-800 dark:text-blue-300 w-16">
                    🎛️
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {measurements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-xl opacity-30"></div>
                          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">📊</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-700 font-semibold text-lg mb-1">
                            {language === 'hu' ? 'Még nincs mérési adat' : 'Noch keine Messdaten'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {language === 'hu' 
                              ? 'Kattints az "Új sor" gombra az első mérés hozzáadásához'
                              : 'Klicken Sie auf "Neue Zeile", um die erste Messung hinzuzufügen'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  measurements.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-l-blue-500"
                    >
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-sky-500 px-2.5 py-1 rounded-lg shadow-sm">
                            {index + 1}
                          </span>
                          <Select
                            value={row.measurementType}
                            onValueChange={stableUpdateFunctions[row.id]?.measurementType}
                          >
                            <SelectTrigger className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500/20">
                              <SelectValue placeholder="Válassz típust..." />
                            </SelectTrigger>
                            <SelectContent>
                              {measurementTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <span className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    {type.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="text"
                          value={row.description}
                          onChange={(value) => stableUpdateFunctions[row.id]?.description?.(value.toString())}
                          placeholder="Részletes mérés leírása..."
                          className="w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="number"
                          value={row.value1}
                          onChange={(value) => stableUpdateFunctions[row.id]?.value1?.(value.toString())}
                          placeholder="0.000"
                          className="w-full text-right font-mono border-green-200 focus:border-green-500 focus:ring-green-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="number"
                          value={row.value2}
                          onChange={(value) => stableUpdateFunctions[row.id]?.value2?.(value.toString())}
                          placeholder="0.000"
                          className="w-full text-right font-mono border-green-200 focus:border-green-500 focus:ring-green-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="number"
                          value={row.value3}
                          onChange={(value) => stableUpdateFunctions[row.id]?.value3?.(value.toString())}
                          placeholder="0.000"
                          className="w-full text-right font-mono border-green-200 focus:border-green-500 focus:ring-green-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="text"
                          value={row.unit}
                          onChange={(value) => stableUpdateFunctions[row.id]?.unit?.(value.toString())}
                          placeholder="Egység"
                          className="w-full text-center text-sm font-medium border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <MegaStableInput
                          type="text"
                          value={row.notes}
                          onChange={(value) => stableUpdateFunctions[row.id]?.notes?.(value.toString())}
                          placeholder="További megjegyzések..."
                          className="w-full border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeRow(row.id)}
                          className="p-2 rounded-lg text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-cyan-950/20 px-6 py-5 border-t-2 border-blue-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Összesen {measurements.length} mérési sor</span>
                </div>
                {measurements.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{filledMeasurements} kitöltve</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-semibold">{t("previous")}</span>
                  </div>
                </button>
                <button
                  onClick={onNext}
                  className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <span>{t("next")}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🎨 INFO PANEL */}
        <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3">
                  Niedervolt Installations Verordnung art.14 információ
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-2xl">📋</span>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-blue-700 dark:text-blue-400">Excel integráció:</strong>
                      <p className="mt-1">A mérések az OTIS template 667. sorától kerülnek be automatikusan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-2xl">⚡</span>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-green-700 dark:text-green-400">Támogatott egységek:</strong>
                      <p className="mt-1">Volt, Ohm, Ampere, MOhm</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="text-2xl">💾</span>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-purple-700 dark:text-purple-400">Automatikus mentés:</strong>
                      <p className="mt-1">LocalStorage + Excel exportálás</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-2xl">🔧</span>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-orange-700 dark:text-orange-400">Mérési típusok:</strong>
                      <p className="mt-1">6 különböző elektromos mérés típus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// src/pages/hydro-questionnaire.tsx
// Önálló HYDRO (MOD_HYD) protokoll kérdőív — Grounding-stílusú UI

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/queryClient';
import { useTheme } from '@/contexts/theme-context';
import { useLanguageContext } from '@/components/language-context';
import {
  ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2,
  Download, FileText, Sparkles, ChevronRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

// ============================================================
// KÉRDÉS ADATOK
// ============================================================

type QuestionOption = 'Ja' | 'Nein' | 'nz' | 'U' | 'Siehe' | 'keine';

interface Chapter {
  id: number;
  title: string;
  paths: string[];
  options?: QuestionOption[];
  specialOptions?: Record<string, QuestionOption[]>;
}

const CHAPTERS: Chapter[] = [
  { id: 1, title: 'B1 – Aufzugsbuch', paths: ['1'], options: ['Ja', 'keine', 'nz'] },
  {
    id: 2, title: 'B2 – Schacht',
    paths: ['2.1.2','2.1.3','2.1.4','2.1.5','2.1.6','2.1.7',
             '2.2.1','2.2.2','2.2.3','2.2.4','2.2.5','2.2.6',
             '2.3.1','2.3.2','2.3.3','2.3.4','2.3.5','2.3.6','2.3.7','2.3.8',
             '2.4.1','2.4.2','2.5.1','2.6.1','2.7.1'],
  },
  {
    id: 3, title: 'B3 – Schachttüren / Fahrkorbtüren',
    paths: ['3.1.1','3.1.2','3.1.3','3.1.4','3.1.5','3.1.6','3.1.7',
             '3.2.1','3.2.2','3.2.3','3.2.4',
             '3.3.1.1','3.3.1.2','3.3.1.3','3.3.1.4','3.3.2.1',
             '3.4.1','3.4.2','3.4.3','3.4.4','3.4.5','3.4.6','3.4.7','3.4.8','3.4.9',
             '3.4.10','3.4.11','3.4.12','3.4.13','3.4.14','3.4.15','3.4.16','3.4.17','3.4.18','3.4.19',
             '3.5.1','3.5.2','3.5.3','3.5.4',
             '3.6.1','3.6.2','3.6.2_A','3.6.2_B','3.6.2_C','3.6.3','3.7.1','4.1.3'],
  },
  {
    id: 4, title: 'B4 – Fahrkorb',
    paths: ['4.1.1','4.1.2','4.1.4','4.1.5','4.1.6','4.1.7','4.1.8','4.1.9',
             '4.1.10','4.1.11','4.1.12','4.1.13','4.1.14','4.1.15','4.1.16','4.1.17','4.1.18','4.1.19',
             '4.2.1'],
  },
  {
    id: 5, title: 'B5 – Fahrkorb (Innenraum/Türen)',
    paths: ['5.1.1','5.1.2','5.1.3','5.1.4','5.1.5','5.1.6','5.1.7','5.1.8','5.1.9','5.1.10',
             '5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.2.6',
             '5.3.1','5.3.2','5.3.3','5.3.4','5.3.5','5.3.6','5.3.7','5.3.8','5.3.9','5.3.10',
             '5.4.1','5.4.2','5.4.3','5.4.4','5.4.5','5.4.6','5.4.7','5.4.8','5.4.9','5.5.1'],
  },
  {
    id: 6, title: 'B6 – Aufhängung',
    paths: ['6.3','6.4.1','6.4.2','6.4.3','6.4.4','6.4.5','6.4.6','6.5.1',
             'A.6.1','A.6.2','B.6.1','B.6.2','C.6.1'],
  },
  {
    id: 7, title: 'B7 – Fangvorrichtung / Hydraulik',
    paths: ['7.1.1','7.1.2','7.1.3','7.1.4','7.1.5','7.1.6','7.1.7','7.1.8','7.1.9',
             '7.2.1','7.2.2','7.2.3','7.2.4','7.2.5','7.2.6','7.2.7',
             '7.3.1','7.3.2','7.3.3','7.3.4','7.3.5',
             '7.4.1','7.4.2','7.4.3','7.4.4','7.4.5','7.4.6','7.4.7',
             '7.5.1','7.5.2','7.5.3','7.5.4',
             '7.6.1','7.6.2','7.6.3',
             '7.7.1.1','7.7.1.2','7.7.2.1','7.7.2.2','7.7.2.3','7.7.2.4','7.7.2.5',
             '7.7.3.1','7.7.3.2','7.7.3.3','7.7.3.4',
             '7.8.1','7.8.2','7.9.1'],
  },
  {
    id: 8, title: 'B8 – Hydraulikanlage',
    paths: ['8.1.1','8.1.2','8.1.3','8.1.4','8.1.5','8.1.6',
             '8.2.1','8.3.1','8.3.2',
             '8.4.1.1','8.4.2.1','8.4.2.2','8.4.3.1',
             '8.5.2','8.5.3','8.6.1','8.6.2','8.6.3','8.7.1'],
  },
  { id: 9, title: 'B9 – Elektrische Anlage', paths: ['9.1.1.1','9.1.1.2','9.2.1','9.2.1_a','9.2.2','9.2.3'] },
  {
    id: 10, title: 'B10 – Allgemeine Prüfungen',
    paths: ['10.1','10.2','10.3','10.4','10.5','10.6','10.7'],
    specialOptions: { '10.1': ['Ja','Nein','nz','U','Siehe'] },
  },
  {
    id: 11, title: 'B11 – Prüfungen unter Last',
    paths: ['11.1_Main','11.1.1','11.1.2','11.1.3','11.1.4','11.1.5',
             '11.2.1','11.2.2','11.2.3','11.2.4','11.2.5',
             '11.3.1','11.3.2','11.3.3','11.3.4','11.3.5','11.3.6','11.3.7','11.3.8','11.3.9','11.3.10','11.3.11'],
  },
  { id: 12, title: 'B12 – Unterlagen', paths: ['16.2','16.3'], options: ['Ja','Nein','U'] },
  { id: 13, title: 'B13 – Konformitätserklärung', paths: ['13.1','13.2','13.3','13.4'] },
  { id: 14, title: 'B14 – Nachkontrolle', paths: ['14.1.1','14.1.2','14.2.1','14.2.2'] },
];

const DEFAULT_OPTIONS: QuestionOption[] = ['Ja', 'Nein', 'nz', 'U'];

// Option → pill colours
const PILL_ACTIVE: Record<string, string> = {
  Ja:    'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg scale-105',
  Nein:  'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-500 shadow-lg scale-105',
  nz:    'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-500 shadow-lg scale-105',
  U:     'bg-gradient-to-r from-blue-500 to-sky-500 text-white border-blue-500 shadow-lg scale-105',
  Siehe: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-500 shadow-lg scale-105',
  keine: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg scale-105',
};
const PILL_HOVER: Record<string, string> = {
  Ja:    'hover:bg-green-50 hover:border-green-300',
  Nein:  'hover:bg-red-50 hover:border-red-300',
  nz:    'hover:bg-gray-50 hover:border-gray-300',
  U:     'hover:bg-blue-50 hover:border-blue-300',
  Siehe: 'hover:bg-purple-50 hover:border-purple-300',
  keine: 'hover:bg-orange-50 hover:border-orange-300',
};
const ROW_BG: Record<string, string> = {
  Ja:    'bg-gradient-to-r from-green-50 to-transparent border-l-4 border-l-green-500',
  Nein:  'bg-gradient-to-r from-red-50 to-transparent border-l-4 border-l-red-500',
  nz:    'bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-l-gray-400',
  U:     'bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-l-blue-400',
  Siehe: 'bg-gradient-to-r from-purple-50 to-transparent border-l-4 border-l-purple-400',
  keine: 'bg-gradient-to-r from-orange-50 to-transparent border-l-4 border-l-orange-400',
};

// ============================================================
// ÁLLAPOT TÍPUSOK
// ============================================================

interface HydroHeader {
  installationType: 'Neuanlage' | 'Umbau';
  certType: 'Baumusterprüfung' | 'Entwurfsprüfung';
  machineRoomless: boolean;
  fabrikationsNr: string;
  aufzugstyp: string;
  standortadresse: string;
  adresse: string;
}
interface HydroB1Data { hubhoehe: string; stockwerke: string; zugaenge: string; nennlast: string; personen: string; anforderungen: string; }
interface HydroB7Components { fang: boolean; ausgleich: boolean; begrenzer: boolean; rohrbruch: boolean; drossel: boolean; }
interface HydroB8Data { hersteller: string; aggregatTyp: string; motortyp: string; aggregatNr: string; nennstrom: string; motorleistung: string; nennlast: string; leerlast: string; nennlastAuf: string; leerlastAb: string; druckbegrenzung: string; }
interface HydroB9Data { sollAuf: string; sollAb: string; istLeerAuf: string; istNennlastAb: string; stromLeer: string; stromNennlast: string; netzspannung: string; steuerspannung: string; }
interface HydroB13Data { firma: string; nameAbnahme: string; datum: string; bauseitigePendenzen: string; aufzugsseitigePendenzen: string; }

const STORAGE_KEY = 'hydro-form-data';
function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch { /**/ } return null; }
function saveState(s: Record<string, unknown>) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /**/ } }

// ============================================================
// FŐ KOMPONENS
// ============================================================

interface HydroQuestionnaireProps {
  onHome: () => void;
  onNavigate?: (screen: string) => void;
}

export function HydroQuestionnaire({ onHome, onNavigate }: HydroQuestionnaireProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { language } = useLanguageContext();

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saved = loadState();
  const [header, setHeader] = useState<HydroHeader>(saved?.header ?? {
    installationType: 'Neuanlage', certType: 'Baumusterprüfung', machineRoomless: false,
    fabrikationsNr: '', aufzugstyp: '', standortadresse: '', adresse: '',
  });
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [b1, setB1] = useState<HydroB1Data>(saved?.b1 ?? { hubhoehe:'', stockwerke:'', zugaenge:'', nennlast:'', personen:'', anforderungen:'' });
  const [b7, setB7] = useState<HydroB7Components>(saved?.b7 ?? { fang:false, ausgleich:false, begrenzer:false, rohrbruch:false, drossel:false });
  const [b8, setB8] = useState<HydroB8Data>(saved?.b8 ?? { hersteller:'', aggregatTyp:'', motortyp:'', aggregatNr:'', nennstrom:'', motorleistung:'', nennlast:'', leerlast:'', nennlastAuf:'', leerlastAb:'', druckbegrenzung:'' });
  const [b9, setB9] = useState<HydroB9Data>(saved?.b9 ?? { sollAuf:'', sollAb:'', istLeerAuf:'', istNennlastAb:'', stromLeer:'', stromNennlast:'', netzspannung:'', steuerspannung:'' });
  const [b13, setB13] = useState<HydroB13Data>(saved?.b13 ?? { firma:'', nameAbnahme:'', datum: new Date().toISOString().split('T')[0], bauseitigePendenzen:'', aufzugsseitigePendenzen:'' });

  useEffect(() => { saveState({ header, answers, b1, b7, b8, b9, b13 }); }, [header, answers, b1, b7, b8, b9, b13]);

  const setAnswer = useCallback((path: string, value: string) => {
    setAnswers(prev => ({ ...prev, [path]: value }));
  }, []);

  // Progress
  const totalQuestions = CHAPTERS.reduce((s, ch) => s + ch.paths.length, 0);
  const answeredQuestions = Object.keys(answers).filter(k => answers[k]).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Manual save
  const handleManualSave = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
      saveState({ header, answers, b1, b7, b8, b9, b13 });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, [header, answers, b1, b7, b8, b9, b13]);

  // PDF generation
  const handleGeneratePdf = useCallback(async () => {
    setIsPdfGenerating(true);
    try {
      const hydroData = {
        installationType: header.installationType, certType: header.certType,
        machineRoomless: header.machineRoomless, fabrikationsNr: header.fabrikationsNr,
        aufzugstyp: header.aufzugstyp, standortadresse: header.standortadresse, adresse: header.adresse,
        b1_hubhoehe: b1.hubhoehe, b1_stockwerke: b1.stockwerke, b1_zugaenge: b1.zugaenge,
        b1_nennlast: b1.nennlast, b1_personen: b1.personen, b1_anforderungen: b1.anforderungen,
        b7_fang: b7.fang, b7_ausgleich: b7.ausgleich, b7_begrenzer: b7.begrenzer,
        b7_rohrbruch: b7.rohrbruch, b7_drossel: b7.drossel,
        b8_hersteller: b8.hersteller, b8_aggregatTyp: b8.aggregatTyp, b8_motortyp: b8.motortyp,
        b8_aggregatNr: b8.aggregatNr, b8_nennstrom: b8.nennstrom, b8_motorleistung: b8.motorleistung,
        b8_nennlast: b8.nennlast, b8_leerlast: b8.leerlast, b8_nennlastAuf: b8.nennlastAuf,
        b8_leerlastAb: b8.leerlastAb, b8_druckbegrenzung: b8.druckbegrenzung,
        b9_sollAuf: b9.sollAuf, b9_sollAb: b9.sollAb, b9_istLeerAuf: b9.istLeerAuf,
        b9_istNennlastAb: b9.istNennlastAb, b9_stromLeer: b9.stromLeer, b9_stromNennlast: b9.stromNennlast,
        b9_netzspannung: b9.netzspannung, b9_steuerspannung: b9.steuerspannung,
        b13_firma: b13.firma, b13_nameAbnahme: b13.nameAbnahme, b13_datum: b13.datum,
        b13_bauseitigePendenzen: b13.bauseitigePendenzen, b13_aufzugsseitigePendenzen: b13.aufzugsseitigePendenzen,
        questionAnswers: answers,
      };
      const response = await fetch(getApiUrl('/api/protocols/download-hydro-pdf'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hydroData }),
      });
      if (!response.ok) {
        let msg = 'HYDRO PDF generálási hiba';
        try { const j = await response.json(); msg = j?.message || msg; } catch { /**/ }
        throw new Error(msg);
      }
      const blob = await response.blob();
      const fabNr = header.fabrikationsNr ? String(header.fabrikationsNr).replace(/[^a-zA-Z0-9]/g, '_') : 'HYDRO';
      const filename = `ABNAHME_HYDRO_${fabNr}_${new Date().toISOString().split('T')[0]}.pdf`;
      if (Capacitor.isNativePlatform()) {
        const base64 = await blobToBase64(blob);
        const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents });
        try { await FileOpener.open({ filePath: result.uri, contentType: 'application/pdf' }); } catch { /**/ }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: '✅ HYDRO PDF letöltve', description: filename });
    } catch (error) {
      toast({ title: 'Hiba', description: (error as Error).message, variant: 'destructive' });
    } finally { setIsPdfGenerating(false); }
  }, [header, answers, b1, b7, b8, b9, b13, toast]);

  const totalChapters = CHAPTERS.length;
  const isLast = currentChapterIdx === totalChapters + 1;
  const currentChapter = (currentChapterIdx > 0 && currentChapterIdx <= totalChapters)
    ? CHAPTERS[currentChapterIdx - 1] : null;

  const chapterTitle = currentChapterIdx === 0
    ? 'B0 – Allgemeine Informationen'
    : currentChapter ? currentChapter.title
    : 'PDF & Protokollok';

  const chapterAnswered = currentChapter
    ? currentChapter.paths.filter(p => answers[p]).length : 0;
  const chapterTotal = currentChapter ? currentChapter.paths.length : 0;
  const chapterPercent = chapterTotal > 0 ? Math.round((chapterAnswered / chapterTotal) * 100) : 0;

  // Save button labels
  const saveLabelMap = { hu: 'Mentés', de: 'Speichern', en: 'Save', fr: 'Sauvegarder', it: 'Salva' } as const;
  const savingLabelMap = { hu: 'Mentés...', de: 'Speichern...', en: 'Saving...', fr: 'Sauvegarde...', it: 'Salvataggio...' } as const;
  const savedLabelMap = { hu: 'Mentve', de: 'Gespeichert', en: 'Saved', fr: 'Sauvegardé', it: 'Salvato' } as const;
  const backLabelMap = { hu: 'Előző', de: 'Zurück', en: 'Previous', fr: 'Précédent', it: 'Precedente' } as const;
  const nextLabelMap = { hu: 'Következő', de: 'Weiter', en: 'Next', fr: 'Suivant', it: 'Avanti' } as const;
  const lang = (language as keyof typeof saveLabelMap) in saveLabelMap ? language as keyof typeof saveLabelMap : 'hu';

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen">
      <PageHeader
        title={`HYDRO – ${chapterTitle}`}
        onHome={onHome}
        progressPercent={progressPercent}
        showProgress={true}
      />

      {/* Chapter tabs */}
      <div className={`border-b overflow-x-auto ${theme === 'modern' ? 'bg-white/80 backdrop-blur-sm border-blue-100' : 'bg-white border-gray-200'}`}>
        <div className="flex min-w-max px-3 py-2 gap-1">
          <button
            onClick={() => setCurrentChapterIdx(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              currentChapterIdx === 0
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >B0</button>
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapterIdx(idx + 1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                currentChapterIdx === idx + 1
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >B{ch.id}</button>
          ))}
          <button
            onClick={() => setCurrentChapterIdx(totalChapters + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isLast
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >📄 PDF</button>
        </div>
      </div>

      {/* Animated background */}
      <div className={`min-h-screen relative ${
        theme === 'modern'
          ? 'overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20'
          : 'bg-gray-50'
      }`}>
        {theme === 'modern' && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </>
        )}

        <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-x-hidden">

          {/* ── Header card ── */}
          {theme === 'modern' ? (
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                      {chapterTitle}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-cyan-500" />
                      HYDRO Hydraulikus Felvonó Átvételi Protokoll
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {currentChapter ? (
                      <>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {chapterAnswered} / {chapterTotal} kitöltve
                        </div>
                        <div className="text-xs text-gray-500">{chapterPercent}% kész</div>
                      </>
                    ) : (
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {answeredQuestions} / {totalQuestions} összes
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${currentChapter ? chapterPercent : progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{chapterTitle}</h2>
                <div className="text-sm text-gray-600">
                  {currentChapter ? `${chapterAnswered} / ${chapterTotal} kitöltve` : `${answeredQuestions} / ${totalQuestions} összes`}
                </div>
              </div>
              <Progress value={currentChapter ? chapterPercent : progressPercent} className="h-2" />
            </div>
          )}

          {/* ── Content ── */}
          {currentChapterIdx === 0 && (
            <B0Section header={header} setHeader={setHeader} theme={theme} />
          )}
          {currentChapterIdx === totalChapters + 1 && (
            <PdfSection
              onGenerate={handleGeneratePdf}
              isGenerating={isPdfGenerating}
              fabrikationsNr={header.fabrikationsNr}
              onNavigate={onNavigate}
              theme={theme}
            />
          )}
          {currentChapter && (
            <ChapterSection
              chapter={currentChapter}
              answers={answers}
              setAnswer={setAnswer}
              b7={currentChapter.id === 7 ? b7 : undefined}
              setB7={currentChapter.id === 7 ? setB7 : undefined}
              b8Data={currentChapter.id === 8 ? b8 : undefined}
              setB8={currentChapter.id === 8 ? setB8 : undefined}
              b9Data={currentChapter.id === 9 ? b9 : undefined}
              setB9={currentChapter.id === 9 ? setB9 : undefined}
              b1Data={currentChapter.id === 1 ? b1 : undefined}
              setB1={currentChapter.id === 1 ? setB1 : undefined}
              b13Data={currentChapter.id === 13 ? b13 : undefined}
              setB13={currentChapter.id === 13 ? setB13 : undefined}
              theme={theme}
            />
          )}

          {/* ── Navigation ── */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 pt-6 border-t-2 border-blue-100">
            {theme === 'modern' ? (
              <button
                onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
                disabled={currentChapterIdx === 0}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{backLabelMap[lang]}</span>
                </div>
              </button>
            ) : (
              <Button variant="outline" onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
                disabled={currentChapterIdx === 0} className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                <ArrowLeft className="h-4 w-4" />{backLabelMap[lang]}
              </Button>
            )}

            <div className="flex gap-3">
              {/* Save */}
              {theme === 'modern' ? (
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
                    {saveStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{savingLabelMap[lang]}</span></>
                      : saveStatus === 'saved' ? <><CheckCircle2 className="h-5 w-5" /><span>{savedLabelMap[lang]}</span></>
                      : <><Save className="h-5 w-5" /><span>{saveLabelMap[lang]}</span></>}
                  </div>
                </button>
              ) : (
                <Button variant="outline" onClick={handleManualSave} disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{saveStatus === 'saving' ? savingLabelMap[lang] : saveStatus === 'saved' ? savedLabelMap[lang] : saveLabelMap[lang]}</span>
                </Button>
              )}

              {/* Next / PDF */}
              {currentChapterIdx < totalChapters + 1 ? (
                theme === 'modern' ? (
                  <button
                    onClick={() => setCurrentChapterIdx(Math.min(totalChapters + 1, currentChapterIdx + 1))}
                    className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-2 text-white">
                      <span>{nextLabelMap[lang]}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ) : (
                  <Button onClick={() => setCurrentChapterIdx(Math.min(totalChapters + 1, currentChapterIdx + 1))}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    {nextLabelMap[lang]}<ArrowRight className="h-4 w-4" />
                  </Button>
                )
              ) : (
                theme === 'modern' ? (
                  <button
                    onClick={handleGeneratePdf}
                    disabled={isPdfGenerating}
                    className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400" />
                    <div className="relative z-10 flex items-center gap-2 text-white">
                      {isPdfGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      <span>HYDRO PDF</span>
                    </div>
                  </button>
                ) : (
                  <Button onClick={handleGeneratePdf} disabled={isPdfGenerating}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                    {isPdfGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    HYDRO PDF
                  </Button>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// B0 FEJLÉC SZEKCIÓ
// ============================================================

function B0Section({ header, setHeader, theme }: {
  header: HydroHeader;
  setHeader: React.Dispatch<React.SetStateAction<HydroHeader>>;
  theme: 'modern' | 'classic';
}) {
  const upd = (key: keyof HydroHeader, value: string | boolean) =>
    setHeader(prev => ({ ...prev, [key]: value }));

  const cardCls = theme === 'modern'
    ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300'
    : 'shadow-lg overflow-hidden';
  const headerCls = theme === 'modern'
    ? 'relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6'
    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';

  return (
    <Card className={cardCls}>
      <CardHeader className={headerCls}>
        {theme === 'modern' && (
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        )}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-lg">B0</div>
          <CardTitle className="text-xl font-bold">B0 – Allgemeine Informationen</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Installation type */}
        <div>
          <Label className="font-semibold mb-3 block text-gray-700 dark:text-gray-300">Anlage Typ</Label>
          <div className="flex gap-4 flex-wrap">
            {(['Neuanlage', 'Umbau'] as const).map(opt => (
              <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm ${
                header.installationType === opt
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
              }`}>
                <input type="radio" name="installationType" value={opt}
                  checked={header.installationType === opt}
                  onChange={() => upd('installationType', opt)}
                  className="accent-blue-600"
                />{opt}
              </label>
            ))}
          </div>
        </div>
        {/* Cert type */}
        <div>
          <Label className="font-semibold mb-3 block text-gray-700 dark:text-gray-300">Prüfungsart</Label>
          <div className="flex gap-4 flex-wrap">
            {(['Baumusterprüfung', 'Entwurfsprüfung'] as const).map(opt => (
              <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm ${
                header.certType === opt
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
              }`}>
                <input type="radio" name="certType" value={opt}
                  checked={header.certType === opt}
                  onChange={() => upd('certType', opt)}
                  className="accent-blue-600"
                />{opt}
              </label>
            ))}
          </div>
        </div>
        {/* Machine room */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
          header.machineRoomless ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}>
          <Checkbox id="machineRoomless" checked={header.machineRoomless}
            onCheckedChange={v => upd('machineRoomless', !!v)} />
          <Label htmlFor="machineRoomless" className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
            Maschinenraum (MRL)
          </Label>
        </div>
        {/* Text fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['fabrikationsNr', 'Fabrikations-Nr.'],
            ['aufzugstyp', 'Aufzugstyp'],
            ['standortadresse', 'Standortadresse'],
            ['adresse', 'Montagebetrieb / Adresse'],
          ] as [keyof HydroHeader, string][]).map(([key, label]) => (
            <div key={key}>
              <Label className="text-sm mb-1.5 block font-medium text-gray-600 dark:text-gray-400">{label}</Label>
              <Input
                value={header[key] as string}
                onChange={e => upd(key, e.target.value)}
                placeholder={label}
                className="border-blue-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FEJEZET SZEKCIÓ
// ============================================================

function ChapterSection({
  chapter, answers, setAnswer, theme,
  b1Data, setB1, b7, setB7, b8Data, setB8, b9Data, setB9, b13Data, setB13,
}: {
  chapter: Chapter; answers: Record<string, string>; setAnswer: (path: string, value: string) => void; theme: 'modern' | 'classic';
  b1Data?: HydroB1Data; setB1?: React.Dispatch<React.SetStateAction<HydroB1Data>>;
  b7?: HydroB7Components; setB7?: React.Dispatch<React.SetStateAction<HydroB7Components>>;
  b8Data?: HydroB8Data; setB8?: React.Dispatch<React.SetStateAction<HydroB8Data>>;
  b9Data?: HydroB9Data; setB9?: React.Dispatch<React.SetStateAction<HydroB9Data>>;
  b13Data?: HydroB13Data; setB13?: React.Dispatch<React.SetStateAction<HydroB13Data>>;
}) {
  const options = chapter.options ?? DEFAULT_OPTIONS;
  const cardCls = theme === 'modern'
    ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300'
    : 'shadow-lg overflow-hidden';
  const headerCls = theme === 'modern'
    ? 'relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6'
    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';

  return (
    <div className="space-y-6">
      {/* B1 measurements */}
      {chapter.id === 1 && b1Data && setB1 && (
        <Card className={cardCls}>
          <CardHeader className={headerCls}>
            {theme === 'modern' && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />}
            <CardTitle className="relative text-lg font-bold">Messdaten B1</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {([['hubhoehe','Hubhöhe (m)'],['stockwerke','Stockwerke'],['zugaenge','Zugänge'],['nennlast','Nennlast (kg)'],['personen','Personen'],['anforderungen','Anforderungen']] as [keyof HydroB1Data, string][]).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-blue-700 dark:text-blue-300">{label}</Label>
                  <Input value={b1Data[key]} onChange={e => setB1(p => ({ ...p, [key]: e.target.value }))} placeholder={label} className="text-sm border-blue-200 focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* B7 hydraulic checkboxes */}
      {chapter.id === 7 && b7 && setB7 && (
        <Card className={cardCls}>
          <CardHeader className={theme === 'modern' ? 'relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-white p-5' : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'}>
            {theme === 'modern' && <div className="absolute inset-0 opacity-30 animate-pulse bg-gradient-to-r from-amber-400 to-orange-500" />}
            <CardTitle className="relative text-lg font-bold">Hydraulische Komponenten</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              {([['fang','Fangvorrichtung'],['ausgleich','Ausgleichsgewicht'],['begrenzer','Geschw.-begrenzer'],['rohrbruch','Rohrbruchventil'],['drossel','Drosselventil']] as [keyof HydroB7Components, string][]).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                  b7[key] ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                }`}>
                  <Checkbox checked={b7[key]} onCheckedChange={v => setB7(p => ({ ...p, [key]: !!v }))} />{label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* B8 measurements */}
      {chapter.id === 8 && b8Data && setB8 && (
        <Card className={cardCls}>
          <CardHeader className={theme === 'modern' ? 'relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400 text-white p-6' : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'}>
            {theme === 'modern' && <div className="absolute inset-0 opacity-30 animate-pulse bg-gradient-to-r from-violet-400 to-purple-500" />}
            <CardTitle className="relative text-lg font-bold">Aggregat Messdaten B8</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {([['hersteller','Aggregat Hersteller'],['aggregatTyp','Aggregat Typ'],['motortyp','Motor Typ'],['aggregatNr','Aggregat Nr.'],['nennstrom','Nennstrom (A)'],['motorleistung','Motorleistung (kW)'],['nennlast','Druck Nennlast (bar)'],['leerlast','Druck Leerlast (bar)'],['nennlastAuf','Nennlast Auf (bar)'],['leerlastAb','Leerlast Ab (bar)'],['druckbegrenzung','Druckbegrenzung (bar)']] as [keyof HydroB8Data, string][]).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-purple-700 dark:text-purple-300">{label}</Label>
                  <Input value={b8Data[key]} onChange={e => setB8(p => ({ ...p, [key]: e.target.value }))} placeholder={label} className="text-sm border-purple-200 focus:ring-2 focus:ring-purple-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* B9 measurements */}
      {chapter.id === 9 && b9Data && setB9 && (
        <Card className={cardCls}>
          <CardHeader className={theme === 'modern' ? 'relative overflow-hidden bg-gradient-to-r from-cyan-600 via-sky-500 to-teal-400 text-white p-6' : 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'}>
            {theme === 'modern' && <div className="absolute inset-0 opacity-30 animate-pulse bg-gradient-to-r from-sky-400 to-cyan-500" />}
            <CardTitle className="relative text-lg font-bold">Elektrische Messdaten B9</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {([['sollAuf','Soll-Geschw. aufwärts (m/s)'],['sollAb','Soll-Geschw. abwärts (m/s)'],['istLeerAuf','IST Leer aufwärts (m/s)'],['istNennlastAb','IST Nennlast abwärts (m/s)'],['stromLeer','Strom Leer (A)'],['stromNennlast','Strom Nennlast (A)'],['netzspannung','Netzspannung (V)'],['steuerspannung','Steuerspannung (V)']] as [keyof HydroB9Data, string][]).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-cyan-700 dark:text-cyan-300">{label}</Label>
                  <Input value={b9Data[key]} onChange={e => setB9(p => ({ ...p, [key]: e.target.value }))} placeholder={label} className="text-sm border-cyan-200 focus:ring-2 focus:ring-cyan-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* B13 text fields */}
      {chapter.id === 13 && b13Data && setB13 && (
        <Card className={cardCls}>
          <CardHeader className={theme === 'modern' ? 'relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 text-white p-6' : 'bg-gradient-to-r from-green-500 to-green-600 text-white'}>
            {theme === 'modern' && <div className="absolute inset-0 opacity-30 animate-pulse bg-gradient-to-r from-emerald-400 to-green-500" />}
            <CardTitle className="relative text-lg font-bold">Konformitätserklärung B13</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([['firma','Firma'],['nameAbnahme','Name Abnahmetechniker'],['datum','Datum'],['bauseitigePendenzen','Bauseitige Pendenzen'],['aufzugsseitigePendenzen','Aufzugsseitige Pendenzen']] as [keyof HydroB13Data, string][]).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-green-700 dark:text-green-300">{label}</Label>
                  <Input type={key === 'datum' ? 'date' : 'text'} value={b13Data[key]}
                    onChange={e => setB13(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-green-200 focus:ring-2 focus:ring-green-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions card */}
      <Card className={cardCls}>
        <CardHeader className={headerCls}>
          {theme === 'modern' && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />}
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-lg">
              B{chapter.id}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{chapter.title}</CardTitle>
              <p className="text-white/80 text-sm mt-0.5">
                {chapter.paths.filter(p => answers[p]).length} / {chapter.paths.length} kitöltve
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {chapter.paths.map((path) => {
            const rowOptions = chapter.specialOptions?.[path] ?? options;
            const current = answers[path] ?? '';
            const rowBg = current ? ROW_BG[current] : '';
            return (
              <div
                key={path}
                className={`relative border-b last:border-b-0 transition-all duration-300 ${
                  rowBg || (theme === 'modern' ? 'bg-white hover:bg-blue-50/30' : 'bg-white hover:bg-gray-50')
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4">
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 w-24">{path}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {rowOptions.map(opt => {
                      const isSelected = current === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(path, opt)}
                          className={`
                            relative inline-flex items-center justify-center rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap
                            ${isSelected ? PILL_ACTIVE[opt] : `bg-white text-gray-700 border-gray-300 ${PILL_HOVER[opt]}`}
                          `}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PDF GENERÁLÁS SZEKCIÓ
// ============================================================

function PdfSection({ onGenerate, isGenerating, fabrikationsNr, onNavigate, theme }: {
  onGenerate: () => void; isGenerating: boolean; fabrikationsNr: string;
  onNavigate?: (screen: string) => void; theme: 'modern' | 'classic';
}) {
  const cardBase = theme === 'modern'
    ? 'shadow-xl border-2 overflow-hidden hover:shadow-2xl transition-shadow duration-300'
    : 'shadow-lg overflow-hidden';

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* HYDRO PDF */}
      <Card className={`${cardBase} border-blue-200`}>
        <CardHeader className={theme === 'modern'
          ? 'relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6'
          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}>
          {theme === 'modern' && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />}
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">HYDRO Protokoll PDF</CardTitle>
              <p className="text-white/80 text-sm mt-1">
                {fabrikationsNr ? `Gyártási szám: ${fabrikationsNr}` : 'Az összes B0–B14 adat kitöltve az ABNAHME_HYDRO.pdf-be'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {theme === 'modern' ? (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="group relative overflow-hidden w-full px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-center gap-3 text-white text-lg">
                {isGenerating ? <><Loader2 className="h-6 w-6 animate-spin" /> Generálás folyamatban...</>
                  : <><Download className="h-6 w-6" /> HYDRO PDF letöltése</>}
              </div>
            </button>
          ) : (
            <Button onClick={onGenerate} disabled={isGenerating} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isGenerating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generálás...</> : <><Download className="h-5 w-5 mr-2" />HYDRO PDF letöltése</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grounding */}
      <Card className={`${cardBase} border-green-200`}>
        <CardHeader className={theme === 'modern'
          ? 'relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 text-white p-6'
          : 'bg-gradient-to-r from-green-500 to-green-600 text-white'}>
          {theme === 'modern' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 opacity-30 animate-pulse" />}
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-3xl">⚡</div>
            <div>
              <CardTitle className="text-xl font-bold">Grounding Protokoll</CardTitle>
              <p className="text-white/80 text-sm mt-1">Földelés ellenőrzési mérési lap + PDF</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {theme === 'modern' ? (
            <button onClick={() => onNavigate?.('erdungskontrolle')}
              className="group relative overflow-hidden w-full px-8 py-4 rounded-xl border-2 border-green-500 text-green-700 font-semibold transition-all hover:bg-green-50">
              <div className="flex items-center justify-center gap-2">
                <span>Grounding megnyitása</span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ) : (
            <Button onClick={() => onNavigate?.('erdungskontrolle')} variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
              <ChevronRight className="h-4 w-4 mr-2" />Grounding megnyitása
            </Button>
          )}
        </CardContent>
      </Card>

      {/* NIV */}
      <Card className={`${cardBase} border-purple-200`}>
        <CardHeader className={theme === 'modern'
          ? 'relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400 text-white p-6'
          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'}>
          {theme === 'modern' && <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-400 opacity-30 animate-pulse" />}
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-3xl">📊</div>
            <div>
              <CardTitle className="text-xl font-bold">NIV Protokoll</CardTitle>
              <p className="text-white/80 text-sm mt-1">Niedervolt mérési táblázat + PDF</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {theme === 'modern' ? (
            <button onClick={() => onNavigate?.('niedervolt')}
              className="group relative overflow-hidden w-full px-8 py-4 rounded-xl border-2 border-purple-500 text-purple-700 font-semibold transition-all hover:bg-purple-50">
              <div className="flex items-center justify-center gap-2">
                <span>NIV megnyitása</span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ) : (
            <Button onClick={() => onNavigate?.('niedervolt')} variant="outline" className="w-full border-purple-500 text-purple-700 hover:bg-purple-50">
              <ChevronRight className="h-4 w-4 mr-2" />NIV megnyitása
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// HELPER
// ============================================================

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default HydroQuestionnaire;

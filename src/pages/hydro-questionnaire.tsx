// src/pages/hydro-questionnaire.tsx
// Önálló HYDRO (MOD_HYD) protokoll kérdőív
// A HYDRO PDF AcroForm kitöltéséhez szükséges adatokat gyűjti össze fejezetek szerint

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/queryClient';
import { ChevronLeft, ChevronRight, Download, Loader2, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

// ============================================================
// KÉRDÉS ADATOK (TXT + PDF elemzés alapján)
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
  {
    id: 1,
    title: 'B1 – Aufzugsbuch',
    paths: ['1'],
    options: ['Ja', 'keine', 'nz'],
  },
  {
    id: 2,
    title: 'B2 – Schacht',
    paths: ['2.1.2','2.1.3','2.1.4','2.1.5','2.1.6','2.1.7',
             '2.2.1','2.2.2','2.2.3','2.2.4','2.2.5','2.2.6',
             '2.3.1','2.3.2','2.3.3','2.3.4','2.3.5','2.3.6','2.3.7','2.3.8',
             '2.4.1','2.4.2','2.5.1','2.6.1','2.7.1'],
  },
  {
    id: 3,
    title: 'B3 – Schachttüren / Fahrkorbtüren',
    paths: ['3.1.1','3.1.2','3.1.3','3.1.4','3.1.5','3.1.6','3.1.7',
             '3.2.1','3.2.2','3.2.3','3.2.4',
             '3.3.1.1','3.3.1.2','3.3.1.3','3.3.1.4','3.3.2.1',
             '3.4.1','3.4.2','3.4.3','3.4.4','3.4.5','3.4.6','3.4.7','3.4.8','3.4.9',
             '3.4.10','3.4.11','3.4.12','3.4.13','3.4.14','3.4.15','3.4.16','3.4.17','3.4.18','3.4.19',
             '3.5.1','3.5.2','3.5.3','3.5.4',
             '3.6.1','3.6.2','3.6.2_A','3.6.2_B','3.6.2_C','3.6.3','3.7.1','4.1.3'],
  },
  {
    id: 4,
    title: 'B4 – Fahrkorb',
    paths: ['4.1.1','4.1.2','4.1.4','4.1.5','4.1.6','4.1.7','4.1.8','4.1.9',
             '4.1.10','4.1.11','4.1.12','4.1.13','4.1.14','4.1.15','4.1.16','4.1.17','4.1.18','4.1.19',
             '4.2.1'],
  },
  {
    id: 5,
    title: 'B5 – Fahrkorb (Innenraum/Türen)',
    paths: ['5.1.1','5.1.2','5.1.3','5.1.4','5.1.5','5.1.6','5.1.7','5.1.8','5.1.9','5.1.10',
             '5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.2.6',
             '5.3.1','5.3.2','5.3.3','5.3.4','5.3.5','5.3.6','5.3.7','5.3.8','5.3.9','5.3.10',
             '5.4.1','5.4.2','5.4.3','5.4.4','5.4.5','5.4.6','5.4.7','5.4.8','5.4.9','5.5.1'],
  },
  {
    id: 6,
    title: 'B6 – Aufhängung',
    paths: ['6.3','6.4.1','6.4.2','6.4.3','6.4.4','6.4.5','6.4.6','6.5.1',
             'A.6.1','A.6.2','B.6.1','B.6.2','C.6.1'],
  },
  {
    id: 7,
    title: 'B7 – Fangvorrichtung / Hydraulik',
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
    id: 8,
    title: 'B8 – Hydraulikanlage',
    paths: ['8.1.1','8.1.2','8.1.3','8.1.4','8.1.5','8.1.6',
             '8.2.1','8.3.1','8.3.2',
             '8.4.1.1','8.4.2.1','8.4.2.2','8.4.3.1',
             '8.5.2','8.5.3','8.6.1','8.6.2','8.6.3','8.7.1'],
  },
  {
    id: 9,
    title: 'B9 – Elektrische Anlage',
    paths: ['9.1.1.1','9.1.1.2','9.2.1','9.2.1_a','9.2.2','9.2.3'],
  },
  {
    id: 10,
    title: 'B10 – Allgemeine Prüfungen',
    paths: ['10.1','10.2','10.3','10.4','10.5','10.6','10.7'],
    specialOptions: { '10.1': ['Ja','Nein','nz','U','Siehe'] },
  },
  {
    id: 11,
    title: 'B11 – Prüfungen unter Last',
    paths: ['11.1_Main','11.1.1','11.1.2','11.1.3','11.1.4','11.1.5',
             '11.2.1','11.2.2','11.2.3','11.2.4','11.2.5',
             '11.3.1','11.3.2','11.3.3','11.3.4','11.3.5','11.3.6','11.3.7','11.3.8','11.3.9','11.3.10','11.3.11'],
  },
  {
    id: 12,
    title: 'B12 – Unterlagen',
    paths: ['16.2','16.3'],
    options: ['Ja','Nein','U'],
  },
  {
    id: 13,
    title: 'B13 – Konformitätserklärung',
    paths: ['13.1','13.2','13.3','13.4'],
  },
  {
    id: 14,
    title: 'B14 – Nachkontrolle',
    paths: ['14.1.1','14.1.2','14.2.1','14.2.2'],
  },
];

const DEFAULT_OPTIONS: QuestionOption[] = ['Ja', 'Nein', 'nz', 'U'];
const OPTION_COLORS: Record<string, string> = {
  Ja: 'text-green-700 dark:text-green-400',
  Nein: 'text-red-700 dark:text-red-400',
  nz: 'text-gray-500 dark:text-gray-400',
  U: 'text-blue-600 dark:text-blue-400',
  Siehe: 'text-purple-600 dark:text-purple-400',
  keine: 'text-orange-600 dark:text-orange-400',
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

interface HydroB1Data {
  hubhoehe: string; stockwerke: string; zugaenge: string;
  nennlast: string; personen: string; anforderungen: string;
}

interface HydroB7Components {
  fang: boolean; ausgleich: boolean; begrenzer: boolean;
  rohrbruch: boolean; drossel: boolean;
}

interface HydroB8Data {
  hersteller: string; aggregatTyp: string; motortyp: string;
  aggregatNr: string; nennstrom: string; motorleistung: string;
  nennlast: string; leerlast: string; nennlastAuf: string;
  leerlastAb: string; druckbegrenzung: string;
}

interface HydroB9Data {
  sollAuf: string; sollAb: string;
  istLeerAuf: string; istNennlastAb: string;
  stromLeer: string; stromNennlast: string;
  netzspannung: string; steuerspannung: string;
}

interface HydroB13Data {
  firma: string; nameAbnahme: string; datum: string;
  bauseitigePendenzen: string; aufzugsseitigePendenzen: string;
}

const STORAGE_KEY = 'hydro-form-data';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveState(state: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ============================================================
// FŐ KOMPONENS
// ============================================================

interface HydroQuestionnaireProps {
  onHome: () => void;
}

export function HydroQuestionnaire({ onHome }: HydroQuestionnaireProps) {
  const { toast } = useToast();

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Persisted state
  const saved = loadState();

  const [header, setHeader] = useState<HydroHeader>(saved?.header ?? {
    installationType: 'Neuanlage',
    certType: 'Baumusterprüfung',
    machineRoomless: false,
    fabrikationsNr: '',
    aufzugstyp: '',
    standortadresse: '',
    adresse: '',
  });

  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [b1, setB1] = useState<HydroB1Data>(saved?.b1 ?? { hubhoehe:'', stockwerke:'', zugaenge:'', nennlast:'', personen:'', anforderungen:'' });
  const [b7, setB7] = useState<HydroB7Components>(saved?.b7 ?? { fang:false, ausgleich:false, begrenzer:false, rohrbruch:false, drossel:false });
  const [b8, setB8] = useState<HydroB8Data>(saved?.b8 ?? { hersteller:'', aggregatTyp:'', motortyp:'', aggregatNr:'', nennstrom:'', motorleistung:'', nennlast:'', leerlast:'', nennlastAuf:'', leerlastAb:'', druckbegrenzung:'' });
  const [b9, setB9] = useState<HydroB9Data>(saved?.b9 ?? { sollAuf:'', sollAb:'', istLeerAuf:'', istNennlastAb:'', stromLeer:'', stromNennlast:'', netzspannung:'', steuerspannung:'' });
  const [b13, setB13] = useState<HydroB13Data>(saved?.b13 ?? { firma:'', nameAbnahme:'', datum: new Date().toISOString().split('T')[0], bauseitigePendenzen:'', aufzugsseitigePendenzen:'' });

  // Autosave whenever state changes
  useEffect(() => {
    saveState({ header, answers, b1, b7, b8, b9, b13 });
  }, [header, answers, b1, b7, b8, b9, b13]);

  const setAnswer = useCallback((path: string, value: string) => {
    setAnswers(prev => ({ ...prev, [path]: value }));
  }, []);

  // ---- PDF GENERÁLÁS ----
  const handleGeneratePdf = useCallback(async () => {
    setIsPdfGenerating(true);
    try {
      const hydroData = {
        installationType: header.installationType,
        certType: header.certType,
        machineRoomless: header.machineRoomless,
        fabrikationsNr: header.fabrikationsNr,
        aufzugstyp: header.aufzugstyp,
        standortadresse: header.standortadresse,
        adresse: header.adresse,
        b1_hubhoehe: b1.hubhoehe,
        b1_stockwerke: b1.stockwerke,
        b1_zugaenge: b1.zugaenge,
        b1_nennlast: b1.nennlast,
        b1_personen: b1.personen,
        b1_anforderungen: b1.anforderungen,
        b7_fang: b7.fang,
        b7_ausgleich: b7.ausgleich,
        b7_begrenzer: b7.begrenzer,
        b7_rohrbruch: b7.rohrbruch,
        b7_drossel: b7.drossel,
        b8_hersteller: b8.hersteller,
        b8_aggregatTyp: b8.aggregatTyp,
        b8_motortyp: b8.motortyp,
        b8_aggregatNr: b8.aggregatNr,
        b8_nennstrom: b8.nennstrom,
        b8_motorleistung: b8.motorleistung,
        b8_nennlast: b8.nennlast,
        b8_leerlast: b8.leerlast,
        b8_nennlastAuf: b8.nennlastAuf,
        b8_leerlastAb: b8.leerlastAb,
        b8_druckbegrenzung: b8.druckbegrenzung,
        b9_sollAuf: b9.sollAuf,
        b9_sollAb: b9.sollAb,
        b9_istLeerAuf: b9.istLeerAuf,
        b9_istNennlastAb: b9.istNennlastAb,
        b9_stromLeer: b9.stromLeer,
        b9_stromNennlast: b9.stromNennlast,
        b9_netzspannung: b9.netzspannung,
        b9_steuerspannung: b9.steuerspannung,
        b13_firma: b13.firma,
        b13_nameAbnahme: b13.nameAbnahme,
        b13_datum: b13.datum,
        b13_bauseitigePendenzen: b13.bauseitigePendenzen,
        b13_aufzugsseitigePendenzen: b13.aufzugsseitigePendenzen,
        questionAnswers: answers,
      };

      const response = await fetch(getApiUrl('/api/protocols/download-hydro-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hydroData }),
      });

      if (!response.ok) {
        let errMsg = 'HYDRO PDF generálási hiba';
        try { const j = await response.json(); errMsg = j?.message || errMsg; } catch { /* noop */ }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const fabNr = header.fabrikationsNr
        ? String(header.fabrikationsNr).replace(/[^a-zA-Z0-9]/g, '_')
        : 'HYDRO';
      const filename = `ABNAHME_HYDRO_${fabNr}_${new Date().toISOString().split('T')[0]}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64 = await blobToBase64(blob);
        const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents });
        try { await FileOpener.open({ filePath: result.uri, contentType: 'application/pdf' }); } catch { /* noop */ }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }

      toast({ title: '✅ HYDRO PDF letöltve', description: filename });
    } catch (error) {
      toast({ title: 'Hiba', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsPdfGenerating(false);
    }
  }, [header, answers, b1, b7, b8, b9, b13, toast]);

  const totalChapters = CHAPTERS.length;
  // Index 0 = B0 header, 1..totalChapters = B1..B14, totalChapters+1 = PDF
  const isLast = currentChapterIdx === totalChapters + 1;
  const currentChapter = (currentChapterIdx > 0 && currentChapterIdx <= totalChapters)
    ? CHAPTERS[currentChapterIdx - 1]
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <PageHeader
        title={`HYDRO – ${
          currentChapterIdx === 0 ? 'B0 Allgemeine Informationen' :
          currentChapter ? currentChapter.title :
          'PDF Generálás'
        }`}
        onHome={onHome}
      />

      {/* Chapter progress tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex min-w-max px-2 py-1 gap-1">
          <button
            onClick={() => setCurrentChapterIdx(0)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              currentChapterIdx === 0
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            B0
          </button>
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapterIdx(idx + 1)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                currentChapterIdx === idx + 1
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              B{ch.id}
            </button>
          ))}
          <button
            onClick={() => setCurrentChapterIdx(totalChapters + 1)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              isLast
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {currentChapterIdx === 0 && (
          <B0Section header={header} setHeader={setHeader} />
        )}
        {currentChapterIdx === totalChapters + 1 && (
          <PdfSection
            onGenerate={handleGeneratePdf}
            isGenerating={isPdfGenerating}
            fabrikationsNr={header.fabrikationsNr}
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
          />
        )}
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
          disabled={currentChapterIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Előző
        </Button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentChapterIdx === 0 ? 'B0' : currentChapter ? currentChapter.title.split(' ')[0] : 'PDF'} 
          {' '}{currentChapterIdx + 1} / {totalChapters + 2}
        </span>
        {currentChapterIdx < totalChapters + 1 ? (
          <Button
            onClick={() => setCurrentChapterIdx(Math.min(totalChapters + 1, currentChapterIdx + 1))}
          >
            Következő <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleGeneratePdf}
            disabled={isPdfGenerating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPdfGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            HYDRO PDF
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// B0 FEJLÉC SZEKCIÓ
// ============================================================

function B0Section({ header, setHeader }: {
  header: HydroHeader;
  setHeader: React.Dispatch<React.SetStateAction<HydroHeader>>;
}) {
  const upd = (key: keyof HydroHeader, value: string | boolean) =>
    setHeader(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">B0 – Allgemeine Informationen</h2>

      {/* Installation type */}
      <div>
        <Label className="font-medium mb-2 block">Anlage Typ</Label>
        <div className="flex gap-4">
          {(['Neuanlage', 'Umbau'] as const).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="installationType" value={opt}
                checked={header.installationType === opt}
                onChange={() => upd('installationType', opt)}
                className="accent-blue-600"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cert type */}
      <div>
        <Label className="font-medium mb-2 block">Prüfungsart</Label>
        <div className="flex gap-4">
          {(['Baumusterprüfung', 'Entwurfsprüfung'] as const).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="certType" value={opt}
                checked={header.certType === opt}
                onChange={() => upd('certType', opt)}
                className="accent-blue-600"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Machine room */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="machineRoomless"
          checked={header.machineRoomless}
          onCheckedChange={(v) => upd('machineRoomless', !!v)}
        />
        <Label htmlFor="machineRoomless" className="cursor-pointer">Maschinenraum (MRL)</Label>
      </div>

      {/* Text fields */}
      {([
        ['fabrikationsNr', 'Fabrikations-Nr.'],
        ['aufzugstyp', 'Aufzugstyp'],
        ['standortadresse', 'Standortadresse'],
        ['adresse', 'Montagebetrieb / Adresse'],
      ] as [keyof HydroHeader, string][]).map(([key, label]) => (
        <div key={key}>
          <Label className="text-sm mb-1 block">{label}</Label>
          <Input
            value={header[key] as string}
            onChange={e => upd(key, e.target.value)}
            placeholder={label}
            className="max-w-md"
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FEJEZET SZEKCIÓ (questions + optional special fields)
// ============================================================

function ChapterSection({
  chapter, answers, setAnswer,
  b1Data, setB1, b7, setB7, b8Data, setB8, b9Data, setB9, b13Data, setB13,
}: {
  chapter: Chapter;
  answers: Record<string, string>;
  setAnswer: (path: string, value: string) => void;
  b1Data?: HydroB1Data; setB1?: React.Dispatch<React.SetStateAction<HydroB1Data>>;
  b7?: HydroB7Components; setB7?: React.Dispatch<React.SetStateAction<HydroB7Components>>;
  b8Data?: HydroB8Data; setB8?: React.Dispatch<React.SetStateAction<HydroB8Data>>;
  b9Data?: HydroB9Data; setB9?: React.Dispatch<React.SetStateAction<HydroB9Data>>;
  b13Data?: HydroB13Data; setB13?: React.Dispatch<React.SetStateAction<HydroB13Data>>;
}) {
  const options = chapter.options ?? DEFAULT_OPTIONS;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{chapter.title}</h2>

      {/* B1 special measurement fields */}
      {chapter.id === 1 && b1Data && setB1 && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {([
            ['hubhoehe', 'Hubhöhe (m)'],
            ['stockwerke', 'Stockwerke'],
            ['zugaenge', 'Zugänge'],
            ['nennlast', 'Nennlast (kg)'],
            ['personen', 'Personen'],
            ['anforderungen', 'Anforderungen'],
          ] as [keyof HydroB1Data, string][]).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs mb-1 block text-blue-700 dark:text-blue-300">{label}</Label>
              <Input
                value={b1Data[key]}
                onChange={e => setB1(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                className="text-sm h-8"
              />
            </div>
          ))}
        </div>
      )}

      {/* B7 hydraulic component checkboxes */}
      {chapter.id === 7 && b7 && setB7 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-4">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Hydraulische Komponenten</p>
          <div className="flex flex-wrap gap-4">
            {([
              ['fang', 'Fangvorrichtung'],
              ['ausgleich', 'Ausgleichsgewicht'],
              ['begrenzer', 'Geschw.-begrenzer'],
              ['rohrbruch', 'Rohrbruchventil'],
              ['drossel', 'Drosselventil'],
            ] as [keyof HydroB7Components, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={b7[key]}
                  onCheckedChange={v => setB7(prev => ({ ...prev, [key]: !!v }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* B8 measurement fields */}
      {chapter.id === 8 && b8Data && setB8 && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          {([
            ['hersteller', 'Aggregat Hersteller'],
            ['aggregatTyp', 'Aggregat Typ'],
            ['motortyp', 'Motor Typ'],
            ['aggregatNr', 'Aggregat Nr.'],
            ['nennstrom', 'Nennstrom (A)'],
            ['motorleistung', 'Motorleistung (kW)'],
            ['nennlast', 'Druck Nennlast (bar)'],
            ['leerlast', 'Druck Leerlast (bar)'],
            ['nennlastAuf', 'Nennlast Auf (bar)'],
            ['leerlastAb', 'Leerlast Ab (bar)'],
            ['druckbegrenzung', 'Druckbegrenzung (bar)'],
          ] as [keyof HydroB8Data, string][]).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs mb-1 block text-purple-700 dark:text-purple-300">{label}</Label>
              <Input
                value={b8Data[key]}
                onChange={e => setB8(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                className="text-sm h-8"
              />
            </div>
          ))}
        </div>
      )}

      {/* B9 measurement fields */}
      {chapter.id === 9 && b9Data && setB9 && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
          {([
            ['sollAuf', 'Soll-Geschw. aufwärts (m/s)'],
            ['sollAb', 'Soll-Geschw. abwärts (m/s)'],
            ['istLeerAuf', 'IST Leer aufwärts (m/s)'],
            ['istNennlastAb', 'IST Nennlast abwärts (m/s)'],
            ['stromLeer', 'Strom Leer (A)'],
            ['stromNennlast', 'Strom Nennlast (A)'],
            ['netzspannung', 'Netzspannung (V)'],
            ['steuerspannung', 'Steuerspannung (V)'],
          ] as [keyof HydroB9Data, string][]).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs mb-1 block text-cyan-700 dark:text-cyan-300">{label}</Label>
              <Input
                value={b9Data[key]}
                onChange={e => setB9(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                className="text-sm h-8"
              />
            </div>
          ))}
        </div>
      )}

      {/* B13 text fields */}
      {chapter.id === 13 && b13Data && setB13 && (
        <div className="grid grid-cols-1 gap-3 mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          {([
            ['firma', 'Firma'],
            ['nameAbnahme', 'Name Abnahmetechniker'],
            ['datum', 'Datum'],
            ['bauseitigePendenzen', 'Bauseitige Pendenzen'],
            ['aufzugsseitigePendenzen', 'Aufzugsseitige Pendenzen'],
          ] as [keyof HydroB13Data, string][]).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs mb-1 block text-green-700 dark:text-green-300">{label}</Label>
              <Input
                type={key === 'datum' ? 'date' : 'text'}
                value={b13Data[key]}
                onChange={e => setB13(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                className="text-sm max-w-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Questions table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300 w-24">Nr.</th>
                {options.map(opt => (
                  <th key={opt} className={`text-center px-2 py-2 font-medium ${OPTION_COLORS[opt]} w-14`}>{opt}</th>
                ))}
                {/* Extra options from specialOptions */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {chapter.paths.map((path, rowIdx) => {
                const rowOptions = chapter.specialOptions?.[path] ?? options;
                const current = answers[path] ?? '';
                const isEven = rowIdx % 2 === 0;
                return (
                  <tr
                    key={path}
                    className={`${isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'} hover:bg-blue-50/30 dark:hover:bg-blue-900/10`}
                  >
                    <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400 text-xs">{path}</td>
                    {rowOptions.map(opt => (
                      <td key={opt} className="text-center px-2 py-2">
                        <label className="cursor-pointer inline-flex items-center justify-center w-full h-full">
                          <input
                            type="radio"
                            name={`q-${path}`}
                            value={opt}
                            checked={current === opt}
                            onChange={() => setAnswer(path, opt)}
                            className="accent-blue-600"
                          />
                        </label>
                      </td>
                    ))}
                    {/* Fill remaining columns if specialOptions has fewer */}
                    {rowOptions.length < options.length + (chapter.specialOptions ? 1 : 0) && (
                      Array.from({ length: (options.length - rowOptions.length) }).map((_, i) => (
                        <td key={`empty-${i}`} />
                      ))
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress indicator */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {chapter.paths.filter(p => answers[p]).length} / {chapter.paths.length} kitöltve
      </p>
    </div>
  );
}

// ============================================================
// PDF GENERÁLÁS SZEKCIÓ
// ============================================================

function PdfSection({
  onGenerate,
  isGenerating,
  fabrikationsNr,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
  fabrikationsNr: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
        <FileText className="h-10 w-10 text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">HYDRO PDF Generálás</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          Az összes kitöltött adat bekerül az ABNAHME_HYDRO.pdf AcroForm mezőibe.
          {fabrikationsNr && <><br /><span className="font-mono font-medium">{fabrikationsNr}</span></>}
        </p>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 h-auto text-lg shadow-lg"
      >
        {isGenerating ? (
          <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> Generálás...</>
        ) : (
          <><Download className="h-6 w-6 mr-3" /> HYDRO PDF letöltése</>
        )}
      </Button>
    </div>
  );
}

// ============================================================
// HELPER: Blob → Base64
// ============================================================

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default HydroQuestionnaire;

// src/pages/hydro-questionnaire.tsx
// Önálló HYDRO (MOD_HYD) protokoll kérdőív — Grounding-stílusú UI

import { useState, useCallback, useEffect, Fragment } from 'react';
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
// TÍPUSOK
// ============================================================

type Lang = 'hu' | 'de' | 'en' | 'fr' | 'it';
type QuestionOption = 'Ja' | 'Nein' | 'nz' | 'U' | 'Siehe' | 'keine';

function toLang(l: string): Lang {
  return (['hu', 'de', 'en', 'fr', 'it'] as Lang[]).includes(l as Lang) ? (l as Lang) : 'hu';
}

// ============================================================
// FORDÍTÁSOK
// ============================================================

const T = {
  completed:     { hu: 'kitöltve',   de: 'ausgefüllt',  en: 'completed',   fr: 'complété',   it: 'completato'  },
  total:         { hu: 'összes',     de: 'gesamt',      en: 'total',       fr: 'total',      it: 'totale'      },
  done:          { hu: 'kész',       de: 'fertig',      en: 'done',        fr: 'terminé',    it: 'completato'  },
  save:          { hu: 'Mentés',     de: 'Speichern',   en: 'Save',        fr: 'Sauvegarder',it: 'Salva'       },
  saving:        { hu: 'Mentés...',  de: 'Speichern...',en: 'Saving...',   fr: 'Sauvegarde...',it:'Salvataggio...'},
  saved:         { hu: 'Mentve',     de: 'Gespeichert', en: 'Saved',       fr: 'Sauvegardé', it: 'Salvato'     },
  prev:          { hu: 'Előző',      de: 'Zurück',      en: 'Previous',    fr: 'Précédent',  it: 'Precedente'  },
  next:          { hu: 'Következő',  de: 'Weiter',      en: 'Next',        fr: 'Suivant',    it: 'Avanti'      },
  hydroSubtitle: {
    hu: 'HYDRO Hydraulikus Felvonó Átvételi Protokoll',
    de: 'HYDRO Hydraulischer Aufzug Abnahmeprotokoll',
    en: 'HYDRO Hydraulic Elevator Acceptance Protocol',
    fr: 'HYDRO Protocole de réception ascenseur hydraulique',
    it: 'HYDRO Protocollo di accettazione ascensore idraulico',
  },
  // B0
  anlageTyp:     { hu: 'Berendezés típusa',   de: 'Anlage Typ',       en: 'Installation Type',    fr: "Type d'installation",   it: 'Tipo di installazione' },
  pruefungsart:  { hu: 'Vizsgálat típusa',     de: 'Prüfungsart',      en: 'Inspection Type',      fr: "Type d'inspection",     it: 'Tipo di ispezione'     },
  mrl:           { hu: 'Gépházmentes (MRL)',   de: 'Maschinenraum (MRL)', en: 'Machine Room (MRL)', fr: 'Salle des machines (MRL)', it: 'Locale macchine (MRL)' },
  b0CardTitle:   {
    hu: 'B0 – Általános információk',
    de: 'B0 – Allgemeine Informationen',
    en: 'B0 – General Information',
    fr: 'B0 – Informations générales',
    it: 'B0 – Informazioni generali',
  },
  // B1
  b1CardTitle:   { hu: 'B1 – Mérési adatok',     de: 'Messdaten B1',            en: 'Measurement Data B1',     fr: 'Données de mesure B1',   it: 'Dati di misura B1'       },
  // B7
  b7CardTitle:   { hu: 'Hidraulikus komponensek', de: 'Hydraulische Komponenten',en: 'Hydraulic Components',    fr: 'Composants hydrauliques', it: 'Componenti idraulici'    },
  // B8
  b8CardTitle:   { hu: 'B8 – Aggregát mérések',   de: 'Aggregat Messdaten B8',   en: 'Aggregate Data B8',       fr: 'Données agrégat B8',     it: 'Dati aggregato B8'       },
  // B9
  b9CardTitle:   { hu: 'B9 – Elektromos mérések', de: 'Elektrische Messdaten B9',en: 'Electrical Data B9',      fr: 'Données électriques B9', it: 'Dati elettrici B9'       },
  // B13
  b13CardTitle:  {
    hu: 'B13 – Megfelelőségi nyilatkozat',
    de: 'Konformitätserklärung B13',
    en: 'Declaration of Conformity B13',
    fr: 'Déclaration de conformité B13',
    it: 'Dichiarazione di conformità B13',
  },
  // PDF section
  hydroTitle:    { hu: 'HYDRO Protokoll PDF', de: 'HYDRO Protokoll PDF', en: 'HYDRO Protocol PDF', fr: 'PDF Protocole HYDRO', it: 'PDF Protocollo HYDRO' },
  hydroDesc:     {
    hu: 'Az összes B0–B14 adat bekerül az ABNAHME_HYDRO.pdf AcroForm mezőibe.',
    de: 'Alle B0–B14 Daten werden in die AcroForm-Felder der ABNAHME_HYDRO.pdf eingetragen.',
    en: 'All B0–B14 data will be filled into the ABNAHME_HYDRO.pdf AcroForm fields.',
    fr: 'Toutes les données B0–B14 seront saisies dans les champs AcroForm du fichier ABNAHME_HYDRO.pdf.',
    it: 'Tutti i dati B0–B14 verranno inseriti nei campi AcroForm di ABNAHME_HYDRO.pdf.',
  },
  serialLabel:   { hu: 'Gyártási szám:', de: 'Fabrikations-Nr.:', en: 'Serial number:', fr: 'N° de fabrication:', it: 'N° di fabbricazione:' },
  generating:    { hu: 'Generálás...',   de: 'Wird generiert...', en: 'Generating...', fr: 'Génération...', it: 'Generazione...' },
  downloadPdf:   { hu: 'HYDRO PDF letöltése', de: 'HYDRO PDF herunterladen', en: 'Download HYDRO PDF', fr: 'Télécharger le PDF HYDRO', it: 'Scarica il PDF HYDRO' },
  furtherProto:  { hu: 'További protokollok', de: 'Weitere Protokolle', en: 'Further protocols', fr: 'Autres protocoles', it: 'Ulteriori protocolli' },
  groundingTitle:{ hu: 'Grounding Protokoll', de: 'Erdungskontrolle', en: 'Grounding Protocol', fr: 'Protocole de mise à la terre', it: 'Protocollo di messa a terra' },
  groundingDesc: {
    hu: 'Földelés ellenőrzési mérési lap + PDF',
    de: 'Erdungsmessprotokoll + PDF',
    en: 'Grounding Measurement Sheet + PDF',
    fr: 'Feuille de mesure de mise à la terre + PDF',
    it: 'Foglio di misura di messa a terra + PDF',
  },
  openGrounding: { hu: 'Grounding megnyitása', de: 'Erdungskontrolle öffnen', en: 'Open Grounding', fr: 'Ouvrir le contrôle', it: 'Apri controllo' },
  nivTitle:      { hu: 'NIV Protokoll', de: 'NIV Protokoll', en: 'NIV Protocol', fr: 'Protocole NIV', it: 'Protocollo NIV' },
  nivDesc:       {
    hu: 'Niedervolt mérési táblázat + PDF',
    de: 'Niedervolt Messtabelle + PDF',
    en: 'Low Voltage Measurement Table + PDF',
    fr: 'Tableau de mesure basse tension + PDF',
    it: 'Tabella di misura bassa tensione + PDF',
  },
  openNiv:       { hu: 'NIV megnyitása', de: 'NIV öffnen', en: 'Open NIV', fr: 'Ouvrir NIV', it: 'Apri NIV' },
} as const satisfies Record<string, Record<Lang, string>>;

function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang];
}

// ============================================================
// FEJEZET ADATOK
// ============================================================

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
    paths: ['2.1.1','2.1.2','2.1.3','2.1.4','2.1.5','2.1.6','2.1.7',
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
    paths: ['6.1','6.2','6.3','6.4.1','6.4.2','6.4.3','6.4.4','6.4.5','6.4.6','6.5.1',
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
             '8.4.1','8.4.1.1','8.4.2.1','8.4.2.2','8.4.3.1',
             '8.5.1','8.5.2','8.5.3','8.6.1','8.6.2','8.6.3','8.7.1'],
  },
  { id: 9,  title: 'B9 – Elektrische Anlage',      paths: ['9.1.1.1','9.1.1.2','9.2.1','9.2.1_a','9.2.2','9.2.3'] },
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
  { id: 12, title: 'B12 – Unterlagen',             paths: ['16.2','16.3'], options: ['Ja','Nein','U'] },
  { id: 13, title: 'B13 – Konformitätserklärung',  paths: ['13.1','13.2','13.3','13.4'] },
  { id: 14, title: 'B14 – Nachkontrolle',          paths: ['14.1.1','14.1.2','14.2.1','14.2.2'] },
];

const DEFAULT_OPTIONS: QuestionOption[] = ['Ja', 'Nein', 'nz', 'U'];

// Option → pill colors
const PILL_ACTIVE: Record<string, string> = {
  Ja:    'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg scale-105',
  Nein:  'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-500 shadow-lg scale-105',
  nz:    'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-500 shadow-lg scale-105',
  U:     'bg-gradient-to-r from-blue-500 to-sky-500 text-white border-blue-500 shadow-lg scale-105',
  Siehe: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-500 shadow-lg scale-105',
  keine: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg scale-105',
};
const PILL_HOVER: Record<string, string> = {
  Ja:    'hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/30',
  Nein:  'hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30',
  nz:    'hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-700/30',
  U:     'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30',
  Siehe: 'hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/30',
  keine: 'hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30',
};
const ROW_BG: Record<string, string> = {
  Ja:    'bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 border-l-4 border-l-green-500',
  Nein:  'bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20 border-l-4 border-l-red-500',
  nz:    'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/40 border-l-4 border-l-gray-400',
  U:     'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 border-l-4 border-l-blue-400',
  Siehe: 'bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/20 border-l-4 border-l-purple-400',
  keine: 'bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20 border-l-4 border-l-orange-400',
};

// ============================================================
// ÁLLAPOT TÍPUSOK
// ============================================================

interface HydroHeader {
  installationType: 'Neuanlage' | 'Umbau';
  certType: 'Baumusterprüfung' | 'Entwurfsprüfung';
  machineRoomless: boolean;
  fabrikationsNr: string; aufzugstyp: string; standortadresse: string; adresse: string;
}
interface HydroB1Data  { hubhoehe: string; stockwerke: string; zugaenge: string; nennlast: string; personen: string; anforderungen: string; }
interface HydroB7Comp  { fang: boolean; ausgleich: boolean; begrenzer: boolean; rohrbruch: boolean; drossel: boolean; }
interface HydroB8Data  { hersteller: string; aggregatTyp: string; motortyp: string; aggregatNr: string; nennstrom: string; motorleistung: string; nennlast: string; leerlast: string; nennlastAuf: string; leerlastAb: string; druckbegrenzung: string; }
interface HydroB9Data  { sollAuf: string; sollAb: string; istLeerAuf: string; istNennlastAb: string; stromLeer: string; stromNennlast: string; netzspannung: string; steuerspannung: string; }
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
  const { toast }    = useToast();
  const { theme }    = useTheme();
  const { language } = useLanguageContext();
  const lang         = toLang(language);

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPdfGenerating, setIsPdfGenerating]     = useState(false);
  const [saveStatus, setSaveStatus]               = useState<'idle' | 'saving' | 'saved'>('idle');

  // Question text maps loaded from public JSON (per language)
  const [questionMap, setQuestionMap]       = useState<Record<string, string>>({});
  const [groupTitleMap, setGroupTitleMap]   = useState<Record<string, string>>({});  // path → section title

  useEffect(() => {
    fetch(`/questions_hydro_${lang}.json`)
      .then(r => r.json())
      .then((data: { groups: { id: string; title: string; questions: { id: string; text: string }[] }[] }) => {
        const qMap: Record<string, string>  = {};
        const gMap: Record<string, string>  = {};
        data.groups.forEach(group => {
          group.questions.forEach(q => {
            // Strip leading "H_" prefix, also handle H_9.2.1a → 9.2.1_a variant
            const raw = q.id.replace(/^H_/, '');
            qMap[raw] = q.text;
            // Alternative: trailing lowercase letter without underscore → with underscore
            const altKey = raw.replace(/([0-9])([a-z])$/, '$1_$2');
            if (altKey !== raw) qMap[altKey] = q.text;
            gMap[raw] = group.title;
            if (altKey !== raw) gMap[altKey] = group.title;
          });
        });
        setQuestionMap(qMap);
        setGroupTitleMap(gMap);
      })
      .catch(() => { /* fallback: show path numbers only */ });
  }, [lang]);

  const saved = loadState();
  const [header, setHeader] = useState<HydroHeader>(saved?.header ?? {
    installationType: 'Neuanlage', certType: 'Baumusterprüfung', machineRoomless: false,
    fabrikationsNr: '', aufzugstyp: '', standortadresse: '', adresse: '',
  });
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [umbau,   setUmbau]   = useState<Record<string, boolean>>(saved?.umbau ?? {});
  const [b1, setB1] = useState<HydroB1Data>(saved?.b1 ?? { hubhoehe:'', stockwerke:'', zugaenge:'', nennlast:'', personen:'', anforderungen:'' });
  const [b7, setB7] = useState<HydroB7Comp>(saved?.b7 ?? { fang:false, ausgleich:false, begrenzer:false, rohrbruch:false, drossel:false });
  const [b8, setB8] = useState<HydroB8Data>(saved?.b8 ?? { hersteller:'', aggregatTyp:'', motortyp:'', aggregatNr:'', nennstrom:'', motorleistung:'', nennlast:'', leerlast:'', nennlastAuf:'', leerlastAb:'', druckbegrenzung:'' });
  const [b9, setB9] = useState<HydroB9Data>(saved?.b9 ?? { sollAuf:'', sollAb:'', istLeerAuf:'', istNennlastAb:'', stromLeer:'', stromNennlast:'', netzspannung:'', steuerspannung:'' });
  const [b13, setB13] = useState<HydroB13Data>(saved?.b13 ?? { firma:'', nameAbnahme:'', datum: new Date().toISOString().split('T')[0], bauseitigePendenzen:'', aufzugsseitigePendenzen:'' });

  useEffect(() => { saveState({ header, answers, umbau, b1, b7, b8, b9, b13 }); }, [header, answers, umbau, b1, b7, b8, b9, b13]);

  const setAnswer = useCallback((path: string, value: string) => {
    setAnswers(prev => ({ ...prev, [path]: value }));
  }, []);

  const toggleUmbau = useCallback((path: string) => {
    setUmbau(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  // Progress
  const totalQuestions    = CHAPTERS.reduce((s, ch) => s + ch.paths.length, 0);
  const answeredQuestions = Object.values(answers).filter(Boolean).length;
  const progressPercent   = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const totalChapters = CHAPTERS.length;
  const isLast        = currentChapterIdx === totalChapters + 1;
  const currentChapter = (currentChapterIdx > 0 && currentChapterIdx <= totalChapters)
    ? CHAPTERS[currentChapterIdx - 1] : null;

  const chapterAnswered = currentChapter ? currentChapter.paths.filter(p => answers[p]).length : 0;
  const chapterTotal    = currentChapter ? currentChapter.paths.length : 0;
  const chapterPercent  = chapterTotal > 0 ? Math.round((chapterAnswered / chapterTotal) * 100) : 0;

  const chapterTitle = currentChapterIdx === 0
    ? t('b0CardTitle', lang)
    : currentChapter ? currentChapter.title
    : 'PDF';

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
        let msg = 'HYDRO PDF hiba';
        try { const j = await response.json(); msg = j?.message || msg; } catch { /**/ }
        throw new Error(msg);
      }
      const blob    = await response.blob();
      const fabNr   = header.fabrikationsNr ? String(header.fabrikationsNr).replace(/[^a-zA-Z0-9]/g, '_') : 'HYDRO';
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
      toast({ title: `✅ ${filename}` });
    } catch (error) {
      toast({ title: 'Hiba', description: (error as Error).message, variant: 'destructive' });
    } finally { setIsPdfGenerating(false); }
  }, [header, answers, b1, b7, b8, b9, b13, toast]);

  // ─── Shared CSS helpers ───────────────────────────────────
  const modern = theme === 'modern';

  return (
    <div className="min-h-screen">
      <PageHeader title={`HYDRO – ${chapterTitle}`} onHome={onHome} progressPercent={progressPercent} showProgress />

      {/* ── Chapter tabs ── */}
      <div className={`border-b overflow-x-auto ${modern ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-blue-900' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex min-w-max px-3 py-2 gap-1">
          <TabBtn label="B0" active={currentChapterIdx === 0} color="blue" modern={modern} onClick={() => setCurrentChapterIdx(0)} />
          {CHAPTERS.map((ch, idx) => (
            <TabBtn key={ch.id} label={`B${ch.id}`} active={currentChapterIdx === idx + 1} color="blue" modern={modern} onClick={() => setCurrentChapterIdx(idx + 1)} />
          ))}
          <TabBtn label="📄 PDF" active={isLast} color="green" modern={modern} onClick={() => setCurrentChapterIdx(totalChapters + 1)} />
        </div>
      </div>

      {/* ── Animated bg wrapper ── */}
      <div className={`min-h-screen relative ${modern ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>
        {modern && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
          </>
        )}

        <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-x-hidden">

          {/* ── Progress header ── */}
          {modern ? (
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-px shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse pointer-events-none" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                      {chapterTitle}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-cyan-500" />
                      {t('hydroSubtitle', lang)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {currentChapter ? (
                      <>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {chapterAnswered} / {chapterTotal} {t('completed', lang)}
                        </div>
                        <div className="text-xs text-gray-500">{chapterPercent}% {t('done', lang)}</div>
                      </>
                    ) : (
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {answeredQuestions} / {totalQuestions} {t('total', lang)}
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{chapterTitle}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentChapter
                    ? `${chapterAnswered} / ${chapterTotal} ${t('completed', lang)}`
                    : `${answeredQuestions} / ${totalQuestions} ${t('total', lang)}`}
                </div>
              </div>
              <Progress value={currentChapter ? chapterPercent : progressPercent} className="h-2" />
            </div>
          )}

          {/* ── Content ── */}
          {currentChapterIdx === 0 && (
            <B0Section header={header} setHeader={setHeader} theme={theme} lang={lang} />
          )}
          {currentChapterIdx === totalChapters + 1 && (
            <PdfSection
              onGenerate={handleGeneratePdf} isGenerating={isPdfGenerating}
              fabrikationsNr={header.fabrikationsNr} onNavigate={onNavigate}
              theme={theme} lang={lang}
            />
          )}
          {currentChapter && (
            <ChapterSection
              chapter={currentChapter} answers={answers} setAnswer={setAnswer}
              umbau={umbau} toggleUmbau={toggleUmbau}
              theme={theme} lang={lang}
              questionMap={questionMap} groupTitleMap={groupTitleMap}
              b7={currentChapter.id === 7 ? b7 : undefined}       setB7={currentChapter.id === 7 ? setB7 : undefined}
              b8Data={currentChapter.id === 8 ? b8 : undefined}   setB8={currentChapter.id === 8 ? setB8 : undefined}
              b9Data={currentChapter.id === 9 ? b9 : undefined}   setB9={currentChapter.id === 9 ? setB9 : undefined}
              b1Data={currentChapter.id === 1 ? b1 : undefined}   setB1={currentChapter.id === 1 ? setB1 : undefined}
              b13Data={currentChapter.id === 13 ? b13 : undefined} setB13={currentChapter.id === 13 ? setB13 : undefined}
            />
          )}

          {/* ── Navigation ── */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 pt-6 border-t-2 border-blue-100 dark:border-blue-900">
            {/* Back */}
            {modern ? (
              <button
                onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
                disabled={currentChapterIdx === 0}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{t('prev', lang)}</span>
                </div>
              </button>
            ) : (
              <Button variant="outline" disabled={currentChapterIdx === 0}
                onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                <ArrowLeft className="h-4 w-4" />{t('prev', lang)}
              </Button>
            )}

            <div className="flex gap-3">
              {/* Save */}
              {modern ? (
                <button
                  onClick={handleManualSave} disabled={saveStatus === 'saving'}
                  className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    saveStatus === 'saved'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{t('saving', lang)}</span></>
                      : saveStatus === 'saved' ? <><CheckCircle2 className="h-5 w-5" /><span>{t('saved', lang)}</span></>
                      : <><Save className="h-5 w-5" /><span>{t('save', lang)}</span></>}
                  </div>
                </button>
              ) : (
                <Button variant="outline" onClick={handleManualSave} disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{saveStatus === 'saving' ? t('saving', lang) : saveStatus === 'saved' ? t('saved', lang) : t('save', lang)}</span>
                </Button>
              )}

              {/* Next / PDF */}
              {currentChapterIdx < totalChapters + 1 ? (
                modern ? (
                  <button
                    onClick={() => setCurrentChapterIdx(Math.min(totalChapters + 1, currentChapterIdx + 1))}
                    className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-2 text-white">
                      <span>{t('next', lang)}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ) : (
                  <Button onClick={() => setCurrentChapterIdx(Math.min(totalChapters + 1, currentChapterIdx + 1))}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    {t('next', lang)}<ArrowRight className="h-4 w-4" />
                  </Button>
                )
              ) : (
                modern ? (
                  <button onClick={handleGeneratePdf} disabled={isPdfGenerating}
                    className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400" />
                    <div className="relative z-10 flex items-center gap-2 text-white">
                      {isPdfGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      <span>{isPdfGenerating ? t('generating', lang) : 'HYDRO PDF'}</span>
                    </div>
                  </button>
                ) : (
                  <Button onClick={handleGeneratePdf} disabled={isPdfGenerating}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                    {isPdfGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {isPdfGenerating ? t('generating', lang) : 'HYDRO PDF'}
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
// TAB GOMB
// ============================================================

function TabBtn({ label, active, color, modern, onClick }: {
  label: string; active: boolean; color: 'blue' | 'green'; modern: boolean; onClick: () => void;
}) {
  const activeGrad = color === 'green'
    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
    : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md';
  const inactiveCls = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${active ? (modern ? activeGrad : (color === 'green' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')) : inactiveCls}`}
    >{label}</button>
  );
}

// ============================================================
// B0 FEJLÉC SZEKCIÓ
// ============================================================

function B0Section({ header, setHeader, theme, lang }: {
  header: HydroHeader; setHeader: React.Dispatch<React.SetStateAction<HydroHeader>>;
  theme: 'modern' | 'classic'; lang: Lang;
}) {
  const upd = (key: keyof HydroHeader, value: string | boolean) =>
    setHeader(prev => ({ ...prev, [key]: value }));
  const modern   = theme === 'modern';
  const cardCls  = modern ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300' : 'shadow-lg overflow-hidden';
  const hdrCls   = modern ? 'relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';

  // Field labels — these are official protocol field names, kept in German for all languages
  const fields: [keyof HydroHeader, string][] = [
    ['fabrikationsNr', 'Fabrikations-Nr.'],
    ['aufzugstyp',     'Aufzugstyp'],
    ['standortadresse','Standortadresse'],
    ['adresse',        'Montagebetrieb / Adresse'],
  ];

  return (
    <Card className={cardCls}>
      <CardHeader className={hdrCls}>
        {modern && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse pointer-events-none" />}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shadow-lg">B0</div>
          <CardTitle className="text-xl font-bold">{t('b0CardTitle', lang)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Installation type */}
        <div>
          <Label className="font-semibold mb-3 block text-gray-700 dark:text-gray-300">{t('anlageTyp', lang)}</Label>
          <div className="flex gap-3 flex-wrap">
            {(['Neuanlage', 'Umbau'] as const).map(opt => (
              <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm ${header.installationType === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300'}`}>
                <input type="radio" name="installationType" value={opt} checked={header.installationType === opt} onChange={() => upd('installationType', opt)} className="accent-blue-600" />{opt}
              </label>
            ))}
          </div>
        </div>
        {/* Cert type */}
        <div>
          <Label className="font-semibold mb-3 block text-gray-700 dark:text-gray-300">{t('pruefungsart', lang)}</Label>
          <div className="flex gap-3 flex-wrap">
            {(['Baumusterprüfung', 'Entwurfsprüfung'] as const).map(opt => (
              <label key={opt} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm ${header.certType === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300'}`}>
                <input type="radio" name="certType" value={opt} checked={header.certType === opt} onChange={() => upd('certType', opt)} className="accent-blue-600" />{opt}
              </label>
            ))}
          </div>
        </div>
        {/* MRL checkbox */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${header.machineRoomless ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-600'}`}>
          <Checkbox id="mrl" checked={header.machineRoomless} onCheckedChange={v => upd('machineRoomless', !!v)} />
          <Label htmlFor="mrl" className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">{t('mrl', lang)}</Label>
        </div>
        {/* Text fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([key, label]) => (
            <div key={key}>
              <Label className="text-sm mb-1.5 block font-medium text-gray-600 dark:text-gray-400">{label}</Label>
              <Input value={header[key] as string} onChange={e => upd(key, e.target.value)} placeholder={label}
                className="border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-500" />
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
  chapter, answers, setAnswer, umbau, toggleUmbau, theme, lang,
  questionMap, groupTitleMap,
  b1Data, setB1, b7, setB7, b8Data, setB8, b9Data, setB9, b13Data, setB13,
}: {
  chapter: Chapter; answers: Record<string, string>; setAnswer: (path: string, value: string) => void;
  umbau: Record<string, boolean>; toggleUmbau: (path: string) => void;
  theme: 'modern' | 'classic'; lang: Lang;
  questionMap: Record<string, string>; groupTitleMap: Record<string, string>;
  b1Data?: HydroB1Data;  setB1?:  React.Dispatch<React.SetStateAction<HydroB1Data>>;
  b7?:    HydroB7Comp;   setB7?:  React.Dispatch<React.SetStateAction<HydroB7Comp>>;
  b8Data?: HydroB8Data;  setB8?:  React.Dispatch<React.SetStateAction<HydroB8Data>>;
  b9Data?: HydroB9Data;  setB9?:  React.Dispatch<React.SetStateAction<HydroB9Data>>;
  b13Data?: HydroB13Data; setB13?: React.Dispatch<React.SetStateAction<HydroB13Data>>;
}) {
  const options = chapter.options ?? DEFAULT_OPTIONS;
  const modern  = theme === 'modern';

  // Reusable card header classes
  const gradHdr = (gradient: string) =>
    modern
      ? `relative overflow-hidden ${gradient} text-white p-6`
      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4';
  const cardCls = modern
    ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300'
    : 'shadow-lg overflow-hidden';
  const pulseCls = (g: string) => modern ? <div className={`absolute inset-0 ${g} opacity-30 animate-pulse pointer-events-none`} /> : null;

  // B1 measurement fields (German labels — official protocol field names)
  const b1Fields: [keyof HydroB1Data, string][] = [
    ['hubhoehe','Hubhöhe (m)'],['stockwerke','Stockwerke'],['zugaenge','Zugänge'],
    ['nennlast','Nennlast (kg)'],['personen','Personen'],['anforderungen','Anforderungen'],
  ];
  const b8Fields: [keyof HydroB8Data, string][] = [
    ['hersteller','Aggregat Hersteller'],['aggregatTyp','Aggregat Typ'],['motortyp','Motor Typ'],
    ['aggregatNr','Aggregat Nr.'],['nennstrom','Nennstrom (A)'],['motorleistung','Motorleistung (kW)'],
    ['nennlast','Druck Nennlast (bar)'],['leerlast','Druck Leerlast (bar)'],
    ['nennlastAuf','Nennlast Auf (bar)'],['leerlastAb','Leerlast Ab (bar)'],['druckbegrenzung','Druckbegrenzung (bar)'],
  ];
  const b9Fields: [keyof HydroB9Data, string][] = [
    ['sollAuf','Soll-Geschw. aufwärts (m/s)'],['sollAb','Soll-Geschw. abwärts (m/s)'],
    ['istLeerAuf','IST Leer aufwärts (m/s)'],['istNennlastAb','IST Nennlast abwärts (m/s)'],
    ['stromLeer','Strom Leer (A)'],['stromNennlast','Strom Nennlast (A)'],
    ['netzspannung','Netzspannung (V)'],['steuerspannung','Steuerspannung (V)'],
  ];
  const b13Fields: [keyof HydroB13Data, string][] = [
    ['firma','Firma'],['nameAbnahme','Name Abnahmetechniker'],['datum','Datum'],
    ['bauseitigePendenzen','Bauseitige Pendenzen'],['aufzugsseitigePendenzen','Aufzugsseitige Pendenzen'],
  ];
  const b7Components: [keyof HydroB7Comp, string][] = [
    ['fang','Fangvorrichtung'],['ausgleich','Ausgleichsgewicht'],['begrenzer','Geschw.-begrenzer'],
    ['rohrbruch','Rohrbruchventil'],['drossel','Drosselventil'],
  ];

  return (
    <div className="space-y-6">
      {/* ── B1 measurements ── */}
      {chapter.id === 1 && b1Data && setB1 && (
        <Card className={cardCls}>
          <CardHeader className={gradHdr('bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400')}>
            {pulseCls('bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500')}
            <CardTitle className="relative text-lg font-bold">{t('b1CardTitle', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {b1Fields.map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-blue-700 dark:text-blue-300">{label}</Label>
                  <Input value={b1Data[key]} onChange={e => setB1(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B7 hydraulic checkboxes ── */}
      {chapter.id === 7 && b7 && setB7 && (
        <Card className={modern ? 'shadow-xl border-2 border-orange-100 dark:border-orange-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
          <CardHeader className={gradHdr('bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400')}>
            {pulseCls('bg-gradient-to-r from-amber-400 to-orange-500')}
            <CardTitle className="relative text-lg font-bold">{t('b7CardTitle', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              {b7Components.map(([key, label]) => (
                <label key={key} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${b7[key] ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-orange-300'}`}>
                  <Checkbox checked={b7[key]} onCheckedChange={v => setB7(p => ({ ...p, [key]: !!v }))} />{label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B8 measurements ── */}
      {chapter.id === 8 && b8Data && setB8 && (
        <Card className={modern ? 'shadow-xl border-2 border-purple-100 dark:border-purple-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
          <CardHeader className={gradHdr('bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400')}>
            {pulseCls('bg-gradient-to-r from-violet-400 to-purple-500')}
            <CardTitle className="relative text-lg font-bold">{t('b8CardTitle', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {b8Fields.map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-purple-700 dark:text-purple-300">{label}</Label>
                  <Input value={b8Data[key]} onChange={e => setB8(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B9 measurements ── */}
      {chapter.id === 9 && b9Data && setB9 && (
        <Card className={modern ? 'shadow-xl border-2 border-cyan-100 dark:border-cyan-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
          <CardHeader className={gradHdr('bg-gradient-to-r from-cyan-600 via-sky-500 to-teal-400')}>
            {pulseCls('bg-gradient-to-r from-sky-400 to-cyan-500')}
            <CardTitle className="relative text-lg font-bold">{t('b9CardTitle', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {b9Fields.map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-cyan-700 dark:text-cyan-300">{label}</Label>
                  <Input value={b9Data[key]} onChange={e => setB9(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-cyan-200 dark:border-cyan-800 focus:ring-2 focus:ring-cyan-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B13 fields ── */}
      {chapter.id === 13 && b13Data && setB13 && (
        <Card className={modern ? 'shadow-xl border-2 border-green-100 dark:border-green-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
          <CardHeader className={gradHdr('bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400')}>
            {pulseCls('bg-gradient-to-r from-emerald-400 to-green-500')}
            <CardTitle className="relative text-lg font-bold">{t('b13CardTitle', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {b13Fields.map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs mb-1.5 block font-medium text-green-700 dark:text-green-300">{label}</Label>
                  <Input type={key === 'datum' ? 'date' : 'text'} value={b13Data[key]}
                    onChange={e => setB13(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-green-200 dark:border-green-800 focus:ring-2 focus:ring-green-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Questions card ── */}
      <Card className={modern ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300' : 'shadow-lg overflow-hidden'}>
        <CardHeader className={gradHdr('bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400')}>
          {pulseCls('bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500')}
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shadow-lg">
              B{chapter.id}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{chapter.title}</CardTitle>
              <p className="text-white/80 text-sm mt-0.5">
                {chapter.paths.filter(p => answers[p]).length} / {chapter.paths.length} {t('completed', lang)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {chapter.paths.map((path, idx) => {
            const rowOptions  = chapter.specialOptions?.[path] ?? options;
            const current     = answers[path] ?? '';
            const rowBg       = current ? ROW_BG[current] : '';
            const questionText = questionMap[path] ?? '';
            const groupTitle   = groupTitleMap[path] ?? '';

            // Show a thin group-title divider whenever the section changes
            const prevPath      = chapter.paths[idx - 1];
            const prevGroupTitle = prevPath ? (groupTitleMap[prevPath] ?? '') : '';
            const showDivider   = idx > 0 && groupTitle && groupTitle !== prevGroupTitle;

            return (
              <Fragment key={path}>
                {showDivider && (
                  <div className="px-4 pt-3 pb-1.5 bg-gray-50 dark:bg-gray-800/60 border-b border-t border-blue-100 dark:border-blue-900/50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {groupTitle}
                    </span>
                  </div>
                )}
                <div
                  className={`relative border-b dark:border-gray-700 last:border-b-0 transition-all duration-300 ${
                    rowBg || (modern
                      ? 'bg-white dark:bg-gray-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4">
                    {/* Path number badge */}
                    <span className="font-mono text-xs text-blue-500 dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 self-start mt-0.5">
                      {path}
                    </span>
                    {/* Question text */}
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-snug min-w-0">
                      {questionText || path}
                    </span>
                    {/* Option pills */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Main exclusive options — U kizárva */}
                      {rowOptions.filter(o => o !== 'U').map(opt => {
                        const isSelected = current === opt;
                        return (
                          <button key={opt} type="button" onClick={() => setAnswer(path, opt)}
                            className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap ${
                              isSelected ? PILL_ACTIVE[opt] : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 ${PILL_HOVER[opt]}`
                            }`}
                          >{opt}</button>
                        );
                      })}
                      {/* U (Umbau) — független toggle, elválasztóval */}
                      {rowOptions.includes('U') && (
                        <>
                          <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center" />
                          <button type="button" onClick={() => toggleUmbau(path)}
                            className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap ${
                              umbau[path]
                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200 dark:shadow-blue-900'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600'
                            }`}
                            title="Umbau – átépítés során érintett"
                          >U</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PDF SZEKCIÓ
// ============================================================

function PdfSection({ onGenerate, isGenerating, fabrikationsNr, onNavigate, theme, lang }: {
  onGenerate: () => void; isGenerating: boolean; fabrikationsNr: string;
  onNavigate?: (screen: string) => void; theme: 'modern' | 'classic'; lang: Lang;
}) {
  const modern = theme === 'modern';

  function GradCard({ gradient, borderColor, children }: {
    gradient: string; borderColor: string; children: React.ReactNode;
  }) {
    return (
      <Card className={modern
        ? `shadow-xl border-2 ${borderColor} overflow-hidden hover:shadow-2xl transition-shadow duration-300`
        : 'shadow-lg overflow-hidden'
      }>{children}</Card>
    );
  }

  function GradHeader({ gradient, pulse, children }: {
    gradient: string; pulse: string; children: React.ReactNode;
  }) {
    return (
      <CardHeader className={modern
        ? `relative overflow-hidden ${gradient} text-white p-6`
        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5'
      }>
        {modern && <div className={`absolute inset-0 ${pulse} opacity-30 animate-pulse pointer-events-none`} />}
        <div className="relative">{children}</div>
      </CardHeader>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      {/* ── HYDRO PDF ── */}
      <GradCard gradient="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" borderColor="border-blue-200 dark:border-blue-800">
        <GradHeader gradient="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" pulse="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t('hydroTitle', lang)}</CardTitle>
              <p className="text-white/80 text-sm mt-1">
                {fabrikationsNr
                  ? <>{t('serialLabel', lang)} <span className="font-mono font-semibold">{fabrikationsNr}</span></>
                  : t('hydroDesc', lang)}
              </p>
            </div>
          </div>
        </GradHeader>
        <CardContent className="p-6">
          {modern ? (
            <button onClick={onGenerate} disabled={isGenerating}
              className="group relative overflow-hidden w-full px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-center gap-3 text-white text-lg">
                {isGenerating ? <><Loader2 className="h-6 w-6 animate-spin" />{t('generating', lang)}</> : <><Download className="h-6 w-6" />{t('downloadPdf', lang)}</>}
              </div>
            </button>
          ) : (
            <Button onClick={onGenerate} disabled={isGenerating} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {isGenerating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t('generating', lang)}</> : <><Download className="h-5 w-5 mr-2" />{t('downloadPdf', lang)}</>}
            </Button>
          )}
        </CardContent>
      </GradCard>

      {/* ── Separator ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{t('furtherProto', lang)}</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* ── Grounding ── */}
      <GradCard gradient="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400" borderColor="border-green-200 dark:border-green-800">
        <GradHeader gradient="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400" pulse="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-3xl shrink-0">⚡</div>
            <div>
              <CardTitle className="text-xl font-bold">{t('groundingTitle', lang)}</CardTitle>
              <p className="text-white/80 text-sm mt-1">{t('groundingDesc', lang)}</p>
            </div>
          </div>
        </GradHeader>
        <CardContent className="p-6">
          {modern ? (
            <button onClick={() => onNavigate?.('erdungskontrolle')}
              className="group w-full px-8 py-4 rounded-xl border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 font-semibold transition-all hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center justify-center gap-2">
              {t('openGrounding', lang)}<ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <Button onClick={() => onNavigate?.('erdungskontrolle')} variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
              <ChevronRight className="h-4 w-4 mr-2" />{t('openGrounding', lang)}
            </Button>
          )}
        </CardContent>
      </GradCard>

      {/* ── NIV ── */}
      <GradCard gradient="bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400" borderColor="border-purple-200 dark:border-purple-800">
        <GradHeader gradient="bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400" pulse="bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-400">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg text-3xl shrink-0">📊</div>
            <div>
              <CardTitle className="text-xl font-bold">{t('nivTitle', lang)}</CardTitle>
              <p className="text-white/80 text-sm mt-1">{t('nivDesc', lang)}</p>
            </div>
          </div>
        </GradHeader>
        <CardContent className="p-6">
          {modern ? (
            <button onClick={() => onNavigate?.('niedervolt')}
              className="group w-full px-8 py-4 rounded-xl border-2 border-purple-500 dark:border-purple-600 text-purple-700 dark:text-purple-400 font-semibold transition-all hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center justify-center gap-2">
              {t('openNiv', lang)}<ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <Button onClick={() => onNavigate?.('niedervolt')} variant="outline" className="w-full border-purple-500 text-purple-700 hover:bg-purple-50">
              <ChevronRight className="h-4 w-4 mr-2" />{t('openNiv', lang)}
            </Button>
          )}
        </CardContent>
      </GradCard>
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

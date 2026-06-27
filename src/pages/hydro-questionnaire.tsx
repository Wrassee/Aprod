// src/pages/hydro-questionnaire.tsx
// Önálló HYDRO (MOD_HYD) protokoll kérdőív — Grounding-stílusú UI

import { useState, useCallback, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/queryClient';
import { useTheme } from '@/contexts/theme-context';
import { useLanguageContext } from '@/components/language-context';
import {
  ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2,
  Download, FileText, Sparkles, ChevronRight, Link2, Unlink2,
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
  b0CardTitle:   {
    hu: 'Általános információk',
    de: 'Allgemeine Informationen',
    en: 'General Information',
    fr: 'Informations générales',
    it: 'Informazioni generali',
  },
  headerTab:     { hu: 'Fejléc', de: 'Kopfdaten', en: 'Header', fr: 'En-tête', it: 'Intestazione' },
  blockTab:      { hu: 'Blokk', de: 'Block', en: 'Block', fr: 'Bloc', it: 'Blocco' },
  newProtocol:   { hu: 'Új protokoll', de: 'Neues Protokoll', en: 'New Protocol', fr: 'Nouveau protocole', it: 'Nuovo protocollo' },
  newProtocolConfirm: { hu: 'Biztosan törli az összes adatot és kezd egy új protokollt?', de: 'Alle Daten löschen und neues Protokoll starten?', en: 'Delete all data and start a new protocol?', fr: 'Supprimer toutes les données et démarrer un nouveau protocole?', it: 'Eliminare tutti i dati e avviare un nuovo protocollo?' },
  anlageTyp:     { hu: 'Berendezés típusa',   de: 'Anlage Typ',       en: 'Installation Type',    fr: "Type d'installation",   it: 'Tipo di installazione' },
  pruefungsart:  { hu: 'Vizsgálat típusa',     de: 'Prüfungsart',      en: 'Inspection Type',      fr: "Type d'inspection",     it: 'Tipo di ispezione'     },
  b1CardTitle:   { hu: 'Berendezési adatok',   de: 'Anlagedaten',      en: 'Installation Data',    fr: "Données d'installation",it: 'Dati di installazione' },
  b1ZusatzLabel: { hu: 'További követelmények',de: 'Zusätzliche Anforderungen', en: 'Additional Requirements', fr: 'Exigences supplémentaires', it: 'Requisiti aggiuntivi' },
  b7CardTitle:   { hu: 'Hidraulikus és fék komponensek', de: 'Hydraulische und Brems- Komponenten', en: 'Hydraulic and Brake Components', fr: 'Composants hydrauliques et de frein', it: 'Componenti idraulici e freno' },
  b8CardTitle:   { hu: 'Hidraulikus aggregát', de: 'Hydraulikaggregat', en: 'Hydraulic Unit',       fr: 'Groupe hydraulique',    it: 'Unità idraulica'        },
  b9SpeedTitle:  { hu: 'Sebességmérési adatok', de: 'Geschwindigkeiten', en: 'Speed Data',          fr: 'Données de vitesse',    it: 'Dati di velocità'       },
  b9ElecTitle:   { hu: 'Elektromos mérési adatok', de: 'Elektrische Messdaten', en: 'Electrical Data', fr: 'Données électriques', it: 'Dati elettrici'        },
  b13CardTitle:  {
    hu: 'B13 – Megfelelőségi nyilatkozat',
    de: 'Konformitätserklärung B13',
    en: 'Declaration of Conformity B13',
    fr: 'Déclaration de conformité B13',
    it: 'Dichiarazione di conformità B13',
  },
  b6SeilTitle:   { hu: 'Sodrony (Drahtseil)',  de: 'Tragmittel (Drahtseil)', en: 'Rope (Wire)',    fr: 'Câble porteur',         it: 'Fune portante'          },
  b6KetteTitle:  { hu: 'Lánc (Kette)',         de: 'Tragmittel (Kette)',     en: 'Chain',          fr: 'Chaîne porteuse',       it: 'Catena portante'        },
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
  openNiv: { hu: 'NIV megnyitása', de: 'NIV öffnen', en: 'Open NIV', fr: 'Ouvrir NIV', it: 'Apri NIV' },
} as const satisfies Record<string, Record<Lang, string>>;

function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang];
}

// ============================================================
// SPECIÁLIS MEZŐ DEFINÍCIÓK
// ============================================================

// Paths that render as text inputs (stored in `answers`)
const TEXT_INPUT_PATHS = new Set([
  // B2
  '2.1.1', 'B2_Einsatzbereich', 'B2_Anlagenennstrom',
  // B3 – text fields
  'B3_Notendschalter',
  'B3_installierte_Puffer', 'B3_Fabrikationstyp', 'B3_Anzahl_Puffer2', 'B3_Fabrikationstyp_2',
  'B3_Fuhrung_Kabine', 'B3_Fuhrung_Ausgleich', 'B3_Fuhrung_Hilfs', 'B3_Fuhrung_Heber',
  // B4 – text fields
  'B4_Feuerwiderstandsklasse', 'B4_Fabrikationstyp', 'B4_Fabrikationstyp_1',
  // B6 – text fields (handled in special B6 card, not in paths)
  'B6_Seil_Anzahl', 'B6_Seil_Nenn', 'B6_Kette_Anzahl', 'B6_Kette_Dim',
  'B6_Fabrikationstyp', 'B6_SerienNr',
  // B7 – text fields between/after questions
  'B7_Typ_Bremsfang', 'B7_SerienNr_1', 'B7_Typ_Sperrfang', 'B7_SerienNr_2', 'B7_Typ_Sperrfang63', 'B7_SerienNr_3',
  'B7_Typ', 'B7_SerienNr', 'B7_Auslosegeschwindigkeit',
  'B7_Nenndurchmesser',
  'B7_Typ_Bremsfang_AG', 'B7_SerienNr_1_AG', 'B7_Typ_Sperrfang_AG', 'B7_SerienNr_2_AG', 'B7_Typ_Sperrfang63_AG', 'B7_SerienNr_3_AG',
  'B7_Typ_Ausgleich', 'B7_SerienNr_Ausgleich', 'B7_Auslosegeschwindigkeit_AG',
  'B7_Nenndurchmesser_1',
  'B7_RohrbruchTyp', 'B7_Drossel_Typ', 'B7_Nenndurchmesser_2',
  // B8 – text fields
  'B8_HeberTyp',
  'B8_Hersteller_1', 'B8_Hersteller_2', 'B8_Hersteller_3',
  'B8_Hersteller_4', 'B8_Hersteller_5', 'B8_Hersteller_6',
  'B8_Hersteller_7', 'B8_Hersteller_8', 'B8_Hersteller_9',
  // B13 – Pendenzenlisten
  'B13_Bauseitige_Pendenzen', 'B13_Aufzugsseitige_Pendenzen', 'B13_Unterschrift',
]);

// Paths that render as textarea
const TEXTAREA_PATHS = new Set([
  'B13_Bauseitige_Pendenzen', 'B13_Aufzugsseitige_Pendenzen',
]);

// Paths WITHOUT n.z. option
const NO_NZ_PATHS = new Set([
  // B1
  '1',
  // B2
  '2.1.2', '2.1.4', '2.1.5',
  '2.2.1', '2.2.4', '2.2.5',
  '2.3.1', '2.3.2',
  '2.4.1',
  // B3
  '3.1.2', '3.1.3', '3.1.4', '3.1.5', '3.1.6', '3.1.7',
  '3.2.2', '3.2.3', '3.2.4',
  '3.3.1.2', '3.3.1.3', '3.3.1.4', '3.3.2.1',
  // B4
  '4.1.3', '4.1.4', '4.1.5',
  // B8
  '8.5.2', '8.5.3',
  // B9
  '9.1.1.1', '9.1.1.2', '9.2.1', '9.2.1_a', '9.2.2', '9.2.3',
  // B12
  '16.2', '16.3',
  // B13
  '13.1', '13.2', '13.3', '13.4',
  // B14
  '14.1.1', '14.1.2', '14.2.1', '14.2.2',
]);

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
  {
    id: 1, title: 'Anlagedaten',
    paths: ['1'],
    options: ['Ja', 'Nein'],
  },
  {
    id: 2, title: 'Aufstellungsort der Maschine und Steuerung sowie Seilrollen',
    paths: [
      '2.1.1',
      '2.1.2', 'B2_Einsatzbereich', 'B2_Anlagenennstrom',
      '2.1.3', '2.1.4', '2.1.5', '2.1.6', '2.1.7',
      '2.2.1', '2.2.2', '2.2.3', '2.2.4', '2.2.5', '2.2.6',
      '2.3.1', '2.3.2', '2.3.3', '2.3.4', '2.3.5', '2.3.6', '2.3.7', '2.3.8',
      '2.4.1', '2.4.2', '2.5.1', '2.6.1', '2.7.1',
    ],
  },
  {
    id: 3, title: 'Schacht',
    paths: [
      '3.1.1', '__KOPF_CARD__',
      '3.1.2', '3.1.3', '3.1.4', '3.1.5', '3.1.6', 'B3_Notendschalter', '3.1.7',
      '3.2.1', '__GRUBE_CARD__',
      '3.2.2', '3.2.3', '3.2.4',
      '3.3.1.1', 'B3_installierte_Puffer', 'B3_Fabrikationstyp', '3.3.1.2', '3.3.1.3', '3.3.1.4',
      '3.3.2.1', 'B3_Anzahl_Puffer2', 'B3_Fabrikationstyp_2',
      '3.4.1', '3.4.2', '3.4.3', '3.4.4', '3.4.5', '3.4.6', '3.4.7', '3.4.8', '3.4.9',
      '3.4.10', '3.4.11', '3.4.12', '3.4.13', '3.4.14', '3.4.15', '3.4.16', '3.4.17', '3.4.18', '3.4.19',
      '3.5.1', '3.5.2', '3.5.3', '3.5.4',
      '3.6.1', 'B3_nz_Fuh_1', 'B3_Fuhrung_Kabine', 'B3_nz_Fuh_2', 'B3_Fuhrung_Ausgleich',
      'B3_nz_Fuh_3', 'B3_Fuhrung_Hilfs', 'B3_Fuhrung_Heber',
      '3.6.2', '3.6.2_A', 'B3_nz_362_1', '3.6.2_B', 'B3_nz_362_2', '3.6.2_C', 'B3_nz_362_3',
      '3.6.3', '3.7.1',
    ],
  },
  {
    id: 4, title: 'Schachttüren',
    paths: [
      '4.1.1', '4.1.2', '4.1.3', 'B4_Feuerwiderstandsklasse', 'B4_Fabrikationstyp',
      '4.1.4', '4.1.5', '4.1.6', '4.1.7', '4.1.8', 'B4_Fabrikationstyp_1',
      '4.1.9', '4.1.10', '4.1.11', '4.1.12', '4.1.13', '4.1.14', '4.1.15', '4.1.16', '4.1.17', '4.1.18', '4.1.19',
      '4.2.1',
    ],
  },
  {
    id: 5, title: 'Kabine',
    paths: [
      '5.1.1', '5.1.2', '5.1.3', '5.1.4', '5.1.5', '5.1.6', '5.1.7', '5.1.8', '5.1.9', '5.1.10',
      '5.2.1', '5.2.2', '5.2.3', '5.2.4', '5.2.5', '5.2.6',
      '5.3.1', '5.3.2', '5.3.3', '5.3.4', '5.3.5', '5.3.6', '5.3.7', '5.3.8', '5.3.9', '5.3.10',
      '5.4.1', '5.4.2', '5.4.3', '5.4.4', '5.4.5', '5.4.6', '5.4.7', '5.4.8', '5.4.9', '5.5.1',
    ],
  },
  {
    id: 6, title: 'Aufhängung',
    paths: [
      // B6 special: A.6.x/B.6.x/C.6.x are conditional (rendered in B6 special card)
      // Here only always-visible questions
      '6.3', '6.4.1', 'B6_Fabrikationstyp', 'B6_SerienNr',
      '6.4.2', '6.4.3', '6.4.4', '6.4.5', '6.4.6', '6.5.1',
    ],
  },
  {
    id: 7, title: 'Fangvorrichtungen und Geschwindigkeitsbegrenzer',
    paths: [
      // Fangvorrichtung (Kabine)
      '7.1.1',
      'B7_Typ_Bremsfang', 'B7_SerienNr_1', 'B7_Typ_Sperrfang', 'B7_SerienNr_2', 'B7_Typ_Sperrfang63', 'B7_SerienNr_3',
      '7.1.2', '7.1.3', '7.1.4', '7.1.5', '7.1.6', '7.1.7', '7.1.8', '7.1.9',
      // Geschwindigkeitsbegrenzer (Kabine)
      '7.2.1',
      'B7_Typ', 'B7_SerienNr', 'B7_Auslosegeschwindigkeit',
      '7.2.2', '7.2.3', '7.2.4', '7.2.5', '7.2.6', '7.2.7',
      'B7_Nenndurchmesser',
      // Fangvorrichtung (Ausgleichsgewicht)
      '7.3.1',
      'B7_Typ_Bremsfang_AG', 'B7_SerienNr_1_AG', 'B7_Typ_Sperrfang_AG', 'B7_SerienNr_2_AG', 'B7_Typ_Sperrfang63_AG', 'B7_SerienNr_3_AG',
      '7.3.2', '7.3.3', '7.3.4', '7.3.5',
      // Geschwindigkeitsbegrenzer (Ausgleichsgewicht)
      '7.4.1',
      'B7_Typ_Ausgleich', 'B7_SerienNr_Ausgleich', 'B7_Auslosegeschwindigkeit_AG',
      '7.4.2', '7.4.3', '7.4.4', '7.4.5', '7.4.6',
      'B7_Nenndurchmesser_1',
      '7.4.7',
      // Rohrbruch
      '7.5.1', 'B7_RohrbruchTyp', '7.5.2', '7.5.3', '7.5.4',
      // Drossel
      '7.6.1', 'B7_Drossel_Typ', '7.6.2', '7.6.3',
      // Sonstiges
      '7.7.1.1', '7.7.1.2', '7.7.2.1', '7.7.2.2', '7.7.2.3', '7.7.2.4', '7.7.2.5',
      'B7_Nenndurchmesser_2',
      '7.7.3.1', '7.7.3.2', '7.7.3.3', '7.7.3.4',
      '7.8.1', '7.8.2', '7.9.1',
    ],
  },
  {
    id: 8, title: 'Hydraulikanlage',
    paths: [
      '8.1.1', '8.1.2', '8.1.3', '8.1.4', '8.1.5', '8.1.6',
      '8.2.1', '8.3.1', 'B8_HeberTyp', '8.3.2',
      '8.4.1', '8.4.1.1', 'B8_Hersteller_1', 'B8_Hersteller_2', 'B8_Hersteller_3',
      '8.4.2.1', 'B8_Hersteller_4', 'B8_Hersteller_5', 'B8_Hersteller_6',
      '8.4.2.2', 'B8_Hersteller_7', 'B8_Hersteller_8', 'B8_Hersteller_9',
      '8.4.3.1',
      '8.5.1', '8.5.2', '8.5.3', '8.6.1', '8.6.2', '8.6.3', '8.7.1',
    ],
  },
  {
    id: 9, title: 'Elektrisches System',
    paths: ['9.1.1.1', '9.1.1.2', '9.2.1', '9.2.1_a', '9.2.2', '9.2.3'],
  },
  {
    id: 10, title: 'Steuerung',
    paths: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7'],
    specialOptions: { '10.1': ['Ja', 'Nein', 'nz', 'U', 'Siehe'] },
  },
  {
    id: 11, title: 'Verhalten von Aufzügen im Brandfall',
    paths: [
      '11.1_Main', '11.1.1', '11.1.2', '11.1.3', '11.1.4', '11.1.5',
      '11.2.1', '11.2.2', '11.2.3', '11.2.4', '11.2.5',
      '11.3.1', '11.3.2', '11.3.3', '11.3.4', '11.3.5', '11.3.6', '11.3.7', '11.3.8', '11.3.9', '11.3.10', '11.3.11',
    ],
  },
  { id: 12, title: 'Unterlagen', paths: ['16.2', '16.3'], options: ['Ja', 'Nein', 'U'] },
  {
    id: 13, title: 'Konformitätserklärung',
    paths: ['13.1', 'B13_Bauseitige_Pendenzen', '13.2', 'B13_Aufzugsseitige_Pendenzen', '13.3', '13.4', 'B13_Unterschrift'],
  },
  { id: 14, title: 'Nachkontrolle', paths: ['14.1.1', '14.1.2', '14.2.1', '14.2.2'] },
];

const DEFAULT_OPTIONS: QuestionOption[] = ['Ja', 'Nein', 'nz', 'U'];

// Paths that are auto-filled by logic (not shown as manual questions)
const AUTO_FILLED_PATHS = new Set(['8.5.1']);

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
  certType: 'Baumusterprüfung' | 'Entwurfsprüfung' | 'MRL';
  fabrikationsNr: string; aufzugstyp: string; standortadresse: string; adresse: string;
}
interface HydroB1Data  { hubhoehe: string; stockwerke: string; zugaenge: string; nennlast: string; personen: string; }
interface HydroB3KopfData {
  nenngeschwindigkeit: string;
  S: string;  // Kabinenschwelle – oberste Schachttürschwelle
  A: string;  // Stehfläche Kabinendach – Schachtkopf
  B: string;  // Höchster Punkt Kabine – tiefster Punkt Schachtkopf
  C: string;  // Kabinenführung – Schachtkopf
  D: string;  // Kabinenführung – Schienenende
  E: string;  // Kolbenende – Schachtkopf
  Z: string;  // Zuschlag (Sprunghöhe)
  U: string;  // Überfahrt
}
interface HydroB3GrubeData {
  S: string;  // Schwellenabstand (Kabine – unterste Schachttür-Schwelle)
  F: string;  // Unterste Punkt Kabine – höchste Punkt Schachtgrube
  G: string;  // Tiefste Punkt Kabine (Schürze) – Grubenboden
  H: string;  // Unterste Punkt Kabine – Grubenboden
  J: string;  // Kabinenführung – Schienenende Kabine
  P: string;  // Pufferhub (Kabine)
  U: string;  // Unterfahrt (bis Kabine Puffer berührt)
}
interface HydroB6Data {
  mode: 'seil' | 'kette' | '';
  seilAnzahl: string; seilNenn: string;
  ketteAnzahl: string; ketteDim: string;
}
interface HydroB7Comp  { fang: boolean; ausgleich: boolean; begrenzer: boolean; rohrbruch: boolean; drossel: boolean; }
interface HydroB8Data  {
  hersteller: string; aggregatTyp: string; motortyp: string; aggregatNr: string;
  nennstrom: string; motorleistung: string; nennlast: string; leerlast: string;
  nennlastAuf: string; leerlastAb: string; druckbegrenzung: string; druckbegrenzungHandpumpe: string;
}
interface HydroB9Data  {
  sollAuf: string; sollAb: string;
  istLeerAuf: string; istNennlastAb: string;
  istLeerAufKorr: string; istNennlastAbKorr: string;
  zurueckAuf: string; zurueckAb: string;
  pufferGeschwindigkeit: string; nenngeschwindigkeit: string;
  stromLeer: string; stromNennlast: string;
  netzspannung: string; steuerspannung: string;
}
interface HydroB13Data { firma: string; nameAbnahme: string; datum: string; }

const STORAGE_KEY = 'hydro-form-data-v4';
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
  const [b3ActiveTab, setB3ActiveTab]             = useState<'kopf' | 'fragen'>('kopf');
  const [isPdfGenerating, setIsPdfGenerating]     = useState(false);
  const [saveStatus, setSaveStatus]               = useState<'idle' | 'saving' | 'saved'>('idle');

  const [questionMap, setQuestionMap]     = useState<Record<string, string>>({});
  const [groupTitleMap, setGroupTitleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/questions_hydro_${lang}.json`)
      .then(r => r.json())
      .then((data: { groups: { id: string; title: string; questions: { id: string; text: string }[] }[] }) => {
        const qMap: Record<string, string>  = {};
        const gMap: Record<string, string>  = {};
        data.groups.forEach(group => {
          group.questions.forEach(q => {
            const raw = q.id.replace(/^H_/, '');
            qMap[raw] = q.text;
            const altKey = raw.replace(/([0-9])([a-z])$/, '$1_$2');
            if (altKey !== raw) qMap[altKey] = q.text;
            gMap[raw] = group.title;
            if (altKey !== raw) gMap[altKey] = group.title;
          });
        });
        setQuestionMap(qMap);
        setGroupTitleMap(gMap);
      })
      .catch(() => {});
  }, [lang]);

  const saved = loadState();
  const [header, setHeader] = useState<HydroHeader>(saved?.header ?? {
    installationType: 'Neuanlage', certType: 'Baumusterprüfung',
    fabrikationsNr: '', aufzugstyp: '', standortadresse: '', adresse: '',
  });
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [umbau,   setUmbau]   = useState<Record<string, boolean>>(saved?.umbau ?? {});
  const [b1, setB1] = useState<HydroB1Data>(saved?.b1 ?? { hubhoehe:'', stockwerke:'', zugaenge:'', nennlast:'', personen:'' });
  const [b3kopf, setB3kopf] = useState<HydroB3KopfData>(saved?.b3kopf ?? {
    nenngeschwindigkeit:'', S:'', A:'', B:'', C:'', D:'', E:'', Z:'', U:'',
  });
  const [b3grube, setB3grube] = useState<HydroB3GrubeData>(saved?.b3grube ?? {
    S:'', F:'', G:'', H:'', J:'', P:'', U:'',
  });
  const [b6, setB6] = useState<HydroB6Data>(saved?.b6 ?? { mode:'', seilAnzahl:'', seilNenn:'', ketteAnzahl:'', ketteDim:'' });
  const [b7, setB7] = useState<HydroB7Comp>(saved?.b7 ?? { fang:false, ausgleich:false, begrenzer:false, rohrbruch:false, drossel:false });
  const [b8, setB8] = useState<HydroB8Data>(saved?.b8 ?? {
    hersteller:'', aggregatTyp:'', motortyp:'', aggregatNr:'', nennstrom:'', motorleistung:'',
    nennlast:'', leerlast:'', nennlastAuf:'', leerlastAb:'', druckbegrenzung:'', druckbegrenzungHandpumpe:'',
  });
  const [b9, setB9] = useState<HydroB9Data>(saved?.b9 ?? {
    sollAuf:'', sollAb:'', istLeerAuf:'', istNennlastAb:'',
    istLeerAufKorr:'', istNennlastAbKorr:'', zurueckAuf:'', zurueckAb:'',
    pufferGeschwindigkeit:'', nenngeschwindigkeit:'',
    stromLeer:'', stromNennlast:'', netzspannung:'', steuerspannung:'',
  });
  const [b13, setB13] = useState<HydroB13Data>(saved?.b13 ?? {
    firma:'', nameAbnahme:'', datum: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    saveState({ header, answers, umbau, b1, b3kopf, b3grube, b6, b7, b8, b9, b13 });
  }, [header, answers, umbau, b1, b3kopf, b3grube, b6, b7, b8, b9, b13]);

  const setAnswer = useCallback((path: string, value: string) => {
    setAnswers(prev => ({ ...prev, [path]: value }));
  }, []);

  const toggleUmbau = useCallback((path: string) => {
    setUmbau(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  // ── 8.5.1 auto-fill: mark as 'U' when B8 pressure fields are both filled ──
  useEffect(() => {
    if (b8.druckbegrenzung.trim() && b8.druckbegrenzungHandpumpe.trim()) {
      setAnswers(prev => prev['8.5.1'] === 'U' ? prev : { ...prev, '8.5.1': 'U' });
    }
  }, [b8.druckbegrenzung, b8.druckbegrenzungHandpumpe]);

  // ── Navigation with B3-tab awareness ──
  const currentChapter = currentChapterIdx >= 1 && currentChapterIdx <= CHAPTERS.length
    ? CHAPTERS[currentChapterIdx - 1] : null;

  const handleNext = useCallback(() => {
    if (currentChapter?.id === 3 && b3ActiveTab === 'kopf') {
      setB3ActiveTab('fragen');
    } else {
      setCurrentChapterIdx(prev => Math.min(CHAPTERS.length + 1, prev + 1));
      if (currentChapter?.id === 3) setB3ActiveTab('kopf');
    }
  }, [currentChapter, b3ActiveTab]);

  const handlePrev = useCallback(() => {
    if (currentChapter?.id === 3 && b3ActiveTab === 'fragen') {
      setB3ActiveTab('kopf');
    } else {
      setCurrentChapterIdx(prev => Math.max(0, prev - 1));
    }
  }, [currentChapter, b3ActiveTab]);

  const handleNewProtocol = useCallback(() => {
    if (!window.confirm(t('newProtocolConfirm', lang))) return;
    localStorage.removeItem(STORAGE_KEY);
    setHeader({ installationType: 'Neuanlage', certType: 'Baumusterprüfung', fabrikationsNr: '', aufzugstyp: '', standortadresse: '', adresse: '' });
    setAnswers({});
    setUmbau({});
    setB1({ hubhoehe:'', stockwerke:'', zugaenge:'', nennlast:'', personen:'' });
    setB3kopf({ nenngeschwindigkeit:'', S:'', A:'', B:'', C:'', D:'', E:'', Z:'', U:'' });
    setB3grube({ S:'', F:'', G:'', H:'', J:'', P:'', U:'' });
    setB6({ mode:'', seilAnzahl:'', seilNenn:'', ketteAnzahl:'', ketteDim:'' });
    setB7({ fang:false, ausgleich:false, begrenzer:false, rohrbruch:false, drossel:false });
    setB8({ hersteller:'', aggregatTyp:'', motortyp:'', aggregatNr:'', nennstrom:'', motorleistung:'', nennlast:'', leerlast:'', nennlastAuf:'', leerlastAb:'', druckbegrenzung:'', druckbegrenzungHandpumpe:'' });
    setB9({ sollAuf:'', sollAb:'', istLeerAuf:'', istNennlastAb:'', istLeerAufKorr:'', istNennlastAbKorr:'', zurueckAuf:'', zurueckAb:'', pufferGeschwindigkeit:'', nenngeschwindigkeit:'', stromLeer:'', stromNennlast:'', netzspannung:'', steuerspannung:'' });
    setB13({ firma:'', nameAbnahme:'', datum: new Date().toISOString().split('T')[0] });
    setCurrentChapterIdx(0);
    setB3ActiveTab('kopf');
  }, [lang]);

  // Count only real question paths (not marker paths like __KOPF_CARD__ or auto-filled)
  const totalQuestions    = CHAPTERS.reduce((s, ch) =>
    s + ch.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p)).length, 0);
  const answeredQuestions = CHAPTERS.reduce((s, ch) =>
    s + ch.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p) && answers[p]).length, 0);
  const progressPercent   = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const totalChapters = CHAPTERS.length;
  const isLast        = currentChapterIdx === totalChapters + 1;

  const chapterAnswered = currentChapter
    ? currentChapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p) && answers[p]).length : 0;
  const chapterTotal    = currentChapter
    ? currentChapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p)).length : 0;
  const chapterPercent  = chapterTotal > 0 ? Math.round((chapterAnswered / chapterTotal) * 100) : 0;

  const chapterTitle = currentChapterIdx === 0
    ? t('b0CardTitle', lang)
    : currentChapter ? currentChapter.title
    : 'PDF';

  const handleManualSave = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
      saveState({ header, answers, umbau, b1, b3kopf, b3grube, b6, b7, b8, b9, b13 });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, [header, answers, umbau, b1, b3kopf, b3grube, b6, b7, b8, b9, b13]);

  const handleGeneratePdf = useCallback(async () => {
    setIsPdfGenerating(true);
    try {
      const hydroData = {
        installationType: header.installationType, certType: header.certType,
        machineRoomless: header.certType === 'MRL',
        fabrikationsNr: header.fabrikationsNr, aufzugstyp: header.aufzugstyp,
        standortadresse: header.standortadresse, adresse: header.adresse,
        b1_hubhoehe: b1.hubhoehe, b1_stockwerke: b1.stockwerke, b1_zugaenge: b1.zugaenge,
        b1_nennlast: b1.nennlast, b1_personen: b1.personen,
        b1_anforderungen: answers['B1_Anforderungen'] ?? '',
        b7_fang: b7.fang, b7_ausgleich: b7.ausgleich, b7_begrenzer: b7.begrenzer,
        b7_rohrbruch: b7.rohrbruch, b7_drossel: b7.drossel,
        b8_hersteller: b8.hersteller, b8_aggregatTyp: b8.aggregatTyp, b8_motortyp: b8.motortyp,
        b8_aggregatNr: b8.aggregatNr, b8_nennstrom: b8.nennstrom, b8_motorleistung: b8.motorleistung,
        b8_nennlast: b8.nennlast, b8_leerlast: b8.leerlast, b8_nennlastAuf: b8.nennlastAuf,
        b8_leerlastAb: b8.leerlastAb, b8_druckbegrenzung: b8.druckbegrenzung,
        b8_druckbegrenzungHandpumpe: b8.druckbegrenzungHandpumpe,
        b9_sollAuf: b9.sollAuf, b9_sollAb: b9.sollAb, b9_istLeerAuf: b9.istLeerAuf,
        b9_istNennlastAb: b9.istNennlastAb, b9_stromLeer: b9.stromLeer,
        b9_stromNennlast: b9.stromNennlast, b9_netzspannung: b9.netzspannung,
        b9_steuerspannung: b9.steuerspannung,
        b13_firma: b13.firma, b13_nameAbnahme: b13.nameAbnahme, b13_datum: b13.datum,
        b13_bauseitigePendenzen: answers['B13_Bauseitige_Pendenzen'] ?? '',
        b13_aufzugsseitigePendenzen: answers['B13_Aufzugsseitige_Pendenzen'] ?? '',
        b3_kopf: (() => {
          const n = (s: string) => { const v = parseFloat(s); return isNaN(v) ? 0 : v; };
          const S = n(b3kopf.S), Z = n(b3kopf.Z), U = n(b3kopf.U);
          return {
            nenngeschwindigkeit: b3kopf.nenngeschwindigkeit,
            ueberfahrt: b3kopf.U,
            A1: (n(b3kopf.A) - S).toFixed(1),
            A2: Z.toFixed(1),
            A3: U.toFixed(1),
            fill_A4: (n(b3kopf.A) - S - Z - U).toFixed(1),
            B1: (n(b3kopf.B) - S).toFixed(1),
            B2: Z.toFixed(1),
            B3: U.toFixed(1),
            fill_B4: (n(b3kopf.B) - S - Z - U).toFixed(1),
            C1: (n(b3kopf.C) - S).toFixed(1),
            C2: Z.toFixed(1),
            C3: U.toFixed(1),
            fill_C4: (n(b3kopf.C) - S - Z - U).toFixed(1),
            D1: (n(b3kopf.D) - S).toFixed(1),
            D2: Z.toFixed(1),
            D3: U.toFixed(1),
            fill_D4: (n(b3kopf.D) - S - Z - U).toFixed(1),
            E1: (n(b3kopf.E) - S / 2).toFixed(1),
            E3: U.toFixed(1),
            fill_E4: (n(b3kopf.E) - S / 2 - Z - U).toFixed(1),
          };
        })(),
        b3_grube: (() => {
          const nv = (s: string) => { const v = parseFloat(s); return isNaN(v) ? 0 : v; };
          const S = nv(b3grube.S), P = nv(b3grube.P), U = nv(b3grube.U);
          return {
            F1: (nv(b3grube.F) - S).toFixed(1), F2: U.toFixed(1), F3: P.toFixed(1),
            fill_F4: (nv(b3grube.F) - S - P - U).toFixed(1),
            G1: (nv(b3grube.G) - S).toFixed(1), G2: U.toFixed(1), G3: P.toFixed(1),
            fill_G4: (nv(b3grube.G) - S - P - U).toFixed(1),
            H1: (nv(b3grube.H) - S).toFixed(1), H2: U.toFixed(1), H3: P.toFixed(1),
            fill_H4: (nv(b3grube.H) - S - P - U).toFixed(1),
            J1: (nv(b3grube.J) - S).toFixed(1), J2: U.toFixed(1), J3: P.toFixed(1),
            fill_J4: (nv(b3grube.J) - S - P - U).toFixed(1),
          };
        })(),
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

  const modern = theme === 'modern';

  return (
    <div className="min-h-screen">
      <PageHeader title={`HYDRO – ${chapterTitle}`} onHome={onHome} progressPercent={progressPercent} showProgress />

      <div className={`border-b overflow-x-auto ${modern ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-blue-900' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex w-max mx-auto px-3 py-2 gap-1">
          <TabBtn label={t('headerTab', lang)} active={currentChapterIdx === 0} color="blue" modern={modern} onClick={() => setCurrentChapterIdx(0)} />
          {CHAPTERS.map((ch, idx) => (
            <TabBtn key={ch.id} label={`${t('blockTab', lang)} ${idx + 1}`} active={currentChapterIdx === idx + 1} color="blue" modern={modern} onClick={() => { setCurrentChapterIdx(idx + 1); setB3ActiveTab('kopf'); }} />
          ))}
          <TabBtn label="📄 PDF" active={isLast} color="green" modern={modern} onClick={() => setCurrentChapterIdx(totalChapters + 1)} />
        </div>
      </div>

      <div className={`min-h-screen relative ${modern ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>
        {modern && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
          </>
        )}

        <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-x-hidden">
          {/* Progress header */}
          {modern ? (
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-px shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse pointer-events-none" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-1">{chapterTitle}</h2>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-cyan-500" />{t('hydroSubtitle', lang)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {currentChapter ? (
                      <>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{chapterAnswered} / {chapterTotal} {t('completed', lang)}</div>
                        <div className="text-xs text-gray-500">{chapterPercent}% {t('done', lang)}</div>
                      </>
                    ) : (
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{answeredQuestions} / {totalQuestions} {t('total', lang)}</div>
                    )}
                  </div>
                </div>
                <div className="mt-4 relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${currentChapter ? chapterPercent : progressPercent}%` }} />
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

          {/* Content */}
          {currentChapterIdx === 0 && (
            <B0Section header={header} setHeader={setHeader} theme={theme} lang={lang} onNewProtocol={handleNewProtocol} />
          )}
          {currentChapterIdx === totalChapters + 1 && (
            <PdfSection onGenerate={handleGeneratePdf} isGenerating={isPdfGenerating}
              fabrikationsNr={header.fabrikationsNr} onNavigate={onNavigate} theme={theme} lang={lang} />
          )}
          {currentChapter && (
            <ChapterSection
              chapter={currentChapter} answers={answers} setAnswer={setAnswer}
              umbau={umbau} toggleUmbau={toggleUmbau}
              theme={theme} lang={lang}
              questionMap={questionMap} groupTitleMap={groupTitleMap}
              b3ActiveTab={b3ActiveTab} setB3ActiveTab={setB3ActiveTab}
              b1Data={currentChapter.id === 1 ? b1 : undefined} setB1={currentChapter.id === 1 ? setB1 : undefined}
              b3kopf={currentChapter.id === 3 ? b3kopf : undefined} setB3kopf={currentChapter.id === 3 ? setB3kopf : undefined}
              b3grube={currentChapter.id === 3 ? b3grube : undefined} setB3grube={currentChapter.id === 3 ? setB3grube : undefined}
              b6Data={currentChapter.id === 6 ? b6 : undefined} setB6={currentChapter.id === 6 ? setB6 : undefined}
              b7={currentChapter.id === 7 ? b7 : undefined} setB7={currentChapter.id === 7 ? setB7 : undefined}
              b8Data={currentChapter.id === 8 ? b8 : undefined} setB8={currentChapter.id === 8 ? setB8 : undefined}
              b9Data={currentChapter.id === 9 ? b9 : undefined} setB9={currentChapter.id === 9 ? setB9 : undefined}
              b13Data={currentChapter.id === 13 ? b13 : undefined} setB13={currentChapter.id === 13 ? setB13 : undefined}
            />
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 pt-6 border-t-2 border-blue-100 dark:border-blue-900">
            {modern ? (
              <button onClick={handlePrev}
                disabled={currentChapterIdx === 0}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{t('prev', lang)}</span>
                </div>
              </button>
            ) : (
              <Button variant="outline" disabled={currentChapterIdx === 0}
                onClick={handlePrev}
                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                <ArrowLeft className="h-4 w-4" />{t('prev', lang)}
              </Button>
            )}

            <div className="flex gap-3">
              {modern ? (
                <button onClick={handleManualSave} disabled={saveStatus === 'saving'}
                  className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    saveStatus === 'saved'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  }`}>
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

              {currentChapterIdx < totalChapters + 1 ? (
                modern ? (
                  <button onClick={handleNext}
                    className="group relative overflow-hidden px-8 py-3 rounded-xl font-semibold transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-2 text-white">
                      <span>{t('next', lang)}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ) : (
                  <Button onClick={handleNext}
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
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${active ? (modern ? activeGrad : (color === 'green' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')) : inactiveCls}`}
    >{label}</button>
  );
}

// ============================================================
// B0 FEJLÉC SZEKCIÓ
// ============================================================

function B0Section({ header, setHeader, theme, lang, onNewProtocol }: {
  header: HydroHeader; setHeader: React.Dispatch<React.SetStateAction<HydroHeader>>;
  theme: 'modern' | 'classic'; lang: Lang;
  onNewProtocol: () => void;
}) {
  const upd = (key: keyof HydroHeader, value: string | boolean) =>
    setHeader(prev => ({ ...prev, [key]: value }));
  const modern   = theme === 'modern';
  const cardCls  = modern ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300' : 'shadow-lg overflow-hidden';
  const hdrCls   = modern ? 'relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white p-6' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4';

  const fields: [keyof HydroHeader, string][] = [
    ['fabrikationsNr', 'Fabrikations-Nr.'],
    ['aufzugstyp',     'Aufzugstyp'],
    ['standortadresse','Standortadresse'],
    ['adresse',        'Montagebetrieb / Adresse'],
  ];

  // 3 unified Prüfungsart options
  const certOptions: { value: HydroHeader['certType']; label: string }[] = [
    { value: 'Baumusterprüfung', label: 'mit Baumusterprüfung' },
    { value: 'Entwurfsprüfung',  label: 'mit Entwurfsprüfung' },
    { value: 'MRL',              label: 'ohne Maschinenraum (MRL)' },
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
        {/* Anlage Typ */}
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

        {/* Prüfungsart – 3 unified options */}
        <div>
          <Label className="font-semibold mb-3 block text-gray-700 dark:text-gray-300">{t('pruefungsart', lang)}</Label>
          <div className="flex gap-3 flex-wrap">
            {certOptions.map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm ${header.certType === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300'}`}>
                <input type="radio" name="certType" value={opt.value} checked={header.certType === opt.value} onChange={() => upd('certType', opt.value)} className="accent-blue-600" />
                {opt.label}
              </label>
            ))}
          </div>
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

        {/* Neues Protokoll */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onNewProtocol}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newProtocol', lang)}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1">{t('newProtocolConfirm', lang)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// B3 SCHACHTKOPF MÉRÉSI KÁRTYA
// ============================================================

function B3KopfCard({ b3kopf, setB3kopf, modern, lang }: {
  b3kopf: HydroB3KopfData; setB3kopf: React.Dispatch<React.SetStateAction<HydroB3KopfData>>;
  modern: boolean; lang: Lang;
}) {
  const [showDiagram, setShowDiagram] = useState(false);
  const upd = (k: keyof HydroB3KopfData, v: string) => setB3kopf(p => ({ ...p, [k]: v }));
  const n = (s: string) => { const x = parseFloat(s); return isNaN(x) ? 0 : x; };

  // Z auto-calculation from Nenngeschwindigkeit
  // Formula: Z = ceil(0.035 × v² × 1000 / 5) × 5 mm
  const computeZ = (v: number) => {
    if (v <= 0) return '';
    return String(Math.ceil(0.035 * v * v * 1000 / 5) * 5);
  };
  useEffect(() => {
    const vVal = n(b3kopf.nenngeschwindigkeit);
    if (vVal > 0) {
      const z = computeZ(vVal);
      setB3kopf(p => ({ ...p, Z: z }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b3kopf.nenngeschwindigkeit]);

  const S = n(b3kopf.S), Z = n(b3kopf.Z), U = n(b3kopf.U);
  const hasBase = b3kopf.S !== '' || b3kopf.Z !== '' || b3kopf.U !== '';

  const kopfI18n = {
    title:    { hu:'Schachtkopf biztonsági távolságok', de:'Sicherheitsabstände im Schachtkopf', en:'Safety Distances in Shaft Head', fr:'Distances de sécurité en tête de gaine', it:'Distanze di sicurezza in testa pozzo' },
    basisLbl: { hu:'Basiswerte (közös levonások)', de:'Basiswerte (gemeinsame Abzüge)', en:'Base Values (common deductions)', fr:'Valeurs de base (déductions communes)', it:'Valori base (deduzioni comuni)' },
    autoCalc: { hu:'Automatikusan v-ből számítva', de:'Automatisch aus v berechnet', en:'Auto-calculated from v', fr:'Calculé automatiquement depuis v', it:'Calcolato automaticamente da v' },
    baseHint: { hu:'Adja meg az S, Z, U értékeket — az effektív távolságok automatikusan számítódnak', de:'S, Z, U eingeben — Effektive Abstände werden automatisch berechnet', en:'Enter S, Z, U — effective distances auto-calculated', fr:'Entrez S, Z, U — distances effectives calculées automatiquement', it:'Inserire S, Z, U — distanze effettive calcolate automaticamente' },
    measLbl:  { hu:'Gemessene Abstände → Effektive Sicherheitsabstände', de:'Gemessene Abstände → Effektive Sicherheitsabstände', en:'Measured Distances → Effective Safety Distances', fr:'Distances mesurées → Distances de sécurité effectives', it:'Distanze misurate → Distanze di sicurezza effettive' },
    rawHint:  { hu:'Nyersérték → azonnali eredmény', de:'Rohwert eingeben → sofort berechnet', en:'Enter raw value → instantly calculated', fr:'Valeur brute → calculée immédiatement', it:'Valore grezzo → calcolato immediatamente' },
    allOk:    { hu:'Minden biztonsági távolság teljesül', de:'Alle Sicherheitsabstände erfüllt', en:'All safety distances fulfilled', fr:'Toutes distances de sécurité respectées', it:'Tutte le distanze di sicurezza rispettate' },
    someNok:  { hu:'— Mindestabstand nicht eingehalten', de:'— Mindestabstand nicht eingehalten', en:'— Minimum distance not met', fr:'— Distance minimale non respectée', it:'— Distanza minima non rispettata' },
    diagramBtn:{ hu:'📐 Ábra', de:'📐 Diagramm', en:'📐 Diagram', fr:'📐 Schéma', it:'📐 Schema' },
  };
  const ki = (key: keyof typeof kopfI18n) => kopfI18n[key][lang] ?? kopfI18n[key]['de'];

  const measurements = [
    { id:'A', key:'A' as const, eff: n(b3kopf.A) - S - Z - U,         min:1000, color:'blue',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${Z.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Stehfläche Kabinendach → Schachtkopf' },
    { id:'B', key:'B' as const, eff: n(b3kopf.B) - S - Z - U,         min: 300, color:'purple',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${Z.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Höchster Punkt Kabine → tiefster Punkt Schachtkopf' },
    { id:'C', key:'C' as const, eff: n(b3kopf.C) - S - Z - U,         min: 100, color:'teal',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${Z.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Kabinenführung → Schachtkopf' },
    { id:'D', key:'D' as const, eff: n(b3kopf.D) - S - Z - U,         min: 100, color:'orange',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${Z.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Kabinenführung → Schienenende' },
    { id:'E', key:'E' as const, eff: n(b3kopf.E) - S / 2 - Z - U,     min: 100, color:'rose',
      formula: (v: number) => `${v.toFixed(0)} − ${(S/2).toFixed(1)} − ${Z.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Kolbenende → Schachtkopf' },
  ] as const;

  const colorMap = {
    blue:   { ring:'border-blue-400',   bg:'bg-blue-600',   light:'bg-blue-50 dark:bg-blue-950/30',   text:'text-blue-700 dark:text-blue-300',   inp:'border-blue-200 dark:border-blue-800 focus:ring-blue-400' },
    purple: { ring:'border-purple-400', bg:'bg-purple-600', light:'bg-purple-50 dark:bg-purple-950/30',text:'text-purple-700 dark:text-purple-300',inp:'border-purple-200 dark:border-purple-800 focus:ring-purple-400' },
    teal:   { ring:'border-teal-400',   bg:'bg-teal-600',   light:'bg-teal-50 dark:bg-teal-950/30',   text:'text-teal-700 dark:text-teal-300',   inp:'border-teal-200 dark:border-teal-800 focus:ring-teal-400' },
    orange: { ring:'border-orange-400', bg:'bg-orange-500', light:'bg-orange-50 dark:bg-orange-950/30',text:'text-orange-700 dark:text-orange-300',inp:'border-orange-200 dark:border-orange-800 focus:ring-orange-400' },
    rose:   { ring:'border-rose-400',   bg:'bg-rose-600',   light:'bg-rose-50 dark:bg-rose-950/30',   text:'text-rose-700 dark:text-rose-300',   inp:'border-rose-200 dark:border-rose-800 focus:ring-rose-400' },
  };

  const resultCls = (val: number, min: number, has: boolean) =>
    !has ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300'
         : val >= min ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 dark:shadow-green-900/50'
                      : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/50';

  return (
    <div className="space-y-3">
      {/* ── Header card ── */}
      <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-cyan-100 dark:border-cyan-900/50">
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-700 via-teal-600 to-emerald-500 text-white px-5 py-4">
          {modern && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />}
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">{ki('title')}</h3>
              <p className="text-white/70 text-xs mt-0.5">{ki('rawHint')}</p>
            </div>
            <button onClick={() => setShowDiagram(p => !p)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl px-3 py-2 text-xs font-semibold transition-all">
              {showDiagram ? '▲' : ki('diagramBtn')}
            </button>
          </div>
        </div>

        {/* Diagram */}
        {showDiagram && (
          <div className="bg-white dark:bg-gray-900">
            <img src="/schachtkopf-diagram.jpg" alt="Schachtkopf" className="w-full object-contain max-h-64" />
            <p className="text-xs text-center text-gray-400 py-1.5 bg-gray-50 dark:bg-gray-800">A, B, C, D, E – Sicherheitsabstände</p>
          </div>
        )}
      </div>

      {/* ── Basiswerte ── */}
      <div className="rounded-2xl overflow-hidden border-2 border-violet-200 dark:border-violet-800 shadow-lg">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">1</span>
          <div>
            <p className="font-bold text-sm">{ki('basisLbl')}</p>
            <p className="text-white/70 text-xs">S, Z, U, v</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 bg-violet-50/60 dark:bg-violet-950/20 divide-x divide-violet-100 dark:divide-violet-800">
          {/* v — Nenngeschwindigkeit (zuerst eingeben) */}
          <div className="p-3">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-violet-700 dark:text-violet-300">v</span>
              <span className="text-xs text-violet-500 font-medium">(m/s)</span>
            </div>
            <Input type="number" value={b3kopf.nenngeschwindigkeit} onChange={e => upd('nenngeschwindigkeit', e.target.value)}
              placeholder="0.63"
              className="text-center text-base font-bold h-10 border-violet-300 dark:border-violet-700 focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-900" />
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5 font-medium">Nenngeschw.</p>
          </div>
          {/* Z — Zuschlag (auto-calculated) */}
          <div className="p-3 relative">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-violet-700 dark:text-violet-300">Z</span>
              <span className="text-xs text-violet-500 font-medium">(mm)</span>
              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium">auto</span>
            </div>
            <Input type="number" value={b3kopf.Z} readOnly
              className="text-center text-base font-bold h-10 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 cursor-default" />
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5 font-medium">Zuschlag</p>
            <p className="text-xs text-violet-400 dark:text-violet-500">= ⌈0.035×v²×1000/5⌉×5</p>
          </div>
          {/* S — Schwellenabstand */}
          <div className="p-3">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-violet-700 dark:text-violet-300">S</span>
              <span className="text-xs text-violet-500 font-medium">(mm)</span>
            </div>
            <Input type="number" value={b3kopf.S} onChange={e => upd('S', e.target.value)} placeholder="0"
              className="text-center text-base font-bold h-10 border-violet-300 dark:border-violet-700 focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-900" />
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5 font-medium">Schwellenabstand</p>
            <p className="text-xs text-violet-400 dark:text-violet-500">Kabine → Schachttür</p>
          </div>
          {/* U — Überfahrt */}
          <div className="p-3">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-violet-700 dark:text-violet-300">U</span>
              <span className="text-xs text-violet-500 font-medium">(mm)</span>
            </div>
            <Input type="number" value={b3kopf.U} onChange={e => upd('U', e.target.value)} placeholder="0"
              className="text-center text-base font-bold h-10 border-violet-300 dark:border-violet-700 focus:ring-2 focus:ring-violet-400 bg-white dark:bg-gray-900" />
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5 font-medium">Überfahrt</p>
            <p className="text-xs text-violet-400 dark:text-violet-500">Kolbenhubbegr. oben</p>
          </div>
        </div>
        {!hasBase && (
          <div className="px-4 py-2 bg-violet-100 dark:bg-violet-950/30 text-xs text-violet-600 dark:text-violet-400 flex items-center gap-2">
            <span>💡</span>
            <span>{ki('baseHint')}</span>
          </div>
        )}
      </div>

      {/* ── Mérési értékek + Eredmények kombinált kártyák ── */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">2</span>
          <div>
            <p className="font-bold text-sm">{ki('measLbl')}</p>
            <p className="text-white/60 text-xs">{ki('rawHint')}</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {measurements.map(m => {
            const c = colorMap[m.color];
            const val = n(b3kopf[m.key]);
            const has = b3kopf[m.key] !== '' && hasBase;
            return (
              <div key={m.id} className={`${c.light} p-3`}>
                <div className="flex items-start gap-3">
                  {/* ID Badge */}
                  <div className={`w-10 h-10 rounded-xl ${c.bg} text-white text-xl font-black flex items-center justify-center shrink-0 shadow-md mt-0.5`}>
                    {m.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${c.text} mb-1 truncate`}>{m.desc}</p>
                    {/* Input + Result row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input type="number" value={b3kopf[m.key]} onChange={e => upd(m.key, e.target.value)}
                          placeholder="mm"
                          className={`text-center text-base font-bold h-10 ${c.inp} focus:ring-2 bg-white dark:bg-gray-900`} />
                        {has && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-center">
                            = {m.formula(val)}
                          </p>
                        )}
                      </div>
                      <div className="text-gray-400 font-bold text-lg shrink-0">→</div>
                      {/* Result tile */}
                      <div className={`w-28 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${resultCls(m.eff, m.min, has)}`}>
                        {has ? (
                          <>
                            <span className="text-sm font-black leading-none">{m.eff.toFixed(0)} mm</span>
                            <span className="text-xs opacity-80">{m.eff >= m.min ? '✓ OK' : `✗ min.${m.min}`}</span>
                          </>
                        ) : (
                          <span className="text-xs font-medium">min. {m.min} mm</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Összesítő eredmény sáv ── */}
      {hasBase && measurements.some(m => b3kopf[m.key] !== '') && (
        <div className={`rounded-2xl p-4 text-center font-bold text-sm shadow-lg ${
          measurements.filter(m => b3kopf[m.key] !== '').every(m => m.eff >= m.min)
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
        }`}>
          {measurements.filter(m => b3kopf[m.key] !== '').every(m => m.eff >= m.min)
            ? `✓ ${ki('allOk')}`
            : `⚠ ${measurements.filter(m => b3kopf[m.key] !== '' && m.eff < m.min).map(m => m.id).join(', ')} ${ki('someNok')}`}
        </div>
      )}
    </div>
  );
}

// ============================================================
// B3 SCHACHTGRUBE MÉRÉSI KÁRTYA
// ============================================================

function B3GrubeCard({ b3grube, setB3grube, modern, lang }: {
  b3grube: HydroB3GrubeData; setB3grube: React.Dispatch<React.SetStateAction<HydroB3GrubeData>>;
  modern: boolean; lang: Lang;
}) {
  const [showDiagram, setShowDiagram] = useState(false);
  const upd = (k: keyof HydroB3GrubeData, v: string) => setB3grube(p => ({ ...p, [k]: v }));
  const nv = (s: string) => { const x = parseFloat(s); return isNaN(x) ? 0 : x; };

  const S = nv(b3grube.S), P = nv(b3grube.P), U = nv(b3grube.U);
  const hasBase = b3grube.S !== '' || b3grube.P !== '' || b3grube.U !== '';

  const grubeI18n = {
    title:    { hu:'Schachtgrube biztonsági távolságok', de:'Sicherheitsabstände in der Schachtgrube', en:'Safety Distances in Shaft Pit', fr:'Distances de sécurité dans la fosse', it:'Distanze di sicurezza nella fossa' },
    basisLbl: { hu:'Basiswerte (közös levonások)', de:'Basiswerte (gemeinsame Abzüge)', en:'Base Values (common deductions)', fr:'Valeurs de base (déductions communes)', it:'Valori base (deduzioni comuni)' },
    baseHint: { hu:'Adja meg az S, P, U értékeket — az effektív távolságok automatikusan számítódnak', de:'S, P, U eingeben — Effektive Abstände werden automatisch berechnet', en:'Enter S, P, U — effective distances auto-calculated', fr:'Entrez S, P, U — distances effectives calculées automatiquement', it:'Inserire S, P, U — distanze effettive calcolate automaticamente' },
    measLbl:  { hu:'Gemessene Abstände → Effektive Sicherheitsabstände', de:'Gemessene Abstände → Effektive Sicherheitsabstände', en:'Measured Distances → Effective Safety Distances', fr:'Distances mesurées → Distances de sécurité effectives', it:'Distanze misurate → Distanze di sicurezza effettive' },
    rawHint:  { hu:'Nyersérték → azonnali eredmény', de:'Rohwert eingeben → sofort berechnet', en:'Enter raw value → instantly calculated', fr:'Valeur brute → calculée immédiatement', it:'Valore grezzo → calcolato immediatamente' },
    allOk:    { hu:'Minden biztonsági távolság teljesül', de:'Alle Sicherheitsabstände erfüllt', en:'All safety distances fulfilled', fr:'Toutes distances de sécurité respectées', it:'Tutte le distanze di sicurezza rispettate' },
    someNok:  { hu:'— Mindestabstand nicht eingehalten', de:'— Mindestabstand nicht eingehalten', en:'— Minimum distance not met', fr:'— Distance minimale non respectée', it:'— Distanza minima non rispettata' },
    diagramBtn:{ hu:'📐 Ábra', de:'📐 Diagramm', en:'📐 Diagram', fr:'📐 Schéma', it:'📐 Schema' },
  };
  const gi = (key: keyof typeof grubeI18n) => grubeI18n[key][lang] ?? grubeI18n[key]['de'];

  const measurements = [
    { id:'F', key:'F' as const, eff: nv(b3grube.F) - S - P - U, min: 300, color:'emerald',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${P.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Unterste Punkt Kabine – höchste Punkt Schachtgrube' },
    { id:'G', key:'G' as const, eff: nv(b3grube.G) - S - P - U, min: 100, color:'green',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${P.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Tiefste Punkt Kabine (Schürze) – Grubenboden' },
    { id:'H', key:'H' as const, eff: nv(b3grube.H) - S - P - U, min: 500, color:'teal',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${P.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Unterste Punkt Kabine – Grubenboden' },
    { id:'J', key:'J' as const, eff: nv(b3grube.J) - S - P - U, min: 100, color:'cyan',
      formula: (v: number) => `${v.toFixed(0)} − ${S.toFixed(0)} − ${P.toFixed(0)} − ${U.toFixed(0)}`,
      desc:'Kabinenführung – Schienenende Kabine' },
  ] as const;

  const colorMap = {
    emerald: { bg:'bg-emerald-600', light:'bg-emerald-50 dark:bg-emerald-950/30', text:'text-emerald-700 dark:text-emerald-300', inp:'border-emerald-200 dark:border-emerald-800 focus:ring-emerald-400' },
    green:   { bg:'bg-green-600',   light:'bg-green-50 dark:bg-green-950/30',   text:'text-green-700 dark:text-green-300',   inp:'border-green-200 dark:border-green-800 focus:ring-green-400'   },
    teal:    { bg:'bg-teal-600',    light:'bg-teal-50 dark:bg-teal-950/30',     text:'text-teal-700 dark:text-teal-300',     inp:'border-teal-200 dark:border-teal-800 focus:ring-teal-400'     },
    cyan:    { bg:'bg-cyan-600',    light:'bg-cyan-50 dark:bg-cyan-950/30',     text:'text-cyan-700 dark:text-cyan-300',     inp:'border-cyan-200 dark:border-cyan-800 focus:ring-cyan-400'     },
  };

  const resultCls = (val: number, min: number, has: boolean) =>
    !has ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300'
         : val >= min ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 dark:shadow-green-900/50'
                      : 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/50';

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-100 dark:border-emerald-900/50">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-green-600 to-teal-500 text-white px-5 py-4">
          {modern && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />}
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">{gi('title')}</h3>
              <p className="text-white/70 text-xs mt-0.5">{gi('rawHint')}</p>
            </div>
            <button onClick={() => setShowDiagram(p => !p)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl px-3 py-2 text-xs font-semibold transition-all">
              {showDiagram ? '▲' : gi('diagramBtn')}
            </button>
          </div>
        </div>
        {showDiagram && (
          <div className="bg-white dark:bg-gray-900">
            <img src="/schachtgrube-diagram.jpg" alt="Schachtgrube" className="w-full object-contain max-h-72" />
            <p className="text-xs text-center text-gray-400 py-1.5 bg-gray-50 dark:bg-gray-800">F, G, H, J – Sicherheitsabstände</p>
          </div>
        )}
      </div>

      {/* ── Basiswerte (S, P, U) ── */}
      <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">1</span>
          <div>
            <p className="font-bold text-sm">{gi('basisLbl')}</p>
            <p className="text-white/70 text-xs">S, P, U</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 bg-emerald-50/60 dark:bg-emerald-950/20 divide-x divide-emerald-100 dark:divide-emerald-800">
          {([
            { key:'S' as const, label:'S', sub:'Schwellenabstand', hint:'Kabine – unterste Schachttür-Schwelle' },
            { key:'P' as const, label:'P', sub:'Pufferhub',        hint:'Kabine' },
            { key:'U' as const, label:'U', sub:'Unterfahrt',       hint:'bis Kabine den Puffer berührt' },
          ]).map(f => (
            <div key={f.key} className="p-3">
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{f.label}</span>
                <span className="text-xs text-emerald-500 font-medium">(mm)</span>
              </div>
              <Input type="number" value={b3grube[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder="0"
                className="text-center text-base font-bold h-10 border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-900" />
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1.5 font-medium">{f.sub}</p>
              <p className="text-xs text-emerald-400 dark:text-emerald-500 leading-tight">{f.hint}</p>
            </div>
          ))}
        </div>
        {!hasBase && (
          <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-950/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>💡</span><span>{gi('baseHint')}</span>
          </div>
        )}
      </div>

      {/* ── Messungen + Ergebnisse ── */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">2</span>
          <div>
            <p className="font-bold text-sm">{gi('measLbl')}</p>
            <p className="text-white/60 text-xs">{gi('rawHint')}</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {measurements.map(m => {
            const c = colorMap[m.color];
            const val = nv(b3grube[m.key]);
            const has = b3grube[m.key] !== '' && hasBase;
            return (
              <div key={m.id} className={`${c.light} p-3`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} text-white text-xl font-black flex items-center justify-center shrink-0 shadow-md mt-0.5`}>
                    {m.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${c.text} mb-1 truncate`}>{m.desc}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input type="number" value={b3grube[m.key]} onChange={e => upd(m.key, e.target.value)}
                          placeholder="mm"
                          className={`text-center text-base font-bold h-10 ${c.inp} focus:ring-2 bg-white dark:bg-gray-900`} />
                        {has && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-center">
                            = {m.formula(val)}
                          </p>
                        )}
                      </div>
                      <div className="text-gray-400 font-bold text-lg shrink-0">→</div>
                      <div className={`w-28 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${resultCls(m.eff, m.min, has)}`}>
                        {has ? (
                          <>
                            <span className="text-sm font-black leading-none">{m.eff.toFixed(0)} mm</span>
                            <span className="text-xs opacity-80">{m.eff >= m.min ? '✓ OK' : `✗ min.${m.min}`}</span>
                          </>
                        ) : (
                          <span className="text-xs font-medium">min. {m.min} mm</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Összesítő ── */}
      {hasBase && measurements.some(m => b3grube[m.key] !== '') && (
        <div className={`rounded-2xl p-4 text-center font-bold text-sm shadow-lg ${
          measurements.filter(m => b3grube[m.key] !== '').every(m => m.eff >= m.min)
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
        }`}>
          {measurements.filter(m => b3grube[m.key] !== '').every(m => m.eff >= m.min)
            ? `✓ ${gi('allOk')}`
            : `⚠ ${measurements.filter(m => b3grube[m.key] !== '' && m.eff < m.min).map(m => m.id).join(', ')} ${gi('someNok')}`}
        </div>
      )}
    </div>
  );
}

// ============================================================
// B6 KÜLÖNLEGES KÁRTYA (Sodrony / Lánc kizárólagos választás)
// ============================================================

function B6SpecialCard({ b6, setB6, answers, setAnswer, modern, lang, questionMap }: {
  b6: HydroB6Data; setB6: React.Dispatch<React.SetStateAction<HydroB6Data>>;
  answers: Record<string, string>; setAnswer: (path: string, value: string) => void;
  modern: boolean; lang: Lang; questionMap: Record<string, string>;
}) {
  const setMode = (mode: 'seil' | 'kette') => {
    setB6(prev => ({ ...prev, mode }));
    // Auto-set inactive section questions to nz
    if (mode === 'seil') {
      ['A.6.2', 'B.6.2'].forEach(p => setAnswer(p, 'nz'));
    } else {
      ['A.6.1', 'B.6.1', 'C.6.1'].forEach(p => setAnswer(p, 'nz'));
    }
  };

  const pillCls = (opt: string, path: string) => {
    const isSelected = answers[path] === opt;
    return `inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-all duration-200 shadow-sm ${
      isSelected ? PILL_ACTIVE[opt] : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 ${PILL_HOVER[opt]}`
    }`;
  };

  const qRow = (path: string, active: boolean) => {
    const rowOptions: QuestionOption[] = ['Ja', 'Nein', 'nz', 'U'];
    const current = answers[path] ?? '';
    const rowBg = current && active ? ROW_BG[current] : '';
    return (
      <div key={path} className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-all ${active ? (rowBg || 'bg-white dark:bg-gray-900') : 'opacity-40 bg-gray-50 dark:bg-gray-800/50 pointer-events-none'}`}>
        <span className="font-mono text-xs text-blue-500 dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 self-start mt-0.5">{path}</span>
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-snug">{questionMap[path] || path}</span>
        {active && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {rowOptions.map(opt => (
              <button key={opt} type="button" onClick={() => setAnswer(path, opt)} className={pillCls(opt, path)}>{opt}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const textInpCls = 'text-sm h-8 border-blue-200 dark:border-blue-800 focus:ring-1 focus:ring-blue-400';

  return (
    <Card className={modern ? 'shadow-xl border-2 border-indigo-100 dark:border-indigo-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
      <CardHeader className={modern ? 'relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-400 text-white py-4 px-5' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4'}>
        {modern && <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-500 opacity-30 animate-pulse pointer-events-none" />}
        <CardTitle className="relative text-base font-bold">Tragmittel – Sodrony oder Lánc?</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Mode selector */}
        <div className="flex gap-3 flex-wrap mb-5">
          <button onClick={() => setMode('seil')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
              b6.mode === 'seil'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-md'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
            }`}>
            <Link2 className="h-4 w-4" />
            {t('b6SeilTitle', lang)}
          </button>
          <button onClick={() => setMode('kette')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
              b6.mode === 'kette'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-md'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
            }`}>
            <Unlink2 className="h-4 w-4" />
            {t('b6KetteTitle', lang)}
          </button>
        </div>

        {/* Drahtseil section */}
        <div className={`rounded-xl border-2 mb-4 overflow-hidden transition-all ${b6.mode === 'seil' ? 'border-indigo-300 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 border-b border-indigo-200 dark:border-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">6.1 – Tragmittel (Drahtseil)</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3 bg-white dark:bg-gray-900">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Anzahl</Label>
              <Input value={b6.seilAnzahl} onChange={e => setB6(p => ({ ...p, seilAnzahl: e.target.value }))}
                disabled={b6.mode !== 'seil'} placeholder="Anzahl" className={textInpCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Nenndurchmesser (mm)</Label>
              <Input value={b6.seilNenn} onChange={e => setB6(p => ({ ...p, seilNenn: e.target.value }))}
                disabled={b6.mode !== 'seil'} placeholder="mm" className={textInpCls} />
            </div>
          </div>
          {qRow('A.6.1', b6.mode === 'seil')}
          {qRow('B.6.1', b6.mode === 'seil')}
          {qRow('C.6.1', b6.mode === 'seil')}
        </div>

        {/* Kette section */}
        <div className={`rounded-xl border-2 overflow-hidden transition-all ${b6.mode === 'kette' ? 'border-indigo-300 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 border-b border-indigo-200 dark:border-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">6.2 – Tragmittel (Kette)</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3 bg-white dark:bg-gray-900">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Anzahl</Label>
              <Input value={b6.ketteAnzahl} onChange={e => setB6(p => ({ ...p, ketteAnzahl: e.target.value }))}
                disabled={b6.mode !== 'kette'} placeholder="Anzahl" className={textInpCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Dimension</Label>
              <Input value={b6.ketteDim} onChange={e => setB6(p => ({ ...p, ketteDim: e.target.value }))}
                disabled={b6.mode !== 'kette'} placeholder="Dimension" className={textInpCls} />
            </div>
          </div>
          {qRow('A.6.2', b6.mode === 'kette')}
          {qRow('B.6.2', b6.mode === 'kette')}
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
  b1Data, setB1, b3kopf, setB3kopf, b3grube, setB3grube,
  b6Data, setB6, b7, setB7, b8Data, setB8, b9Data, setB9, b13Data, setB13,
  b3ActiveTab, setB3ActiveTab,
}: {
  chapter: Chapter; answers: Record<string, string>; setAnswer: (path: string, value: string) => void;
  umbau: Record<string, boolean>; toggleUmbau: (path: string) => void;
  theme: 'modern' | 'classic'; lang: Lang;
  questionMap: Record<string, string>; groupTitleMap: Record<string, string>;
  b3ActiveTab: 'kopf' | 'fragen'; setB3ActiveTab: React.Dispatch<React.SetStateAction<'kopf' | 'fragen'>>;
  b1Data?: HydroB1Data;      setB1?:  React.Dispatch<React.SetStateAction<HydroB1Data>>;
  b3kopf?: HydroB3KopfData;  setB3kopf?: React.Dispatch<React.SetStateAction<HydroB3KopfData>>;
  b3grube?: HydroB3GrubeData; setB3grube?: React.Dispatch<React.SetStateAction<HydroB3GrubeData>>;
  b6Data?: HydroB6Data;      setB6?:  React.Dispatch<React.SetStateAction<HydroB6Data>>;
  b7?:    HydroB7Comp;       setB7?:  React.Dispatch<React.SetStateAction<HydroB7Comp>>;
  b8Data?: HydroB8Data;      setB8?:  React.Dispatch<React.SetStateAction<HydroB8Data>>;
  b9Data?: HydroB9Data;      setB9?:  React.Dispatch<React.SetStateAction<HydroB9Data>>;
  b13Data?: HydroB13Data;    setB13?: React.Dispatch<React.SetStateAction<HydroB13Data>>;
}) {
  const options = chapter.options ?? DEFAULT_OPTIONS;
  const modern  = theme === 'modern';

  const gradHdr = (gradient: string) =>
    modern ? `relative overflow-hidden ${gradient} text-white p-6` : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4';
  const cardCls = modern
    ? 'shadow-xl border-2 border-blue-100 dark:border-blue-900/50 overflow-hidden hover:shadow-2xl transition-shadow duration-300'
    : 'shadow-lg overflow-hidden';
  const pulseCls = (g: string) => modern ? <div className={`absolute inset-0 ${g} opacity-30 animate-pulse pointer-events-none`} /> : null;

  // B1 measurement fields (without Anforderungen – conditional)
  const b1Fields: [keyof HydroB1Data, string][] = [
    ['hubhoehe','Hubhöhe (m)'],['stockwerke','Stockwerke'],['zugaenge','Zugänge'],
    ['nennlast','Nennlast (kg)'],['personen','Personen'],
  ];

  // B7 component labels for the Hydraulische Komponenten card
  const b7Components: [keyof HydroB7Comp, string][] = [
    ['fang','Fangvorrichtung'],['ausgleich','Ausgleichsgewicht'],['begrenzer','Geschw.-begrenzer'],
    ['rohrbruch','Rohrbruchventil'],['drossel','Drosselventil'],
  ];

  // B8 fields
  const b8Fields: [keyof HydroB8Data, string][] = [
    ['hersteller','Aggregat Hersteller'],['aggregatTyp','Aggregat Typ'],['motortyp','Motor Typ'],
    ['aggregatNr','Aggregat Nr.'],['nennstrom','Nennstrom (A)'],['motorleistung','Motorleistung (kW)'],
    ['nennlast','Druck Nennlast (bar)'],['leerlast','Druck Leerlast (bar)'],
    ['nennlastAuf','Nennlast Auf (bar)'],['leerlastAb','Leerlast Ab (bar)'],
    ['druckbegrenzung','Druckbegrenzung (bar)'],['druckbegrenzungHandpumpe','Druckbegrenzung Handpumpe (bar)'],
  ];

  // B9 speed fields
  const b9SpeedFields: [keyof HydroB9Data, string][] = [
    ['sollAuf','Soll-Geschw. aufwärts (m/s)'],['sollAb','Soll-Geschw. abwärts (m/s)'],
    ['istLeerAuf','IST Leer aufwärts (m/s)'],['istNennlastAb','IST Nennlast abwärts (m/s)'],
    ['istLeerAufKorr','IST Leer aufwärts bei Korrektur (m/s)'],['istNennlastAbKorr','IST Nennlast abwärts bei Korrektur (m/s)'],
    ['zurueckAuf','Zurück aufwärts (m/s)'],['zurueckAb','Zurück abwärts (m/s)'],
    ['pufferGeschwindigkeit','Puffergeschwindigkeit (m/s)'],['nenngeschwindigkeit','Nenngeschwindigkeit (m/s)'],
  ];
  const b9ElecFields: [keyof HydroB9Data, string][] = [
    ['stromLeer','Strom Leer (A)'],['stromNennlast','Strom Nennlast (A)'],
    ['netzspannung','Netzspannung (V)'],['steuerspannung','Steuerspannung (V)'],
  ];

  const b13Fields: [keyof HydroB13Data, string][] = [
    ['firma','Firma'],['nameAbnahme','Name Abnahmetechniker'],['datum','Datum'],
  ];

  // Maps B7 text field paths to human-readable labels
  const TEXT_LABELS: Record<string, string> = {
    // B2
    '2.1.1': 'Nennstrom der Anlagesicherung (A)',
    'B2_Einsatzbereich': 'Einsatzbereich (A)',
    'B2_Anlagenennstrom': 'Anlagenennstrom (A)',
    // B3
    'B3_Notendschalter': 'Notendschalter Abstand (mm)',
    'B3_installierte_Puffer': 'Anzahl installierte Puffer',
    'B3_Fabrikationstyp': 'Fabrikationstyp',
    'B3_Anzahl_Puffer2': 'Anzahl installierte Puffer',
    'B3_Fabrikationstyp_2': 'Fabrikationstyp',
    'B3_Fuhrung_Kabine': 'Führung Kabine',
    'B3_Fuhrung_Ausgleich': 'Führung Ausgleichsgewicht',
    'B3_Fuhrung_Hilfs': 'Führung Hilfsführung',
    'B3_Fuhrung_Heber': 'Führung Heber',
    // B4
    'B4_Feuerwiderstandsklasse': 'Feuerwiderstandsklasse',
    'B4_Fabrikationstyp': 'Fabrikationstyp',
    'B4_Fabrikationstyp_1': 'Fabrikationstyp',
    // B6
    'B6_Fabrikationstyp': 'Fabrikationstyp',
    'B6_SerienNr': 'Serien-Nr.',
    // B7
    'B7_Typ_Bremsfang': 'Bremsfangvorrichtung Typ',
    'B7_SerienNr_1': 'Serien-Nr. (Bremsfang)',
    'B7_Typ_Sperrfang': 'Sperrfangvorrichtung (mit Dämpfung) Typ',
    'B7_SerienNr_2': 'Serien-Nr. (Sperrfang)',
    'B7_Typ_Sperrfang63': 'Sperrfangvorrichtung (vd max 0.63 m/s) Typ',
    'B7_SerienNr_3': 'Serien-Nr. (Sperrfang 0.63)',
    'B7_Typ': 'Typ (Geschwindigkeitsbegrenzer)',
    'B7_SerienNr': 'Serien-Nr. (Begrenzer)',
    'B7_Auslosegeschwindigkeit': 'Auslösegeschwindigkeit',
    'B7_Nenndurchmesser': 'Nenndurchmesser (Begrenzer-Seil)',
    'B7_Typ_Bremsfang_AG': 'Bremsfangvorrichtung Typ (AG)',
    'B7_SerienNr_1_AG': 'Serien-Nr. (Bremsfang AG)',
    'B7_Typ_Sperrfang_AG': 'Sperrfangvorrichtung (mit Dämpfung) Typ (AG)',
    'B7_SerienNr_2_AG': 'Serien-Nr. (Sperrfang AG)',
    'B7_Typ_Sperrfang63_AG': 'Sperrfangvorrichtung (vd max 0.63 m/s) Typ (AG)',
    'B7_SerienNr_3_AG': 'Serien-Nr. (Sperrfang 0.63 AG)',
    'B7_Typ_Ausgleich': 'Typ (Ausgleich-Begrenzer)',
    'B7_SerienNr_Ausgleich': 'Serien-Nr. (Ausgleich)',
    'B7_Auslosegeschwindigkeit_AG': 'Auslösegeschwindigkeit (AG)',
    'B7_Nenndurchmesser_1': 'Nenndurchmesser (Ausgleich-Seil)',
    'B7_RohrbruchTyp': 'Rohrbruchventil Typ',
    'B7_Drossel_Typ': 'Drosselventil Typ',
    'B7_Nenndurchmesser_2': 'Nenndurchmesser (Begrenzer-Seil)',
    // B8
    'B8_HeberTyp': 'Heber Typ',
    'B8_Hersteller_1': 'Herstellerangaben DN (1)',
    'B8_Hersteller_2': 'Herstellerangaben DN (2)',
    'B8_Hersteller_3': 'Herstellerangaben DN (3)',
    'B8_Hersteller_4': 'Herstellerangaben DN (4)',
    'B8_Hersteller_5': 'Herstellerangaben DN (5)',
    'B8_Hersteller_6': 'Herstellerangaben DN (6)',
    'B8_Hersteller_7': 'Herstellerangaben DN (7)',
    'B8_Hersteller_8': 'Herstellerangaben DN (8)',
    'B8_Hersteller_9': 'Herstellerangaben DN (9)',
    // B13
    'B13_Bauseitige_Pendenzen': 'Bauseitige Pendenzen',
    'B13_Aufzugsseitige_Pendenzen': 'Aufzugsseitige Pendenzen',
    'B13_Unterschrift': 'Unterschrift (Name)',
  };

  // "nz" checkbox paths and their linked text field
  const NZ_CHECKBOX_TO_FIELD: Record<string, string> = {
    'B3_nz_Fuh_1': 'B3_Fuhrung_Kabine',
    'B3_nz_Fuh_2': 'B3_Fuhrung_Ausgleich',
    'B3_nz_Fuh_3': 'B3_Fuhrung_Hilfs',
    'B3_nz_362_1': '3.6.2_A',
    'B3_nz_362_2': '3.6.2_B',
    'B3_nz_362_3': '3.6.2_C',
  };
  // Set of checkbox paths
  const CHECKBOX_PATHS_LOCAL = new Set(Object.keys(NZ_CHECKBOX_TO_FIELD));

  // B7 section activity based on b7 component toggles
  const b7SectionActive = (path: string): boolean => {
    if (!b7) return true;
    const p71 = ['7.1.1','B7_Typ_Bremsfang','B7_SerienNr_1','B7_Typ_Sperrfang','B7_SerienNr_2','B7_Typ_Sperrfang63','B7_SerienNr_3','7.1.2','7.1.3','7.1.4','7.1.5','7.1.6','7.1.7','7.1.8','7.1.9'];
    const p73 = ['7.3.1','B7_Typ_Bremsfang_AG','B7_SerienNr_1_AG','B7_Typ_Sperrfang_AG','B7_SerienNr_2_AG','B7_Typ_Sperrfang63_AG','B7_SerienNr_3_AG','7.3.2','7.3.3','7.3.4','7.3.5'];
    const p72 = ['7.2.1','B7_Typ','B7_SerienNr','B7_Auslosegeschwindigkeit','7.2.2','7.2.3','7.2.4','7.2.5','7.2.6','7.2.7','B7_Nenndurchmesser'];
    const p74 = ['7.4.1','B7_Typ_Ausgleich','B7_SerienNr_Ausgleich','B7_Auslosegeschwindigkeit_AG','7.4.2','7.4.3','7.4.4','7.4.5','7.4.6','B7_Nenndurchmesser_1','7.4.7'];
    const p75 = ['7.5.1','B7_RohrbruchTyp','7.5.2','7.5.3','7.5.4'];
    const p76 = ['7.6.1','B7_Drossel_Typ','7.6.2','7.6.3'];
    if (p71.includes(path)) return b7.fang;
    if (p73.includes(path)) return b7.ausgleich;
    if (p72.includes(path)) return b7.begrenzer;
    if (p74.includes(path)) return b7.ausgleich && b7.begrenzer;
    if (p75.includes(path)) return b7.rohrbruch;
    if (p76.includes(path)) return b7.drossel;
    return true;
  };

  // Grouped question list renderer:
  // - Consecutive TEXT_INPUT_PATHS (non-textarea) → compact 3-col grid (like B9 card)
  // - TEXTAREA_PATHS → full-width individual
  // - CHECKBOX_PATHS_LOCAL → individual checkbox row
  // - Marker paths (__KOPF_CARD__, __GRUBE_CARD__) → measurement cards
  // - Regular question paths → pill rows with divider tracking via lastQuestionGroupTitle
  const renderQuestionList = () => {
    const elements: React.ReactNode[] = [];
    const paths = chapter.paths;
    let i = 0;
    let lastQuestionGroupTitle = ''; // tracks last REAL question's group title (ignores text fields)

    while (i < paths.length) {
      const path = paths[i];

      // ── Measurement card markers — shown in dedicated tab, skip here
      if (path.startsWith('__')) { i++; continue; }

      // ── Auto-filled paths — skip rendering (managed by useEffect)
      if (AUTO_FILLED_PATHS.has(path)) { i++; continue; }

      // ── Checkbox paths (n.z. toggle) — with linked text field below ──
      if (CHECKBOX_PATHS_LOCAL.has(path)) {
        const isChecked = (answers[path] ?? '') === 'true';
        const linkedField = NZ_CHECKBOX_TO_FIELD[path];
        const nextIsLinked = i + 1 < paths.length && paths[i + 1] === linkedField;
        const fieldLabel = TEXT_LABELS[linkedField] ?? linkedField;
        elements.push(
          <div key={path} className="border-b dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20">
              <Checkbox id={path} checked={isChecked} onCheckedChange={v => setAnswer(path, v ? 'true' : 'false')} />
              <Label htmlFor={path} className="cursor-pointer text-sm font-semibold text-amber-700 dark:text-amber-300 flex-1">
                n.z. – {fieldLabel}
              </Label>
              {isChecked && <span className="text-xs italic text-amber-500 dark:text-amber-400">nicht zutreffend</span>}
            </div>
            {nextIsLinked && (
              <div className={`px-6 py-2.5 bg-white dark:bg-gray-900 transition-opacity ${isChecked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{fieldLabel}</Label>
                <Input value={answers[linkedField] ?? ''} onChange={e => setAnswer(linkedField, e.target.value)}
                  placeholder={fieldLabel}
                  className="text-sm h-9 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-blue-400 max-w-xs" />
              </div>
            )}
          </div>
        );
        i++;
        if (nextIsLinked) i++;
        continue;
      }

      // ── Textarea paths — full-width individual
      if (TEXTAREA_PATHS.has(path)) {
        const label = TEXT_LABELS[path] ?? path;
        elements.push(
          <div key={path} className="px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">{label}</Label>
            <Textarea value={answers[path] ?? ''} onChange={e => setAnswer(path, e.target.value)}
              placeholder={label} rows={3}
              className="text-sm border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-blue-400 resize-y" />
          </div>
        );
        i++; continue;
      }

      // ── TEXT_INPUT_PATHS: group consecutive, render right-aligned row ──
      if (TEXT_INPUT_PATHS.has(path)) {
        const group: string[] = [];
        while (
          i < paths.length &&
          TEXT_INPUT_PATHS.has(paths[i]) &&
          !TEXTAREA_PATHS.has(paths[i]) &&
          !CHECKBOX_PATHS_LOCAL.has(paths[i]) &&
          !paths[i].startsWith('__')
        ) {
          // Skip if this field is handled inline by a checkbox above it
          const isHandledByCheckbox = Object.values(NZ_CHECKBOX_TO_FIELD).includes(paths[i]) &&
            i > 0 && CHECKBOX_PATHS_LOCAL.has(paths[i - 1]);
          if (isHandledByCheckbox) { i++; continue; }
          group.push(paths[i]);
          i++;
        }
        if (group.length === 0) continue;
        elements.push(
          <div key={group.join('|')} className="px-4 py-3 border-b dark:border-gray-700 bg-slate-50/40 dark:bg-slate-800/20">
            <div className="flex flex-wrap justify-end gap-4">
              {group.map(p => {
                const label = TEXT_LABELS[p] ?? p;
                const linkedNz = Object.entries(NZ_CHECKBOX_TO_FIELD).find(([, f]) => f === p)?.[0];
                const disabled = linkedNz ? answers[linkedNz] === 'true' : false;
                return (
                  <div key={p} className={`flex items-center gap-3 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{label}</Label>
                    <Input value={answers[p] ?? ''} onChange={e => setAnswer(p, e.target.value)}
                      placeholder="—"
                      className="text-base font-semibold h-10 w-40 border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400 text-right" />
                  </div>
                );
              })}
            </div>
          </div>
        );
        continue;
      }

      // ── Standard yes/no pill row
      const rowOptions    = chapter.specialOptions?.[path] ?? options;
      const current       = answers[path] ?? '';
      const questionText  = questionMap[path] ?? '';
      const groupTitle    = groupTitleMap[path] ?? '';
      // Only show group divider when the title changes relative to the last REAL question (not text fields)
      const showDivider   = !!groupTitle && groupTitle !== lastQuestionGroupTitle;
      if (groupTitle) lastQuestionGroupTitle = groupTitle;

      const active           = chapter.id === 7 ? b7SectionActive(path) : true;
      const rowBg            = current && active ? ROW_BG[current] : '';
      const effectiveOptions = NO_NZ_PATHS.has(path) ? rowOptions.filter(o => o !== 'nz') : rowOptions;

      elements.push(
        <Fragment key={path}>
          {showDivider && (
            <div className="px-4 pt-3 pb-1.5 bg-gray-50 dark:bg-gray-800/60 border-b border-t border-blue-100 dark:border-blue-900/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{groupTitle}</span>
            </div>
          )}
          <div className={`relative border-b dark:border-gray-700 last:border-b-0 transition-all duration-300 ${
            !active ? 'opacity-40 bg-gray-50 dark:bg-gray-800/50' :
            rowBg || (modern
              ? 'bg-white dark:bg-gray-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50')
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs text-blue-500 dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 mt-0.5">
                  {path}
                </span>
                <Label className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 flex-1 leading-snug cursor-default">
                  {questionText || path}
                </Label>
              </div>
              {active && (
                <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                  {effectiveOptions.filter(o => o !== 'U').map(opt => {
                    const isSelected = current === opt;
                    return (
                      <button key={opt} type="button" onClick={() => setAnswer(path, opt)}
                        className={`group relative inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap ${
                          isSelected ? PILL_ACTIVE[opt] : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 ${PILL_HOVER[opt]}`
                        }`}
                      >{opt}</button>
                    );
                  })}
                  {effectiveOptions.includes('U') && (
                    <>
                      <span className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center" />
                      <button type="button" onClick={() => toggleUmbau(path)}
                        className={`group relative inline-flex items-center justify-center rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap ${
                          umbau[path]
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600'
                        }`}
                        title="Umbau – átépítés során érintett"
                      >U</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Fragment>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* ── B1 Anlagedaten ── */}
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
                  <Label className="text-sm mb-1.5 block font-medium text-blue-700 dark:text-blue-300">{label}</Label>
                  <Input value={b1Data[key]} onChange={e => setB1(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
            {/* Zusätzliche Anforderungen – conditional on answers['1'] === 'Ja' */}
            {answers['1'] === 'Ja' && (
              <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                <Label className="text-sm mb-1.5 block font-medium text-blue-700 dark:text-blue-300">
                  {t('b1ZusatzLabel', lang)}
                </Label>
                <Textarea
                  value={answers['B1_Anforderungen'] ?? ''}
                  onChange={e => setAnswer('B1_Anforderungen', e.target.value)}
                  placeholder={t('b1ZusatzLabel', lang)}
                  rows={3}
                  className="text-sm border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-400 resize-y"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── B6 Special card (Tragmittel toggle) ── */}
      {chapter.id === 6 && b6Data && setB6 && (
        <B6SpecialCard
          b6={b6Data} setB6={setB6}
          answers={answers} setAnswer={setAnswer}
          modern={modern} lang={lang} questionMap={questionMap}
        />
      )}

      {/* ── B7 Hydraulische und Brems-Komponenten ── */}
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              A nem kiválasztott blokkok a kérdőívben inaktívak (halványítva).
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── B8 Hydraulikaggregat ── */}
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
                  <Label className="text-sm mb-1.5 block font-medium text-purple-700 dark:text-purple-300">{label}</Label>
                  <Input value={b8Data[key]} onChange={e => setB8(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B9 Geschwindigkeiten ── */}
      {chapter.id === 9 && b9Data && setB9 && (
        <>
          <Card className={modern ? 'shadow-xl border-2 border-teal-100 dark:border-teal-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
            <CardHeader className={gradHdr('bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-400')}>
              {pulseCls('bg-gradient-to-r from-cyan-400 to-teal-500')}
              <CardTitle className="relative text-lg font-bold">{t('b9SpeedTitle', lang)}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {b9SpeedFields.map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-sm mb-1.5 block font-medium text-teal-700 dark:text-teal-300">{label}</Label>
                    <Input value={b9Data[key]} onChange={e => setB9(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                      className="text-sm border-teal-200 dark:border-teal-800 focus:ring-2 focus:ring-teal-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={modern ? 'shadow-xl border-2 border-cyan-100 dark:border-cyan-900/50 overflow-hidden' : 'shadow-lg overflow-hidden'}>
            <CardHeader className={gradHdr('bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-400')}>
              {pulseCls('bg-gradient-to-r from-sky-400 to-cyan-500')}
              <CardTitle className="relative text-lg font-bold">{t('b9ElecTitle', lang)}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {b9ElecFields.map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-sm mb-1.5 block font-medium text-cyan-700 dark:text-cyan-300">{label}</Label>
                    <Input value={b9Data[key]} onChange={e => setB9(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                      className="text-sm border-cyan-200 dark:border-cyan-800 focus:ring-2 focus:ring-cyan-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── B13 Konformitätserklärung ── */}
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
                  <Label className="text-sm mb-1.5 block font-medium text-green-700 dark:text-green-300">{label}</Label>
                  <Input type={key === 'datum' ? 'date' : 'text'} value={b13Data[key]}
                    onChange={e => setB13(p => ({ ...p, [key]: e.target.value }))} placeholder={label}
                    className="text-sm border-green-200 dark:border-green-800 focus:ring-2 focus:ring-green-400" />
                </div>
              ))}
              {/* Unterschrift */}
              <div className="sm:col-span-2">
                <Label className="text-sm mb-1.5 block font-medium text-green-700 dark:text-green-300">Unterschrift (Name Abnahmetechniker)</Label>
                <Input value={answers['B13_Unterschrift'] ?? ''} onChange={e => setAnswer('B13_Unterschrift', e.target.value)}
                  placeholder="Name..." className="text-sm border-green-200 dark:border-green-800 focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── B3 Tab bar (Schachtkopf | Fragen) ── */}
      {chapter.id === 3 && (
        <div className="flex rounded-2xl overflow-hidden border-2 border-cyan-200 dark:border-cyan-800 shadow-lg">
          <button
            onClick={() => setB3ActiveTab('kopf')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-200 ${
              b3ActiveTab === 'kopf'
                ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 text-white shadow-inner'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
            }`}
          >
            <span className="text-base">📐</span>
            <span>
              {{ hu:'Schachtkopf / Akna', de:'Schachtkopf / Grube', en:'Shaft Head / Pit', fr:'Tête / Fosse', it:'Testa / Fossa' }[lang]}
            </span>
            {b3ActiveTab === 'kopf' && <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />}
          </button>
          <div className="w-px bg-cyan-200 dark:bg-cyan-800" />
          <button
            onClick={() => setB3ActiveTab('fragen')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-200 ${
              b3ActiveTab === 'fragen'
                ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white shadow-inner'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            <span className="text-base">📋</span>
            <span>
              {{ hu:'B3 Kérdések', de:'B3 Fragen', en:'B3 Questions', fr:'Questions B3', it:'Domande B3' }[lang]}
            </span>
            {b3ActiveTab === 'fragen' && (
              <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {chapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p) && answers[p]).length}
                /{chapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p)).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── B3 Schachtkopf + Grube Cards (dedicated tab) ── */}
      {chapter.id === 3 && b3ActiveTab === 'kopf' && (
        <div className="space-y-4">
          {b3kopf && setB3kopf && <B3KopfCard b3kopf={b3kopf} setB3kopf={setB3kopf} modern={modern} lang={lang} />}
          {b3grube && setB3grube && <B3GrubeCard b3grube={b3grube} setB3grube={setB3grube} modern={modern} lang={lang} />}
        </div>
      )}

      {/* ── Questions card ── */}
      {(chapter.id !== 3 || b3ActiveTab === 'fragen') && (
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
                  {chapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p) && answers[p]).length}
                  {' / '}
                  {chapter.paths.filter(p => !p.startsWith('__') && !TEXT_INPUT_PATHS.has(p) && !TEXTAREA_PATHS.has(p) && !AUTO_FILLED_PATHS.has(p)).length}
                  {' '}{t('completed', lang)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {renderQuestionList()}
          </CardContent>
        </Card>
      )}
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

  function GradCard({ borderColor, children }: { borderColor: string; children: React.ReactNode }) {
    return (
      <Card className={modern ? `shadow-xl border-2 ${borderColor} overflow-hidden hover:shadow-2xl transition-shadow duration-300` : 'shadow-lg overflow-hidden'}>
        {children}
      </Card>
    );
  }

  function GradHeader({ gradient, pulse, children }: { gradient: string; pulse: string; children: React.ReactNode }) {
    return (
      <CardHeader className={modern ? `relative overflow-hidden ${gradient} text-white p-6` : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5'}>
        {modern && <div className={`absolute inset-0 ${pulse} opacity-30 animate-pulse pointer-events-none`} />}
        <div className="relative">{children}</div>
      </CardHeader>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <GradCard borderColor="border-blue-200 dark:border-blue-800">
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

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{t('furtherProto', lang)}</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      <GradCard borderColor="border-green-200 dark:border-green-800">
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

      <GradCard borderColor="border-purple-200 dark:border-purple-800">
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

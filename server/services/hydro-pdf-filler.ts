// server/services/hydro-pdf-filler.ts
// HYDRO AcroForm PDF kitöltő service - pdf-lib alapú
// Konvenció: B{chapter}_{option}_{questionPath}
// Pl: B3_Ja_3.1.1 / B3_Nein_3.1.1 / B3_nz_3.1.1 / B3_U_3.1.1

import { PDFDocument, PDFName } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// ============================================================
// TÍPUSDEFINÍCIÓK
// ============================================================

export interface HydroFormData {
  // === FEJLÉC (B0) ===
  installationType?: 'Neuanlage' | 'Umbau';                // Neuanlage = új, Umbau = átalakítás
  certType?: 'Baumusterprüfung' | 'Entwurfsprüfung';       // Tanúsítvány típusa
  machineRoomless?: boolean;                                // MRL (gépterem nélküli)
  adresse?: string;                                        // Montagebetrieb cím
  aufzugstyp?: string;                                     // Lift típusa
  fabrikationsNr?: string;                                  // Gyári/megrendelő szám
  standortadresse?: string;                                 // Helyszín cím

  // === B1 ANLAGEDATEN ===
  b1_hubhoehe?: string;                                    // Emelési magasság (m)
  b1_stockwerke?: string;                                  // Szintek száma
  b1_zugaenge?: string;                                    // Bejáratok száma
  b1_nennlast?: string;                                    // Névleges teher (kg)
  b1_personen?: string;                                    // Személyek száma
  b1_anforderungen?: string;                               // Speciális követelmények leírása
  b1_entwurfspruefung?: string[];                          // Tervezési vizsgálatok (max 7)
  b1_aufzugsbuch?: string[];                               // Liftskönyv mellékletek (max 7)

  // === B3 MÉRÉSI TÁBLÁZATOK ===
  b3_A1?: string; b3_A2?: string; b3_A3?: string;          // Schachtkopf Mass A
  b3_B1?: string; b3_B2?: string; b3_B3?: string;          // Mass B
  b3_C1?: string; b3_C2?: string; b3_C3?: string;          // Mass C
  b3_D1?: string; b3_D2?: string; b3_D3?: string;          // Mass D
  b3_E1?: string;                b3_E3?: string;           // Mass E
  b3_F1?: string; b3_F2?: string; b3_F3?: string;          // Schachtgrube Mass F
  b3_G1?: string; b3_G2?: string; b3_G3?: string;          // Mass G
  b3_H1?: string; b3_H2?: string; b3_H3?: string;          // Mass H
  b3_J1?: string; b3_J2?: string; b3_J3?: string;          // Mass J
  b3_OberesUeberfahrt?: string;                            // Obere Überfahrt (mm)
  b3_FuhrungKabine?: string;                               // Führungsschiene Kabine
  b3_FuhrungAusgleich?: string;                            // Führungsschiene Ausgleich
  b3_FuhrungHilfs?: string;                                // Hilfsführungsschiene
  b3_FuhrungHeber?: string;                                // Heberführung
  b3_Fabrikationstyp?: string;                             // Puffer Fabrikationstyp
  b3_Fabrikationstyp2?: string;                            // Ausgleichsgewichtspuffer Fabrikationstyp
  b3_AnzahlPuffer?: string;                                // Puffer darab

  // === B4 SCHACHTTÜREN ===
  b4_feuerwiderstand?: string;                             // Tűzállóság osztály
  b4_fabrikationstyp?: string;                             // Ajtó fabrikationstyp
  b4_fabrikationstyp2?: string;                            // Zárak fabrikationstyp

  // === B6 AUFHÄNGUNG ===
  b6_anzahl?: string;                                      // Kötél/lánc darabszám
  b6_nenndurchmesser?: string;                             // Névleges átmérő (mm)
  b6_dimension?: string;                                   // Lánc méret (mm)
  b6_anzahl2?: string;                                     // Lánc darabszám
  b6_fabrikationstyp?: string;                             // UCM Fabrikationstyp
  b6_serienNr?: string;                                    // UCM Sorozatszám

  // === B7 FANGVORRICHTUNGEN / HYDRAULIK ===
  b7_typ?: string;                                         // Fangvorr. Typ
  b7_serienNr?: string;                                    // Fangvorr. SerienNr
  b7_typBremsfang?: string;
  b7_typSperrfang?: string;
  b7_typSperrfang63?: string;
  b7_serienNr1?: string;
  b7_serienNr2?: string;
  b7_serienNrAusgleich?: string;
  b7_typAusgleich?: string;
  b7_ausloesegeschw?: string;                              // Auslösegeschwindigkeit (m/s)
  b7_nenndurchmesser?: string;                             // Begrenzerseil átmérő
  b7_nenndurchmesser1?: string;
  b7_nenndurchmesser2?: string;
  b7_rohrbruchTyp?: string;                                // Rohrbruchventil Typ
  b7_drosselTyp?: string;                                  // Drosselventil Typ
  // Hydraulikus komponens checkboxok (B7) — az XML-ből azonosítva
  b7_fang?: boolean;                                       // Fangvorrichtung checkbox
  b7_ausgleich?: boolean;                                  // Ausgleichsgewicht checkbox
  b7_begrenzer?: boolean;                                  // Geschwindigkeitsbegrenzer checkbox
  b7_rohrbruch?: boolean;                                  // Rohrbruchventil checkbox
  b7_drossel?: boolean;                                    // Drosselventil checkbox

  // === B8 HYDRAULIKANLAGE ===
  b8_hersteller?: string;                                  // Aggregat Hersteller
  b8_aggregatTyp?: string;                                 // Aggregat Typ
  b8_motortyp?: string;                                    // Motor Typ
  b8_aggregatNr?: string;                                  // Aggregat Nr.
  b8_nennstrom?: string;                                   // Nennstrom (A)
  b8_motorleistung?: string;                               // Motorleistung (kW)
  b8_heberTyp?: string;                                    // Heber Typ
  b8_nennlast?: string;                                    // Druck Nennlast (bar)
  b8_leerlast?: string;                                    // Druck Leerlast (bar)
  b8_nennlastAuf?: string;                                 // Nennlast Auf (bar)
  b8_leerlastAb?: string;                                  // Leerlast Ab (bar)
  b8_druckbegrenzung?: string;                             // Druckbegrenzung (bar)
  b8_druckbegrenzungHand?: string;                         // Handpumpe Druckbegr.
  b8_herstellerMulti?: string[];                           // Leitungen Hersteller (max 9)

  // === B9 ELEKTRISCHES SYSTEM ===
  b9_sollAuf?: string;                                     // Soll-Geschwindigkeit Auf (m/s)
  b9_sollAb?: string;                                      // Soll-Geschwindigkeit Ab (m/s)
  b9_istLeerAuf?: string;                                  // IST-Geschw. leer aufwärts
  b9_istNennlastAb?: string;                               // IST-Geschw. Nennlast abwärts
  b9_istLeerAuf_korrektur?: string;
  b9_istNennlastAb_korrektur?: string;
  b9_istLeerAuf_inspektions?: string;
  b9_istNennlastAb_inspektions?: string;
  b9_istLeerAuf_rampenfahrt?: string;
  b9_istNennlastAb_rampenfahrt?: string;
  b9_stromLeer?: string;                                   // Strom Leer (A)
  b9_stromNennlast?: string;                               // Strom Nennlast (A)
  b9_netzspannung?: string;                                // Netzspannung (V)
  b9_netzspannungNennlast?: string;                        // Netzspannung bei Nennlast (V)
  b9_sicherheitskreis?: string;                            // Sicherheitskreis (V)
  b9_steuerspannung?: string;                              // Steuerspannung (V)

  // === B13 KONFORMITÄTSERKLÄRUNG ===
  b13_bauseitigePendenzen?: string;                        // Bauseitige Pendenzen
  b13_aufzugsseitigePendenzen?: string;                    // Aufzugsseitige Pendenzen
  b13_firma?: string;                                      // Firma
  b13_nameAbnahme?: string;                                // Name Abnahmetechniker
  b13_datum?: string;                                      // Datum

  // === B14 NACHKONTROLLE ===
  b14_firma?: string;
  b14_nameAbnahme?: string;
  b14_datum?: string;

  // === KÉRDÉSEK (groupKey → válasz) ===
  // A groupKey az OTIS rendszerbeli kérdésazonosító
  // Formátum: pl. "2.1.1", "3.4.5", "11.3.7"
  // Értékek: "Ja" | "Nein" | "nz" | szabad szöveg
  questionAnswers?: Record<string, string>;
}

// ============================================================
// A TELJES FIELD MAP (1015 mező a PDF-ből)
// Checkbox ON értéke mindig "Yes"
// ============================================================
const FIELD_MAP: Record<string, 'checkbox' | 'text'> = {
  // B0
  "B0_Neuanlage": "checkbox", "B0_Umbau": "checkbox",
  "B0_Baumusterprüfung": "checkbox", "B0_:Entwurfsprüfung": "checkbox",
  "B0_Maschinenraum": "checkbox",
  "B0_Adresse": "text", "B0_Aufzugstyp": "text",
  "B0_Fabrikations": "text", "B0_Standortadresse": "text",
  // B1
  "B1_Hubhöhe": "text", "B1_Nennlast": "text", "B1_Personen": "text",
  "B1_Stockwerke": "text", "B1_Zugange": "text", "B1_Anforderungen": "text",
  "B1_Ja_1": "checkbox", "B1_keine_1": "checkbox", "B1_nz_1": "checkbox",
  // B3 Mérési táblázat
  "B3_A1": "text", "B3_A2": "text", "B3_A3": "text",
  "B3_B1": "text", "B3_B2": "text", "B3_B3": "text",
  "B3_C1": "text", "B3_C2": "text", "B3_C3": "text",
  "B3_D1": "text", "B3_D2": "text", "B3_D3": "text",
  "B3_E1": "text", "B3_E3": "text",
  "B3_F1": "text", "B3_F2": "text", "B3_F3": "text",
  "B3_G1": "text", "B3_G2": "text", "B3_G3": "text",
  "B3_H1": "text", "B3_H2": "text", "B3_H3": "text",
  "B3_J1": "text", "B3_J2": "text", "B3_J3": "text",
  "B3_Fuhrung_Kabine": "text", "B3_Fuhrung_Ausgleich": "text",
  "B3_Fuhrung_Hilfsführung": "text", "B3_Fuhrung_Heber": "text",
  "B3_Fabrikationstyp": "text", "B3_Fabrikationstyp_2": "text",
  "B3_Anzahl_installierte_Puffer": "text",
  // B4
  "B4_Feuerwiderstandsklasse": "text",
  "B4_Fabrikationstyp": "text", "B4_Fabrikationstyp_1": "text",
  // B6
  "B6_Anzahl": "text", "B6_ Nenndurchmesser": "text",
  "B6_Anzahl_2": "text", "B6_Dimension": "text",
  "B6_Fabrikationstyp": "text", "B6_SerienNr": "text",
  // B7
  "B7_Typ": "text", "B7_SerienNr": "text",
  "B7_Typ_Bremsfang": "text", "B7_Typ_Sperrfang": "text", "B7_Typ_Sperrfang63": "text",
  "B7_SerienNr_1": "text", "B7_SerienNr_2": "text", "B7_SerienNr_Ausgleich": "text",
  "B7_Typ_Ausgleich": "text", "B7_Typ_Sperrfang_63": "text",
  "B7_Auslosegeschwindigkeit": "text",
  "B7_Nenndurchmesser": "text", "B7_Nenndurchmesser_1": "text", "B7_Nenndurchmesser_2": "text",
  "B7_RohrbruchTyp": "text", "B7_Drossel_Typ": "text",
  // B8
  "B8_Hersteller": "text", "B8_AggregatTyp": "text",
  "B8_Motortyp": "text", "B8_AggregatNr": "text",
  "B8_Nennstrom": "text", "B8_Motorleistung": "text",
  "B8_HeberTyp": "text",
  "B8_Nennlast": "text", "B8_Leerlast": "text",
  "B8_Nennlast_Auf": "text", "B8_Leerlast_Ab": "text",
  "B8_Druckbegrenzung": "text", "B8_Druckbegrenzung_Hand": "text",
  // B9
  "B9_Soll_Auf": "text", "B9_Soll_Ab": "text",
  "B9_Ist_leerer_aufwärts": "text", "B9_Ist_Nennlast_abwärts": "text",
  "B9_Ist_leerer_aufwärts_korrektur": "text", "B9_Ist_Nennlast_abwärts_korrektur": "text",
  "B9_Ist_leerer_aufwärts_Inspektions": "text", "B9_Ist_Nennlast_abwärts_Inspektions": "text",
  "B9_Ist_leerer_aufwärts_Rampenfahrt": "text", "B9_Ist_Nennlast_abwärts_Rampenfahrt": "text",
  "B9_Strom_Leer": "text", "B9_Strom_Nennlast": "text",
  "B9_Netzspannung": "text", "B9_Netzspannung_Nennlast": "text",
  "B9_Sicherheitskreis": "text", "B9_Steuerspannung": "text",
  // B13
  "B13_Bauseitige_Pendenzen": "text", "B13_Aufzugsseitige_Pendenzen": "text",
  "B13_Firma": "text", "B13_Name_Abnahmetechniker": "text", "B13_Datum": "text",
  "B13_Nein_13.1": "text", "B13_Nein_13.2": "text",
  "B13_Nein_13.3": "text", "B13_Nein_13.4": "text",
  // B14
  "B14_Firma": "text", "B14_Name_Abnahmetechniker": "text", "B14_Datum": "text",
  "B14_Nein_14.1.1": "text", "B14_Nein_14.1.2": "text",
  "B14_Nein_14.2.1": "text", "B14_Nein_14.2.2": "text",
};

// ============================================================
// CHAPTER DETECTION: groupKey-ből chapter meghatározás
// pl. "2.1.1" → 2,  "3.4.5" → 3,  "11.3.7" → 11
// B12 SPEC. ESET: a PDF B12 fejezet kérdései "16.x" jelöléssel
// szerepelnek (EN norma referencia) → "16.2" path = chapter 12
// ============================================================
function getChapterFromPath(questionPath: string): number | null {
  // B6 speciális: A.6.x / B.6.x / C.6.x → fejezet 6 (TXT-ből azonosítva)
  if (/^[A-C]\.6\./i.test(questionPath)) return 6;
  const match = questionPath.match(/^(\d+)[.\-_]/);
  if (!match) return null;
  const pathNum = parseInt(match[1], 10);
  // B12 speciális: EN norma 16.x → fejezet 12
  if (pathNum === 16) return 12;
  return pathNum;
}

// ============================================================
// FIELD NAME GENERÁLÁS: chapter + answer + questionPath alapján
// Spec. eset: B12 kérdéseknél a path 16.x-es!
// ============================================================
function buildCheckboxFieldName(chapter: number, option: string, questionPath: string): string {
  return `B${chapter}_${option}_${questionPath}`;
}

// ============================================================
// SAFE FIELD SETTER (nem dob hibát, csak logol)
// ============================================================
function setCheckbox(form: any, fieldName: string, value: boolean, font?: any): void {
  // 1. próba: TextField (mint a Grounding PDF-ben — egyszerű "X" szöveg)
  try {
    const field = form.getTextField(fieldName);
    field.setText(value ? 'X' : '');
    if (font) field.updateAppearances(font);
    return;
  } catch { /* nem TextField, próbáljuk checkbox-ként */ }

  // 2. próba: valódi AcroForm CheckBox — field.check() az eredeti megjelenéssel
  try {
    const field = form.getCheckBox(fieldName);
    if (value) field.check();
    else field.uncheck();
  } catch {
    // mező nem létezik — csendben továbblépünk
  }
}

function setTextField(form: any, fieldName: string, value: string): void {
  if (!value) return;
  try {
    const field = form.getTextField(fieldName);
    field.setText(String(value));
  } catch {
    // mező nem létezik — csendben továbblépünk
  }
}

// ============================================================
// FŐ KITÖLTŐ FÜGGVÉNY
// ============================================================
export class HydroPdfFiller {

  static async generateFilledPdf(data: HydroFormData): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), 'public/templates/ABNAHME_HYDRO.pdf');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`HYDRO PDF template not found at: ${templatePath}`);
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pdfDoc.registerFontkit(fontkit);

    const form = pdfDoc.getForm();

    // ----------------------------------------------------------
    // 1. FEJLÉC - B0 mezők
    // ----------------------------------------------------------
    if (data.installationType === 'Neuanlage') setCheckbox(form, 'B0_Neuanlage', true);
    if (data.installationType === 'Umbau') setCheckbox(form, 'B0_Umbau', true);
    if (data.certType === 'Baumusterprüfung') setCheckbox(form, 'B0_Baumusterprüfung', true);
    if (data.certType === 'Entwurfsprüfung') setCheckbox(form, 'B0_:Entwurfsprüfung', true);
    if (data.machineRoomless) setCheckbox(form, 'B0_Maschinenraum', true);

    setTextField(form, 'B0_Adresse', data.adresse || '');
    setTextField(form, 'B0_Aufzugstyp', data.aufzugstyp || '');
    setTextField(form, 'B0_Fabrikations', data.fabrikationsNr || '');
    setTextField(form, 'B0_Standortadresse', data.standortadresse || '');

    // ----------------------------------------------------------
    // 2. B1 - ANLAGEDATEN
    // ----------------------------------------------------------
    setTextField(form, 'B1_Hubhöhe', data.b1_hubhoehe || '');
    setTextField(form, 'B1_Stockwerke', data.b1_stockwerke || '');
    setTextField(form, 'B1_Zugange', data.b1_zugaenge || '');
    setTextField(form, 'B1_Nennlast', data.b1_nennlast || '');
    setTextField(form, 'B1_Personen', data.b1_personen || '');
    setTextField(form, 'B1_Anforderungen', data.b1_anforderungen || '');

    // Entwurfsprüfungen (max 7)
    if (data.b1_entwurfspruefung) {
      data.b1_entwurfspruefung.slice(0, 7).forEach((val, i) => {
        setTextField(form, `B1_Entwurfsprüfung${i + 1}`, val);
      });
    }
    if (data.b1_aufzugsbuch) {
      data.b1_aufzugsbuch.slice(0, 7).forEach((val, i) => {
        setTextField(form, `B1_Aufzugsbuch${i + 1}`, val);
      });
    }

    // ----------------------------------------------------------
    // 3. B3 - SCHACHT MÉRÉSI TÁBLÁZATOK
    // ----------------------------------------------------------
    const b3Measurements: Record<string, string | undefined> = {
      'B3_A1': data.b3_A1, 'B3_A2': data.b3_A2, 'B3_A3': data.b3_A3,
      'B3_B1': data.b3_B1, 'B3_B2': data.b3_B2, 'B3_B3': data.b3_B3,
      'B3_C1': data.b3_C1, 'B3_C2': data.b3_C2, 'B3_C3': data.b3_C3,
      'B3_D1': data.b3_D1, 'B3_D2': data.b3_D2, 'B3_D3': data.b3_D3,
      'B3_E1': data.b3_E1, 'B3_E3': data.b3_E3,
      'B3_F1': data.b3_F1, 'B3_F2': data.b3_F2, 'B3_F3': data.b3_F3,
      'B3_G1': data.b3_G1, 'B3_G2': data.b3_G2, 'B3_G3': data.b3_G3,
      'B3_H1': data.b3_H1, 'B3_H2': data.b3_H2, 'B3_H3': data.b3_H3,
      'B3_J1': data.b3_J1, 'B3_J2': data.b3_J2, 'B3_J3': data.b3_J3,
      'B3_Fuhrung_Kabine': data.b3_FuhrungKabine,
      'B3_Fuhrung_Ausgleich': data.b3_FuhrungAusgleich,
      'B3_Fuhrung_Hilfsführung': data.b3_FuhrungHilfs,
      'B3_Fuhrung_Heber': data.b3_FuhrungHeber,
      'B3_Fabrikationstyp': data.b3_Fabrikationstyp,
      'B3_Fabrikationstyp_2': data.b3_Fabrikationstyp2,
      'B3_Anzahl_installierte_Puffer': data.b3_AnzahlPuffer,
    };
    for (const [field, val] of Object.entries(b3Measurements)) {
      if (val) setTextField(form, field, val);
    }

    // ----------------------------------------------------------
    // 4. B4 - SCHACHTTÜREN
    // ----------------------------------------------------------
    setTextField(form, 'B4_Feuerwiderstandsklasse', data.b4_feuerwiderstand || '');
    setTextField(form, 'B4_Fabrikationstyp', data.b4_fabrikationstyp || '');
    setTextField(form, 'B4_Fabrikationstyp_1', data.b4_fabrikationstyp2 || '');

    // ----------------------------------------------------------
    // 5. B6 - AUFHÄNGUNG
    // ----------------------------------------------------------
    setTextField(form, 'B6_Anzahl', data.b6_anzahl || '');
    setTextField(form, 'B6_ Nenndurchmesser', data.b6_nenndurchmesser || '');
    setTextField(form, 'B6_Anzahl_2', data.b6_anzahl2 || '');
    setTextField(form, 'B6_Dimension', data.b6_dimension || '');
    setTextField(form, 'B6_Fabrikationstyp', data.b6_fabrikationstyp || '');
    setTextField(form, 'B6_SerienNr', data.b6_serienNr || '');

    // ----------------------------------------------------------
    // 6. B7 - FANGVORRICHTUNGEN / HYDRAULIK
    // ----------------------------------------------------------
    setTextField(form, 'B7_Typ', data.b7_typ || '');
    setTextField(form, 'B7_SerienNr', data.b7_serienNr || '');
    setTextField(form, 'B7_Typ_Bremsfang', data.b7_typBremsfang || '');
    setTextField(form, 'B7_Typ_Sperrfang', data.b7_typSperrfang || '');
    setTextField(form, 'B7_Typ_Sperrfang63', data.b7_typSperrfang63 || '');
    setTextField(form, 'B7_SerienNr_1', data.b7_serienNr1 || '');
    setTextField(form, 'B7_SerienNr_2', data.b7_serienNr2 || '');
    setTextField(form, 'B7_SerienNr_Ausgleich', data.b7_serienNrAusgleich || '');
    setTextField(form, 'B7_Typ_Ausgleich', data.b7_typAusgleich || '');
    setTextField(form, 'B7_Auslosegeschwindigkeit', data.b7_ausloesegeschw || '');
    setTextField(form, 'B7_Nenndurchmesser', data.b7_nenndurchmesser || '');
    setTextField(form, 'B7_Nenndurchmesser_1', data.b7_nenndurchmesser1 || '');
    setTextField(form, 'B7_Nenndurchmesser_2', data.b7_nenndurchmesser2 || '');
    setTextField(form, 'B7_RohrbruchTyp', data.b7_rohrbruchTyp || '');
    setTextField(form, 'B7_Drossel_Typ', data.b7_drosselTyp || '');
    // B7 hydraulikus komponens checkboxok (PDF valódi mezőnevei pypdf alapján)
    if (data.b7_fang) setCheckbox(form, 'B7_nz_7.3.Fang', true);
    if (data.b7_ausgleich) setCheckbox(form, 'B7_nz_7.4.Ausgleich', true);
    if (data.b7_begrenzer) setCheckbox(form, 'B7_nz_7.2.Begrenzer', true);
    if (data.b7_rohrbruch) setCheckbox(form, 'B7_nz_7.5.Rohrbruch', true);
    if (data.b7_drossel) setCheckbox(form, 'B7_nz_7.6.Drossel', true);

    // ----------------------------------------------------------
    // 7. B8 - HYDRAULIKANLAGE
    // ----------------------------------------------------------
    setTextField(form, 'B8_Hersteller', data.b8_hersteller || '');
    setTextField(form, 'B8_AggregatTyp', data.b8_aggregatTyp || '');
    setTextField(form, 'B8_Motortyp', data.b8_motortyp || '');
    setTextField(form, 'B8_AggregatNr', data.b8_aggregatNr || '');
    setTextField(form, 'B8_Nennstrom', data.b8_nennstrom || '');
    setTextField(form, 'B8_Motorleistung', data.b8_motorleistung || '');
    setTextField(form, 'B8_HeberTyp', data.b8_heberTyp || '');
    setTextField(form, 'B8_Nennlast', data.b8_nennlast || '');
    setTextField(form, 'B8_Leerlast', data.b8_leerlast || '');
    setTextField(form, 'B8_Nennlast_Auf', data.b8_nennlastAuf || '');
    setTextField(form, 'B8_Leerlast_Ab', data.b8_leerlastAb || '');
    setTextField(form, 'B8_Druckbegrenzung', data.b8_druckbegrenzung || '');
    setTextField(form, 'B8_Druckbegrenzung_Hand', data.b8_druckbegrenzungHand || '');
    // Leitungen Hersteller (max 9)
    if (data.b8_herstellerMulti) {
      const herstellerFields = ['B8_Hersteller_1', 'B8_Hersteller_2', 'B8_Hersteller_3',
        'B8_Hersteller_4', 'B8_Hersteller_5', 'B8_Hersteller_6',
        'B8_Hersteller_7', 'B8_Hersteller_8', 'B8_Hersteller_9'];
      data.b8_herstellerMulti.slice(0, 9).forEach((val, i) => {
        setTextField(form, herstellerFields[i], val);
      });
    }

    // ----------------------------------------------------------
    // 8. B9 - ELEKTRISCHES SYSTEM
    // ----------------------------------------------------------
    setTextField(form, 'B9_Soll_Auf', data.b9_sollAuf || '');
    setTextField(form, 'B9_Soll_Ab', data.b9_sollAb || '');
    setTextField(form, 'B9_Ist_leerer_aufwärts', data.b9_istLeerAuf || '');
    setTextField(form, 'B9_Ist_Nennlast_abwärts', data.b9_istNennlastAb || '');
    setTextField(form, 'B9_Ist_leerer_aufwärts_korrektur', data.b9_istLeerAuf_korrektur || '');
    setTextField(form, 'B9_Ist_Nennlast_abwärts_korrektur', data.b9_istNennlastAb_korrektur || '');
    setTextField(form, 'B9_Ist_leerer_aufwärts_Inspektions', data.b9_istLeerAuf_inspektions || '');
    setTextField(form, 'B9_Ist_Nennlast_abwärts_Inspektions', data.b9_istNennlastAb_inspektions || '');
    setTextField(form, 'B9_Ist_leerer_aufwärts_Rampenfahrt', data.b9_istLeerAuf_rampenfahrt || '');
    setTextField(form, 'B9_Ist_Nennlast_abwärts_Rampenfahrt', data.b9_istNennlastAb_rampenfahrt || '');
    setTextField(form, 'B9_Strom_Leer', data.b9_stromLeer || '');
    setTextField(form, 'B9_Strom_Nennlast', data.b9_stromNennlast || '');
    setTextField(form, 'B9_Netzspannung', data.b9_netzspannung || '');
    setTextField(form, 'B9_Netzspannung_Nennlast', data.b9_netzspannungNennlast || '');
    setTextField(form, 'B9_Sicherheitskreis', data.b9_sicherheitskreis || '');
    setTextField(form, 'B9_Steuerspannung', data.b9_steuerspannung || '');

    // ----------------------------------------------------------
    // 9. B13 - KONFORMITÄTSERKLÄRUNG
    // ----------------------------------------------------------
    setTextField(form, 'B13_Bauseitige_Pendenzen', data.b13_bauseitigePendenzen || '');
    setTextField(form, 'B13_Aufzugsseitige_Pendenzen', data.b13_aufzugsseitigePendenzen || '');
    setTextField(form, 'B13_Firma', data.b13_firma || '');
    setTextField(form, 'B13_Name_Abnahmetechniker', data.b13_nameAbnahme || '');
    setTextField(form, 'B13_Datum', data.b13_datum || '');

    // ----------------------------------------------------------
    // 10. B14 - NACHKONTROLLE
    // ----------------------------------------------------------
    setTextField(form, 'B14_Firma', data.b14_firma || '');
    setTextField(form, 'B14_Name_Abnahmetechniker', data.b14_nameAbnahme || '');
    setTextField(form, 'B14_Datum', data.b14_datum || '');

    // ----------------------------------------------------------
    // 11. KÉRDÉSEK KITÖLTÉSE - a fő logika
    // Minden yes_no_na kérdés groupKey alapján checkbox kitöltés
    // ----------------------------------------------------------
    if (data.questionAnswers) {
      for (const [questionPath, answer] of Object.entries(data.questionAnswers)) {
        if (!answer || !questionPath) continue;

        const chapter = getChapterFromPath(questionPath);
        if (!chapter) {
          // Direkt mező név (pl. "B9_Netzspannung")
          if (questionPath.startsWith('B')) {
            setTextField(form, questionPath, answer);
          }
          continue;
        }

        const blockNum = chapter;
        const upperAnswer = answer.trim();

        // YES/NO/NA/U/Siehe jelölőnégyzetek
        if (upperAnswer === 'Ja' || upperAnswer === 'ja' || upperAnswer === 'yes' || upperAnswer === 'igen') {
          setCheckbox(form, buildCheckboxFieldName(blockNum, 'Ja', questionPath), true);
        } else if (upperAnswer === 'Nein' || upperAnswer === 'nein' || upperAnswer === 'no' || upperAnswer === 'nem') {
          const neinField = buildCheckboxFieldName(blockNum, 'Nein', questionPath);
          setCheckbox(form, neinField, true);
        } else if (upperAnswer === 'nz' || upperAnswer === 'n.z.' || upperAnswer === 'na') {
          setCheckbox(form, buildCheckboxFieldName(blockNum, 'nz', questionPath), true);
        } else if (upperAnswer === 'U') {
          setCheckbox(form, buildCheckboxFieldName(blockNum, 'U', questionPath), true);
        } else if (upperAnswer === 'Siehe' || upperAnswer === 'siehe') {
          // "Siehe" = "Lásd" opció — B10.1-nél szerepel (XML: B10_Siehe_10.1)
          setCheckbox(form, buildCheckboxFieldName(blockNum, 'Siehe', questionPath), true);
        } else if (upperAnswer === 'keine' || upperAnswer === 'Keine') {
          // "keine" = "nincs" opció — B1-nél szerepel (XML: B1_keine_1)
          setCheckbox(form, buildCheckboxFieldName(blockNum, 'keine', questionPath), true);
        } else {
          // Szabad szöveg → szöveges mező kitöltés
          const neinTextField = buildCheckboxFieldName(blockNum, 'Nein', questionPath);
          setTextField(form, neinTextField, upperAnswer);
        }
      }
    }

    // ----------------------------------------------------------
    // 12. PDF lezárása (form mezők lapítása nélkül!)
    // ----------------------------------------------------------
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}

export interface FAQItem {
  id: string;
  category: string;
  keywords: string[];  // Normalized: lowercase, no spaces/underscores
  question: string;
  answer: string;
}

export interface HelpTranslations {
  title: string;
  subtitle: string;
  faqTitle: string;
  askAI: string;
  askPlaceholder: string;
  sendButton: string;
  categories: {
    general: string;
    protocol: string;
    measurements: string;
    excel: string;
    errors: string;
    conditional: string;
  };
  aiThinking: string;
  noAnswer: string;
  helpButton: string;
  backToFAQ: string;
}

export const helpTranslations: Record<string, HelpTranslations> = {
  hu: {
    title: "Használati Segítség",
    subtitle: "Gyors válaszok és AI asszisztens",
    faqTitle: "Gyakori Kérdések",
    askAI: "Kérdezz az AI-tól",
    askPlaceholder: "Írd be a kérdésed...",
    sendButton: "Küldés",
    categories: {
      general: "Általános",
      protocol: "Protokoll",
      measurements: "Mérések",
      excel: "Excel",
      errors: "Hibák",
      conditional: "Feltételes kérdések"
    },
    aiThinking: "Gondolkodom...",
    noAnswer: "Sajnos nem találtam választ. Próbálj másképp fogalmazni.",
    helpButton: "Segítség",
    backToFAQ: "Vissza a GYIK-hez"
  },
  de: {
    title: "Hilfe & Anleitung",
    subtitle: "Schnelle Antworten und KI-Assistent",
    faqTitle: "Häufige Fragen",
    askAI: "KI fragen",
    askPlaceholder: "Geben Sie Ihre Frage ein...",
    sendButton: "Senden",
    categories: {
      general: "Allgemein",
      protocol: "Protokoll",
      measurements: "Messungen",
      excel: "Excel",
      errors: "Fehler",
      conditional: "Bedingte Fragen"
    },
    aiThinking: "Ich denke nach...",
    noAnswer: "Leider keine Antwort gefunden. Bitte anders formulieren.",
    helpButton: "Hilfe",
    backToFAQ: "Zurück zu FAQ"
  },
  en: {
    title: "Help & Guide",
    subtitle: "Quick answers and AI assistant",
    faqTitle: "Frequently Asked Questions",
    askAI: "Ask AI",
    askPlaceholder: "Type your question...",
    sendButton: "Send",
    categories: {
      general: "General",
      protocol: "Protocol",
      measurements: "Measurements",
      excel: "Excel",
      errors: "Errors",
      conditional: "Conditional Questions"
    },
    aiThinking: "Thinking...",
    noAnswer: "Sorry, no answer found. Please try rephrasing.",
    helpButton: "Help",
    backToFAQ: "Back to FAQ"
  },
  fr: {
    title: "Aide & Guide",
    subtitle: "Réponses rapides et assistant IA",
    faqTitle: "Questions Fréquentes",
    askAI: "Demander à l'IA",
    askPlaceholder: "Tapez votre question...",
    sendButton: "Envoyer",
    categories: {
      general: "Général",
      protocol: "Protocole",
      measurements: "Mesures",
      excel: "Excel",
      errors: "Erreurs",
      conditional: "Questions conditionnelles"
    },
    aiThinking: "Je réfléchis...",
    noAnswer: "Désolé, pas de réponse trouvée. Essayez de reformuler.",
    helpButton: "Aide",
    backToFAQ: "Retour aux FAQ"
  },
  it: {
    title: "Aiuto & Guida",
    subtitle: "Risposte rapide e assistente AI",
    faqTitle: "Domande Frequenti",
    askAI: "Chiedi all'AI",
    askPlaceholder: "Scrivi la tua domanda...",
    sendButton: "Invia",
    categories: {
      general: "Generale",
      protocol: "Protocollo",
      measurements: "Misurazioni",
      excel: "Excel",
      errors: "Errori",
      conditional: "Domande condizionali"
    },
    aiThinking: "Sto pensando...",
    noAnswer: "Spiacente, nessuna risposta trovata. Prova a riformulare.",
    helpButton: "Aiuto",
    backToFAQ: "Torna alle FAQ"
  }
};

// ============================================================================
// FAQ CONTENT - NORMALIZED KEYWORDS (lowercase, no spaces/underscores)
// ============================================================================

export const faqContent: Record<string, FAQItem[]> = {
  hu: [
    { 
      id: "g1", 
      category: "general", 
      keywords: ["aprod", "rendszer", "atvetel", "protokoll", "digitalis"],
      question: "Mi az APROD rendszer?", 
      answer: "Az APROD (Acceptance Protocol Document) egy digitális átvételi jegyzőkönyv rendszer OTIS liftek számára. Lépésről lépésre végigvezet az átvételi folyamaton, dokumentálja a hibákat és generálja a szükséges PDF/Excel dokumentumokat." 
    },
    { 
      id: "g2", 
      category: "general", 
      keywords: ["nyelv", "forditas", "language", "valtas", "zaszlo"],
      question: "Hogyan válthatok nyelvet?", 
      answer: "A jobb felső sarokban található zászló ikonra kattintva választhatsz az 5 elérhető nyelv közül: Magyar, Német, Angol, Francia, Olasz. A kiválasztott nyelv automatikusan mentésre kerül." 
    },
    { 
      id: "g3", 
      category: "general", 
      keywords: ["mentes", "protokoll", "save", "tarolas", "automatikus"],
      question: "Hogyan menthetek el egy protokollt?", 
      answer: "A rendszer automatikusan menti az adatokat minden változtatás után. A 'Mentés' gomb segítségével manuálisan is elmentheted. A protokollok a PostgreSQL adatbázisban és LocalStorage-ban is tárolódnak." 
    },
    { 
      id: "g4", 
      category: "general", 
      keywords: ["pwa", "telepites", "install", "alkalmazas", "offline", "progressivewebapp"],
      question: "Mi az a PWA és hogyan telepíthetem?", 
      answer: "A PWA (Progressive Web App) lehetővé teszi, hogy alkalmazásként telepítsd a rendszert. Chrome/Edge-ben kattints a címsorban megjelenő 'Telepítés' ikonra, mobilon pedig használd a 'Hozzáadás a kezdőképernyőhöz' opciót. Telepítés után offline is működik." 
    },
    { 
      id: "g5", 
      category: "general", 
      keywords: ["offline", "mukodes", "internet", "kapcsolat", "szinkronizalas"],
      question: "Működik offline az alkalmazás?", 
      answer: "Igen! A PWA technológiának köszönhetően az alkalmazás offline is működik. A LocalStorage-ban tárolja az adatokat, és a következő online kapcsolódáskor automatikusan szinkronizálja azokat a szerverrel." 
    },
    { 
      id: "p1", 
      category: "protocol", 
      keywords: ["oldal", "szakasz", "pages", "struktura", "otoldal"],
      question: "Hány oldala van egy protokollnak?", 
      answer: "A protokoll 5 fő oldalból áll: 1) Általános adatok, 2) Műszaki ellenőrzés, 3) Modernizáció, 4) Mérések, 5) Niedervolt mérések. Ezután következik az aláírás és a hibák dokumentálása." 
    },
    { 
      id: "p2", 
      category: "protocol", 
      keywords: ["nz", "nemalkalmazhato", "nichtzutreffend", "na", "notapplicable"],
      question: "Mit jelent a 'N.z.' válaszlehetőség?", 
      answer: "A 'N.z.' (Nem alkalmazható / Nicht zutreffend) azt jelenti, hogy az adott kérdés nem releváns az aktuális lift típusánál. Ezt válaszd, ha a kérdés nem vonatkozik a vizsgált liftre. Az Excel-ben automatikusan 'N.z.' vagy '-' kerül be." 
    },
    { 
      id: "p3", 
      category: "protocol", 
      keywords: ["lifttipus", "mod", "bex", "neu", "egyedi", "modernizacio", "beepitett"],
      question: "Milyen lift típusokat támogat a rendszer?", 
      answer: "4 fő típus: MOD (Modernizáció), BEX (Beépített lift), NEU (Új lift), EGYEDI (Egyéni konfiguráció). Minden típusnak lehetnek altípusai is, amelyek különböző kérdéssablonokat és Excel template-eket töltenek be." 
    },
    { 
      id: "p4", 
      category: "protocol", 
      keywords: ["tipusvalasztas", "liftselector", "sablon", "template"],
      question: "Hogyan választom ki a megfelelő lift típust?", 
      answer: "A 'Lift típus választó' képernyőn válaszd ki a fő típust (pl. MOD), majd az altípust (ha van). A rendszer automatikusan betölti a megfelelő kérdéssablont és Excel template-et a lift_template_mappings tábla alapján." 
    },
    { 
      id: "p5", 
      category: "protocol", 
      keywords: ["tipusmodositas", "rossztipus", "valtoztatas", "torles"],
      question: "Mi történik, ha rossz típust választottam?", 
      answer: "Visszamehetsz a lift választó képernyőre és módosíthatod a típust. FIGYELEM: ez törli a már megválaszolt kérdéseket, mert más kérdéssablon töltődik be!" 
    },
    { 
      id: "m1", 
      category: "measurements", 
      keywords: ["meres", "szigeteles", "foldeles", "measurement", "elektromos"],
      question: "Milyen mérési értékeket kell megadni?", 
      answer: "A mérések oldalon szigetelési ellenállás (MΩ), földelési ellenállás (Ω), és egyéb elektromos paramétereket kell rögzíteni. Minden méréshez tartozik egy elfogadható tartomány (min/max), amit a rendszer automatikusan ellenőriz." 
    },
    { 
      id: "m2", 
      category: "measurements", 
      keywords: ["hibasmeres", "piros", "validacio", "tartomany", "hatarertek"],
      question: "Mi történik hibás mérési értéknél?", 
      answer: "Ha egy mérési érték kívül esik az elfogadható tartományon, a rendszer automatikusan piros háttérrel jelzi és hozzáadja a hibajelentéshez. A mért érték és a határértékek is megjelennek a hibajelentésben." 
    },
    { 
      id: "m3", 
      category: "measurements", 
      keywords: ["niedervolt", "kisfeszultseg", "fimeres", "biztonsagi", "eszkoz"],
      question: "Mi az a Niedervolt rendszer?", 
      answer: "A Niedervolt szakasz a biztonsági berendezések ellenőrzésére szolgál. FI (residual current) méréseket mA-ben, izolációs ellenállást és földelési ellenállást kell rögzíteni. Az eszközök listája az Excel sablonból töltődik be." 
    },
    { 
      id: "m4", 
      category: "measurements", 
      keywords: ["eszkozhozzaadas", "niedervolteeszkoz", "ujeszkoz", "pluszgomb"],
      question: "Hogyan adhatok hozzá új eszközt a Niedervolt listához?", 
      answer: "Kattints a '+' gombra a Niedervolt oldalon. Egyedi eszközöket is hozzáadhatsz, amelyek automatikusan szinkronizálódnak az Excel-lel. Az egyedi eszközök megmaradnak a protokollban." 
    },
    { 
      id: "m5", 
      category: "measurements", 
      keywords: ["erdungskontrolle", "foldesellenzores", "grounding", "pdf"],
      question: "Mi az Erdungskontrolle?", 
      answer: "Az Erdungskontrolle (földelés ellenőrzés) egy dedikált modul, amely PDF formátumban dokumentálja a földelési méréseket. Külön kérdéssablonnal (questions_grounding_*.json) rendelkezik és pdf-lib használatával saját PDF formot generál." 
    },
    { 
      id: "e1", 
      category: "excel", 
      keywords: ["excelcellak", "kitoltes", "mapping", "cellreference"],
      question: "Hogyan töltődnek ki az Excel cellák?", 
      answer: "A rendszer automatikusan beírja a válaszokat az Excel sablon megfelelő celláiba a cell_reference alapján. Az 'Igen' válasz 'X'-et ír a megfelelő oszlopba, a szöveges válaszok közvetlenül bekerülnek a cellákba. Formátum: 'SheetName!CellAddress' pl. 'Sheet1!B15'." 
    },
    { 
      id: "e2", 
      category: "excel", 
      keywords: ["defaultifhidden", "rejtettkerdes", "alapertelmezett"],
      question: "Mi az a defaultIfHidden?", 
      answer: "Ha egy feltételes kérdés el van rejtve (mert a trigger kérdésre 'Nem' volt a válasz), a defaultIfHidden érték automatikusan beíródik az Excel cellába. Alapértelmezetten 'N.z.' vagy '-' kerül be. Ez biztosítja, hogy az Excel teljesen kitöltött legyen." 
    },
    { 
      id: "e3", 
      category: "excel", 
      keywords: ["cellreference", "cellahivatkozas", "excelmapping"],
      question: "Mi az a cell_reference?", 
      answer: "A cell_reference az Excel sablon cellájának hivatkozása formátumban: 'SheetName!CellAddress' (pl. 'Sheet1!B15'). Ez mondja meg az Excel service-nek, hogy egy adott válasz hova kerüljön az Excel-ben. A simple-xml-excel.ts kezeli a beírást." 
    },
    { 
      id: "e4", 
      category: "excel", 
      keywords: ["excelparser", "templatefeldolgozas", "exceljs"],
      question: "Hogyan működik az Excel parser?", 
      answer: "Az excel-parser.ts (ExcelJS alapú) beolvassa a template fájlt, azonosítja a kérdéseket a megfelelő oszlopokból, és létrehozza a question_configs rekordokat a cellahivatkozásokkal együtt az adatbázisban." 
    },
    { 
      id: "e5", 
      category: "excel", 
      keywords: ["unifiedtemplate", "egyseges", "sablon", "template"],
      question: "Mi a unified template?", 
      answer: "A unified template egy Excel fájl, amely egyszerre tartalmazza a kérdéseket ÉS a protokoll sablont egy fájlban. Típusa: 'unified'. Ez egyszerűsíti a template kezelést, mert nem kell külön questions és protocol fájl." 
    },
    { 
      id: "er1", 
      category: "errors", 
      keywords: ["hibadokumentalas", "error", "ujhiba", "rogzites"],
      question: "Hogyan dokumentálhatok hibát?", 
      answer: "A 'Hibák' menüpontban az 'Új hiba' gombra kattintva rögzíthetsz hibát. Megadhatod a hiba leírását, helyét, súlyosságát (critical/medium/low) és fényképet is csatolhatsz. A hibák a protocols.errors JSONB mezőben tárolódnak." 
    },
    { 
      id: "er2", 
      category: "errors", 
      keywords: ["kepcsatolas", "foto", "hibakep", "galeria", "kamera"],
      question: "Hogyan csatolhatok képet a hibához?", 
      answer: "A hiba szerkesztésénél a 'Kép hozzáadása' gombra kattintva feltölthetsz képet a galériából vagy készíthetsz új fotót a kamerával. A képek Base64-ben vagy Supabase Storage-ban tárolódnak." 
    },
    { 
      id: "er3", 
      category: "errors", 
      keywords: ["hibalistapdf", "errorexport", "jspdf"],
      question: "Mi az a hibalista PDF?", 
      answer: "A hibalista PDF egy error-export.ts által automatikusan generált dokumentum (jsPDF), amely tartalmazza az összes rögzített hibát részletes leírással, képekkel és súlyossági szinttel. Unicode támogatással rendelkezik." 
    },
    { 
      id: "er4", 
      category: "errors", 
      keywords: ["sulyossag", "severity", "kritikus", "critical", "medium", "low"],
      question: "Milyen súlyossági szintek vannak?", 
      answer: "3 szint: critical (kritikus - azonnal javítandó), medium (közepes - rövid időn belül), low (alacsony - később is javítható). A színkódolás: piros, sárga, zöld." 
    },
    { 
      id: "c1", 
      category: "conditional", 
      keywords: ["felteteleskerdes", "conditional", "trigger"],
      question: "Mi az a feltételes kérdés?", 
      answer: "A feltételes kérdések csak akkor jelennek meg, ha egy korábbi (trigger) kérdésre 'Igen' választ adtál. Ha 'Nem' a válasz, a kapcsolódó kérdések automatikusan elrejtődnek és az Excel-ben defaultIfHidden érték kerül be." 
    },
    { 
      id: "c2", 
      category: "conditional", 
      keywords: ["elrejtettkerdes", "hiddenquestion", "defaultifhidden"],
      question: "Mi történik az elrejtett kérdésekkel az Excelben?", 
      answer: "Az elrejtett kérdések cellái automatikusan kitöltődnek a defaultIfHidden értékkel (általában 'N.z.' vagy '-'). Ez biztosítja, hogy az Excel teljesen kitöltött legyen minden esetben." 
    },
    { 
      id: "c3", 
      category: "conditional", 
      keywords: ["conditionalgroupkey", "kerdescsoport", "group"],
      question: "Mi az a conditional_group_key?", 
      answer: "A conditional_group_key azonosítja a feltételes kérdéscsoportot az adatbázisban. Ha egy trigger kérdés Igen választ kap, az azonos conditional_group_key-jel rendelkező kérdések megjelennek. Ez a question_configs táblában van definiálva." 
    },
    { 
      id: "c4", 
      category: "conditional", 
      keywords: ["groupkey", "lifttipusszures", "kerdesszures"],
      question: "Hogyan működik a group_key szűrés?", 
      answer: "A group_key alapján szűrheted a kérdéseket lift típusonként. Értékek: 'general' (minden típus), 'modernization' (csak MOD), 'new_installation' (csak NEU), 'built_in' (csak BEX). Ez a lift_template_mappings táblában van beállítva." 
    }
  ],
  de: [
    { 
      id: "g1", 
      category: "general", 
      keywords: ["aprod", "system", "abnahme", "protokoll"],
      question: "Was ist das APROD-System?", 
      answer: "APROD (Acceptance Protocol Document) ist ein digitales Abnahmeprotokollsystem für OTIS-Aufzüge. Es führt Sie Schritt für Schritt durch den Abnahmeprozess, dokumentiert Fehler und generiert die erforderlichen PDF/Excel-Dokumente." 
    },
    { 
      id: "g2", 
      category: "general", 
      keywords: ["sprache", "language", "wechseln"],
      question: "Wie wechsle ich die Sprache?", 
      answer: "Klicken Sie auf das Flaggensymbol in der oberen rechten Ecke, um aus 5 verfügbaren Sprachen zu wählen: Ungarisch, Deutsch, Englisch, Französisch, Italienisch." 
    },
    { 
      id: "p1", 
      category: "protocol", 
      keywords: ["seiten", "pages", "struktur"],
      question: "Wie viele Seiten hat ein Protokoll?", 
      answer: "Das Protokoll besteht aus 5 Hauptseiten: 1) Allgemeine Daten, 2) Technische Prüfung, 3) Modernisierung, 4) Messungen, 5) Niedervolt-Messungen." 
    },
    { 
      id: "e1", 
      category: "excel", 
      keywords: ["excelzellen", "ausfullen", "cellreference"],
      question: "Wie werden Excel-Zellen ausgefüllt?", 
      answer: "Das System trägt Antworten automatisch in die entsprechenden Zellen der Excel-Vorlage ein basierend auf cell_reference. 'Ja' schreibt ein 'X' in die entsprechende Spalte." 
    },
    { 
      id: "c1", 
      category: "conditional", 
      keywords: ["bedingte", "frage", "conditional", "trigger"],
      question: "Was ist eine bedingte Frage?", 
      answer: "Bedingte Fragen erscheinen nur, wenn Sie auf eine vorherige (Trigger-)Frage mit 'Ja' geantwortet haben. Bei 'Nein' werden die zugehörigen Fragen automatisch ausgeblendet." 
    }
  ],
  en: [
    { 
      id: "g1", 
      category: "general", 
      keywords: ["aprod", "system", "acceptance", "protocol"],
      question: "What is the APROD system?", 
      answer: "APROD (Acceptance Protocol Document) is a digital acceptance protocol system for OTIS elevators. It guides you step-by-step through the acceptance process, documents errors, and generates the required PDF/Excel documents." 
    },
    { 
      id: "g2", 
      category: "general", 
      keywords: ["language", "change", "switch"],
      question: "How do I change the language?", 
      answer: "Click on the flag icon in the top right corner to choose from 5 available languages: Hungarian, German, English, French, Italian." 
    },
    { 
      id: "p1", 
      category: "protocol", 
      keywords: ["pages", "sections", "structure"],
      question: "How many pages does a protocol have?", 
      answer: "The protocol consists of 5 main pages: 1) General Data, 2) Technical Inspection, 3) Modernization, 4) Measurements, 5) Low Voltage Measurements." 
    },
    { 
      id: "e1", 
      category: "excel", 
      keywords: ["excelcells", "filling", "cellreference"],
      question: "How are Excel cells filled?", 
      answer: "The system automatically enters answers into the corresponding cells of the Excel template based on cell_reference. 'Yes' writes an 'X' in the appropriate column." 
    },
    { 
      id: "c1", 
      category: "conditional", 
      keywords: ["conditional", "question", "trigger", "hidden"],
      question: "What is a conditional question?", 
      answer: "Conditional questions only appear if you answered 'Yes' to a previous (trigger) question. If 'No', the related questions are automatically hidden." 
    }
  ],
  fr: [
    { 
      id: "g1", 
      category: "general", 
      keywords: ["aprod", "systeme", "reception", "protocole"],
      question: "Qu'est-ce que le système APROD?", 
      answer: "APROD (Acceptance Protocol Document) est un système de protocole de réception numérique pour les ascenseurs OTIS." 
    }
  ],
  it: [
    { 
      id: "g1", 
      category: "general", 
      keywords: ["aprod", "sistema", "accettazione", "protocollo"],
      question: "Cos'è il sistema APROD?", 
      answer: "APROD (Acceptance Protocol Document) è un sistema di protocollo di accettazione digitale per gli ascensori OTIS." 
    }
  ]
};

// ============================================================================
// MODULAR SYSTEM PROMPT - PRODUCTION-READY (UTF-8 CLEAN)
// ============================================================================

/**
 * CORE SYSTEM PROMPT - Szerepkör, szabályok, prioritás
 * Ez ritkán változik, így cache-elhető
 */
export const coreSystemPrompt = `SYSTEM PROMPT – OTIS APROD Senior AI Assistant

SZEREPKOR ES FELELOSSEG

Te egy SENIOR szintű AI Asszisztens vagy az OTIS APROD (Acceptance Protocol Document) rendszerben.
Ez egy TypeScript alapú Progressive Web Application (PWA), amely lift átvételi jegyzőkönyvek digitalizálására szolgál.

FELADATOD:
- Szakmailag precíz, kontextus-érzékeny és az OTIS sztenderdeknek megfelelő támogatás nyújtása
- Technikus és adminisztrátor felhasználók segítése protokoll kitöltésében
- Rendszerműködés, funkciók és troubleshooting magyarázata
- Többnyelvű támogatás (HU, DE, EN, FR, IT)

VISELKEDESI IRANYELVEK

1. PROFESSZIONALIS KOMMUNIKACIO
   - Higgadt, magabiztos, szakszerű hangnem
   - Kerüld a szlenget és túlzott barátságoskodást
   - Technikai kifejezések pontos használata

2. STRUKTURALT VALASZADAS
   - Lépésről-lépésre útmutatók
   - Listák használata több opció esetén
   - Konkrét példák adása

3. RENDSZERSZEMLÉLET
   - Válaszaidban vedd figyelembe az adatkonzisztenciát
   - Validációs szabályok tiszteletben tartása
   - Mellékhatások említése (pl. "Figyelem: ez törli a válaszokat")

4. NYELVI KORNYEZET
   - Mindig a felhasználó nyelvén válaszolj (HU/DE/EN/FR/IT)
   - Szakmai terminológia helyes fordítása
   - Konzisztens nyelvhasználat

TUDASBAZIS PRIORITAS (AUTORITAS)

KRITIKUS: Ha a rendszer biztosít számodra GYIK (FAQ) vagy Kézikönyv (Manual) részletet,
azt tekintsd ELSODLEGES IGAZSAGNAK.

HIERARCHIA:
1. Becsatornázott FAQ/Manual tartalom (RAG-injected knowledge)
2. System Prompt technikai leírások
3. Általános tudásod

SZABALYOK:
- SOHA ne mondj ellent a biztosított dokumentációnak
- SOHA ne találj ki nem létező API végpontokat
- SOHA ne találj ki nem létező adatbázis táblákat vagy mezőket
- SOHA ne spekulálj bizonytalan adatokról

Ha nem tudod a választ, válaszolj: "Ezt sajnos nem tudom pontosan. Kérlek, fordulj a support@otis.com címre vagy nézd meg a teljes dokumentációt."

Ha nincs releváns dokumentáció a kérdéshez, de tudsz segíteni a system prompt alapján, adj hasznos választ, de jelezd a bizonytalanságot és javasolj support csatornát további segítséghez.`;

/**
 * DOMAIN SYSTEM PROMPT - APROD specifikus tudás
 * Ez gyakrabban változhat új funkciókkal
 */
export const domainSystemPrompt = `
TECHNOLOGIAI ARCHITEKTURA

FRONTEND STACK:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/ui komponensek
- TanStack Query v5 (szerver state management)
- Wouter (lightweight routing)
- Capacitor (natív mobil wrapper)

BACKEND STACK:
- Node.js + Express.js
- Drizzle ORM (type-safe)
- PostgreSQL (Neon serverless)
- Supabase (Auth + Storage)
- Zod (runtime validation)

DOKUMENTUM GENERALAS:
- ExcelJS - Excel fájl manipuláció (XML alapú)
- jsPDF - PDF generálás Unicode támogatással
- pdf-lib - PDF form kitöltés
- LibreOffice - Excel to PDF konverzió (headless)

EMAIL ES KOMMUNIKACIO:
- Nodemailer + Gmail SMTP

DOMAIN SPECIFIKUS TUDAS

MODULOK:
1. Erdungskontrolle (Földelés mérés) - Dedikált PDF modul
2. Niedervolt (Kisfeszültségű mérések) - FI mérések, eszközlista
3. Hiba dokumentáció - Képekkel, súlyossági szintekkel
4. Digitális aláírás - Canvas alapú, Base64 PNG
5. Template kezelés - Unified Excel templates, cell_reference mapping

KULCSFOGALMAK:
- defaultIfHidden: Rejtett feltételes kérdések alapértelmezett értéke (általában "N.z." vagy "-")
- lift_template_mappings: Lift típusonként eltérő sablonok betöltése
- conditional_group_key: Feltételes kérdéscsoportok azonosítója
- group_key: Lift típus alapú kérdésszűrés (general, modernization, new_installation, built_in)
- cell_reference: Excel cella hivatkozás formátuma: "SheetName!CellAddress" (pl. "Sheet1!B15")

LIFT TIPUSOK:
- MOD (Modernizáció) - Modernizációs projektek
- BEX (Beépített) - Built-in liftek
- NEU (Új) - Új telepítések
- EGYEDI (Custom) - Egyedi konfigurációk

KERDESTIPUSOK:
- yes_no_na - Igen/Nem/N.A. gombok
- text - Szöveges bevitel
- select - Dropdown lista
- number - Numerikus mező egységgel
- measurement - Validációs tartományokkal (min/max)
- calculated - Automatikusan számított (read-only)

PELDA VALASZOK

FELHASZNALO: "Hogyan adhatok hozzá új eszközt a Niedervolt listához?"

AI VALASZ:
"Új eszköz hozzáadása a Niedervolt oldalon:

1. Navigálj a 'Niedervolt mérések' szakaszhoz
2. Kattints a '+' (plusz) gombra az eszközlista alatt
3. Add meg az eszköz nevét és paramétereit
4. Az eszköz automatikusan szinkronizálódik az Excel template-tel
5. FI méréseket az új eszközhöz is rögzíthetsz

Fontos: Az egyedi eszközök megmaradnak a protokollban, de nem kerülnek be az Excel alapértelmezett sablonjába."

FELHASZNALO: "Miért nem jelenik meg egy kérdés?"

AI VALASZ:
"A kérdés eltűnésének okai lehetnek:

1. FELTETELES KERDES:
   - Ellenőrizd a kapcsolódó 'trigger' kérdés válaszát
   - Ha 'Nem' volt a válasz, a kapcsolódó kérdések automatikusan elrejtődnek
   - Példa: 'Van vészvilágítás?' to Nem to vészvilágítás kérdések rejtve

2. LIFT TIPUS SZURES:
   - Bizonyos kérdések csak meghatározott lift típusoknál jelennek meg
   - MOD típusnál látszanak a modernizációs kérdések (group_key: modernization)
   - Ellenőrizd, hogy megfelelő típust választottál-e

3. TEMPLATE HIBA:
   - Lehetséges, hogy nincs aktív sablon beállítva
   - Admin: Sablonkezelés to Ellenőrizd az aktív template-et

Melyik helyzet áll fenn nálad?"

ZARO UTASITASOK

- Mindig vedd figyelembe a felhasználó jelenlegi kontextusát (currentPage, errorCount, filledFields)
- Ha bizonytalan vagy, inkább kérdezz vissza
- Soha ne generálj hamis API végpontokat vagy kódot
- Válaszaid legyenek gyakorlatiasak, nem elméleti magyarázatok
- Ha a kérdés egy specifikus hibára vonatkozik, kérj részleteket (hibaüzenet, lépések, böngésző)

Sikeres támogatást!`;

/**
 * TELJES SYSTEM PROMPT - Használd ezt az AI hívásnál
 */
export const systemPromptForAI = `${coreSystemPrompt}

${domainSystemPrompt}`;
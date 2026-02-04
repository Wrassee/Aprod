export interface FAQItem {
  id: string;
  category: string;
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

export const faqContent: Record<string, FAQItem[]> = {
  hu: [
    { id: "g1", category: "general", question: "Mi az APROD rendszer?", answer: "Az APROD (Acceptance Protocol Document) egy digitális átvételi jegyzőkönyv rendszer OTIS liftek számára. Lépésről lépésre végigvezet az átvételi folyamaton, dokumentálja a hibákat és generálja a szükséges PDF/Excel dokumentumokat." },
    { id: "g2", category: "general", question: "Hogyan válthatok nyelvet?", answer: "A jobb felső sarokban található zászló ikonra kattintva választhatsz az 5 elérhető nyelv közül: Magyar, Német, Angol, Francia, Olasz." },
    { id: "g3", category: "general", question: "Hogyan menthetek el egy protokollt?", answer: "A rendszer automatikusan menti az adatokat minden változtatás után. A 'Mentés' gomb segítségével manuálisan is elmentheted. A protokollok a szerveren és helyben is tárolódnak." },
    { id: "g4", category: "general", question: "Mi az a PWA és hogyan telepíthetem?", answer: "A PWA (Progressive Web App) lehetővé teszi, hogy alkalmazásként telepítsd a rendszert. Chrome/Edge-ben kattints a címsorban megjelenő 'Telepítés' ikonra, mobilon pedig használd a 'Hozzáadás a kezdőképernyőhöz' opciót." },
    { id: "g5", category: "general", question: "Működik offline az alkalmazás?", answer: "Igen! A PWA technológiának köszönhetően az alkalmazás offline is működik. A LocalStorage-ban tárolja az adatokat, és a következő online kapcsolódáskor szinkronizálja azokat." },
    { id: "p1", category: "protocol", question: "Hány oldala van egy protokollnak?", answer: "A protokoll 5 fő oldalból áll: 1) Általános adatok, 2) Műszaki ellenőrzés, 3) Modernizáció, 4) Mérések, 5) Niedervolt mérések. Ezután következik az aláírás és a hibák dokumentálása." },
    { id: "p2", category: "protocol", question: "Mit jelent a 'N.z.' válaszlehetőség?", answer: "A 'N.z.' (Nem alkalmazható / Nicht zutreffend) azt jelenti, hogy az adott kérdés nem releváns az aktuális lift típusánál. Ezt válaszd, ha a kérdés nem vonatkozik a vizsgált liftre." },
    { id: "p3", category: "protocol", question: "Milyen lift típusokat támogat a rendszer?", answer: "4 fő típus: MOD (Modernizáció), BEX (Beépített lift), NEU (Új lift), EGYEDI (Egyéni konfiguráció). Minden típusnak lehetnek altípusai is, amelyek különböző kérdéssablonokat töltenek be." },
    { id: "p4", category: "protocol", question: "Hogyan választom ki a megfelelő lift típust?", answer: "A 'Lift típus választó' képernyőn válaszd ki a fő típust (pl. MOD), majd az altípust (ha van). A rendszer automatikusan betölti a megfelelő kérdéssablont és Excel template-et." },
    { id: "p5", category: "protocol", question: "Mi történik, ha rossz típust választottam?", answer: "Visszamehetsz a lift választó képernyőre és módosíthatod a típust. Figyelem: ez törli a már megválaszolt kérdéseket!" },
    { id: "m1", category: "measurements", question: "Milyen mérési értékeket kell megadni?", answer: "A mérések oldalon szigetelési ellenállás, földelési ellenállás, és egyéb elektromos paramétereket kell rögzíteni. Minden méréshez tartozik egy elfogadható tartomány, amit a rendszer automatikusan ellenőriz." },
    { id: "m2", category: "measurements", question: "Mi történik hibás mérési értéknél?", answer: "Ha egy mérési érték kívül esik az elfogadható tartományon, a rendszer automatikusan piros háttérrel jelzi és hozzáadja a hibajelentéshez. A mért érték és a határértékek is megjelennek." },
    { id: "m3", category: "measurements", question: "Mi az a Niedervolt rendszer?", answer: "A Niedervolt szakasz a biztonsági berendezések ellenőrzésére szolgál. FI méréseket, izolációs ellenállást és földelési ellenállást kell rögzíteni. Az eszközök listája az Excel sablonból töltődik be." },
    { id: "m4", category: "measurements", question: "Hogyan adhatok hozzá új eszközt a Niedervolt listához?", answer: "Kattints a '+' gombra a Niedervolt oldalon. Egyedi eszközöket is hozzáadhatsz, amelyek automatikusan szinkronizálódnak az Excel-lel." },
    { id: "m5", category: "measurements", question: "Mi az Erdungskontrolle?", answer: "Az Erdungskontrolle (földelés ellenőrzés) egy dedikált modul, amely PDF formátumban dokumentálja a földelési méréseket. Külön kérdéssablonnal rendelkezik és saját PDF-et generál." },
    { id: "e1", category: "excel", question: "Hogyan töltődnek ki az Excel cellák?", answer: "A rendszer automatikusan beírja a válaszokat az Excel sablon megfelelő celláiba. Az 'Igen' válasz 'X'-et ír a megfelelő oszlopba, a szöveges válaszok közvetlenül bekerülnek a cellákba." },
    { id: "e2", category: "excel", question: "Mi az a defaultIfHidden?", answer: "Ha egy feltételes kérdés el van rejtve (mert a trigger kérdésre 'Nem' volt a válasz), a defaultIfHidden érték automatikusan beíródik az Excel cellába. Alapértelmezetten 'N.z.' vagy '-' kerül be." },
    { id: "e3", category: "excel", question: "Mi az a cell_reference?", answer: "A cell_reference az Excel sablon cellájának hivatkozása (pl. 'Sheet1!B15'). Ez mondja meg, hogy egy adott válasz hova kerüljön az Excel-ben." },
    { id: "e4", category: "excel", question: "Hogyan működik az Excel parser?", answer: "Az Excel parser beolvassa a template fájlt, azonosítja a kérdéseket a megfelelő oszlopokból, és létrehozza a kérdés-konfigurációkat a cellahivatkozásokkal együtt." },
    { id: "e5", category: "excel", question: "Mi a unified template?", answer: "A unified template egy Excel fájl, amely egyszerre tartalmazza a kérdéseket ÉS a protokoll sablont. Ez egyszerűsíti a template kezelést." },
    { id: "er1", category: "errors", question: "Hogyan dokumentálhatok hibát?", answer: "A 'Hibák' menüpontban az 'Új hiba' gombra kattintva rögzíthetsz hibát. Megadhatod a hiba leírását, helyét, súlyosságát és fényképet is csatolhatsz." },
    { id: "er2", category: "errors", question: "Hogyan csatolhatok képet a hibához?", answer: "A hiba szerkesztésénél a 'Kép hozzáadása' gombra kattintva feltölthetsz képet a galériából vagy készíthetsz új fotót a kamerával." },
    { id: "er3", category: "errors", question: "Mi az a hibalista PDF?", answer: "A hibalista PDF egy automatikusan generált dokumentum, amely tartalmazza az összes rögzített hibát részletes leírással, képekkel és súlyossági szinttel. A jsPDF könyvtár generálja Unicode támogatással." },
    { id: "er4", category: "errors", question: "Milyen súlyossági szintek vannak?", answer: "3 szint: Kritikus (azonnal javítandó), Közepes (rövid időn belül), Alacsony (később is javítható). A színkódolás: piros, sárga, zöld." },
    { id: "c1", category: "conditional", question: "Mi az a feltételes kérdés?", answer: "A feltételes kérdések csak akkor jelennek meg, ha egy korábbi (trigger) kérdésre 'Igen' választ adtál. Ha 'Nem' a válasz, a kapcsolódó kérdések automatikusan elrejtődnek." },
    { id: "c2", category: "conditional", question: "Mi történik az elrejtett kérdésekkel az Excelben?", answer: "Az elrejtett kérdések cellái automatikusan kitöltődnek a defaultIfHidden értékkel (általában 'N.z.' vagy '-'). Ez biztosítja, hogy az Excel teljesen kitöltött legyen." },
    { id: "c3", category: "conditional", question: "Mi az a conditional_group_key?", answer: "A conditional_group_key azonosítja a feltételes kérdéscsoportot. Ha egy trigger kérdés Igen választ kap, az azonos conditional_group_key-jel rendelkező kérdések megjelennek." },
    { id: "c4", category: "conditional", question: "Hogyan működik a group_key szűrés?", answer: "A group_key alapján szűrheted a kérdéseket lift típusonként. Például a 'modernization' group_key csak MOD típusú lifteknél jelenik meg." }
  ],
  de: [
    { id: "g1", category: "general", question: "Was ist das APROD-System?", answer: "APROD (Acceptance Protocol Document) ist ein digitales Abnahmeprotokollsystem für OTIS-Aufzüge. Es führt Sie Schritt für Schritt durch den Abnahmeprozess, dokumentiert Fehler und generiert die erforderlichen PDF/Excel-Dokumente." },
    { id: "g2", category: "general", question: "Wie wechsle ich die Sprache?", answer: "Klicken Sie auf das Flaggensymbol in der oberen rechten Ecke, um aus 5 verfügbaren Sprachen zu wählen: Ungarisch, Deutsch, Englisch, Französisch, Italienisch." },
    { id: "g3", category: "general", question: "Wie speichere ich ein Protokoll?", answer: "Das System speichert Daten automatisch nach jeder Änderung. Mit der Schaltfläche 'Speichern' können Sie auch manuell speichern. Protokolle werden auf dem Server und lokal gespeichert." },
    { id: "g4", category: "general", question: "Was ist eine PWA und wie installiere ich sie?", answer: "Die PWA (Progressive Web App) ermöglicht die Installation als Anwendung. In Chrome/Edge klicken Sie auf das 'Installieren'-Symbol in der Adressleiste, auf Mobilgeräten nutzen Sie 'Zum Startbildschirm hinzufügen'." },
    { id: "g5", category: "general", question: "Funktioniert die Anwendung offline?", answer: "Ja! Dank PWA-Technologie funktioniert die Anwendung offline. Daten werden im LocalStorage gespeichert und bei der nächsten Online-Verbindung synchronisiert." },
    { id: "p1", category: "protocol", question: "Wie viele Seiten hat ein Protokoll?", answer: "Das Protokoll besteht aus 5 Hauptseiten: 1) Allgemeine Daten, 2) Technische Prüfung, 3) Modernisierung, 4) Messungen, 5) Niedervolt-Messungen. Danach folgen Unterschrift und Fehlerdokumentation." },
    { id: "p2", category: "protocol", question: "Was bedeutet 'N.z.'?", answer: "'N.z.' (Nicht zutreffend) bedeutet, dass die Frage für den aktuellen Aufzugstyp nicht relevant ist. Wählen Sie dies, wenn die Frage nicht auf den geprüften Aufzug zutrifft." },
    { id: "p3", category: "protocol", question: "Welche Aufzugstypen unterstützt das System?", answer: "4 Haupttypen: MOD (Modernisierung), BEX (Einbau), NEU (Neu), EGYEDI (Individuell). Jeder Typ kann Untertypen haben, die verschiedene Fragenkataloge laden." },
    { id: "p4", category: "protocol", question: "Wie wähle ich den richtigen Aufzugstyp?", answer: "Auf dem 'Aufzugstyp-Auswahl'-Bildschirm wählen Sie den Haupttyp (z.B. MOD) und dann den Untertyp (falls vorhanden). Das System lädt automatisch den entsprechenden Fragenkatalog und die Excel-Vorlage." },
    { id: "p5", category: "protocol", question: "Was passiert, wenn ich den falschen Typ gewählt habe?", answer: "Sie können zum Auswahlbildschirm zurückkehren und den Typ ändern. Achtung: Dies löscht bereits beantwortete Fragen!" },
    { id: "m1", category: "measurements", question: "Welche Messwerte sind anzugeben?", answer: "Auf der Messseite müssen Isolationswiderstand, Erdungswiderstand und andere elektrische Parameter erfasst werden. Für jede Messung gibt es einen akzeptablen Bereich, den das System automatisch überprüft." },
    { id: "m2", category: "measurements", question: "Was passiert bei fehlerhaften Messwerten?", answer: "Wenn ein Messwert außerhalb des akzeptablen Bereichs liegt, markiert das System ihn mit rotem Hintergrund und fügt ihn dem Fehlerbericht hinzu." },
    { id: "m3", category: "measurements", question: "Was ist das Niedervolt-System?", answer: "Der Niedervolt-Bereich dient der Überprüfung von Sicherheitseinrichtungen. FI-Messungen, Isolationswiderstand und Erdungswiderstand müssen erfasst werden. Die Geräteliste wird aus der Excel-Vorlage geladen." },
    { id: "m4", category: "measurements", question: "Wie füge ich ein neues Gerät zur Niedervolt-Liste hinzu?", answer: "Klicken Sie auf die '+'-Schaltfläche auf der Niedervolt-Seite. Sie können benutzerdefinierte Geräte hinzufügen, die automatisch mit Excel synchronisiert werden." },
    { id: "m5", category: "measurements", question: "Was ist Erdungskontrolle?", answer: "Erdungskontrolle ist ein dediziertes Modul, das Erdungsmessungen im PDF-Format dokumentiert. Es verfügt über einen separaten Fragenkatalog und generiert eine eigene PDF." },
    { id: "e1", category: "excel", question: "Wie werden Excel-Zellen ausgefüllt?", answer: "Das System trägt Antworten automatisch in die entsprechenden Zellen der Excel-Vorlage ein. 'Ja' schreibt ein 'X' in die entsprechende Spalte." },
    { id: "e2", category: "excel", question: "Was ist defaultIfHidden?", answer: "Wenn eine bedingte Frage ausgeblendet ist, wird der defaultIfHidden-Wert automatisch in die Excel-Zelle eingetragen. Standardmäßig ist dies 'N.z.' oder '-'." },
    { id: "e3", category: "excel", question: "Was ist cell_reference?", answer: "Die cell_reference ist der Verweis auf die Excel-Zelle (z.B. 'Sheet1!B15'). Sie bestimmt, wohin eine bestimmte Antwort in Excel geschrieben wird." },
    { id: "e4", category: "excel", question: "Wie funktioniert der Excel-Parser?", answer: "Der Excel-Parser liest die Vorlagendatei ein, identifiziert Fragen in den entsprechenden Spalten und erstellt Fragenkonfigurationen mit Zellverweisen." },
    { id: "e5", category: "excel", question: "Was ist ein Unified Template?", answer: "Ein Unified Template ist eine Excel-Datei, die sowohl Fragen ALS AUCH die Protokollvorlage enthält. Dies vereinfacht die Template-Verwaltung." },
    { id: "er1", category: "errors", question: "Wie dokumentiere ich einen Fehler?", answer: "Im Menü 'Fehler' können Sie mit 'Neuer Fehler' einen Fehler erfassen. Sie können Beschreibung, Ort, Schweregrad und Fotos hinzufügen." },
    { id: "er2", category: "errors", question: "Wie füge ich ein Foto zum Fehler hinzu?", answer: "Bei der Fehlerbearbeitung klicken Sie auf 'Bild hinzufügen', um ein Foto aus der Galerie hochzuladen oder ein neues aufzunehmen." },
    { id: "er3", category: "errors", question: "Was ist die Fehlerliste-PDF?", answer: "Die Fehlerliste-PDF ist ein automatisch generiertes Dokument mit allen erfassten Fehlern, detaillierten Beschreibungen, Bildern und Schweregraden. Generiert von jsPDF mit Unicode-Unterstützung." },
    { id: "er4", category: "errors", question: "Welche Schweregrade gibt es?", answer: "3 Stufen: Kritisch (sofort beheben), Mittel (kurzfristig), Niedrig (später beheben). Farbcodierung: rot, gelb, grün." },
    { id: "c1", category: "conditional", question: "Was ist eine bedingte Frage?", answer: "Bedingte Fragen erscheinen nur, wenn Sie auf eine vorherige (Trigger-)Frage mit 'Ja' geantwortet haben. Bei 'Nein' werden die zugehörigen Fragen automatisch ausgeblendet." },
    { id: "c2", category: "conditional", question: "Was passiert mit ausgeblendeten Fragen in Excel?", answer: "Ausgeblendete Fragenzellen werden automatisch mit dem defaultIfHidden-Wert gefüllt (normalerweise 'N.z.' oder '-')." },
    { id: "c3", category: "conditional", question: "Was ist conditional_group_key?", answer: "Der conditional_group_key identifiziert bedingte Fragengruppen. Wenn eine Trigger-Frage mit Ja beantwortet wird, erscheinen Fragen mit demselben conditional_group_key." },
    { id: "c4", category: "conditional", question: "Wie funktioniert die group_key-Filterung?", answer: "Mit group_key können Fragen nach Aufzugstyp gefiltert werden. Zum Beispiel erscheint 'modernization' group_key nur bei MOD-Typ-Aufzügen." }
  ],
  en: [
    { id: "g1", category: "general", question: "What is the APROD system?", answer: "APROD (Acceptance Protocol Document) is a digital acceptance protocol system for OTIS elevators. It guides you step-by-step through the acceptance process, documents errors, and generates the required PDF/Excel documents." },
    { id: "g2", category: "general", question: "How do I change the language?", answer: "Click on the flag icon in the top right corner to choose from 5 available languages: Hungarian, German, English, French, Italian." },
    { id: "g3", category: "general", question: "How do I save a protocol?", answer: "The system automatically saves data after every change. You can also manually save using the 'Save' button. Protocols are stored on the server and locally." },
    { id: "g4", category: "general", question: "What is a PWA and how do I install it?", answer: "PWA (Progressive Web App) allows you to install the system as an application. In Chrome/Edge, click the 'Install' icon in the address bar, on mobile use 'Add to Home Screen'." },
    { id: "g5", category: "general", question: "Does the application work offline?", answer: "Yes! Thanks to PWA technology, the application works offline. Data is stored in LocalStorage and synchronized on the next online connection." },
    { id: "p1", category: "protocol", question: "How many pages does a protocol have?", answer: "The protocol consists of 5 main pages: 1) General Data, 2) Technical Inspection, 3) Modernization, 4) Measurements, 5) Low Voltage Measurements. Then signature and error documentation follow." },
    { id: "p2", category: "protocol", question: "What does 'N/A' mean?", answer: "'N/A' (Not Applicable) means the question is not relevant for the current elevator type. Select this if the question doesn't apply to the elevator being inspected." },
    { id: "p3", category: "protocol", question: "What elevator types does the system support?", answer: "4 main types: MOD (Modernization), BEX (Built-in), NEU (New), EGYEDI (Custom). Each type can have subtypes that load different question templates." },
    { id: "p4", category: "protocol", question: "How do I select the correct elevator type?", answer: "On the 'Elevator Type Selection' screen, choose the main type (e.g., MOD), then the subtype (if available). The system automatically loads the appropriate question template and Excel template." },
    { id: "p5", category: "protocol", question: "What happens if I selected the wrong type?", answer: "You can return to the selection screen and change the type. Warning: This will delete already answered questions!" },
    { id: "m1", category: "measurements", question: "What measurement values need to be entered?", answer: "On the measurements page, insulation resistance, grounding resistance, and other electrical parameters must be recorded. Each measurement has an acceptable range that the system automatically checks." },
    { id: "m2", category: "measurements", question: "What happens with incorrect measurement values?", answer: "If a measurement value falls outside the acceptable range, the system marks it with a red background and adds it to the error report." },
    { id: "m3", category: "measurements", question: "What is the Niedervolt system?", answer: "The Niedervolt section is used to check safety equipment. FI measurements, insulation resistance, and grounding resistance must be recorded. The device list is loaded from the Excel template." },
    { id: "m4", category: "measurements", question: "How do I add a new device to the Niedervolt list?", answer: "Click the '+' button on the Niedervolt page. You can add custom devices that automatically sync with Excel." },
    { id: "m5", category: "measurements", question: "What is Erdungskontrolle?", answer: "Erdungskontrolle (grounding control) is a dedicated module that documents grounding measurements in PDF format. It has a separate question template and generates its own PDF." },
    { id: "e1", category: "excel", question: "How are Excel cells filled?", answer: "The system automatically enters answers into the corresponding cells of the Excel template. 'Yes' writes an 'X' in the appropriate column." },
    { id: "e2", category: "excel", question: "What is defaultIfHidden?", answer: "When a conditional question is hidden, the defaultIfHidden value is automatically entered into the Excel cell. By default, this is 'N/A' or '-'." },
    { id: "e3", category: "excel", question: "What is cell_reference?", answer: "The cell_reference is the reference to the Excel cell (e.g., 'Sheet1!B15'). It determines where a specific answer is written in Excel." },
    { id: "e4", category: "excel", question: "How does the Excel parser work?", answer: "The Excel parser reads the template file, identifies questions in the appropriate columns, and creates question configurations with cell references." },
    { id: "e5", category: "excel", question: "What is a unified template?", answer: "A unified template is an Excel file that contains both questions AND the protocol template. This simplifies template management." },
    { id: "er1", category: "errors", question: "How do I document an error?", answer: "In the 'Errors' menu, click 'New Error' to record an error. You can add description, location, severity, and photos." },
    { id: "er2", category: "errors", question: "How do I attach a photo to an error?", answer: "When editing an error, click 'Add Image' to upload a photo from the gallery or take a new one with the camera." },
    { id: "er3", category: "errors", question: "What is the error list PDF?", answer: "The error list PDF is an automatically generated document containing all recorded errors with detailed descriptions, images, and severity levels. Generated by jsPDF with Unicode support." },
    { id: "er4", category: "errors", question: "What severity levels are there?", answer: "3 levels: Critical (fix immediately), Medium (fix soon), Low (fix later). Color coding: red, yellow, green." },
    { id: "c1", category: "conditional", question: "What is a conditional question?", answer: "Conditional questions only appear if you answered 'Yes' to a previous (trigger) question. If 'No', the related questions are automatically hidden." },
    { id: "c2", category: "conditional", question: "What happens to hidden questions in Excel?", answer: "Hidden question cells are automatically filled with the defaultIfHidden value (usually 'N/A' or '-')." },
    { id: "c3", category: "conditional", question: "What is conditional_group_key?", answer: "The conditional_group_key identifies conditional question groups. When a trigger question receives a Yes answer, questions with the same conditional_group_key appear." },
    { id: "c4", category: "conditional", question: "How does group_key filtering work?", answer: "With group_key, you can filter questions by elevator type. For example, the 'modernization' group_key only appears for MOD type elevators." }
  ],
  fr: [
    { id: "g1", category: "general", question: "Qu'est-ce que le système APROD?", answer: "APROD (Acceptance Protocol Document) est un système de protocole de réception numérique pour les ascenseurs OTIS. Il vous guide étape par étape dans le processus de réception, documente les erreurs et génère les documents PDF/Excel requis." },
    { id: "g2", category: "general", question: "Comment changer la langue?", answer: "Cliquez sur l'icône du drapeau en haut à droite pour choisir parmi 5 langues disponibles: Hongrois, Allemand, Anglais, Français, Italien." },
    { id: "g3", category: "general", question: "Comment sauvegarder un protocole?", answer: "Le système sauvegarde automatiquement les données après chaque modification. Vous pouvez également sauvegarder manuellement avec le bouton 'Sauvegarder'." },
    { id: "g4", category: "general", question: "Qu'est-ce qu'une PWA et comment l'installer?", answer: "La PWA (Progressive Web App) permet d'installer le système comme application. Dans Chrome/Edge, cliquez sur l'icône 'Installer' dans la barre d'adresse, sur mobile utilisez 'Ajouter à l'écran d'accueil'." },
    { id: "p1", category: "protocol", question: "Combien de pages compte un protocole?", answer: "Le protocole se compose de 5 pages principales: 1) Données générales, 2) Inspection technique, 3) Modernisation, 4) Mesures, 5) Mesures basse tension." },
    { id: "p2", category: "protocol", question: "Que signifie 'N/A'?", answer: "'N/A' (Non Applicable) signifie que la question n'est pas pertinente pour le type d'ascenseur actuel." },
    { id: "m1", category: "measurements", question: "Quelles valeurs de mesure faut-il saisir?", answer: "Sur la page des mesures, la résistance d'isolation, la résistance de terre et d'autres paramètres électriques doivent être enregistrés." },
    { id: "e1", category: "excel", question: "Comment les cellules Excel sont-elles remplies?", answer: "Le système entre automatiquement les réponses dans les cellules correspondantes du modèle Excel." },
    { id: "c1", category: "conditional", question: "Qu'est-ce qu'une question conditionnelle?", answer: "Les questions conditionnelles n'apparaissent que si vous avez répondu 'Oui' à une question précédente (déclencheur). Sinon, elles sont automatiquement masquées." }
  ],
  it: [
    { id: "g1", category: "general", question: "Cos'è il sistema APROD?", answer: "APROD (Acceptance Protocol Document) è un sistema di protocollo di accettazione digitale per gli ascensori OTIS. Ti guida passo dopo passo nel processo di accettazione, documenta gli errori e genera i documenti PDF/Excel richiesti." },
    { id: "g2", category: "general", question: "Come cambio la lingua?", answer: "Clicca sull'icona della bandiera in alto a destra per scegliere tra 5 lingue disponibili: Ungherese, Tedesco, Inglese, Francese, Italiano." },
    { id: "g3", category: "general", question: "Come salvo un protocollo?", answer: "Il sistema salva automaticamente i dati dopo ogni modifica. Puoi anche salvare manualmente usando il pulsante 'Salva'." },
    { id: "g4", category: "general", question: "Cos'è una PWA e come installarla?", answer: "La PWA (Progressive Web App) permette di installare il sistema come applicazione. In Chrome/Edge, clicca sull'icona 'Installa' nella barra degli indirizzi, su mobile usa 'Aggiungi alla schermata home'." },
    { id: "p1", category: "protocol", question: "Quante pagine ha un protocollo?", answer: "Il protocollo è composto da 5 pagine principali: 1) Dati generali, 2) Ispezione tecnica, 3) Modernizzazione, 4) Misurazioni, 5) Misurazioni bassa tensione." },
    { id: "p2", category: "protocol", question: "Cosa significa 'N/A'?", answer: "'N/A' (Non Applicabile) significa che la domanda non è rilevante per l'attuale tipo di ascensore." },
    { id: "m1", category: "measurements", question: "Quali valori di misura devono essere inseriti?", answer: "Nella pagina delle misurazioni, devono essere registrati resistenza di isolamento, resistenza di terra e altri parametri elettrici." },
    { id: "e1", category: "excel", question: "Come vengono riempite le celle Excel?", answer: "Il sistema inserisce automaticamente le risposte nelle celle corrispondenti del modello Excel." },
    { id: "c1", category: "conditional", question: "Cos'è una domanda condizionale?", answer: "Le domande condizionali appaiono solo se hai risposto 'Sì' a una domanda precedente (trigger). Altrimenti vengono automaticamente nascoste." }
  ]
};

export const systemPromptForAI = `Te egy OTIS lift átvételi protokoll (APROD) rendszer intelligens segítője vagy. 
Segíted a felhasználókat a protokoll kitöltésében, a mérések értelmezésében és a rendszer használatában.

# RENDSZER ÁTTEKINTÉS

Az APROD (Acceptance Protocol Document) egy teljes körű TypeScript Progressive Web Application (PWA), amely digitalizálja az OTIS lift átvételi protokoll folyamatot.

## FŐ CÉLOK:
- Papíralapú protokollok digitalizálása
- Átvételi folyamat egyszerűsítése OTIS technikusok számára
- Automatikus dokumentum generálás (Excel, PDF)
- Teljes többnyelvű támogatás (Magyar, Német, Angol, Francia, Olasz)
- Mobil-első tervezés (tablet és okostelefon optimalizált)
- Offline képesség (LocalStorage perzisztencia)

## TECHNOLÓGIAI STACK:

### Frontend:
- React 18 TypeScript-tel
- Vite build tool
- TailwindCSS + Shadcn/ui komponensek
- TanStack Query v5 (szerver állapot kezelés)
- Wouter (routing)
- Capacitor (natív mobil app wrapper)

### Backend:
- Node.js + Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon serverless)
- Supabase (Auth + Storage)
- Zod validáció

### Dokumentum Generálás:
- ExcelJS (Excel manipuláció)
- jsPDF (PDF generálás Unicode támogatással)
- pdf-lib (PDF form kitöltés)
- LibreOffice (Excel → PDF konverzió headless módban)

## PROTOKOLL STRUKTÚRA (5 FŐ OLDAL):

1. **Általános Adatok (General Data)**
   - Átvétel dátuma
   - Helyszín
   - Ügyfél adatok
   - Lift típus és altípus választás

2. **Műszaki Ellenőrzés (Technical Inspection)**
   - Lift komponensek vizsgálata
   - Biztonsági berendezések ellenőrzése
   - Igen/Nem/N.A. kérdések

3. **Modernizáció (Modernization)**
   - Csak MOD típusú lifteknél jelenik meg
   - Modernizációs munkák dokumentálása
   - Feltételes kérdések group_key alapján

4. **Mérések (Measurements)**
   - Szigetelési ellenállás
   - Földelési ellenállás
   - Elektromos paraméterek
   - Automatikus validáció tartományokkal

5. **Niedervolt Mérések (Low Voltage Measurements)**
   - FI (Residual Current) mérések
   - Biztonsági eszközök listája
   - Eszköz hozzáadás/törlés
   - Excel szinkronizáció

## LIFT TÍPUSOK:

1. **MOD (Modernization)** - Modernizációs projektek
2. **BEX (Built-in/Beépített)** - Beépített liftek
3. **NEU (New/Új)** - Új lift telepítések
4. **EGYEDI (Custom)** - Egyedi konfigurációk

Minden típusnak lehetnek **altípusai**, amelyek különböző:
- Kérdéssablonokat töltenek be
- Excel template-eket használnak
- group_key szerinti kérdésszűrést alkalmaznak

## KÉRDÉSTÍPUSOK:

1. **yes_no_na** - Igen/Nem/N.A. gombok
   - Excel mapping: "Igen" oszlopba "X", "Nem" oszlopba "X", vagy "N.A."

2. **text** - Szöveges beviteli mező
   - Közvetlenül beíródik az Excel cellába

3. **select** - Legördülő menü
   - Előre definiált opciók közül választás

4. **number** - Numerikus mező
   - Mértékegység automatikus hozzáadással

5. **measurement** - Mérési blokk
   - Validációs tartományokkal (min/max)
   - Hibás érték → piros háttér + automatikus hibajelentés

6. **calculated** - Számított mező
   - Automatikusan kitöltődik más mezők alapján
   - Nem szerkeszthető manuálisan

## FELTÉTELES KÉRDÉSEK RENDSZER:

### Hogyan működik:
1. **Trigger kérdés** "Igen" válasz esetén:
   - Megjelennek a kapcsolódó kérdések (azonos conditional_group_key)

2. **Trigger kérdés** "Nem" válasz esetén:
   - Kapcsolódó kérdések elrejtődnek
   - Excel cellák automatikusan kitöltődnek defaultIfHidden értékkel (általában "N.z." vagy "-")

### Példa:
Kérdés: "Van vészvilágítás?" → Igen
  ├─ "Vészvilágítás típusa?" (megjelenik)
  ├─ "Vészvilágítás működik?" (megjelenik)
  └─ "Akkumulátor állapota?" (megjelenik)

Kérdés: "Van vészvilágítás?" → Nem
  └─ Minden kapcsolódó kérdés elrejtve, Excel-ben "N.z."

## GROUP_KEY RENDSZER:

A group_key lift típus szerinti kérdésszűrésre szolgál:

- **"general"** - Minden lift típusnál megjelenik
- **"modernization"** - Csak MOD típusnál
- **"new_installation"** - Csak NEU típusnál
- **"built_in"** - Csak BEX típusnál

## EXCEL INTEGRÁCIÓ:

### Cell Reference Mapping:
cell_reference: "Sheet1!B15"
(Sheet1 = munkalap neve, B15 = cella hivatkozás)

### Unified Template:
- Egyetlen Excel fájl tartalmazza:
  1. Kérdésdefiníciókat (questions oszlopok)
  2. Protokoll sablont (kitöltendő űrlap)

### Excel Parser működése:
1. Beolvassa a template fájlt
2. Azonosítja a kérdéseket meghatározott oszlopokból
3. Kinyeri a cellahivatkozásokat
4. Létrehozza a question_configs rekordokat az adatbázisban

### Automatikus kitöltés:
- **yes_no_na**: "X" kerül a megfelelő oszlopba
- **text/select**: Közvetlenül a cellába írva
- **measurement**: Numerikus érték + egység
- **conditional (hidden)**: defaultIfHidden érték

## NIEDERVOLT RENDSZER:

### Eszközkezelés:
- Eszközök listája Excel template-ből töltődik
- Új eszköz hozzáadása: "+" gomb
- Eszköz törlése: szinkronizáció Excel-lel

### FI Mérések:
- mA-ben mérve
- Validációs tartományok az Excel-ben definiálva
- Hibás érték → piros jelzés + hibajelentés

### Adatszinkronizáció:
- Valós idejű szinkronizáció frontend ↔ backend
- LocalStorage cache offline módhoz

## ERDUNGSKONTROLLE (FÖLDELÉS ELLENŐRZÉS):

Dedikált modul földelési mérések dokumentálására:
- Saját kérdéssablon (questions_grounding_*.json)
- Külön PDF generálás (pdf-lib-based form filling)
- Mérési eredmények táblázatos megjelenítése

## HIBAMANAGEMENT:

### Hiba Típusok:
1. **Manuális hibák** - Technikus által rögzített
2. **Automatikus hibák** - Rossz mérési értékekből generált

### Hiba Adatok:
- id: string
- title: string
- description: string
- location?: string
- severity: "critical" | "medium" | "low"
- images: string[] (Base64 vagy Supabase URL-ek)
- created_at: timestamp

### Hibalista PDF:
- jsPDF generálás Unicode támogatással
- Tartalmaz: címet, leírást, helyet, súlyosságot, képeket
- Színkódolás: piros (kritikus), sárga (közepes), zöld (alacsony)

## DIGITÁLIS ALÁÍRÁS:

### Működés:
1. Canvas-based aláírás rajzolás (ujj vagy egér)
2. Base64 PNG-vé konvertálás
3. Tárolás protokoll rekordban
4. Beágyazás Excel-be és PDF-be

### Tippek:
- Mobilon fekvő mód ajánlott
- Tiszta háttér fehér vagy átlátszó
- Érintőceruza használható

## DOKUMENTUM GENERÁLÁS:

### Excel Generálás:
1. Template betöltése (ExcelJS)
2. Válaszok beírása cell_reference alapján
3. Aláírás beillesztése (képként)
4. Fájl letöltés: AP_[dátum]_[helyszín].xlsx

### PDF Generálás:
1. **Protokoll PDF**: Excel → LibreOffice headless konverzió
2. **Hibalista PDF**: jsPDF direkt generálás
3. **Erdungskontrolle PDF**: pdf-lib form filling

### Fájlnév Formátum:
AP_20260205_Budapest_Szererviz_Otthon.xlsx
AP_20260205_Budapest_Szererviz_Otthon.pdf
AP_20260205_Hibak.pdf

## EMAIL RENDSZER:

### Email Küldés:
- Nodemailer + Gmail SMTP
- 5 nyelven elérhető email template-ek
- Melléklet választó (Excel, Protokoll PDF, Hibalista PDF)

### Email Tartalom:
Tárgy: OTIS Átvételi Protokoll - [Helyszín] - [Dátum]

Mellékletként megtalálja:
- Kitöltött protokoll (Excel)
- Protokoll PDF
- Hibalista PDF (ha vannak hibák)

## ADMIN FUNKCIÓK:

### Template Kezelés:
- Excel sablonok feltöltése
- Aktív sablon kiválasztása
- Cache ürítés
- Template törlés

### Felhasználókezelés:
- Új felhasználók meghívása
- Jogosultságok beállítása (admin/user)
- Felhasználók inaktiválása
- Profil adatok szerkesztése

### Lift Típusok:
- Új típusok/altípusok hozzáadása
- Template mapping beállítása
- Megjelenési sorrend módosítása
- Típusok törlése

## AUTHENTIKÁCIÓ:

### Supabase Auth:
- Email/jelszó alapú bejelentkezés
- JWT token alapú session kezelés
- Jelszó visszaállítás email-ben

### Szerepkörök:
- **admin**: Teljes hozzáférés + admin funkciók
- **user**: Protokollok létrehozása/szerkesztése

## OFFLINE MŰKÖDÉS:

### PWA Funkciók:
- Service Worker cache-eléssel
- LocalStorage adatperzisztencia
- Automatikus szinkronizáció online módban

### Telepítés:
- Chrome/Edge: "Telepítés" ikon a címsorban
- Mobil: "Hozzáadás a kezdőképernyőhöz"

## BILLENTYŰPARANCSOK:

- **Ctrl + S**: Mentés
- **Ctrl + P**: PDF nyomtatás
- **Esc**: Felugró ablak bezárása
- **Tab**: Következő mezőre ugrás
- **← / →**: Előző/következő szakasz
- **Home**: Első szakasz
- **End**: Utolsó szakasz

## HIBAELHÁRÍTÁS:

### Gyakori problémák:

1. **"Nem töltődik be az oldal"**
   - Internetkapcsolat ellenőrzése
   - F5 frissítés
   - Böngésző cache törlése

2. **"Nem tudom menteni a protokollt"**
   - Bejelentkezés ellenőrzése
   - Néhány másodperc várakozás
   - Kapcsolat felvétel támogatással

3. **"PDF generálás sikertelen"**
   - Kötelező mezők kitöltése
   - Újrapróbálkozás
   - Nagy fájlméretnél türelem

4. **"Nem látom a kérdéseket"**
   - Lift típus ellenőrzése
   - Aktív sablon meglétének ellenőrzése
   - Admin kapcsolatfelvétel

## API VÉGPONTOK:

### Authentikáció:
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- POST /api/auth/forgot-password

### Protokollok:
- GET /api/protocols
- GET /api/protocols/:id
- POST /api/protocols
- PUT /api/protocols/:id
- DELETE /api/protocols/:id
- POST /api/protocols/:id/complete
- GET /api/protocols/:id/download-excel
- GET /api/protocols/:id/download-pdf

### Admin:
- GET /api/admin/templates
- POST /api/admin/templates
- POST /api/admin/templates/:id/activate
- GET /api/admin/lift-types
- POST /api/admin/lift-types

### Kérdések:
- GET /api/questions/:language
- GET /api/questions/:language?templateId=:id

## ADATVÉDELEM:

- Adatok titkosítva tárolva (PostgreSQL + Supabase)
- JWT token alapú biztonság
- GDPR megfelelőség
- Adattörlési kérelem: support@otis.com

## VERZIÓ INFORMÁCIÓ:

Jelenlegi verzió: **v0.9.6 (2024)**

Főbb változások:
- Classic theme OTIS logo home button
- Nyelv indikátor pontok
- Email címzett auto-fill
- 5 nyelv teljes támogatása

---

## VÁLASZADÁSI STÍLUS:

Amikor a felhasználó kérdez:
1. **Röviden és lényegre törően** válaszolj
2. **Konkrét példákkal** illusztráld
3. **Lépésről lépésre** magyarázd a folyamatokat
4. **Technikai részletek** csak kérésre
5. **A felhasználó nyelvén** kommunikálj (magyar, német, angol, francia, olasz)
6. **Ha nem tudsz válaszolni**, mondd el őszintén és ajánld a dokumentációt vagy a support-ot

## PÉLDA VÁLASZOK:

**Felhasználó**: "Hogyan adhatok hozzá új hibát?"
**AI**: "Új hiba hozzáadásához kövesd ezeket a lépéseket:
1. Navigálj a 'Hibák' menüpontba
2. Kattints az 'Új hiba' gombra
3. Töltsd ki a kötelező mezőket: cím, leírás, súlyosság
4. Opcionálisan adj hozzá képeket a 'Kép hozzáadása' gombbal
5. Mentsd el a hibát

A hiba automatikusan bekerül a hibajelentésbe és a hibalista PDF-be is."

**Felhasználó**: "Miért nem jelenik meg egy kérdés?"
**AI**: "Ha egy kérdés nem jelenik meg, az valószínűleg azért van, mert feltételes kérdésről van szó. Ellenőrizd a kapcsolódó 'trigger' kérdést:
- Ha a trigger kérdésre 'Nem' volt a válasz, a kapcsolódó kérdések automatikusan elrejtődnek
- Például: 'Van vészvilágítás?' → Nem → a vészvilágítás részletes kérdései nem jelennek meg
- Változtasd a trigger kérdés válaszát 'Igen'-re, és a kapcsolódó kérdések megjelennek"

Mindig segítőkész, proaktív és felhasználóbarát vagy. Ha bizonytalan vagy valamiben, inkább kérdezz vissza!`;
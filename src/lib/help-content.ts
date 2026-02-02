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
    { id: "p1", category: "protocol", question: "Hány oldala van egy protokollnak?", answer: "A protokoll 5 fő oldalból áll: 1) Általános adatok, 2) Műszaki ellenőrzés, 3) Modernizáció, 4) Mérések, 5) Niedervolt mérések. Ezután következik az aláírás és a hibák dokumentálása." },
    { id: "p2", category: "protocol", question: "Mit jelent a 'N.z.' válaszlehetőség?", answer: "A 'N.z.' (Nem alkalmazható / Nicht zutreffend) azt jelenti, hogy az adott kérdés nem releváns az aktuális lift típusánál. Ezt válaszd, ha a kérdés nem vonatkozik a vizsgált liftre." },
    { id: "m1", category: "measurements", question: "Milyen mérési értékeket kell megadni?", answer: "A mérések oldalon szigetelési ellenállás, földelési ellenállás, és egyéb elektromos paramétereket kell rögzíteni. Minden méréshez tartozik egy elfogadható tartomány, amit a rendszer automatikusan ellenőriz." },
    { id: "m2", category: "measurements", question: "Mi történik hibás mérési értéknél?", answer: "Ha egy mérési érték kívül esik az elfogadható tartományon, a rendszer automatikusan piros háttérrel jelzi és hozzáadja a hibajelentéshez. A mért érték és a határértékek is megjelennek." },
    { id: "e1", category: "excel", question: "Hogyan töltődnek ki az Excel cellák?", answer: "A rendszer automatikusan beírja a válaszokat az Excel sablon megfelelő celláiba. Az 'Igen' válasz 'X'-et ír a megfelelő oszlopba, a szöveges válaszok közvetlenül bekerülnek a cellákba." },
    { id: "e2", category: "excel", question: "Mi az a defaultIfHidden?", answer: "Ha egy feltételes kérdés el van rejtve (mert a trigger kérdésre 'Nem' volt a válasz), a defaultIfHidden érték automatikusan beíródik az Excel cellába. Alapértelmezetten 'N.z.' vagy '-' kerül be." },
    { id: "er1", category: "errors", question: "Hogyan dokumentálhatok hibát?", answer: "A 'Hibák' menüpontban az 'Új hiba' gombra kattintva rögzíthetsz hibát. Megadhatod a hiba leírását, helyét, súlyosságát és fényképet is csatolhatsz." },
    { id: "er2", category: "errors", question: "Hogyan csatolhatok képet a hibához?", answer: "A hiba szerkesztésénél a 'Kép hozzáadása' gombra kattintva feltölthetsz képet a galériából vagy készíthetsz új fotót a kamerával." },
    { id: "c1", category: "conditional", question: "Mi az a feltételes kérdés?", answer: "A feltételes kérdések csak akkor jelennek meg, ha egy korábbi (trigger) kérdésre 'Igen' választ adtál. Ha 'Nem' a válasz, a kapcsolódó kérdések automatikusan elrejtődnek." },
    { id: "c2", category: "conditional", question: "Mi történik az elrejtett kérdésekkel az Excelben?", answer: "Az elrejtett kérdések cellái automatikusan kitöltődnek a defaultIfHidden értékkel (általában 'N.z.' vagy '-'). Ez biztosítja, hogy az Excel teljesen kitöltött legyen." }
  ],
  de: [
    { id: "g1", category: "general", question: "Was ist das APROD-System?", answer: "APROD (Acceptance Protocol Document) ist ein digitales Abnahmeprotokollsystem für OTIS-Aufzüge. Es führt Sie Schritt für Schritt durch den Abnahmeprozess, dokumentiert Fehler und generiert die erforderlichen PDF/Excel-Dokumente." },
    { id: "g2", category: "general", question: "Wie wechsle ich die Sprache?", answer: "Klicken Sie auf das Flaggensymbol in der oberen rechten Ecke, um aus 5 verfügbaren Sprachen zu wählen: Ungarisch, Deutsch, Englisch, Französisch, Italienisch." },
    { id: "g3", category: "general", question: "Wie speichere ich ein Protokoll?", answer: "Das System speichert Daten automatisch nach jeder Änderung. Mit der Schaltfläche 'Speichern' können Sie auch manuell speichern. Protokolle werden auf dem Server und lokal gespeichert." },
    { id: "p1", category: "protocol", question: "Wie viele Seiten hat ein Protokoll?", answer: "Das Protokoll besteht aus 5 Hauptseiten: 1) Allgemeine Daten, 2) Technische Prüfung, 3) Modernisierung, 4) Messungen, 5) Niedervolt-Messungen. Danach folgen Unterschrift und Fehlerdokumentation." },
    { id: "p2", category: "protocol", question: "Was bedeutet 'N.z.'?", answer: "'N.z.' (Nicht zutreffend) bedeutet, dass die Frage für den aktuellen Aufzugstyp nicht relevant ist. Wählen Sie dies, wenn die Frage nicht auf den geprüften Aufzug zutrifft." },
    { id: "m1", category: "measurements", question: "Welche Messwerte sind anzugeben?", answer: "Auf der Messseite müssen Isolationswiderstand, Erdungswiderstand und andere elektrische Parameter erfasst werden. Für jede Messung gibt es einen akzeptablen Bereich, den das System automatisch überprüft." },
    { id: "m2", category: "measurements", question: "Was passiert bei fehlerhaften Messwerten?", answer: "Wenn ein Messwert außerhalb des akzeptablen Bereichs liegt, markiert das System ihn mit rotem Hintergrund und fügt ihn dem Fehlerbericht hinzu." },
    { id: "e1", category: "excel", question: "Wie werden Excel-Zellen ausgefüllt?", answer: "Das System trägt Antworten automatisch in die entsprechenden Zellen der Excel-Vorlage ein. 'Ja' schreibt ein 'X' in die entsprechende Spalte." },
    { id: "e2", category: "excel", question: "Was ist defaultIfHidden?", answer: "Wenn eine bedingte Frage ausgeblendet ist, wird der defaultIfHidden-Wert automatisch in die Excel-Zelle eingetragen. Standardmäßig ist dies 'N.z.' oder '-'." },
    { id: "er1", category: "errors", question: "Wie dokumentiere ich einen Fehler?", answer: "Im Menü 'Fehler' können Sie mit 'Neuer Fehler' einen Fehler erfassen. Sie können Beschreibung, Ort, Schweregrad und Fotos hinzufügen." },
    { id: "c1", category: "conditional", question: "Was ist eine bedingte Frage?", answer: "Bedingte Fragen erscheinen nur, wenn Sie auf eine vorherige (Trigger-)Frage mit 'Ja' geantwortet haben. Bei 'Nein' werden die zugehörigen Fragen automatisch ausgeblendet." },
    { id: "c2", category: "conditional", question: "Was passiert mit ausgeblendeten Fragen in Excel?", answer: "Ausgeblendete Fragenzellen werden automatisch mit dem defaultIfHidden-Wert gefüllt (normalerweise 'N.z.' oder '-')." }
  ],
  en: [
    { id: "g1", category: "general", question: "What is the APROD system?", answer: "APROD (Acceptance Protocol Document) is a digital acceptance protocol system for OTIS elevators. It guides you step-by-step through the acceptance process, documents errors, and generates the required PDF/Excel documents." },
    { id: "g2", category: "general", question: "How do I change the language?", answer: "Click on the flag icon in the top right corner to choose from 5 available languages: Hungarian, German, English, French, Italian." },
    { id: "g3", category: "general", question: "How do I save a protocol?", answer: "The system automatically saves data after every change. You can also manually save using the 'Save' button. Protocols are stored on the server and locally." },
    { id: "p1", category: "protocol", question: "How many pages does a protocol have?", answer: "The protocol consists of 5 main pages: 1) General Data, 2) Technical Inspection, 3) Modernization, 4) Measurements, 5) Low Voltage Measurements. Then signature and error documentation follow." },
    { id: "p2", category: "protocol", question: "What does 'N/A' mean?", answer: "'N/A' (Not Applicable) means the question is not relevant for the current elevator type. Select this if the question doesn't apply to the elevator being inspected." },
    { id: "m1", category: "measurements", question: "What measurement values need to be entered?", answer: "On the measurements page, insulation resistance, grounding resistance, and other electrical parameters must be recorded. Each measurement has an acceptable range that the system automatically checks." },
    { id: "m2", category: "measurements", question: "What happens with incorrect measurement values?", answer: "If a measurement value falls outside the acceptable range, the system marks it with a red background and adds it to the error report." },
    { id: "e1", category: "excel", question: "How are Excel cells filled?", answer: "The system automatically enters answers into the corresponding cells of the Excel template. 'Yes' writes an 'X' in the appropriate column." },
    { id: "e2", category: "excel", question: "What is defaultIfHidden?", answer: "When a conditional question is hidden, the defaultIfHidden value is automatically entered into the Excel cell. By default, this is 'N/A' or '-'." },
    { id: "er1", category: "errors", question: "How do I document an error?", answer: "In the 'Errors' menu, click 'New Error' to record an error. You can add description, location, severity, and photos." },
    { id: "c1", category: "conditional", question: "What is a conditional question?", answer: "Conditional questions only appear if you answered 'Yes' to a previous (trigger) question. If 'No', the related questions are automatically hidden." },
    { id: "c2", category: "conditional", question: "What happens to hidden questions in Excel?", answer: "Hidden question cells are automatically filled with the defaultIfHidden value (usually 'N/A' or '-')." }
  ],
  fr: [
    { id: "g1", category: "general", question: "Qu'est-ce que le système APROD?", answer: "APROD (Acceptance Protocol Document) est un système de protocole de réception numérique pour les ascenseurs OTIS. Il vous guide étape par étape dans le processus de réception, documente les erreurs et génère les documents PDF/Excel requis." },
    { id: "g2", category: "general", question: "Comment changer la langue?", answer: "Cliquez sur l'icône du drapeau en haut à droite pour choisir parmi 5 langues disponibles: Hongrois, Allemand, Anglais, Français, Italien." },
    { id: "g3", category: "general", question: "Comment sauvegarder un protocole?", answer: "Le système sauvegarde automatiquement les données après chaque modification. Vous pouvez également sauvegarder manuellement avec le bouton 'Sauvegarder'." },
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
    { id: "p1", category: "protocol", question: "Quante pagine ha un protocollo?", answer: "Il protocollo è composto da 5 pagine principali: 1) Dati generali, 2) Ispezione tecnica, 3) Modernizzazione, 4) Misurazioni, 5) Misurazioni bassa tensione." },
    { id: "p2", category: "protocol", question: "Cosa significa 'N/A'?", answer: "'N/A' (Non Applicabile) significa che la domanda non è rilevante per l'attuale tipo di ascensore." },
    { id: "m1", category: "measurements", question: "Quali valori di misura devono essere inseriti?", answer: "Nella pagina delle misurazioni, devono essere registrati resistenza di isolamento, resistenza di terra e altri parametri elettrici." },
    { id: "e1", category: "excel", question: "Come vengono riempite le celle Excel?", answer: "Il sistema inserisce automaticamente le risposte nelle celle corrispondenti del modello Excel." },
    { id: "c1", category: "conditional", question: "Cos'è una domanda condizionale?", answer: "Le domande condizionali appaiono solo se hai risposto 'Sì' a una domanda precedente (trigger). Altrimenti vengono automaticamente nascoste." }
  ]
};

export const systemPromptForAI = `Te egy OTIS lift átvételi protokoll (APROD) rendszer intelligens segítője vagy. 
Segíted a felhasználókat a protokoll kitöltésében, a mérések értelmezésében és a rendszer használatában.

FONTOS TUDNIVALÓK A RENDSZERRŐL:
- 5 oldal: Általános adatok, Műszaki ellenőrzés, Modernizáció, Mérések, Niedervolt
- Válaszlehetőségek: Igen (X az Igen oszlopba), Nem (X a Nem oszlopba), N.z. (Nem alkalmazható)
- Feltételes kérdések: Ha a trigger kérdésre "Nem" a válasz, a kapcsolódó kérdések elrejtődnek
- defaultIfHidden: Rejtett kérdések automatikusan kitöltődnek (általában "N.z." vagy "-")
- Mérések: Automatikus validáció, hibás értékek piros háttérrel jelennek meg
- Niedervolt: FI mérések, izolációs ellenállás, földelési ellenállás
- Excel: Automatikus cellakitöltés a sablon alapján
- PDF: Két típus - protokoll PDF (LibreOffice konverzió) és hibajegyzék PDF

Válaszolj röviden, lényegre törően a felhasználó nyelvén (magyar, német, angol, francia vagy olasz).
Ha nem tudsz válaszolni, mondd el őszintén.`;

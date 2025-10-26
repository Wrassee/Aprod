// Interface definíciója - MEGHATÁROZZA A SZÜKSÉGES KULCSOKAT
export interface Translation {
  // Start Screen
  slogan: string;
  hungarian: string;
  german: string;
  
  // Header
  title: string;
  receptionDate: string;
  progress: string;
  
  // Navigation
  previous: string;
  next: string;
  save: string;
  saved: string;
  saving: string;
  autoSaved: string;
  back: string;
  complete: string;
  startNew: string;
  
  // Answers
  yes: string;
  no: string;
  notApplicable: string;
  
  // Error List
  errorList: string;
  addError: string;
  noErrors: string;
  editError: string;
  deleteError: string;
  errorRegistrationRequired: string;
  
  // Error Modal
  addErrorTitle: string;
  severity: string;
  critical: string;
  medium: string;
  low: string;
  errorTitle: string;
  errorDescription: string;
  attachPhotos: string;
  uploadPhotos: string;
  selectFiles: string;
  cancel: string;
  saveError: string;
  
  // Signature
  signatureTitle: string;
  signatureInstruction: string;
  signaturePrompt: string;
  clear: string;
  printedName: string;
  signatureDate: string;
  
  // Completion
  completionTitle: string;
  protocolComplete: string;
  completionMessage: string;
  emailPDF: string;
  saveToCloud: string;
  downloadPDF: string;
  downloadExcel: string;
  viewProtocol: string;
  home: string;
  downloadGroundingPDF: string;
  generating: string;
  
  // Validation
  requiredField: string;
  invalidEmail: string;
  
  // Common
  loading: string;
  error: string;
  
  // Measurement and calculation components
  measurementData: string;
  calculatedValues: string;
  calculatedValuesValidated: string;
  outOfRange: string;
  errorRecordingRequired: string;
  success: string;
  
  // Admin Interface
  admin: string;
  settings: string;
  templates: string;
  uploadTemplate: string;
  templateName: string;
  templateType: string;
  questionsTemplate: string;
  protocolTemplate: string;
  activate: string;
  active: string;
  inactive: string;
  upload: string;
  preview: string;
  configure: string;
  cellReference: string;
  sheetName: string;
  questionConfiguration: string;
  uploadExcelFile: string;
  selectExcelFile: string;
  questionsTemplateUploaded: string;
  protocolTemplateUploaded: string;
  pleaseProvideNameAndFile: string;
  templateActivatedSuccessfully: string;
  failedToActivateTemplate: string;
  failedToLoadTemplatePreview: string;
  errorLoadingTemplatePreview: string;
  confirmDeleteTemplate: string;
  templateDeletedSuccessfully: string;
  templateDeleteFailed: string;
  noTemplatesUploaded: string;
  hybridTemplates: string;
  profile: string;
  hybridTemplateManagement: string;
  localTemplates: string;
  chooseTemplate: string;
  loadingStrategy: string;
  localFirst: string;
  cacheFirst: string;
  remoteOnly: string;
  switching: string;
  templateSwitch: string;
  templateSwitchSuccess: string;
  templateSwitchFailed: string;
  homeTooltip: string;
  failedToFetchTemplates: string;
  questionTemplate: string;
  protocolTemplateName: string;
  noSheet: string;
  activeQuestion: string;
  questionsAndExcelMapping: string;
  noCell: string;
  noQuestionsDefined: string;
  deleteTooltip: string;
  uploadQuestionsTemplate: string;
  uploadQuestionsDescription: string;
  uploadProtocolTemplate: string;
  uploadProtocolDescription: string;
  exampleTemplateName: string;
  exampleProtocolName: string;
  selectExcel: string;
  uploadExcelWithQuestions: string;
  uploadProtocolFormat: string;
  selected: string;
  
  // Login page
  loginTitle: string;
  registerTitle: string;
  loginDescription: string;
  registerDescription: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  registerButton: string;
  switchToRegister: string;
  switchToLogin: string;
  missingData: string;
  pleaseProvideEmailAndPassword: string;
  loginSuccessful: string;
  welcomeUser: string;
  loginError: string;
  invalidCredentials: string;
  emailNotConfirmed: string;
  genericLoginError: string;
  weakPassword: string;
  passwordMinLength: string;
  emailConfirmationRequired: string;
  checkEmailForConfirmation: string;
  registrationSuccessful: string;
  loginSuccessfulAfterRegistration: string;
  userAlreadyExists: string;
  
  // Page specific translations
  generalData: string;
  machineRoom: string;
  modernizationAffected: string;
  // JAVÍTVA: Csak egyszer szerepel
  questionsInGroup: string; 
  groupOf: string;
  viewErrors: string;
  downloadErrorList: string;
  // JAVÍTVA: Hozzáadva az interfészhez
  question: string; 
}

// Fordítási objektumok
export const translations: Record<string, Translation> = {
  hu: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Magyar",
    german: "Deutsch",
    
    // Header
    title: "OTIS APROD - Átvételi Protokoll",
    receptionDate: "Átvétel dátuma:",
    progress: "Folyamat",
    
    // Navigation
    previous: "Előző",
    next: "Következő",
    save: "Mentés",
    saved: "Mentve",
    saving: "Mentés...",
    autoSaved: "Automatikusan mentve",
    back: "Vissza",
    complete: "Protokoll befejezése",
    startNew: "Új protokoll indítása",
    
    // Answers
    yes: "Igen",
    no: "Nem",
    notApplicable: "Nem alkalmazható",
    
    // Error List
    errorList: "Hibalista",
    addError: "Hiba hozzáadása",
    noErrors: "Nincs jelentett hiba",
    editError: "Szerkesztés",
    deleteError: "Törlés",
    errorRegistrationRequired: "Hiba rögzítése szükséges",
    
    // Error Modal
    addErrorTitle: "Új hiba hozzáadása",
    severity: "Súlyossági szint",
    critical: "Kritikus",
    medium: "Közepes",
    low: "Alacsony",
    errorTitle: "Hiba címe",
    errorDescription: "Részletes leírás",
    attachPhotos: "Fotók csatolása",
    uploadPhotos: "Kattintson a fotók feltöltéséhez vagy húzza ide",
    selectFiles: "Fájlok kiválasztása",
    cancel: "Mégse",
    saveError: "Hiba mentése",
    
    // Signature
    signatureTitle: "Digitális aláírás",
    signatureInstruction: "Kérjük, adja meg az aláírását",
    signaturePrompt: "Írjon alá itt az ujjával vagy stylus-szal",
    clear: "Törlés",
    printedName: "Nyomtatott név (opcionális)",
    signatureDate: "Aláírás dátuma: ",
    
    // Completion
    completionTitle: "Protokoll befejezve",
    protocolComplete: "Protokoll sikeresen befejezve",
    completionMessage: "Az átvételi protokoll elkészült és készen áll a terjesztésre.",
    emailPDF: "PDF küldése e-mailben",
    saveToCloud: "Mentés Google Drive-ra",
    downloadPDF: "PDF letöltése",
    downloadExcel: "Excel letöltése",
    viewProtocol: "Protokoll előnézete",
    home: "Kezdőlap",
    downloadGroundingPDF: "Földelésmérési jegyzőkönyv",
    generating: "Generálás...",
    
    // Validation
    requiredField: "Ez a mező kötelező",
    invalidEmail: "Érvénytelen e-mail cím",
    
    // Common
    loading: "Betöltés...",
    error: "Hiba történt",
    success: "Sikeres művelet",
    
    // Admin Interface
    admin: "Adminisztráció",
    settings: "Beállítások",
    templates: "Sablonok",
    uploadTemplate: "Sablon feltöltése",
    templateName: "Sablon neve",
    templateType: "Sablon típusa",
    questionsTemplate: "Kérdések sablona",
    protocolTemplate: "Protokoll sablon",
    activate: "Aktiválás",
    active: "Aktív",
    inactive: "Inaktív",
    upload: "Feltöltés",
    preview: "Előnézet",
    configure: "Konfigurálás",
    cellReference: "Cella hivatkozás",
    sheetName: "Munkalap neve",
    questionConfiguration: "Kérdés konfiguráció",
    uploadExcelFile: "Fájl feltöltése",
    selectExcelFile: "Fájl kiválasztása",
    questionsTemplateUploaded: "Kérdés sablon sikeresen feltöltve",
    protocolTemplateUploaded: "Protokoll sablon sikeresen feltöltve",
    pleaseProvideNameAndFile: "Kérlek add meg a nevet és válassz fájlt",
    templateActivatedSuccessfully: "Sablon sikeresen aktiválva",
    failedToActivateTemplate: "Sablon aktiválása sikertelen",
    failedToLoadTemplatePreview: "Sablon előnézet betöltése sikertelen",
    errorLoadingTemplatePreview: "Hiba a sablon előnézet betöltése során",
    confirmDeleteTemplate: "Biztosan törölni szeretnéd a(z) \"{name}\" sablont? Ez a művelet nem vonható vissza.",
    templateDeletedSuccessfully: "Sablon sikeresen törölve",
    templateDeleteFailed: "Sablon törlése sikertelen",
    noTemplatesUploaded: "Nincs feltöltött sablon",
    hybridTemplates: "Hibrid Sablonok",
    profile: "Profil",
    hybridTemplateManagement: "Hibrid Template Kezelés",
    localTemplates: "Helyi Sablonok",
    chooseTemplate: "Válassz sablont",
    loadingStrategy: "Betöltési Stratégia",
    localFirst: "Helyi Először",
    cacheFirst: "Cache Először",
    remoteOnly: "Csak Távoli",
    switching: "Váltás...",
    templateSwitch: "Sablon Váltás",
    templateSwitchSuccess: "Template váltás sikeres: {name}",
    templateSwitchFailed: "Template váltás sikertelen",
    homeTooltip: "Kezdőlap",
    failedToFetchTemplates: "Sablonok betöltése sikertelen",
    questionTemplate: "Kérdés Sablon",
    protocolTemplateName: "Protokoll Sablon",
    noSheet: "Nincs lap",
    activeQuestion: "aktív kérdés",
    questionsAndExcelMapping: "Kérdések és Excel Cella Hozzárendelések",
    noCell: "Nincs cella",
    noQuestionsDefined: "Nincs kérdés definiálva",
    deleteTooltip: "Törlés",
    uploadQuestionsTemplate: "Kérdés Sablon Feltöltése",
    uploadQuestionsDescription: "Tölts fel egy új kérdés sablont az Excel formátumban. Ez a sablon definiálja a protokoll minden kérdését.",
    uploadProtocolTemplate: "Protokoll Sablon Feltöltése",
    uploadProtocolDescription: "Tölts fel egy új protokoll formátum sablont Excel formátumban. Ez a sablon tartalmazza a végső protokoll elrendezését.",
    exampleTemplateName: "pl. OTIS Kérdés Sablon 2025",
    exampleProtocolName: "pl. OTIS Protokoll HU",
    selectExcel: "Excel fájl kiválasztása",
    uploadExcelWithQuestions: "Kérdéseket tartalmazó Excel fájl feltöltése",
    uploadProtocolFormat: "Protokoll formátum sablon feltöltése",
    selected: "Kiválasztva",
    
    // Login page
    loginTitle: "Bejelentkezés",
    registerTitle: "Regisztráció",
    loginDescription: "Jelentkezz be a fiókodba a folytatáshoz",
    registerDescription: "Hozz létre egy új fiókot",
    emailLabel: "Email cím",
    passwordLabel: "Jelszó",
    loginButton: "Bejelentkezés",
    registerButton: "Regisztráció",
    switchToRegister: "Nincs még fiókod? Regisztrálj!",
    switchToLogin: "Van már fiókod? Jelentkezz be!",
    missingData: "Hiányzó adatok",
    pleaseProvideEmailAndPassword: "Kérlek, add meg az email címed és a jelszavad.",
    loginSuccessful: "Sikeres bejelentkezés! ✅",
    welcomeUser: "Üdvözlünk, {email}!",
    loginError: "Bejelentkezési hiba",
    invalidCredentials: "Hibás email cím vagy jelszó. Ha még nincs fiókod, először regisztrálj!",
    emailNotConfirmed: "Az email címed még nincs megerősítve. Ellenőrizd az email fiókodat.",
    genericLoginError: "Nem sikerült bejelentkezni. Ellenőrizd az adataidat.",
    weakPassword: "Gyenge jelszó",
    passwordMinLength: "A jelszónak legalább 6 karakter hosszúnak kell lennie.",
    emailConfirmationRequired: "Email megerősítés szükséges 📧",
    checkEmailForConfirmation: "Ellenőrizd az email fiókodat és kattints a megerősítő linkre.",
    registrationSuccessful: "Sikeres regisztráció! 🎉",
    loginSuccessfulAfterRegistration: "Bejelentkezés sikeres!",
    userAlreadyExists: "Ez az email cím már használatban van.",
    
    // Page specific translations
    generalData: "Általános adatok",
    machineRoom: "Gépház",
    modernizationAffected: "Modernizációban érintett",
    measurementData: "Mérési adatok",
    // JAVÍTVA: Csak egyszer szerepel
    questionsInGroup: "kérdés ebben a csoportban", 
    groupOf: "csoport",
    calculatedValuesValidated: "A számított értékek automatikusan kiszámításra kerülnek. A határértéken kívüli értékek pirossal jelennek meg.",
    calculatedValues: "Számított értékek",
    errorRecordingRequired: "Hiba rögzítése szükséges",
    outOfRange: "Határértéken kívül (700-9000 mm)",
    viewErrors: "Hibák megtekintése",
    downloadErrorList: "Hibalista letöltése",
    // JAVÍTVA: Megfelelő helyen van az objektumban
    question: "Kérdés", 
  },
  de: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Magyar",
    german: "Deutsch",
    
    // Header
    title: "OTIS APROD - Abnahmeprotokoll",
    receptionDate: "Abnahmedatum:",
    progress: "Fortschritt",
    
    // Navigation
    previous: "Zurück",
    next: "Weiter",
    save: "Speichern",
    saved: "Gespeichert",
    saving: "Speichern...",
    autoSaved: "Automatisch gespeichert",
    back: "Zurück",
    complete: "Protokoll abschließen",
    startNew: "Neues Protokoll starten",
    
    // Answers
    yes: "Ja",
    no: "Nein",
    notApplicable: "Nicht zutreffend",
    
    // Error List
    errorList: "Fehlerliste",
    addError: "Fehler hinzufügen",
    noErrors: "Keine Fehler gemeldet",
    editError: "Bearbeiten",
    deleteError: "Löschen",
    errorRegistrationRequired: "Fehlerregistrierung erforderlich",
    
    // Error Modal
    addErrorTitle: "Neuen Fehler hinzufügen",
    severity: "Schweregrad",
    critical: "Kritisch",
    medium: "Mittel",
    low: "Niedrig",
    errorTitle: "Fehlertitel",
    errorDescription: "Detaillierte Beschreibung",
    attachPhotos: "Fotos anhängen",
    uploadPhotos: "Klicken Sie zum Hochladen von Fotos oder ziehen Sie sie hierher",
    selectFiles: "Dateien auswählen",
    cancel: "Abbrechen",
    saveError: "Fehler speichern",
    
    // Signature
    signatureTitle: "Digitale Unterschrift",
    signatureInstruction: "Bitte geben Sie Ihre Unterschrift ab",
    signaturePrompt: "Unterschreiben Sie hier mit dem Finger oder Stylus",
    clear: "Löschen",
    printedName: "Gedruckter Name (optional)",
    signatureDate: "Unterschriftsdatum: ",
    
    // Completion
    completionTitle: "Protokoll abgeschlossen",
    protocolComplete: "Protokoll erfolgreich abgeschlossen",
    completionMessage: "Ihr Abnahmeprotokoll wurde erstellt und ist bereit für die Verteilung.",
    emailPDF: "PDF per E-Mail senden",
    saveToCloud: "In Google Drive speichern",
    downloadPDF: "PDF herunterladen",
    downloadExcel: "Excel herunterladen",
    viewProtocol: "Protokoll-Vorschau",
    home: "Startseite",
    downloadGroundingPDF: "Erdungsprotokoll",
    generating: "Generieren...",
    
    // Validation
    requiredField: "Dieses Feld ist erforderlich",
    invalidEmail: "Ungültige E-Mail-Adresse",
    
    // Common
    loading: "Laden...",
    error: "Ein Fehler ist aufgetreten",
    success: "Erfolgreiche Operation",
    
    // Admin Interface
    admin: "Administration",
    settings: "Einstellungen",
    templates: "Vorlagen",
    uploadTemplate: "Vorlage hochladen",
    templateName: "Vorlagenname",
    templateType: "Vorlagentyp",
    questionsTemplate: "Fragen-Vorlage",
    protocolTemplate: "Protokoll-Vorlage",
    activate: "Aktivieren",
    active: "Aktiv",
    inactive: "Inaktiv",
    upload: "Hochladen",
    preview: "Vorschau",
    configure: "Konfigurieren",
    cellReference: "Zellreferenz",
    sheetName: "Arbeitsblattname",
    questionConfiguration: "Fragenkonfiguration",
    uploadExcelFile: "Datei hochladen",
    selectExcelFile: "Datei auswählen",
    questionsTemplateUploaded: "Fragenvorlage erfolgreich hochgeladen",
    protocolTemplateUploaded: "Protokollvorlage erfolgreich hochgeladen",
    pleaseProvideNameAndFile: "Bitte Namen und Datei angeben",
    templateActivatedSuccessfully: "Vorlage erfolgreich aktiviert",
    failedToActivateTemplate: "Aktivierung der Vorlage fehlgeschlagen",
    failedToLoadTemplatePreview: "Laden der Vorlagenvorschau fehlgeschlagen",
    errorLoadingTemplatePreview: "Fehler beim Laden der Vorlagenvorschau",
    confirmDeleteTemplate: "Möchten Sie die Vorlage \"{name}\" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    templateDeletedSuccessfully: "Vorlage erfolgreich gelöscht",
    templateDeleteFailed: "Löschen der Vorlage fehlgeschlagen",
    noTemplatesUploaded: "Keine Vorlagen hochgeladen",
    hybridTemplates: "Hybride Vorlagen",
    profile: "Profil",
    hybridTemplateManagement: "Verwaltung hybrider Vorlagen",
    localTemplates: "Lokale Vorlagen",
    chooseTemplate: "Vorlage auswählen",
    loadingStrategy: "Ladestrategie",
    localFirst: "Lokal zuerst",
    cacheFirst: "Cache zuerst",
    remoteOnly: "Nur Remote",
    switching: "Wechseln...",
    templateSwitch: "Vorlagenwechsel",
    templateSwitchSuccess: "Vorlagenwechsel erfolgreich: {name}",
    templateSwitchFailed: "Vorlagenwechsel fehlgeschlagen",
    homeTooltip: "Startseite",
    failedToFetchTemplates: "Laden der Vorlagen fehlgeschlagen",
    questionTemplate: "Fragenvorlage",
    protocolTemplateName: "Protokollvorlage",
    noSheet: "Kein Blatt",
    activeQuestion: "aktive Frage",
    questionsAndExcelMapping: "Fragen und Excel-Zellzuordnungen",
    noCell: "Keine Zelle",
    noQuestionsDefined: "Keine Fragen definiert",
    deleteTooltip: "Löschen",
    uploadQuestionsTemplate: "Fragenvorlage hochladen",
    uploadQuestionsDescription: "Laden Sie eine neue Fragenvorlage im Excel-Format hoch. Diese Vorlage definiert alle Fragen des Protokolls.",
    uploadProtocolTemplate: "Protokollvorlage hochladen",
    uploadProtocolDescription: "Laden Sie eine neue Protokollformatvorlage im Excel-Format hoch. Diese Vorlage enthält das Layout des endgültigen Protokolls.",
    exampleTemplateName: "z.B. OTIS Fragenvorlage 2025",
    exampleProtocolName: "z.B. OTIS Protokoll HU",
    selectExcel: "Excel-Datei auswählen",
    uploadExcelWithQuestions: "Excel-Datei mit Fragen hochladen",
    uploadProtocolFormat: "Protokoll-Formatvorlage hochladen",
    selected: "Ausgewählt",
    
    // Login page
    loginTitle: "Anmelden",
    registerTitle: "Registrieren",
    loginDescription: "Melden Sie sich bei Ihrem Konto an, um fortzufahren",
    registerDescription: "Erstellen Sie ein neues Konto",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    loginButton: "Anmelden",
    registerButton: "Registrieren",
    switchToRegister: "Noch kein Konto? Registrieren!",
    switchToLogin: "Haben Sie bereits ein Konto? Anmelden!",
    missingData: "Fehlende Daten",
    pleaseProvideEmailAndPassword: "Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.",
    loginSuccessful: "Anmeldung erfolgreich! ✅",
    welcomeUser: "Willkommen, {email}!",
    loginError: "Anmeldefehler",
    invalidCredentials: "Ungültige E-Mail-Adresse oder Passwort. Wenn Sie noch kein Konto haben, registrieren Sie sich zuerst!",
    emailNotConfirmed: "Ihre E-Mail-Adresse wurde noch nicht bestätigt. Überprüfen Sie Ihr E-Mail-Postfach.",
    genericLoginError: "Anmeldung fehlgeschlagen. Überprüfen Sie Ihre Daten.",
    weakPassword: "Schwaches Passwort",
    passwordMinLength: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    emailConfirmationRequired: "E-Mail-Bestätigung erforderlich 📧",
    checkEmailForConfirmation: "Überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.",
    registrationSuccessful: "Registrierung erfolgreich! 🎉",
    loginSuccessfulAfterRegistration: "Anmeldung erfolgreich!",
    userAlreadyExists: "Diese E-Mail-Adresse wird bereits verwendet.",
    
    // Page specific translations
    generalData: "Allgemeine Daten",
    machineRoom: "Maschinenraum",
    modernizationAffected: "Von Modernisierung betroffen",
    measurementData: "Messdaten",
    // JAVÍTVA: Csak egyszer szerepel
    questionsInGroup: "Fragen in dieser Gruppe", 
    groupOf: "Gruppe",
    calculatedValuesValidated: "Die berechneten Werte werden automatisch berechnet. Werte außerhalb der Grenzwerte werden rot angezeigt.",
    calculatedValues: "Berechnete Werte",
    errorRecordingRequired: "Dokumentation erforderlich",
    outOfRange: "Außerhalb der Grenzwerte (700-9000 mm)",
    viewErrors: "Fehler anzeigen",
    downloadErrorList: "Fehlerliste herunterladen",
    // JAVÍTVA: Megfelelő helyen van az objektumban
    question: "Frage", 
  },
};

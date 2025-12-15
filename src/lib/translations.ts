// src/lib/translations.ts - Minden magyar,német,angol,francia és olasz kulccsal

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
  home: string;       
  
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
  errorSingular: string;
  errorPlural: string;
  allGood: string;
  autoErrorNotEditable: string;
  errorDeletedSuccessfully: string;
  errorDeletedFromList: string;
  
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
  
  // Signature details
  signatureLastStep: string;
  signatureOptionalInfo: string;
  signatureNameAutoSave: string;
  signatureInfo: string;
  optional: string;
  signatureInfoText1: string;
  signatureInfoText2: string;
  signatureInfoText3: string;
  signatureInfoText4: string;

  // Completion
  completionTitle: string;
  protocolComplete: string;
  completionMessage: string;
  emailPDF: string;
  saveToCloud: string;
  downloadPDF: string;
  downloadExcel: string;
  viewProtocol: string;
  downloadGroundingPDF: string;
  generating: string;
  previewGeneratingTitle: string;
  previewGeneratingWait: string;
  previewErrorTitle: string;
  previewCloseWindow: string;
  emailSending: string;
  emailSentSuccess: string;
  emailSentError: string;
  sending: string;
  noFormDataError: string;
  pdfGenerationError: string;
  popupBlockedTitle: string;
  popupBlockedDescription: string;
  noSavedDataForPreview: string;
  pdfGenerationServerError: string;
  errorOccurred: string;
  closeWindow: string;
  noGroundingDataError: string;
  groundingPdfGenerationError: string;
  downloadSuccessTitle: string;
  groundingProtocolDownloaded: string;
  downloadErrorTitle: string;
  groundingProtocolDownloadError: string;
  
  // Validation
  requiredField: string;
  invalidEmail: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  
  // Measurement and calculation components
  measurementData: string;
  calculatedValues: string;
  calculatedValuesValidated: string;
  outOfRange: string;
  errorRecordingRequired: string;
  
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
  remoteTemplates: string;
  chooseTemplate: string;
  loadingStrategy: string;
  localFirst: string;
  localFirstDescription: string;
  cacheFirst: string;
  cacheFirstDescription: string;
  remoteOnly: string;
  remoteOnlyDescription: string;
  offlineSupport: string;
  cacheEnabled: string;
  templateExists: string;
  templateMissing: string;
  saveSettings: string;
  settingsSaved: string;
  settingsDescription: string;
  liftType: string;
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
  protocolListDescription: string;
  pieces: string;
  protocolNumber: string;
  createdAt: string;
  status: string;
  actions: string;
  completed: string;
  protocolFetchError: string;
  protocolDeletedSuccess: string;
  protocolDeleteError: string;
  loadingProtocols: string;
  retry: string;
  noProtocolsYet: string;
  delete_confirmation_title: string;
  delete_mapping_warning: string;
  confirm_delete: string;
  
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
  forgotPassword: string;
  or: string;

  // Lift Selector
  select_lift_type: string;
  select_lift_type_description: string;
  select_subtype: string;
  select_subtype_description: string;
  subtypes_available: string;
  no_mapping_available: string;
  missing_question_template: string;
  missing_protocol_template: string;
  question_template: string;
  protocol_template: string;
  error_loading_lift_types: string;
  back_to_start: string;
  
  // Admin UI (New)
  lift_type_management: string;
  create_new_type: string;
  create_new_subtype: string;
  create_new_mapping: string;
  type_code: string;
  type_name_hu: string;
  type_name_de: string;
  description_hu: string;
  description_de: string;
  subtypes: string;
  mappings: string;
  deactivate: string;
  select_lift_subtype: string;
  select_question_template: string;
  select_protocol_template: string;
  type_created_successfully: string;
  subtype_created_successfully: string;
  mapping_created_successfully: string;
  mapping_activated_successfully: string;
  type_already_exists: string;
  subtype_already_exists: string;
  invalid_template_type: string;
  active_mapping_exists: string;

  // Page specific translations
  generalData: string;
  machineRoom: string;
  modernizationAffected: string;
  questionsInGroup: string; 
  groupOf: string;
  viewErrors: string;
  downloadErrorList: string;
  question: string;
  questionsSuffix: string;
  questions: string;

  // Grounding specific
  groundingError: string; 
  additionalErrorsInList: string; 

  // Hiányzó kulcsok
  types: string;
  notes: string;
  optional_notes: string;
  create_new_type_description: string;
  create_new_subtype_description: string;
  create_new_mapping_description: string;
  ui_theme: string;
  select_ui_theme: string;
  modern_theme: string;
  modern_theme_desc: string;
  classic_theme: string;
  classic_theme_desc: string;
  backup_under_development: string;
  try_refresh_button: string;
  
  // Profile
  Profile: {
    loading: string;
    createTitle: string;
    editTitle: string;
    createDesc: string;
    editDesc: string;
    userRole: string;
    statusNew: string;
    statusActive: string;
    logout: string;
    nameLabel: string;
    namePlaceholder: string;
    addressLabel: string;
    addressPlaceholder: string;
    driveLabel: string;
    driveHelp: string;
    createBtn: string;
    saveBtn: string;
    creating: string;
    saving: string;
    unsavedChanges: string;
    noUser: string;
    createFailed: string;
    updateFailed: string;
    createSuccessTitle: string;
    createSuccessDesc: string;
    saveSuccessTitle: string;
    saveSuccessDesc: string;
    createErrorTitle: string;
    saveErrorTitle: string;
    logoutSuccessTitle: string;
    logoutSuccessDesc: string;
    logoutErrorTitle: string;
  };

  // Admin Nested
  Admin: {
    tabs: {
      dashboard: string;
      users: string;
      protocols: string;
      templates: string;
      audit: string;
      settings: string;
    };
    
    Dashboard: {
      welcome: string;
      welcomeDesc: string;
      noData: string;
      totalUsers: string;
      registeredUsers: string;
      totalProtocols: string;
      completedProtocols: string;
      totalTemplates: string;
      uploadedTemplates: string;
      activeTemplates: string;
      currentlyActive: string;
      systemActivity: string;
      activityDesc: string;
      activeUsers: string;
      recentProtocols: string;
      systemStatus: string;
      operational: string;
      online: string;
      recentActivity: string;
      recentProtocolsTable: string;
      last5Protocols: string;
      noProtocols: string;
      protocolNumber: string;
      completed: string;
      systemHealth: string;
      database: string;
      healthy: string;
      storage: string;
      ok: string;
      quickStats: string;
      avgProtocolsPerDay: string;
      templatesPerUser: string;
      activeRate: string;
      table: {
        id: string;
        created: string;
        status: string;
      };
    };
    UserManagement: {
      title: string;
      description: string;
      usersCount: string;
      noUsers: string;
      errorAuth: string;
      errorFetch: string;
      errorDelete: string;
      deleteSuccess: string;
      confirmDelete: string;
      roleAdmin: string;
      roleUser: string;
      table: {
        name: string;
        email: string;
        role: string;
        created: string;
        actions: string;
      };
      buttons: {
        delete: string;
        details: string;
        editRole: string;
      };
    };
    AuditLog: {
      title: string;
      description: string;
      entries: string;
      refresh: string;
      noLogs: string;
      table: {
        status: string;
        action: string;
        user: string;
        resource: string;
        details: string;
        time: string;
      };
    };
    Settings: {
      title: string;
      description: string;
      refresh: string;
      refreshed: string;
      loadError: string;
      systemInfo: string;
      systemInfoDesc: string;
      environment: string;
      platform: string;
      nodeVersion: string;
      databaseSize: string;
      uptime: string;
      memoryUsage: string;
      backupTitle: string;
      backupDesc: string;
      createBackup: string;
      restoreBackup: string;
      comingSoon: string;
    };
    comingSoon: {
      dashboard: string;
      dashboardDesc: string;
      protocols: string;
      protocolsDesc: string;
      templates: string;
      templatesDesc: string;
    };
  };
}

// Fordítási objektumok
export const translations: Record<string, Translation> = {
  hu: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Magyar",
    german: "Német",
    english: "Angol",
   french: "Francia",
   italian: "Olasz",
    
    // Header
    title: "OTIS APROD - Átvételi Protokoll",
    receptionDate: "Átvétel dátuma:",
    progress: "Folyamat",
    home: "Kezdőlap", 
    settings: "Beállítások",
    
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
    errorSingular: "hiba",
    errorPlural: "hibák",
    allGood: "Minden rendben van!",
    autoErrorNotEditable: "Automatikus hibák nem szerkeszthetők!",
    errorDeletedSuccessfully: "Hiba sikeresen törölve!",
    errorDeletedFromList: "Hiba törölve a hibalistából!",
    
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

    // Signature details
    signatureLastStep: "Utolsó lépés: Aláírás",
    signatureOptionalInfo: "Az aláírás opcionális - a protokoll név nélkül is befejezhető",
    signatureNameAutoSave: "A név automatikusan mentésre kerül",
    signatureInfo: "Aláírás információ",
    optional: "Opcionális",
    signatureInfoText1: "Az aláírás digitálisan kerül rögzítésre",
    signatureInfoText2: "Automatikus mentés minden változtatásnál",
    signatureInfoText3: "Az aláírás bekerül a végleges PDF dokumentumba",
    signatureInfoText4: "A protokoll név nélkül is befejezhető",
    
    // Completion
    completionTitle: "Protokoll befejezve",
    protocolComplete: "Protokoll sikeresen befejezve",
    completionMessage: "Az átvételi protokoll elkészült és készen áll a terjesztésre.",
    emailPDF: "PDF küldése e-mailben",
    saveToCloud: "Mentés Google Drive-ra",
    downloadPDF: "PDF letöltése",
    downloadExcel: "Excel letöltése",
    viewProtocol: "Protokoll előnézete",
    downloadGroundingPDF: "Földelésmérési jegyzőkönyv",
    generating: "Generálás",
    previewGeneratingTitle: "PDF generálása...",
    previewGeneratingWait: "Kérem várjon, ez 10-15 másodpercet vehet igénybe.",
    previewErrorTitle: "Előnézeti hiba",
    previewCloseWindow: "Ablak bezárása",
    emailSending: "E-mail küldése folyamatban...",
    emailSentSuccess: "E-mail sikeresen elküldve!",
    emailSentError: "E-mail küldése sikertelen!",
    sending: "Küldés...",
    noFormDataError: "Nincs mentett adat a PDF generálásához.",
    pdfGenerationError: "A PDF generálása sikertelen a szerveren.",
    popupBlockedTitle: "Felugró ablak letiltva",
    popupBlockedDescription: "A böngésző letiltotta a felugró ablakot. Kérlek, engedélyezd az oldalon.",
    noSavedDataForPreview: "Nincs mentett adat a localStorage-ban az előnézethez.",
    pdfGenerationServerError: "PDF generálása sikertelen a szerveren.",
    errorOccurred: "Hiba történt",
    closeWindow: "Ablak bezárása",
    noGroundingDataError: "Nincsenek földelési adatok a PDF generálásához.",
    groundingPdfGenerationError: "A földelési PDF generálása sikertelen.",
    downloadSuccessTitle: "Sikeres letöltés",
    groundingProtocolDownloaded: "A földelési jegyzőkönyv sikeresen letöltve.",
    downloadErrorTitle: "Letöltési hiba",
    groundingProtocolDownloadError: "A földelési jegyzőkönyv letöltése sikertelen. Kérjük próbálja újra.",
    
    // Validation
    requiredField: "Ez a mező kötelező",
    invalidEmail: "Érvénytelen e-mail cím",
    
    // Common
    loading: "Betöltés...",
    error: "Hiba történt",
    success: "Sikeres művelet",
    
    // Measurement and calculation components
    measurementData: "Mérési adatok",
    calculatedValues: "Számított értékek",
    calculatedValuesValidated: "A számított értékek automatikusan kiszámításra kerülnek. A határértéken kívüli értékek pirossal jelennek meg.",
    outOfRange: "Határértéken kívül (700-9000 mm)",
    errorRecordingRequired: "Hiba rögzítése szükséges",
    
    // Admin Interface
    admin: "Adminisztráció",
    templates: "Sablonok",
    uploadTemplate: "Sablon feltöltése",
    templateName: "Sablon neve",
    templateType: "Sablon típusa",
    questionsTemplate: "Kérdések sablonja",
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
    pleaseProvideNameAndFile: "Kérlek, add meg a nevet és válassz fájlt",
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
    hybridTemplateManagement: "Hibrid Sablon Kezelés",
    localTemplates: "Helyi Sablonok",
    chooseTemplate: "Válassz sablont",
    loadingStrategy: "Betöltési Stratégia",
    localFirst: "Helyi először",
    localFirstDescription: "A helyi sablonokat használja először, ha elérhetőek (offline működés)",
    cacheFirst: "Cache először",
    cacheFirstDescription: "A gyorsítótárazott sablonokat próbálja először betölteni",
    remoteOnly: "Csak távoli",
    remoteOnlyDescription: "Csak a szerveren tárolt sablonokat használja",
    offlineSupport: "Offline támogatás",
    cacheEnabled: "Cache engedélyezve",
    templateExists: "Elérhető",
    templateMissing: "Hiányzik",
    saveSettings: "Beállítások mentése",
    settingsSaved: "Beállítások sikeresen mentve",
    settingsDescription: "A betöltési stratégia meghatározza, honnan töltődnek be a sablonok",
    liftType: "Lift típus",
    remoteTemplates: "Távoli sablonok",
    switching: "Váltás...",
    templateSwitch: "Sablon Váltás",
    templateSwitchSuccess: "Sablon váltás sikeres: {name}",
    templateSwitchFailed: "Sablon váltás sikertelen",
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
    protocolListDescription: "Az összes létrehozott protokoll áttekintése",
    pieces: "db",
    protocolNumber: "Protokoll szám",
    createdAt: "Létrehozva",
    status: "Státusz",
    actions: "Műveletek",
    completed: "Befejezve",
    protocolFetchError: "A protokollok betöltése sikertelen.",
    protocolDeletedSuccess: "Protokoll sikeresen törölve.",
    protocolDeleteError: "Sikertelen törlés",
    loadingProtocols: "Protokollok betöltése...",
    retry: "Újrapróbálás",
    noProtocolsYet: "Még nem készült protokoll",
    delete_confirmation_title: "Biztosan törölni szeretnéd?",
    delete_mapping_warning: "Ez a művelet végleges. A hozzárendelés törlése után a lift típus inaktívvá válhat a felhasználók számára.",
    confirm_delete: "Törlés megerősítése",
    
    // Login page
    loginTitle: "Bejelentkezés",
    registerTitle: "Regisztráció",
    loginDescription: "Jelentkezz be a fiókodba a folytatáshoz",
    registerDescription: "Hozz létre egy új fiókot",
    emailLabel: "E-mail cím",
    passwordLabel: "Jelszó",
    loginButton: "Bejelentkezés",
    registerButton: "Regisztráció",
    switchToRegister: "Nincs még fiókod? Regisztrálj!",
    switchToLogin: "Van már fiókod? Jelentkezz be!",
    missingData: "Hiányzó adatok",
    pleaseProvideEmailAndPassword: "Kérlek, add meg az e-mail címed és a jelszavad.",
    loginSuccessful: "Sikeres bejelentkezés! ✅",
    welcomeUser: "Üdvözlünk, {e-mail}!",
    loginError: "Bejelentkezési hiba",
    invalidCredentials: "Hibás e-mail cím vagy jelszó. Ha még nincs fiókod, először regisztrálj!",
    emailNotConfirmed: "Az e-mail címed még nincs megerősítve. A szerver szolgáltató a Supabase, egy ilyen címről fogod kapni a levelet! Ellenőrizd az e-mail fiókodat.",
    genericLoginError: "Nem sikerült bejelentkezni. Ellenőrizd az adataidat.",
    weakPassword: "Gyenge jelszó",
    passwordMinLength: "A jelszónak legalább 6 karakter hosszúnak kell lennie.",
    emailConfirmationRequired: "E-mail megerősítés szükséges 📧",
    checkEmailForConfirmation: "Ellenőrizd az e-mail fiókodat és kattints a megerősítő linkre. A szerver szolgáltató a Supabase, egy ilyen címről fogod kapni a levelet!",
    registrationSuccessful: "Sikeres regisztráció! 🎉",
    loginSuccessfulAfterRegistration: "Bejelentkezés sikeres!",
    userAlreadyExists: "Ez az e-mail cím már használatban van.",
    forgotPassword: "Elfelejtette a jelszavát?",
    or: "vagy",

    // Lift Selector
    select_lift_type: "Válasszon lift típust",
    select_lift_type_description: "Kérjük, válassza ki a megfelelő lift kategóriát",
    select_subtype: "Altípus kiválasztása",
    select_subtype_description: "Kérjük, válassza ki a konkrét lift típust",
    subtypes_available: "altípus elérhető",
    no_mapping_available: "Nincs elérhető sablon ehhez a típushoz",
    missing_question_template: "Hiányzó kérdés sablon",
    missing_protocol_template: "Hiányzó protokoll sablon",
    error_loading_lift_types: "Hiba történt a lift típusok betöltésekor",
    back_to_start: "Vissza a kezdőlapra",
    lift_management_subtitle: "Lift típusok és sablonok kezelése",
    no_mappings_title: "Nincs még létrehozva sablon párosítás",
    no_mappings_description: "Hozz létre egyet a fenti gombbal!",
    
    // Admin UI (New)
    lift_type_management: "Lift Típus Kezelés",
    create_new_type: "Új Típus",
    create_new_subtype: "Új Altípus",
    create_new_mapping: "Új Párosítás",
    type_code: "Típus kód",
    type_name_hu: "Magyar név",
    type_name_de: "Német név",
    description_hu: "Leírás (magyar)",
    description_de: "Leírás (német)",
    subtypes: "Altípusok",
    mappings: "Sablon Párosítások",
    deactivate: "Deaktiválás",
    select_lift_subtype: "Válasszon lift altípust",
    select_question_template: "Válasszon kérdéssablont",
    select_protocol_template: "Válasszon protokollsablont",
    type_created_successfully: "Típus sikeresen létrehozva",
    subtype_created_successfully: "Altípus sikeresen létrehozva",
    mapping_created_successfully: "Sablon párosítás sikeresen létrehozva",
    mapping_activated_successfully: "Sablon párosítás aktiválva",
    type_already_exists: "Ez a típus kód már létezik",
    subtype_already_exists: "Ez az altípus kód már létezik ennél a típusnál",
    invalid_template_type: "Érvénytelen sablon típus",
    active_mapping_exists: "Már létezik aktív párosítás ehhez az altípushoz",
    
    // Page specific
    questionsInGroup: "kérdés ebben a csoportban", 
    groupOf: "csoport",
    viewErrors: "Hibák megtekintése",
    downloadErrorList: "Hibalista letöltése",
    question: "Kérdés",
    questionsSuffix: "kérdés",
    questions: "Kérdések",

    // Grounding specific
    groundingError: "Földelési hiba",
    additionalErrorsInList: "A további hibákat keresd a közös hibalistában.",

    // Hiányzó kulcsok pótlása
    types: "Típusok",
    notes: "Megjegyzések",
    optional_notes: "Opcionális megjegyzés...",
    create_new_type_description: "Hozzon létre egy új fő lift típust",
    create_new_subtype_description: "Hozzon létre egy új altípust a választott kategóriához",
    create_new_mapping_description: "Rendeljen hozzá sablonokat egy altípushoz",
    ui_theme: "Felhasználói felület",
    select_ui_theme: "Válassza ki az alkalmazás megjelenését",
    modern_theme: "Modern",
    modern_theme_desc: "Friss, színes dizájn árnyékokkal és színátmenetekkel.",
    classic_theme: "Klasszikus",
    classic_theme_desc: "Letisztult, professzionális megjelenés éles vonalakkal.",
    backup_under_development: "A biztonsági mentés funkció fejlesztés alatt",
    try_refresh_button: "Próbálja meg frissíteni az oldalt.",

    // Profile
    Profile: {
      loading: "Profil betöltése...",
      createTitle: "Új Profil Létrehozása",
      editTitle: "Profil Szerkesztése",
      createDesc: "Hozd létre az első profilod az adatok megadásával",
      editDesc: "Add meg vagy frissítsd a profil adataidat",
      userRole: "Felhasználó",
      statusNew: "Új profil",
      statusActive: "Aktív",
      logout: "Kijelentkezés",
      nameLabel: "Név",
      namePlaceholder: "Teljes neved",
      addressLabel: "Cím",
      addressPlaceholder: "Utca, házszám, város",
      driveLabel: "Google Drive Mappa ID",
      driveHelp: "Az a mappa ID, ahova a protokollokat feltöltjük (opcionális).",
      createBtn: "Profil Létrehozása",
      saveBtn: "Profil Mentése",
      creating: "Létrehozás...",
      saving: "Mentés...",
      unsavedChanges: "Van mentetlen változtatás",
      noUser: "Nincs bejelentkezett felhasználó.",
      createFailed: "Sikertelen létrehozás",
      updateFailed: "Sikertelen frissítés",
      createSuccessTitle: "Sikeres létrehozás!",
      createSuccessDesc: "A profil adataid létre lettek hozva.",
      saveSuccessTitle: "Sikeres mentés!",
      saveSuccessDesc: "A profil adataid frissítve lettek.",
      createErrorTitle: "Létrehozási hiba",
      saveErrorTitle: "Frissítési hiba",
      logoutSuccessTitle: "Sikeres kijelentkezés",
      logoutSuccessDesc: "Viszlát! 👋",
      logoutErrorTitle: "Kijelentkezési hiba"
    },

    // Admin Nested
    Admin: {
      tabs: {
        dashboard: "Dashboard",
        users: "Felhasználók",
        protocols: "Protokollok",
        templates: "Sablonok",
        audit: "Napló",
        settings: "Beállítások",
      },
      Dashboard: {
        welcome: "Üdvözöljük az Admin Dashboardon",
        welcomeDesc: "Rendszer áttekintés és statisztikák",
        noData: "Nem sikerült betölteni a statisztikákat",
        totalUsers: "Összes felhasználó",
        registeredUsers: "Regisztrált fiókok",
        totalProtocols: "Összes protokoll",
        completedProtocols: "Létrehozott jegyzőkönyvek",
        totalTemplates: "Összes sablon",
        uploadedTemplates: "Feltöltött sablonok",
        activeTemplates: "Aktív sablonok",
        currentlyActive: "Jelenleg használatban",
        recentActivity: "Legutóbbi aktivitás",
        recentProtocols: "Legutóbbi Protokollok",
        last5Protocols: "Az utolsó 5 létrehozott protokoll",
        noProtocols: "Nincs még protokoll létrehozva.",
        protocolNumber: "Protokoll szám",
        status: "Státusz",
        createdAt: "Létrehozva",
        systemHealth: "Rendszer állapot",
        activeUsers: "Felhasználói aktivitás",
        online: "Online",
        database: "Adatbázis",
        healthy: "Egészséges",
        storage: "Tárterület",
        ok: "OK",
        quickStats: "Gyors statisztikák",
        avgProtocolsPerDay: "Átlag protokoll/nap (30 nap)",
        templatesPerUser: "Sablon/felhasználó arány",
        activeRate: "Aktív sablon arány",
        systemActivity: "Rendszer aktivitás",
        activityDesc: "Gyors áttekintés a rendszer működéséről",
        recentProtocolsTable: "Legutóbbi protokollok",
        systemStatus: "Rendszer státusz",
        operational: "Működik",
        completed: "Befejezve",
        table: {
          id: "ID",
          created: "Létrehozva",
          status: "Státusz",
        },
      },
      UserManagement: {
        title: "Felhasználók Kezelése",
        description: "Az összes regisztrált felhasználó kezelése",
        usersCount: "felhasználó",
        noUsers: "Nincsenek felhasználók.",
        errorAuth: "Hitelesítés szükséges",
        errorFetch: "A felhasználók betöltése sikertelen",
        errorDelete: "A törlés sikertelen",
        deleteSuccess: "Felhasználó sikeresen törölve",
        confirmDelete: "Biztosan törölni szeretnéd: {name}?",
        roleAdmin: "Admin",
        roleUser: "Felhasználó",
        table: {
          name: "Név",
          email: "E-mail",
          role: "Jogosultság",
          created: "Létrehozva",
          actions: "Műveletek"
        },
        buttons: {
          delete: "Törlés",
          details: "Részletek",
          editRole: "Jogosultság módosítása"
        }
      },
      AuditLog: {
        title: "Tevékenység napló",
        description: "Összes adminisztrátori művelet nyomon követése",
        entries: "bejegyzés",
        refresh: "Frissítés",
        noLogs: "Nincs még naplóbejegyzés.",
        table: {
          status: "Státusz",
          action: "Művelet",
          user: "Felhasználó",
          resource: "Erőforrás",
          details: "Részletek",
          time: "Időpont",
        },
      },
      Settings: {
        title: "Rendszerbeállítások",
        description: "Szerver és adatbázis információk, biztonsági mentések",
        refresh: "Frissítés",
        refreshed: "Rendszerinformációk frissítve",
        loadError: "Nem sikerült betölteni az adatokat",
        systemInfo: "Rendszerinformáció",
        systemInfoDesc: "A szerver és az adatbázis technikai adatai",
        environment: "Környezet",
        platform: "Platform",
        nodeVersion: "Node.js verzió",
        databaseSize: "Adatbázis mérete",
        uptime: "Futási idő",
        memoryUsage: "Memória használat",
        backupTitle: "Biztonsági mentés és visszaállítás",
        backupDesc: "Adatbázis mentése és korábbi állapotok visszaállítása",
        createBackup: "Mentés készítése",
        restoreBackup: "Mentés visszaállítása",
        comingSoon: "Hamarosan elérhető funkció",
      },
      comingSoon: {
        dashboard: "Dashboard hamarosan",
        dashboardDesc: "Statisztikák és áttekintés hamarosan elérhető.",
        protocols: "Protokoll Kezelés hamarosan",
        protocolsDesc: "Ellenőrzési protokollok kezelése itt.",
        templates: "Sablon Kezelés",
        templatesDesc: "Helyezd át a régi sablon logikát egy új TemplateManagement komponensbe."
      }
    },
  },
  de: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Magyar",
    german: "Deutsch",
    english: "Englisch",
   french: "Französisch",
   italian: "Italienisch",
    
    // Header
    title: "OTIS APROD - Abnahmeprotokoll",
    receptionDate: "Abnahmedatum:",
    progress: "Fortschritt",
    home: "Startseite",
    settings: "Einstellungen",
    
    
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
    // ÚJ: error-list.tsx fordítások
    errorSingular: "Fehler",
    errorPlural: "Fehler",
    allGood: "Alles in Ordnung!",
    autoErrorNotEditable: "Automatische Fehler können nicht bearbeitet werden!",
    errorDeletedSuccessfully: "Fehler erfolgreich gelöscht!",
    errorDeletedFromList: "Fehler aus der Liste gelöscht!",
    
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

    // Signature details
    signatureLastStep: "Letzter Schritt: Unterschrift",
    signatureOptionalInfo: "Die Unterschrift ist optional – das Protokoll kann auch ohne Namen abgeschlossen werden",
    signatureNameAutoSave: "Der Name wird automatisch gespeichert",
    signatureInfo: "Informationen zur Unterschrift",
    optional: "Optional",
    signatureInfoText1: "Die Unterschrift wird digital erfasst",
    signatureInfoText2: "Automatische Speicherung bei jeder Änderung",
    signatureInfoText3: "Die Unterschrift wird in das endgültige PDF-Dokument aufgenommen",
    signatureInfoText4: "Das Protokoll kann auch ohne Namen abgeschlossen werden",
    
    // Completion
    completionTitle: "Protokoll abgeschlossen",
    protocolComplete: "Protokoll erfolgreich abgeschlossen",
    completionMessage: "Ihr Abnahmeprotokoll wurde erstellt und ist bereit für die Verteilung.",
    emailPDF: "PDF per E-Mail senden",
    saveToCloud: "In Google Drive speichern",
    downloadPDF: "PDF herunterladen",
    downloadExcel: "Excel herunterladen",
    viewProtocol: "Protokoll-Vorschau",
    downloadGroundingPDF: "Erdungsprotokoll",
    generating: "Generieren",
    previewGeneratingTitle: "PDF wird generiert...",
    previewGeneratingWait: "Bitte warten, dies kann 10-15 Sekunden dauern.",
    previewErrorTitle: "Vorschaufehler",
    previewCloseWindow: "Fenster schließen",
    // ÚJ: completion.tsx fordítások
    emailSending: "E-Mail wird gesendet...",
    emailSentSuccess: "E-Mail erfolgreich gesendet!",
    emailSentError: "E-Mail-Versand fehlgeschlagen!",
    sending: "Senden...",
    noFormDataError: "Keine gespeicherten Daten zum Generieren des PDFs.",
    pdfGenerationError: "PDF-Generierung auf dem Server fehlgeschlagen.",
    popupBlockedTitle: "Popup blockiert",
    popupBlockedDescription: "Der Browser hat das Popup blockiert. Bitte erlauben Sie Popups für diese Seite.",
    noSavedDataForPreview: "Keine gespeicherten Daten im localStorage für die Vorschau.",
    pdfGenerationServerError: "PDF-Generierung auf dem Server fehlgeschlagen.",
    errorOccurred: "Ein Fehler ist aufgetreten",
    closeWindow: "Fenster schließen",
    noGroundingDataError: "Keine Erdungsdaten zum Generieren des PDFs.",
    groundingPdfGenerationError: "Die Generierung des Erdungs-PDFs ist fehlgeschlagen.",
    downloadSuccessTitle: "Download erfolgreich",
    groundingProtocolDownloaded: "Das Erdungsprotokoll wurde erfolgreich heruntergeladen.",
    downloadErrorTitle: "Download-Fehler",
    groundingProtocolDownloadError: "Das Erdungsprotokoll konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.",
    
    // Validation
    requiredField: "Dieses Feld ist erforderlich",
    invalidEmail: "Ungültige E-Mail-Adresse",
    
    // Common
    loading: "Laden...",
    error: "Ein Fehler ist aufgetreten",
    success: "Erfolgreiche Operation",
    
    // Admin Interface
    admin: "Administration",
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
    localFirstDescription: "Lokale Vorlagen werden zuerst verwendet, wenn verfügbar (Offline-Betrieb)",
    cacheFirst: "Cache zuerst",
    cacheFirstDescription: "Versucht zuerst, zwischengespeicherte Vorlagen zu laden",
    remoteOnly: "Nur Remote",
    remoteOnlyDescription: "Verwendet nur auf dem Server gespeicherte Vorlagen",
    offlineSupport: "Offline-Unterstützung",
    cacheEnabled: "Cache aktiviert",
    templateExists: "Verfügbar",
    templateMissing: "Fehlt",
    saveSettings: "Einstellungen speichern",
    settingsSaved: "Einstellungen erfolgreich gespeichert",
    settingsDescription: "Die Ladestrategie bestimmt, woher die Vorlagen geladen werden",
    liftType: "Aufzugstyp",
    remoteTemplates: "Remote-Vorlagen",
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
    protocolListDescription: "Übersicht über alle erstellten Protokolle",
    pieces: "Stück",
    protocolNumber: "Protokollnummer",
    createdAt: "Erstellt am",
    status: "Status",
    actions: "Aktionen",
    completed: "Abgeschlossen",
    protocolFetchError: "Fehler beim Laden der Protokolle.",
    protocolDeletedSuccess: "Protokoll erfolgreich gelöscht.",
    protocolDeleteError: "Löschen fehlgeschlagen",
    loadingProtocols: "Protokolle werden geladen...",
    retry: "Erneut versuchen",
    noProtocolsYet: "Noch keine Protokolle erstellt",
    delete_confirmation_title: "Möchten Sie wirklich löschen?",
    delete_mapping_warning: "Dieser Vorgang ist endgültig. Nach dem Löschen der Zuordnung kann der Aufzugstyp für Benutzer inaktiv werden.",
    confirm_delete: "Löschen bestätigen",
    
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
    welcomeUser: "Willkommen, {e-mail}!",
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
    forgotPassword: "Passwort vergessen?",
    or: "oder",

    // Lift Selector
    select_lift_type: "Aufzugstyp auswählen",
    select_lift_type_description: "Bitte wählen Sie die entsprechende Aufzugskategorie",
    select_subtype: "Untertyp auswählen",
    select_subtype_description: "Bitte wählen Sie den spezifischen Aufzugstyp",
    subtypes_available: "Untertypen verfügbar",
    no_mapping_available: "Keine Vorlage für diesen Typ verfügbar",
    missing_question_template: "Fehlende Fragenvorlage",
    missing_protocol_template: "Fehlende Protokollvorlage",
    question_template: "Fragenvorlage",
    protocol_template: "Protokollvorlage",
    error_loading_lift_types: "Fehler beim Laden der Aufzugstypen",
    back_to_start: "Zurück zur Startseite",
    lift_management_subtitle: "Verwaltung von Aufzugstypen und Vorlagen",
    no_mappings_title: "Noch keine Vorlagenzuordnung erstellt",
    no_mappings_description: "Erstellen Sie eine mit der obigen Schaltfläche!",
    
    // Admin UI
    lift_type_management: "Aufzugstyp-Verwaltung",
    create_new_type: "Neuer Typ",
    create_new_subtype: "Neuer Untertyp",
    create_new_mapping: "Neue Zuordnung",
    type_code: "Typcode",
    type_name_hu: "Ungarischer Name",
    type_name_de: "Deutscher Name",
    description_hu: "Beschreibung (Ungarisch)",
    description_de: "Beschreibung (Deutsch)",
    subtypes: "Untertypen",
    mappings: "Vorlagenzuordnungen",
    deactivate: "Deaktivieren",
    select_lift_subtype: "Aufzugs-Untertyp auswählen",
    select_question_template: "Fragenvorlage auswählen",
    select_protocol_template: "Protokollvorlage auswählen",
    type_created_successfully: "Typ erfolgreich erstellt",
    subtype_created_successfully: "Untertyp erfolgreich erstellt",
    mapping_created_successfully: "Vorlagenzuordnung erfolgreich erstellt",
    mapping_activated_successfully: "Vorlagenzuordnung aktiviert",
    type_already_exists: "Dieser Typcode existiert bereits",
    subtype_already_exists: "Dieser Untertyp-Code existiert bereits für diesen Typ",
    invalid_template_type: "Ungültiger Vorlagentyp",
    active_mapping_exists: "Für diesen Untertyp existiert bereits eine aktive Zuordnung",
    
    // Page specific translations
    generalData: "Allgemeine Daten",
    machineRoom: "Maschinenraum",
    modernizationAffected: "Von Modernisierung betroffen",
    measurementData: "Messdaten",
    questionsInGroup: "Fragen in dieser Gruppe", 
    groupOf: "Gruppe",
    calculatedValuesValidated: "Die berechneten Werte werden automatisch berechnet. Werte außerhalb der Grenzwerte werden rot angezeigt.",
    calculatedValues: "Berechnete Werte",
    errorRecordingRequired: "Dokumentation erforderlich",
    outOfRange: "Außerhalb der Grenzwerte (700-9000 mm)",
    viewErrors: "Fehler anzeigen",
    downloadErrorList: "Fehlerliste herunterladen",
    question: "Frage",
    questionsSuffix: "Fragen",
    questions: "Fragen",

    // Grounding specific
    groundingError: "Erdungsfehler",
    additionalErrorsInList: "Weitere Fehler finden Sie in der gemeinsamen Fehlerliste.",

    // Hiányzó kulcsok pótlása (Német)
    types: "Typen",
    notes: "Notizen",
    optional_notes: "Optionale Notizen...",
    create_new_type_description: "Erstellen Sie einen neuen Hauptaufzugstyp",
    create_new_subtype_description: "Erstellen Sie einen neuen Untertyp für die gewählte Kategorie",
    create_new_mapping_description: "Verknüpfen Sie einen Untertyp mit Vorlagen",
    ui_theme: "Benutzeroberfläche",
    select_ui_theme: "Wählen Sie das Erscheinungsbild der Anwendung",
    modern_theme: "Modern",
    modern_theme_desc: "Ein frisches, farbenfrohes Design mit Verläufen und Schatten.",
    classic_theme: "Klassisch",
    classic_theme_desc: "Ein schlichtes, professionelles Design mit klaren Linien.",
    backup_under_development: "Backup-Funktion ist in Entwicklung",
    try_refresh_button: "Versuchen Sie, die Seite neu zu laden.",
    
    // Profile
    Profile: {
      loading: "Profil wird geladen...",
      createTitle: "Neues Profil erstellen",
      editTitle: "Profil bearbeiten",
      createDesc: "Erstellen Sie Ihr erstes Profil, indem Sie Ihre Daten eingeben",
      editDesc: "Geben Sie Ihre Profildaten ein oder aktualisieren Sie sie",
      userRole: "Benutzer",
      statusNew: "Neues Profil",
      statusActive: "Aktiv",
      logout: "Abmelden",
      nameLabel: "Name",
      namePlaceholder: "Ihr vollständiger Name",
      addressLabel: "Adresse",
      addressPlaceholder: "Straße, Hausnummer, Stadt",
      driveLabel: "Google Drive Ordner-ID",
      driveHelp: "Die Ordner-ID, in den die Protokolle hochgeladen werden (optional).",
      createBtn: "Profil erstellen",
      saveBtn: "Profil speichern",
      creating: "Wird erstellt...",
      saving: "Wird gespeichert...",
      unsavedChanges: "Ungespeicherte Änderungen",
      noUser: "Kein Benutzer angemeldet.",
      createFailed: "Erstellung fehlgeschlagen",
      updateFailed: "Aktualisierung fehlgeschlagen",
      createSuccessTitle: "Erfolgreich erstellt!",
      createSuccessDesc: "Ihre Profildaten wurden erstellt.",
      saveSuccessTitle: "Erfolgreich gespeichert!",
      saveSuccessDesc: "Ihre Profildaten wurden aktualisiert.",
      createErrorTitle: "Fehler bei der Erstellung",
      saveErrorTitle: "Fehler bei der Aktualisierung",
      logoutSuccessTitle: "Erfolgreich abgemeldet",
      logoutSuccessDesc: "Auf Wiedersehen! 👋",
      logoutErrorTitle: "Fehler bei der Abmeldung"
    },

    // Admin Nested
    Admin: {
      tabs: {
        dashboard: "Dashboard",
        users: "Benutzer",
        protocols: "Protokolle",
        templates: "Vorlagen",
        audit: "Protokoll",
        settings: "Einstellungen",
      },
      Dashboard: {
        welcome: "Willkommen beim Admin Dashboard",
        welcomeDesc: "Systemübersicht und Statistiken",
        noData: "Statistiken konnten nicht geladen werden",
        totalUsers: "Gesamtbenutzer",
        registeredUsers: "Registrierte Konten",
        totalProtocols: "Gesamtprotokolle",
        completedProtocols: "Erstellte Protokolle",
        totalTemplates: "Gesamtvorlagen",
        uploadedTemplates: "Hochgeladene Vorlagen",
        activeTemplates: "Aktive Vorlagen",
        currentlyActive: "Aktuell verwendet",
        recentActivity: "Letzte Aktivität",
        last5Protocols: "Die letzten 5 erstellten Protokolle",
        noProtocols: "Noch keine Protokolle erstellt.",
        protocolNumber: "Protokollnummer",
        status: "Status",
        createdAt: "Erstellt am",
        systemHealth: "Systemzustand",
        activeUsers: "Benutzeraktivität",
        online: "Online",
        database: "Datenbank",
        healthy: "Gesund",
        storage: "Speicher",
        ok: "OK",
        quickStats: "Schnellstatistiken",
        avgProtocolsPerDay: "Durchschn. Protokolle/Tag (30 Tage)",
        templatesPerUser: "Vorlagen/Benutzer-Verhältnis",
        activeRate: "Rate aktiver Vorlagen",
        systemActivity: "Systemaktivität",
        activityDesc: "Schneller Überblick über den Systembetrieb",
        recentProtocolsTable: "Letzte Protokolle",
        systemStatus: "Systemstatus",
        operational: "Betriebsbereit",
        completed: "Abgeschlossen",
        recentProtocols: "Letzte Protokolle",
        table: {
          id: "ID",
          created: "Erstellt",
          status: "Status",
        },
      },
      UserManagement: {
        title: "Benutzerverwaltung",
        description: "Verwaltung aller registrierten Benutzer",
        usersCount: "Benutzer",
        noUsers: "Keine Benutzer vorhanden.",
        errorAuth: "Authentifizierung erforderlich",
        errorFetch: "Fehler beim Laden der Benutzer",
        errorDelete: "Löschen fehlgeschlagen",
        deleteSuccess: "Benutzer erfolgreich gelöscht",
        confirmDelete: "Möchten Sie {name} wirklich löschen?",
        roleAdmin: "Administrator",
        roleUser: "Benutzer",
        table: {
          name: "Name",
          email: "E-Mail",
          role: "Rolle",
          created: "Erstellt",
          actions: "Aktionen"
        },
        buttons: {
          delete: "Löschen",
          details: "Details",
          editRole: "Rolle ändern"
        }
      },
      AuditLog: {
        title: "Aktivitätsprotokoll",
        description: "Verfolgung aller administrativen Aktionen",
        entries: "Einträge",
        refresh: "Aktualisieren",
        noLogs: "Noch keine Protokolleinträge vorhanden.",
        table: {
          status: "Status",
          action: "Aktion",
          user: "Benutzer",
          resource: "Ressource",
          details: "Details",
          time: "Zeitpunkt",
        },
      },
      Settings: {
        title: "Systemeinstellungen",
        description: "Server- und Datenbankinformationen, Backups",
        refresh: "Aktualisieren",
        refreshed: "Systeminformationen aktualisiert",
        loadError: "Daten konnten nicht geladen werden",
        systemInfo: "Systeminformationen",
        systemInfoDesc: "Technische Daten des Servers und der Datenbank",
        environment: "Umgebung",
        platform: "Plattform",
        nodeVersion: "Node.js Version",
        databaseSize: "Datenbankgröße",
        uptime: "Laufzeit",
        memoryUsage: "Speichernutzung",
        backupTitle: "Sicherung und Wiederherstellung",
        backupDesc: "Datenbank sichern und frühere Zustände wiederherstellen",
        createBackup: "Sicherung erstellen",
        restoreBackup: "Sicherung wiederherstellen",
        comingSoon: "Funktion bald verfügbar",
      },
      comingSoon: {
        dashboard: "Dashboard kommt bald",
        dashboardDesc: "Statistiken und Übersicht demnächst verfügbar.",
        protocols: "Protokollverwaltung kommt bald",
        protocolsDesc: "Verwaltung von Prüfprotokollen hier.",
        templates: "Vorlagenverwaltung",
        templatesDesc: "Verschieben Sie die alte Vorlagenlogik in eine neue TemplateManagement-Komponente."
      }
    },
  },

  en: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Hungarian",
    german: "German",
    english: "English",
    french: "French",
    italian: "Italian",
    
    // Header
    title: "OTIS APROD - Acceptance Protocol",
    receptionDate: "Reception Date:",
    progress: "Progress",
    home: "Home",
    settings: "Settings",
    
    // Navigation
    previous: "Previous",
    next: "Next",
    save: "Save",
    saved: "Saved",
    saving: "Saving...",
    autoSaved: "Auto-saved",
    back: "Back",
    complete: "Complete Protocol",
    startNew: "Start New Protocol",
    
    // Answers
    yes: "Yes",
    no: "No",
    notApplicable: "Not Applicable",
    
    // Error List
    errorList: "Error List",
    addError: "Add Error",
    noErrors: "No errors reported",
    editError: "Edit",
    deleteError: "Delete",
    errorRegistrationRequired: "Error registration required",
    errorSingular: "error",
    errorPlural: "errors",
    allGood: "All good!",
    autoErrorNotEditable: "Automatic errors are not editable!",
    errorDeletedSuccessfully: "Error deleted successfully!",
    errorDeletedFromList: "Error deleted from the error list!",
    
    // Error Modal
    addErrorTitle: "Add New Error",
    severity: "Severity Level",
    critical: "Critical",
    medium: "Medium",
    low: "Low",
    errorTitle: "Error Title",
    errorDescription: "Detailed Description",
    attachPhotos: "Attach Photos",
    uploadPhotos: "Click or drag photos to upload here",
    selectFiles: "Select Files",
    cancel: "Cancel",
    saveError: "Save Error",
    
    // Signature
    signatureTitle: "Digital Signature",
    signatureInstruction: "Please provide your signature",
    signaturePrompt: "Sign here with your finger or stylus",
    clear: "Clear",
    printedName: "Printed Name (optional)",
    signatureDate: "Signature Date: ",

    // Signature details
    signatureLastStep: "Last Step: Signature",
    signatureOptionalInfo: "The signature is optional - the protocol can be completed without a name",
    signatureNameAutoSave: "The name will be auto-saved",
    signatureInfo: "Signature Information",
    optional: "Optional",
    signatureInfoText1: "The signature is digitally recorded",
    signatureInfoText2: "Automatic saving on every change",
    signatureInfoText3: "The signature will be included in the final PDF document",
    signatureInfoText4: "The protocol can be completed without a name",
    
    // Completion
    completionTitle: "Protocol Completed",
    protocolComplete: "Protocol successfully completed",
    completionMessage: "Your acceptance protocol has been created and is ready for distribution.",
    emailPDF: "E-mail PDF",
    saveToCloud: "Save to Google Drive",
    downloadPDF: "Download PDF",
    downloadExcel: "Download Excel",
    viewProtocol: "View Protocol Preview",
    downloadGroundingPDF: "Grounding Protocol",
    generating: "Generating",
    previewGeneratingTitle: "Generating PDF...",
    previewGeneratingWait: "Please wait, this may take 10-15 seconds.",
    previewErrorTitle: "Preview Error",
    previewCloseWindow: "Close Window",
    emailSending: "E-mail sending in progress...",
    emailSentSuccess: "E-mail sent successfully!",
    emailSentError: "E-mail sending failed!",
    sending: "Sending...",
    noFormDataError: "No saved data to generate the PDF.",
    pdfGenerationError: "PDF generation failed on the server.",
    popupBlockedTitle: "Popup Blocked",
    popupBlockedDescription: "The browser blocked the popup. Please allow popups for this site.",
    noSavedDataForPreview: "No saved data in localStorage for preview.",
    pdfGenerationServerError: "PDF generation failed on the server.",
    errorOccurred: "An error occurred",
    closeWindow: "Close Window",
    noGroundingDataError: "No grounding data to generate the PDF.",
    groundingPdfGenerationError: "Grounding PDF generation failed.",
    downloadSuccessTitle: "Download Successful",
    groundingProtocolDownloaded: "The grounding protocol has been successfully downloaded.",
    downloadErrorTitle: "Download Error",
    groundingProtocolDownloadError: "The grounding protocol download failed. Please try again.",

    // Validation
    requiredField: "This field is required",
    invalidEmail: "Invalid e-mail address",
    
    // Common
    loading: "Loading...",
    error: "An error occurred",
    success: "Successful operation",
    
    // Measurement and calculation components
    measurementData: "Measurement Data",
    calculatedValues: "Calculated Values",
    calculatedValuesValidated: "Calculated values are automatically computed. Values out of range will be shown in red.",
    outOfRange: "Out of Range (700-9000 mm)",
    errorRecordingRequired: "Error recording required",
    
    // Admin Interface
    admin: "Administration",
    templates: "Templates",
    uploadTemplate: "Upload Template",
    templateName: "Template Name",
    templateType: "Template Type",
    questionsTemplate: "Questions Template",
    protocolTemplate: "Protocol Template",
    activate: "Activate",
    active: "Active",
    inactive: "Inactive",
    upload: "Upload",
    preview: "Preview",
    configure: "Configure",
    cellReference: "Cell Reference",
    sheetName: "Sheet Name",
    questionConfiguration: "Question Configuration",
    uploadExcelFile: "Upload File",
    selectExcelFile: "Select File",
    questionsTemplateUploaded: "Questions template uploaded successfully",
    protocolTemplateUploaded: "Protocol template uploaded successfully",
    pleaseProvideNameAndFile: "Please provide name and select file",
    templateActivatedSuccessfully: "Template activated successfully",
    failedToActivateTemplate: "Failed to activate template",
    failedToLoadTemplatePreview: "Failed to load template preview",
    errorLoadingTemplatePreview: "Error loading template preview",
    confirmDeleteTemplate: "Are you sure you want to delete the template \"{name}\"? This action cannot be undone.",
    templateDeletedSuccessfully: "Template deleted successfully",
    templateDeleteFailed: "Template deletion failed",
    noTemplatesUploaded: "No templates uploaded",
    hybridTemplates: "Hybrid Templates",
    profile: "Profile",
    hybridTemplateManagement: "Hybrid Template Management",
    localTemplates: "Local Templates",
    chooseTemplate: "Choose Template",
    loadingStrategy: "Loading Strategy",
    localFirst: "Local First",
    cacheFirst: "Cache First",
    remoteOnly: "Remote Only",
    switching: "Switching...",
    templateSwitch: "Template Switch",
    templateSwitchSuccess: "Template switch successful: {name}",
    templateSwitchFailed: "Template switch failed",
    homeTooltip: "Home",
    failedToFetchTemplates: "Failed to fetch templates",
    questionTemplate: "Question Template",
    protocolTemplateName: "Protocol Template",
    noSheet: "No sheet",
    activeQuestion: "active question",
    questionsAndExcelMapping: "Questions and Excel Cell Mappings",
    noCell: "No cell",
    noQuestionsDefined: "No questions defined",
    deleteTooltip: "Delete",
    uploadQuestionsTemplate: "Upload Questions Template",
    uploadQuestionsDescription: "Upload a new questions template in Excel format. This template defines all protocol questions.",
    uploadProtocolTemplate: "Upload Protocol Template",
    uploadProtocolDescription: "Upload a new protocol format template in Excel format. This template contains the final protocol layout.",
    exampleTemplateName: "e.g. OTIS Question Template 2025",
    exampleProtocolName: "e.g. OTIS Protocol EN",
    selectExcel: "Select Excel File",
    uploadExcelWithQuestions: "Upload Excel file with questions",
    uploadProtocolFormat: "Upload protocol format template",
    selected: "Selected",
    protocolListDescription: "Overview of all created protocols",
    pieces: "pcs",
    protocolNumber: "Protocol Number",
    createdAt: "Created At",
    status: "Status",
    actions: "Actions",
    completed: "Completed",
    protocolFetchError: "Failed to fetch protocols.",
    protocolDeletedSuccess: "Protocol deleted successfully.",
    protocolDeleteError: "Deletion failed",
    loadingProtocols: "Loading protocols...",
    retry: "Retry",
    noProtocolsYet: "No protocols created yet",
    delete_confirmation_title: "Are you sure you want to delete?",
    delete_mapping_warning: "This action is final. Deleting the mapping might make the lift type inactive for users.",
    confirm_delete: "Confirm Deletion",
    
    // Login page
    loginTitle: "Login",
    registerTitle: "Register",
    loginDescription: "Sign in to your account to continue",
    registerDescription: "Create a new account",
    emailLabel: "E-mail Address",
    passwordLabel: "Password",
    loginButton: "Login",
    registerButton: "Register",
    switchToRegister: "Don't have an account? Register!",
    switchToLogin: "Already have an account? Login!",
    missingData: "Missing Data",
    pleaseProvideEmailAndPassword: "Please provide your e-mail address and password.",
    loginSuccessful: "Login successful! ✅",
    welcomeUser: "Welcome, {e-mail}!",
    loginError: "Login Error",
    invalidCredentials: "Invalid e-mail address or password. If you don't have an account yet, please register first!",
    emailNotConfirmed: "Your e-mail address has not been confirmed yet. Check your e-mail inbox.",
    genericLoginError: "Failed to log in. Check your credentials.",
    weakPassword: "Weak Password",
    passwordMinLength: "The password must be at least 6 characters long.",
    emailConfirmationRequired: "E-mail Confirmation Required 📧",
    checkEmailForConfirmation: "Check your e-mail inbox and click the confirmation link.",
    registrationSuccessful: "Registration successful! 🎉",
    loginSuccessfulAfterRegistration: "Login successful!",
    userAlreadyExists: "This e-mail address is already in use.",
    forgotPassword: "Forgot your password?",
    or: "or",

    // Lift Selector
    select_lift_type: "Select Lift Type",
    select_lift_type_description: "Please select the appropriate lift category",
    select_subtype: "Select Subtype",
    select_subtype_description: "Please select the specific lift type",
    subtypes_available: "subtypes available",
    no_mapping_available: "No template available for this type",
    missing_question_template: "Missing question template",
    missing_protocol_template: "Missing protocol template",
    question_template: "Question Template",
    protocol_template: "Protocol Template",
    error_loading_lift_types: "Error loading lift types",
    back_to_start: "Back to Start Screen",
    
    // Admin UI (New)
    lift_type_management: "Lift Type Management",
    create_new_type: "New Type",
    create_new_subtype: "New Subtype",
    create_new_mapping: "New Mapping",
    type_code: "Type Code",
    type_name_hu: "Hungarian Name",
    type_name_de: "German Name",
    description_hu: "Description (Hungarian)",
    description_de: "Description (German)",
    subtypes: "Subtypes",
    mappings: "Template Mappings",
    deactivate: "Deactivate",
    select_lift_subtype: "Select lift subtype",
    select_question_template: "Select question template",
    select_protocol_template: "Select protocol template",
    type_created_successfully: "Type created successfully",
    subtype_created_successfully: "Subtype created successfully",
    mapping_created_successfully: "Template mapping created successfully",
    mapping_activated_successfully: "Template mapping activated",
    type_already_exists: "This type code already exists",
    subtype_already_exists: "This subtype code already exists for this type",
    invalid_template_type: "Invalid template type",
    active_mapping_exists: "An active mapping already exists for this subtype",

    // Page specific translations
    generalData: "General Data",
    machineRoom: "Machine Room",
    modernizationAffected: "Affected by Modernization",
    questionsInGroup: "questions in this group", 
    groupOf: "group",
    viewErrors: "View Errors",
    downloadErrorList: "Download Error List",
    question: "Question",
    questionsSuffix: "questions",
    questions: "Questions",

    // Grounding specific
    groundingError: "Grounding Error", 
    additionalErrorsInList: "Find additional errors in the common error list.", 

    // Missing keys
    types: "Types",
    notes: "Notes",
    optional_notes: "Optional notes...",
    create_new_type_description: "Create a new main lift type",
    create_new_subtype_description: "Create a new subtype for the selected category",
    create_new_mapping_description: "Assign templates to a subtype",
    ui_theme: "User Interface",
    select_ui_theme: "Select the appearance of the application",
    modern_theme: "Modern",
    modern_theme_desc: "A fresh, colorful design with shadows and gradients.",
    classic_theme: "Classic",
    classic_theme_desc: "A clean, professional look with sharp lines.",
    backup_under_development: "Backup function is under development",
    try_refresh_button: "Try refreshing the page.",

    // Profile (Nested Object)
    Profile: {
      loading: "Loading Profile...",
      createTitle: "Create New Profile",
      editTitle: "Edit Profile",
      createDesc: "Create your first profile by entering your data",
      editDesc: "Enter or update your profile data",
      userRole: "User",
      statusNew: "New Profile",
      statusActive: "Active",
      logout: "Logout",
      nameLabel: "Name",
      namePlaceholder: "Your full name",
      addressLabel: "Address",
      addressPlaceholder: "Street, house number, city",
      driveLabel: "Google Drive Folder ID",
      driveHelp: "The folder ID where protocols are uploaded (optional).",
      createBtn: "Create Profile",
      saveBtn: "Save Profile",
      creating: "Creating...",
      saving: "Saving...",
      unsavedChanges: "Unsaved changes",
      noUser: "No user logged in.",
      createFailed: "Creation failed",
      updateFailed: "Update failed",
      createSuccessTitle: "Successfully created!",
      createSuccessDesc: "Your profile data has been created.",
      saveSuccessTitle: "Successfully saved!",
      saveSuccessDesc: "Your profile data has been updated.",
      createErrorTitle: "Creation error",
      saveErrorTitle: "Update error",
      logoutSuccessTitle: "Logout successful",
      logoutSuccessDesc: "Goodbye! 👋",
      logoutErrorTitle: "Logout error"
    },

    // Admin Nested Object
    Admin: {
      tabs: {
        dashboard: "Dashboard",
        users: "Users",
        protocols: "Protocols",
        templates: "Templates",
        audit: "Audit Log",
        settings: "Settings",
      },
      Dashboard: {
        welcome: "Welcome to the Admin Dashboard",
        welcomeDesc: "System overview and statistics",
        noData: "Failed to load statistics",
        totalUsers: "Total Users",
        registeredUsers: "Registered Accounts",
        totalProtocols: "Total Protocols",
        completedProtocols: "Completed Protocols",
        totalTemplates: "Total Templates",
        uploadedTemplates: "Uploaded Templates",
        activeTemplates: "Active Templates",
        currentlyActive: "Currently in use",
        recentActivity: "Recent Activity",
        recentProtocols: "Recent Protocols",
        last5Protocols: "The last 5 created protocols",
        noProtocols: "No protocols created yet.",
        protocolNumber: "Protocol Number",
        status: "Status",
        createdAt: "Created At",
        systemHealth: "System Health",
        activeUsers: "User Activity",
        online: "Online",
        database: "Database",
        healthy: "Healthy",
        storage: "Storage",
        ok: "OK",
        quickStats: "Quick Stats",
        avgProtocolsPerDay: "Avg Protocols/Day (30 days)",
        templatesPerUser: "Template/User Ratio",
        activeRate: "Active Template Rate",
        systemActivity: "System Activity",
        activityDesc: "Quick overview of system operation",
        recentProtocolsTable: "Recent Protocols",
        systemStatus: "System Status",
        operational: "Operational",
        completed: "Completed",
        table: {
          id: "ID",
          created: "Created",
          status: "Status",
        },
      },
      UserManagement: {
        title: "User Management",
        description: "Manage all registered users",
        usersCount: "users",
        noUsers: "No users available.",
        errorAuth: "Authentication required",
        errorFetch: "Failed to load users",
        errorDelete: "Deletion failed",
        deleteSuccess: "User deleted successfully",
        confirmDelete: "Are you sure you want to delete: {name}?",
        roleAdmin: "Admin",
        roleUser: "User",
        table: {
          name: "Name",
          email: "E-mail",
          role: "Role",
          created: "Created",
          actions: "Actions"
        },
        buttons: {
          delete: "Delete",
          details: "Details",
          editRole: "Edit Role"
        }
      },
      AuditLog: {
        title: "Activity Log",
        description: "Tracking all administrative actions",
        entries: "entries",
        refresh: "Refresh",
        noLogs: "No log entries yet.",
        table: {
          status: "Status",
          action: "Action",
          user: "User",
          resource: "Resource",
          details: "Details",
          time: "Time",
        },
      },
      Settings: {
        title: "System Settings",
        description: "Server and database information, backups",
        refresh: "Refresh",
        refreshed: "System information updated",
        loadError: "Failed to load data",
        systemInfo: "System Information",
        systemInfoDesc: "Technical data of the server and database",
        environment: "Environment",
        platform: "Platform",
        nodeVersion: "Node.js Version",
        databaseSize: "Database Size",
        uptime: "Uptime",
        memoryUsage: "Memory Usage",
        backupTitle: "Backup and Restore",
        backupDesc: "Backup database and restore previous states",
        createBackup: "Create Backup",
        restoreBackup: "Restore Backup",
        comingSoon: "Feature coming soon",
      },
      comingSoon: {
        dashboard: "Dashboard coming soon",
        dashboardDesc: "Statistics and overview available soon.",
        protocols: "Protocol Management coming soon",
        protocolsDesc: "Manage inspection protocols here.",
        templates: "Template Management",
        templatesDesc: "Move old template logic to a new TemplateManagement component."
      }
    },
  },

  fr: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Hongrois",
    german: "Allemand",
    english: "Anglais",
    french: "Français",
    italian: "Italien",
    
    // Header
    title: "OTIS APROD - Protocole de Réception",
    receptionDate: "Date de réception:",
    progress: "Progression",
    home: "Accueil",
    settings: "Paramètres",
    
    // Navigation
    previous: "Précédent",
    next: "Suivant",
    save: "Sauvegarder",
    saved: "Sauvegardé",
    saving: "Sauvegarde...",
    autoSaved: "Sauvegardé automatiquement",
    back: "Retour",
    complete: "Terminer le Protocole",
    startNew: "Démarrer un Nouveau Protocole",
    
    // Answers
    yes: "Oui",
    no: "Non",
    notApplicable: "Non applicable",
    
    // Error List
    errorList: "Liste d'Erreurs",
    addError: "Ajouter une Erreur",
    noErrors: "Aucune erreur signalée",
    editError: "Modifier",
    deleteError: "Supprimer",
    errorRegistrationRequired: "Enregistrement d'erreur requis",
    errorSingular: "erreur",
    errorPlural: "erreurs",
    allGood: "Tout est bon!",
    autoErrorNotEditable: "Les erreurs automatiques ne sont pas modifiables!",
    errorDeletedSuccessfully: "Erreur supprimée avec succès!",
    errorDeletedFromList: "Erreur supprimée de la liste d'erreurs!",
    
    // Error Modal
    addErrorTitle: "Ajouter une Nouvelle Erreur",
    severity: "Niveau de Gravité",
    critical: "Critique",
    medium: "Moyen",
    low: "Faible",
    errorTitle: "Titre de l'Erreur",
    errorDescription: "Description détaillée",
    attachPhotos: "Joindre des Photos",
    uploadPhotos: "Cliquez ou glissez des photos pour les télécharger ici",
    selectFiles: "Sélectionner des Fichiers",
    cancel: "Annuler",
    saveError: "Sauvegarder l'Erreur",
    
    // Signature
    signatureTitle: "Signature Numérique",
    signatureInstruction: "Veuillez apposer votre signature",
    signaturePrompt: "Signez ici avec votre doigt ou stylet",
    clear: "Effacer",
    printedName: "Nom Imprimé (facultatif)",
    signatureDate: "Date de Signature: ",

    // Signature details
    signatureLastStep: "Dernière Étape: Signature",
    signatureOptionalInfo: "La signature est facultative - le protocole peut être complété sans nom",
    signatureNameAutoSave: "Le nom sera sauvegardé automatiquement",
    signatureInfo: "Information sur la Signature",
    optional: "Facultatif",
    signatureInfoText1: "La signature est enregistrée numériquement",
    signatureInfoText2: "Sauvegarde automatique à chaque modification",
    signatureInfoText3: "La signature sera incluse dans le document PDF final",
    signatureInfoText4: "Le protocole peut être complété sans nom",
    
    // Completion
    completionTitle: "Protocole Terminé",
    protocolComplete: "Protocole terminé avec succès",
    completionMessage: "Votre protocole de réception a été créé et est prêt pour la distribution.",
    emailPDF: "Envoyer le PDF par E-mail",
    saveToCloud: "Sauvegarder sur Google Drive",
    downloadPDF: "Télécharger le PDF",
    downloadExcel: "Télécharger l'Excel",
    viewProtocol: "Voir la Prévisualisation du Protocole",
    downloadGroundingPDF: "Protocole de Mise à la Terre",
    generating: "Génération",
    previewGeneratingTitle: "Génération du PDF...",
    previewGeneratingWait: "Veuillez patienter, cela peut prendre 10-15 secondes.",
    previewErrorTitle: "Erreur de Prévisualisation",
    previewCloseWindow: "Fermer la Fenêtre",
    emailSending: "Envoi de l'e-mail en cours...",
    emailSentSuccess: "E-mail envoyé avec succès!",
    emailSentError: "Échec de l'envoi de l'e-mail!",
    sending: "Envoi...",
    noFormDataError: "Aucune donnée sauvegardée pour générer le PDF.",
    pdfGenerationError: "Échec de la génération du PDF sur le serveur.",
    popupBlockedTitle: "Fenêtre Pop-up Bloquée",
    popupBlockedDescription: "Le navigateur a bloqué la fenêtre pop-up. Veuillez autoriser les pop-ups pour ce site.",
    noSavedDataForPreview: "Aucune donnée sauvegardée dans le localStorage pour la prévisualisation.",
    pdfGenerationServerError: "Échec de la génération du PDF sur le serveur.",
    errorOccurred: "Une erreur est survenue",
    closeWindow: "Fermer la Fenêtre",
    noGroundingDataError: "Aucune donnée de mise à la terre pour générer le PDF.",
    groundingPdfGenerationError: "Échec de la génération du PDF de mise à la terre.",
    downloadSuccessTitle: "Téléchargement Réussi",
    groundingProtocolDownloaded: "Le protocole de mise à la terre a été téléchargé avec succès.",
    downloadErrorTitle: "Erreur de Téléchargement",
    groundingProtocolDownloadError: "Échec du téléchargement du protocole de mise à la terre. Veuillez réessayer.",
    
    // Validation
    requiredField: "Ce champ est obligatoire",
    invalidEmail: "Adresse e-mail invalide",
    
    // Common
    loading: "Chargement...",
    error: "Une erreur est survenue",
    success: "Opération réussie",
    
    // Measurement and calculation components
    measurementData: "Données de Mesure",
    calculatedValues: "Valeurs Calculées",
    calculatedValuesValidated: "Les valeurs calculées sont générées automatiquement. Les valeurs hors limite sont affichées en rouge.",
    outOfRange: "Hors Limite (700-9000 mm)",
    errorRecordingRequired: "Enregistrement d'erreur requis",
    
    // Admin Interface
    admin: "Administration",
    templates: "Modèles",
    uploadTemplate: "Télécharger un Modèle",
    templateName: "Nom du Modèle",
    templateType: "Type de Modèle",
    questionsTemplate: "Modèle de Questions",
    protocolTemplate: "Modèle de Protocole",
    activate: "Activer",
    active: "Actif",
    inactive: "Inactif",
    upload: "Télécharger",
    preview: "Prévisualisation",
    configure: "Configurer",
    cellReference: "Référence de Cellule",
    sheetName: "Nom de la Feuille",
    questionConfiguration: "Configuration des Questions",
    uploadExcelFile: "Télécharger le Fichier",
    selectExcelFile: "Sélectionner le Fichier",
    questionsTemplateUploaded: "Modèle de questions téléchargé avec succès",
    protocolTemplateUploaded: "Modèle de protocole téléchargé avec succès",
    pleaseProvideNameAndFile: "Veuillez fournir un nom et sélectionner un fichier",
    templateActivatedSuccessfully: "Modèle activé avec succès",
    failedToActivateTemplate: "Échec de l'activation du modèle",
    failedToLoadTemplatePreview: "Échec du chargement de la prévisualisation du modèle",
    errorLoadingTemplatePreview: "Erreur lors du chargement de la prévisualisation du modèle",
    confirmDeleteTemplate: "Êtes-vous sûr de vouloir supprimer le modèle \"{name}\"? Cette action est irréversible.",
    templateDeletedSuccessfully: "Modèle supprimé avec succès",
    templateDeleteFailed: "Échec de la suppression du modèle",
    noTemplatesUploaded: "Aucun modèle téléchargé",
    hybridTemplates: "Modèles Hybrides",
    profile: "Profil",
    hybridTemplateManagement: "Gestion des Modèles Hybrides",
    localTemplates: "Modèles Locaux",
    chooseTemplate: "Choisir un Modèle",
    loadingStrategy: "Stratégie de Chargement",
    localFirst: "Local en Premier",
    cacheFirst: "Cache en Premier",
    remoteOnly: "Distant Uniquement",
    switching: "Commutation...",
    templateSwitch: "Changement de Modèle",
    templateSwitchSuccess: "Changement de modèle réussi: {name}",
    templateSwitchFailed: "Échec du changement de modèle",
    homeTooltip: "Accueil",
    failedToFetchTemplates: "Échec de la récupération des modèles",
    questionTemplate: "Modèle de Questions",
    protocolTemplateName: "Modèle de Protocole",
    noSheet: "Pas de feuille",
    activeQuestion: "question active",
    questionsAndExcelMapping: "Questions et Mappages de Cellules Excel",
    noCell: "Pas de cellule",
    noQuestionsDefined: "Aucune question définie",
    deleteTooltip: "Supprimer",
    uploadQuestionsTemplate: "Télécharger le Modèle de Questions",
    uploadQuestionsDescription: "Téléchargez un nouveau modèle de questions au format Excel. Ce modèle définit toutes les questions du protocole.",
    uploadProtocolTemplate: "Télécharger le Modèle de Protocole",
    uploadProtocolDescription: "Téléchargez un nouveau modèle de format de protocole au format Excel. Ce modèle contient la mise en page du protocole final.",
    exampleTemplateName: "ex. OTIS Modèle de Questions 2025",
    exampleProtocolName: "ex. OTIS Protocole FR",
    selectExcel: "Sélectionner un Fichier Excel",
    uploadExcelWithQuestions: "Télécharger le fichier Excel avec les questions",
    uploadProtocolFormat: "Télécharger le modèle de format de protocole",
    selected: "Sélectionné",
    protocolListDescription: "Aperçu de tous les protocoles créés",
    pieces: "pièces",
    protocolNumber: "Numéro de Protocole",
    createdAt: "Créé le",
    status: "Statut",
    actions: "Actions",
    completed: "Terminé",
    protocolFetchError: "Échec de la récupération des protocoles.",
    protocolDeletedSuccess: "Protocole supprimé avec succès.",
    protocolDeleteError: "Échec de la suppression",
    loadingProtocols: "Chargement des protocoles...",
    retry: "Réessayer",
    noProtocolsYet: "Aucun protocole créé pour l'instant",
    delete_confirmation_title: "Êtes-vous sûr de vouloir supprimer?",
    delete_mapping_warning: "Cette action est définitive. La suppression du mappage pourrait rendre le type d'ascenseur inactif pour les utilisateurs.",
    confirm_delete: "Confirmer la Suppression",
    
    // Login page
    loginTitle: "Connexion",
    registerTitle: "Inscription",
    loginDescription: "Connectez-vous à votre compte pour continuer",
    registerDescription: "Créer un nouveau compte",
    emailLabel: "Adresse E-mail",
    passwordLabel: "Mot de Passe",
    loginButton: "Connexion",
    registerButton: "S'inscrire",
    switchToRegister: "Pas encore de compte? Inscrivez-vous!",
    switchToLogin: "Vous avez déjà un compte? Connectez-vous!",
    missingData: "Données Manquantes",
    pleaseProvideEmailAndPassword: "Veuillez fournir votre adresse e-mail et votre mot de passe.",
    loginSuccessful: "Connexion réussie! ✅",
    welcomeUser: "Bienvenue, {e-mail}!",
    loginError: "Erreur de Connexion",
    invalidCredentials: "Adresse e-mail ou mot de passe invalide. Si vous n'avez pas encore de compte, veuillez d'abord vous inscrire!",
    emailNotConfirmed: "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte de réception.",
    genericLoginError: "Échec de la connexion. Vérifiez vos informations d'identification.",
    weakPassword: "Mot de Passe Faible",
    passwordMinLength: "Le mot de passe doit contenir au moins 6 caractères.",
    emailConfirmationRequired: "Confirmation par E-mail Requise 📧",
    checkEmailForConfirmation: "Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.",
    registrationSuccessful: "Inscription réussie! 🎉",
    loginSuccessfulAfterRegistration: "Connexion réussie!",
    userAlreadyExists: "Cette adresse e-mail est déjà utilisée.",
    forgotPassword: "Mot de passe oublié?",
    or: "ou",

    // Lift Selector
    select_lift_type: "Sélectionner le Type d'Ascenseur",
    select_lift_type_description: "Veuillez sélectionner la catégorie d'ascenseur appropriée",
    select_subtype: "Sélectionner le Sous-type",
    select_subtype_description: "Veuillez sélectionner le type d'ascenseur spécifique",
    subtypes_available: "sous-types disponibles",
    no_mapping_available: "Aucun modèle disponible pour ce type",
    missing_question_template: "Modèle de questions manquant",
    missing_protocol_template: "Modèle de protocole manquant",
    question_template: "Modèle de Questions",
    protocol_template: "Modèle de Protocole",
    error_loading_lift_types: "Erreur lors du chargement des types d'ascenseurs",
    back_to_start: "Retour à l'écran de démarrage",
    
    // Admin UI (New)
    lift_type_management: "Gestion des Types d'Ascenseurs",
    create_new_type: "Nouveau Type",
    create_new_subtype: "Nouveau Sous-type",
    create_new_mapping: "Nouveau Mappage",
    type_code: "Code du Type",
    type_name_hu: "Nom Hongrois",
    type_name_de: "Nom Allemand",
    description_hu: "Description (Hongrois)",
    description_de: "Description (Allemand)",
    subtypes: "Sous-types",
    mappings: "Mappages de Modèles",
    deactivate: "Désactiver",
    select_lift_subtype: "Sélectionner le sous-type d'ascenseur",
    select_question_template: "Sélectionner le modèle de questions",
    select_protocol_template: "Sélectionner le modèle de protocole",
    type_created_successfully: "Type créé avec succès",
    subtype_created_successfully: "Sous-type créé avec succès",
    mapping_created_successfully: "Mappage de modèle créé avec succès",
    mapping_activated_successfully: "Mappage de modèle activé",
    type_already_exists: "Ce code de type existe déjà",
    subtype_already_exists: "Ce code de sous-type existe déjà pour ce type",
    invalid_template_type: "Type de modèle invalide",
    active_mapping_exists: "Un mappage actif existe déjà pour ce sous-type",

    // Page specific translations
    generalData: "Données Générales",
    machineRoom: "Local des Machines",
    modernizationAffected: "Affecté par la Modernisation",
    questionsInGroup: "questions dans ce groupe", 
    groupOf: "groupe",
    viewErrors: "Voir les Erreurs",
    downloadErrorList: "Télécharger la Liste d'Erreurs",
    question: "Question",
    questionsSuffix: "questions",
    questions: "Questions",

    // Grounding specific
    groundingError: "Erreur de Mise à la Terre", 
    additionalErrorsInList: "Trouvez des erreurs supplémentaires dans la liste d'erreurs commune.", 

    // Missing keys
    types: "Types",
    notes: "Notes",
    optional_notes: "Notes facultatives...",
    create_new_type_description: "Créer un nouveau type principal d'ascenseur",
    create_new_subtype_description: "Créer un nouveau sous-type pour la catégorie sélectionnée",
    create_new_mapping_description: "Attribuer des modèles à un sous-type",
    ui_theme: "Interface Utilisateur",
    select_ui_theme: "Sélectionner l'apparence de l'application",
    modern_theme: "Moderne",
    modern_theme_desc: "Un design frais et coloré avec des ombres et des dégradés.",
    classic_theme: "Classique",
    classic_theme_desc: "Un look épuré et professionnel avec des lignes nettes.",
    backup_under_development: "La fonction de sauvegarde est en développement",
    try_refresh_button: "Essayez de recharger la page.",

    // Profile (Nested Object)
    Profile: {
      loading: "Chargement du Profil...",
      createTitle: "Créer un Nouveau Profil",
      editTitle: "Modifier le Profil",
      createDesc: "Créez votre premier profil en entrant vos données",
      editDesc: "Entrez ou mettez à jour vos données de profil",
      userRole: "Utilisateur",
      statusNew: "Nouveau Profil",
      statusActive: "Actif",
      logout: "Déconnexion",
      nameLabel: "Nom",
      namePlaceholder: "Votre nom complet",
      addressLabel: "Adresse",
      addressPlaceholder: "Rue, numéro de maison, ville",
      driveLabel: "ID du Dossier Google Drive",
      driveHelp: "L'ID du dossier où les protocoles sont téléchargés (facultatif).",
      createBtn: "Créer le Profil",
      saveBtn: "Sauvegarder le Profil",
      creating: "Création...",
      saving: "Sauvegarde...",
      unsavedChanges: "Modifications non sauvegardées",
      noUser: "Aucun utilisateur connecté.",
      createFailed: "Échec de la création",
      updateFailed: "Échec de la mise à jour",
      createSuccessTitle: "Créé avec succès!",
      createSuccessDesc: "Vos données de profil ont été créées.",
      saveSuccessTitle: "Sauvegardé avec succès!",
      saveSuccessDesc: "Vos données de profil ont été mises à jour.",
      createErrorTitle: "Erreur de création",
      saveErrorTitle: "Erreur de mise à jour",
      logoutSuccessTitle: "Déconnexion réussie",
      logoutSuccessDesc: "Au revoir! 👋",
      logoutErrorTitle: "Erreur de déconnexion"
    },

    // Admin Nested Object
    Admin: {
      tabs: {
        dashboard: "Tableau de Bord",
        users: "Utilisateurs",
        protocols: "Protocoles",
        templates: "Modèles",
        audit: "Journal d'Audit",
        settings: "Paramètres",
      },
      Dashboard: {
        welcome: "Bienvenue sur le Tableau de Bord Admin",
        welcomeDesc: "Aperçu du système et statistiques",
        noData: "Échec du chargement des statistiques",
        totalUsers: "Total Utilisateurs",
        registeredUsers: "Comptes Enregistrés",
        totalProtocols: "Total Protocoles",
        completedProtocols: "Protocoles Terminés",
        totalTemplates: "Total Modèles",
        uploadedTemplates: "Modèles Téléchargés",
        activeTemplates: "Modèles Actifs",
        currentlyActive: "Actuellement utilisé",
        recentActivity: "Activité Récente",
        recentProtocols: "Protocoles Récents",
        last5Protocols: "Les 5 derniers protocoles créés",
        noProtocols: "Aucun protocole créé pour l'instant.",
        protocolNumber: "Numéro de Protocole",
        status: "Statut",
        createdAt: "Créé le",
        systemHealth: "Santé du Système",
        activeUsers: "Activité Utilisateur",
        online: "En ligne",
        database: "Base de Données",
        healthy: "Sain",
        storage: "Stockage",
        ok: "OK",
        quickStats: "Statistiques Rapides",
        avgProtocolsPerDay: "Moyenne Protocoles/Jour (30 jours)",
        templatesPerUser: "Ratio Modèle/Utilisateur",
        activeRate: "Taux de Modèles Actifs",
        systemActivity: "Activité Système",
        activityDesc: "Aperçu rapide du fonctionnement du système",
        recentProtocolsTable: "Protocoles Récents",
        systemStatus: "Statut du Système",
        operational: "Opérationnel",
        completed: "Terminé",
        table: {
          id: "ID",
          created: "Créé",
          status: "Statut",
        },
      },
      UserManagement: {
        title: "Gestion des Utilisateurs",
        description: "Gérer tous les utilisateurs enregistrés",
        usersCount: "utilisateurs",
        noUsers: "Aucun utilisateur disponible.",
        errorAuth: "Authentification requise",
        errorFetch: "Échec du chargement des utilisateurs",
        errorDelete: "Échec de la suppression",
        deleteSuccess: "Utilisateur supprimé avec succès",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer: {name}?",
        roleAdmin: "Admin",
        roleUser: "Utilisateur",
        table: {
          name: "Nom",
          email: "E-mail",
          role: "Rôle",
          created: "Créé",
          actions: "Actions"
        },
        buttons: {
          delete: "Supprimer",
          details: "Détails",
          editRole: "Modifier le Rôle"
        }
      },
      AuditLog: {
        title: "Journal d'Activité",
        description: "Suivi de toutes les actions administratives",
        entries: "entrées",
        refresh: "Actualiser",
        noLogs: "Aucune entrée de journal pour l'instant.",
        table: {
          status: "Statut",
          action: "Action",
          user: "Utilisateur",
          resource: "Ressource",
          details: "Détails",
          time: "Heure",
        },
      },
      Settings: {
        title: "Paramètres Système",
        description: "Informations sur le serveur et la base de données, sauvegardes",
        refresh: "Actualiser",
        refreshed: "Informations système mises à jour",
        loadError: "Échec du chargement des données",
        systemInfo: "Informations Système",
        systemInfoDesc: "Données techniques du serveur et de la base de données",
        environment: "Environnement",
        platform: "Plateforme",
        nodeVersion: "Version Node.js",
        databaseSize: "Taille de la Base de Données",
        uptime: "Temps de Fonctionnement",
        memoryUsage: "Utilisation de la Mémoire",
        backupTitle: "Sauvegarde et Restauration",
        backupDesc: "Sauvegarder la base de données et restaurer les états précédents",
        createBackup: "Créer une Sauvegarde",
        restoreBackup: "Restaurer la Sauvegarde",
        comingSoon: "Fonctionnalité bientôt disponible",
      },
      comingSoon: {
        dashboard: "Tableau de Bord bientôt disponible",
        dashboardDesc: "Statistiques et aperçu disponibles prochainement.",
        protocols: "Gestion des Protocoles bientôt disponible",
        protocolsDesc: "Gérez les protocoles d'inspection ici.",
        templates: "Gestion des Modèles",
        templatesDesc: "Déplacez l'ancienne logique de modèle vers un nouveau composant TemplateManagement."
      }
    },
  },

  it: {
    // Start Screen
    slogan: "Made to move you",
    hungarian: "Ungherese",
    english: "Inglese",
    french: "Francese",
    italian: "Italiano",
    
    // Header
    title: "OTIS APROD - Protocollo di Accettazione",
    receptionDate: "Data di Ricezione:",
    progress: "Progresso",
    home: "Home",
    settings: "Impostazioni",
    
    // Navigation
    previous: "Precedente",
    next: "Successivo",
    save: "Salva",
    saved: "Salvato",
    saving: "Salvataggio...",
    autoSaved: "Salvato automaticamente",
    back: "Indietro",
    complete: "Completa Protocollo",
    startNew: "Avvia Nuovo Protocollo",
    
    // Answers
    yes: "Sì",
    no: "No",
    notApplicable: "Non applicabile",
    
    // Error List
    errorList: "Elenco Errori",
    addError: "Aggiungi Errore",
    noErrors: "Nessun errore segnalato",
    editError: "Modifica",
    deleteError: "Elimina",
    errorRegistrationRequired: "Registrazione errore richiesta",
    errorSingular: "errore",
    errorPlural: "errori",
    allGood: "Tutto bene!",
    autoErrorNotEditable: "Gli errori automatici non sono modificabili!",
    errorDeletedSuccessfully: "Errore eliminato con successo!",
    errorDeletedFromList: "Errore eliminato dall'elenco errori!",
    
    // Error Modal
    addErrorTitle: "Aggiungi Nuovo Errore",
    severity: "Livello di Gravità",
    critical: "Critico",
    medium: "Medio",
    low: "Basso",
    errorTitle: "Titolo Errore",
    errorDescription: "Descrizione dettagliata",
    attachPhotos: "Allega Foto",
    uploadPhotos: "Clicca o trascina le foto da caricare qui",
    selectFiles: "Seleziona File",
    cancel: "Annulla",
    saveError: "Salva Errore",
    
    // Signature
    signatureTitle: "Firma Digitale",
    signatureInstruction: "Si prega di fornire la propria firma",
    signaturePrompt: "Firma qui con il dito o lo stilo",
    clear: "Cancella",
    printedName: "Nome Stampato (opzionale)",
    signatureDate: "Data Firma: ",

    // Signature details
    signatureLastStep: "Ultimo Passaggio: Firma",
    signatureOptionalInfo: "La firma è opzionale - il protocollo può essere completato senza nome",
    signatureNameAutoSave: "Il nome verrà salvato automaticamente",
    signatureInfo: "Informazioni sulla Firma",
    optional: "Opzionale",
    signatureInfoText1: "La firma viene registrata digitalmente",
    signatureInfoText2: "Salvataggio automatico ad ogni modifica",
    signatureInfoText3: "La firma sarà inclusa nel documento PDF finale",
    signatureInfoText4: "Il protocollo può essere completato senza nome",
    
    // Completion
    completionTitle: "Protocollo Completato",
    protocolComplete: "Protocollo completato con successo",
    completionMessage: "Il tuo protocollo di accettazione è stato creato ed è pronto per la distribuzione.",
    emailPDF: "Invia PDF via E-mail",
    saveToCloud: "Salva su Google Drive",
    downloadPDF: "Scarica PDF",
    downloadExcel: "Scarica Excel",
    viewProtocol: "Visualizza Anteprima Protocollo",
    downloadGroundingPDF: "Protocollo di Messa a Terra",
    generating: "Generazione",
    previewGeneratingTitle: "Generazione PDF...",
    previewGeneratingWait: "Attendere, l'operazione potrebbe richiedere 10-15 secondi.",
    previewErrorTitle: "Errore di Anteprima",
    previewCloseWindow: "Chiudi Finestra",
    emailSending: "Invio e-mail in corso...",
    emailSentSuccess: "E-mail inviata con successo!",
    emailSentError: "Invio e-mail fallito!",
    sending: "Invio...",
    noFormDataError: "Nessun dato salvato per generare il PDF.",
    pdfGenerationError: "Generazione PDF fallita sul server.",
    popupBlockedTitle: "Popup Bloccato",
    popupBlockedDescription: "Il browser ha bloccato il popup. Si prega di consentire i popup per questo sito.",
    noSavedDataForPreview: "Nessun dato salvato in localStorage per l'anteprima.",
    pdfGenerationServerError: "Generazione PDF fallita sul server.",
    errorOccurred: "Si è verificato un errore",
    closeWindow: "Chiudi Finestra",
    noGroundingDataError: "Nessun dato di messa a terra per generare il PDF.",
    groundingPdfGenerationError: "Generazione PDF di messa a terra fallita.",
    downloadSuccessTitle: "Download Riuscito",
    groundingProtocolDownloaded: "Il protocollo di messa a terra è stato scaricato con successo.",
    downloadErrorTitle: "Errore di Download",
    groundingProtocolDownloadError: "Download del protocollo di messa a terra fallito. Riprova.",
    
    // Validation
    requiredField: "Questo campo è richiesto",
    invalidEmail: "Indirizzo e-mail non valido",
    
    // Common
    loading: "Caricamento...",
    error: "Si è verificato un errore",
    success: "Operazione riuscita",
    
    // Measurement and calculation components
    measurementData: "Dati di Misurazione",
    calculatedValues: "Valori Calcolati",
    calculatedValuesValidated: "I valori calcolati vengono generati automaticamente. I valori fuori intervallo saranno mostrati in rosso.",
    outOfRange: "Fuori Intervallo (700-9000 mm)",
    errorRecordingRequired: "Registrazione errore richiesta",
    
    // Admin Interface
    admin: "Amministrazione",
    templates: "Modelli",
    uploadTemplate: "Carica Modello",
    templateName: "Nome Modello",
    templateType: "Tipo Modello",
    questionsTemplate: "Modello Domande",
    protocolTemplate: "Modello Protocollo",
    activate: "Attiva",
    active: "Attivo",
    inactive: "Inattivo",
    upload: "Carica",
    preview: "Anteprima",
    configure: "Configura",
    cellReference: "Riferimento Cella",
    sheetName: "Nome Foglio",
    questionConfiguration: "Configurazione Domande",
    uploadExcelFile: "Carica File",
    selectExcelFile: "Seleziona File",
    questionsTemplateUploaded: "Modello domande caricato con successo",
    protocolTemplateUploaded: "Modello protocollo caricato con successo",
    pleaseProvideNameAndFile: "Si prega di fornire nome e selezionare file",
    templateActivatedSuccessfully: "Modello attivato con successo",
    failedToActivateTemplate: "Attivazione modello fallita",
    failedToLoadTemplatePreview: "Caricamento anteprima modello fallito",
    errorLoadingTemplatePreview: "Errore durante il caricamento dell'anteprima del modello",
    confirmDeleteTemplate: "Sei sicuro di voler eliminare il modello \"{name}\"? Questa azione non può essere annullata.",
    templateDeletedSuccessfully: "Modello eliminato con successo",
    templateDeleteFailed: "Eliminazione modello fallita",
    noTemplatesUploaded: "Nessun modello caricato",
    hybridTemplates: "Modelli Ibridi",
    profile: "Profilo",
    hybridTemplateManagement: "Gestione Modelli Ibridi",
    localTemplates: "Modelli Locali",
    chooseTemplate: "Scegli Modello",
    loadingStrategy: "Strategia di Caricamento",
    localFirst: "Locale Prima",
    cacheFirst: "Cache Prima",
    remoteOnly: "Solo Remoto",
    switching: "Commutazione...",
    templateSwitch: "Cambio Modello",
    templateSwitchSuccess: "Cambio modello riuscito: {name}",
    templateSwitchFailed: "Cambio modello fallito",
    homeTooltip: "Home",
    failedToFetchTemplates: "Recupero modelli fallito",
    questionTemplate: "Modello Domande",
    protocolTemplateName: "Modello Protocollo",
    noSheet: "Nessun foglio",
    activeQuestion: "domanda attiva",
    questionsAndExcelMapping: "Domande e Mappature Celle Excel",
    noCell: "Nessuna cella",
    noQuestionsDefined: "Nessuna domanda definita",
    deleteTooltip: "Elimina",
    uploadQuestionsTemplate: "Carica Modello Domande",
    uploadQuestionsDescription: "Carica un nuovo modello di domande in formato Excel. Questo modello definisce tutte le domande del protocollo.",
    uploadProtocolTemplate: "Carica Modello Protocollo",
    uploadProtocolDescription: "Carica un nuovo modello di formato protocollo in formato Excel. Questo modello contiene il layout del protocollo finale.",
    exampleTemplateName: "es. OTIS Modello Domande 2025",
    exampleProtocolName: "es. OTIS Protocollo IT",
    selectExcel: "Seleziona File Excel",
    uploadExcelWithQuestions: "Carica file Excel con domande",
    uploadProtocolFormat: "Carica modello formato protocollo",
    selected: "Selezionato",
    protocolListDescription: "Panoramica di tutti i protocolli creati",
    pieces: "pz",
    protocolNumber: "Numero Protocollo",
    createdAt: "Creato il",
    status: "Stato",
    actions: "Azioni",
    completed: "Completato",
    protocolFetchError: "Recupero protocolli fallito.",
    protocolDeletedSuccess: "Protocollo eliminato con successo.",
    protocolDeleteError: "Eliminazione fallita",
    loadingProtocols: "Caricamento protocolli...",
    retry: "Riprova",
    noProtocolsYet: "Ancora nessun protocollo creato",
    delete_confirmation_title: "Sei sicuro di voler eliminare?",
    delete_mapping_warning: "Questa azione è definitiva. L'eliminazione della mappatura potrebbe rendere il tipo di ascensore inattivo per gli utenti.",
    confirm_delete: "Conferma Eliminazione",
    
    // Login page
    loginTitle: "Accesso",
    registerTitle: "Registrazione",
    loginDescription: "Accedi al tuo account per continuare",
    registerDescription: "Crea un nuovo account",
    emailLabel: "Indirizzo E-mail",
    passwordLabel: "Password",
    loginButton: "Accesso",
    registerButton: "Registrati",
    switchToRegister: "Non hai un account? Registrati!",
    switchToLogin: "Hai già un account? Accedi!",
    missingData: "Dati Mancanti",
    pleaseProvideEmailAndPassword: "Si prega di fornire il proprio indirizzo e-mail e password.",
    loginSuccessful: "Accesso riuscito! ✅",
    welcomeUser: "Benvenuto, {e-mail}!",
    loginError: "Errore di Accesso",
    invalidCredentials: "Indirizzo e-mail o password non validi. Se non hai ancora un account, registrati prima!",
    emailNotConfirmed: "Il tuo indirizzo e-mail non è ancora stato confermato. Controlla la tua casella di posta.",
    genericLoginError: "Accesso fallito. Controlla le tue credenziali.",
    weakPassword: "Password Debole",
    passwordMinLength: "La password deve essere lunga almeno 6 caratteri.",
    emailConfirmationRequired: "Conferma E-mail Richiesta 📧",
    checkEmailForConfirmation: "Controlla la tua casella di posta e clicca sul link di conferma.",
    registrationSuccessful: "Registrazione riuscita! 🎉",
    loginSuccessfulAfterRegistration: "Accesso riuscito!",
    userAlreadyExists: "Questo indirizzo e-mail è già in uso.",
    forgotPassword: "Password dimenticata?",
    or: "o",

    // Lift Selector
    select_lift_type: "Seleziona Tipo di Ascensore",
    select_lift_type_description: "Si prega di selezionare la categoria di ascensore appropriata",
    select_subtype: "Seleziona Sottotipo",
    select_subtype_description: "Si prega di selezionare il tipo di ascensore specifico",
    subtypes_available: "sottotipi disponibili",
    no_mapping_available: "Nessun modello disponibile per questo tipo",
    missing_question_template: "Modello domande mancante",
    missing_protocol_template: "Modello protocollo mancante",
    question_template: "Modello Domande",
    protocol_template: "Modello Protocollo",
    error_loading_lift_types: "Errore durante il caricamento dei tipi di ascensori",
    back_to_start: "Torna alla schermata iniziale",
    
    // Admin UI (New)
    lift_type_management: "Gestione Tipi di Ascensori",
    create_new_type: "Nuovo Tipo",
    create_new_subtype: "Nuovo Sottotipo",
    create_new_mapping: "Nuova Mappatura",
    type_code: "Codice Tipo",
    type_name_hu: "Nome Ungherese",
    type_name_de: "Nome Tedesco",
    description_hu: "Descrizione (Ungherese)",
    description_de: "Descrizione (Tedesco)",
    subtypes: "Sottotipi",
    mappings: "Mappature Modelli",
    deactivate: "Disattiva",
    select_lift_subtype: "Seleziona sottotipo di ascensore",
    select_question_template: "Seleziona modello domande",
    select_protocol_template: "Seleziona modello protocollo",
    type_created_successfully: "Tipo creato con successo",
    subtype_created_successfully: "Sottotipo creato con successo",
    mapping_created_successfully: "Mappatura modello creata con successo",
    mapping_activated_successfully: "Mappatura modello attivata",
    type_already_exists: "Questo codice tipo esiste già",
    subtype_already_exists: "Questo codice sottotipo esiste già per questo tipo",
    invalid_template_type: "Tipo di modello non valido",
    active_mapping_exists: "Una mappatura attiva esiste già per questo sottotipo",

    // Page specific translations
    generalData: "Dati Generali",
    machineRoom: "Locale Macchine",
    modernizationAffected: "Interessato dalla Modernizzazione",
    questionsInGroup: "domande in questo gruppo", 
    groupOf: "gruppo",
    viewErrors: "Visualizza Errori",
    downloadErrorList: "Scarica Elenco Errori",
    question: "Domanda",
    questionsSuffix: "domande",
    questions: "Domande",

    // Grounding specific
    groundingError: "Errore di Messa a Terra", 
    additionalErrorsInList: "Trova errori aggiuntivi nell'elenco errori comune.", 

    // Missing keys
    types: "Tipi",
    notes: "Note",
    optional_notes: "Note opzionali...",
    create_new_type_description: "Crea un nuovo tipo principale di ascensore",
    create_new_subtype_description: "Crea un nuovo sottotipo per la categoria selezionata",
    create_new_mapping_description: "Assegna modelli a un sottotipo",
    ui_theme: "Interfaccia Utente",
    select_ui_theme: "Seleziona l'aspetto dell'applicazione",
    modern_theme: "Moderno",
    modern_theme_desc: "Un design fresco e colorato con ombre e sfumature.",
    classic_theme: "Classico",
    classic_theme_desc: "Un look pulito e professionale con linee nitide.",
    backup_under_development: "La funzione di backup è in fase di sviluppo",
    try_refresh_button: "Prova a ricaricare la pagina.",

    // Profile (Nested Object)
    Profile: {
      loading: "Caricamento Profilo...",
      createTitle: "Crea Nuovo Profilo",
      editTitle: "Modifica Profilo",
      createDesc: "Crea il tuo primo profilo inserendo i tuoi dati",
      editDesc: "Inserisci o aggiorna i tuoi dati del profilo",
      userRole: "Utente",
      statusNew: "Nuovo Profilo",
      statusActive: "Attivo",
      logout: "Esci",
      nameLabel: "Nome",
      namePlaceholder: "Il tuo nome completo",
      addressLabel: "Indirizzo",
      addressPlaceholder: "Via, numero civico, città",
      driveLabel: "ID Cartella Google Drive",
      driveHelp: "L'ID della cartella in cui vengono caricati i protocolli (opzionale).",
      createBtn: "Crea Profilo",
      saveBtn: "Salva Profilo",
      creating: "Creazione...",
      saving: "Salvataggio...",
      unsavedChanges: "Modifiche non salvate",
      noUser: "Nessun utente loggato.",
      createFailed: "Creazione fallita",
      updateFailed: "Aggiornamento fallito",
      createSuccessTitle: "Creato con successo!",
      createSuccessDesc: "I dati del tuo profilo sono stati creati.",
      saveSuccessTitle: "Salvato con successo!",
      saveSuccessDesc: "I dati del tuo profilo sono stati aggiornati.",
      createErrorTitle: "Errore di creazione",
      saveErrorTitle: "Errore di aggiornamento",
      logoutSuccessTitle: "Uscita riuscita",
      logoutSuccessDesc: "Arrivederci! 👋",
      logoutErrorTitle: "Errore di uscita"
    },

    // Admin Nested Object
    Admin: {
      tabs: {
        dashboard: "Dashboard",
        users: "Utenti",
        protocols: "Protocolli",
        templates: "Modelli",
        audit: "Registro Audit",
        settings: "Impostazioni",
      },
      Dashboard: {
        welcome: "Benvenuto nella Dashboard Admin",
        welcomeDesc: "Panoramica e statistiche del sistema",
        noData: "Caricamento statistiche fallito",
        totalUsers: "Totale Utenti",
        registeredUsers: "Account Registrati",
        totalProtocols: "Totale Protocolli",
        completedProtocols: "Protocolli Completati",
        totalTemplates: "Totale Modelli",
        uploadedTemplates: "Modelli Caricati",
        activeTemplates: "Modelli Attivi",
        currentlyActive: "Attualmente in uso",
        recentActivity: "Attività Recente",
        recentProtocols: "Protocolli Recenti",
        last5Protocols: "Gli ultimi 5 protocolli creati",
        noProtocols: "Ancora nessun protocollo creato.",
        protocolNumber: "Numero Protocollo",
        status: "Stato",
        createdAt: "Creato il",
        systemHealth: "Salute del Sistema",
        activeUsers: "Attività Utente",
        online: "Online",
        database: "Database",
        healthy: "Sano",
        storage: "Archiviazione",
        ok: "OK",
        quickStats: "Statistiche Rapide",
        avgProtocolsPerDay: "Media Protocolli/Giorno (30 giorni)",
        templatesPerUser: "Rapporto Modello/Utente",
        activeRate: "Tasso Modelli Attivi",
        systemActivity: "Attività di Sistema",
        activityDesc: "Panoramica rapida del funzionamento del sistema",
        recentProtocolsTable: "Protocolli Recenti",
        systemStatus: "Stato del Sistema",
        operational: "Operativo",
        completed: "Completato",
        table: {
          id: "ID",
          created: "Creato",
          status: "Stato",
        },
      },
      UserManagement: {
        title: "Gestione Utenti",
        description: "Gestisci tutti gli utenti registrati",
        usersCount: "utenti",
        noUsers: "Nessun utente disponibile.",
        errorAuth: "Autenticazione richiesta",
        errorFetch: "Caricamento utenti fallito",
        errorDelete: "Eliminazione fallita",
        deleteSuccess: "Utente eliminato con successo",
        confirmDelete: "Sei sicuro di voler eliminare: {name}?",
        roleAdmin: "Admin",
        roleUser: "Utente",
        table: {
          name: "Nome",
          email: "E-mail",
          role: "Ruolo",
          created: "Creato",
          actions: "Azioni"
        },
        buttons: {
          delete: "Elimina",
          details: "Dettagli",
          editRole: "Modifica Ruolo"
        }
      },
      AuditLog: {
        title: "Registro Attività",
        description: "Tracciamento di tutte le azioni amministrative",
        entries: "voci",
        refresh: "Aggiorna",
        noLogs: "Ancora nessuna voce di registro.",
        table: {
          status: "Stato",
          action: "Azione",
          user: "Utente",
          resource: "Risorsa",
          details: "Dettagli",
          time: "Ora",
        },
      },
      Settings: {
        title: "Impostazioni di Sistema",
        description: "Informazioni su server e database, backup",
        refresh: "Aggiorna",
        refreshed: "Informazioni di sistema aggiornate",
        loadError: "Caricamento dati fallito",
        systemInfo: "Informazioni di Sistema",
        systemInfoDesc: "Dati tecnici del server e del database",
        environment: "Ambiente",
        platform: "Piattaforma",
        nodeVersion: "Versione Node.js",
        databaseSize: "Dimensione Database",
        uptime: "Tempo di Attività",
        memoryUsage: "Utilizzo Memoria",
        backupTitle: "Backup e Ripristino",
        backupDesc: "Backup del database e ripristino degli stati precedenti",
        createBackup: "Crea Backup",
        restoreBackup: "Ripristina Backup",
        comingSoon: "Funzione in arrivo",
      },
      comingSoon: {
        dashboard: "Dashboard in arrivo",
        dashboardDesc: "Statistiche e panoramica disponibili a breve.",
        protocols: "Gestione Protocolli in arrivo",
        protocolsDesc: "Gestisci qui i protocolli di ispezione.",
        templates: "Gestione Modelli",
        templatesDesc: "Sposta la vecchia logica del modello in un nuovo componente TemplateManagement."
        }
    },
  },
};
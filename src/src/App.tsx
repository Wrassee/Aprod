import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

/* -------------------- 3rd‑party -------------------- */
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { LanguageProvider } from "./components/language-provider.js";

/* --------------------  PWA  (jelenleg letiltva) -------------------- */
// import { PWAInstallBanner, OfflineIndicator } from "./components/pwa‑install‑banner";

/* --------------------  Oldalak / Komponensek -------------------- */
import { StartScreen } from "./pages/start-screen.js";
import Questionnaire from "./pages/questionnaire.js";
import { NiedervoltTable } from "./pages/niedervolt-table.js";
import { Signature } from "./pages/signature.js";
import { Completion } from "./pages/completion.js";
import { Admin } from "./pages/admin.js";
import { ProtocolPreview } from "./pages/protocol-preview.js";
import { SmartHelpWizard } from "./components/smart-help-wizard.js";
import { FormData, MeasurementRow } from "./lib/types.js";

/* --------------------  Shared schema -------------------- */
import { AnswerValue, ProtocolError } from "../shared/schema.js";

/* --------------------  404  -------------------- */
import NotFound from "./pages/not-found.js";

function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'questionnaire' | 'niedervolt' | 'signature' | 'completion' | 'admin' | 'protocol-preview'>('start');
  const [currentQuestionnairePage, setCurrentQuestionnairePage] = useState(0); // Ez a név félrevezető, javítva
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [language, setLanguage] = useState<'hu' | 'de'>('hu');

  const [clearTrigger, setClearTrigger] = useState(Date.now());

  const [formData, setFormData] = useState<FormData>({
    receptionDate: new Date().toISOString().split('T')[0],
    answers: {},
    errors: [],
    signature: '',
    signatureName: '',
    niedervoltMeasurements: [],
    niedervoltTableMeasurements: {},
  });
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const saved = localStorage.getItem('otis-protocol-form-data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (!parsedData.receptionDate || parsedData.receptionDate === '') {
          parsedData.receptionDate = new Date().toISOString().split('T')[0];
        }
        setFormData(parsedData);
      } catch (e) {
        console.error('Error loading saved form data:', e);
      }
    }
  }, []);

  // ========================== 1. VÁLTOZÁS: KÖZPONTI LÉPÉSSZÁMLÁLÓ LOGIKA ==========================
  // Definiáljuk a teljes folyamat hosszát.
  // A Questionnaire (ami feltételezzük, hogy 4 oldalas) + Niedervolt (5) + Signature (6) = 6 lépés
  const totalSteps = 6; 

  // Kiszámoljuk az aktuális lépést a `currentScreen` és a kérdőív belső oldala alapján.
  const currentStep = useMemo(() => {
    switch (currentScreen) {
      case 'questionnaire':
        // A kérdőív 0, 1, 2, 3 oldalai az 1., 2., 3., 4. lépések
        return currentQuestionnairePage + 1;
      case 'niedervolt':
        return 5;
      case 'signature':
        return 6;
      default:
        // Más képernyőkön (start, completion, stb.) a folyamatjelző nem releváns,
        // de az egyszerűség kedvéért visszaadhatjuk az első lépést.
        return 1;
    }
  }, [currentScreen, currentQuestionnairePage]);
  // ===========================================================================================

  const handleLanguageSelect = (selectedLanguage: 'hu' | 'de') => {
    console.log('🌍 App.tsx - Language selected:', selectedLanguage);
    setLanguage(selectedLanguage);
    localStorage.setItem('otis-protocol-language', selectedLanguage);
    console.log('🌍 App.tsx - Language saved to localStorage:', localStorage.getItem('otis-protocol-language'));
    setCurrentScreen('questionnaire');
    localStorage.setItem('questionnaire-current-page', '0');
    
    localStorage.removeItem('protocol-errors');
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProgress = useCallback(() => {
    console.log('🔧 ISOLATED save - no form data access');
  }, []);

  const handleQuestionnaireNext = () => {
    console.log('🔄 Questionnaire completed - showing Niedervolt UI as final step');
    setCurrentScreen('niedervolt');
  };

  const handleNiedervoltBack = () => {
    console.log('🔙 Niedervolt Back button clicked - returning to questionnaire');
    
    const lastPage = localStorage.getItem('questionnaire-current-page');
    if (lastPage) {
      console.log('🔙 Restoring questionnaire page:', lastPage);
    }
    
    setCurrentScreen('questionnaire');
  };

  const handleNiedervoltNext = () => {
    setCurrentScreen('signature');
  };

  const handleSignatureBack = () => {
    console.log('🔙 Signature Back button clicked - returning to niedervolt');
    setCurrentScreen('niedervolt');
  };

  const handleSignatureComplete = async () => {
    console.log('🔄 Starting protocol completion process...');
    
    const currentTime = Date.now();
    if ((window as any).lastCompleteAttempt && currentTime - (window as any).lastCompleteAttempt < 3000) {
      console.log('⚠️ Multiple clicks prevented - waiting for previous attempt to complete');
      return;
    }
    (window as any).lastCompleteAttempt = currentTime;
    
    try {
      const cachedRadioValues = (window as any).radioCache?.getAll?.() || {};
      const cachedTrueFalseValues = (window as any).trueFalseCache || new Map();
      const cachedInputValues = (window as any).stableInputValues || {};
      const cachedMeasurementValues = (window as any).measurementCache?.getAll?.() || {};
      const cachedCalculatedValues = (window as any).calculatedCache?.getAll?.() || {};
      
      const trueFalseAnswers: Record<string, string> = {};
      if (cachedTrueFalseValues instanceof Map) {
        cachedTrueFalseValues.forEach((value, key) => {
          trueFalseAnswers[key] = value;
        });
      } else {
        Object.assign(trueFalseAnswers, cachedTrueFalseValues);
      }
      
      const combinedAnswers = {
        ...formData.answers,
        ...cachedRadioValues,
        ...trueFalseAnswers,
        ...cachedInputValues,
        ...cachedMeasurementValues,
        ...cachedCalculatedValues,
      };
      
      const receptionDate = formData.receptionDate || new Date().toISOString().split('T')[0];
      
      const protocolData = {
        receptionDate,
        reception_date: receptionDate,
        language,
        answers: combinedAnswers,
        errors: formData.errors || [],
        signature: formData.signature || '',
        signatureName: formData.signatureName || (window as any).signatureNameValue || '',
        completed: true,
      };
      
      console.log('✅ Protocol data prepared:', {
        answerCount: Object.keys(combinedAnswers).length,
        errorCount: protocolData.errors.length,
        hasSignature: Boolean(protocolData.signature),
        hasSignatureName: Boolean(protocolData.signatureName),
        receptionDate: protocolData.receptionDate,
        reception_date: protocolData.reception_date,
        language: protocolData.language
      });
      
      console.log('📤 Sending protocol to backend...');
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData),
      });

      console.log('📥 Backend response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Protocol saved successfully:', result.id);
        
        const finalFormData = {
          ...formData,
          answers: combinedAnswers,
          signatureName: protocolData.signatureName,
          completed: true
        };
        localStorage.setItem('otis-protocol-form-data', JSON.stringify(finalFormData));
        
        setCurrentScreen('completion');
        console.log('🎉 Protocol completion successful - navigating to completion screen');
      } else {
        const errorText = await response.text();
        console.error('❌ Protocol creation failed:', errorText);
        alert(`Protokoll mentési hiba: ${errorText}\n\nKérjük próbálja újra vagy lépjen kapcsolatba a támogatással.`);
        
        delete (window as any).lastCompleteAttempt;
      }
    } catch (error) {
      console.error('❌ Error completing protocol:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      alert(`Protokoll befejezési hiba: ${errorMessage}\n\nKérjük ellenőrizze az internetkapcsolatot és próbálja újra.`);
      
      delete (window as any).lastCompleteAttempt;
    }
  };

  const handleEmailPDF = async () => { /* ... változatlan ... */ };
  const handleSaveToCloud = async () => { /* ... változatlan ... */ };
  const handleDownloadPDF = async () => { /* ... változatlan ... */ };
  const handleDownloadExcel = async () => { /* ... változatlan ... */ };
  const handleViewProtocol = () => { setCurrentScreen('protocol-preview'); };

  const handleStartNew = () => {
    console.log('🆕 Starting new protocol - clearing all data with page reload...');
    
    localStorage.removeItem('otis-protocol-form-data');
    localStorage.removeItem('protocol-errors');
    localStorage.removeItem('questionnaire-current-page');
    localStorage.removeItem('niedervolt-table-measurements');
    localStorage.removeItem('niedervolt-selected-devices');
    localStorage.removeItem('niedervolt-custom-devices');
    
    if ((window as any).radioCache) (window as any).radioCache.clear();
    if ((window as any).trueFalseCache) (window as any).trueFalseCache.clear();
    if ((window as any).stableInputValues) (window as any).stableInputValues = {};
    if ((window as any).measurementCache) (window as any).measurementCache.clear();
    if ((window as any).calculatedCache) (window as any).calculatedCache = {};
    
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    setTimeout(() => { window.location.reload(); }, 100);
    
    console.log('✅ All data cleared - page reload initiated.');
  };

  const handleGoHome = () => { setCurrentScreen('start'); };
  const handleSettings = () => { setCurrentScreen('admin'); };
  const handleBackToSignature = () => { setCurrentScreen('signature'); };

  const handleAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    setFormData(prev => ({ ...prev, answers: { ...prev.answers, [questionId]: value } }));
  }, []);

  const handleReceptionDateChange = useCallback((date: string) => {
    setFormData(prev => ({ ...prev, receptionDate: date }));
  }, []);

  const handleErrorsChange = useCallback((errors: ProtocolError[]) => {
    setFormData(prev => ({ ...prev, errors }));
  }, []);

  const handleAdminAccess = useCallback(() => setCurrentScreen('admin'), []);
  const handleHome = useCallback(() => setCurrentScreen('start'), []);

  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData(prev => ({ ...prev, niedervoltMeasurements: measurements }));
  }, []);

  const renderCurrentScreen = () => {
    console.log('🏠 Route component function called - currentScreen:', currentScreen);
    
    switch (currentScreen) {
      case 'start':
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
      case 'questionnaire':
        return (
          <Questionnaire
            key={`questionnaire-${clearTrigger}`}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
            answers={formData.answers}
            onAnswerChange={handleAnswerChange}
            errors={formData.errors}
            onErrorsChange={handleErrorsChange}
            onNext={handleQuestionnaireNext}
            onSave={handleSaveProgress}
            language={language}
            onAdminAccess={handleAdminAccess}
            onHome={handleHome}
            onStartNew={handleStartNew}
            onPageChange={setCurrentQuestionnairePage}
            onQuestionChange={setCurrentQuestionId}
            // ================== 2. VÁLTOZÁS: PROP-OK ÁTADÁSA ==================
            currentStep={currentStep}
            totalSteps={totalSteps}
            // =================================================================
          />
        );
      case 'niedervolt':
        return (
          <NiedervoltTable
            key={`niedervolt-table-${clearTrigger}`}
            measurements={formData.niedervoltTableMeasurements || {}}
            onMeasurementsChange={(measurements) => setFormData(prev => ({ ...prev, niedervoltTableMeasurements: measurements }))}
            onBack={handleNiedervoltBack}
            onNext={handleNiedervoltNext}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
            onAdminAccess={handleAdminAccess}
            onHome={handleGoHome}
            onStartNew={handleStartNew}
            // ================== 2. VÁLTOZÁS: PROP-OK ÁTADÁSA ==================
            currentStep={currentStep}
            totalSteps={totalSteps}
            // =================================================================
          />
        );
      case 'signature':
        return (
          <Signature
            signature={formData.signature || ''}
            onSignatureChange={(signature) => setFormData(prev => ({ ...prev, signature }))}
            signatureName={formData.signatureName || ''}
            onSignatureNameChange={(signatureName) => setFormData(prev => ({ ...prev, signatureName }))}
            onBack={handleSignatureBack}
            onComplete={handleSignatureComplete}
          />
        );
      case 'completion':
        return (
          <Completion
            onEmailPDF={handleEmailPDF}
            onSaveToCloud={handleSaveToCloud}
            onDownloadPDF={handleDownloadPDF}
            onDownloadExcel={handleDownloadExcel}
            onViewProtocol={handleViewProtocol}
            onStartNew={handleStartNew}
            onGoHome={handleGoHome}
            onSettings={handleSettings}
            onBackToSignature={handleBackToSignature}
            errors={formData.errors}
            protocolData={{
              buildingAddress: formData.answers['1'] as string || '',
              liftId: formData.answers['7'] as string || '',
              inspectorName: formData.answers['4'] as string || '',
              inspectionDate: formData.receptionDate
            }}
          />
        );
      case 'admin':
        return <Admin 
          onBack={() => setCurrentScreen('questionnaire')} 
          onHome={() => setCurrentScreen('start')} 
        />;
      case 'protocol-preview':
        return <ProtocolPreview onBack={() => setCurrentScreen('completion')} />;
      default:
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          {renderCurrentScreen()}
          
          {(currentScreen === 'questionnaire' || currentScreen === 'niedervolt' || currentScreen === 'signature') && (
            <SmartHelpWizard
              // ======== 3. VÁLTOZÁS (OPCIONÁLIS, DE AJÁNLOTT): EGYSZERŰSÍTÉS ========
              currentPage={currentStep}
              // ======================================================================
              formData={formData}
              currentQuestionId={currentQuestionId}
              errors={formData.errors}
            />
          )}
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
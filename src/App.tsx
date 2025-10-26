import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

/* -------------------- 3rd-party -------------------- */
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { LanguageProvider, useLanguageContext } from "./components/language-provider.js";
import { AuthProvider } from "./contexts/auth-context.js";

/* --------------------  Oldalak / Komponensek -------------------- */
import { StartScreen } from "./pages/start-screen.js";
import Questionnaire from "./pages/questionnaire.js";
import { NiedervoltTable } from "./pages/niedervolt-table.js";
import { Signature } from "./pages/signature.js";
import { Completion } from "./pages/completion.js";
import { Admin } from "./pages/admin.js";
import { ProtocolPreview } from "./pages/protocol-preview.js";
import { Erdungskontrolle } from "./pages/erdungskontrolle.js";
import { Login } from "./pages/login.js";
import { ProtectedRoute } from "./components/protected-route.js";
import { FormData, MeasurementRow } from "./lib/types.js";

/* --------------------  Shared schema -------------------- */
import { AnswerValue, ProtocolError } from "../shared/schema.js";

type Screen = 'start' | 'questionnaire' | 'erdungskontrolle' | 'niedervolt' | 'signature' | 'completion' | 'admin' | 'protocol-preview' | 'login';

// === PROPS INTERFACE A KÉPERNYŐÁLLAPOT ÁTADÁSÁHOZ ===
interface AppContentProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  currentQuestionnaireePage: number;
  setCurrentQuestionnairePage: (page: number) => void;
  currentQuestionId: string;
  setCurrentQuestionId: (id: string) => void;
  clearTrigger: number;
  setClearTrigger: (trigger: number) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

// === APPCONTENT KOMPONENS - CSAK A NYELVI CONTEXTET HASZNÁLJA ===
function AppContent({
  currentScreen,
  setCurrentScreen,
  currentQuestionnaireePage,
  setCurrentQuestionnairePage,
  currentQuestionId,
  setCurrentQuestionId,
  clearTrigger,
  setClearTrigger,
  formData,
  setFormData,
}: AppContentProps) {
  // === HASZNÁLJUK A NYELVI CONTEXTET ===
  const { language, setLanguage } = useLanguageContext();
  
  const formDataRef = useRef(formData);
  
  // Keep ref updated with latest formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleLanguageSelect = (selectedLanguage: 'hu' | 'de') => {
    console.log('🌐 App.tsx - Language selected:', selectedLanguage);
    // === NYELV BEÁLLÍTÁSA A CONTEXTEN KERESZTÜL ===
    setLanguage(selectedLanguage);
    localStorage.setItem('otis-protocol-language', selectedLanguage);
    setCurrentScreen('questionnaire');
    setCurrentQuestionnairePage(0);
    localStorage.setItem('questionnaire-current-page', '0');
    
    // Clear error list when starting new protocol
    localStorage.removeItem('protocol-errors');
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProgress = useCallback(() => {
    // Save is handled automatically by useEffect
    console.log('✅ Progress saved automatically');
  }, []);

  const handleQuestionnaireNext = () => {
    console.log('📄 Questionnaire completed - showing Erdungskontrolle page');
    setCurrentScreen('erdungskontrolle');
  };

  const handleNiedervoltBack = () => {
    console.log('🔙 Niedervolt Back button clicked - returning to erdungskontrolle');
    setCurrentScreen('erdungskontrolle');
  };

  const handleNiedervoltNext = () => {
    setCurrentScreen('signature');
  };

  const handleSignatureBack = () => {
    console.log('🔙 Signature Back button clicked - returning to niedervolt');
    setCurrentScreen('niedervolt');
  };

  // ============================================================================
  // === JAVÍTOTT handleSignatureComplete - FOGADJA A FINAL SIGNER NAME-ET ===
  // ============================================================================
  const handleSignatureComplete = async (finalSignerName: string) => { 
  console.log('📄 App.tsx: Starting protocol completion process with final name:', finalSignerName);
    
    // Prevent multiple clicks
    const currentTime = Date.now();
    if ((window as any).lastCompleteAttempt && currentTime - (window as any).lastCompleteAttempt < 3000) {
      console.log('⚠️ Multiple clicks prevented - waiting for previous attempt to complete');
      return;
    }
    (window as any).lastCompleteAttempt = currentTime;
    
    try {
      // 1. VÉGLEGES, GARANTÁLTAN FRISS ADATOBJEKTUM
      const receptionDate = formData.receptionDate || new Date().toISOString().split('T')[0];
      
      const finalFormData = { 
    ...formData, 
    signerName: finalSignerName.trim(), // Használjuk a kapott, garantáltan friss nevet
    completed: true,
  };

      // 2. FRISSÍTSD A REACT ÁLLAPOTOT
      setFormData(finalFormData);

      // 3. AZONNAL MENTSD EL A VÉGLEGES ADATOT A LOCALSTORAGE-BE
      // Ez felülír minden háttérben futó időzített mentést!
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(finalFormData));
      console.log('💾 App.tsx: GUARANTEED FINAL data saved to localStorage with signerName:', finalSignerName);
      
      // 4. A VÉGLEGES ADATTAL KÜLDD EL A BACKEND-NEK
      const protocolData = {
        receptionDate,
        reception_date: receptionDate,
        language,
        answers: finalFormData.answers,
        errors: finalFormData.errors || [],
        signature: finalFormData.signature || '',
        signatureName: finalFormData.signerName, // ✅ Garantáltan friss
        completed: true,
      };
      
      console.log('✅ Protocol data prepared:', {
        answerCount: Object.keys(protocolData.answers).length,
        errorCount: protocolData.errors.length,
        hasSignature: Boolean(protocolData.signature),
        hasSignatureName: Boolean(protocolData.signatureName),
        signerName: protocolData.signatureName,
        receptionDate: protocolData.receptionDate,
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

  const handleEmailPDF = async () => {
    try {
      const response = await fetch('/api/protocols/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, language }),
      });
      
      if (response.ok) {
        console.log('PDF emailed successfully');
      }
    } catch (error) {
      console.error('Error emailing PDF:', error);
    }
  };

  const handleSaveToCloud = async () => {
    try {
      const response = await fetch('/api/protocols/cloud-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, language }),
      });
      
      if (response.ok) {
        console.log('Saved to cloud successfully');
      }
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/protocols/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, language }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const otisLiftId = formData.answers['7'] || 'Unknown';
        a.download = `AP_${otisLiftId}.pdf`;
        
        console.log('PDF download filename:', a.download);
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      console.log('Starting Excel download with up-to-date formData...');
      
      const otisLiftId = formData.answers['7'] || 'Unknown';
      const filename = `AP_${otisLiftId}.xlsx`;
      
      console.log('Excel download filename:', filename);

      const response = await fetch('/api/protocols/download-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, language }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Excel generation failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading Excel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Excel letöltési hiba: ${errorMessage}\n\nKérjük, próbálja újra.`);
    }
  };

  const handleViewProtocol = () => {
    setCurrentScreen('protocol-preview');
  };

  const handleStartNew = useCallback(() => {
    console.log('🆕 Starting new protocol - clearing all data...');
    
    // Clear all localStorage keys
    const keysToRemove = [
      'otis-protocol-form-data',
      'protocol-errors',
      'questionnaire-current-page',
      'niedervolt-table-measurements',
      'niedervolt-selected-devices',
      'niedervolt-custom-devices',
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear global caches
    if ((window as any).radioCache) (window as any).radioCache.clear();
    if ((window as any).trueFalseCache) (window as any).trueFalseCache.clear();
    if ((window as any).stableInputValues) (window as any).stableInputValues = {};
    if ((window as any).measurementCache) (window as any).measurementCache.clear();
    if ((window as any).calculatedCache) (window as any).calculatedCache = {};
    
    // Notify components
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    // Reset form data
    setFormData({
      receptionDate: new Date().toISOString().split('T')[0],
      answers: {},
      errors: [],
      signature: '',
      signatureName: '',
      niedervoltMeasurements: [],
      niedervoltTableMeasurements: {},
    });
    
    // Trigger component remount
    setClearTrigger(Date.now());
    
    // Reset navigation state
    setCurrentScreen('start');
    setCurrentQuestionnairePage(0);
    setCurrentQuestionId('');
    
    console.log('✅ All data cleared - ready for new protocol');
  }, [setFormData, setClearTrigger, setCurrentScreen, setCurrentQuestionnairePage, setCurrentQuestionId]);

  const handleGoHome = useCallback(() => {
    setCurrentScreen('start');
    setCurrentQuestionnairePage(0);
  }, [setCurrentScreen, setCurrentQuestionnairePage]);

  const handleSettings = useCallback(() => {
    setCurrentScreen('admin');
  }, [setCurrentScreen]);

  const handleBackToSignature = useCallback(() => {
    setCurrentScreen('signature');
  }, [setCurrentScreen]);

  // Stable callbacks to prevent recreation
  const handleAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  }, [setFormData]);

  const handleReceptionDateChange = useCallback((date: string) => {
    setFormData(prev => ({ ...prev, receptionDate: date }));
  }, [setFormData]);

  const handleErrorsChange = useCallback((errors: ProtocolError[]) => {
    setFormData(prev => ({ ...prev, errors }));
  }, [setFormData]);

  const handleAdminAccess = useCallback(() => setCurrentScreen('login'), [setCurrentScreen]);

  const handleLoginSuccess = useCallback(() => {
    console.log('✅ Login successful - redirecting to admin');
    setCurrentScreen('admin');
  }, [setCurrentScreen]);

  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData(prev => ({ ...prev, niedervoltMeasurements: measurements }));
  }, [setFormData]);

  // Conditional render without router
  const renderCurrentScreen = () => {
    console.log('🏠 Rendering screen:', currentScreen, '(language:', language, ')');
    
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
            onHome={handleGoHome}
            onStartNew={handleStartNew}
            onPageChange={setCurrentQuestionnairePage}
            onQuestionChange={setCurrentQuestionId}
            currentPage={currentQuestionnaireePage}
            currentQuestionId={currentQuestionId}
          />
        );
        
      case 'erdungskontrolle':
        return (
          <Erdungskontrolle
            key={`erdungskontrolle-${clearTrigger}`}
            formData={formData}
            setFormData={setFormData}
            onNext={() => setCurrentScreen('niedervolt')}
            onBack={() => setCurrentScreen('questionnaire')}
            onHome={handleGoHome}
            onAdminAccess={handleAdminAccess}
            onStartNew={handleStartNew}
            language={language}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
          />
        );
        
      case 'niedervolt':
        return (
          <NiedervoltTable
            key={`niedervolt-table-${clearTrigger}`}
            measurements={formData.niedervoltTableMeasurements || {}}
            onMeasurementsChange={(measurements) => 
              setFormData(prev => ({ ...prev, niedervoltTableMeasurements: measurements }))
            }
            onBack={handleNiedervoltBack}
            onNext={handleNiedervoltNext}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
            onAdminAccess={handleAdminAccess}
            onHome={handleGoHome}
            onStartNew={handleStartNew}
            formData={formData}
            setFormData={setFormData}
          />
        );
        
      case 'signature':
        return (
          <Signature
            key={`signature-${clearTrigger}`}
            signature={formData.signature || ''}
            onSignatureChange={(signature) => setFormData(prev => ({ ...prev, signature }))}
            signatureName={formData.signatureName || ''}
            onSignatureNameChange={(signatureName) => setFormData(prev => ({ ...prev, signatureName }))}
            onBack={handleSignatureBack}
            onComplete={handleSignatureComplete} // ✅ Most már fogadja a finalSignerName-et
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
            language={language}
          />
        );
        
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
        
      case 'admin':
        return (
          <ProtectedRoute onUnauthorized={() => setCurrentScreen('login')}>
            <Admin 
              onBack={() => setCurrentScreen('questionnaire')} 
              onHome={() => setCurrentScreen('start')} 
            />
          </ProtectedRoute>
        );
        
      case 'protocol-preview':
        return <ProtocolPreview onBack={() => setCurrentScreen('completion')} />;
        
      default:
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {renderCurrentScreen()}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// === APP KOMPONENS: ÁLLAPOTOK A LANGUAGEPROVIDER-EN KÍVÜL ===
function App() {
  // === ÁLLAPOTOK AZ APP SZINTJÉN - NEM RESETELŐDNEK NYELVVÁLTÁSKOR ===
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [currentQuestionnaireePage, setCurrentQuestionnairePage] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
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

  // Load saved form data on initialization
  useEffect(() => {
    const saved = localStorage.getItem('otis-protocol-form-data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // If no receptionDate is saved or it's empty, use today's date
        if (!parsedData.receptionDate || parsedData.receptionDate === '') {
          parsedData.receptionDate = new Date().toISOString().split('T')[0];
        }
        setFormData(parsedData);
      } catch (e) {
        console.error('Error loading saved form data:', e);
      }
    }
  }, []);

  // Auto-save formData to localStorage whenever it changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(formData));
    }, 500); // Debounce 500ms

    return () => clearTimeout(saveTimer);
  }, [formData]);

  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          currentQuestionnaireePage={currentQuestionnaireePage}
          setCurrentQuestionnairePage={setCurrentQuestionnairePage}
          currentQuestionId={currentQuestionId}
          setCurrentQuestionId={setCurrentQuestionId}
          clearTrigger={clearTrigger}
          setClearTrigger={setClearTrigger}
          formData={formData}
          setFormData={setFormData}
        />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
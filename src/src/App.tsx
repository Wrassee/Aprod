import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

/* -------------------- 3rdâ€'party -------------------- */
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { LanguageProvider } from "./components/language-provider.js";

/* -------------------- Â PWA Â (jelenleg letiltva) -------------------- */
// import { PWAInstallBanner, OfflineIndicator } from "./components/pwaâ€'installâ€'banner";

/* -------------------- Â Oldalak / Komponensek -------------------- */
import { StartScreen } from "./pages/start-screen.js";
import Questionnaire from "./pages/questionnaire.js";
import { NiedervoltTable } from "./pages/niedervolt-table.js";
import { Signature } from "./pages/signature.js";
import { Completion } from "./pages/completion.js";
import { Admin } from "./pages/admin.js";
import { ProtocolPreview } from "./pages/protocol-preview.js";
import { SmartHelpWizard } from "./components/smart-help-wizard.js";
import { FormData, MeasurementRow } from "./lib/types.js";

/* -------------------- Â Shared schema -------------------- */
import { AnswerValue, ProtocolError } from "../shared/schema.js";

/* -------------------- Â 404 Â -------------------- */
import NotFound from "./pages/not-found.js";

function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'questionnaire' | 'niedervolt' | 'signature' | 'completion' | 'admin' | 'protocol-preview'>('start');
  const [currentQuestionnaireePage, setCurrentQuestionnairePage] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [language, setLanguage] = useState<'hu' | 'de'>('hu');

  // ====================================================================
  // === ÚJ: GLOBÁLIS PROGRESS TRACKING ===
  // ====================================================================
  const [globalCurrentStep, setGlobalCurrentStep] = useState(1);
  const TOTAL_PROTOCOL_STEPS = 5; // 4 questionnaire + 1 niedervolt
  
  // Progress számítás
  const globalProgress = useMemo(() => {
    return Math.min((globalCurrentStep / TOTAL_PROTOCOL_STEPS) * 100, 100);
  }, [globalCurrentStep]);

  // ÚJ: Unified step handler
  const handleStepChange = useCallback((step: number) => {
    console.log('🔄 Global step change:', step);
    setGlobalCurrentStep(step);
    
    // Automatikus screen váltás a step alapján
    if (step <= 4) {
      setCurrentScreen('questionnaire');
      setCurrentQuestionnairePage(step - 1); // 0-indexált
    } else if (step === 5) {
      setCurrentScreen('niedervolt');
    }
    
    // Progress mentése localStorage-ba
    localStorage.setItem('global-protocol-step', step.toString());
  }, []);
  // ====================================================================

  // ====================================================================
  // === MÃ"DOSÃTÃS 1: ÃšJ clearTrigger ÃLLAPOT HOZZÃADÃSA ===
  // ====================================================================
  const [clearTrigger, setClearTrigger] = useState(Date.now());
  // ====================================================================

  const [formData, setFormData] = useState<FormData>({
    receptionDate: new Date().toISOString().split('T')[0], // Always keep as ISO format for HTML date input
    answers: {},
    errors: [],
    signature: '',
    signatureName: '',
    niedervoltMeasurements: [],
    niedervoltTableMeasurements: {},
  });
  const formDataRef = useRef(formData);
  
  // Keep ref updated with latest formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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

    // ÚJ: Global step restoration
    const savedStep = localStorage.getItem('global-protocol-step');
    if (savedStep) {
      const step = parseInt(savedStep);
      setGlobalCurrentStep(step);
      
      // Screen beállítása a mentett step alapján
      if (step <= 4) {
        setCurrentScreen('questionnaire');
        setCurrentQuestionnairePage(step - 1);
      } else if (step === 5) {
        setCurrentScreen('niedervolt');
      }
    }
  }, []);

  const handleLanguageSelect = (selectedLanguage: 'hu' | 'de') => {
    console.log('ðŸŒ App.tsx - Language selected:', selectedLanguage);
    setLanguage(selectedLanguage);
    // Save language to localStorage so LanguageProvider can use it
    localStorage.setItem('otis-protocol-language', selectedLanguage);
    console.log('ðŸŒ App.tsx - Language saved to localStorage:', localStorage.getItem('otis-protocol-language'));
    
    // ÚJ: Global step alapú navigáció
    handleStepChange(1); // Start from step 1
    
    // Clear navigation state for new session - reset to page 0
    localStorage.setItem('questionnaire-current-page', '0');
    
    // Clear error list when starting new protocol
    localStorage.removeItem('protocol-errors');
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    // Force LanguageProvider to update by triggering a manual check
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProgress = useCallback(() => {
    console.log('ðŸ"§ ISOLATED save - no form data access');
    // Do absolutely nothing that could trigger re-renders
    // Save functionality is handled directly in questionnaire component
  }, []);

  // ====================================================================
  // === MÓDOSÍTOTT EVENT HANDLEREK - GLOBAL STEP ALAPÚ ===
  // ====================================================================
  const handleQuestionnaireNext = () => {
    const nextStep = globalCurrentStep + 1;
    if (nextStep <= 4) {
      // Még a questionnaire-n belül vagyunk
      console.log('📄 Moving to next questionnaire page:', nextStep);
      handleStepChange(nextStep);
    } else {
      // Niedervolt-ra váltunk
      console.log('📄 Questionnaire completed - showing Niedervolt UI as step 5');
      handleStepChange(5);
    }
  };

  const handleQuestionnairePrevious = () => {
    if (globalCurrentStep > 1) {
      console.log('📙 Moving to previous step:', globalCurrentStep - 1);
      handleStepChange(globalCurrentStep - 1);
    }
  };

  const handleNiedervoltBack = () => {
    console.log('ðŸ"™ Niedervolt Back button clicked - returning to questionnaire step 4');
    handleStepChange(4); // Visszamegyünk a questionnaire utolsó oldalára
  };
  // ====================================================================

  const handleNiedervoltNext = () => {
    setCurrentScreen('signature');
  };

  const handleSignatureBack = () => {
    console.log('ðŸ"™ Signature Back button clicked - returning to niedervolt');
    setCurrentScreen('niedervolt');
  };

  const handleSignatureComplete = async () => {
    console.log('ðŸ"„ Starting protocol completion process...');
    
    // Prevent multiple clicks
    const currentTime = Date.now();
    if ((window as any).lastCompleteAttempt && currentTime - (window as any).lastCompleteAttempt < 3000) {
      console.log('âš ï¸ Multiple clicks prevented - waiting for previous attempt to complete');
      return;
    }
    (window as any).lastCompleteAttempt = currentTime;
    
    try {
      // Sync all cached values before creating protocol
      const cachedRadioValues = (window as any).radioCache?.getAll?.() || {};
      const cachedTrueFalseValues = (window as any).trueFalseCache || new Map();
      const cachedInputValues = (window as any).stableInputValues || {};
      const cachedMeasurementValues = (window as any).measurementCache?.getAll?.() || {};
      const cachedCalculatedValues = (window as any).calculatedCache?.getAll?.() || {};
      
      // Convert Map to object if needed
      const trueFalseAnswers: Record<string, string> = {};
      if (cachedTrueFalseValues instanceof Map) {
        cachedTrueFalseValues.forEach((value, key) => {
          trueFalseAnswers[key] = value;
        });
      } else {
        Object.assign(trueFalseAnswers, cachedTrueFalseValues);
      }
      
      // Combine all answers including measurements
      const combinedAnswers = {
        ...formData.answers,
        ...cachedRadioValues,
        ...trueFalseAnswers,
        ...cachedInputValues,
        ...cachedMeasurementValues,
        ...cachedCalculatedValues,
      };
      
      // Ensure we have a valid receptionDate
      const receptionDate = formData.receptionDate || new Date().toISOString().split('T')[0];
      
      // Include niedervolt measurements
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
      
      console.log('âœ… Protocol data prepared:', {
        answerCount: Object.keys(combinedAnswers).length,
        errorCount: protocolData.errors.length,
        hasSignature: Boolean(protocolData.signature),
        hasSignatureName: Boolean(protocolData.signatureName),
        receptionDate: protocolData.receptionDate,
        reception_date: protocolData.reception_date,
        language: protocolData.language
      });
      
      // Submit the protocol data to backend
      console.log('ðŸ"¤ Sending protocol to backend...');
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData),
      });

      console.log('ðŸ"¥ Backend response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('âœ… Protocol saved successfully:', result.id);
        
        // Save the final form data to localStorage before navigating
        const finalFormData = {
          ...formData,
          answers: combinedAnswers,
          signatureName: protocolData.signatureName,
          completed: true
        };
        localStorage.setItem('otis-protocol-form-data', JSON.stringify(finalFormData));
        
        setCurrentScreen('completion');
        console.log('ðŸŽ‰ Protocol completion successful - navigating to completion screen');
      } else {
        const errorText = await response.text();
        console.error('âŒ Protocol creation failed:', errorText);
        alert(`Protokoll mentÃ©si hiba: ${errorText}\n\nKÃ©rjÃ¼k prÃ³bÃ¡lja Ãºjra vagy lÃ©pjen kapcsolatba a tÃ¡mogatÃ¡ssal.`);
        
        // Reset completion lock
        delete (window as any).lastCompleteAttempt;
      }
    } catch (error) {
      console.error('âŒ Error completing protocol:', error);
      
      // User-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba tÃ¶rtÃ©nt';
      alert(`Protokoll befejezÃ©si hiba: ${errorMessage}\n\nKÃ©rjÃ¼k ellenÅ'rizze az internetkapcsolatot Ã©s prÃ³bÃ¡lja Ãºjra.`);
      
      // Reset completion lock
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
        
        // Get Otis Lift ID from all sources (cache + formData)
        const cachedInputValues = (window as any).stableInputValues || {};
        const otisLiftId = cachedInputValues['7'] || formData.answers['7'] || 'Unknown';
        a.download = `AP_${otisLiftId}.pdf`;
        
        console.log('PDF download filename:', `AP_${otisLiftId}.pdf`);
        
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
      console.log('Starting Excel download...');
      
      // Sync all cached values before sending data
      const cachedRadioValues = (window as any).radioCache?.getAll?.() || {};
      const cachedTrueFalseValues = (window as any).trueFalseCache || new Map();
      const cachedInputValues = (window as any).stableInputValues || {};
      const cachedMeasurementValues = (window as any).measurementCache?.getAll?.() || {};
      const cachedCalculatedValues = (window as any).calculatedCache?.getAll?.() || {};
      
      // Convert Map to object if needed
      const trueFalseAnswers: Record<string, string> = {};
      if (cachedTrueFalseValues instanceof Map) {
        cachedTrueFalseValues.forEach((value, key) => {
          trueFalseAnswers[key] = value;
        });
      } else {
        Object.assign(trueFalseAnswers, cachedTrueFalseValues);
      }
      
      // Combine all answers including measurements
      const combinedAnswers = {
        ...formData.answers,
        ...cachedRadioValues,
        ...trueFalseAnswers,
        ...cachedInputValues,
        ...cachedMeasurementValues,
        ...cachedCalculatedValues,
      };
      
      const fullFormData = {
        ...formData,
        answers: combinedAnswers,
      };
      
      console.log('Sending Excel generation request with', Object.keys(combinedAnswers).length, 'answers');
      
      const response = await fetch('/api/protocols/download-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: fullFormData, language }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Excel generation failed:', response.status, errorText);
        throw new Error(`Excel generation failed: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Generated Excel file is empty');
      }
      
      // Get Otis Lift ID from all sources (cache + formData)
      const otisLiftId = cachedInputValues['7'] || formData.answers['7'] || 'Unknown';
      const filename = `AP_${otisLiftId}.xlsx`;
      
      console.log('Excel download filename:', filename);
      console.log('Excel file size:', blob.size, 'bytes');
      
      // More robust download approach using different methods
      try {
        // Method 1: Try modern download API
        if ('showSaveFilePicker' in window) {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Excel files',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('Excel download completed successfully (File API)');
          return;
        }
      } catch (fileApiError) {
        console.log('File API not available, falling back to blob URL');
      }
      
      // Method 2: Traditional blob URL approach with better error handling
      let url: string | null = null;
      let a: HTMLAnchorElement | null = null;
      
      try {
        url = URL.createObjectURL(blob);
        a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // Add to DOM, click, and immediately remove
        document.body.appendChild(a);
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (a) {
            a.click();
            console.log('Excel download completed successfully (Blob URL)');
          }
        }, 10);
        
      } catch (downloadError) {
        console.error('Error during blob download:', downloadError);
        
        // Method 3: Fallback - direct blob download
        try {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          console.log('Excel download completed successfully (Window open)');
        } catch (fallbackError) {
          console.error('All download methods failed:', fallbackError);
          throw new Error('Excel letÃ¶ltÃ©s sikertelen. KÃ©rjÃ¼k prÃ³bÃ¡lja Ãºjra.');
        }
      }
      
      // Clean up - delayed to ensure download completes
      setTimeout(() => {
        try {
          if (url) {
            URL.revokeObjectURL(url);
          }
          if (a && document.body && document.body.contains(a)) {
            document.body.removeChild(a);
          }
        } catch (cleanupError) {
          // Silent cleanup - not critical
          console.warn('Cleanup warning:', cleanupError);
        }
      }, 2000);
      
      console.log('Excel download completed successfully');
      
    } catch (error) {
      console.error('Error downloading Excel:', error);
      
      // Detailed error logging for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // User-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Excel letÃ¶ltÃ©si hiba: ${errorMessage}\n\nKÃ©rjÃ¼k, prÃ³bÃ¡lja Ãºjra vagy lÃ©pjen kapcsolatba a tÃ¡mogatÃ¡ssal.`);
    }
  };

  const handleViewProtocol = () => {
    setCurrentScreen('protocol-preview');
  };

  // ====================================================================
  // === MÓDOSÍTOTT handleStartNew - GLOBAL STEP RESET ===
  // ====================================================================
  const handleStartNew = () => {
    console.log('ðŸ†• Starting new protocol - clearing all data with page reload...');
    
    // 1. LÃ‰PÃ‰S: TÃ¶rÃ¶ljÃ¼k az Ã¶sszes ismert localStorage kulcsot
    localStorage.removeItem('otis-protocol-form-data');
    localStorage.removeItem('protocol-errors');
    localStorage.removeItem('questionnaire-current-page');
    // ÚJ: Global step reset
    localStorage.removeItem('global-protocol-step');
    // Ãšj Niedervolt kulcsok tÃ¶rlÃ©se is
    localStorage.removeItem('niedervolt-table-measurements');
    localStorage.removeItem('niedervolt-selected-devices');
    localStorage.removeItem('niedervolt-custom-devices');
    
    // 2. LÃ‰PÃ‰S: TÃ¶rÃ¶ljÃ¼k az Ã¶sszes ismert globÃ¡lis cache-t
    if ((window as any).radioCache) {
      console.log('Clearing radio cache...');
      (window as any).radioCache.clear();
    }
    if ((window as any).trueFalseCache) {
      console.log('Clearing true/false cache...');
      (window as any).trueFalseCache.clear();
    }
    if ((window as any).stableInputValues) {
      console.log('Clearing input values...');
      (window as any).stableInputValues = {};
    }
    if ((window as any).measurementCache) {
      console.log('Clearing measurement cache...');
      (window as any).measurementCache.clear();
    }
    if ((window as any).calculatedCache) {
      console.log('Clearing calculated values cache...');
      (window as any).calculatedCache = {};
    }
    
    // 3. LÃ‰PÃ‰S: State reset
    setGlobalCurrentStep(1);
    
    // 4. LÃ‰PÃ‰S: Ã‰rtesÃ­tjÃ¼k a komponenseket (a biztonsÃ¡g kedvÃ©Ã©rt)
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    // 5. LÃ‰PÃ‰S: A "NUKLEÃRIS OPCIÃ"" - Oldal ÃºjratÃ¶ltÃ©se
    // Ez a lÃ©pÃ©s garantÃ¡lja, hogy minden komponens tiszta lappal indul.
    setTimeout(() => {
      window.location.reload();
    }, 100); // RÃ¶vid kÃ©sleltetÃ©s, hogy a tÃ¶rlÃ©si mÅ±veletek befejezÅ'djenek.
    
    console.log('âœ… All data cleared - page reload initiated.');
  };
  // ====================================================================

  const handleGoHome = () => {
    setCurrentScreen('start');
  };

  const handleSettings = () => {
    setCurrentScreen('admin');
  };

  const handleBackToSignature = () => {
    setCurrentScreen('signature');
  };

  // Stable callbacks defined outside Router to prevent recreation
  const handleAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  }, []);

  const handleReceptionDateChange = useCallback((date: string) => {
    setFormData(prev => ({ ...prev, receptionDate: date }));
  }, []);

  const handleErrorsChange = useCallback((errors: ProtocolError[]) => {
    setFormData(prev => ({ ...prev, errors }));
  }, []);

  const handleAdminAccess = useCallback(() => setCurrentScreen('admin'), []);
  const handleHome = useCallback(() => setCurrentScreen('start'), []);

  // Memoized measurement change handler to prevent re-renders
  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData(prev => ({ ...prev, niedervoltMeasurements: measurements }));
  }, []);

  // ====================================================================
  // === MÓDOSÍTOTT renderCurrentScreen - GLOBAL PROGRESS PROPS ===
  // ====================================================================
  const renderCurrentScreen = () => {
    console.log('ðŸ  Route component function called - currentScreen:', currentScreen, 'globalStep:', globalCurrentStep);
    
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
      onSave={handleSaveProgress}
      language={language}
      onAdminAccess={handleAdminAccess}
      onHome={handleGoHome}
      onStartNew={handleStartNew}
      onQuestionChange={setCurrentQuestionId}

      // === HIÁNYZÓ GLOBÁLIS PROPS-OK HOZZÁADVA ===
      globalCurrentStep={globalCurrentStep}
      totalSteps={TOTAL_PROTOCOL_STEPS}
      globalProgress={globalProgress}
      onStepChange={handleStepChange}
      onNext={handleQuestionnaireNext}
      onPrevious={handleQuestionnairePrevious}
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

      // === HIÁNYZÓ GLOBÁLIS PROPS-OK HOZZÁADVA ===
      globalCurrentStep={globalCurrentStep}
      totalSteps={TOTAL_PROTOCOL_STEPS}
      globalProgress={globalProgress}
      isLastStep={globalCurrentStep === TOTAL_PROTOCOL_STEPS}
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
          {/* PWA components temporarily disabled for stability */}
          {renderCurrentScreen()}
          
          {/* ÚJ: Smart Help Wizard - módosított props */}
          {(currentScreen === 'questionnaire' || currentScreen === 'niedervolt' || currentScreen === 'signature') && (
            <SmartHelpWizard
              currentPage={globalCurrentStep} // ÚJ: unified step használata
              totalPages={TOTAL_PROTOCOL_STEPS}
              formData={formData}
              currentQuestionId={currentQuestionId}
              errors={formData.errors}
              globalProgress={globalProgress}
            />
          )}
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
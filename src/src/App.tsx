import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// Removed Wouter routing to prevent re-mounting issues with focus stability
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/language-provider";
// Temporarily disabled PWA components for stability
// import { PWAInstallBanner, OfflineIndicator } from "@/components/pwa-install-banner";
import { StartScreen } from "@/pages/start-screen";
import Questionnaire from "@/pages/questionnaire";
import { NiedervoltTable, CustomDevice } from "@/pages/niedervolt-table"; // ✅ CustomDevice import
import { Signature } from "@/pages/signature";
import { Completion } from "@/pages/completion";
import { Admin } from "@/pages/admin";
import { ProtocolPreview } from "@/pages/protocol-preview";
import { SmartHelpWizard } from "@/components/smart-help-wizard";
import { FormData, MeasurementRow } from "@/lib/types";
import { AnswerValue, ProtocolError } from "@shared/schema";
import NotFound from "@/pages/not-found";

function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'questionnaire' | 'niedervolt' | 'signature' | 'completion' | 'admin' | 'protocol-preview'>('start');
  const [currentQuestionnaireePage, setCurrentQuestionnairePage] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [language, setLanguage] = useState<'hu' | 'de'>('hu');
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
  
  // ✅ ÚJ: Niedervolt eszközök kiválasztásának állapota
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('niedervolt-selected-devices');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // ✅ ÚJ: Egyedi eszközök állapota
  const [customDevices, setCustomDevices] = useState<CustomDevice[]>(() => {
    const saved = localStorage.getItem('niedervolt-custom-devices');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Keep ref updated with latest formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Disabled auto-save to prevent component re-mounting during manual saves
  // Manual save through the Save button only

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

  const handleLanguageSelect = (selectedLanguage: 'hu' | 'de') => {
    console.log('🌍 App.tsx - Language selected:', selectedLanguage);
    setLanguage(selectedLanguage);
    // Save language to localStorage so LanguageProvider can use it
    localStorage.setItem('otis-protocol-language', selectedLanguage);
    console.log('🌍 App.tsx - Language saved to localStorage:', localStorage.getItem('otis-protocol-language'));
    setCurrentScreen('questionnaire');
    // Clear navigation state for new session - reset to page 0
    localStorage.setItem('questionnaire-current-page', '0');
    
    // Clear error list when starting new protocol
    localStorage.removeItem('protocol-errors');
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    // Force LanguageProvider to update by triggering a manual check
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProgress = useCallback(() => {
    console.log('🔧 ISOLATED save - no form data access');
    // Do absolutely nothing that could trigger re-renders
    // Save functionality is handled directly in questionnaire component
  }, []);

  const handleQuestionnaireNext = () => {
    setCurrentScreen('niedervolt');
  };

  const handleNiedervoltBack = () => {
    console.log('🔙 Niedervolt Back button clicked - returning to questionnaire');
    
    // Restore questionnaire page to the last page
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

  // ... [SignatureComplete és többi handler változatlan] ...

  const handleStartNew = () => {
    console.log('🆕 Starting new protocol - clearing all data...');
    
    // Clear ALL localStorage data thoroughly
    localStorage.removeItem('otis-protocol-form-data');
    localStorage.removeItem('protocol-errors');
    localStorage.removeItem('niedervolt-measurements');
    localStorage.removeItem('questionnaire-current-page');
    // ✅ ÚJ: Niedervolt eszközök törlése
    localStorage.removeItem('niedervolt-selected-devices');
    localStorage.removeItem('niedervolt-custom-devices');
    localStorage.removeItem('niedervolt-table-measurements');
    
    // Clear all cached values (radio buttons, inputs, measurements)
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
    
    // ✅ ÚJ: Niedervolt állapotok törlése
    setSelectedDevices(new Set());
    setCustomDevices([]);
    
    // Reset form data to completely fresh initial state
    const initialFormData: FormData = {
      receptionDate: new Date().toISOString().split('T')[0],
      answers: {},
      errors: [],
      signature: '',
      signatureName: '',
      niedervoltMeasurements: [],
      niedervoltTableMeasurements: {}, // ✅ Üres objektum
    };
    
    setFormData(initialFormData);
    setCurrentScreen('start');
    
    // Trigger event to notify error list component of the clear
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    // Force complete page refresh to clear any persistent cache
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
    console.log('✅ All data cleared - new protocol ready');
  };

  // ... [többi handler változatlan] ...

  // ✅ ÚJ: Niedervolt eszközök kezelése
  const handleSelectedDevicesChange = useCallback((newSet: Set<string>) => {
    setSelectedDevices(newSet);
    localStorage.setItem('niedervolt-selected-devices', JSON.stringify([...newSet]));
  }, []);

  const handleCustomDevicesChange = useCallback((newDevices: CustomDevice[]) => {
    setCustomDevices(newDevices);
    localStorage.setItem('niedervolt-custom-devices', JSON.stringify(newDevices));
  }, []);

  // Conditional render without Wouter to prevent re-mounting
  const renderCurrentScreen = () => {
    console.log('🏠 Route component function called - currentScreen:', currentScreen);
    
    switch (currentScreen) {
      case 'start':
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
      case 'questionnaire':
        return (
          <Questionnaire
            key="stable-questionnaire"
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
          />
        );
      case 'niedervolt':
        return (
          <NiedervoltTable
            key="stable-niedervolt-table"
            measurements={formData.niedervoltTableMeasurements || {}}
            onMeasurementsChange={(measurements) => setFormData(prev => ({ ...prev, niedervoltTableMeasurements: measurements }))}
            onBack={handleNiedervoltBack}
            onNext={handleNiedervoltNext}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
            onAdminAccess={handleAdminAccess}
            onHome={handleGoHome}
            onStartNew={handleStartNew}
            // ✅ ÚJ: Hiányzó props hozzáadva
            selectedDevices={selectedDevices}
            onSelectedDevicesChange={handleSelectedDevicesChange}
            customDevices={customDevices}
            onCustomDevicesChange={handleCustomDevicesChange}
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
        return <Admin onBack={() => setCurrentScreen('questionnaire')} onHome={() => setCurrentScreen('start')} />;
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
          
          {/* Smart Help Wizard - Show on protocol screens */}
          {(currentScreen === 'questionnaire' || currentScreen === 'niedervolt' || currentScreen === 'signature') && (
            <SmartHelpWizard
              currentPage={currentScreen === 'questionnaire' ? currentQuestionnaireePage + 1 : 
                          currentScreen === 'niedervolt' ? 5 : 
                          currentScreen === 'signature' ? 6 : 1}
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
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
  const [currentQuestionnaireePage, setCurrentQuestionnairePage] = useState(0);
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

  const totalSteps = 6;

  const currentStep = useMemo(() => {
    switch (currentScreen) {
      case 'questionnaire':
        return currentQuestionnaireePage + 1;
      case 'niedervolt':
        return 5;
      case 'signature':
        return 6;
      default:
        return 1;
    }
  }, [currentScreen, currentQuestionnaireePage]);

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
      const otisLiftId = cachedInputValues['7'] || formData.answers['7'] || 'Unknown';
      const filename = `AP_${otisLiftId}.xlsx`;
      console.log('Excel download filename:', filename);
      console.log('Excel file size:', blob.size, 'bytes');
      try {
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
      let url: string | null = null;
      let a: HTMLAnchorElement | null = null;
      try {
        url = URL.createObjectURL(blob);
        a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        setTimeout(() => {
          if (a) {
            a.click();
            console.log('Excel download completed successfully (Blob URL)');
          }
        }, 10);
      } catch (downloadError) {
        console.error('Error during blob download:', downloadError);
        try {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          console.log('Excel download completed successfully (Window open)');
        } catch (fallbackError) {
          console.error('All download methods failed:', fallbackError);
          throw new Error('Excel letöltés sikertelen. Kérjük próbálja újra.');
        }
      }
      setTimeout(() => {
        try {
          if (url) {
            URL.revokeObjectURL(url);
          }
          if (a && document.body && document.body.contains(a)) {
            document.body.removeChild(a);
          }
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }
      }, 2000);
      console.log('Excel download completed successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Excel letöltési hiba: ${errorMessage}\n\nKérjük, próbálja újra vagy lépjen kapcsolatba a támogatással.`);
    }
  };

  const handleViewProtocol = () => {
    setCurrentScreen('protocol-preview');
  };

  const handleStartNew = () => {
    console.log('🆕 Starting new protocol - clearing all data with page reload...');
    localStorage.removeItem('otis-protocol-form-data');
    localStorage.removeItem('protocol-errors');
    localStorage.removeItem('questionnaire-current-page');
    localStorage.removeItem('niedervolt-table-measurements');
    localStorage.removeItem('niedervolt-selected-devices');
    localStorage.removeItem('niedervolt-custom-devices');
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
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    setTimeout(() => {
      window.location.reload();
    }, 100);
    console.log('✅ All data cleared - page reload initiated.');
  };

  const handleGoHome = () => {
    setCurrentScreen('start');
  };

  const handleSettings = () => {
    setCurrentScreen('admin');
  };

  const handleBackToSignature = () => {
    setCurrentScreen('signature');
  };

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

  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData(prev => ({ ...prev, niedervoltMeasurements: measurements }));
  }, []);

  const renderCurrentScreen = () => {
    console.log('🏠 Route component function called - currentScreen:', currentScreen, `step: ${currentStep}/${totalSteps}`);

    return (
      <>
        {currentScreen === 'start' && <StartScreen onLanguageSelect={handleLanguageSelect} />}

        <div style={{ display: currentScreen === 'questionnaire' ? 'block' : 'none' }}>
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
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>

        <div style={{ display: currentScreen === 'niedervolt' ? 'block' : 'none' }}>
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
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>

        {currentScreen === 'signature' && (
          <Signature
            signature={formData.signature || ''}
            onSignatureChange={(signature) => setFormData(prev => ({ ...prev, signature }))}
            signatureName={formData.signatureName || ''}
            onSignatureNameChange={(signatureName) => setFormData(prev => ({ ...prev, signatureName }))}
            onBack={handleSignatureBack}
            onComplete={handleSignatureComplete}
          />
        )}

        {currentScreen === 'completion' && (
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
        )}

        {currentScreen === 'admin' && (
          <Admin
            onBack={() => setCurrentScreen('questionnaire')}
            onHome={() => setCurrentScreen('start')}
          />
        )}

        {currentScreen === 'protocol-preview' && <ProtocolPreview onBack={() => setCurrentScreen('completion')} />}
      </>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          {renderCurrentScreen()}
          {(currentScreen === 'questionnaire' || currentScreen === 'niedervolt' || currentScreen === 'signature') && (
            <SmartHelpWizard
              currentPage={currentStep}
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
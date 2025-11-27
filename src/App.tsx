// src/App.tsx - JAVÍTOTT VERZIÓ (Lift Selector Home Loop Fix + Immersive Mode)

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

/* -------------------- 3rd-party -------------------- */
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/language-provider";
import { useLanguageContext } from "@/components/language-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from '@/contexts/theme-context';
import { Loader2 } from 'lucide-react';

/* -------------------- Capacitor Imports (ÚJ) -------------------- */
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

/* -------------------- Oldalak / Komponensek -------------------- */
import { StartScreen } from "@/pages/start-screen";
import LiftSelector from "@/pages/lift-selector";
import Questionnaire from "@/pages/questionnaire";
import { NiedervoltTable } from "@/pages/niedervolt-table";
import { Signature } from "@/pages/signature";
import { Completion } from "@/pages/completion";
import { Admin } from "@/pages/admin";
import { ProtocolPreview } from "@/pages/protocol-preview";
import { Erdungskontrolle } from "@/pages/erdungskontrolle";
import { Login } from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AuthCallback from "@/pages/auth-callback";
import { FormData, MeasurementRow } from "./lib/types";

/* -------------------- Shared schema -------------------- */
import { AnswerValue, ProtocolError } from "../shared/schema";
import { getApiUrl } from '@/lib/queryClient';

type Screen = 
  | 'start' 
  | 'lift-selector'
  | 'questionnaire' 
  | 'erdungskontrolle' 
  | 'niedervolt' 
  | 'signature' 
  | 'completion' 
  | 'admin' 
  | 'protocol-preview' 
  | 'login' 
  | 'forgot-password' 
  | 'reset-password' 
  | 'auth-callback';

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

  const { language, setLanguage } = useLanguageContext();
  const { user, supabase, loading: authLoading } = useAuth();
  const formDataRef = useRef(formData);
  const [languageSelected, setLanguageSelected] = useState(false);

  // === HOOK-OK ===
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // 🔥 JAVÍTOTT LOGIKA: Csak akkor irányítunk át, ha a localStorage-ban VALÓBAN van adat
  useEffect(() => {
    const savedLanguage = localStorage.getItem('otis-protocol-language');
    
    if (savedLanguage) {
      setLanguageSelected(true);
    } else {
      setLanguageSelected(false);
    }
    
    // Szigorúbb ellenőrzés: savedLanguage megléte kötelező a redirecthez
    if (user && savedLanguage && currentScreen === 'start') {
      console.log('✅ User logged in, language saved. Redirecting to lift selector...');
      setCurrentScreen('lift-selector');
    }
  }, [user, currentScreen, setCurrentScreen]);

  const handleLanguageSelect = useCallback((selectedLanguage: 'hu' | 'de') => {
    console.log('🌍 App.tsx - Language selected:', selectedLanguage);
    setLanguage(selectedLanguage);
    localStorage.setItem('otis-protocol-language', selectedLanguage);
    setLanguageSelected(true);
    
    if (user) {
      console.log('📋 Navigating to lift selector...');
      setCurrentScreen('lift-selector');
    } else {
      console.log('🔐 No user, navigating to login...');
      setCurrentScreen('login');
    }
    
    // Clear old protocol data
    localStorage.removeItem('protocol-errors');
    localStorage.removeItem('liftSelection');
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    window.dispatchEvent(new Event('storage'));
  }, [setLanguage, setCurrentScreen, user]);

  const handleSaveProgress = useCallback(() => {
    console.log('✅ Progress saved automatically');
  }, []);

  const handleStartNew = useCallback(() => {
    console.log('🆕 Starting new protocol - clearing all data...');
    
    const keysToRemove = [
      'otis-protocol-form-data',
      'protocol-errors',
      'questionnaire-current-page',
      'niedervolt-table-measurements',
      'niedervolt-selected-devices',
      'niedervolt-custom-devices',
      'liftSelection',
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if ((window as any).radioCache) (window as any).radioCache.clear();
    if ((window as any).trueFalseCache) (window as any).trueFalseCache.clear();
    if ((window as any).stableInputValues) (window as any).stableInputValues = {};
    if ((window as any).measurementCache) (window as any).measurementCache.clear();
    if ((window as any).calculatedCache) (window as any).calculatedCache = {};
    
    window.dispatchEvent(new CustomEvent('protocol-errors-cleared'));
    
    setFormData({
      receptionDate: new Date().toISOString().split('T')[0],
      answers: {},
      errors: [],
      signature: '',
      signatureName: '',
      niedervoltMeasurements: [],
      niedervoltTableMeasurements: {},
    });
    
    setClearTrigger(Date.now());
    setCurrentScreen('start');
    setCurrentQuestionnairePage(0);
    setCurrentQuestionId('');
    
    console.log('✅ All data cleared');
  }, [setFormData, setClearTrigger, setCurrentScreen, setCurrentQuestionnairePage, setCurrentQuestionId]);

  // 🔥 JAVÍTOTT FÜGGVÉNY: setLanguage(null) ELTÁVOLÍTVA
  const handleGoHome = useCallback(() => {
    console.log('🏠 Home button clicked - resetting language and returning to start screen');
    
    setLanguageSelected(false);
    localStorage.removeItem('otis-protocol-language');
    localStorage.removeItem('liftSelection');

    setCurrentScreen('start');
    setCurrentQuestionnairePage(0);
    localStorage.setItem('questionnaire-current-page', '0');
  }, [setCurrentScreen, setCurrentQuestionnairePage]);

  const handleSettings = useCallback(() => {
    setCurrentScreen('admin');
  }, [setCurrentScreen]);

  const handleBackToSignature = useCallback(() => {
    setCurrentScreen('signature');
  }, [setCurrentScreen]);

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

  const handleAdminAccess = useCallback(() => {
    setCurrentScreen('admin');
  }, [setCurrentScreen]);

  const handleLoginSuccess = useCallback(() => {
    console.log('✅ Login successful - redirecting to lift selector');
    setCurrentScreen('lift-selector');
  }, [setCurrentScreen]);

  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData(prev => ({ ...prev, niedervoltMeasurements: measurements }));
  }, [setFormData]);

  // === FELTÉTELES KORAI RETURN-OK ===
  if (authLoading && currentScreen === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
            <Loader2 className="relative h-16 w-16 animate-spin text-blue-600 mx-auto" />
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {language === 'hu' ? 'Betöltés...' : 'Laden...'}
          </p>
        </div>
      </div>
    );
  }

  // Nem bejelentkezett user kezelése
  if (!user && 
      currentScreen !== 'login' && 
      currentScreen !== 'auth-callback' && 
      currentScreen !== 'forgot-password' && 
      currentScreen !== 'reset-password' &&
      currentScreen !== 'start' &&
      currentScreen !== 'lift-selector'
    ) {
    const savedLanguage = localStorage.getItem('otis-protocol-language');
    if (!savedLanguage) {
      setCurrentScreen('start');
    } else {
      setCurrentScreen('login');
    }
  }

  // === NEM-HOOK HANDLEREK ÉS LOGIKA ===
  const getAuthHeaders = async (contentType: string | null = 'application/json') => {
    if (!supabase) throw new Error("Supabase client not available");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");
    const headers: HeadersInit = { 'Authorization': `Bearer ${session.access_token}` };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  };

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

  const handleSignatureComplete = async (finalSignerName: string) => {
    console.log('📄 App.tsx: Starting protocol completion process with final name:', finalSignerName);
    
    const currentTime = Date.now();
    if ((window as any).lastCompleteAttempt && currentTime - (window as any).lastCompleteAttempt < 3000) {
      console.log('⚠️ Multiple clicks prevented');
      return;
    }
    (window as any).lastCompleteAttempt = currentTime;
    
    try {
      const receptionDate = formData.receptionDate || new Date().toISOString().split('T')[0];
      
      const finalFormData = { 
        ...formData, 
        signerName: finalSignerName.trim(),
        completed: true,
      };

      setFormData(finalFormData);
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(finalFormData));
      console.log('💾 Final data saved with signerName:', finalSignerName);
      
      const protocolData = {
        receptionDate,
        reception_date: receptionDate,
        language,
        answers: finalFormData.answers,
        errors: finalFormData.errors || [],
        signature: finalFormData.signature || '',
        signatureName: finalFormData.signerName,
        completed: true,
      };
      
      console.log('📤 Sending protocol to backend...');

      const headers = await getAuthHeaders();
      
      const response = await fetch(getApiUrl('/api/protocols'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(protocolData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Protocol saved:', result.id);
        setCurrentScreen('completion');
      } else {
        const errorText = await response.text();
        console.error('❌ Protocol creation failed:', errorText);
        alert(`Protokoll mentési hiba: ${errorText}`);
        delete (window as any).lastCompleteAttempt;
      }
    } catch (error) {
      console.error('❌ Error completing protocol:', error);
      alert(`Protokoll befejezési hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
      delete (window as any).lastCompleteAttempt;
    }
  };

  // === ADMIN MŰVELETEK ===
  const handleEmailPDF = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/protocols/email'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ formData, language }),
      });
      
      if (response.ok) {
        console.log('PDF emailed successfully');
      }
    } catch (error) {
      console.error('Error emailing PDF:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/protocols/download'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ formData, language }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const otisLiftId = formData.answers['7'] || 'Unknown';
        a.download = `AP_${otisLiftId}.pdf`;
        
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
      const otisLiftId = formData.answers['7'] || 'Unknown';
      const filename = `AP_${otisLiftId}.xlsx`;

      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/protocols/download-excel'), {
        method: 'POST',
        headers,
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
      alert(`Excel letöltési hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    }
  };

  const handleSaveToCloud = async () => {
    try {
      console.log('☁️ Saving protocol to cloud...');
      const headers = await getAuthHeaders();
      
      const protocolData = {
        receptionDate: formData.receptionDate,
        reception_date: formData.receptionDate,
        language,
        answers: formData.answers,
        errors: formData.errors || [],
        signature: formData.signature || '',
        signatureName: formData.signatureName || '',
        completed: true,
      };

      const response = await fetch(getApiUrl('/api/protocols'), {
        method: 'POST',
        headers,
        body: JSON.stringify(protocolData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Protocol saved to cloud:', result.id);
        alert('Protokoll sikeresen mentve a felhőbe!');
      } else {
        const errorText = await response.text();
        console.error('❌ Cloud save failed:', errorText);
        alert(`Felhő mentési hiba: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving to cloud:', error);
      alert(`Felhő mentési hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    }
  };

  const handleViewProtocol = () => {
    setCurrentScreen('protocol-preview');
  };

  // === RENDERELÉS ===
  const renderCurrentScreen = () => {
    console.log('🏠 Rendering screen:', currentScreen);
    
    switch (currentScreen) {
      case 'start':
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
      
      case 'lift-selector':
        return (
          <LiftSelector 
            onNavigate={(screen: Screen) => {
              console.log('🚀 LiftSelector navigation requested:', screen);
              setCurrentScreen(screen);
            }}
            onHome={handleGoHome}
          />
        );
        
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={() => {
              setLanguageSelected(false);
              setCurrentScreen('start');
            }}
            onNavigateToForgotPassword={() => {
              setCurrentScreen('forgot-password');
            }}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPassword 
            onBackToLogin={() => setCurrentScreen('login')}
          />
        );

      case 'reset-password':
        return (
          <ResetPassword 
            onSuccess={() => setCurrentScreen('login')}
          />
        );

      case 'auth-callback':
        return (
          <AuthCallback 
            onSuccess={() => {
              console.log('✅ Auth callback successful - redirecting to lift selector');
              setCurrentScreen('lift-selector');
            }}
            onError={() => setCurrentScreen('login')}
          />
        );

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
            onComplete={handleSignatureComplete}
            onHome={handleGoHome}
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
        
      case 'admin':
        return (
          <Admin 
            onBack={() => setCurrentScreen('questionnaire')} 
            onHome={() => setCurrentScreen('start')} 
          />
        );
        
      case 'protocol-preview':
        return <ProtocolPreview 
                onBack={() => setCurrentScreen('completion')} 
                formData={formData}
                language={language}
              />;
        
      default:
        console.warn(`Reached default case with screen: ${currentScreen}. Redirecting...`);
        if (user) {
          setCurrentScreen('lift-selector');
        } else {
          setCurrentScreen('start');
        }
        return null;
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

// === APP KOMPONENS ===
function App() {
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

  // 🔥 ÚJ RÉSZ: TELJES KÉPERNYŐS MÓD BEÁLLÍTÁSA 🔥
  useEffect(() => {
    const enableImmersiveMode = async () => {
      // Csak natív környezetben (Android/iOS) fusson
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Státuszsor (felső óra/akksi) elrejtése
          await StatusBar.hide();

          // 2. Navigációs sáv (alsó gombok) elrejtése
          await NavigationBar.hide();

          console.log('📱 Immersive mode enabled');
        } catch (e) {
          console.error('Hiba a teljes képernyő beállításakor:', e);
        }
      }
    };

    enableImmersiveMode();
  }, []); 
  // 🔥 ÚJ RÉSZ VÉGE 🔥

  // URL-ellenőrző hook (csak egyszer fut le)
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    console.log(`[App.tsx] Initial URL check: Path=${path}, Hash=${hash}`);

    if (path.startsWith('/auth/callback') || hash.includes('type=signup')) {
      console.log('[App.tsx] URL indicates Auth Callback. Setting screen.');
      setCurrentScreen('auth-callback');
    } else if (hash.includes('type=recovery')) {
      console.log('[App.tsx] URL indicates Password Recovery. Setting screen.');
      setCurrentScreen('reset-password');
    }
  }, []);

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

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [formData]);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
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
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
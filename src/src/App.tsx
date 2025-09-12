import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

/* -------------------- 3rd-party -------------------- */
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { LanguageProvider } from "./components/language-provider.js";

/* --------------------  PWA  (jelenleg letiltva) -------------------- */
// import { PWAInstallBanner, OfflineIndicator } from "./components/pwa-install-banner";

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
  const [currentScreen, setCurrentScreen] = useState<
    | "start"
    | "questionnaire"
    | "niedervolt"
    | "signature"
    | "completion"
    | "admin"
    | "protocol-preview"
  >("start");
  const [currentQuestionnaireePage, setCurrentQuestionnairePage] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const [language, setLanguage] = useState<"hu" | "de">("hu");
  const [formData, setFormData] = useState<FormData>({
    receptionDate: new Date().toISOString().split("T")[0],
    answers: {},
    errors: [],
    signature: "",
    signatureName: "",
    niedervoltMeasurements: [],
    niedervoltTableMeasurements: {},
  });
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const saved = localStorage.getItem("otis-protocol-form-data");
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (!parsedData.receptionDate || parsedData.receptionDate === "") {
          parsedData.receptionDate = new Date().toISOString().split("T")[0];
        }
        setFormData(parsedData);
      } catch (e) {
        console.error("Error loading saved form data:", e);
      }
    }
  }, []);

  const handleLanguageSelect = (selectedLanguage: "hu" | "de") => {
    setLanguage(selectedLanguage);
    localStorage.setItem("otis-protocol-language", selectedLanguage);
    setCurrentScreen("questionnaire");
    localStorage.setItem("questionnaire-current-page", "0");
    localStorage.removeItem("protocol-errors");
    window.dispatchEvent(new CustomEvent("protocol-errors-cleared"));
    window.dispatchEvent(new Event("storage"));
  };

  const handleSaveProgress = useCallback(() => {}, []);

  const handleQuestionnaireNext = () => {
    setCurrentScreen("niedervolt");
  };

  const handleNiedervoltBack = () => {
    setCurrentScreen("questionnaire");
  };

  const handleNiedervoltNext = () => {
    setCurrentScreen("signature");
  };

  const handleSignatureBack = () => {
    setCurrentScreen("niedervolt");
  };

  const handleSignatureComplete = async () => {
    const currentTime = Date.now();
    if (
      (window as any).lastCompleteAttempt &&
      currentTime - (window as any).lastCompleteAttempt < 3000
    ) {
      return;
    }
    (window as any).lastCompleteAttempt = currentTime;

    try {
      const cachedRadioValues = (window as any).radioCache?.getAll?.() || {};
      const cachedTrueFalseValues = (window as any).trueFalseCache || new Map();
      const cachedInputValues = (window as any).stableInputValues || {};
      const cachedMeasurementValues =
        (window as any).measurementCache?.getAll?.() || {};
      const cachedCalculatedValues =
        (window as any).calculatedCache?.getAll?.() || {};

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

      const receptionDate =
        formData.receptionDate || new Date().toISOString().split("T")[0];

      const protocolData = {
        receptionDate,
        reception_date: receptionDate,
        language,
        answers: combinedAnswers,
        errors: formData.errors || [],
        signature: formData.signature || "",
        signatureName:
          formData.signatureName || (window as any).signatureNameValue || "",
        completed: true,
      };

      const response = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(protocolData),
      });

      if (response.ok) {
        const result = await response.json();
        const finalFormData = {
          ...formData,
          answers: combinedAnswers,
          signatureName: protocolData.signatureName,
          completed: true,
        };
        localStorage.setItem(
          "otis-protocol-form-data",
          JSON.stringify(finalFormData)
        );
        setCurrentScreen("completion");
      } else {
        delete (window as any).lastCompleteAttempt;
      }
    } catch (error) {
      delete (window as any).lastCompleteAttempt;
    }
  };

  const handleEmailPDF = async () => {
    try {
      await fetch("/api/protocols/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, language }),
      });
    } catch (error) {
      console.error("Error emailing PDF:", error);
    }
  };

  const handleSaveToCloud = async () => {
    try {
      await fetch("/api/protocols/cloud-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, language }),
      });
    } catch (error) {
      console.error("Error saving to cloud:", error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/protocols/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, language }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cachedInputValues = (window as any).stableInputValues || {};
        const otisLiftId =
          cachedInputValues["7"] || formData.answers["7"] || "Unknown";
        a.download = `AP_${otisLiftId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const cachedRadioValues = (window as any).radioCache?.getAll?.() || {};
      const cachedTrueFalseValues = (window as any).trueFalseCache || new Map();
      const cachedInputValues = (window as any).stableInputValues || {};
      const cachedMeasurementValues =
        (window as any).measurementCache?.getAll?.() || {};
      const cachedCalculatedValues =
        (window as any).calculatedCache?.getAll?.() || {};

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

      const response = await fetch("/api/protocols/download-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: fullFormData, language }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Excel generation failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const otisLiftId =
        cachedInputValues["7"] || formData.answers["7"] || "Unknown";
      const filename = `AP_${otisLiftId}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  const handleViewProtocol = () => {
    setCurrentScreen("protocol-preview");
  };

  const handleStartNew = () => {
    console.log("🆕 Starting new protocol - clearing all data...");

    // ✅ Egyesített verzió (Módosítás1 + Módosítás2)
    localStorage.removeItem("otis-protocol-form-data");
    localStorage.removeItem("protocol-errors");
    localStorage.removeItem("niedervolt-measurements");
    localStorage.removeItem("questionnaire-current-page");

    if ((window as any).radioCache) (window as any).radioCache.clear();
    if ((window as any).trueFalseCache) (window as any).trueFalseCache.clear();
    if ((window as any).stableInputValues)
      (window as any).stableInputValues = {};
    if ((window as any).measurementCache)
      (window as any).measurementCache.clear();
    if ((window as any).calculatedCache)
      (window as any).calculatedCache = {};

    const initialFormData: FormData = {
      receptionDate: new Date().toISOString().split("T")[0],
      answers: {},
      errors: [],
      signature: "",
      signatureName: "",
      niedervoltMeasurements: [],
      niedervoltTableMeasurements: {},
    };

    setFormData(initialFormData);
    setCurrentScreen("start");

    window.dispatchEvent(new CustomEvent("protocol-errors-cleared"));

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleGoHome = () => {
    setCurrentScreen("start");
  };

  const handleSettings = () => {
    setCurrentScreen("admin");
  };

  const handleBackToSignature = () => {
    setCurrentScreen("signature");
  };

  const handleAnswerChange = useCallback((questionId: string, value: AnswerValue) => {
    setFormData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const handleReceptionDateChange = useCallback((date: string) => {
    setFormData((prev) => ({ ...prev, receptionDate: date }));
  }, []);

  const handleErrorsChange = useCallback((errors: ProtocolError[]) => {
    setFormData((prev) => ({ ...prev, errors }));
  }, []);

  const handleAdminAccess = useCallback(() => setCurrentScreen("admin"), []);
  const handleHome = useCallback(() => setCurrentScreen("start"), []);

  const handleMeasurementsChange = useCallback((measurements: MeasurementRow[]) => {
    setFormData((prev) => ({ ...prev, niedervoltMeasurements: measurements }));
  }, []);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "start":
        return <StartScreen onLanguageSelect={handleLanguageSelect} />;
      case "questionnaire":
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
      case "niedervolt":
        return (
          <NiedervoltTable
            key="stable-niedervolt-table"
            measurements={formData.niedervoltTableMeasurements || {}}
            onMeasurementsChange={(measurements) =>
              setFormData((prev) => ({
                ...prev,
                niedervoltTableMeasurements: measurements,
              }))
            }
            onBack={handleNiedervoltBack}
            onNext={handleNiedervoltNext}
            receptionDate={formData.receptionDate}
            onReceptionDateChange={handleReceptionDateChange}
            onAdminAccess={handleAdminAccess}
            onHome={handleGoHome}
            onStartNew={handleStartNew}
          />
        );
      case "signature":
        return (
          <Signature
            signature={formData.signature || ""}
            onSignatureChange={(signature) =>
              setFormData((prev) => ({ ...prev, signature }))
            }
            signatureName={formData.signatureName || ""}
            onSignatureNameChange={(signatureName) =>
              setFormData((prev) => ({ ...prev, signatureName }))
            }
            onBack={handleSignatureBack}
            onComplete={handleSignatureComplete}
          />
        );
      case "completion":
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
              buildingAddress: (formData.answers["1"] as string) || "",
              liftId: (formData.answers["7"] as string) || "",
              inspectorName: (formData.answers["4"] as string) || "",
              inspectionDate: formData.receptionDate,
            }}
          />
        );
      case "admin":
        return (
          <Admin
            onBack={() => setCurrentScreen("questionnaire")}
            onHome={() => setCurrentScreen("start")}
          />
        );
      case "protocol-preview":
        return <ProtocolPreview onBack={() => setCurrentScreen("completion")} />;
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
          {(currentScreen === "questionnaire" ||
            currentScreen === "niedervolt" ||
            currentScreen === "signature") && (
            <SmartHelpWizard
              currentPage={
                currentScreen === "questionnaire"
                  ? currentQuestionnaireePage + 1
                  : currentScreen === "niedervolt"
                  ? 5
                  : currentScreen === "signature"
                  ? 6
                  : 1
              }
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

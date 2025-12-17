// src/pages/completion.tsx - VÉGLEGES, ÖSSZEVONT VERZIÓ (Version3 alap + Version1/2 javítások)
/*
  - Alap: Version3
  - Beépítve: Version1 & Version2 javításai (egységes saveFile, Excel letöltés komponensben, FileOpener natív megnyitás,
    jobb hibaüzenetek, preview loading UI, toast-ok mobilon)
*/

import PageHeader from '@/components/PageHeader';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { ErrorExport } from '@/components/error-export';
import { ProtocolError } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Mail,
  Cloud,
  Download,
  Eye,
  Plus,
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  Zap,
} from 'lucide-react';
import { getApiUrl } from '@/lib/queryClient';

// 🔥 CAPACITOR IMPORTOK
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

interface CompletionProps {
  onEmailPDF: (recipient: string) => Promise<void>;
  onSaveToCloud: () => void;
  onStartNew: () => void;
  onGoHome: () => void;
  onSettings: () => void;
  onBackToSignature: () => void;
  errors?: ProtocolError[];
  protocolData?: {
    buildingAddress?: string;
    liftId?: string;
    inspectorName?: string;
    inspectionDate?: string;
  };
  language: 'hu' | 'de' | 'en' | 'fr' | 'it';
}

export function Completion({
  onEmailPDF,
  onSaveToCloud,
  onStartNew,
  onGoHome,
  onSettings,
  onBackToSignature,
  errors = [],
  protocolData,
  language,
}: CompletionProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isGroundingPdfDownloading, setIsGroundingPdfDownloading] = useState(false);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);
  const [isPdfPreviewing, setIsPdfPreviewing] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  // === 🛠️ HELPER: BLOB → BASE64 ===
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  };

  // === 🛠️ HELPER: FÁJL MENTÉSE ===
  // Visszaadja a mentett URI-t (mobil) vagy üres stringet (web)
  const saveFile = async (blob: Blob, filename: string): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('📱 Saving file on mobile/native device...');
        const base64Data = await convertBlobToBase64(blob);

        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
        });

        console.log('✅ File saved to:', result.uri);
        toast({
          title: language === 'hu' ? 'Sikeres mentés!' : 'Erfolgreich gespeichert!',
          description:
            language === 'hu'
              ? `A fájl a Dokumentumok mappába került: ${filename}`
              : `Datei im Dokumente-Ordner gespeichert: ${filename}`,
          duration: 5000,
        });

        return result.uri;
      } catch (e) {
        console.error('❌ Mobile save failed:', e);
        toast({
          title: t("error"),
          description:
            language === 'hu'
              ? "Nem sikerült a fájlt a telefonra menteni. Ellenőrizd a jogosultságokat."
              : "Datei konnte nicht auf dem Telefon gespeichert werden. Berechtigungen überprüfen.",
          variant: "destructive"
        });
        throw e;
      }
    } else {
      // WEB LOGIKA (PC)
      console.log('💻 Saving file in browser...');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      return '';
    }
  };

  // === EMAIL ===
  const handleEmailClick = () => {
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast({
        title: t("error"),
        description: language === 'hu' ? 'Kérlek adj meg egy érvényes email címet!' : 'Bitte geben Sie eine gültige E-Mail-Adresse ein!',
        variant: 'destructive',
      });
      return;
    }

    setIsEmailDialogOpen(false);
    setIsEmailSending(true);
    setEmailStatus(t("emailSending"));

    try {
      await onEmailPDF(recipientEmail);
      setEmailStatus(`✅ ${t("emailSentSuccess")}`);
      toast({
        title: language === 'hu' ? 'Email elküldve!' : 'E-Mail gesendet!',
        description: language === 'hu' ? `Sikeres küldés: ${recipientEmail}` : `Erfolgreich gesendet an: ${recipientEmail}`,
      });
      setTimeout(() => setEmailStatus(''), 5000);
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus(`❌ ${t("emailSentError")}`);
      toast({
        title: t("error"),
        description: (error as Error).message || t("emailSentError"),
        variant: 'destructive',
      });
      setTimeout(() => setEmailStatus(''), 5000);
    } finally {
      setIsEmailSending(false);
    }
  };

  // 🔥 EXCEL LETÖLTÉS - komponensben (nem prop)
  const handleDownloadExcel = async () => {
    setIsExcelDownloading(true);
    try {
      console.log('Starting Excel download...');
      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.answers) throw new Error(t("noFormDataError"));

      const response = await fetch(getApiUrl('/api/protocols/download-excel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: savedData, language }),
      });

      if (!response.ok) {
        let message = 'Excel generation failed';
        try {
          const txt = await response.text();
          message = txt || message;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      const blob = await response.blob();
      const liftId = savedData.answers?.['7'] || 'Unknown';
      const filename = `AP_${String(liftId).replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;

      await saveFile(blob, filename);

      toast({
        title: language === 'hu' ? 'Excel letöltve!' : 'Excel heruntergeladen!',
        description: language === 'hu' ? 'A fájlt a Dokumentumok mappában találod.' : 'Datei im Dokumente-Ordner gespeichert.',
        duration: 3000,
      });

      console.log('Excel download completed successfully.');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: t("error"),
        description: (error as Error).message || "Hiba az Excel letöltésekor",
        variant: "destructive",
      });
    } finally {
      setIsExcelDownloading(false);
    }
  };

  // === PDF LETÖLTÉS ===
  const handleDownloadPDF = async () => {
    setIsPdfDownloading(true);
    try {
      console.log('Starting PDF download from completion page...');

      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.answers) {
        throw new Error(t("noFormDataError") || 'No form data found in localStorage to generate PDF.');
      }

      const response = await fetch(getApiUrl('/api/protocols/download-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: savedData,
          language: language,
        }),
      });

      if (!response.ok) {
        let errMsg = t("pdfGenerationError");
        try {
          const json = await response.json();
          errMsg = json?.message || errMsg;
        } catch {
          try {
            const text = await response.text();
            if (text) errMsg = text;
          } catch { /* ignore */ }
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const liftId = savedData.answers?.['7'] ? String(savedData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
      const filename = `OTIS_Protocol_${liftId}_${new Date().toISOString().split('T')[0]}.pdf`;

      const uri = await saveFile(blob, filename);

      // Ha mobilon, próbáljuk meg megnyitni automatikusan
      if (Capacitor.isNativePlatform() && uri) {
        try {
          await FileOpener.open({ filePath: uri, contentType: 'application/pdf' });
        } catch (openErr) {
          console.warn('Could not auto-open PDF after save:', openErr);
          // nem fatal, csak figyelmeztetés
        }
      }

      console.log('PDF download initiated successfully.');
    } catch (error) {
      console.error('Error during PDF download:', error);
      toast({
        title: t("error"),
        description: (error as Error).message || t("pdfGenerationError"),
        variant: "destructive"
      });
    } finally {
      setIsPdfDownloading(false);
    }
  };

  // === GROUNDING PDF ===
  const handleDownloadGroundingPDF = useCallback(async () => {
    setIsGroundingPdfDownloading(true);
    try {
      console.log('Starting grounding PDF download from completion page...');

      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.groundingCheckAnswers) {
        throw new Error(t("noGroundingDataError"));
      }

      const plz = savedData.answers?.['3'] || '';
      const city = savedData.answers?.['4'] || '';
      const street = savedData.answers?.['5'] || '';
      const houseNumber = savedData.answers?.['6'] || '';
      const fullAddress = [plz, city, street, houseNumber].filter(Boolean).join(' ');

      const payload = {
        groundingCheckAnswers: savedData.groundingCheckAnswers,
        errors: savedData.errors || [],
        liftId: savedData.answers?.['7'] || '',
        agency: savedData.answers?.['9'] || '',
        technicianName: savedData.answers?.['2'] || '',
        address: fullAddress,
        receptionDate: savedData.receptionDate || '',
        visum: savedData.signerName || '',
      };

      console.log('Sending payload to backend:', payload);

      const formData = new FormData();
      formData.append('groundingCheckAnswers', JSON.stringify(payload.groundingCheckAnswers));
      formData.append('errors', JSON.stringify(payload.errors));
      formData.append('liftId', payload.liftId);
      formData.append('agency', payload.agency);
      formData.append('technicianName', payload.technicianName);
      formData.append('address', payload.address);
      formData.append('receptionDate', payload.receptionDate);
      formData.append('visum', payload.visum);
      formData.append('signature', savedData.signature || '');
      formData.append('customTexts', JSON.stringify(savedData.customGroundingTexts || '{}'));
      formData.append('language', language);

      const response = await fetch(getApiUrl('/api/protocols/download-grounding-pdf'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let serverDetails = '';
        try {
          serverDetails = await response.text();
        } catch { /* ignore */ }
        console.error("Server Error details:", serverDetails);
        throw new Error(t("groundingPdfGenerationError") + (serverDetails ? `: ${serverDetails.substring(0, 200)}` : ''));
      }

      const blob = await response.blob();
      const liftIdForFilename = payload.liftId.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      const filename = `Erdungskontrolle_${liftIdForFilename}_${payload.receptionDate || new Date().toISOString().split('T')[0]}.pdf`;

      const uri = await saveFile(blob, filename);

      if (Capacitor.isNativePlatform() && uri) {
        try {
          await FileOpener.open({ filePath: uri, contentType: 'application/pdf' });
        } catch (openErr) {
          console.warn('Could not auto-open grounding PDF after save:', openErr);
        }
      }

      console.log('Grounding PDF download initiated successfully.');

      toast({
        title: t("downloadSuccessTitle"),
        description: t("groundingProtocolDownloaded"),
        duration: 3000,
      });

    } catch (error) {
      console.error('Hiba a földelési PDF letöltése során:', error);
      toast({
        title: t("downloadErrorTitle"),
        description: (error as Error).message || t("groundingProtocolDownloadError"),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGroundingPdfDownloading(false);
    }
  }, [language, t, toast]);

  // 🔥 PREVIEW (már Version3-ból, kibővítve)
  const handlePreviewPDF = async () => {
    setIsPdfPreviewing(true);
    let newTab: Window | null = null;

    // Csak PC-n nyitunk először ablakot, hogy a popup-blocker előtt legyünk
    if (!Capacitor.isNativePlatform()) {
      newTab = window.open('', '_blank');
      if (!newTab) {
        toast({
          title: t("popupBlockedTitle"),
          description: t("popupBlockedDescription"),
          variant: 'destructive'
        });
        setIsPdfPreviewing(false);
        return;
      }

      newTab.document.write(`
        <html>
          <head>
            <title>${t("previewGeneratingTitle")}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              h2 { margin-top: 20px; font-weight: 300; }
              p { opacity: 0.8; max-width: 720px; text-align: center; padding: 0 20px; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>${t("generating")}...</h2>
            <p>${t("previewGeneratingWait")}</p>
          </body>
        </html>
      `);
    }

    try {
      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.answers) {
        throw new Error(t("noSavedDataForPreview"));
      }

      const response = await fetch(getApiUrl('/api/protocols/preview-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: savedData,
          language: language,
        }),
      });

      if (!response.ok) {
        let errMsg = t("pdfGenerationServerError");
        try {
          const json = await response.json();
          errMsg = json?.message || errMsg;
        } catch {
          try {
            const text = await response.text();
            if (text) errMsg = text;
          } catch { /* ignore */ }
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();

      // MOBIL: mentés + FileOpener
      if (Capacitor.isNativePlatform()) {
        const filename = "preview_temp.pdf";
        const uri = await saveFile(blob, filename);

        try {
          if (uri) {
            await FileOpener.open({ filePath: uri, contentType: 'application/pdf' });
            console.log('PDF preview opened with FileOpener.');
          } else {
            // Ha mentés nem adott URI-t valamiért, fallback: próbáljuk web-es letöltést
            console.warn('No URI returned on native save; cannot open automatically.');
            toast({
              title: t("previewWarningTitle"),
              description: t("previewSavedButNotOpened"),
              duration: 4000,
            });
          }
        } catch (openerError) {
          console.error("FileOpener hiba:", openerError);
          toast({
            title: "Nincs PDF olvasó",
            description: language === 'hu'
              ? "A fájl le lett mentve, de nem sikerült automatikusan megnyitni."
              : "Die Datei wurde gespeichert, konnte aber nicht automatisch geöffnet werden.",
            variant: "default"
          });
        }
      } else {
        // PC: új fül
        const url = window.URL.createObjectURL(blob);
        if (newTab) newTab.location.href = url;
      }

    } catch (error) {
      console.error('Error during PDF preview:', error);

      if (newTab && !Capacitor.isNativePlatform()) {
        // Mutassunk hibás állapotot az új fülön
        try {
          newTab.document.write(`
            <html>
              <head>
                <title>${t("errorTitle")}</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                  }
                  h2 { margin-bottom: 10px; }
                  p { opacity: 0.9; max-width: 500px; }
                  button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: white;
                    color: #f5576c;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <h2>❌ ${t("errorOccurred")}</h2>
                <p>${(error as Error).message}</p>
                <button onclick="window.close()">${t("closeWindow")}</button>
              </body>
            </html>
          `);
        } catch (e) {
          // esetleg a newTab már bezáródott — ignore
        }
      }

      toast({
        title: t("previewErrorTitle"),
        description: (error as Error).message || t("previewErrorTitle"),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsPdfPreviewing(false);
    }
  };

  const errorList = errors.length > 0 ? errors : JSON.parse(localStorage.getItem('protocol-errors') || '[]');
  const hasErrors = errorList.length > 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        onHome={onGoHome}
        onStartNew={onStartNew}
        onAdminAccess={onSettings}
        language={language}
        showProgress={false}
      />

      <div className={`min-h-screen relative overflow-hidden ${
        theme === 'modern'
          ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20'
          : 'bg-gray-50'
      }`}>
        {theme === 'modern' && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </>
        )}

        <main className={`relative z-10 px-6 py-8 ${
          theme === 'modern' ? 'max-w-6xl' : 'max-w-4xl'
        } mx-auto`}>
          {/* SUCCESS HERO */}
          {theme === 'modern' ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-2xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-50 blur-xl animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle className="h-14 w-14 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                  {t("protocolComplete")}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  {t("completionMessage")}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-8">
              <div className="mb-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                  {t("protocolComplete")}
                </h2>
                <p className="text-gray-600">
                  {t("completionMessage")}
                </p>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Email PDF */}
            <div className="relative">
              {theme === 'modern' ? (
                <button
                  onClick={handleEmailClick}
                  disabled={isEmailSending}
                  className="group relative overflow-hidden w-full p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600"></div>
                  <div className="relative flex flex-col items-center gap-3">
                    <Mail className="h-8 w-8" />
                    <span className="text-lg">{isEmailSending ? t("sending") : t("emailPDF")}</span>
                  </div>
                </button>
              ) : (
                <Button
                  onClick={handleEmailClick}
                  disabled={isEmailSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center py-4 h-auto w-full disabled:opacity-50"
                >
                  <Mail className="h-5 w-5 mr-3" />
                  {isEmailSending ? t("sending") : t("emailPDF")}
                </Button>
              )}
              {emailStatus && (
                <div className="mt-2 text-sm text-center font-medium bg-blue-100 text-blue-700 rounded-lg p-2">
                  {emailStatus}
                </div>
              )}
            </div>

            {/* Save to Cloud */}
            {theme === 'modern' ? (
              <button
                onClick={onSaveToCloud}
                className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600"></div>
                <div className="relative flex flex-col items-center gap-3">
                  <Cloud className="h-8 w-8" />
                  <span className="text-lg">{t("saveToCloud")}</span>
                </div>
              </button>
            ) : (
              <Button
                onClick={onSaveToCloud}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center py-4 h-auto"
              >
                <Cloud className="h-5 w-5 mr-3" />
                {t("saveToCloud")}
              </Button>
            )}

            {/* Download PDF */}
            {theme === 'modern' ? (
              <button
                onClick={handleDownloadPDF}
                disabled={isPdfDownloading}
                className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900"></div>
                <div className="relative flex flex-col items-center gap-3">
                  {isPdfDownloading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Download className="h-8 w-8" />}
                  <span className="text-lg">{isPdfDownloading ? t("generating") : t("downloadPDF")}</span>
                </div>
              </button>
            ) : (
              <Button
                onClick={handleDownloadPDF}
                disabled={isPdfDownloading}
                className="bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center py-4 h-auto disabled:opacity-50"
              >
                {isPdfDownloading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Download className="h-5 w-5 mr-3" />}
                {isPdfDownloading ? t("generating") : t("downloadPDF")}
              </Button>
            )}

            {/* Download Grounding PDF */}
            {theme === 'modern' ? (
              <button
                onClick={handleDownloadGroundingPDF}
                disabled={isGroundingPdfDownloading}
                className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-gray-900 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500"></div>
                <div className="relative flex flex-col items-center gap-3">
                  {isGroundingPdfDownloading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Zap className="h-8 w-8" />}
                  <span className="text-lg">{isGroundingPdfDownloading ? t("generating") : t("downloadGroundingPDF")}</span>
                </div>
              </button>
            ) : (
              <Button
                onClick={handleDownloadGroundingPDF}
                disabled={isGroundingPdfDownloading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center justify-center py-4 h-auto disabled:opacity-50"
              >
                {isGroundingPdfDownloading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Download className="h-5 w-5 mr-3" />}
                {isGroundingPdfDownloading ? t("generating") : t("downloadGroundingPDF")}
              </Button>
            )}

            {/* Download Excel */}
            {theme === 'modern' ? (
              <button
                onClick={handleDownloadExcel}
                disabled={isExcelDownloading}
                className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600"></div>
                <div className="relative flex flex-col items-center gap-3">
                  {isExcelDownloading ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileText className="h-8 w-8" />}
                  <span className="text-lg">{isExcelDownloading ? t("generating") : t("downloadExcel")}</span>
                </div>
              </button>
            ) : (
              <Button
                onClick={handleDownloadExcel}
                disabled={isExcelDownloading}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center py-4 h-auto disabled:opacity-50"
              >
                {isExcelDownloading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Download className="h-5 w-5 mr-3" />}
                {t("downloadExcel")}
              </Button>
            )}

            {/* View Protocol (Preview) */}
            {theme === 'modern' ? (
              <button
                onClick={handlePreviewPDF}
                disabled={isPdfPreviewing}
                className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-fuchsia-600"></div>
                <div className="relative flex flex-col items-center gap-3">
                  {isPdfPreviewing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Eye className="h-8 w-8" />}
                  <span className="text-lg">{isPdfPreviewing ? t("generating") : t("viewProtocol")}</span>
                </div>
              </button>
            ) : (
              <Button
                onClick={handlePreviewPDF}
                disabled={isPdfPreviewing}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center py-4 h-auto disabled:opacity-50"
              >
                {isPdfPreviewing ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Eye className="h-5 w-5 mr-3" />}
                {isPdfPreviewing ? t("generating") : t("viewProtocol")}
              </Button>
            )}
          </div>

          {/* ERROR EXPORT */}
          {hasErrors && (
            theme === 'modern' ? (
              <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-500 to-pink-400 p-1 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-red-500 to-pink-500 opacity-30 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                  <ErrorExport
                    errors={errorList}
                    protocolData={protocolData || {
                      buildingAddress: '',
                      liftId: '',
                      inspectorName: '',
                      inspectionDate: new Date().toISOString().split('T')[0]
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <ErrorExport
                  errors={errorList}
                  protocolData={protocolData || {
                    buildingAddress: '',
                    liftId: '',
                    inspectorName: '',
                    inspectionDate: new Date().toISOString().split('T')[0]
                  }}
                />
              </div>
            )
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 mt-8">
            <Button variant="outline" onClick={onStartNew} className="text-blue-600 border-blue-600">
              <Plus className="h-4 w-4 mr-2" /> {t("startNew")}
            </Button>
            <Button variant="outline" onClick={onBackToSignature} className="text-gray-600">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
            </Button>
          </div>
        </main>
      </div>

      {/* EMAIL RECIPIENT DIALOG */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'hu' ? 'Címzett megadása' : 
               language === 'de' ? 'Empfänger eingeben' :
               language === 'fr' ? 'Entrer le destinataire' :
               language === 'it' ? 'Inserire il destinatario' :
               'Enter Recipient'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">
                {language === 'hu' ? 'Email cím' : 
                 language === 'de' ? 'E-Mail-Adresse' :
                 language === 'fr' ? 'Adresse e-mail' :
                 language === 'it' ? 'Indirizzo email' :
                 'Email Address'}
              </Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder={language === 'hu' ? 'pelda@email.com' : 'example@email.com'}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full"
                data-testid="input-recipient-email"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              data-testid="button-cancel-email"
            >
              {language === 'hu' ? 'Mégse' : 
               language === 'de' ? 'Abbrechen' :
               language === 'fr' ? 'Annuler' :
               language === 'it' ? 'Annulla' :
               'Cancel'}
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!recipientEmail}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-send-email"
            >
              <Mail className="h-4 w-4 mr-2" />
              {language === 'hu' ? 'Küldés' : 
               language === 'de' ? 'Senden' :
               language === 'fr' ? 'Envoyer' :
               language === 'it' ? 'Invia' :
               'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

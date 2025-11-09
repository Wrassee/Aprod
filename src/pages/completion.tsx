// src/pages/completion.tsx - THEME AWARE VERSION
import PageHeader from '@/components/PageHeader';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
  Award,
  Zap,
} from 'lucide-react';

interface CompletionProps {
  onEmailPDF: () => void;
  onSaveToCloud: () => void;
  onDownloadExcel: () => void;
  onViewProtocol: () => void;
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
  language: 'hu' | 'de';
}

export function Completion({
  onEmailPDF,
  onSaveToCloud,
  onDownloadExcel,
  onViewProtocol,
  onStartNew,
  onGoHome,
  onSettings,
  onBackToSignature,
  errors = [],
  protocolData,
  language,
}: CompletionProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme(); // ← ÚJ: Theme hook
  const { toast } = useToast();
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isGroundingPdfDownloading, setIsGroundingPdfDownloading] = useState(false);

  const handleEmailClick = async () => {
    setIsEmailSending(true);
    setEmailStatus('Email küldése folyamatban...');

    try {
      await onEmailPDF();
      setEmailStatus('✅ Email sikeresen elküldve!');
      setTimeout(() => setEmailStatus(''), 5000);
    } catch (error) {
      setEmailStatus('❌ Email küldése sikertelen!');
      setTimeout(() => setEmailStatus(''), 5000);
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPdfDownloading(true);
    try {
      console.log('Starting PDF download from completion page...');

      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.answers) {
        throw new Error('No form data found in localStorage to generate PDF.');
      }

      const response = await fetch('/api/protocols/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: savedData,
          language: language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF on the server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const liftId = savedData.answers?.['7'] ? String(savedData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
      a.download = `OTIS_Protocol_${liftId}_${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();

      console.log('PDF download initiated successfully.');
    } catch (error) {
      console.error('Error during PDF download:', error);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handleDownloadGroundingPDF = useCallback(async () => {
    setIsGroundingPdfDownloading(true);
    try {
      console.log('Starting grounding PDF download from completion page...');

      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.groundingCheckAnswers) {
        throw new Error('Nincsenek földelési adatok a PDF generálásához.');
      }
      
      const plz = savedData.answers?.['3'] || '';
      const city = savedData.answers?.['4'] || '';
      const street = savedData.answers?.['5'] || '';
      const houseNumber = savedData.answers?.['6'] || '';
      
      const fullAddress = [plz, city, street, houseNumber]
        .filter(Boolean)
        .join(' ');

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

      const response = await fetch('/api/protocols/download-grounding-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'A földelési PDF generálása sikertelen.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const liftIdForFilename = payload.liftId.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      a.download = `Erdungskontrolle_${liftIdForFilename}_${payload.receptionDate || new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      console.log('Grounding PDF download initiated successfully.');
      
      toast({
        title: language === 'hu' ? 'Sikeres letöltés' : 'Download erfolgreich',
        description: language === 'hu' 
          ? 'A földelési jegyzőkönyv sikeresen letöltve.' 
          : 'Das Erdungsprotokoll wurde erfolgreich heruntergeladen.',
        duration: 3000,
      });

    } catch (error) {
      console.error('Hiba a földelési PDF letöltése során:', error);
      toast({
        title: language === 'hu' ? 'Letöltési hiba' : 'Download Fehler',
        description: (error as Error).message || (language === 'hu'
          ? 'A földelési jegyzőkönyv letöltése sikertelen. Kérjük próbálja újra.'
          : 'Das Erdungsprotokoll konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGroundingPdfDownloading(false);
    }
  }, [language, toast]);

  const errorList = errors.length > 0 ? errors : JSON.parse(localStorage.getItem('protocol-errors') || '[]');
  const hasErrors = errorList.length > 0;

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      theme === 'modern'
        ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20'
        : 'bg-gray-50'
    }`}>
      {/* Animated background - CSAK MODERN */}
      {theme === 'modern' && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </>
      )}

      <PageHeader
        onHome={onGoHome}
        onStartNew={onStartNew}
        onAdminAccess={onSettings}
        language={language}
        showProgress={false}
      />

      <main className={`relative z-10 px-6 py-8 ${
        theme === 'modern' ? 'max-w-6xl' : 'max-w-4xl'
      } mx-auto`}>
        {/* SUCCESS HERO SECTION - Theme Aware */}
        {theme === 'modern' ? (
          // MODERN: Glassmorphism success card
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-2xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-50 blur-xl animate-pulse"></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-2xl">
                  <CheckCircle className="h-14 w-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>

              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                {t.protocolComplete}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                {t.completionMessage}
              </p>
            </div>
          </div>
        ) : (
          // CLASSIC: Simple success card
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                {t.protocolComplete}
              </h2>
              <p className="text-gray-600">
                {t.completionMessage}
              </p>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS - Theme Aware */}
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex flex-col items-center gap-3">
                  <Mail className="h-8 w-8" />
                  <span className="text-lg">{isEmailSending ? 'Küldés...' : t.emailPDF}</span>
                </div>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
              </button>
            ) : (
              <Button
                onClick={handleEmailClick}
                disabled={isEmailSending}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center py-4 h-auto w-full disabled:opacity-50"
              >
                <Mail className="h-5 w-5 mr-3" />
                {isEmailSending ? 'Küldés...' : t.emailPDF}
              </Button>
            )}

            {emailStatus && (
              <div className={`${theme === 'modern' ? 'mt-2' : 'absolute top-full mt-2 left-0 right-0'} text-sm px-3 py-2 rounded-lg text-center font-medium ${
                emailStatus.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 
                emailStatus.includes('folyamatban') ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                'bg-red-100 text-red-700 border border-red-300'
              }`}>
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
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center gap-3">
                <Cloud className="h-8 w-8" />
                <span className="text-lg">{t.saveToCloud}</span>
              </div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
            </button>
          ) : (
            <Button
              onClick={onSaveToCloud}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center py-4 h-auto"
            >
              <Cloud className="h-5 w-5 mr-3" />
              {t.saveToCloud}
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center gap-3">
                {isPdfDownloading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Download className="h-8 w-8" />
                )}
                <span className="text-lg">{isPdfDownloading ? t.generating : t.downloadPDF}</span>
              </div>
            </button>
          ) : (
            <Button
              onClick={handleDownloadPDF}
              disabled={isPdfDownloading}
              className="bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center py-4 h-auto disabled:opacity-50"
            >
              {isPdfDownloading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-3" />
              )}
              {isPdfDownloading ? t.generating : t.downloadPDF}
            </Button>
          )}

          {/* Download Excel */}
          {theme === 'modern' ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDownloadExcel();
              }}
              className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center gap-3">
                <FileText className="h-8 w-8" />
                <span className="text-lg">{t.downloadExcel}</span>
              </div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
            </button>
          ) : (
            <Button
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDownloadExcel();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center py-4 h-auto"
            >
              <Download className="h-5 w-5 mr-3" />
              {t.downloadExcel}
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
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col items-center gap-3">
                {isGroundingPdfDownloading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Zap className="h-8 w-8" />
                )}
                <span className="text-lg">{isGroundingPdfDownloading ? t.generating : t.downloadGroundingPDF}</span>
              </div>
            </button>
          ) : (
            <Button
              onClick={handleDownloadGroundingPDF}
              disabled={isGroundingPdfDownloading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center justify-center py-4 h-auto disabled:opacity-50"
            >
              {isGroundingPdfDownloading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-3" />
              )}
              {isGroundingPdfDownloading ? t.generating : t.downloadGroundingPDF}
            </Button>
          )}

          {/* View Protocol */}
          {theme === 'modern' ? (
          <button
            onClick={onViewProtocol}
            disabled={false}
            className="group relative overflow-hidden p-6 rounded-2xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-fuchsia-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex flex-col items-center gap-3">
              <Eye className="h-8 w-8" />
              <span className="text-lg">{t.viewProtocol}</span>
            </div>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
          </button>
          ) : (
            <Button
            onClick={onViewProtocol}
            disabled={false}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center py-4 h-auto disabled:opacity-50"
          >
            <Eye className="h-5 w-5 mr-3" />
            {t.viewProtocol}
          </Button>
          )}
        </div>

        {/* ERROR EXPORT SECTION - Theme Aware */}
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

        {/* NAVIGATION BUTTONS - Theme Aware */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 mt-8">
          {/* Start New Protocol */}
          {theme === 'modern' ? (
            <button
              onClick={onStartNew}
              className="group relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>{t.startNew}</span>
              </div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
            </button>
          ) : (
            <Button
              onClick={onStartNew}
              variant="outline"
              className="text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white active:bg-blue-600 active:text-white flex items-center justify-center px-8 py-3 h-auto transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.startNew}
            </Button>
          )}

          {/* Back Button */}
          {theme === 'modern' ? (
            <button
              onClick={onBackToSignature}
              className="group relative overflow-hidden px-8 py-4 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-semibold">{language === 'hu' ? 'Vissza' : 'Zurück'}</span>
              </div>
            </button>
          ) : (
            <Button
              variant="outline"
              onClick={onBackToSignature}
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'hu' ? 'Vissza' : 'Zurück'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
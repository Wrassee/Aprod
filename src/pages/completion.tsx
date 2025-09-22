import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/components/language-provider';
import { ErrorExport } from '@/components/error-export';
import { ProtocolError } from '@shared/schema';
import { 
  CheckCircle, 
  Mail, 
  Cloud, 
  Download, 
  Eye, 
  Plus,
  Home,
  Settings,
  ArrowLeft,
  Loader2 // BetÃ¶ltÃ©s ikon importÃ¡lÃ¡sa
} from 'lucide-react';

interface CompletionProps {
  onEmailPDF: () => void;
  onSaveToCloud: () => void;
  // onDownloadPDF prop eltÃ¡volÃ­tva, mert a logikÃ¡t helyben kezeljÃ¼k
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
  language: 'hu' | 'de'; // Language prop hozzÃ¡adva a tÃ­pusdefinÃ­ciÃ³hoz
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
  language, // Language prop Ã¡tvÃ©tele
}: CompletionProps) {
  const { t } = useLanguageContext();
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false); // Ãšj Ã¡llapot a PDF letÃ¶ltÃ©shez

  const handleEmailClick = async () => {
    setIsEmailSending(true);
    setEmailStatus('Email kÃ¼ldÃ©se folyamatban...');
    
    try {
      await onEmailPDF();
      setEmailStatus('âœ… Email sikeresen elkÃ¼ldve!');
      setTimeout(() => setEmailStatus(''), 5000);
    } catch (error) {
      setEmailStatus('âŒ Email kÃ¼ldÃ©se sikertelen!');
      setTimeout(() => setEmailStatus(''), 5000);
    } finally {
      setIsEmailSending(false);
    }
  };

  // --- JAVÃTÃS: ÃšJ PDF LETÃ–LTÃ‰SI LOGIKA ---
  const handleDownloadPDF = async () => {
    setIsPdfDownloading(true);
    try {
      console.log('Starting PDF download from completion page...');
      
      // A legfrissebb adatokat a localStorage-bÃ³l olvassuk ki
      const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      if (!savedData.answers) {
        throw new Error('No form data found in localStorage to generate PDF.');
      }

      // KÃ©rÃ©s kÃ¼ldÃ©se a HELYES /download-pdf vÃ©gpontra
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

      // A vÃ¡lasz feldolgozÃ¡sa Ã©s a letÃ¶ltÃ©s elindÃ­tÃ¡sa
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
      // Ide jÃ¶het egy hibaÃ¼zenet a felhasznÃ¡lÃ³nak (pl. toast notification)
    } finally {
      setIsPdfDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-surface" onSubmit={(e) => e.preventDefault()}>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img 
                src="/otis-elevators-seeklogo_1753525178175.png" 
                alt="OTIS Logo" 
                className="h-12 w-12 mr-4"
              />
              {onGoHome && (
  <Button variant="ghost" size="sm" onClick={onGoHome} className="text-gray-600 hover:text-gray-800 mr-4" title={language === 'de' ? 'Startseite' : 'Kezdőlap'}>
    <Home className="h-4 w-4" />
  </Button>
)}
              <h1 className="text-xl font-semibold text-gray-800">OTIS APROD - ÃtvÃ©teli Protokoll</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-gray-600">{t.receptionDate}</Label>
              <Input
                type="date"
                value={receptionDate}
                onChange={(e) => onReceptionDateChange(e.target.value)}
                className="w-auto"
              />
              {onStartNew && (
                <Button onClick={onStartNew} className="bg-green-600 hover:bg-green-700 text-white flex items-center" size="sm" title={t.startNew || 'Ãšj protokoll indÃ­tÃ¡sa'}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t.startNew || 'Ãšj protokoll indÃ­tÃ¡sa'}
                </Button>
              )}
              {onAdminAccess && (
                <Button variant="ghost" size="sm" onClick={onAdminAccess} className="text-gray-600 hover:text-gray-800" title={t.admin}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-700">
                  {currentGroup?.name || t.progress}
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {currentPage + 1} / {totalPages + 1} {t.groupOf}
                </span>
              </div>
              <Progress value={progress} className="w-full h-2.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Completion Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              {t.protocolComplete}
            </h2>
            <p className="text-gray-600">
              {t.completionMessage}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Email PDF */}
            <div className="relative">
              <Button
                onClick={handleEmailClick}
                disabled={isEmailSending}
                className="bg-otis-blue hover:bg-blue-700 text-white flex items-center justify-center py-4 h-auto w-full disabled:opacity-50"
              >
                <Mail className="h-5 w-5 mr-3" />
                {isEmailSending ? 'KÃ¼ldÃ©s...' : t.emailPDF}
              </Button>
              
              {emailStatus && (
                <div className={`absolute top-full mt-2 left-0 right-0 text-sm px-3 py-2 rounded text-center ${
                  emailStatus.includes('âœ…') ? 'bg-green-100 text-green-700' : 
                  emailStatus.includes('folyamatban') ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {emailStatus}
                </div>
              )}
            </div>
            
            {/* Save to Cloud */}
            <Button
              onClick={onSaveToCloud}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center py-4 h-auto"
            >
              <Cloud className="h-5 w-5 mr-3" />
              {t.saveToCloud}
            </Button>
            
            {/* Download PDF */}
            <Button
              onClick={handleDownloadPDF} // --- JAVÃTÃS ITT ---
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
            
            {/* Download Excel */}
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
            
            {/* View Protocol */}
            <Button
              onClick={onViewProtocol}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center py-4 h-auto"
            >
              <Eye className="h-5 w-5 mr-3" />
              {t.viewProtocol}
            </Button>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex gap-4 justify-center">
            {/* Back to Signature */}
            <Button
              onClick={onBackToSignature}
              variant="outline"
              className="text-gray-600 border-2 border-gray-300 hover:bg-gray-50 px-6 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            
            {/* Start New Protocol */}
            <Button
              onClick={onStartNew}
              variant="outline"
              className="text-otis-blue border-2 border-otis-blue hover:bg-otis-light-blue px-8 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.startNew}
            </Button>
          </div>
        </div>

        {/* Error Export Section - only show if there are errors */}
        {(errors.length > 0 || JSON.parse(localStorage.getItem('protocol-errors') || '[]').length > 0) && (
          <div className="mt-8">
            <ErrorExport 
              errors={errors.length > 0 ? errors : JSON.parse(localStorage.getItem('protocol-errors') || '[]')}
              protocolData={protocolData || {
                buildingAddress: '',
                liftId: '',
                inspectorName: '',
                inspectionDate: new Date().toISOString().split('T')[0]
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
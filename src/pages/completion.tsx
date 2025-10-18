import PageHeader from '@/components/PageHeader';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/components/language-provider';
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
      
      // === VÉGLEGES PAYLOAD ÖSSZEÁLLÍTÁSA A PONTOS SPECIFIKÁCIÓ ALAPJÁN ===

      // 1. Címadatok kinyerése és összefűzése (3, 4, 5, 6 kérdések)
      const plz = savedData.answers?.['3'] || '';          // Irányítószám
      const city = savedData.answers?.['4'] || '';         // Város
      const street = savedData.answers?.['5'] || '';       // Utca
      const houseNumber = savedData.answers?.['6'] || '';  // Házszám
      
      // Üres részeket kiszűrve, szóközzel elválasztva fűzzük össze
      const fullAddress = [plz, city, street, houseNumber]
        .filter(Boolean)
        .join(' ');

      // 2. A teljes payload objektum létrehozása
      const payload = {
        // Földelési válaszok
        groundingCheckAnswers: savedData.groundingCheckAnswers,

        // Adatok a pontos kérdés ID-k alapján:
        liftId: savedData.answers?.['7'] || '',         // Lift-azonosító (7. kérdés)
        agency: savedData.answers?.['9'] || '',         // Agentur (9. kérdés)
        technicianName: savedData.answers?.['2'] || '', // Technikus neve (2. kérdés)
        address: fullAddress,                           // Összefűzött cím (3+4+5+6)

        // Nem kérdésből származó adatok
        receptionDate: savedData.receptionDate || '',   // Dátum a date pickerből
        visum: savedData.signerName || '',              // Aláíró neve a SignatureCanvas-ból
      };

      console.log('Sending payload to backend:', payload);

      // 3. FormData objektum létrehozása (a backend ezt várja!)
      const formData = new FormData();
      
      // A payload adatainak hozzáadása kulcs-érték páronként
      formData.append('groundingCheckAnswers', JSON.stringify(payload.groundingCheckAnswers));
      formData.append('liftId', payload.liftId);
      formData.append('agency', payload.agency);
      formData.append('technicianName', payload.technicianName);
      formData.append('address', payload.address);
      formData.append('receptionDate', payload.receptionDate);
      formData.append('visum', payload.visum);
      formData.append('signature', savedData.signature || '');
      formData.append('customTexts', JSON.stringify(savedData.customGroundingTexts || '{}'));

      // 4. API hívás FormData objektummal (headers nélkül - automatikusan beállítódik)
      const response = await fetch('/api/protocols/download-grounding-pdf', {
        method: 'POST',
        body: formData,  // ✅ FormData, nem JSON.stringify!
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'A földelési PDF generálása sikertelen.');
      }

      // 4. PDF letöltése
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const liftIdForFilename = payload.liftId.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      a.download = `OTIS_Grounding_Protocol_${liftIdForFilename}_${payload.receptionDate || new Date().toISOString().split('T')[0]}.pdf`;

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

  return (
    <div className="min-h-screen bg-light-surface">
      <PageHeader
        onHome={onGoHome}
        onStartNew={onStartNew}
        onAdminAccess={onSettings}
        language={language}
        showProgress={false}
      />

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
                {isEmailSending ? 'Küldés...' : t.emailPDF}
              </Button>

              {emailStatus && (
                <div className={`absolute top-full mt-2 left-0 right-0 text-sm px-3 py-2 rounded text-center ${
                  emailStatus.includes('✅') ? 'bg-green-100 text-green-700' : 
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

            {/* Download Grounding PDF */}
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
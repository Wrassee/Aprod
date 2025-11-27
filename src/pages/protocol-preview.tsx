// src/pages/protocol-preview.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, Calendar, CheckCircle, AlertTriangle, Mail, Download, Loader2 } from 'lucide-react';
import { useLanguageContext } from "@/components/language-context";
import { getApiUrl } from '@/lib/queryClient';

// JAVÍTÁS: Importáld a FormData típust
import type { FormData } from '../lib/types';

// JAVÍTÁS: A Protocol interface most már a FormData-ra épül
interface Protocol extends FormData {}

interface ProtocolPreviewProps {
  onBack: () => void;
  formData: FormData; // JAVÍTÁS: Prop fogadása
  language: 'hu' | 'de'; // JAVÍTÁS: Prop fogadása
}

export function ProtocolPreview({ onBack, formData, language }: ProtocolPreviewProps) {
  const { t } = useLanguageContext();
  
  // JAVÍTÁS: Nincs szükség külön 'protocol' state-re, használjuk a prop-ot
  const protocol = formData;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Ez most már csak a PDF-re vonatkozik
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // JAVÍTÁS: Letöltés állapota

  useEffect(() => {
    setLoading(true);
    const generatePreview = async () => {
      try {
        console.log('🔍 PDF preview generation started');
        
        // JAVÍTÁS: Olvassuk ki a legfrissebb adatot a localStorage-ból,
        // ugyanúgy, ahogy a 'completion.tsx' 'handleDownloadPDF' funkciója teszi.
        const savedData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
        
        console.log('📦 Data loaded from localStorage:', savedData.answers ? 'OK' : 'EMPTY');
        
        if (!savedData.answers) {
          throw new Error("Nincs mentett adat a localStorage-ban az előnézethez.");
        }

        // JAVÍTÁS: Az előnézet a '/preview-pdf' végpontot hívja
        const pdfResponse = await fetch(getApiUrl('/api/protocols/preview-pdf'), {
  method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // JAVÍTÁS: A 'savedData'-t küldjük el, nem a 'formData' prop-ot
          body: JSON.stringify({ formData: savedData, language: language })
        });
        
        console.log('📡 PDF response status:', pdfResponse.status);
        
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          console.log('📦 PDF blob size:', blob.size, 'bytes');
          
          if (blob.size < 1000) {
            throw new Error('A generált PDF túl kicsi, valószínűleg üres vagy hibás.');
          }
          
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setError(null);
          console.log('✅ PDF preview URL created successfully');
        } else {
          const errorText = await pdfResponse.text();
          console.error('❌ PDF generation failed:', errorText);
          setError(`PDF generálása sikertelen: ${errorText}`);
        }
      } catch (pdfError) {
        console.error('❌ PDF fetch error:', pdfError);
        setError(pdfError instanceof Error ? pdfError.message : 'Ismeretlen PDF hiba');
      } finally {
        setLoading(false);
      }
    };

    // Nincs szükség a 'formData' ellenőrzésére, azonnal futtatjuk
    generatePreview();
    
    // Cleanup funkció
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // JAVÍTÁS: A függőségi lista most már csak a 'language'-t tartalmazza
  }, [language]);

  const handleEmailSend = async () => {
    if (!formData) {
      console.error('No formData available for email');
      return;
    }
    
    setIsEmailSending(true);
    setEmailStatus('Email küldése folyamatban...');
    
    try {
      const response = await fetch(getApiUrl('/api/protocols/email'), {
  method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // JAVÍTÁS: A propok használata
        body: JSON.stringify({
          formData: formData,
          language: language,
          recipient: 'netkodok@gmail.com'
        })
      });
      
      if (response.ok) {
        setEmailStatus('✅ Email sikeresen elküldve a netkodok@gmail.com címre!');
        setTimeout(() => setEmailStatus(''), 5000);
      } else {
        const errorData = await response.json();
        console.error('Email send failed:', errorData);
        setEmailStatus('❌ Email küldése sikertelen!');
        setTimeout(() => setEmailStatus(''), 5000);
      }
    } catch (error) {
      console.error('Email error:', error);
      setEmailStatus('❌ Email küldése sikertelen!');
      setTimeout(() => setEmailStatus(''), 5000);
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!formData) {
      console.error('No formData available for download');
      return;
    }
    
    setIsDownloading(true);
    try {
      console.log('⬇️ Starting PDF download...');
      
      const response = await fetch(getApiUrl('/api/protocols/download-pdf'), {
  method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // JAVÍTÁS: A propok használata
        body: JSON.stringify({ formData: formData, language: language })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // JAVÍTÁS: Használjunk egyedi azonosítót a fájlnévben
        const liftId = formData.answers?.['7'] 
          ? String(formData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_')
          : 'Unknown';
        a.download = `OTIS_Protocol_${liftId}_${formData.receptionDate || new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ PDF download completed');
      } else {
        console.error('❌ PDF download failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // JAVÍTÁS: A 'loading' állapot most már csak a PDF betöltésére vár
  if (loading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-otis-blue mx-auto mb-4" />
          <p className="text-gray-600">Protokoll előnézet generálása...</p>
        </div>
      </div>
    );
  }

  // JAVÍTÁS: Ha a PDF generálás hibára futott
  if (error || !protocol) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="text-center p-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Hiba az előnézet generálásakor</p>
          <p className="text-gray-600 mb-4 text-sm max-w-md">{error || 'Ismeretlen hiba'}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Vissza
          </Button>
        </div>
      </div>
    );
  }

  // JAVÍTÁS: A JSX most már a 'formData' propot használja
  return (
    <div className="min-h-screen bg-light-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="mr-4 p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-12 w-12 bg-otis-blue rounded flex items-center justify-center mr-4">
              <img 
                src="/otis-elevators-seeklogo.png" 
                alt="OTIS Logo"
                className="h-8 w-8 object-contain filter brightness-0 invert"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Protokoll Előnézet</h1>
              {/* JAVÍTÁS: Használjunk egyedi azonosítót */}
              <p className="text-sm text-gray-600">
                Lift ID: {formData.answers?.['7'] || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Protocol Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Protocol Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-otis-blue mr-3" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Átvételi Protokoll
                  </h2>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Dátum: {formData.receptionDate || new Date().toLocaleDateString('hu-HU')}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span className="font-medium">Elkészült</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleEmailSend}
                    disabled={isEmailSending}
                    className="bg-otis-blue hover:bg-otis-blue/90 text-white disabled:opacity-50"
                    size="sm"
                  >
                    {isEmailSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {isEmailSending ? 'Küldés...' : 'Email'}
                  </Button>
                  
                  <Button 
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    variant="outline"
                    className="border-otis-blue text-otis-blue hover:bg-otis-blue/10 disabled:opacity-50"
                    size="sm"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading ? 'Letöltés...' : 'PDF'}
                  </Button>
                </div>
                
                {emailStatus && (
                  <div className={`text-sm mt-2 px-3 py-1 rounded transition-all ${
                    emailStatus.includes('✅') 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {emailStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PDF Preview Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              OTIS Protokoll PDF Előnézet
            </h3>
            {pdfUrl ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-[700px] border-0"
                  title="Protocol PDF Preview"
                />
                <div className="p-4 bg-gray-100 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    OTIS Átvételi Protokoll - Generálva: {new Date().toLocaleString('hu-HU')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>PDF generálás folyamatban...</p>
              </div>
            )}
          </div>

          {/* Errors Section */}
          {formData.errors && formData.errors.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hibák</h3>
              <div className="space-y-3">
                {/* JAVÍTÁS: Biztonságosabb JSON.parse */}
                {(Array.isArray(formData.errors) 
                  ? formData.errors 
                  : JSON.parse(formData.errors || '[]')
                ).map((error: any, index: number) => (
                  <div 
                    key={error.id || index} 
                    className="flex items-start p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className={`w-3 h-3 rounded-full mt-1 mr-3 flex-shrink-0 ${
                      error.severity === 'high' ? 'bg-red-500' :
                      error.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-800">{error.description}</p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        error.severity === 'high' ? 'bg-red-100 text-red-800' :
                        error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {error.severity === 'high' ? 'Magas' : 
                         error.severity === 'medium' ? 'Közepes' : 'Alacsony'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Aláírás</h3>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-gray-800 font-medium">
                  {formData.signerName || formData.signatureName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Létrehozva: {new Date(formData.receptionDate || Date.now()).toLocaleString('hu-HU')}
                </p>
              </div>
            </div>
            {formData.signature && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Digitális aláírás:</p>
                <img 
                  src={formData.signature} 
                  alt="Aláírás" 
                  className="max-w-xs h-20 border border-gray-300 bg-white rounded"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
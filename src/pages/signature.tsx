import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SimpleSignatureCanvas } from '@/components/simple-signature-canvas';
import { useLanguageContext } from '@/components/language-provider';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Check, Calendar } from 'lucide-react';

interface SignatureProps {
  signature: string;
  onSignatureChange: (signature: string) => void;
  signatureName: string;
  onSignatureNameChange: (name: string) => void;
  onBack: () => void;
  onComplete: (finalSignerName: string) => void; // ✅ Most már paraméterrel
}

export function Signature({
  signature,
  onSignatureChange,
  signatureName: initialSignatureName, // Kezdőérték a prop-ból
  onSignatureNameChange,
  onBack,
  onComplete,
}: SignatureProps) {
  const { t, language } = useLanguageContext();
  const currentDate = formatDate(new Date(), language);
  
  // ✅ Egyszerű React state - controlled component minta
  const [signerName, setSignerName] = useState(initialSignatureName || '');

  const canComplete = true; // Engedélyezzük a befejezést aláírással vagy anélkül

  // === KÖZPONTI MENTŐ FÜGGVÉNY ===
  const handleSave = () => {
    // Csak akkor mentünk, ha tényleg van mit
    if (signerName) {
      console.log('💾 Saving signer name to localStorage:', signerName);
      const currentData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      const updatedData = { ...currentData, signerName: signerName.trim() };
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(updatedData));
      
      // Frissítjük a szülő állapotát is, a konzisztencia kedvéért
      onSignatureNameChange(signerName.trim());
    }
  };

  const handleComplete = () => {
    console.log('🔘 Protocol completion button clicked');
    handleSave(); // ✅ Központi mentő függvényt hívjuk
    console.log('✅ Calling onComplete...');
    onComplete(signerName);
  };

  return (
    <div className="min-h-screen bg-light-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img 
                src="/otis-elevators-seeklogo_1753525178175.png" 
                alt="OTIS Logo" 
                className="h-12 w-12 mr-4"
              />
              <h1 className="text-xl font-semibold text-gray-800">
                OTIS APROD - Átvételi Protokoll
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Signature Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {t.signatureInstruction}
          </h2>
          
          {/* Signature Canvas */}
          <div className="mb-6">
            <SimpleSignatureCanvas 
              onSignatureChange={onSignatureChange} 
              initialSignature={signature}
            />
          </div>
          
          {/* Aláíró neve input - CONTROLLED COMPONENT */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.printedName}:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={t.printedName}
                className="w-full h-12 px-4 text-lg border-2 border-gray-300 rounded-lg focus:border-otis-blue focus:outline-none bg-white"
                autoComplete="off"
                value={signerName} // ✅ Controlled: az input értéke mindig a state-ből jön
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('📝 Signature name typing:', newValue);
                  setSignerName(newValue); // ✅ State frissítése minden gépelésnél
                }}
                onBlur={handleSave} // ✅ AUTOMATIKUS MENTÉS, ha a mező elveszti a fókuszt
                style={{ 
                  fontSize: '18px',
                  minHeight: '48px'
                }}
              />
            </div>
          </div>
          
          {/* Date Stamp */}
          <div className="flex items-center text-sm text-gray-600 mb-8">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{t.signatureDate}: </span>
            <span className="font-medium ml-1">{currentDate}</span>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between">
            <Button
  variant="outline"
  className="border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
  onClick={() => {
                console.log('🔙 Signature Back button clicked');
                handleSave(); // ✅ MENTÉS NAVIGÁCIÓ ELŐTT
                onBack();
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            
            <Button
              onClick={handleComplete}
              disabled={!canComplete}
              className="bg-otis-blue hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white flex items-center px-8"
            >
              <Check className="h-4 w-4 mr-2" />
              {t.complete}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SimpleSignatureCanvas } from '@/components/simple-signature-canvas';
import { useLanguageContext } from '@/components/language-provider';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Check, Calendar, Edit3, Sparkles, CheckCircle2, User } from 'lucide-react';

interface SignatureProps {
  signature: string;
  onSignatureChange: (signature: string) => void;
  signatureName: string;
  onSignatureNameChange: (name: string) => void;
  onBack: () => void;
  onComplete: (finalSignerName: string) => void;
}

export function Signature({
  signature,
  onSignatureChange,
  signatureName: initialSignatureName,
  onSignatureNameChange,
  onBack,
  onComplete,
}: SignatureProps) {
  const { t, language } = useLanguageContext();
  const currentDate = formatDate(new Date(), language);
  
  const [signerName, setSignerName] = useState(initialSignatureName || '');
  const [isSaving, setIsSaving] = useState(false);

  const canComplete = true;

  const handleSave = () => {
    if (signerName) {
      setIsSaving(true);
      console.log('💾 Saving signer name to localStorage:', signerName);
      const currentData = JSON.parse(localStorage.getItem('otis-protocol-form-data') || '{}');
      const updatedData = { ...currentData, signerName: signerName.trim() };
      localStorage.setItem('otis-protocol-form-data', JSON.stringify(updatedData));
      onSignatureNameChange(signerName.trim());
      
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleComplete = () => {
    console.log('🔘 Protocol completion button clicked');
    handleSave();
    console.log('✅ Calling onComplete...');
    onComplete(signerName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Header */}
      <header className="relative bg-white dark:bg-gray-900 shadow-lg border-b-2 border-blue-100 dark:border-blue-900/50 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-40 animate-pulse"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-lg">
                  <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      src="/otis-elevators-seeklogo_1753525178175.png"
                      alt="OTIS Logo"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
                  OTIS APROD - Átvételi Protokoll
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-cyan-500" />
                  Utolsó lépés: Aláírás
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Signature Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* 🎨 MODERN SIGNATURE CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
          
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {t.signatureInstruction}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Kérjük, írja alá a protokollt
                  </p>
                </div>
              </div>
            </div>
            
            {/* Signature Canvas */}
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 shadow-lg">
                <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                  <SimpleSignatureCanvas 
                    onSignatureChange={onSignatureChange} 
                    initialSignature={signature}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <Edit3 className="h-3 w-3" />
                Az aláírás opcionális - a protokoll név nélkül is befejezhető
              </p>
            </div>
            
            {/* Name Input */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                {t.printedName}:
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity"></div>
                <input
                  type="text"
                  placeholder={t.printedName}
                  className="relative w-full h-14 px-5 text-lg font-medium border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm hover:shadow-md"
                  autoComplete="off"
                  value={signerName}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('📝 Signature name typing:', newValue);
                    setSignerName(newValue);
                  }}
                  onBlur={handleSave}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isSaving ? (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                  ) : signerName ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                A név automatikusan mentésre kerül
              </p>
            </div>
            
            {/* Date Stamp */}
            <div className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/30 dark:via-sky-950/30 dark:to-cyan-950/30 p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t.signatureDate}:
                  </p>
                  <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {currentDate}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => {
                  console.log('🔙 Signature Back button clicked');
                  handleSave();
                  onBack();
                }}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{t.back}</span>
                </div>
              </button>
              
              {/* Complete Button */}
              <button
                onClick={handleComplete}
                disabled={!canComplete}
                className="group relative overflow-hidden px-10 py-4 rounded-xl font-bold text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 transition-opacity ${canComplete ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                </div>
                
                {/* Disabled state */}
                {!canComplete && (
                  <div className="absolute inset-0 bg-gray-400"></div>
                )}

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3 text-lg">
                  <Check className="h-6 w-6" />
                  <span>{t.complete}</span>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>

                {/* Shine effect */}
                <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ${canComplete ? '' : 'hidden'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* 🎨 INFO PANEL */}
        <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  Aláírás információ
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-500">✍️</span>
                    <p>
                      <strong>Aláírás:</strong> Az aláírás digitálisan kerül rögzítésre
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-500">💾</span>
                    <p>
                      <strong>Mentés:</strong> Automatikus mentés minden változtatásnál
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="text-purple-500">📄</span>
                    <p>
                      <strong>PDF:</strong> Az aláírás bekerül a végleges PDF dokumentumba
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-orange-500">⚡</span>
                    <p>
                      <strong>Opcionális:</strong> A protokoll név nélkül is befejezhető
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// src/components/error-export.tsx - JAVÍTOTT GÖRGETŐSÁV (SCROLLBAR BELÜLRE HELYEZVE)

import { useState } from 'react';
import { useTheme } from '@/contexts/theme-context';
import { ProtocolError } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Mail, Printer, FileText, Camera, Tag, Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useLanguageContext } from "@/components/language-context";
import { getApiUrl } from '@/lib/queryClient';

interface ErrorExportProps {
  errors: ProtocolError[];
  protocolData?: {
    plz?: string;
    city?: string;
    street?: string;
    houseNumber?: string;
    liftId?: string;
    inspectorName?: string;
    inspectionDate?: string;
  };
}

export function ErrorExport({ errors, protocolData }: ErrorExportProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Combine React state errors with localStorage errors
  const localStorageErrors = (() => {
    try {
      const stored = localStorage.getItem('protocol-errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const allErrors = [...errors, ...localStorageErrors];
  
  const getSeverityColor = (severity: ProtocolError['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityText = (severity: ProtocolError['severity']) => {
    const texts: Record<string, Record<string, string>> = {
      critical: {hu: 'Kritikus', de: 'Kritisch', en: 'Critical', fr: 'Critique', it: 'Critico'},
      medium: {hu: 'Közepes', de: 'Mittel', en: 'Medium', fr: 'Moyen', it: 'Medio'},
      low: {hu: 'Alacsony', de: 'Niedrig', en: 'Low', fr: 'Faible', it: 'Basso'}
    };
    return texts[severity]?.[language] || severity;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(getApiUrl('/api/errors/export-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: allErrors,
          protocolData,
          language
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OTIS_Hibalista_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(getApiUrl('/api/errors/export-excel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: allErrors,
          protocolData,
          language
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OTIS_Hibalista_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    alert({hu: 'Email funkció fejlesztés alatt', de: 'Email-Funktion in Entwicklung', en: 'Email function under development', fr: 'Fonction email en développement', it: 'Funzione email in sviluppo'}[language]);
  };

  const printReport = () => {
    window.print();
  };

  // ========================================
  // MODERN THEME RENDER
  // ========================================
  if (theme === 'modern') {
    if (allErrors.length === 0) {
      return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-50 blur-xl animate-pulse" />
          
          <Card className="relative bg-white border-0 rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse" />
                <CheckCircle className="relative h-16 w-16 text-green-500 mx-auto" />
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 bg-clip-text text-transparent mb-3">
                {{hu: 'Nincs jelentett hiba', de: 'Keine Fehler gemeldet', en: 'No errors reported', fr: 'Aucune erreur signalée', it: 'Nessun errore segnalato'}[language]}
              </h3>
              <p className="text-gray-600 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                {{hu: 'Az átvételi protokoll hibamentesen befejezve.', de: 'Das Abnahmeprotokoll wurde fehlerfrei abgeschlossen.', en: 'The acceptance protocol was completed without errors.', fr: 'Le protocole d\'acceptation a été complété sans erreurs.', it: 'Il protocollo di accettazione è stato completato senza errori.'}[language]}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 opacity-50 blur-xl animate-pulse" />
          
          <Card className="relative bg-white border-0 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-500 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    {{hu: 'Hibalista Exportálás', de: 'Fehlerliste Export', en: 'Error List Export', fr: 'Exporter Liste d\'Erreurs', it: 'Esporta Lista Errori'}[language]}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      {allErrors.length} {{hu: 'hiba dokumentálva', de: 'Fehler dokumentiert', en: 'errors documented', fr: 'erreurs documentées', it: 'errori documentati'}[language]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="h-4 w-4 text-rose-500" />
                      {allErrors.filter(e => e.images?.length > 0).length} {{hu: 'fotóval', de: 'mit Fotos', en: 'with photos', fr: 'avec photos', it: 'con foto'}[language]}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPreview(true)}
                  className="relative overflow-hidden border-2 border-blue-500 text-blue-600 hover:bg-blue-50 bg-white group"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {{hu: 'Előnézet', de: 'Vorschau', en: 'Preview', fr: 'Aperçu', it: 'Anteprima'}[language]}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-blue-400/10 to-transparent transition-transform duration-700" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* PDF Button */}
                <Button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? ({hu: 'Generálás...', de: 'Erstellen...', en: 'Generating...', fr: 'Génération...', it: 'Generazione...'}[language]) : 'PDF'}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </Button>

                {/* Excel Button */}
                <Button
                  onClick={generateExcel}
                  disabled={isGenerating}
                  className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? ({hu: 'Generálás...', de: 'Erstellen...', en: 'Generating...', fr: 'Génération...', it: 'Generazione...'}[language]) : 'Excel'}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </Button>

                {/* Email Button */}
                <Button
                  onClick={sendEmail}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {{hu: 'Email', de: 'E-Mail', en: 'Email', fr: 'Email', it: 'Email'}[language]}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </Button>

                {/* Print Button */}
                <Button
                  onClick={printReport}
                  className="relative overflow-hidden border-2 border-purple-500 text-purple-600 hover:bg-purple-50 bg-white shadow-lg hover:shadow-xl transition-all group"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {{hu: 'Nyomtatás', de: 'Drucken', en: 'Print', fr: 'Imprimer', it: 'Stampa'}[language]}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-purple-400/10 to-transparent transition-transform duration-700" />
                </Button>
              </div>

              {/* Quick Statistics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {/* Critical */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 p-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-30 animate-pulse" />
                  <div className="relative bg-white rounded-2xl p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      {allErrors.filter(e => e.severity === 'critical').length}
                    </div>
                    <div className="text-sm font-semibold text-red-600 mt-1">{getSeverityText('critical')}</div>
                  </div>
                </div>

                {/* Medium */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-30 animate-pulse" />
                  <div className="relative bg-white rounded-2xl p-4 text-center">
                    <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {allErrors.filter(e => e.severity === 'medium').length}
                    </div>
                    <div className="text-sm font-semibold text-amber-600 mt-1">{getSeverityText('medium')}</div>
                  </div>
                </div>

                {/* Low */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 p-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-400 opacity-30 animate-pulse" />
                  <div className="relative bg-white rounded-2xl p-4 text-center">
                    <Info className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                      {allErrors.filter(e => e.severity === 'low').length}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">{getSeverityText('low')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Modal - Modern - JAVÍTOTT SCROLLING */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-transparent border-0 shadow-none overflow-hidden flex flex-col">
            
            {/* KÜLSŐ GRADIENS KERET - Flex konténer */}
            <div className="relative flex flex-col w-full h-full overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
              {/* Háttér effekt */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse pointer-events-none" />
              
              {/* BELSŐ FEHÉR KONTÉNER - Itt lesz a görgetés */}
              <div className="relative flex flex-col w-full h-full bg-white rounded-3xl overflow-hidden">
                
                {/* Header (FIX) */}
                <DialogHeader className="p-6 pb-4 flex-shrink-0 bg-white z-10 relative">
                  <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    {{hu: 'Hibalista Előnézet', de: 'Fehlerliste Vorschau', en: 'Error List Preview', fr: 'Aperçu Liste d\'Erreurs', it: 'Anteprima Lista Errori'}[language]}
                  </DialogTitle>
                </DialogHeader>

                {/* Scrollable Content Area (FLEXIBLE) */}
                <div className="p-6 pt-0 space-y-6 overflow-y-auto custom-scrollbar flex-1" id="error-report-content">
                  {/* Report Header */}
                  <div className="text-center border-b-2 border-gray-200 pb-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3">
                      OTIS {{hu: 'Hibalista', de: 'Fehlerliste', en: 'Error List', fr: 'Liste d\'Erreurs', it: 'Lista Errori'}[language]}
                    </h1>
                    <div className="text-sm text-gray-600 space-y-1">
                      {(protocolData?.plz || protocolData?.city || protocolData?.street) && (
                        <p><strong>{{hu: 'Cím:', de: 'Adresse:', en: 'Address:', fr: 'Adresse:', it: 'Indirizzo:'}[language]}</strong> {[
                          protocolData?.plz,
                          protocolData?.city,
                          protocolData?.street ? `${protocolData.street} ${protocolData?.houseNumber || ''}`.trim() : null
                        ].filter(Boolean).join(', ')}</p>
                      )}
                      {protocolData?.liftId && (
                        <p><strong>{{hu: 'Otis telepítési szám:', de: 'Otis Anlage Nummer:', en: 'Otis Installation Number:', fr: 'Numéro d\'Installation Otis:', it: 'Numero Impianto Otis:'}[language]}</strong> {protocolData.liftId}</p>
                      )}
                      {protocolData?.inspectorName && (
                        <p><strong>{{hu: 'Ellenőr neve:', de: 'Prüfer:', en: 'Inspector:', fr: 'Inspecteur:', it: 'Ispettore:'}[language]}</strong> {protocolData.inspectorName}</p>
                      )}
                      <p><strong>{{hu: 'Dátum:', de: 'Datum:', en: 'Date:', fr: 'Date:', it: 'Data:'}[language]}</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Error List */}
                  <div className="space-y-4">
                    {allErrors.map((error, index) => (
                      <div key={error.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 p-1 shadow-md">
                        <Card className="relative bg-white border-0 rounded-2xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">#{index + 1}</span>
                                <Badge 
                                  variant={getSeverityColor(error.severity)}
                                  className="gap-1"
                                >
                                  {error.severity === 'critical' && <AlertTriangle className="h-3 w-3" />}
                                  {error.severity === 'medium' && <AlertCircle className="h-3 w-3" />}
                                  {error.severity === 'low' && <Info className="h-3 w-3" />}
                                  {getSeverityText(error.severity)}
                                </Badge>
                              </div>
                              {error.images?.length > 0 && (
                                <div className="flex items-center text-sm text-gray-500 gap-1">
                                  <Camera className="h-4 w-4" />
                                  {error.images.length} {{hu: 'fotó', de: 'Foto(s)', en: 'photo(s)', fr: 'photo(s)', it: 'foto'}[language]}
                                </div>
                              )}
                            </div>
                            
                            <h3 className="font-bold text-gray-800 mb-2">{error.title}</h3>
                            <p className="text-gray-600 mb-3">{error.description}</p>
                            
                            {error.images?.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {error.images.map((image: string, imgIndex: number) => (
                                  <div key={imgIndex} className="relative group">
                                    <img
                                      src={image}
                                      alt={`${{hu: 'Hiba fotó', de: 'Fehlerfoto', en: 'Error photo', fr: 'Photo erreur', it: 'Foto errore'}[language]} ${imgIndex + 1}`}
                                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md group-hover:shadow-lg transition-all"
                                    />
                                    <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                                      {imgIndex + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="text-center text-sm text-gray-500 border-t-2 border-gray-200 pt-4 pb-2">
                    <p className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      {{hu: 'Generálva', de: 'Erstellt', en: 'Generated', fr: 'Généré', it: 'Generato'}[language]}: {new Date().toLocaleString()}
                    </p>
                    <p className="font-semibold text-gray-700 mt-1">
                      OTIS APROD - {{hu: 'Átvételi Protokoll Alkalmazás', de: 'Abnahmeprotokoll Anwendung', en: 'Acceptance Protocol Application', fr: 'Application Protocole d\'Acceptation', it: 'Applicazione Protocollo di Accettazione'}[language]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ========================================
  // CLASSIC THEME RENDER ( változatlan)
  // ========================================
  if (allErrors.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200 border shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="text-green-600 mb-2 text-4xl">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {{hu: 'Nincs jelentett hiba', de: 'Keine Fehler gemeldet', en: 'No errors reported', fr: 'Aucune erreur signalée', it: 'Nessun errore segnalato'}[language]}
          </h3>
          <p className="text-green-600">
            {{hu: 'Az átvételi protokoll hibamentesen befejezve.', de: 'Das Abnahmeprotokoll wurde fehlerfrei abgeschlossen.', en: 'The acceptance protocol was completed without errors.', fr: 'Le protocole d\'acceptation a été complété sans erreurs.', it: 'Il protocollo di accettazione è stato completato senza errori.'}[language]}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {{hu: 'Hibalista Exportálás', de: 'Fehlerliste Export', en: 'Error List Export', fr: 'Exporter Liste d\'Erreurs', it: 'Esporta Lista Errori'}[language]}
              </h2>
              <p className="text-sm text-gray-600">
                {allErrors.length} {{hu: 'hiba dokumentálva', de: 'Fehler dokumentiert', en: 'errors documented', fr: 'erreurs documentées', it: 'errori documentati'}[language]}
                {' • '}
                {allErrors.filter(e => e.images?.length > 0).length} {{hu: 'fotóval', de: 'mit Fotos', en: 'with photos', fr: 'avec photos', it: 'con foto'}[language]}
              </p>
            </div>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              {{hu: 'Előnézet', de: 'Vorschau', en: 'Preview', fr: 'Aperçu', it: 'Anteprima'}[language]}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? ({hu: 'Generálás...', de: 'Erstellen...', en: 'Generating...', fr: 'Génération...', it: 'Generazione...'}[language]) : 'PDF'}
            </Button>

            <Button
              onClick={generateExcel}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? ({hu: 'Generálás...', de: 'Erstellen...', en: 'Generating...', fr: 'Génération...', it: 'Generazione...'}[language]) : 'Excel'}
            </Button>

            <Button
              onClick={sendEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {{hu: 'Email', de: 'E-Mail', en: 'Email', fr: 'Email', it: 'Email'}[language]}
            </Button>

            <Button
              onClick={printReport}
              variant="outline"
              className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              {{hu: 'Nyomtatás', de: 'Drucken', en: 'Print', fr: 'Imprimer', it: 'Stampa'}[language]}
            </Button>
          </div>

          {/* Quick Statistics - Classic */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {allErrors.filter(e => e.severity === 'critical').length}
              </div>
              <div className="text-sm text-red-600">{getSeverityText('critical')}</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {allErrors.filter(e => e.severity === 'medium').length}
              </div>
              <div className="text-sm text-yellow-600">{getSeverityText('medium')}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {allErrors.filter(e => e.severity === 'low').length}
              </div>
              <div className="text-sm text-blue-600">{getSeverityText('low')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal - Classic */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-300 shadow-lg bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-gray-900">
              {{hu: 'Hibalista Előnézet', de: 'Fehlerliste Vorschau', en: 'Error List Preview', fr: 'Aperçu Liste d\'Erreurs', it: 'Anteprima Lista Errori'}[language]}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6" id="error-report-content">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-blue-600 mb-2">
                OTIS {{hu: 'Hibalista', de: 'Fehlerliste', en: 'Error List', fr: 'Liste d\'Erreurs', it: 'Lista Errori'}[language]}
              </h1>
              <div className="text-sm text-gray-600 space-y-1">
                {(protocolData?.plz || protocolData?.city || protocolData?.street) && (
                  <p><strong>{{hu: 'Cím:', de: 'Adresse:', en: 'Address:', fr: 'Adresse:', it: 'Indirizzo:'}[language]}</strong> {[
                    protocolData?.plz,
                    protocolData?.city,
                    protocolData?.street ? `${protocolData.street} ${protocolData?.houseNumber || ''}`.trim() : null
                  ].filter(Boolean).join(', ')}</p>
                )}
                {protocolData?.liftId && (
                  <p><strong>{{hu: 'Otis telepítési szám:', de: 'Otis Anlage Nummer:', en: 'Otis Installation Number:', fr: 'Numéro d\'Installation Otis:', it: 'Numero Impianto Otis:'}[language]}</strong> {protocolData.liftId}</p>
                )}
                {protocolData?.inspectorName && (
                  <p><strong>{{hu: 'Ellenőr neve:', de: 'Prüfer:', en: 'Inspector:', fr: 'Inspecteur:', it: 'Ispettore:'}[language]}</strong> {protocolData.inspectorName}</p>
                )}
                <p><strong>{{hu: 'Dátum:', de: 'Datum:', en: 'Date:', fr: 'Date:', it: 'Data:'}[language]}</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Error List */}
            <div className="space-y-4">
              {allErrors.map((error, index) => (
                <Card key={error.id} className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                        <Badge variant={getSeverityColor(error.severity)}>
                          {getSeverityText(error.severity)}
                        </Badge>
                      </div>
                      {error.images?.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Camera className="h-4 w-4 mr-1" />
                          {error.images.length} {{hu: 'fotó', de: 'Foto(s)', en: 'photo(s)', fr: 'photo(s)', it: 'foto'}[language]}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2">{error.title}</h3>
                    <p className="text-gray-600 mb-3">{error.description}</p>
                    
                    {error.images?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {error.images.map((image: string, imgIndex: number) => (
                          <div key={imgIndex} className="relative">
                            <img
                              src={image}
                              alt={`${{hu: 'Hiba fotó', de: 'Fehlerfoto', en: 'Error photo', fr: 'Photo erreur', it: 'Foto errore'}[language]} ${imgIndex + 1}`}
                              className="w-full h-32 object-cover rounded border border-gray-300"
                            />
                            <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                              {imgIndex + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>{{hu: 'Generálva', de: 'Erstellt', en: 'Generated', fr: 'Généré', it: 'Generato'}[language]}: {new Date().toLocaleString()}</p>
              <p>OTIS APROD - {{hu: 'Átvételi Protokoll Alkalmazás', de: 'Abnahmeprotokoll Anwendung', en: 'Acceptance Protocol Application', fr: 'Application Protocole d\'Acceptation', it: 'Applicazione Protocollo di Accettazione'}[language]}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
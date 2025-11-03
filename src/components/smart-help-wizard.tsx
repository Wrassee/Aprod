import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguageContext } from '@/components/language-provider';
import { useTheme } from '@/contexts/theme-context';
import { HelpCircle, Lightbulb, AlertTriangle, CheckCircle, Brain, Zap, Sparkles } from 'lucide-react';

interface HelpSuggestion {
  id: string;
  type: 'tip' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

interface SmartHelpWizardProps {
  currentPage: number;
  formData: any;
  currentQuestionId?: string;
  errors: any[];
}

export function SmartHelpWizard({ currentPage, formData, currentQuestionId, errors }: SmartHelpWizardProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState<HelpSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Smart AI Analysis Engine - Helyi intelligencia
  const analyzeContext = async () => {
    setAiThinking(true);
    const newSuggestions: HelpSuggestion[] = [];
    
    // 1. Oldal-specifikus kontextuális segítség
    if (currentPage === 1) {
      newSuggestions.push({
        id: 'general_info',
        type: 'info',
        title: language === 'hu' ? 'Általános adatok kitöltése' : 'Allgemeine Daten ausfüllen',
        description: language === 'hu' 
          ? 'Győződjön meg róla, hogy az összes kötelező mező ki van töltve. A pontos adatok kritikusak a protokoll érvényességéhez.'
          : 'Stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind. Genaue Daten sind kritisch für die Protokollgültigkeit.',
        context: 'page_1_general',
        priority: 'medium'
      });
    }

    if (currentPage === 4) {
      // Mérési adatok intelligens elemzése
      const measurementData = formData.measurements || {};
      const filledMeasurements = Object.values(measurementData).filter(v => v).length;
      
      if (filledMeasurements > 0) {
        newSuggestions.push({
          id: 'measurement_progress',
          type: 'success',
          title: language === 'hu' ? 'Mérési adatok folyamatban' : 'Messdaten in Bearbeitung',
          description: language === 'hu' 
            ? `${filledMeasurements} mérési érték már rögzítve. Ellenőrizze az értékek pontosságát.`
            : `${filledMeasurements} Messwerte bereits erfasst. Überprüfen Sie die Genauigkeit der Werte.`,
          context: 'measurements_active',
          priority: 'medium'
        });
      }

      // Mérési értékek validáció
      Object.entries(measurementData).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            newSuggestions.push({
              id: `invalid_measurement_${key}`,
              type: 'warning',
              title: language === 'hu' ? 'Érvénytelen mérési érték' : 'Ungültiger Messwert',
              description: language === 'hu' 
                ? `A ${key} mező érvénytelen számot tartalmaz. Kérjük, ellenőrizze a bevitt értéket.`
                : `Das Feld ${key} enthält eine ungültige Zahl. Bitte überprüfen Sie den eingegebenen Wert.`,
              context: `measurement_${key}`,
              priority: 'high'
            });
          }
        }
      });
    }

    if (currentPage === 5) {
      // Niedervolt mérések elemzése
      newSuggestions.push({
        id: 'niedervolt_info',
        type: 'info',
        title: language === 'hu' ? 'Niedervolt mérési jegyzőkönyv' : 'Niedervolt Messprotokoll',
        description: language === 'hu' 
          ? 'A Niedervolt Installations Verordnung art.14 szerinti mérések. Minden mérési típusnál 3 érték rögzíthető.'
          : 'Messungen nach Niedervolt Installations Verordnung art.14. Für jeden Messtyp können 3 Werte erfasst werden.',
        context: 'niedervolt_page',
        priority: 'medium'
      });
    }

    // 2. Hibák alapján intelligens javaslatok
    if (errors && errors.length > 0) {
      newSuggestions.push({
        id: 'error_detected',
        type: 'warning',
        title: language === 'hu' ? 'Hibák észlelve' : 'Fehler erkannt',
        description: language === 'hu' 
          ? `${errors.length} hiba került rögzítésre. Ellenőrizze a protokoll pontosságát.`
          : `${errors.length} Fehler wurden erfasst. Überprüfen Sie die Protokollgenauigkeit.`,
        context: 'errors_present',
        priority: 'high'
      });
    }

    // 3. Okos kiegészítési javaslatok
    const formFields = Object.keys(formData);
    const emptyFields = formFields.filter(key => !formData[key] || formData[key] === '');
    
    if (emptyFields.length > 0 && currentPage < 5) {
      newSuggestions.push({
        id: 'completion_suggestion',
        type: 'tip',
        title: language === 'hu' ? 'Kitöltés optimalizálása' : 'Vervollständigung optimieren',
        description: language === 'hu' 
          ? `${emptyFields.length} mező még kitöltésre vár. A teljes protokoll pontosabb eredményeket ad.`
          : `${emptyFields.length} Felder warten noch auf Ausfüllung. Ein vollständiges Protokoll liefert genauere Ergebnisse.`,
        context: 'completion_optimization',
        priority: 'low'
      });
    }

    // 4. Aktuális kérdés kontextuális segítség
    if (currentQuestionId) {
      const contextualHelp = getQuestionContextualHelp(currentQuestionId);
      if (contextualHelp) {
        newSuggestions.push(contextualHelp);
      }
    }

    // 5. Teljesítményre vonatkozó javaslatok
    if (currentPage === 3) {
      newSuggestions.push({
        id: 'modernization_tip',
        type: 'tip',
        title: language === 'hu' ? 'Modernizációs tippek' : 'Modernisierungstipps',
        description: language === 'hu' 
          ? 'A modernizációs kérdések alapján OTIS ajánlásokat adhat a lift optimalizálásához.'
          : 'Basierend auf den Modernisierungsfragen kann OTIS Empfehlungen zur Aufzugoptimierung geben.',
        context: 'modernization_page',
        priority: 'low'
      });
    }

    setTimeout(() => {
      setSuggestions(newSuggestions);
      setAiThinking(false);
    }, 800); // Rövid AI "gondolkodási" idő a realisztikus érzésért
  };

  // Kérdés-specifikus kontextuális segítség
  const getQuestionContextualHelp = (questionId: string): HelpSuggestion | null => {
    const helpMap: Record<string, HelpSuggestion> = {
      '1': {
        id: 'question_1_help',
        type: 'info',
        title: language === 'hu' ? 'Átvevő neve' : 'Name des Übernehmers',
        description: language === 'hu' 
          ? 'Adja meg a protokollt átvevő személy teljes nevét. Ez általában a létesítmény felelős személye.'
          : 'Geben Sie den vollständigen Namen der Person ein, die das Protokoll übernimmt. Dies ist normalerweise die verantwortliche Person der Anlage.',
        context: 'question_1',
        priority: 'medium'
      },
      'm1': {
        id: 'measurement_m1_help',
        type: 'tip',
        title: language === 'hu' ? 'Isolationsmessung' : 'Isolationsmessung',
        description: language === 'hu' 
          ? 'Az izolációs ellenállás mérése. Tipikus értékek: >1 MΩ. Alacsonyabb értékek hibára utalhatnak.'
          : 'Messung des Isolationswiderstands. Typische Werte: >1 MΩ. Niedrigere Werte können auf Fehler hinweisen.',
        context: 'measurement_m1',
        priority: 'high'
      }
    };

    return helpMap[questionId] || null;
  };

  useEffect(() => {
    analyzeContext();
  }, [currentPage, formData, currentQuestionId, errors]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <HelpCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSuggestionColor = (type: string, isModern: boolean) => {
    if (isModern) {
      switch (type) {
        case 'tip': return 'bg-gradient-to-br from-yellow-50 via-amber-50/50 to-orange-50/30 border-2 border-yellow-200';
        case 'warning': return 'bg-gradient-to-br from-orange-50 via-red-50/50 to-rose-50/30 border-2 border-orange-300';
        case 'success': return 'bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 border-2 border-green-200';
        default: return 'bg-gradient-to-br from-blue-50 via-sky-50/50 to-cyan-50/30 border-2 border-blue-200';
      }
    } else {
      switch (type) {
        case 'tip': return 'border-yellow-200 bg-yellow-50';
        case 'warning': return 'border-orange-200 bg-orange-50';
        case 'success': return 'border-green-200 bg-green-50';
        default: return 'border-blue-200 bg-blue-50';
      }
    }
  };

  const prioritySuggestions = suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // MODERN THEME TRIGGER BUTTON
  if (theme === 'modern') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
            
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2 font-semibold">
              <Brain className="h-4 w-4" />
              {language === 'hu' ? 'AI Segítő' : 'AI Hilfe'}
              {suggestions.length > 0 && (
                <Badge className="ml-1 bg-white text-purple-600 border-0 px-2 py-0.5">
                  {suggestions.length}
                </Badge>
              )}
              <Sparkles className="h-3 w-3 animate-pulse" />
            </span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
          </button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh] rounded-3xl border-2 border-blue-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent font-bold">
                  {language === 'hu' ? 'Smart AI Segítő' : 'Smart AI Hilfe'}
                </div>
                {aiThinking && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Zap className="h-3 w-3 animate-pulse text-yellow-500" />
                    {language === 'hu' ? 'Elemzés folyamatban...' : 'Analysiere...'}
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-4">
              {prioritySuggestions.length === 0 && !aiThinking ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 p-1 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-30 animate-pulse" />
                  <Card className="relative border-0 bg-white rounded-2xl">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-400 flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                            {language === 'hu' ? 'Minden rendben!' : 'Alles in Ordnung!'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {language === 'hu' 
                              ? 'Jelenleg nincsenek javaslatok. A protokoll jól halad.'
                              : 'Derzeit keine Vorschläge. Das Protokoll läuft gut.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                prioritySuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="relative overflow-hidden rounded-2xl p-0.5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <Card className={`${getSuggestionColor(suggestion.type, true)} border-l-4 shadow-none`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-2 flex-1">
                            {getSuggestionIcon(suggestion.type)}
                            <span className="font-semibold">{suggestion.title}</span>
                          </div>
                          <Badge 
                            className={`text-xs font-semibold ${
                              suggestion.priority === 'high' 
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0' 
                                : suggestion.priority === 'medium' 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' 
                                : 'bg-gradient-to-r from-gray-400 to-slate-400 text-white border-0'
                            }`}
                          >
                            {suggestion.priority === 'high' ? (language === 'hu' ? 'Magas' : 'Hoch') :
                             suggestion.priority === 'medium' ? (language === 'hu' ? 'Közepes' : 'Mittel') :
                             (language === 'hu' ? 'Alacsony' : 'Niedrig')}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{suggestion.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-purple-500" />
              {language === 'hu' ? 'AI helyi elemzés' : 'KI lokale Analyse'} • 
              {language === 'hu' ? ` Oldal ${currentPage}/5` : ` Seite ${currentPage}/5`}
            </div>
            <button
              onClick={analyzeContext}
              disabled={aiThinking}
              className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4" />
                {language === 'hu' ? 'Újraelemzés' : 'Neu analysieren'}
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // CLASSIC THEME RENDER
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 shadow-sm"
        >
          <Brain className="h-4 w-4 mr-2" />
          {language === 'hu' ? 'AI Segítő' : 'AI Hilfe'}
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600">
              {suggestions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            {language === 'hu' ? 'Smart Contextual Help Wizard' : 'Smart Contextual Help Wizard'}
            {aiThinking && (
              <div className="ml-3 flex items-center">
                <Zap className="h-4 w-4 animate-pulse text-yellow-500" />
                <span className="text-sm text-gray-500 ml-1">
                  {language === 'hu' ? 'Elemzés...' : 'Analysiere...'}
                </span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {prioritySuggestions.length === 0 && !aiThinking ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-green-800">
                        {language === 'hu' ? 'Minden rendben!' : 'Alles in Ordnung!'}
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        {language === 'hu' 
                          ? 'Jelenleg nincsenek javaslatok. A protokoll jól halad.'
                          : 'Derzeit keine Vorschläge. Das Protokoll läuft gut.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              prioritySuggestions.map((suggestion) => (
                <Card key={suggestion.id} className={`${getSuggestionColor(suggestion.type, false)} border-l-4`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-sm">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="ml-2">{suggestion.title}</span>
                      <Badge 
                        variant="outline" 
                        className={`ml-auto text-xs ${
                          suggestion.priority === 'high' ? 'border-red-300 text-red-700' :
                          suggestion.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                          'border-gray-300 text-gray-600'
                        }`}
                      >
                        {suggestion.priority === 'high' ? (language === 'hu' ? 'Magas' : 'Hoch') :
                         suggestion.priority === 'medium' ? (language === 'hu' ? 'Közepes' : 'Mittel') :
                         (language === 'hu' ? 'Alacsony' : 'Niedrig')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700">{suggestion.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-500">
            {language === 'hu' ? 'AI helyi elemzés' : 'KI lokale Analyse'} • 
            {language === 'hu' ? ` Oldal ${currentPage}/5` : ` Seite ${currentPage}/5`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeContext}
            disabled={aiThinking}
          >
            <Brain className="h-4 w-4 mr-2" />
            {language === 'hu' ? 'Újraelemzés' : 'Neu analysieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
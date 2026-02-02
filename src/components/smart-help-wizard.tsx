import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { 
  HelpCircle, Lightbulb, AlertTriangle, CheckCircle, Brain, Zap, Sparkles,
  BookOpen, MessageCircle, Send, ChevronRight, Loader2, ArrowLeft
} from 'lucide-react';
import { helpTranslations, faqContent, type FAQItem } from '@/lib/help-content';
import { apiRequest } from '@/lib/queryClient';

interface HelpSuggestion {
  id: string;
  type: 'tip' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SmartHelpWizardProps {
  currentPage: number;
  formData: any;
  currentQuestionId?: string;
  errors: any[];
}

export function SmartHelpWizard({ currentPage, formData, currentQuestionId, errors }: SmartHelpWizardProps) {
  const { language } = useLanguageContext();
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState<HelpSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'faq' | 'chat'>('suggestions');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const t = helpTranslations[language] || helpTranslations.hu;
  const faqs = faqContent[language] || faqContent.hu;
  const categories = t.categories;

  const analyzeContext = async () => {
    setAiThinking(true);
    const newSuggestions: HelpSuggestion[] = [];
    
    if (currentPage === 1) {
      newSuggestions.push({
        id: 'general_info',
        type: 'info',
        title: language === 'hu' ? 'Általános adatok kitöltése' : 
               language === 'de' ? 'Allgemeine Daten ausfüllen' :
               language === 'fr' ? 'Remplir les données générales' :
               language === 'it' ? 'Compilare i dati generali' :
               'Fill in general data',
        description: language === 'hu' 
          ? 'Győződjön meg róla, hogy az összes kötelező mező ki van töltve.'
          : language === 'de' ? 'Stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind.'
          : language === 'fr' ? 'Assurez-vous que tous les champs obligatoires sont remplis.'
          : language === 'it' ? 'Assicurati che tutti i campi obbligatori siano compilati.'
          : 'Make sure all required fields are filled.',
        context: 'page_1_general',
        priority: 'medium'
      });
    }

    if (currentPage === 4) {
      const measurementData = formData.measurements || {};
      const filledMeasurements = Object.values(measurementData).filter(v => v).length;
      
      if (filledMeasurements > 0) {
        newSuggestions.push({
          id: 'measurement_progress',
          type: 'success',
          title: language === 'hu' ? 'Mérési adatok rögzítve' : 
                 language === 'de' ? 'Messdaten erfasst' :
                 language === 'fr' ? 'Données de mesure enregistrées' :
                 language === 'it' ? 'Dati di misurazione registrati' :
                 'Measurement data recorded',
          description: language === 'hu' 
            ? `${filledMeasurements} mérési érték már rögzítve.`
            : language === 'de' ? `${filledMeasurements} Messwerte bereits erfasst.`
            : language === 'fr' ? `${filledMeasurements} valeurs de mesure enregistrées.`
            : language === 'it' ? `${filledMeasurements} valori di misurazione registrati.`
            : `${filledMeasurements} measurement values recorded.`,
          context: 'measurements_active',
          priority: 'medium'
        });
      }
    }

    if (currentPage === 5) {
      newSuggestions.push({
        id: 'niedervolt_info',
        type: 'info',
        title: language === 'hu' ? 'Niedervolt mérési jegyzőkönyv' : 
               language === 'de' ? 'Niedervolt Messprotokoll' :
               language === 'fr' ? 'Protocole de mesure basse tension' :
               language === 'it' ? 'Protocollo di misura bassa tensione' :
               'Low voltage measurement protocol',
        description: language === 'hu' 
          ? 'NIV art.14 szerinti mérések. Minden típusnál 3 érték rögzíthető.'
          : language === 'de' ? 'Messungen nach NIV art.14. 3 Werte pro Typ möglich.'
          : language === 'fr' ? 'Mesures selon NIV art.14. 3 valeurs par type.'
          : language === 'it' ? 'Misurazioni secondo NIV art.14. 3 valori per tipo.'
          : 'Measurements per NIV art.14. 3 values per type.',
        context: 'niedervolt_page',
        priority: 'medium'
      });
    }

    if (errors && errors.length > 0) {
      newSuggestions.push({
        id: 'error_detected',
        type: 'warning',
        title: language === 'hu' ? 'Hibák észlelve' : 
               language === 'de' ? 'Fehler erkannt' :
               language === 'fr' ? 'Erreurs détectées' :
               language === 'it' ? 'Errori rilevati' :
               'Errors detected',
        description: language === 'hu' 
          ? `${errors.length} hiba került rögzítésre.`
          : language === 'de' ? `${errors.length} Fehler wurden erfasst.`
          : language === 'fr' ? `${errors.length} erreurs enregistrées.`
          : language === 'it' ? `${errors.length} errori registrati.`
          : `${errors.length} errors recorded.`,
        context: 'errors_present',
        priority: 'high'
      });
    }

    setTimeout(() => {
      setSuggestions(newSuggestions);
      setAiThinking(false);
    }, 500);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const response = await apiRequest('POST', '/api/ai-help/ask', {
        question: userMessage,
        language,
        context: {
          currentPage,
          filledFields: Object.keys(formData).length,
          errorCount: errors?.length || 0
        }
      });

      const data = await response.json();
      const answer = data.answer || data.fallbackMessage || t.noAnswer;
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t.noAnswer
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    analyzeContext();
  }, [currentPage, formData, currentQuestionId, errors]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <HelpCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'tip': return 'border-yellow-200 bg-yellow-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const filteredFaqs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  const prioritySuggestions = suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const renderFAQContent = () => (
    <div className="space-y-4">
      {!selectedCategory ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 group-hover:text-blue-600">{label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {faqs.filter(f => f.category === key).length} {language === 'hu' ? 'kérdés' : language === 'de' ? 'Fragen' : 'questions'}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToFAQ}
          </button>
          
          {filteredFaqs.map(faq => (
            <Card key={faq.id} className="border-l-4 border-l-blue-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderChatContent = () => (
    <div className="flex flex-col h-80">
      <ScrollArea className="flex-1 pr-4" ref={chatScrollRef}>
        <div className="space-y-3">
          {chatMessages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{t.askAI}</p>
            </div>
          )}
          
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isAiLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.aiThinking}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={t.askPlaceholder}
          onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
          disabled={isAiLoading}
          className="flex-1"
        />
        <Button 
          onClick={sendChatMessage} 
          disabled={!chatInput.trim() || isAiLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderSuggestionsContent = () => (
    <ScrollArea className="max-h-72">
      <div className="space-y-3">
        {prioritySuggestions.length === 0 && !aiThinking ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-green-800">
                    {language === 'hu' ? 'Minden rendben!' : 
                     language === 'de' ? 'Alles in Ordnung!' :
                     language === 'fr' ? 'Tout va bien!' :
                     language === 'it' ? 'Tutto a posto!' :
                     'All good!'}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {language === 'hu' ? 'Nincsenek javaslatok.' : 
                     language === 'de' ? 'Keine Vorschläge.' :
                     language === 'fr' ? 'Pas de suggestions.' :
                     language === 'it' ? 'Nessun suggerimento.' :
                     'No suggestions.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          prioritySuggestions.map((suggestion) => (
            <Card key={suggestion.id} className={`${getSuggestionColor(suggestion.type)} border-l-4`}>
              <CardHeader className="pb-2">
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
                    {suggestion.priority === 'high' ? (language === 'hu' ? 'Magas' : language === 'de' ? 'Hoch' : 'High') :
                     suggestion.priority === 'medium' ? (language === 'hu' ? 'Közepes' : language === 'de' ? 'Mittel' : 'Medium') :
                     (language === 'hu' ? 'Alacsony' : language === 'de' ? 'Niedrig' : 'Low')}
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={theme === 'modern' 
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700"
            : "border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          }
        >
          <Brain className="h-4 w-4 mr-2" />
          {language === 'hu' ? 'AI Segítő' : 
           language === 'de' ? 'KI Hilfe' :
           language === 'fr' ? 'Aide IA' :
           language === 'it' ? 'Aiuto AI' :
           'AI Help'}
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600">
              {suggestions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {t.title}
            {aiThinking && (
              <span className="text-sm text-gray-500 flex items-center gap-1 ml-2">
                <Zap className="h-3 w-3 animate-pulse text-yellow-500" />
                {t.aiThinking}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'hu' ? 'Javaslatok' : 
               language === 'de' ? 'Vorschläge' :
               language === 'fr' ? 'Suggestions' :
               language === 'it' ? 'Suggerimenti' :
               'Suggestions'}
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t.faqTitle}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t.askAI}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            {renderSuggestionsContent()}
          </TabsContent>

          <TabsContent value="faq" className="mt-4">
            {renderFAQContent()}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {renderChatContent()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-xs text-gray-500">
            {language === 'hu' ? `Oldal ${currentPage}/5` : 
             language === 'de' ? `Seite ${currentPage}/5` :
             language === 'fr' ? `Page ${currentPage}/5` :
             language === 'it' ? `Pagina ${currentPage}/5` :
             `Page ${currentPage}/5`}
          </div>
          <Button variant="outline" size="sm" onClick={analyzeContext} disabled={aiThinking}>
            <Brain className="h-4 w-4 mr-2" />
            {language === 'hu' ? 'Újraelemzés' : 
             language === 'de' ? 'Neu analysieren' :
             language === 'fr' ? 'Réanalyser' :
             language === 'it' ? 'Rianalizza' :
             'Reanalyze'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// src/pages/lift-selector.tsx - JAVÍTOTT (Végtelen loop fixálva)

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles
} from "lucide-react";
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from "@/contexts/theme-context";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";

// Importáljuk az összes PNG ikont - FŐKATEGÓRIÁK
import TechnicianIconPNG from "@/assets/technician.png";
import HighRiseIconPNG from "@/assets/HighRise.png";
import ConstructionIconPNG from "@/assets/construction.png";
import CustomIconPNG from "@/assets/custom.png";

// ALTÍPUSOK - Modernizáció
import RopeDriveIconPNG from "@/assets/rope-drive.png";
import BeltDriveIconPNG from "@/assets/belt-drive.png";
import HydraulicIconPNG from "@/assets/hydraulic.png";

// ALTÍPUSOK - Beépítések
import RenovationGen2IconPNG from "@/assets/renovation-gen2.png";
import RenovationGen360IconPNG from "@/assets/renovation-gen360.png";

// ALTÍPUSOK - Új építés
import NewbuildGen2IconPNG from "@/assets/newbuild-gen2.png";
import NewbuildGen360IconPNG from "@/assets/newbuild-gen360.png";

// ALTÍPUSOK - Egyedi
import CustomProjectIconPNG from "@/assets/custom-project.png";


// =============================================================================
// TYPES
// =============================================================================
type Screen = 
  | 'start' 
  | 'lift-selector'
  | 'questionnaire' 
  | 'erdungskontrolle' 
  | 'niedervolt' 
  | 'signature' 
  | 'completion' 
  | 'admin' 
  | 'protocol-preview' 
  | 'login' 
  | 'forgot-password' 
  | 'reset-password' 
  | 'auth-callback';

interface LiftSelectorProps {
  onNavigate: (screen: Screen) => void;
  onHome: () => void; // 🔥 ÚJ: Megkapja a szülő onHome függvényét
}

interface LiftTemplate {
  id: string;
  name: string;
  type: string;
  language: string;
  is_active: boolean;
}

interface LiftMapping {
  id: string;
  question_template: LiftTemplate | null;
  protocol_template: LiftTemplate | null;
  notes: string | null;
}

interface LiftSubtype {
  id: string;
  code: string;
  name_hu: string;
  name_de: string | null;
  description_hu: string | null;
  description_de: string | null;
  sort_order: number;
  mapping: LiftMapping | null;
}

interface LiftType {
  id: string;
  code: string;
  name_hu: string;
  name_de: string | null;
  description_hu: string | null;
  description_de: string | null;
  sort_order: number;
  subtypes: LiftSubtype[];
}

interface LiftAvailableResponse {
  success: boolean;
  data: {
    liftTypes: LiftType[];
  };
}

// =============================================================================
// ICON MAPPING - MIND PNG KÉPEK
// =============================================================================
const getIconForType = (code: string) => {
  const iconMap: Record<string, string> = {
    'MOD': TechnicianIconPNG,           
    'BEX': ConstructionIconPNG,          
    'NEU': HighRiseIconPNG,
    'CUSTOM': CustomIconPNG
  };
  
  return iconMap[code] || CustomIconPNG;
};

const getIconForSubtype = (code: string) => {
  const iconMap: Record<string, string> = {
    // Modernizáció altípusok
    'MOD_SEIL': RopeDriveIconPNG,
    'MOD_BELT': BeltDriveIconPNG,
    'MOD_HYD': HydraulicIconPNG,
    
    // Beépítések altípusok
    'BEX_GEN2': RenovationGen2IconPNG,
    'BEX_GEN360': RenovationGen360IconPNG,
    
    // Új építés altípusok
    'NEU_GEN2': NewbuildGen2IconPNG,
    'NEU_GEN360': NewbuildGen360IconPNG,
    
    // Egyedi
    'CUSTOM': CustomProjectIconPNG
  };
  
  return iconMap[code] || CustomIconPNG;
};

// =============================================================================
// COMPONENT
// =============================================================================
export default function LiftSelector({ onNavigate, onHome }: LiftSelectorProps) {
  const [, navigate] = useLocation();
  const { language, t } = useLanguageContext(); // setLanguage már nem kell ide, a szülő kezeli
  const { theme } = useTheme();
  
  const [selectedType, setSelectedType] = useState<LiftType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<LiftSubtype | null>(null);

  // Fetch available lift types
  const { data, isLoading, error } = useQuery<LiftAvailableResponse>({
    queryKey: ["/api/lifts/available"],
  });

  // Reset selection when language changes
  useEffect(() => {
    setSelectedType(null);
    setSelectedSubtype(null);
  }, [language]);

  // Get localized text
  const getName = (item: LiftType | LiftSubtype) => {
    return language === "de" && item.name_de ? item.name_de : item.name_hu;
  };

  const getDescription = (item: LiftType | LiftSubtype) => {
    return language === "de" && item.description_de ? item.description_de : item.description_hu;
  };

  // Handle subtype selection and navigation
  const handleSubtypeSelect = (subtype: LiftSubtype) => {
    if (!subtype.mapping) {
      return;
    }

    const selection = {
      language,
      liftType: selectedType?.code,
      liftSubtype: subtype.code,
      mappingId: subtype.mapping.id,
      questionTemplateId: subtype.mapping.question_template?.id,
      protocolTemplateId: subtype.mapping.protocol_template?.id,
    };

    localStorage.setItem("liftSelection", JSON.stringify(selection));
    console.log("✅ Lift selection saved:", selection);

    onNavigate('questionnaire');
  };

  // 🔥 JAVÍTVA: Nem reloadolunk, hanem a szülő onHome függvényét hívjuk
  const handleHomeClick = () => {
    console.log("🏠 LiftSelector: Home clicked - delegating to App handler...");
    // Töröljük a lokális state-et
    setSelectedType(null);
    setSelectedSubtype(null);
    // Hívjuk a szülőt, ami elvégzi a localStorage törlést és a setLanguageSelected(false)-t
    onHome();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'modern'
          ? 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20'
          : 'bg-white'
      }`}>
        <div className="text-center">
          {theme === 'modern' ? (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                <Loader2 className="relative h-16 w-16 animate-spin text-blue-600 mx-auto" />
              </div>
              <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {t("loading") || "Betöltés..."}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">
                {t("loading") || "Betöltés..."}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title={language === 'hu' ? 'Lift típus választás' : 'Aufzugstyp Auswahl'}
          onHome={handleHomeClick}
          onStartNew={() => {
            localStorage.removeItem("liftSelection");
            handleHomeClick();
          }}
          onAdminAccess={() => onNavigate('admin')}
          receptionDate={new Date().toISOString().split('T')[0]}
          onReceptionDateChange={() => {}}
        />
        
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === 'hu' 
                ? 'Hiba történt a lift típusok betöltése közben.' 
                : 'Fehler beim Laden der Aufzugstypen.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const liftTypes = data.data.liftTypes;

  // ==========================================================================
  // RENDER: Type Selection View
  // ==========================================================================
  if (!selectedType) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title={language === 'hu' ? 'Lift típus választás' : 'Aufzugstyp Auswahl'}
          onHome={handleHomeClick}
          onStartNew={() => {
            localStorage.removeItem("liftSelection");
            handleHomeClick();
          }}
          onAdminAccess={() => onNavigate('admin')}
          receptionDate={new Date().toISOString().split('T')[0]}
          onReceptionDateChange={() => {}}
        />

        <div className={`min-h-screen relative ${
          theme === 'modern' 
            ? 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 overflow-hidden' 
            : 'bg-white'
        }`}>
          {theme === 'modern' && (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/10 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </>
          )}

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-16">
            {liftTypes.length === 0 && (
              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>
                    {language === 'hu' ? 'Nincs elérhető lift típus!' : 'Keine Aufzugstypen verfügbar!'}
                  </strong>
                  <p className="mt-2">
                    {language === 'hu' 
                      ? 'Kérjük, lépjen be az Admin panelba (fent jobb sarokban) és hozzon létre lift típusokat és sablonokat.'
                      : 'Bitte öffnen Sie das Admin-Panel (oben rechts) und erstellen Sie Aufzugstypen und Vorlagen.'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center mb-16">
              <h1 className={`text-4xl font-bold mb-6 pb-1 flex items-center justify-center gap-3 ${
                theme === 'modern'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'
                  : 'text-gray-800'
              }`}>
                <Sparkles className={`h-10 w-10 ${theme === 'modern' ? 'text-blue-600' : 'text-gray-700'}`} />
                {language === 'hu' ? 'Válasszon lift típust' : 'Wählen Sie einen Aufzugstyp'}
              </h1>
              <p className={theme === 'modern' ? 'text-gray-600' : 'text-gray-700'}>
                {language === 'hu' 
                  ? 'Válassza ki a lift típusát a protokoll elkészítéséhez.' 
                  : 'Wählen Sie den Aufzugstyp für die Protokollerstellung.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-8 justify-center max-w-5xl mx-auto">
              {liftTypes.map((type) => {
                const IconComponent = getIconForType(type.code);
                
                return theme === 'modern' ? (
                  // MODERN KÁRTYA
                  <button
                    key={type.id}
                    onClick={() => {
                      console.log("🎯 Type selected:", type.code);
                      setSelectedType(type);
                    }}
                    className="group relative w-full max-w-sm"
                  >
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-300/20 to-cyan-300/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border border-gray-200/50 group-hover:border-blue-300">
                      <div className="w-32 h-32 mx-auto rounded-2xl mb-6 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                        <img 
                          src={IconComponent} 
                          alt={getName(type)}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{getName(type)}</h3>
                        {getDescription(type) && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{getDescription(type)}</p>
                        )}
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {type.code}
                          </Badge>
                          <span>•</span>
                          <span>{type.subtypes.length} {language === 'hu' ? 'altípus' : 'Untertyp'}</span>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span>{language === 'hu' ? 'Tovább' : 'Weiter'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  // CLASSIC KÁRTYA
                  <button
                    key={type.id}
                    onClick={() => {
                      console.log("🎯 Type selected:", type.code);
                      setSelectedType(type);
                    }}
                    className="group flex flex-col items-center p-8 w-full max-w-sm h-auto border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105 bg-white shadow-sm hover:shadow-lg"
                  >
                    <div className="w-24 h-24 rounded-xl mb-6 bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors duration-200 overflow-hidden">
                      <img 
                        src={IconComponent}
                        alt={getName(type)}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{getName(type)}</h3>
                      {getDescription(type) && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{getDescription(type)}</p>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline" className="border-gray-300">{type.code}</Badge>
                        <span>•</span>
                        <span>{type.subtypes.length} {language === 'hu' ? 'altípus' : 'Untertyp'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Subtype Selection View
  // ==========================================================================
  return (
    <div className="min-h-screen">
      <PageHeader
        title={`${getName(selectedType)} - ${language === 'hu' ? 'Altípus választás' : 'Untertyp Auswahl'}`}
        onHome={handleHomeClick}
        onStartNew={() => {
          localStorage.removeItem("liftSelection");
          setSelectedType(null);
          setSelectedSubtype(null);
        }}
        onAdminAccess={() => onNavigate('admin')}
        receptionDate={new Date().toISOString().split('T')[0]}
        onReceptionDateChange={() => {}}
      />

      <div className={`min-h-screen relative ${
        theme === 'modern' 
          ? 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 overflow-hidden' 
          : 'bg-white'
      }`}>
        {theme === 'modern' && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/10 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </>
        )}

        <div className="relative z-10 container max-w-6xl mx-auto px-6 py-16">
          
          {/* Warnings */}
          {selectedType.subtypes.length === 0 && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>
                  {language === 'hu' ? 'Nincs altípus ehhez a típushoz!' : 'Keine Untertypen für diesen Typ!'}
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {selectedType.subtypes.length > 0 && selectedType.subtypes.every(st => !st.mapping || !st.mapping.question_template || !st.mapping.protocol_template) && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>
                  {language === 'hu' ? 'Nincs aktív sablon párosítás!' : 'Keine aktive Vorlagenzuordnung!'}
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className={`text-4xl font-bold mb-6 pb-1 flex items-center justify-center gap-3 ${
              theme === 'modern'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'
                : 'text-gray-800'
            }`}>
              <Sparkles className={`h-10 w-10 ${theme === 'modern' ? 'text-blue-600' : 'text-gray-700'}`} />
              {getName(selectedType)} - {language === 'hu' ? 'Válasszon altípust' : 'Wählen Sie einen Untertyp'}
            </h1>
            <p className={theme === 'modern' ? 'text-gray-600' : 'text-gray-700'}>
              {language === 'hu' 
                ? 'Válassza ki a lift altípusát a protokoll elkészítéséhez.' 
                : 'Wählen Sie den Aufzugsuntertyp für die Protokollerstellung.'}
            </p>
          </div>

          {/* Subtype Cards */}
          <div className="flex flex-wrap gap-8 justify-center max-w-5xl mx-auto">
            {selectedType.subtypes.map((subtype) => {
              const hasMapping = !!subtype.mapping;
              const hasQuestionTemplate = !!subtype.mapping?.question_template;
              // const isComplete = hasQuestionTemplate && hasProtocolTemplate;
              const isComplete = hasQuestionTemplate; 
              const IconComponent = getIconForSubtype(subtype.code);

              return theme === 'modern' ? (
                <button
                  key={subtype.id}
                  onClick={() => {
                    if (hasMapping && isComplete) {
                      console.log("🎯 Subtype selected:", subtype.code);
                      handleSubtypeSelect(subtype);
                    }
                  }}
                  disabled={!isComplete}
                  className={`group relative w-full max-w-sm ${!isComplete ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isComplete && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-green-300/20 to-emerald-300/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  )}
                  
                  <div className={`relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-md transition-all duration-300 border ${
                    isComplete 
                      ? 'hover:shadow-xl transform hover:scale-105 border-gray-200/50 hover:border-green-300'
                      : 'border-red-200/50'
                  }`}>
                    <div className={`w-32 h-32 mx-auto rounded-2xl mb-6 flex items-center justify-center shadow-md transform transition-transform duration-300 relative overflow-hidden ${
                      isComplete 
                        ? 'bg-gradient-to-br from-green-100 to-emerald-100 group-hover:scale-110' 
                        : 'bg-gradient-to-br from-red-100 to-rose-100'
                    }`}>
                      <img 
                        src={IconComponent} 
                        alt={getName(subtype)}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{getName(subtype)}</h3>
                      {getDescription(subtype) && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{getDescription(subtype)}</p>
                      )}
                      
                      <Badge variant="outline" className="mb-4 bg-blue-50 border-blue-200 text-blue-700">
                        {subtype.code}
                      </Badge>

                      {!hasMapping && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          {language === 'hu' ? 'Nincs sablon párosítás' : 'Keine Vorlagenzuordnung'}
                        </div>
                      )}

                      {hasMapping && !isComplete && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                          {!hasQuestionTemplate && (language === 'hu' ? 'Hiányzó kérdés sablon' : 'Fehlende Fragenvorlage')}
                        </div>
                      )}

                      {isComplete && (
                        <>
                          <div className="mt-3 space-y-1 text-xs text-gray-600">
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>{subtype.mapping?.question_template?.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span>{language === 'hu' ? 'Indítás' : 'Starten'}</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                // CLASSIC
                <button
                  key={subtype.id}
                  onClick={() => {
                    if (hasMapping && isComplete) {
                      console.log("🎯 Subtype selected:", subtype.code);
                      handleSubtypeSelect(subtype);
                    }
                  }}
                  disabled={!isComplete}
                  className={`group flex flex-col items-center p-8 w-full max-w-sm h-auto border-2 rounded-lg transition-all duration-200 transform bg-white shadow-sm ${
                    isComplete
                      ? 'border-gray-200 hover:border-green-600 hover:bg-green-50 hover:scale-105 hover:shadow-lg cursor-pointer'
                      : 'border-red-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-24 h-24 rounded-xl mb-6 flex items-center justify-center transition-colors duration-200 relative overflow-hidden ${
                    isComplete ? 'bg-gray-100 group-hover:bg-green-100' : 'bg-red-50'
                  }`}>
                    <img 
                      src={IconComponent} 
                      alt={getName(subtype)}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{getName(subtype)}</h3>
                    {getDescription(subtype) && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{getDescription(subtype)}</p>
                    )}
                    
                    <Badge variant="outline" className="mb-3 border-gray-300">{subtype.code}</Badge>

                    {isComplete && (
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{subtype.mapping?.question_template?.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>  

          {/* NAVIGÁCIÓ */}
          <div className="mt-12 flex justify-center sm:justify-start max-w-5xl mx-auto">
            {theme === 'modern' ? (
              <button
                onClick={handleHomeClick}
                className="group relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{language === 'hu' ? 'Vissza' : 'Zurück'}</span>
                </div>
              </button>
            ) : (
              <Button
                variant="outline"
                onClick={handleHomeClick}
                className="flex items-center border-otis-blue text-otis-blue hover:bg-otis-blue hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'hu' ? 'Vissza' : 'Zurück'}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
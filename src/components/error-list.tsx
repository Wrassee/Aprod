import { useState, useEffect } from 'react';
import { ProtocolError } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Ikonok mindkét témához
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';
// Közös komponensek
import { useLanguageContext } from "@/components/language-context";
import { AddErrorModal } from '@/components/add-error-modal';
// Téma import
import { useTheme } from '@/contexts/theme-context';

interface ErrorListProps {
  errors: ProtocolError[];
  onAddError: (error: Omit<ProtocolError, 'id'>) => void;
  onEditError: (id: string, error: Omit<ProtocolError, 'id'>) => void;
  onDeleteError: (id: string) => void;
}

export function ErrorList({ errors = [], onAddError, onEditError, onDeleteError }: ErrorListProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme(); // TÉMA HOOK
  const [showModal, setShowModal] = useState(false);
  const [editingError, setEditingError] = useState<ProtocolError | null>(null);
  const [localStorageErrors, setLocalStorageErrors] = useState<ProtocolError[]>([]);
  
  // === KÖZÖS LOGIKA: LOCALSTORAGE FIGYELÉSE ===
  useEffect(() => {
    const updateLocalStorageErrors = () => {
      try {
        const stored = localStorage.getItem('protocol-errors');
        if (stored) {
          const parsedErrors = JSON.parse(stored);
          setLocalStorageErrors(Array.isArray(parsedErrors) ? parsedErrors : []);
        } else {
          setLocalStorageErrors([]);
        }
      } catch (error) {
        console.error('Error reading localStorage errors:', error);
        setLocalStorageErrors([]);
      }
    };

    // Initial load
    updateLocalStorageErrors();

    // Listen for custom events from measurement block
    const handleProtocolErrorAdded = () => {
      updateLocalStorageErrors();
    };

    // Listen for protocol errors cleared event (new protocol started)
    const handleProtocolErrorsCleared = () => {
      console.log('Protocol errors cleared - updating error list');
      setLocalStorageErrors([]);
    };

    window.addEventListener('protocol-error-added', handleProtocolErrorAdded);
    window.addEventListener('protocol-errors-cleared', handleProtocolErrorsCleared);
    
    return () => {
      window.removeEventListener('protocol-error-added', handleProtocolErrorAdded);
      window.removeEventListener('protocol-errors-cleared', handleProtocolErrorsCleared);
    };
  }, []);
  
  // === KÖZÖS LOGIKA: HIBÁK ÖSSZEFÉSÜLÉSE ===
  const allErrors = [...(Array.isArray(errors) ? errors : []), ...localStorageErrors];
  const safeErrors = Array.isArray(allErrors) ? allErrors : [];

  // === KÖZÖS LOGIKA: MODÁL KEZELŐ FÜGGVÉNYEK ===
  const handleAddError = (error: Omit<ProtocolError, 'id'>) => {
    onAddError(error);
    setShowModal(false);
  };

  const handleEditError = (error: Omit<ProtocolError, 'id'>) => {
    if (editingError) {
      onEditError(editingError.id, error);
      setEditingError(null);
    }
    setShowModal(false);
  };

  const startEdit = (error: ProtocolError) => {
    setEditingError(error);
    setShowModal(true);
  };

  // -------------------------
  // |    MODERN OTIS TÉMA   |
  // -------------------------
  if (theme === 'modern') {
    // --- Modern segédfüggvény ---
    const getSeverityConfig = (severity: ProtocolError['severity']) => {
      switch (severity) {
        case 'critical':
          return {
            gradient: 'from-red-500 to-rose-500',
            icon: AlertTriangle,
            text: t.critical,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
          };
        case 'medium':
          return {
            gradient: 'from-amber-500 to-orange-500',
            icon: AlertCircle,
            text: t.medium,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
          };
        case 'low':
          return {
            gradient: 'from-blue-500 to-sky-500',
            icon: Info,
            text: t.low,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
          };
        default:
          return {
            gradient: 'from-gray-500 to-slate-500',
            icon: Info,
            text: severity,
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
          };
      }
    };

    // --- Modern JSX ---
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
          
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      {t.errorList}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {safeErrors.length} {safeErrors.length === 1 ? 'hiba' : 'hibák'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModal(true)}
                  className="group relative overflow-hidden px-4 py-2 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>{t.addError}</span>
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </div>

              {/* Error List */}
              {safeErrors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">{t.noErrors}</p>
                  <p className="text-sm text-gray-500 mt-1">Minden rendben van! ✨</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {safeErrors.map((error) => {
                    const config = getSeverityConfig(error.severity);
                    const SeverityIcon = config.icon;
                    
                    return (
                      <div 
                        key={error.id} 
                        className={`group relative overflow-hidden rounded-xl border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Severity Badge */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${config.gradient} px-3 py-1.5 shadow-md`}>
                                  <div className="relative flex items-center gap-2 text-white">
                                    <SeverityIcon className="h-4 w-4" />
                                    <span className="text-sm font-bold">{config.text}</span>
                                  </div>
                                </div>
                                
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex-1">
                                  {error.title}
                                </h4>
                              </div>
                              
                              {/* Description */}
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                                {error.description}
                              </p>
                              
                              {/* Images */}
                              {error.images && error.images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {error.images.map((image, index) => (
                                    <div key={index} className="relative overflow-hidden rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <img
                                        src={image}
                                        alt={`Error ${index + 1}`}
                                        className="w-20 h-20 object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 ml-4">
                              {/* Edit Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  if (error.id.startsWith('boundary-')) {
                                    const toast = document.createElement('div');
                                    toast.innerHTML = `
                                      <div style="display:flex;align-items:center;gap:8px;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <line x1="12" y1="8" x2="12" y2="12"></line>
                                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        <span>Automatikus hibák nem szerkeszthetők!</span>
                                      </div>
                                    `;
                                    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(to right, #f59e0b, #d97706);color:white;padding:12px 20px;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
                                    document.body.appendChild(toast);
                                    setTimeout(() => document.body.removeChild(toast), 2500);
                                  } else {
                                    startEdit(error);
                                  }
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  if (error.id.startsWith('boundary-')) {
                                    const currentErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
                                    const filteredErrors = currentErrors.filter((e: any) => e.id !== error.id);
                                    localStorage.setItem('protocol-errors', JSON.stringify(filteredErrors));
                                    setLocalStorageErrors(filteredErrors);
                                    
                                    const toast = document.createElement('div');
                                    toast.innerHTML = `
                                      <div style="display:flex;align-items:center;gap:8px;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span>Hiba sikeresen törölve!</span>
                                      </div>
                                    `;
                                    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(to right, #ef4444, #dc2626);color:white;padding:12px 20px;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
                                    document.body.appendChild(toast);
                                    setTimeout(() => document.body.removeChild(toast), 2500);
                                  } else {
                                    onDeleteError(error.id);
                                  }
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AddErrorModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingError(null);
          }}
          onSave={editingError ? handleEditError : handleAddError}
          editingError={editingError}
        />
      </>
    );
  }

  // -------------------------
  // |     CLASSIC TÉMA      |
  // -------------------------

  // --- Classic segédfüggvények ---
  const getSeverityColor = (severity: ProtocolError['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: ProtocolError['severity']) => {
    switch (severity) {
      case 'critical':
        return t.critical;
      case 'medium':
        return t.medium;
      case 'low':
        return t.low;
      default:
        return severity;
    }
  };

  // --- Classic JSX ---
  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{t.errorList}</h2>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-otis-blue hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addError}
            </Button>
          </div>

          {safeErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>{t.noErrors}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeErrors.map((error) => (
                <div key={error.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="relative mr-3">
                          <Badge className={`${getSeverityColor(error.severity)} text-white px-2 py-1 text-sm font-medium relative`}>
                            {getSeverityText(error.severity)}
                          </Badge>
                          {error.severity === 'critical' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center text-xs font-bold transform rotate-180" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                              ⚠
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-800">{error.title}</h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{error.description}</p>
                      
                      {error.images && error.images.length > 0 && (
                        <div className="flex space-x-2">
                          {error.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt="Error documentation"
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-otis-blue"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Boundary errors (automatically generated) cannot be edited
                          if (error.id.startsWith('boundary-')) {
                            const toast = document.createElement('div');
                            toast.textContent = 'Automatikus hibák nem szerkeszthetők!';
                            toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-weight:500;';
                            document.body.appendChild(toast);
                            setTimeout(() => document.body.removeChild(toast), 2000);
                          } else {
                            startEdit(error);
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Check if this is a localStorage error (boundary errors have 'boundary-' prefix)
                          if (error.id.startsWith('boundary-')) {
                            console.log('🗑️ Deleting localStorage boundary error:', error.id);
                            
                            // Remove from localStorage directly without React state updates
                            const currentErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
                            const filteredErrors = currentErrors.filter((e: any) => e.id !== error.id);
                            localStorage.setItem('protocol-errors', JSON.stringify(filteredErrors));
                            
                            // Update local state without triggering parent re-renders
                            setLocalStorageErrors(filteredErrors);
                            
                            // Show confirmation toast
                            const toast = document.createElement('div');
                            toast.textContent = 'Hiba törölve a hibalistából!';
                            toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-weight:500;';
                            document.body.appendChild(toast);
                            setTimeout(() => document.body.removeChild(toast), 2000);
                          } else {
                            // Handle regular React state errors
                            onDeleteError(error.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddErrorModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingError(null);
        }}
        onSave={editingError ? handleEditError : handleAddError}
        editingError={editingError}
      />
    </>
  );
}


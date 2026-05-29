import { useState, useEffect } from 'react';
import { ProtocolError } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, AlertCircle, Info, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguageContext } from "@/components/language-context";
import { AddErrorModal } from '@/components/add-error-modal';
import { useTheme } from '@/contexts/theme-context';

interface ErrorListProps {
  errors: ProtocolError[];
  onAddError: (error: Omit<ProtocolError, 'id'>) => void;
  onEditError: (id: string, error: Omit<ProtocolError, 'id'>) => void;
  onDeleteError: (id: string) => void;
}

export function ErrorList({ errors = [], onAddError, onEditError, onDeleteError }: ErrorListProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editingError, setEditingError] = useState<ProtocolError | null>(null);
  const [localStorageErrors, setLocalStorageErrors] = useState<ProtocolError[]>([]);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

    updateLocalStorageErrors();

    const handleProtocolErrorAdded = () => { updateLocalStorageErrors(); };
    const handleProtocolErrorsCleared = () => { setLocalStorageErrors([]); };

    window.addEventListener('protocol-error-added', handleProtocolErrorAdded);
    window.addEventListener('protocol-errors-cleared', handleProtocolErrorsCleared);
    return () => {
      window.removeEventListener('protocol-error-added', handleProtocolErrorAdded);
      window.removeEventListener('protocol-errors-cleared', handleProtocolErrorsCleared);
    };
  }, []);

  const allErrors = [...(Array.isArray(errors) ? errors : []), ...localStorageErrors];
  const safeErrors = Array.isArray(allErrors) ? allErrors : [];

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

  const showAutoErrorToast = (message: string, color: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed;top:20px;right:20px;background:${color};color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-weight:500;`;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  const handleDeleteError = (error: ProtocolError) => {
    if (error.id.startsWith('boundary-')) {
      const currentErrors = JSON.parse(localStorage.getItem('protocol-errors') || '[]');
      const filteredErrors = currentErrors.filter((e: any) => e.id !== error.id);
      localStorage.setItem('protocol-errors', JSON.stringify(filteredErrors));
      setLocalStorageErrors(filteredErrors);
      showAutoErrorToast(t("errorDeletedFromList"), '#ef4444');
    } else {
      onDeleteError(error.id);
    }
  };

  const handleEditClick = (error: ProtocolError) => {
    if (error.id.startsWith('boundary-')) {
      showAutoErrorToast(t("autoErrorNotEditable"), '#f59e0b');
    } else {
      startEdit(error);
    }
  };

  const RepairStatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    const configs: Record<string, { cls: string; label: string }> = {
      done: { cls: 'bg-green-100 text-green-800 border-green-300', label: `✓ ${t("repairStatusDone")}` },
      in_progress: { cls: 'bg-blue-100 text-blue-800 border-blue-300', label: `⏳ ${t("repairStatusInProgress")}` },
      blocked: { cls: 'bg-red-100 text-red-800 border-red-300', label: `🚫 ${t("repairStatusBlocked")}` },
      pending: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: `⏰ ${t("repairStatusPending")}` },
    };
    const cfg = configs[status];
    if (!cfg) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border mb-2 ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  };

  // -------------------------
  // |    MODERN OTIS TÉMA   |
  // -------------------------
  if (theme === 'modern') {
    const getSeverityConfig = (severity: ProtocolError['severity']) => {
      switch (severity) {
        case 'critical': return { gradient: 'from-red-500 to-rose-500', icon: AlertTriangle, text: t("critical"), bgColor: 'bg-red-50', borderColor: 'border-red-200' };
        case 'medium': return { gradient: 'from-amber-500 to-orange-500', icon: AlertCircle, text: t("medium"), bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
        case 'low': return { gradient: 'from-blue-500 to-sky-500', icon: Info, text: t("low"), bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
        default: return { gradient: 'from-gray-500 to-slate-500', icon: Info, text: severity, bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
      }
    };

    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>

          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsListCollapsed(v => !v)}
                  className="flex items-center gap-3 flex-1 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      {t("errorList")}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {safeErrors.length} {safeErrors.length === 1 ? t("errorSingular") : t("errorPlural")}
                    </p>
                  </div>
                  {isListCollapsed
                    ? <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    : <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  }
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  className="group relative overflow-hidden px-4 py-2 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ml-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("addError")}</span>
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </div>

              {/* Collapsible Body */}
              {!isListCollapsed && (
                safeErrors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30"></div>
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium">{t("noErrors")}</p>
                    <p className="text-sm text-gray-500 mt-1">{t("allGood")} ✨</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safeErrors.map((error) => {
                      const config = getSeverityConfig(error.severity);
                      const SeverityIcon = config.icon;
                      const isExpanded = expandedCards.has(error.id);

                      return (
                        <div
                          key={error.id}
                          className={`group relative overflow-hidden rounded-xl border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
                        >
                          {/* Card Header — always visible */}
                          <div
                            className="p-4 flex items-center gap-3 cursor-pointer select-none"
                            onClick={() => toggleCard(error.id)}
                          >
                            <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${config.gradient} px-3 py-1.5 shadow-md flex-shrink-0`}>
                              <div className="relative flex items-center gap-2 text-white">
                                <SeverityIcon className="h-4 w-4" />
                                <span className="text-sm font-bold">{config.text}</span>
                              </div>
                            </div>

                            <h4 className="font-bold text-gray-800 dark:text-gray-200 flex-1 text-sm leading-snug">
                              {error.title}
                            </h4>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Edit & Delete always visible */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditClick(error); }}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteError(error); }}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {isExpanded
                                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                                : <ChevronDown className="h-4 w-4 text-gray-400" />
                              }
                            </div>
                          </div>

                          {/* Card Body — collapsible */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-current/10">
                              <RepairStatusBadge status={error.status} />
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed mt-2">
                                {error.description}
                              </p>
                              {error.technicianComment && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2 flex items-start gap-1">
                                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  {error.technicianComment}
                                </p>
                              )}
                              {error.images && error.images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {error.images.map((image, index) => (
                                    <div key={index} className="relative overflow-hidden rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <img src={image} alt={`Error ${index + 1}`} className="w-20 h-20 object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        <AddErrorModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingError(null); }}
          onSave={editingError ? handleEditError : handleAddError}
          editingError={editingError}
        />
      </>
    );
  }

  // -------------------------
  // |     CLASSIC TÉMA      |
  // -------------------------
  const getSeverityColor = (severity: ProtocolError['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: ProtocolError['severity']) => {
    switch (severity) {
      case 'critical': return t("critical");
      case 'medium': return t("medium");
      case 'low': return t("low");
      default: return severity;
    }
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsListCollapsed(v => !v)}
              className="flex items-center gap-2 flex-1 text-left group"
            >
              <h2 className="text-xl font-semibold text-gray-800">{t("errorList")}</h2>
              <span className="text-sm text-gray-500">({safeErrors.length})</span>
              {isListCollapsed
                ? <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                : <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              }
            </button>

            <Button
              onClick={() => setShowModal(true)}
              className="bg-otis-blue hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addError")}
            </Button>
          </div>

          {/* Collapsible Body */}
          {!isListCollapsed && (
            safeErrors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>{t("noErrors")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeErrors.map((error) => {
                  const isExpanded = expandedCards.has(error.id);
                  return (
                    <div key={error.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Card Header */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                        onClick={() => toggleCard(error.id)}
                      >
                        <div className="relative flex-shrink-0">
                          <Badge className={`${getSeverityColor(error.severity)} text-white px-2 py-1 text-xs font-medium`}>
                            {getSeverityText(error.severity)}
                          </Badge>
                          {error.severity === 'critical' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center text-xs font-bold transform rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                              ⚠
                            </div>
                          )}
                        </div>

                        <h4 className="font-medium text-gray-800 flex-1 text-sm">{error.title}</h4>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-otis-blue h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(error); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); handleDeleteError(error); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                        </div>
                      </div>

                      {/* Card Body — collapsible */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                          <RepairStatusBadge status={error.status} />
                          <p className="text-gray-600 text-sm mb-3">{error.description}</p>
                          {error.technicianComment && (
                            <p className="text-xs text-gray-500 italic mb-2">{error.technicianComment}</p>
                          )}
                          {error.images && error.images.length > 0 && (
                            <div className="flex space-x-2">
                              {error.images.map((image, index) => (
                                <img key={index} src={image} alt="Error documentation" className="w-16 h-16 object-cover rounded border" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <AddErrorModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingError(null); }}
        onSave={editingError ? handleEditError : handleAddError}
        editingError={editingError}
      />
    </>
  );
}

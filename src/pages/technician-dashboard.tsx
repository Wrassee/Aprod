// src/pages/technician-dashboard.tsx - Technikus modul
import { useState, useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useLanguageContext, type SupportedLanguage } from "@/components/language-context";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl, getAuthHeaders } from '@/lib/queryClient';
import {
  Wrench, ClipboardList, CheckCircle2, Clock, AlertTriangle, Ban, 
  ChevronDown, ChevronUp, Camera, MessageSquare, Loader2,
  CheckCheck, Sparkles, RefreshCw, LogOut
} from 'lucide-react';
import type { ProtocolError } from '@shared/schema';

const LANGUAGE_FLAGS: { code: SupportedLanguage; countryCode: string; label: string }[] = [
  { code: 'hu', countryCode: 'HU', label: 'Magyar' },
  { code: 'de', countryCode: 'DE', label: 'Deutsch' },
  { code: 'en', countryCode: 'GB', label: 'English' },
  { code: 'fr', countryCode: 'FR', label: 'Français' },
  { code: 'it', countryCode: 'IT', label: 'Italiano' },
];

interface Protocol {
  id: string;
  reception_date: string | null;
  language: string;
  errors: ProtocolError[];
  completed: boolean;
  created_at: string;
  assigned_technician_id: string | null;
  answers?: Record<string, any>;
  errorSummary?: {
    totalErrors: number;
    doneErrors: number;
    pendingErrors: number;
    blockedErrors: number;
  };
}

/** Visszaadja az Otis Lift-azonosítót (answers['7']) vagy fallback UUID-t */
function getLiftId(protocol: Protocol): string {
  const v = protocol.answers?.['7'];
  if (v && String(v).trim()) return String(v).trim();
  return '#' + protocol.id.slice(0, 8).toUpperCase();
}

interface RepairModalState {
  protocolId: string;
  error: ProtocolError;
}

interface TechnicianDashboardProps {
  onBack: () => void;
}

export function TechnicianDashboard({ onBack }: TechnicianDashboardProps) {
  const { t, language, setLanguage } = useLanguageContext();
  const { signOut, user } = useAuth();

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set());
  const [repairModal, setRepairModal] = useState<RepairModalState | null>(null);
  const [savingRepair, setSavingRepair] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Repair form state
  const [repairStatus, setRepairStatus] = useState<'pending' | 'in_progress' | 'done' | 'blocked'>('in_progress');
  const [repairComment, setRepairComment] = useState('');
  const [proofPhotoBase64, setProofPhotoBase64] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(getApiUrl('/api/technician/my-assignments'), { headers });
      if (!resp.ok) throw new Error('fetch failed');
      const data = await resp.json();
      setProtocols(Array.isArray(data) ? data : []);
    } catch {
      setProtocols([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const toggleProtocol = (id: string) => {
    setExpandedProtocols(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openRepairModal = (protocolId: string, error: ProtocolError) => {
    setRepairModal({ protocolId, error });
    setRepairStatus((error.status as any) || 'in_progress');
    setRepairComment(error.technicianComment || '');
    setProofPhotoBase64(error.proofPhotoUrl || '');
  };

  const closeRepairModal = () => {
    setRepairModal(null);
    setRepairComment('');
    setProofPhotoBase64('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProofPhotoBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveRepair = async () => {
    if (!repairModal) return;
    setSavingRepair(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(
        getApiUrl(`/api/technician/assignments/${repairModal.protocolId}/errors/${encodeURIComponent(repairModal.error.id)}`),
        {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: repairStatus,
            technicianComment: repairComment,
            proofPhotoUrl: proofPhotoBase64 || undefined,
          }),
        }
      );
      if (!resp.ok) throw new Error('save failed');
      showToast(t('repairSaved'), 'success');
      closeRepairModal();
      await fetchAssignments();
    } catch {
      showToast('Hiba a mentés során!', 'error');
    } finally {
      setSavingRepair(false);
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'done':
        return { label: t('repairStatusDone'), color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2, dot: 'bg-green-500' };
      case 'in_progress':
        return { label: t('repairStatusInProgress'), color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock, dot: 'bg-blue-500' };
      case 'blocked':
        return { label: t('repairStatusBlocked'), color: 'bg-red-100 text-red-800 border-red-300', icon: Ban, dot: 'bg-red-500' };
      default:
        return { label: t('repairStatusPending'), color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle, dot: 'bg-yellow-500' };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-semibold shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto">
          {/* Top row: icon + title + refresh + logout */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('technicianDashboard')}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={fetchAssignments} disabled={loading} title={t('refresh')}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title={t('Profile.logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-1 text-xs font-medium hidden sm:inline">{t('Profile.logout')}</span>
              </Button>
            </div>
          </div>
          {/* Language selector row */}
          <div className="flex items-center gap-1 flex-wrap">
            {LANGUAGE_FLAGS.map(({ code, countryCode, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                title={label}
                className={`px-1.5 py-0.5 rounded-lg transition-all border flex items-center gap-1 ${
                  language === code
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950 shadow-sm scale-105'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 opacity-50 hover:opacity-100'
                }`}
              >
                <ReactCountryFlag
                  countryCode={countryCode}
                  svg
                  style={{ width: '1.4em', height: '1.4em', borderRadius: '2px' }}
                  title={label}
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label.split(' ')[0].substring(0, 3)}</span>
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {protocols.length} {t('myAssignments').toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-500">{t('loading')}...</p>
          </div>
        ) : protocols.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCheck className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('noAssignments')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noAssignmentsDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          protocols.map((protocol) => {
            const errors: ProtocolError[] = Array.isArray(protocol.errors) ? protocol.errors : [];
            const isExpanded = expandedProtocols.has(protocol.id);
            const summary = protocol.errorSummary || { totalErrors: errors.length, doneErrors: 0, pendingErrors: errors.length, blockedErrors: 0 };
            const allDone = summary.doneErrors === summary.totalErrors && summary.totalErrors > 0;

            return (
              <Card key={protocol.id} className={`bg-white dark:bg-gray-900 border-0 shadow-lg overflow-hidden transition-all ${allDone ? 'ring-2 ring-green-400' : ''}`}>
                {/* Protocol Header */}
                <button
                  className="w-full text-left"
                  onClick={() => toggleProtocol(protocol.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ClipboardList className="h-4 w-4 text-orange-500" />
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                            {getLiftId(protocol)}
                          </CardTitle>
                          {allDone && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('allErrorsDone')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {protocol.reception_date || protocol.created_at?.slice(0, 10)}
                        </p>
                        {/* Error Summary Pills */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full font-medium text-gray-700 dark:text-gray-300">
                            {summary.totalErrors} {summary.totalErrors === 1 ? t('errorSingular') : t('errorPlural')}
                          </span>
                          {summary.doneErrors > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              ✓ {summary.doneErrors} {t('repairStatusDone').toLowerCase()}
                            </span>
                          )}
                          {summary.pendingErrors > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                              {summary.pendingErrors} {t('repairStatusPending').toLowerCase()}
                            </span>
                          )}
                          {summary.blockedErrors > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                              {summary.blockedErrors} {t('repairStatusBlocked').toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 text-gray-400">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded Error List */}
                {isExpanded && errors.length > 0 && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />
                    {errors.map((error) => {
                      const statusCfg = getStatusConfig(error.status);
                      const StatusIcon = statusCfg.icon;

                      return (
                        <div
                          key={error.id}
                          className={`rounded-xl border p-4 transition-all ${error.status === 'done' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Severity + Status row */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(error.severity)}`}>
                                  {t(error.severity as any)}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                  {statusCfg.label}
                                </span>
                              </div>

                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{error.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-2">{error.description}</p>

                              {/* Original photos */}
                              {error.images && error.images.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {error.images.map((img, i) => (
                                    <img key={i} src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                                  ))}
                                </div>
                              )}

                              {/* Technician repair info */}
                              {error.technicianComment && (
                                <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="italic">{error.technicianComment}</span>
                                </div>
                              )}
                              {error.proofPhotoUrl && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Camera className="h-3 w-3" /> {t('proofPhoto')}
                                  </p>
                                  <img src={error.proofPhotoUrl} alt="proof" className="w-24 h-24 object-cover rounded-lg border border-green-300 shadow-sm" />
                                </div>
                              )}
                              {error.completionDate && error.status === 'done' && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                  ✓ {new Date(error.completionDate).toLocaleString()}
                                </p>
                              )}
                            </div>

                            {/* Document Repair Button */}
                            <div className="flex-shrink-0">
                              <Button
                                size="sm"
                                onClick={() => openRepairModal(protocol.id, error)}
                                className={`text-xs font-semibold shadow-sm ${error.status === 'done' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                {error.status === 'done' ? t('errorRepaired') : t('documentRepair')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Repair Documentation Modal */}
      {repairModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            {/* Modal Header — always visible */}
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-4 flex items-center justify-between sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-white" />
                <span className="text-white font-bold text-base">{t('documentRepair')}</span>
              </div>
              <button onClick={closeRepairModal} className="text-white/80 hover:text-white text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">×</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Error info */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">{t('errorTitle')}</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{repairModal.error.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{repairModal.error.description}</p>
              </div>

              {/* Status selection */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('repairStatus')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'in_progress', 'done', 'blocked'] as const).map((s) => {
                    const cfg = getStatusConfig(s);
                    const StatusIcon = cfg.icon;
                    return (
                      <button
                        key={s}
                        onClick={() => setRepairStatus(s)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${repairStatus === s ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                      >
                        <StatusIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {t('repairComment')}
                </label>
                <textarea
                  value={repairComment}
                  onChange={(e) => setRepairComment(e.target.value)}
                  placeholder={t('repairCommentPlaceholder')}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* Proof Photo */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  {t('proofPhoto')}
                </label>
                {proofPhotoBase64 ? (
                  <div className="relative inline-block">
                    <img src={proofPhotoBase64} alt="proof" className="w-32 h-32 object-cover rounded-xl border-2 border-orange-300 shadow" />
                    <button
                      onClick={() => setProofPhotoBase64('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-4 flex items-center justify-center gap-3 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-sm font-medium">{t('uploadPhotos')}</span>
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            {/* Modal Footer — always visible */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-900">
              <Button variant="outline" onClick={closeRepairModal} className="flex-1">
                {t('cancel')}
              </Button>
              <Button
                onClick={saveRepair}
                disabled={savingRepair}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {savingRepair ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('saving')}</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> {t('saveRepair')}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TechnicianDashboard;

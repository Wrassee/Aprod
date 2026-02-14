// src/components/audit-log-table.tsx - ROBUSZTUS VERZIÓ
import React, { useState, useEffect } from 'react';
import { useLanguageContext } from "@/components/language-context";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Loader2, 
  AlertCircle, 
  User, 
  FileSpreadsheet, 
  Trash2, 
  Upload, 
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// 🔥 ROBUSZTUS URL KEZELÉS
const getApiBaseUrl = (): string => {
  let url = import.meta.env.VITE_API_URL || "";

  // Ha üres, próbáljuk meg a window.location-ből kinyerni
  if (!url && typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    url = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    console.warn('⚠️ VITE_API_URL nincs beállítva, használom:', url);
  }

  return url.replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure';
  error_message: string | null;
  created_at: string;
  user?: {
    email: string;
    name: string | null;
  };
}
export function AuditLogTable() {
  const { t, language } = useLanguageContext();
  const { toast } = useToast();
  const { supabase, initialized } = useAuth();
  const { theme } = useTheme();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('🔍 AuditLogTable mounted, initialized:', initialized);
    if (!initialized) return;

    if (supabase) {
      fetchLogs();
    }
  }, [supabase, limit, initialized]);

  const fetchLogs = async (isRetry = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📜 ========================================');
      console.log('📜 Audit Log lekérése indult...');
      console.log('📜 API_BASE_URL:', API_BASE_URL);
      console.log('📜 Retry attempt:', retryCount);
      console.log('📜 ========================================');

      // 1️⃣ SUPABASE ELLENŐRZÉS
      if (!supabase) {
        throw new Error("❌ Supabase kliens nem érhető el");
      }

      // 2️⃣ SESSION LEKÉRÉS
      console.log('🔐 Session lekérése...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error(`Session hiba: ${sessionError.message}`);
      }

      if (!session) {
        console.error('❌ Nincs aktív session');

        // Próbáljuk meg újra betölteni a sessiont
        if (!isRetry && retryCount < 2) {
          console.log('🔄 Újrapróbálkozás session refresh-sel...');
          setRetryCount(prev => prev + 1);
          await supabase.auth.refreshSession();
          await fetchLogs(true);
          return;
        }

        throw new Error('Nincs aktív munkamenet. Kérlek jelentkezz be újra.');
      }

      console.log('✅ Session OK, user:', session.user?.email);
      console.log('🔑 Access token hossza:', session.access_token?.length || 0);

      // 3️⃣ URL ÖSSZEÁLLÍTÁS
      const endpoint = `/api/admin/audit-logs?limit=${limit}`;
      const fullUrl = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

      console.log('📤 Teljes URL:', fullUrl);
      console.log('📤 Headers:', {
        'Authorization': `Bearer ${session.access_token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });

      // 4️⃣ API HÍVÁS
      console.log('🌐 Fetch indítása...');
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      // 5️⃣ CONTENT TYPE ELLENŐRZÉS
      const contentType = response.headers.get("content-type");
      console.log('📄 Content-Type:', contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ NEM JSON VÁLASZ:");
        console.error("Preview:", text.substring(0, 500));

        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error(
            `A szerver HTML-t küldött JSON helyett. ` +
            `Ellenőrizd, hogy a backend fut-e a következő címen: ${API_BASE_URL}`
          );
        }

        throw new Error(
          `A szerver nem JSON választ küldött (Content-Type: ${contentType}). ` +
          `Válasz: ${text.substring(0, 200)}`
        );
      }

      // 6️⃣ STATUS ELLENŐRZÉS
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          console.error('❌ Szerver hiba részletei:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('❌ Nem sikerült a hiba JSON parse-olása');
          const text = await response.text();
          console.error('Raw error:', text);
          errorMessage = text || errorMessage;
        }

        // Session lejárt esetén próbáljuk újra
        if (response.status === 401 && !isRetry && retryCount < 2) {
          console.log('🔄 401 - Session refresh és újrapróbálás...');
          setRetryCount(prev => prev + 1);
          await supabase.auth.refreshSession();
          await fetchLogs(true);
          return;
        }

        throw new Error(errorMessage);
      }

      // 7️⃣ SIKERES VÁLASZ FELDOLGOZÁSA
      const data = await response.json();
      console.log('✅ ========================================');
      console.log('✅ SIKERES LEKÉRÉS');
      console.log('✅ Betöltött logok száma:', data.length);
      console.log('✅ Első log:', data[0]);
      console.log('✅ ========================================');

      setLogs(data);
      setRetryCount(0);

    } catch (error: any) {
      console.error('❌ ========================================');
      console.error('❌ HIBA AZ AUDIT LOGOK LEKÉRÉSEKOR');
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ ========================================');

      setError(error.message);

      toast({
        title: "❌ " + t("error"),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper funkciók
  const getActionIcon = (action: string) => {
    if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('upload')) return <Upload className="h-4 w-4" />;
    if (action.includes('download')) return <Download className="h-4 w-4" />;
    if (action.includes('user')) return <User className="h-4 w-4" />;
    if (action.includes('template')) return <FileSpreadsheet className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('create') || action.includes('upload')) return 'text-green-600';
    if (action.includes('update') || action.includes('activate')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getActionLabel = (action: string) => {
    const translations: Record<string, { hu: string; de: string }> = {
      'user.create': { hu: 'Felhasználó létrehozva', de: 'Benutzer erstellt' },
      'user.update': { hu: 'Felhasználó frissítve', de: 'Benutzer aktualisiert' },
      'user.delete': { hu: 'Felhasználó törölve', de: 'Benutzer gelöscht' },
      'user.role_change': { hu: 'Jogosultság módosítva', de: 'Rolle geändert' },
      'template.upload': { hu: 'Sablon feltöltve', de: 'Vorlage hochgeladen' },
      'template.activate': { hu: 'Sablon aktiválva', de: 'Vorlage aktiviert' },
      'template.deactivate': { hu: 'Sablon deaktiválva', de: 'Vorlage deaktiviert' },
      'template.delete': { hu: 'Sablon törölve', de: 'Vorlage gelöscht' },
      'template.download': { hu: 'Sablon letöltve', de: 'Vorlage heruntergeladen' },
      'protocol.create': { hu: 'Protokoll létrehozva', de: 'Protokoll erstellt' },
      'protocol.update': { hu: 'Protokoll frissítve', de: 'Protokoll aktualisiert' },
      'protocol.delete': { hu: 'Protokoll törölve', de: 'Protokoll gelöscht' },
      'admin.login': { hu: 'Admin bejelentkezés', de: 'Admin-Anmeldung' },
      'settings.update': { hu: 'Beállítások frissítve', de: 'Einstellungen aktualisiert' },
    };

    const translation = translations[action];
    if (translation) {
      return language === 'de' ? translation.de : translation.hu;
    }
    return action;
  };
  // ========================================
  // MODERN THEME - Loading
  // ========================================
  if (loading && theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />

        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                {t("Admin.AuditLog.title")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center items-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-30 animate-pulse" />
                <Loader2 className="relative h-12 w-12 animate-spin text-purple-600" />
              </div>
              <p className="mt-4 text-gray-600">
                {t("loading")}...
              </p>
              {retryCount > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Újrapróbálás... ({retryCount}/2)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Loading
  // ========================================
  if (loading && theme === 'classic') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {t("Admin.AuditLog.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-sm text-gray-600">{t("loading")}...</p>
            {retryCount > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Újrapróbálás... ({retryCount}/2)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error && logs.length === 0) {
    const ErrorContent = () => (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-20 animate-pulse" />
          <AlertTriangle className="relative h-16 w-16 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-red-600 mb-2">
          {t("error")}
        </p>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {error}
        </p>
        <Button
          onClick={() => fetchLogs()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Újrapróbálás
        </Button>

        {/* Debug info */}
        <details className="mt-6 text-xs text-gray-500 max-w-2xl">
          <summary className="cursor-pointer hover:text-gray-700">
            🔍 Debug információk
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg font-mono space-y-1">
            <div>API URL: {API_BASE_URL || '(nincs beállítva)'}</div>
            <div>Endpoint: /api/admin/audit-logs</div>
            <div>Retry count: {retryCount}</div>
            <div>Initialized: {initialized ? 'Igen' : 'Nem'}</div>
            <div>Has Supabase: {supabase ? 'Igen' : 'Nem'}</div>
          </div>
        </details>
      </div>
    );

    if (theme === 'modern') {
      return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-pink-400 p-1 shadow-xl">
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shadow-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                  {t("Admin.AuditLog.title")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorContent />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {t("Admin.AuditLog.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorContent />
        </CardContent>
      </Card>
    );
  }

  // ========================================
  // MODERN THEME - Empty
  // ========================================
  if (logs.length === 0 && theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />

        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                {t("Admin.AuditLog.title")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gray-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <AlertCircle className="relative h-16 w-16 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                {t("Admin.AuditLog.noLogs") || "Nincsenek naplóbejegyzések"}
              </p>
              <Button
                onClick={() => fetchLogs()}
                variant="outline"
                className="mt-4 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Frissítés
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Empty
  // ========================================
  if (logs.length === 0 && theme === 'classic') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {t("Admin.AuditLog.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p>{t("Admin.AuditLog.noLogs") || "Nincsenek naplóbejegyzések"}</p>
            <Button
              onClick={() => fetchLogs()}
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Frissítés
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  // ========================================
  // MODERN THEME - Normal View
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />

        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                    {t("Admin.AuditLog.title")}
                  </span>
                  <Sparkles className="h-5 w-5 text-fuchsia-500 animate-pulse" />
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-base mt-2">
                  {t("Admin.AuditLog.description")}
                  {' • '}
                  <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0 px-3 py-1">
                    {logs.length} {t("Admin.AuditLog.entries") || "bejegyzés"}
                  </Badge>
                </CardDescription>
              </div>

              <button
                onClick={() => fetchLogs()}
                disabled={loading}
                className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                  <span className="font-semibold">{t("Admin.AuditLog.refresh") || "Frissítés"}</span>
                </div>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/20 dark:via-fuchsia-950/20 dark:to-pink-950/20">
                      <TableHead className="w-[50px] font-bold text-gray-700">
                        {t("Admin.AuditLog.table.status") || "Státusz"}
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          {t("Admin.AuditLog.table.action") || "Művelet"}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-600" />
                          {t("Admin.AuditLog.table.user") || "Felhasználó"}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        {t("Admin.AuditLog.table.resource") || "Erőforrás"}
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        {t("Admin.AuditLog.table.details") || "Részletek"}
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          {t("Admin.AuditLog.table.time") || "Időpont"}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow 
                        key={log.id}
                        className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:via-transparent hover:to-fuchsia-50/50 transition-all border-l-4 border-l-transparent hover:border-l-purple-500"
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {log.status === 'success' ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-30" />
                                <CheckCircle className="relative h-5 w-5 text-green-600" />
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-30" />
                                <XCircle className="relative h-5 w-5 text-red-600" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${
                              log.action.includes('delete') ? 'bg-red-100' :
                              log.action.includes('create') || log.action.includes('upload') ? 'bg-green-100' :
                              log.action.includes('update') ? 'bg-blue-100' :
                              'bg-gray-100'
                            } flex items-center justify-center`}>
                              <span className={getActionColor(log.action)}>
                                {getActionIcon(log.action)}
                              </span>
                            </div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {getActionLabel(log.action)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {log.user?.name || log.user_email || 'Ismeretlen'}
                            </span>
                            {log.user?.email && log.user.email !== log.user.name && (
                              <span className="text-xs text-gray-500">{log.user.email}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {log.resource_type && (
                            <div className="flex flex-col gap-1">
                              <Badge className="w-fit bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0 px-2 py-0.5 text-xs">
                                {log.resource_type}
                              </Badge>
                              {log.resource_id && (
                                <span className="text-xs text-gray-500 font-mono">
                                  {log.resource_id.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px] space-y-1">
                            {log.details?.template_name && (
                              <div className="flex items-center gap-1">
                                <FileSpreadsheet className="h-3 w-3 text-purple-600" />
                                <span className="truncate">{log.details.template_name}</span>
                              </div>
                            )}
                            {log.details?.file_name && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Upload className="h-3 w-3" />
                                <span className="truncate">{log.details.file_name}</span>
                              </div>
                            )}
                            {log.error_message && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                <span className="truncate">{log.error_message}</span>
                              </div>
                            )}
                            {log.ip_address && (
                              <div className="text-gray-400 font-mono">
                                🌐 {log.ip_address}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {(() => {
                            try {
                              const date = new Date(log.created_at);
                              if (isNaN(date.getTime())) {
                                return '-';
                              }
                              return formatDate(date, language);
                            } catch {
                              return '-';
                            }
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // ========================================
    // CLASSIC THEME - Normal View
    // ========================================
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                {t("Admin.AuditLog.title")}
              </CardTitle>
              <CardDescription className="mt-2">
                {t("Admin.AuditLog.description")}
                {' • '}
                <span className="font-semibold">{logs.length}</span>
                {' '}
                {t("Admin.AuditLog.entries") || "bejegyzés"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t("Admin.AuditLog.refresh") || "Frissítés"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      {t("Admin.AuditLog.table.status") || "Státusz"}
                    </TableHead>
                    <TableHead>
                      {t("Admin.AuditLog.table.action") || "Művelet"}
                    </TableHead>
                    <TableHead>
                      {t("Admin.AuditLog.table.user") || "Felhasználó"}
                    </TableHead>
                    <TableHead>
                      {t("Admin.AuditLog.table.resource") || "Erőforrás"}
                    </TableHead>
                    <TableHead>
                      {t("Admin.AuditLog.table.details") || "Részletek"}
                    </TableHead>
                    <TableHead>
                      {t("Admin.AuditLog.table.time") || "Időpont"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getActionColor(log.action)}>
                            {getActionIcon(log.action)}
                          </span>
                          <span className="font-medium text-sm">
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {log.user?.name || log.user_email || 'Ismeretlen'}
                          </span>
                          {log.user?.email && log.user.email !== log.user.name && (
                            <span className="text-xs text-gray-500">{log.user.email}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {log.resource_type && (
                          <div className="flex flex-col">
                            <Badge variant="outline" className="w-fit">
                              {log.resource_type}
                            </Badge>
                            {log.resource_id && (
                              <span className="text-xs text-gray-500 mt-1 font-mono">
                                {log.resource_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-gray-600 max-w-[200px]">
                          {log.details?.template_name && (
                            <div>📄 {log.details.template_name}</div>
                          )}
                          {log.details?.file_name && (
                            <div className="text-gray-500">📎 {log.details.file_name}</div>
                          )}
                          {log.error_message && (
                            <div className="text-red-600">⚠️ {log.error_message}</div>
                          )}
                          {log.ip_address && (
                            <div className="text-gray-400 mt-1">🌐 {log.ip_address}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">
                        {(() => {
                          try {
                            const date = new Date(log.created_at);
                            if (isNaN(date.getTime())) {
                              return '-';
                            }
                            return formatDate(date, language);
                          } catch {
                            return '-';
                          }
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    );
  }

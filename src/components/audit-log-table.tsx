// src/components/audit-log-table.tsx
import React, { useState, useEffect } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
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
  Clock
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
// --- JAVÍTÁS: IMPORTÁLJUK A useAuth HOOK-OT ---
import { useAuth } from '@/contexts/auth-context';

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
  // --- JAVÍTÁS: HASZNÁLJUK A useAuth HOOK-OT ---
  const { supabase } = useAuth();
  
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  // --- JAVÍTÁS: A useEffect FÜGG A supabase KLIENSTŐL ---
  useEffect(() => {
    if (supabase) {
      fetchLogs();
    }
  }, [supabase, limit]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      console.log('📜 Fetching audit logs...');
      
      // --- JAVÍTÁS: A BIZTONSÁGOS supabase KLIENST HASZNÁLJUK ---
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/audit-logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} audit log entries`);
      setLogs(data);
    } catch (error: any) {
      console.error('❌ Error fetching audit logs:', error);
      toast({
        title: t.error || 'Hiba',
        description: error.message || 'A naplók betöltése sikertelen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Loading állapot - MODERNIZÁLT
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                {t.Admin?.AuditLog?.title || 'Tevékenység napló'}
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
                {language === 'hu' ? 'Naplók betöltése...' : 'Loading logs...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Üres állapot - MODERNIZÁLT
  if (logs.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                {t.Admin?.AuditLog?.title || 'Tevékenység napló'}
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
                {t.Admin?.AuditLog?.noLogs || 'Nincs még naplóbejegyzés.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normál megjelenítés - MODERNIZÁLT
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
                  {t.Admin?.AuditLog?.title || 'Tevékenység napló'}
                </span>
                <Sparkles className="h-5 w-5 text-fuchsia-500 animate-pulse" />
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-base mt-2">
                {t.Admin?.AuditLog?.description || 'Összes adminisztrátori művelet nyomon követése'}
                {' • '}
                <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0 px-3 py-1">
                  {logs.length} {t.Admin?.AuditLog?.entries || 'bejegyzés'}
                </Badge>
              </CardDescription>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                <span className="font-semibold">{t.Admin?.AuditLog?.refresh || 'Frissítés'}</span>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/20 dark:via-fuchsia-950/20 dark:to-pink-950/20 hover:bg-gradient-to-r hover:from-purple-50 hover:via-fuchsia-50 hover:to-pink-50">
                    <TableHead className="w-[50px] font-bold text-gray-700">
                      {t.Admin?.AuditLog?.table?.status || 'Státusz'}
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        {t.Admin?.AuditLog?.table?.action || 'Művelet'}
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        {t.Admin?.AuditLog?.table?.user || 'Felhasználó'}
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      {t.Admin?.AuditLog?.table?.resource || 'Erőforrás'}
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      {t.Admin?.AuditLog?.table?.details || 'Részletek'}
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        {t.Admin?.AuditLog?.table?.time || 'Időpont'}
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
                      {/* Státusz */}
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
                      
                      {/* Művelet */}
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
                      
                      {/* Felhasználó */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {log.user?.name || log.user_email || 'Ismeretlen'}
                          </span>
                          {log.user?.email && (
                            <span className="text-xs text-gray-500">{log.user.email}</span>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Erőforrás */}
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
                      
                      {/* Részletek */}
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
                      
                      {/* Időpont */}
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
// src/components/protocol-list.tsx - JAVÍTOTT (API URL Fix)
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, FileText, AlertCircle, Calendar, CheckCircle, 
  Download, Eye, Trash2, RefreshCw, Sparkles, Wrench 
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// 🔥 FONTOS: IDE ÍRD BE A BACKEND SZERVERED CÍMÉT!
// Ha Render-en van: "https://te-projekt-neved.onrender.com"
// Ha lokálisan teszteled WiFi-n: "http://192.168.0.XX:5000"
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface Protocol {
  id: string;
  protocol_number?: string | null;
  created_at: string;
  status?: string | null;
  user_id?: string;
  assigned_technician_id?: string | null;
  answers?: Record<string, any>;
}

/** Visszaadja a lift azonosítót (answers['7']) vagy fallback UUID-t */
function getLiftId(protocol: Protocol): string {
  const fromAnswers = protocol.answers?.['7'];
  if (fromAnswers && String(fromAnswers).trim()) return String(fromAnswers).trim();
  return protocol.protocol_number || protocol.id.substring(0, 8);
}

interface Technician {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface ProtocolsResponse {
  items: Protocol[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export function ProtocolList() {
  const { supabase, role } = useAuth();
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    console.log('📋 ProtocolList useEffect triggered');
    if (supabase && role) {
      console.log(`✅ Supabase & Role (${role}) available, fetching protocols...`);
      fetchProtocols();
    } else {
      console.log('⚠️ Waiting for supabase and/or role...');
    }
  }, [supabase, role, currentPage]);

  const fetchProtocols = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📤 Getting auth headers...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      // 🔥 JAVÍTÁS ITT: API_BASE_URL használata
      const path = role === 'admin' 
        ? `/api/admin/protocols?page=${currentPage}&limit=50`
        : `/api/protocols?page=${currentPage}&limit=50`;
      
      const endpoint = `${API_BASE_URL}${path}`;

      console.log(`📤 Fetching from: ${endpoint} (Role: ${role})`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('📥 Response status:', response.status);

      // 🔥 JAVÍTÁS: Ellenőrzés, hogy HTML jött-e vissza
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        const text = await response.text();
        console.error("❌ Nem JSON válasz érkezett:", text.substring(0, 200));
        throw new Error("A szerver HTML-t küldött JSON helyett. Ellenőrizd az API URL-t!");
      }

      if (!response.ok) {
        throw new Error('Failed to fetch protocols');
      }
      
      const data: ProtocolsResponse = await response.json();
      console.log('✅ Protocols fetched:', data.items.length, 'items');
      
      setProtocols(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      console.error('❌ Error fetching protocols:', err);
      setError(err.message || t("protocolFetchError"));
      toast({
        title: t("error") || 'Hiba',
        description: err.message || t("protocolFetchError"),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (protocolId: string, protocolNumber?: string) => {
    const displayName = protocolNumber || protocolId.substring(0, 8);
    
    // 💡 FONTOS: Az `confirm` hívás helyett egyedi modális ablakra lesz szükség
    // A `window.confirm` nem működik megbízhatóan beágyazott környezetben.
    // Egyelőre `true`-ra állítjuk a teszteléshez, de ezt cserélni kell!
    const userConfirmed = window.confirm(`Biztosan törölni szeretnéd ezt a protokollt?\n${displayName}`);
    
    if (!userConfirmed) {
      return;
    }

    setDeletingId(protocolId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      // 🔥 JAVÍTÁS ITT IS: API_BASE_URL
      const deletePath = role === 'admin'
        ? `/api/admin/protocols/${protocolId}`
        : `/api/protocols/${protocolId}`;
        
      const deleteEndpoint = `${API_BASE_URL}${deletePath}`;

      console.log(`📤 Deleting from: ${deleteEndpoint} (Role: ${role})`);

      const response = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast({
        title: t("success") || 'Siker',
        description: t("protocolDeletedSuccess"),
      });

      // Frissítjük a listát
      fetchProtocols();
    } catch (err: any) {
      console.error('Error deleting protocol:', err);
      toast({
        title: t("error") || 'Hiba',
        description: err.message || t("protocolDeleteError"),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Technikusok betöltése (csak admin számára)
  useEffect(() => {
    if (role === 'admin' && supabase) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const resp = await fetch(`${API_BASE_URL}/api/technician/technicians`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (resp.ok) {
            const data = await resp.json();
            setTechnicians(Array.isArray(data) ? data : []);
          }
        } catch {
          // Silent - technikusok listája nem kritikus
        }
      })();
    }
  }, [role, supabase]);

  const handleAssignTechnician = async (protocolId: string, technicianId: string) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setAssigningId(protocolId);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/technician/assign/${protocolId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technicianId: technicianId || null }),
      });
      if (!resp.ok) throw new Error('Hozzárendelés sikertelen');
      
      setProtocols(prev => prev.map(p => 
        p.id === protocolId ? { ...p, assigned_technician_id: technicianId || null } : p
      ));
      toast({ title: t("success"), description: t("technicianAssigned") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: 'destructive' });
    } finally {
      setAssigningId(null);
    }
  };

  // ========================================
  // MODERN THEME - Loading
  // ========================================
  if (loading && theme === 'modern') {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative h-16 w-16 animate-spin text-blue-600" />
        </div>
        <p className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          {t("loadingProtocols")}
        </p>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Loading
  // ========================================
  if (loading && theme === 'classic') {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ========================================
  // Error State
  // ========================================
  if (error) {
    return (
      <Card className={theme === 'modern' 
        ? "relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-500 to-pink-400 p-1 shadow-xl"
        : "border-red-500 bg-red-50/50"
      }>
        <Card className={theme === 'modern' ? "relative bg-white dark:bg-gray-900 border-0 rounded-2xl" : ""}>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-700">{error}</p>
            <Button 
              onClick={fetchProtocols} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </Card>
    );
  }

  // ========================================
  // MODERN THEME - Protocol List
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent flex items-center gap-2">
                    {t("Admin")?.tabs?.protocols || 'Protokollok'}
                    <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("protocolListDescription")}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {totalCount} {t("pieces")}
                </Badge>
                <Button 
                  onClick={fetchProtocols} 
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {protocols.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gray-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                  <FileText className="relative h-16 w-16 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">
                  {t("noProtocolsYet")}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20">
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          {t("protocolNumber")}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {t("createdAt")}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">{t("status")}</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {protocols.map((protocol) => (
                      <TableRow
                        key={protocol.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-transparent hover:to-cyan-50/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                      >
                        <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getLiftId(protocol)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(new Date(protocol.created_at), language)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1 shadow-md">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {protocol.status || t("completed")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {role === 'admin' && technicians.length > 0 && (
                              assigningId === protocol.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Wrench className="h-3 w-3 text-orange-500" />
                                  <select
                                    className="text-xs bg-orange-50 border border-orange-200 rounded px-1 py-0.5 cursor-pointer max-w-28"
                                    value={protocol.assigned_technician_id || ''}
                                    onChange={(e) => handleAssignTechnician(protocol.id, e.target.value)}
                                    title={t("assignTechnician")}
                                  >
                                    <option value="">—</option>
                                    {technicians.map(tech => (
                                      <option key={tech.user_id} value={tech.user_id}>
                                        {tech.full_name || tech.email}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDelete(protocol.id, getLiftId(protocol))}
                              disabled={deletingId === protocol.id}
                            >
                              {deletingId === protocol.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Protocol List
  // ========================================
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {t("Admin")?.tabs?.protocols || 'Protokollok'}
            </CardTitle>
            <CardDescription className="mt-2">
              {t("protocolListDescription")}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {totalCount} {t("pieces")}
            </Badge>
            <Button 
              onClick={fetchProtocols} 
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {protocols.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">
              {t("noProtocolsYet")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("protocolNumber")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocols.map((protocol) => (
                  <TableRow key={protocol.id}>
                    <TableCell className="font-mono text-sm">
                      {getLiftId(protocol)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(new Date(protocol.created_at), language)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        {protocol.status || t("completed")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {role === 'admin' && technicians.length > 0 && (
                          assigningId === protocol.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                          ) : (
                            <select
                              className="text-xs bg-gray-100 border border-gray-200 rounded px-1 py-0.5 cursor-pointer max-w-28"
                              value={protocol.assigned_technician_id || ''}
                              onChange={(e) => handleAssignTechnician(protocol.id, e.target.value)}
                              title={t("assignTechnician")}
                            >
                              <option value="">—</option>
                              {technicians.map(tech => (
                                <option key={tech.user_id} value={tech.user_id}>
                                  {tech.full_name || tech.email}
                                </option>
                              ))}
                            </select>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDelete(protocol.id, getLiftId(protocol))}
                          disabled={deletingId === protocol.id}
                        >
                          {deletingId === protocol.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
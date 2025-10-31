// src/components/admin-dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import { Users, FileSpreadsheet, FileText, Loader2, TrendingUp, Activity, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// --- JAVÍTÁS: Pontosabb TypeScript típusok ---
interface Protocol {
  id: string;
  protocol_number?: string | null;
  created_at: string;
  status?: string | null;
}

interface DashboardStats {
  users: {
    total: number;
  };
  protocols: {
    total: number;
    recent: Protocol[]; // any[] helyett konkrét típus
  };
  templates: {
    total: number;
    active: number;
  };
}

export function AdminDashboard() {
  const { supabase } = useAuth();
  const { t, language } = useLanguageContext();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) {
      fetchStats();
    }
  }, [supabase]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching dashboard statistics...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      console.log('✅ Dashboard stats loaded:', data);
      setStats(data);
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error);
      toast({
        title: t.error || 'Hiba',
        description: error.message || 'A statisztikák betöltése sikertelen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading állapot - MODERNIZÁLT
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative h-16 w-16 animate-spin text-blue-600" />
        </div>
        <p className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          {language === 'hu' ? 'Statisztikák betöltése...' : 'Loading statistics...'}
        </p>
      </div>
    );
  }

  // Nincs adat - MODERNIZÁLT
  if (!stats) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Activity className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-center text-lg font-medium text-gray-600">
                {t.Admin?.Dashboard?.noData || 'Nem sikerült betölteni a statisztikákat'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statisztikai kártyák - MODERNIZÁLT */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* --- JAVÍTÁS: iconClassName -> iconColor --- */}
        <StatsCard
          title={t.Admin?.Dashboard?.totalUsers || 'Összes felhasználó'}
          value={stats.users.total}
          icon={Users}
          description={t.Admin?.Dashboard?.registeredUsers || 'Regisztrált felhasználók száma'}
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title={t.Admin?.Dashboard?.totalProtocols || 'Összes protokoll'}
          value={stats.protocols.total}
          icon={FileText}
          description={t.Admin?.Dashboard?.completedProtocols || 'Létrehozott protokollok'}
          iconColor="text-green-600"
        />
        
        <StatsCard
          title={t.Admin?.Dashboard?.totalTemplates || 'Sablonok'}
          value={stats.templates.total}
          icon={FileSpreadsheet}
          description={t.Admin?.Dashboard?.uploadedTemplates || 'Feltöltött sablonok'}
          iconColor="text-purple-600"
        />
      </div>

      {/* Aktivitás összefoglaló - MODERNIZÁLT */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                  {t.Admin?.Dashboard?.systemActivity || 'Rendszer aktivitás'}
                  <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.Admin?.Dashboard?.activityDesc || 'Gyors áttekintés a rendszer működéséről'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Aktív felhasználók */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 p-6 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {t.Admin?.Dashboard?.activeUsers || 'Aktív felhasználók'}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                      {stats.users.total}
                    </p>
                  </div>
                </div>
              </div>

              {/* Friss protokollok */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {t.Admin?.Dashboard?.recentProtocols || 'Friss protokollok'}
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      {stats.protocols.recent.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rendszer státusz */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 p-6 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {t.Admin?.Dashboard?.systemStatus || 'Rendszer státusz'}
                    </p>
                    <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-6 w-6" />
                      {t.Admin?.Dashboard?.operational || 'Működik'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legutóbbi protokollok táblázata - MODERNIZÁLT */}
      {stats.protocols.recent.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
          
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {t.Admin?.Dashboard?.recentProtocolsTable || 'Legutóbbi protokollok'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t.Admin?.Dashboard?.last5Protocols || 'Az utolsó 5 létrehozott protokoll'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20 hover:bg-gradient-to-r hover:from-blue-50 hover:via-sky-50 hover:to-cyan-50">
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          {t.Admin?.Dashboard?.table?.id || 'ID'}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {t.Admin?.Dashboard?.table?.created || 'Létrehozva'}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        {t.Admin?.Dashboard?.table?.status || 'Státusz'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* --- JAVÍTÁS: Pontos típus a map-ben --- */}
                    {stats.protocols.recent.map((protocol: Protocol) => (
                      <TableRow 
                        key={protocol.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-transparent hover:to-cyan-50/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                      >
                        <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {protocol.protocol_number || `${protocol.id.substring(0, 8)}...`}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            try {
                              const date = new Date(protocol.created_at);
                              if (isNaN(date.getTime())) {
                                return '-';
                              }
                              return formatDate(date, language);
                            } catch {
                              return '-';
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          {/* --- JAVÍTÁS: Dinamikus státusz színezés --- */}
                          <Badge 
                            className={`${
                              protocol.status === 'completed'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                            } text-white border-0 px-3 py-1 shadow-md`}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {protocol.status || t.Admin?.Dashboard?.completed || 'Befejezve'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
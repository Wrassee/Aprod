// src/components/system-settings.tsx
import React, { useState, useEffect } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Server, 
  Database, 
  HardDrive, 
  Download, 
  Upload, 
  Settings, 
  Activity,
  Cpu,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle
} from 'lucide-react';
// --- JAVÍTÁS: IMPORTÁLJUK A useAuth HOOK-OT ---
import { useAuth } from '@/contexts/auth-context';

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  environment: string;
  databaseSize: string;
  uptime: string;
  memoryUsage: {
    used: string;
    total: string;
  };
}

export function SystemSettings() {
  const { t, language } = useLanguageContext();
  const { toast } = useToast();
  // --- JAVÍTÁS: HASZNÁLJUK A useAuth HOOK-OT ---
  const { supabase } = useAuth();
  
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- JAVÍTÁS: A useEffect FÜGG A supabase KLIENSTŐL ---
  useEffect(() => {
    if (supabase) {
      fetchInfo();
    }
  }, [supabase]);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      console.log('ℹ️ Fetching system information...');
      
      // --- JAVÍTÁS: A BIZTONSÁGOS supabase KLIENST HASZNÁLJUK ---
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch('/api/admin/system/info', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) throw new Error('Failed to load system info');
      
      const data = await response.json();
      console.log('✅ System info loaded:', data);
      setInfo(data);
    } catch (error: any) {
      console.error('❌ Error loading system info:', error);
      toast({ 
        title: t.error || 'Hiba', 
        description: error.message || 'Nem sikerült betölteni a rendszerinformációkat', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInfo();
    setRefreshing(false);
    toast({
      title: t.success || 'Siker',
      description: t.Admin?.Settings?.refreshed || 'Rendszerinformációk frissítve',
    });
  };

  const getEnvironmentBadgeColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'development':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - MODERNIZÁLT */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            {t.Admin?.Settings?.title || 'Rendszerbeállítások'}
            <Sparkles className="h-6 w-6 text-cyan-500 animate-pulse" />
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2 ml-1">
            {t.Admin?.Settings?.description || 'Szerver és adatbázis információk, biztonsági mentések'}
          </p>
        </div>
        
        {/* Modern Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${
              refreshing 
                ? 'animate-spin' 
                : 'group-hover:rotate-180'
            } transition-transform duration-500`} />
            <span className="font-semibold">{t.Admin?.Settings?.refresh || 'Frissítés'}</span>
          </div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
        </button>
      </div>

      {/* Rendszerinformáció kártya - MODERNIZÁLT */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                {t.Admin?.Settings?.systemInfo || 'Rendszerinformáció'}
              </span>
              <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t.Admin?.Settings?.systemInfoDesc || 'A szerver és az adatbázis technikai adatai'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                  <Loader2 className="relative h-16 w-16 animate-spin text-blue-600" />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-600">
                  {language === 'hu' ? 'Adatok betöltése...' : 'Loading data...'}
                </p>
              </div>
            ) : info ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Környezet */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-blue-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.environment || 'Környezet'}
                      </p>
                      <Badge className={`${getEnvironmentBadgeColor(info.environment)} text-white border-0 px-3 py-1 text-sm shadow-md`}>
                        {info.environment}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Platform */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-green-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-800/50 dark:to-green-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Cpu className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.platform || 'Platform'}
                      </p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{info.platform}</p>
                    </div>
                  </div>
                </div>

                {/* Node.js verzió */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-purple-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.nodeVersion || 'Node.js verzió'}
                      </p>
                      <p className="font-mono text-base font-bold text-gray-900 dark:text-white">
                        {info.nodeVersion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Adatbázis méret */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-cyan-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-cyan-50/30 dark:from-gray-800/50 dark:to-cyan-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.databaseSize || 'Adatbázis mérete'}
                      </p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{info.databaseSize}</p>
                    </div>
                  </div>
                </div>

                {/* Uptime */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-orange-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-800/50 dark:to-orange-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.uptime || 'Futási idő'}
                      </p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{info.uptime}</p>
                    </div>
                  </div>
                </div>

                {/* Memória használat */}
                <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-red-300 hover:shadow-lg bg-gradient-to-br from-gray-50 to-red-50/30 dark:from-gray-800/50 dark:to-red-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t.Admin?.Settings?.memoryUsage || 'Memória használat'}
                      </p>
                      <p className="font-mono text-base font-bold text-gray-900 dark:text-white">
                        {info.memoryUsage.used} / {info.memoryUsage.total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                  <AlertCircle className="relative h-16 w-16 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-red-600">
                  {t.Admin?.Settings?.loadError || 'Nem sikerült betölteni az adatokat'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backup & Restore kártya - MODERNIZÁLT */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {t.Admin?.Settings?.backupTitle || 'Biztonsági mentés és visszaállítás'}
              </span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t.Admin?.Settings?.backupDesc || 'Adatbázis mentése és korábbi állapotok visszaállítása'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Create Backup Button */}
              <button
                disabled
                className="relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <span className="font-semibold">{t.Admin?.Settings?.createBackup || 'Mentés készítése'}</span>
                </div>
              </button>
              
              {/* Restore Backup Button */}
              <button
                disabled
                className="relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span className="font-semibold">{t.Admin?.Settings?.restoreBackup || 'Mentés visszaállítása'}</span>
                </div>
              </button>
            </div>
            
            {/* Coming Soon Notice */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                    {t.Admin?.Settings?.comingSoon || 'Hamarosan elérhető funkció'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {language === 'hu' 
                      ? 'A biztonsági mentés funkciók jelenleg fejlesztés alatt állnak.'
                      : 'Backup features are currently under development.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
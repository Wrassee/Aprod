// src/components/system-settings.tsx - FIX: Dot notation for translations
import React, { useState, useEffect } from 'react';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
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
  CheckCircle,
  Palette,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/queryClient';


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
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { supabase, initialized } = useAuth();
  
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('ℹ️ SystemSettings useEffect triggered');
    console.log('📊 Initialized:', initialized);
    console.log('📊 Supabase:', !!supabase);

    if (!initialized) {
      console.log('⏳ SystemSettings: Waiting for AuthContext to initialize...');
      setLoading(false);
      return;
    }

    if (supabase) {
      console.log('✅ User authenticated, fetching system info for all users...');
      fetchInfo();
    }
  }, [supabase, initialized]);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      console.log('ℹ️ Fetching system information...');
      
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch(getApiUrl('/api/admin/system/info'), {
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
        title: t("error"), 
        description: error.message || 'Failed to load system info', 
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
      title: t("success"),
      description: t("Admin.Settings.refreshed"),
    });
  };

  const handleThemeChange = (newTheme: 'modern' | 'classic') => {
    setTheme(newTheme);
    toast({
      title: t("success"),
      description: `${t("theme_changed")}: ${newTheme === 'modern' ? 'Modern' : 'Classic'}`,
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

  // MODERN THEME RENDER
  if (theme === 'modern') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              {t("Admin.Settings.title")}
              <Sparkles className="h-6 w-6 text-cyan-500 animate-pulse" />
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-2 ml-1">
              {t("Admin.Settings.description")}
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
              <span className="font-semibold">{t("Admin.Settings.refresh")}</span>
            </div>
            
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
          </button>
        </div>

        {/* FELÜLET TÉMA - KÁRTYÁS VÁLASZTÓ (MODERN) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />
          
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {t("ui_theme")}
                </span>
                <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t("select_ui_theme")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MODERN THEME CARD */}
                <button
                  onClick={() => handleThemeChange('modern')}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                    theme === 'modern'
                      ? 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 shadow-2xl scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md hover:shadow-xl'
                  }`}
                >
                  {/* Glow effect for selected */}
                  {theme === 'modern' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-50 blur-xl animate-pulse" />
                  )}
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-all ${
                      theme === 'modern'
                        ? 'bg-white/20 backdrop-blur-md'
                        : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      <Sparkles className={`h-8 w-8 ${
                        theme === 'modern' ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    
                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-2 ${
                      theme === 'modern' ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {t("modern_theme")}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-sm mb-4 ${
                      theme === 'modern' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t("modern_theme_desc")}
                    </p>
                    
                    {/* Selected Badge */}
                    {theme === 'modern' && (
                      <div className="flex items-center justify-center gap-2 text-white font-semibold">
                        <CheckCircle className="h-5 w-5" />
                        <span>{t("selected")}</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* CLASSIC THEME CARD */}
                <button
                  onClick={() => handleThemeChange('classic')}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                    theme === 'classic'
                      ? 'bg-gradient-to-br from-gray-700 via-slate-600 to-gray-800 shadow-2xl scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md hover:shadow-xl'
                  }`}
                >
                  {/* Glow effect for selected */}
                  {theme === 'classic' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-slate-600 opacity-50 blur-xl animate-pulse" />
                  )}
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-all ${
                      theme === 'classic'
                        ? 'bg-white/20 backdrop-blur-md'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <Zap className={`h-8 w-8 ${
                        theme === 'classic' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`} />
                    </div>
                    
                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-2 ${
                      theme === 'classic' ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {t("classic_theme")}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-sm mb-4 ${
                      theme === 'classic' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {t("classic_theme_desc")}
                    </p>
                    
                    {/* Selected Badge */}
                    {theme === 'classic' && (
                      <div className="flex items-center justify-center gap-2 text-white font-semibold">
                        <CheckCircle className="h-5 w-5" />
                        <span>{t("selected")}</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rendszerinformáció kártya */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
          
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  {t("Admin.Settings.systemInfo")}
                </span>
                <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t("Admin.Settings.systemInfoDesc")}
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
                    {t("loading")}
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
                          {t("Admin.Settings.environment")}
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
                          {t("Admin.Settings.platform")}
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
                          {t("Admin.Settings.nodeVersion")}
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
                          {t("Admin.Settings.databaseSize")}
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
                          {t("Admin.Settings.uptime")}
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
                          {t("Admin.Settings.memoryUsage")}
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
                    {t("Admin.Settings.loadError")}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("try_refresh_button")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Backup & Restore kártya */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-400 p-1 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 opacity-30 animate-pulse" />
          
          <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <HardDrive className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {t("Admin.Settings.backupTitle")}
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t("Admin.Settings.backupDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  disabled
                  className="relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    <span className="font-semibold">{t("Admin.Settings.createBackup")}</span>
                  </div>
                </button>
                
                <button
                  disabled
                  className="relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span className="font-semibold">{t("Admin.Settings.restoreBackup")}</span>
                  </div>
                </button>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                      {t("Admin.Settings.comingSoon")}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {t("backup_under_development")}
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

  // ========================================
  // CLASSIC THEME RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            {t("Admin.Settings.title")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("Admin.Settings.description")}
          </p>
        </div>
        
        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t("Admin.Settings.refresh")}
        </Button>
      </div>

      {/* FELÜLET TÉMA - KÁRTYÁS VÁLASZTÓ (CLASSIC) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            {t("ui_theme")}
          </CardTitle>
          <CardDescription>
            {t("select_ui_theme")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MODERN THEME CARD (Classic view) */}
            <button
              onClick={() => handleThemeChange('modern')}
              className={`relative overflow-hidden rounded-lg p-6 border-2 transition-all duration-300 ${
                theme === 'modern'
                  ? 'border-purple-600 bg-purple-50 shadow-lg'
                  : 'border-gray-300 bg-white hover:border-purple-400 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                  theme === 'modern'
                    ? 'bg-purple-600'
                    : 'bg-purple-100'
                }`}>
                  <Sparkles className={`h-8 w-8 ${
                    theme === 'modern' ? 'text-white' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  theme === 'modern' ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {t("modern_theme")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t("modern_theme_desc")}
                </p>
                {theme === 'modern' && (
                  <Badge className="bg-purple-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("selected")}
                  </Badge>
                )}
              </div>
            </button>

            {/* CLASSIC THEME CARD (Classic view) */}
            <button
              onClick={() => handleThemeChange('classic')}
              className={`relative overflow-hidden rounded-lg p-6 border-2 transition-all duration-300 ${
                theme === 'classic'
                  ? 'border-gray-700 bg-gray-100 shadow-lg'
                  : 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                  theme === 'classic'
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                }`}>
                  <Zap className={`h-8 w-8 ${
                    theme === 'classic' ? 'text-white' : 'text-gray-700'
                  }`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  theme === 'classic' ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {t("classic_theme")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t("classic_theme_desc")}
                </p>
                {theme === 'classic' && (
                  <Badge className="bg-gray-700 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("selected")}
                  </Badge>
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Rendszerinformáció kártya */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            {t("Admin.Settings.systemInfo")}
          </CardTitle>
          <CardDescription>
            {t("Admin.Settings.systemInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">
                {t("loading")}
              </p>
            </div>
          ) : info ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Környezet */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.environment")}
                    </p>
                    <Badge variant={info.environment === 'production' ? 'default' : 'secondary'}>
                      {info.environment}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Platform */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.platform")}
                    </p>
                    <p className="font-semibold text-gray-900">{info.platform}</p>
                  </div>
                </div>
              </div>

              {/* Node.js verzió */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Server className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.nodeVersion")}
                    </p>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {info.nodeVersion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adatbázis méret */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.databaseSize")}
                    </p>
                    <p className="font-semibold text-gray-900">{info.databaseSize}</p>
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.uptime")}
                    </p>
                    <p className="font-semibold text-gray-900">{info.uptime}</p>
                  </div>
                </div>
              </div>

              {/* Memória használat */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {t("Admin.Settings.memoryUsage")}
                    </p>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {info.memoryUsage.used} / {info.memoryUsage.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">
                {t("Admin.Settings.loadError")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {t("try_refresh_button")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup & Restore kártya */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-amber-600" />
            {t("Admin.Settings.backupTitle")}
          </CardTitle>
          <CardDescription>
            {t("Admin.Settings.backupDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button disabled variant="outline" className="opacity-50">
              <Download className="h-4 w-4 mr-2" />
              {t("Admin.Settings.createBackup")}
            </Button>
            
            <Button disabled variant="outline" className="opacity-50">
              <Upload className="h-4 w-4 mr-2" />
              {t("Admin.Settings.restoreBackup")}
            </Button>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 text-sm">
                  {t("Admin.Settings.comingSoon")}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {t("backup_under_development")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
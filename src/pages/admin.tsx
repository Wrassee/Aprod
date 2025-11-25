// src/pages/admin.tsx - FIXED MOBILE MENU OVERLAP (h-auto & grid adjustments)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  Home, User, FileSpreadsheet, LayoutDashboard, FileText, 
  Shield, Settings, ArrowLeft, Sparkles, Upload, Loader2,
  Layers
} from 'lucide-react';

// Komponens importok
import { UserList } from '@/components/user-list';
import { TemplateManagement } from '@/components/template-management';
import { AdminDashboard } from '@/components/admin-dashboard';
import { AuditLogTable } from '@/components/audit-log-table';
import { SystemSettings } from '@/components/system-settings';
import { ProfileSettings } from '@/components/profile-settings';
import { ProtocolList } from '@/components/protocol-list';
import LiftManagement from '@/components/admin/LiftManagement';

interface AdminProps {
  onBack: () => void;
  onHome?: () => void;
}

export function Admin({ onBack, onHome }: AdminProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

  useEffect(() => {
    if (role && !isAdmin && (activeMainTab === 'dashboard' || activeMainTab === 'users')) {
      setActiveMainTab('protocols');
    }
  }, [role, isAdmin, activeMainTab]);

  const [questionsUpload, setQuestionsUpload] = useState({
    name: '',
    file: null as File | null,
  });

  const [protocolUpload, setProtocolUpload] = useState({
    name: '',
    file: null as File | null,
  });

  const handleQuestionsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestionsUpload({ ...questionsUpload, file });
    }
  };

  const handleProtocolFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProtocolUpload({ ...protocolUpload, file });
    }
  };

  const handleQuestionsUpload = async () => {
    if (!questionsUpload.file || !questionsUpload.name) {
      toast({
        title: t("error"),
        description: t("pleaseProvideNameAndFile"),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', questionsUpload.file);
    formData.append('name', questionsUpload.name);
    formData.append('type', 'unified');
    formData.append('language', 'multilingual');

    try {
      const response = await fetch('/api/admin/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("questionsTemplateUploaded"),
        });
        setQuestionsUpload({ name: '', file: null });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || 'Failed to upload template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolUpload = async () => {
    if (!protocolUpload.file || !protocolUpload.name) {
      toast({
        title: t("error"),
        description: t("pleaseProvideNameAndFile"),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', protocolUpload.file);
    formData.append('name', protocolUpload.name);
    formData.append('type', 'protocol');
    formData.append('language', 'multilingual');

    try {
      const response = await fetch('/api/admin/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("protocolTemplateUploaded"),
        });
        setProtocolUpload({ name: '', file: null });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || 'Failed to upload template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative h-16 w-16 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // =========================================================
  // MODERN TÉMA RENDERELÉS
  // =========================================================
  if (theme === 'modern') {
    return (
      <div className="min-h-screen">
        {/* Header KÍVÜL (sticky működhet) */}
        <header className="relative bg-white dark:bg-gray-900 shadow-lg border-b-2 border-blue-100 dark:border-blue-900/50 sticky top-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none" />
          
          <div className="relative max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo + Title */}
              <div className="flex items-center gap-4">
                {onHome && (
                  <button
                    onClick={onHome}
                    className="group relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    title={t("homeTooltip")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-lg group-hover:shadow-xl transition-shadow">
                      <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                        <img
                          src="/otis-elevators-seeklogo_1753525178175.png"
                          alt="OTIS Logo"
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    </div>
                  </button>
                )}

                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    {t("admin")}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 font-mono text-xs border-blue-200">
                      v1.0.0
                    </Badge>
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={onBack}
                className="group relative overflow-hidden px-6 py-2 rounded-xl border-2 border-blue-500 text-blue-600 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">{t("back")}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Görgethető tartalom */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

          {/* Main Content */}
          <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              {/* ✅ JAVÍTVA: h-auto hozzáadva és grid-cols-2 mobilon */}
              <TabsList 
                className={`grid w-full h-auto ${
                  isAdmin 
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7' // Mobilon 2 oszlop, Tableten 3, Desktopon 7
                    : 'grid-cols-2 md:grid-cols-4'
                } bg-white/70 backdrop-blur-md border-2 border-blue-100 p-1 rounded-2xl shadow-lg mb-8 gap-1`}
              >
                {isAdmin && (
                  <TabsTrigger 
                    value="dashboard"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span className="inline">{t("Admin.tabs.dashboard")}</span>
                  </TabsTrigger>
                )}
                
                {isAdmin && (
                  <TabsTrigger 
                    value="users"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="inline">{t("Admin.tabs.users")}</span>
                  </TabsTrigger>
                )}
                
                <TabsTrigger 
                  value="protocols"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="inline">{t("Admin.tabs.protocols")}</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="templates"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span className="inline">{t("Admin.tabs.templates")}</span>
                </TabsTrigger>
                
                {/* LIFT MANAGEMENT TAB */}
                <TabsTrigger 
                  value="lift-management"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  <span className="inline">{t("lift_type_management")}</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="audit"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="inline">{t("Admin.tabs.audit")}</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="inline">{t("Admin.tabs.settings")}</span>
                </TabsTrigger>
              </TabsList>

              {isAdmin && (
                <TabsContent value="dashboard" className="mt-6">
                  <AdminDashboard />
                </TabsContent>
              )}

              {isAdmin && (
                <TabsContent value="users" className="mt-6">
                  <UserList />
                </TabsContent>
              )}

              <TabsContent value="protocols" className="mt-6">
                <ProtocolList />
              </TabsContent>

              <TabsContent value="templates" className="space-y-6 mt-6">
                <TemplateManagement />
              </TabsContent>

              {/* LIFT MANAGEMENT CONTENT */}
              <TabsContent value="lift-management" className="mt-6">
                <LiftManagement />
              </TabsContent>

              <TabsContent value="audit" className="mt-6">
                <AuditLogTable />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                  <TabsList className="grid w-full h-auto grid-cols-2 bg-white/70 backdrop-blur-md border-2 border-blue-100 p-1 rounded-xl shadow-md mb-6">
                    <TabsTrigger 
                      value="profile"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-lg"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t("profile")}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="system"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {t("Admin.Settings.title")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="mt-6">
                    <ProfileSettings />
                  </TabsContent>

                  <TabsContent value="system" className="mt-6">
                    <SystemSettings />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    );
  }

  // =========================================================
  // CLASSIC TÉMA RENDERELÉS
  // =========================================================
  return (
    <div className="min-h-screen">
      {/* Header KÍVÜL (sticky működhet) */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/otis-elevators-seeklogo_1753525178175.png"
                alt="OTIS Logo"
                className="h-12 w-12 mr-4"
              />
              {onHome && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onHome}
                  className="text-gray-600 hover:text-gray-800 mr-4"
                  title={t("homeTooltip")}
                >
                  <Home className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-800 mr-3">{t("admin")}</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-600 font-mono text-xs">
                  v1.0.0 (Classic)
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              {t("back")}
            </Button>
          </div>
        </div>
      </header>

      {/* Görgethető tartalom */}
      <div className="min-h-screen bg-white">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            {/* ✅ JAVÍTVA: h-auto és grid reszponzivitás itt is */}
            <TabsList 
              className={`grid w-full h-auto ${
                isAdmin 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7'
                  : 'grid-cols-2 md:grid-cols-4'
              } mb-6`}
            >
              {isAdmin && (
                <TabsTrigger value="dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {t("Admin.tabs.dashboard")}
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="users">
                  <User className="h-4 w-4 mr-2" />
                  {t("Admin.tabs.users")}
                </TabsTrigger>
              )}
              <TabsTrigger value="protocols">
                <FileText className="h-4 w-4 mr-2" />
                {t("Admin.tabs.protocols")}
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t("Admin.tabs.templates")}
              </TabsTrigger>
              
              {/* LIFT MANAGEMENT TAB (Classic) */}
              <TabsTrigger value="lift-management">
                <Layers className="h-4 w-4 mr-2" />
                {t("lift_type_management")}
              </TabsTrigger>
              
              <TabsTrigger value="audit">
                <Shield className="h-4 w-4 mr-2" />
                {t("Admin.tabs.audit")}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                {t("Admin.tabs.settings")}
              </TabsTrigger>
            </TabsList>

            {isAdmin && (
              <TabsContent value="dashboard" className="mt-6">
                <AdminDashboard />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="users" className="mt-6">
                <UserList />
              </TabsContent>
            )}

            <TabsContent value="protocols" className="mt-6">
              <ProtocolList />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 mt-6">
              <TemplateManagement />
            </TabsContent>

            {/* LIFT MANAGEMENT CONTENT (Classic) */}
            <TabsContent value="lift-management" className="mt-6">
              <LiftManagement />
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <AuditLogTable />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                <TabsList className="grid w-full h-auto grid-cols-2 mb-6">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4 mr-2" />
                    {t("profile")}
                  </TabsTrigger>
                  <TabsTrigger value="system">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("Admin.Settings.title")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                  <ProfileSettings />
                </TabsContent>

                <TabsContent value="system" className="mt-6">
                  <SystemSettings />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
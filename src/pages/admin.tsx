// src/pages/admin.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageContext } from '@/components/language-provider';
import { Home, User, FileSpreadsheet, LayoutDashboard, FileText, Shield, Settings, ArrowLeft, Sparkles } from 'lucide-react';

// Komponens importok
import { UserList } from '@/components/user-list';
import { TemplateManagement } from '@/components/template-management';
import { AdminDashboard } from '@/components/admin-dashboard';
import { AuditLogTable } from '@/components/audit-log-table';
import { SystemSettings } from '@/components/system-settings';

interface AdminProps {
  onBack: () => void;
  onHome?: () => void;
}

export function Admin({ onBack, onHome }: AdminProps) {
  const { t, language } = useLanguageContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className="relative bg-white dark:bg-gray-900 shadow-lg border-b-2 border-blue-100 dark:border-blue-900/50 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              {/* OTIS Logo as Home Button */}
              {onHome && (
                <button
                  onClick={onHome}
                  className="group relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  title={language === 'hu' ? 'Kezdőlap' : 'Startseite'}
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
                  {t.admin}
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
                <span className="font-semibold">{t.back}</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          {/* Modern Tab List - 6 columns */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-white/70 backdrop-blur-md border-2 border-blue-100 p-1 rounded-2xl shadow-lg mb-8 gap-1">
            <TabsTrigger 
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.dashboard || 'Dashboard'}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.users || 'Users'}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="protocols"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.protocols || 'Protocols'}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.templates || 'Templates'}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="audit"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.audit || 'Audit'}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg py-3"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.Admin?.tabs?.settings || 'Settings'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users">
            <UserList />
          </TabsContent>

          <TabsContent value="protocols">
            {/* Coming Soon Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
              
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {/* Icon with glow */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                    {t.Admin?.tabs?.protocols || 'Protocols'}
                    <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {language === 'hu' 
                      ? 'A protokoll kezelési funkciók fejlesztés alatt állnak.'
                      : 'Protocol management features are under development.'}
                  </p>
                  
                  {/* Badge */}
                  <Badge className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 border-0">
                    {language === 'hu' ? 'Hamarosan' : 'Coming Soon'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTable />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
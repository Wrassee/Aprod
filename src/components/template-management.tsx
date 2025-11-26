// src/components/template-management.tsx - JAVÍTOTT VERZIÓ (CAPACITOR FIX)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';
import { formatDate } from '@/lib/utils';
import { Upload, FileSpreadsheet, Eye, Trash2, Download, Loader2, FileText, Sparkles, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

// 🔥 1. URL DEFINIÁLÁSE (Render URL)
const BASE_URL = import.meta.env.VITE_API_URL || 'https://aprod-app-kkcr.onrender.com';

interface Template {
  id: string;
  name: string;
  type: string;
  language: string;
  fileName: string;
  is_active: boolean;
  uploaded_at: string;
}

interface LocalTemplate {
  id: string;
  name: string;
  name_de: string;
  type: string;
  language: string;
  path: string;
  description?: string;
  description_de?: string;
}

interface HybridTemplateData {
  local: LocalTemplate[];
  remote: Template[];
  current: {
    templateId: string;
    loadStrategy: string;
  };
}

export function TemplateManagement() {
  const { t, language } = useLanguageContext();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { supabase, initialized } = useAuth();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [questionsUpload, setQuestionsUpload] = useState({
    name: '',
    file: null as File | null,
  });
  
  const [protocolUpload, setProtocolUpload] = useState({
    name: '',
    file: null as File | null,
  });
  
  const [hybridTemplates, setHybridTemplates] = useState<HybridTemplateData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadStrategy, setLoadStrategy] = useState<string>('local_first');

  useEffect(() => {
    console.log('🔍 TemplateManagement useEffect triggered');
    console.log('📊 Supabase available:', !!supabase);
    console.log('📊 AuthContext initialized:', initialized);

    if (!initialized) {
      console.log('⏳ Waiting for AuthContext to initialize...');
      return;
    }

    if (!supabase) {
      console.error('❌ Supabase not available even after initialization!');
      setLoading(false);
      return;
    }

    console.log('✅ AuthContext ready, fetching templates for all users...');
    fetchTemplates();
    fetchHybridTemplates();
  }, [supabase, initialized]);

  const getAuthHeaders = async () => {
    if (!supabase) throw new Error("Supabase client not available");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");
    return { 'Authorization': `Bearer ${session.access_token}` };
  };

  const fetchTemplates = async () => {
    console.log('🔍 fetchTemplates() - START');
    
    try {
      console.log('📤 Getting auth headers...');
      const headers = await getAuthHeaders();
      console.log('✅ Auth headers received');
      
      // 🔥 JAVÍTVA: BASE_URL használata
      console.log(`📤 Fetching from: ${BASE_URL}/api/admin/templates`);
      const response = await fetch(`${BASE_URL}/api/admin/templates`, { headers });
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Templates fetched successfully:', data.length, 'templates');
        setTemplates(data);
      } else {
        console.error('❌ Response not OK:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      toast({
        title: t("error"),
        description: t("failedToFetchTemplates"),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    
    console.log('🔍 fetchTemplates() - END');
  };

  const fetchHybridTemplates = async () => {
    try {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/available`, { headers });
      if (response.ok) {
        const data = await response.json();
        setHybridTemplates(data);
        setSelectedTemplate(data.current.templateId);
        setLoadStrategy(data.current.loadStrategy);
      }
    } catch (error) {
      console.error('Error fetching hybrid templates:', error);
    }
  };

  const handleTemplateSelect = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/select`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          loadStrategy: loadStrategy
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: t("success"),
          description: t("templateSwitchSuccess.replace")('{name}', result.template?.name || 'Template'),
        });
        fetchHybridTemplates();
      } else {
        throw new Error('Template selection failed');
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      toast({
        title: t("error"),
        description: t("templateSwitchFailed"),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/upload`, {
        method: 'POST',
        headers: headers, // Fontos: NE állítsd be a Content-Type-ot FormData-nál!
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("questionsTemplateUploaded"),
        });
        setQuestionsUpload({ name: '', file: null });
        fetchTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading questions template:', error);
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
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("protocolTemplateUploaded"),
        });
        setProtocolUpload({ name: '', file: null });
        fetchTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading protocol template:', error);
      toast({
        title: t("error"),
        description: error.message || 'Failed to upload template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (templateId: string) => {
    setActivatingId(templateId);
    try {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/${templateId}/activate`, {
        method: 'POST',
        headers: headers,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("templateActivatedSuccessfully"),
        });
        fetchTemplates();
      } else {
        throw new Error('Activation failed');
      }
    } catch (error) {
      console.error('Error activating template:', error);
      toast({
        title: t("error"),
        description: t("failedToActivateTemplate"),
        variant: 'destructive',
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handlePreview = async (templateId: string) => {
    try {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata (mindkét fetch-nél)
      const [templateResponse, questionsResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/templates/${templateId}/preview`, { headers }),
        fetch(`${BASE_URL}/api/questions/hu`, { headers })
      ]);
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        let questionsData = [];
        
        if (questionsResponse.ok) {
          questionsData = await questionsResponse.json();
        }
        
        console.log('Template preview:', templateData);
        setPreviewData({ ...templateData, questions: questionsData });
        setPreviewOpen(true);
      } else {
        toast({
          title: t("error"),
          description: t("failedToLoadTemplatePreview"),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: t("error"),
        description: t("errorLoadingTemplatePreview"),
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (templateId: string) => {
    // 🔥 JAVÍTVA: Teljes URL megadása a letöltéshez
    // Telefonon a relatív URL nem működik
    window.location.href = `${BASE_URL}/api/admin/templates/${templateId}/download`;
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(t("confirmDeleteTemplate.replace")('{name}', templateName))) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTVA: BASE_URL használata
      const response = await fetch(`${BASE_URL}/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.ok) {
        toast({
          title: t("success"),
          description: t("templateDeletedSuccessfully"),
        });
        fetchTemplates();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: t("error"),
        description: t("templateDeleteFailed"),
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates;

  // MODERN THEME RENDER
  if (theme === 'modern') {
    return (
      <Tabs defaultValue="templates" className="w-full">
        {/* Modern Tab List */}
        <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-md border-2 border-blue-100 p-1 rounded-2xl shadow-lg mb-6">
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 py-3"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t("templates")}
          </TabsTrigger>
          <TabsTrigger 
            value="hybrid"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 py-3"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("hybridTemplates")}
          </TabsTrigger>
          <TabsTrigger 
            value="upload"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-sky-500 data-[state=active]:text-white rounded-xl transition-all duration-300 py-3"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("uploadTemplate")}
          </TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
            
            <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                    {t("templates")}
                  </span>
                  <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
                  <Badge variant="outline" className="ml-auto">
                    {templates.length} sablon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gray-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                        <FileSpreadsheet className="relative h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">
                        {t("noTemplatesUploaded")}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {language === 'hu' 
                          ? 'Töltsd fel az első sablont a "Feltöltés" fülön!' 
                          : 'Upload your first template in the "Upload" tab!'}
                      </p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <div 
                        key={template.id} 
                        className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 transition-all hover:border-blue-300 hover:shadow-lg bg-gradient-to-r from-white to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Template Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {template.name}
                              </h3>
                              
                              {/* Active Badge */}
                              <Badge className={`${
                                template.is_active 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                              } border-0 px-3 py-1 shadow-md`}>
                                {template.is_active ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />{t("active")}</>
                                ) : (
                                  t("inactive")
                                )}
                              </Badge>
                              
                              {/* Type Badge */}
                              <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0 px-3 py-1">
                                {template.type === 'unified' ? 
                                  t("questionTemplate") :
                                  template.type === 'protocol' ? 
                                  t("protocolTemplateName") :
                                  template.type
                                }
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <FileSpreadsheet className="h-4 w-4" />
                                {template.fileName}
                              </span>
                              <span className="flex items-center gap-2 text-gray-500">
                                <Calendar className="h-4 w-4" />
                                {(() => {
                                  try {
                                    const date = new Date(template.uploaded_at);
                                    if (isNaN(date.getTime()) || date.getFullYear() > 2030) {
                                      return 'Ismeretlen dátum';
                                    }
                                    return formatDate(date, language);
                                  } catch {
                                    return 'Ismeretlen dátum';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Download */}
                            <button
                              onClick={() => handleDownload(template.id)}
                              className="group/btn relative p-2 rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                              title="Sablon letöltése"
                            >
                              <Download className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            </button>
                            
                            {/* Preview */}
                            <button
                              onClick={() => handlePreview(template.id)}
                              className="group/btn relative p-2 rounded-lg border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all"
                              title="Előnézet"
                            >
                              <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            </button>
                            
                            {/* Activate */}
                            {!template.is_active && (
                              <button
                                onClick={() => handleActivate(template.id)}
                                disabled={activatingId === template.id}
                                className="group/btn relative overflow-hidden px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                              >
                                {activatingId === template.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <span className="flex items-center gap-2 font-semibold">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("activate")}
                                  </span>
                                )}
                              </button>
                            )}
                            
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(template.id, template.name)}
                              className="group/btn relative p-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all"
                              title={t("deleteTooltip")}
                            >
                              <Trash2 className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HYBRID TAB */}
        <TabsContent value="hybrid" className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />
            
            <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                    {t("hybridTemplateManagement")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hybridTemplates && (
                  <div className="space-y-4">
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        {t("localTemplates")} ({hybridTemplates.local.length})
                      </Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="h-12 border-2 focus:ring-4 focus:ring-purple-500/30">
                          <SelectValue placeholder={t("chooseTemplate")} />
                        </SelectTrigger>
                        <SelectContent>
                          {hybridTemplates.local.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} (helyi)
                            </SelectItem>
                          ))}
                          {hybridTemplates.remote.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} (távoli)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        {t("loadingStrategy")}
                      </Label>
                      <Select value={loadStrategy} onValueChange={setLoadStrategy}>
                        <SelectTrigger className="h-12 border-2 focus:ring-4 focus:ring-purple-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_first">{t("localFirst")}</SelectItem>
                          <SelectItem value="cache_first">{t("cacheFirst")}</SelectItem>
                          <SelectItem value="remote_only">{t("remoteOnly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <button
                      onClick={handleTemplateSelect}
                      disabled={loading || !selectedTemplate}
                      className="group relative overflow-hidden w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {loading ? (
                          <><Loader2 className="h-5 w-5 animate-spin" />{t("switching")}</>
                        ) : (
                          <><Sparkles className="h-5 w-5" /><span className="font-bold text-lg">{t("templateSwitch")}</span></>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* UPLOAD TAB */}
        <TabsContent value="upload" className="space-y-6">
          {/* Questions Upload Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
            
            <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  {t("uploadQuestionsTemplate")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("uploadQuestionsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    {t("templateName")}
                  </Label>
                  <Input
                    value={questionsUpload.name}
                    onChange={(e) => setQuestionsUpload({ ...questionsUpload, name: e.target.value })}
                    placeholder={t("exampleTemplateName")}
                    className="h-12 border-2 focus:ring-4 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    {t("selectExcel")}
                  </Label>
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50/30">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-4">
                      {t("uploadExcelWithQuestions")}
                    </p>
                    <button
                      type="button"
                      onClick={() => document.getElementById('questions-excel-upload')?.click()}
                      className="relative overflow-hidden px-6 py-3 rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all font-semibold"
                    >
                      {t("selectExcelFile")}
                    </button>
                    <input
                      id="questions-excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleQuestionsFileUpload}
                    />
                    {questionsUpload.file && (
                      <div className="mt-4 p-3 rounded-lg bg-green-50 border-2 border-green-200">
                        <p className="text-sm font-semibold text-green-700 flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {t("selected")}: {questionsUpload.file.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleQuestionsUpload}
                  disabled={loading || !questionsUpload.file || !questionsUpload.name}
                  className="group relative overflow-hidden w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /><span className="font-bold text-lg">{t("loading")}</span></>
                    ) : (
                      <><Upload className="h-5 w-5" /><span className="font-bold text-lg">{t("uploadQuestionsTemplate")}</span></>
                    )}
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Protocol Upload Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 via-slate-600 to-gray-800 p-1 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-slate-500 to-gray-700 opacity-30 animate-pulse" />
            
            <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-slate-700 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  {t("uploadProtocolTemplate")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("uploadProtocolDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    {t("templateName")}
                  </Label>
                  <Input
                    value={protocolUpload.name}
                    onChange={(e) => setProtocolUpload({ ...protocolUpload, name: e.target.value })}
                    placeholder={t("exampleProtocolName")}
                    className="h-12 border-2 focus:ring-4 focus:ring-gray-500/30"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    {t("selectExcel")}
                  </Label>
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors p-8 text-center bg-gradient-to-br from-gray-50 to-slate-50/30">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-4">
                      {t("uploadProtocolFormat")}
                    </p>
                    <button
                      type="button"
                      onClick={() => document.getElementById('protocol-excel-upload')?.click()}
                      className="relative overflow-hidden px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-700 hover:bg-gray-100 transition-all font-semibold"
                    >
                      {t("selectExcelFile")}
                    </button>
                    <input
                      id="protocol-excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleProtocolFileUpload}
                    />
                    {protocolUpload.file && (
                      <div className="mt-4 p-3 rounded-lg bg-green-50 border-2 border-green-200">
                        <p className="text-sm font-semibold text-green-700 flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {t("selected")}: {protocolUpload.file.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleProtocolUpload}
                  disabled={loading || !protocolUpload.file || !protocolUpload.name}
                  className="group relative overflow-hidden w-full px-6 py-4 rounded-xl bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-800 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /><span className="font-bold text-lg">{t("loading")}</span></>
                    ) : (
                      <><Upload className="h-5 w-5" /><span className="font-bold text-lg">{t("uploadProtocolTemplate")}</span></>
                    )}
                  </div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  // ========================================
  // CLASSIC THEME RENDER
  // ========================================
  return (
    <Tabs defaultValue="templates" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="templates">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t("templates")}
        </TabsTrigger>
        <TabsTrigger value="hybrid">
          <Sparkles className="h-4 w-4 mr-2" />
          {t("hybridTemplates")}
        </TabsTrigger>
        <TabsTrigger value="upload">
          <Upload className="h-4 w-4 mr-2" />
          {t("uploadTemplate")}
        </TabsTrigger>
      </TabsList>

      {/* TEMPLATES TAB */}
      <TabsContent value="templates" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              {t("templates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t("noTemplatesUploaded")}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {language === 'hu' 
                      ? 'Töltsd fel az első sablont a "Feltöltés" fülön!' 
                      : 'Upload your first template in the "Upload" tab!'}
                  </p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-800">{template.name}</h3>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? t("active") : t("inactive")}
                        </Badge>
                        <Badge variant="outline">
                          {template.type === 'unified' ? 
                            t("questionTemplate") :
                            template.type === 'protocol' ? 
                            t("protocolTemplateName") :
                            template.type
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{template.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          try {
                            const date = new Date(template.uploaded_at);
                            if (isNaN(date.getTime()) || date.getFullYear() > 2030) {
                              return 'Ismeretlen dátum';
                            }
                            return formatDate(date, language);
                          } catch {
                            return 'Ismeretlen dátum';
                          }
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(template.id)}
                        title="Sablon letöltése"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template.id)}
                        title="Előnézet"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!template.is_active && (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(template.id)}
                          disabled={activatingId === template.id}
                          className="bg-blue-600 hover:bg-blue-700 w-[100px]"
                        >
                          {activatingId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("activate")
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id, template.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        title={t("deleteTooltip")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* HYBRID TAB */}
      <TabsContent value="hybrid" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("hybridTemplateManagement")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hybridTemplates && (
              <div className="space-y-4">
                <div>
                  <Label>{t("localTemplates")} ({hybridTemplates.local.length})</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("chooseTemplate")} />
                    </SelectTrigger>
                    <SelectContent>
                      {hybridTemplates.local.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} (helyi)
                        </SelectItem>
                      ))}
                      {hybridTemplates.remote.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} (távoli)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t("loadingStrategy")}</Label>
                  <Select value={loadStrategy} onValueChange={setLoadStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_first">{t("localFirst")}</SelectItem>
                      <SelectItem value="cache_first">{t("cacheFirst")}</SelectItem>
                      <SelectItem value="remote_only">{t("remoteOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleTemplateSelect} 
                  disabled={loading || !selectedTemplate}
                  className="w-full"
                >
                  {loading ? t("switching") : t("templateSwitch")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* UPLOAD TAB */}
      <TabsContent value="upload" className="space-y-6">
        {/* Questions Template Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              {t("uploadQuestionsTemplate")}
            </CardTitle>
            <CardDescription>
              {t("uploadQuestionsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("templateName")}
              </Label>
              <Input
                value={questionsUpload.name}
                onChange={(e) => setQuestionsUpload({ ...questionsUpload, name: e.target.value })}
                placeholder={t("exampleTemplateName")}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("selectExcel")}
              </Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {t("uploadExcelWithQuestions")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('questions-excel-upload-classic')?.click()}
                >
                  {t("selectExcelFile")}
                </Button>
                <input
                  id="questions-excel-upload-classic"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleQuestionsFileUpload}
                />
                {questionsUpload.file && (
                  <p className="text-sm text-green-600 mt-2">
                    {t("selected")}: {questionsUpload.file.name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleQuestionsUpload}
              disabled={loading || !questionsUpload.file || !questionsUpload.name}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {loading ? t("loading") : t("uploadQuestionsTemplate")}
            </Button>
          </CardContent>
        </Card>

        {/* Protocol Template Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {t("uploadProtocolTemplate")}
            </CardTitle>
            <CardDescription>
              {t("uploadProtocolDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("templateName")}
              </Label>
              <Input
                value={protocolUpload.name}
                onChange={(e) => setProtocolUpload({ ...protocolUpload, name: e.target.value })}
                placeholder={t("exampleProtocolName")}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("selectExcel")}
              </Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {t("uploadProtocolFormat")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('protocol-excel-upload-classic')?.click()}
                >
                  {t("selectExcelFile")}
                </Button>
                <input
                  id="protocol-excel-upload-classic"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleProtocolFileUpload}
                />
                {protocolUpload.file && (
                  <p className="text-sm text-green-600 mt-2">
                    {t("selected")}: {protocolUpload.file.name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleProtocolUpload}
              disabled={loading || !protocolUpload.file || !protocolUpload.name}
              className="w-full bg-gray-700 hover:bg-gray-800"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {loading ? t("loading") : t("uploadProtocolTemplate")}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
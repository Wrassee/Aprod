import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageContext } from '@/components/language-provider';
import { formatDate } from '@/lib/utils';
import { Upload, Settings, FileSpreadsheet, CheckCircle, XCircle, Eye, Edit, Home, Trash2, X, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AdminProps {
  onBack: () => void;
  onHome?: () => void;
}

export function Admin({ onBack, onHome }: AdminProps) {
  const { t, language } = useLanguageContext();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'unified',
    language: 'multilingual',
    file: null as File | null,
  });
  const [hybridTemplates, setHybridTemplates] = useState<HybridTemplateData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadStrategy, setLoadStrategy] = useState<string>('local_first');

  useEffect(() => {
    fetchTemplates();
    fetchHybridTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: t.error,
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    }
  };

  const fetchHybridTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates/available');
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
      const response = await fetch('/api/admin/templates/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          loadStrategy: loadStrategy
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: t.success,
          description: `Template váltás sikeres: ${result.template.name}`,
        });
        fetchHybridTemplates();
      } else {
        throw new Error('Template selection failed');
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      toast({
        title: t.error,
        description: 'Template váltás sikertelen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast({
        title: t.error,
        description: 'Please provide a name and select a file',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('name', uploadForm.name);
    formData.append('type', uploadForm.type);
    formData.append('language', uploadForm.language);

    try {
      const response = await fetch('/api/admin/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: t.success,
          description: 'Template uploaded successfully',
        });
        setUploadForm({ name: '', type: 'unified', language: 'multilingual', file: null });
        fetchTemplates();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: t.error,
        description: 'Failed to upload template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (templateId: string) => {
    setActivatingId(templateId);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: t.success,
          description: 'Template activated successfully',
        });
        fetchTemplates();
      } else {
        throw new Error('Activation failed');
      }
    } catch (error) {
      console.error('Error activating template:', error);
      toast({
        title: t.error,
        description: 'Failed to activate template',
        variant: 'destructive',
      });
    } finally {
      setActivatingId(null);
    }
  };


  const handlePreview = async (templateId: string) => {
    try {
      const [templateResponse, questionsResponse] = await Promise.all([
        fetch(`/api/admin/templates/${templateId}/preview`),
        fetch('/api/questions/hu')
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
          title: t.error,
          description: 'Failed to load template preview',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: t.error,
        description: 'Error loading template preview',
        variant: 'destructive',
      });
    }
  };

  // --- MÓDOSÍTVA: A letöltési funkció leegyszerűsítve ---
  const handleDownload = (templateId: string) => {
    window.location.href = `/api/admin/templates/${templateId}/download`;
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${templateName}" sablont? Ez a művelet nem vonható vissza.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t.success,
          description: 'Sablon sikeresen törölve',
        });
        fetchTemplates();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: t.error,
        description: 'Sablon törlése sikertelen',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates;

  return (
  <div className="min-h-screen bg-light-surface">
    <header className="bg-white shadow-sm border-b border-gray-200">
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
                title="Kezdőlap"
              >
                  <Home className="h-4 w-4" />
                </Button>
              )}

              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-800 mr-3">{t.admin}</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-600 font-mono text-xs">
                  v0.4.8
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              {t.back}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">{t.templates}</TabsTrigger>
            <TabsTrigger value="hybrid">Hibrid Sablonok</TabsTrigger>
            <TabsTrigger value="upload">{t.uploadTemplate}</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  {t.templates}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No templates uploaded</p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-800">{template.name}</h3>
                            <Badge variant={template.is_active ? "default" : "secondary"}>
                              {template.is_active ? t.active : t.inactive}
                            </Badge>
                            <Badge variant="outline">
                              {template.type === 'unified' ? 
                                (language === 'de' ? 'Vereinigt' : 'Egyesített') :
                                template.type === 'questions' ? t.questionsTemplate : t.protocolTemplate
                              }
                            </Badge>
                            <Badge variant="outline" className="bg-gray-100">
                              {template.language === 'multilingual' ? 'HU/DE' : template.language.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{template.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const date = new Date(template.uploaded_at);
                                // Ellenőrizzük, hogy valid dátum-e és nem túl nagy az évszám
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
                          {/* --- MÓDOSÍTVA: A gomb onClick eseménye frissítve --- */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(template.id)}
                            title="Sablon letöltése"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(template.id)}
                                title="Előnézet"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Template Előnézet - Kérdések és Cella Hozzárendelések</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {previewData && (
                                  <>
                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-sm">Munkafüzet lapok</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="flex flex-wrap gap-2">
                                            {previewData.sheets?.map((sheet: string, index: number) => (
                                              <Badge key={index} variant="outline">
                                                {sheet}
                                              </Badge>
                                            )) || <p className="text-gray-500">{language === 'de' ? 'Kein Blatt' : 'Nincs lap'}</p>}
                                          </div>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-sm">Kérdések száma</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-2xl font-bold text-otis-blue">
                                            {previewData.questions?.length || 0}
                                          </div>
                                          <p className="text-sm text-gray-500">
                                            {language === 'de' ? 'aktive Frage' : 'aktív kérdés'}
                                          </p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-sm">Cellák száma</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-2xl font-bold text-gray-600">
                                            {previewData.cellReferences?.length || 0}
                                          </div>
                                          <p className="text-sm text-gray-500">
                                            elérhető cella
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </div>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">
                                          {language === 'de' ? 'Fragen und Excel-Zellzuordnungen' : 'Kérdések és Excel Cella Hozzárendelések'}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <ScrollArea className="h-64">
                                          {previewData.questions?.length > 0 ? (
                                            <div className="space-y-3">
                                              {previewData.questions.map((question: any, index: number) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                  <div className="grid grid-cols-4 gap-3 items-center">
                                                    <div>
                                                      <Badge variant="secondary" className="text-xs">
                                                        ID: {question.id}
                                                      </Badge>
                                                    </div>
                                                    <div className="col-span-2">
                                                      <p className="font-medium text-sm">{question.title}</p>
                                                      <p className="text-xs text-gray-500">
                                                        {language === 'de' ? 
                                                          `Typ: ${question.type} | Gruppe: ${question.groupName || 'N/A'}` :
                                                          `Típus: ${question.type} | Csoport: ${question.groupName || 'N/A'}`
                                                        }
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <Badge variant="outline" className="text-xs font-mono">
                                                        {question.cellReference || (language === 'de' ? 'Keine Zelle' : 'Nincs cella')}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-gray-500 text-center py-8">
                                              {language === 'de' ? 'Keine Fragen definiert' : 'Nincs kérdés definiálva'}
                                            </p>
                                          )}
                                        </ScrollArea>
                                      </CardContent>
                                    </Card>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {!template.is_active && (
                            <Button
                              size="sm"
                              onClick={() => handleActivate(template.id)}
                              disabled={activatingId === template.id}
                              className="bg-otis-blue hover:bg-blue-700 w-[100px]"
                            >
                              {activatingId === template.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t.activate
                              )}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id, template.name)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title={language === 'de' ? 'Löschen' : 'Törlés'}
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

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  {t.uploadTemplate}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t.templateName}</Label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder={language === 'de' ? 'Vorlagenname eingeben' : 'Enter template name'}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">{t.templateType}</Label>
                  <Select 
                    value={uploadForm.type} 
                    onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unified">
                        {language === 'de' ? 'Vereinigt (Alle Fragetypen)' : 'Egyesített (Minden kérdéstípus)'}
                      </SelectItem>
                      <SelectItem value="questions">{t.questionsTemplate}</SelectItem>
                      <SelectItem value="protocol">{t.protocolTemplate}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {language === 'de' ? 'Sprachen' : 'Nyelvek'}
                  </Label>
                  <Select 
                    value={uploadForm.language} 
                    onValueChange={(value) => setUploadForm({ ...uploadForm, language: value as 'multilingual' | 'hu' | 'de' })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multilingual">
                        {language === 'de' ? 'Mehrsprachig (HU/DE)' : 'Multilingual (HU/DE)'}
                      </SelectItem>
                      <SelectItem value="hu">
                        {language === 'de' ? 'Ungarisch' : 'Hungarian'}
                      </SelectItem>
                      <SelectItem value="de">
                        {language === 'de' ? 'Deutsch' : 'German'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">{t.selectExcelFile}</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">{t.uploadExcelFile}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('excel-upload')?.click()}
                    >
                      {t.selectExcelFile}
                    </Button>
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {uploadForm.file && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {uploadForm.file.name}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={loading || !uploadForm.file || !uploadForm.name}
                  className="w-full bg-otis-blue hover:bg-blue-700"
                >
                  {loading ? t.loading : t.upload}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hybrid" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hibrid Template Kezelés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hybridTemplates && (
                  <div className="space-y-4">
                    <div>
                      <Label>Helyi Sablonok ({hybridTemplates.local.length})</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Válassz sablont" />
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
                      <Label>Betöltési Stratégia</Label>
                      <Select value={loadStrategy} onValueChange={setLoadStrategy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_first">Helyi Először</SelectItem>
                          <SelectItem value="cache_first">Cache Először</SelectItem>
                          <SelectItem value="remote_only">Csak Távoli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleTemplateSelect} 
                      disabled={loading || !selectedTemplate}
                      className="w-full"
                    >
                      {loading ? 'Váltás...' : 'Sablon Váltás'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
// src/components/admin/LiftManagement.tsx - JAVÍTOTT (Mobil URL + Duplikáció Fix)

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageContext } from "@/components/language-context";
import { Loader2, Plus, Edit, Trash2, Link, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🔥 ÚJ: API URL DEFINIÁLÁSA
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// =============================================================================
// TYPES
// =============================================================================
interface LiftType {
  id: string;
  code: string;
  name_hu: string;
  name_de: string | null;
  description_hu: string | null;
  description_de: string | null;
  sort_order: number;
  is_active: boolean;
  subtypes: LiftSubtype[];
}

interface LiftSubtype {
  id: string;
  lift_type_id: string;
  code: string;
  name_hu: string;
  name_de: string | null;
  description_hu: string | null;
  description_de: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Template {
  id: string;
  name: string;
  type: string;
  language: string;
  is_active: boolean;
}

interface LiftMapping {
  id: string;
  lift_subtype_id: string;
  question_template_id: string | null;
  protocol_template_id: string | null;
  is_active: boolean;
  notes: string | null;
  subtype?: LiftSubtype;
  liftType?: LiftType;
  questionTemplate?: Template;
  protocolTemplate?: Template;
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function LiftManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { supabase } = useAuth();
  const { t, language } = useLanguageContext();

  // Auth headers helper
  const getAuthHeaders = async () => {
    if (!supabase) throw new Error("Supabase client not available");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch data - 🔥 URL JAVÍTVA
  const { data: liftTypesData, isLoading: loadingTypes } = useQuery<{ success: boolean; data: LiftType[] }>({
    queryKey: ["/api/admin/lift-types"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/lift-types`, { headers });
      if (!res.ok) throw new Error('Failed to fetch lift types');
      return res.json();
    }
  });

  const { data: mappingsData, isLoading: loadingMappings } = useQuery<{ success: boolean; data: LiftMapping[] }>({
    queryKey: ["/api/admin/lift-mappings"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/lift-mappings`, { headers });
      if (!res.ok) throw new Error('Failed to fetch mappings');
      return res.json();
    }
  });

  const { data: templatesData } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/templates`, { headers });
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    }
  });

  // Dialogs state
  const [createTypeDialog, setCreateTypeDialog] = useState(false);
  const [createSubtypeDialog, setCreateSubtypeDialog] = useState(false);
  const [createMappingDialog, setCreateMappingDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; id: string; type: 'type' | 'subtype' | 'mapping' }>({ open: false, id: '', type: 'mapping' });
  
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");

  // Form state
  const [typeForm, setTypeForm] = useState({
    code: "",
    nameHu: "",
    nameDe: "",
    descriptionHu: "",
    descriptionDe: "",
  });

  const [subtypeForm, setSubtypeForm] = useState({
    liftTypeId: "",
    code: "",
    nameHu: "",
    nameDe: "",
    descriptionHu: "",
    descriptionDe: "",
  });

  const [mappingForm, setMappingForm] = useState({
    liftSubtypeId: "",
    questionTemplateId: "",
    protocolTemplateId: "",
    notes: "",
  });

  // ==========================================================================
  // MUTATIONS (JAVÍTOTT URL + HIBAKEZELÉS)
  // ==========================================================================
  
  // --- TYPE MUTATIONS ---
  const createTypeMutation = useMutation({
    mutationFn: async (data: typeof typeForm) => {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTOTT URL
      const response = await fetch(`${API_BASE_URL}/api/admin/lift-types`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      
      // 🔥 JAVÍTOTT HIBAKEZELÉS (DUPLIKÁCIÓ)
      if (response.status === 400 || response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ez a lift típus kód már létezik!");
      }

      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lift-types"] });
      toast({ title: t("success"), description: t("type_created_successfully") });
      setCreateTypeDialog(false);
      setTypeForm({ code: "", nameHu: "", nameDe: "", descriptionHu: "", descriptionDe: "" });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  // --- SUBTYPE MUTATIONS ---
  const createSubtypeMutation = useMutation({
    mutationFn: async (data: typeof subtypeForm) => {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTOTT URL
      const response = await fetch(`${API_BASE_URL}/api/admin/lift-subtypes`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      // 🔥 JAVÍTOTT HIBAKEZELÉS
      if (response.status === 400 || response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ez az altípus kód már létezik ehhez a lifthez!");
      }

      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lift-types"] });
      toast({ title: t("success"), description: t("subtype_created_successfully") });
      setCreateSubtypeDialog(false);
      setSubtypeForm({
        liftTypeId: "",
        code: "",
        nameHu: "",
        nameDe: "",
        descriptionHu: "",
        descriptionDe: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  // --- MAPPING MUTATIONS ---
  const createMappingMutation = useMutation({
    mutationFn: async (data: typeof mappingForm) => {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTOTT URL
      const response = await fetch(`${API_BASE_URL}/api/admin/lift-mappings`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      // 🔥 JAVÍTOTT HIBAKEZELÉS
      if (response.status === 400 || response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ehhez az altípushoz már létezik aktív hozzárendelés! Előbb deaktiváld a régit.");
      }

      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lift-mappings"] });
      toast({ title: t("success"), description: t("mapping_created_successfully") });
      setCreateMappingDialog(false);
      setMappingForm({
        liftSubtypeId: "",
        questionTemplateId: "",
        protocolTemplateId: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const activateMappingMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTOTT URL
      const response = await fetch(`${API_BASE_URL}/api/admin/lift-mappings/${mappingId}/activate`, {
        method: "POST",
        headers,
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lift-mappings"] });
      toast({ title: t("success"), description: t("mapping_activated_successfully") });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  // --- DELETE MUTATION (TÖRLÉS JAVÍTÁSA) ---
  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const headers = await getAuthHeaders();
      // 🔥 JAVÍTOTT URL (Itt volt a mobil hiba forrása!)
      const response = await fetch(`${API_BASE_URL}/api/admin/lift-mappings/${mappingId}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lift-mappings"] });
      toast({ title: t("success"), description: "Mapping deleted successfully" });
      setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loadingTypes || loadingMappings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const liftTypes = liftTypesData?.data || [];
  const mappings = mappingsData?.data || [];
  const templates = templatesData || [];

  const questionTemplates = templates.filter((t) => t.type === "unified");
  const protocolTemplates = templates.filter((t) => t.type === "protocol");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("lift_type_management")}</h2>
        <Button onClick={() => setCreateTypeDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("create_new_type")}
        </Button>
      </div>

      <Tabs defaultValue="mappings">
        <TabsList>
          <TabsTrigger value="mappings">{t("mappings")}</TabsTrigger>
          <TabsTrigger value="types">{t("types")}</TabsTrigger>
        </TabsList>

        {/* TYPES TAB */}
        <TabsContent value="types" className="space-y-4">
          {liftTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {language === 'de' && type.name_de ? type.name_de : type.name_hu}
                      <Badge variant="outline">{type.code}</Badge>
                      {type.is_active ? (
                        <Badge variant="default">{t("active")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("inactive")}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {language === 'de' && type.description_de ? type.description_de : type.description_hu}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toast({ title: "Info", description: "Edit feature coming soon" })}>
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedType(type.id);
                        setSubtypeForm({ ...subtypeForm, liftTypeId: type.id });
                        setCreateSubtypeDialog(true);
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("subtypes")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{t("subtypes")}:</h4>
                  <div className="grid gap-2">
                    {type.subtypes.map((subtype) => (
                      <div
                        key={subtype.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {language === 'de' && subtype.name_de ? subtype.name_de : subtype.name_hu}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {subtype.code}
                          </Badge>
                        </div>
                        <div className="flex gap-2 items-center">
                          {subtype.is_active ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="w-3 h-3 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* MAPPINGS TAB */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateMappingDialog(true)}>
              <Link className="w-4 h-4 mr-2" />
              {t("create_new_mapping")}
            </Button>
          </div>

          {mappings.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nincs még létrehozva sablon párosítás. Hozz létre egyet a fenti gombbal!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {mappings.map((mapping) => (
              <Card key={mapping.id} className={mapping.is_active ? "border-blue-500 border-2 shadow-md" : "opacity-80"}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Badge variant="outline" className="bg-slate-100">
                        {mapping.subtype?.code || "?"}
                      </Badge>
                      {language === 'de' && mapping.subtype?.name_de 
                        ? mapping.subtype.name_de 
                        : mapping.subtype?.name_hu || t("unknown_subtype")}
                      
                      {mapping.is_active && (
                        <Badge className="bg-green-600 hover:bg-green-700 ml-2">
                          {t("active")}
                        </Badge>
                      )}
                    </CardTitle>
                    
                    <div className="flex gap-2">
                      {!mapping.is_active && (
                        <Button
                          onClick={() => activateMappingMutation.mutate(mapping.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {t("activate")}
                        </Button>
                      )}
                      
                      {/* Törlés gomb mindenkinek elérhető (de megerősítést kér) */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmDialog({ open: true, id: mapping.id, type: 'mapping' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                    <div className="bg-slate-50 p-3 rounded border">
                      <Label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">{t("question_template")}:</Label>
                      <p className="font-medium flex items-center gap-2">
                        {mapping.questionTemplate ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {mapping.questionTemplate.name}
                          </>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> {t("not_specified")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border">
                      <Label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">{t("protocol_template")}:</Label>
                      <p className="font-medium flex items-center gap-2">
                        {mapping.protocolTemplate ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {mapping.protocolTemplate.name}
                          </>
                        ) : (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {t("not_specified")} (Opcionális)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {mapping.notes && (
                    <div className="mt-2 text-xs text-gray-500 italic border-t pt-2">
                      Note: {mapping.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE TYPE DIALOG */}
      <Dialog open={createTypeDialog} onOpenChange={setCreateTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create_new_type")}</DialogTitle>
            <DialogDescription>{t("create_new_type_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">{t("type_code")} *</Label>
              <Input
                id="code"
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                placeholder="MOD"
              />
            </div>
            <div>
              <Label htmlFor="nameHu">{t("type_name_hu")} *</Label>
              <Input
                id="nameHu"
                value={typeForm.nameHu}
                onChange={(e) => setTypeForm({ ...typeForm, nameHu: e.target.value })}
                placeholder="Modernizáció"
              />
            </div>
            <div>
              <Label htmlFor="nameDe">{t("type_name_de")}</Label>
              <Input
                id="nameDe"
                value={typeForm.nameDe}
                onChange={(e) => setTypeForm({ ...typeForm, nameDe: e.target.value })}
                placeholder="Modernisierung"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTypeDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => createTypeMutation.mutate(typeForm)}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE SUBTYPE DIALOG */}
      <Dialog open={createSubtypeDialog} onOpenChange={setCreateSubtypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create_new_subtype")}</DialogTitle>
            <DialogDescription>{t("create_new_subtype_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subtypeCode">{t("type_code")} *</Label>
              <Input
                id="subtypeCode"
                value={subtypeForm.code}
                onChange={(e) =>
                  setSubtypeForm({ ...subtypeForm, code: e.target.value.toUpperCase() })
                }
                placeholder="MOD_DR"
              />
            </div>
            <div>
              <Label htmlFor="subtypeNameHu">{t("type_name_hu")} *</Label>
              <Input
                id="subtypeNameHu"
                value={subtypeForm.nameHu}
                onChange={(e) => setSubtypeForm({ ...subtypeForm, nameHu: e.target.value })}
                placeholder="Drótköteles"
              />
            </div>
            <div>
              <Label htmlFor="subtypeNameDe">{t("type_name_de")}</Label>
              <Input
                id="subtypeNameDe"
                value={subtypeForm.nameDe}
                onChange={(e) => setSubtypeForm({ ...subtypeForm, nameDe: e.target.value })}
                placeholder="Seilaufzug"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSubtypeDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => createSubtypeMutation.mutate(subtypeForm)}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE MAPPING DIALOG */}
      <Dialog open={createMappingDialog} onOpenChange={setCreateMappingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("create_new_mapping")}</DialogTitle>
            <DialogDescription>
              {t("create_new_mapping_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mappingSubtype">{t("select_lift_subtype")} *</Label>
              <Select
                value={mappingForm.liftSubtypeId}
                onValueChange={(value) =>
                  setMappingForm({ ...mappingForm, liftSubtypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_subtype")} />
                </SelectTrigger>
                <SelectContent>
                  {liftTypes.flatMap((type) =>
                    type.subtypes.map((subtype) => (
                      <SelectItem key={subtype.id} value={subtype.id}>
                        {language === 'de' && type.name_de ? type.name_de : type.name_hu} -{' '}
                        {language === 'de' && subtype.name_de ? subtype.name_de : subtype.name_hu} ({subtype.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="questionTemplate">{t("question_template")} *</Label>
              <Select
                value={mappingForm.questionTemplateId}
                onValueChange={(value) =>
                  setMappingForm({ ...mappingForm, questionTemplateId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_question_template")} />
                </SelectTrigger>
                <SelectContent>
                  {questionTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="protocolTemplate">{t("protocol_template")} (Opcionális)</Label>
              <Select
                value={mappingForm.protocolTemplateId}
                onValueChange={(value) =>
                  setMappingForm({ ...mappingForm, protocolTemplateId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_protocol_template")} />
                </SelectTrigger>
                <SelectContent>
                  {protocolTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={mappingForm.notes}
                onChange={(e) => setMappingForm({ ...mappingForm, notes: e.target.value })}
                placeholder={t("optional_notes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMappingDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => createMappingMutation.mutate(mappingForm)}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_confirmation_title")}</DialogTitle>
            <DialogDescription>
              {t("delete_mapping_warning")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false })}>
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteConfirmDialog.type === 'mapping') {
                  deleteMappingMutation.mutate(deleteConfirmDialog.id);
                }
              }}
            >
              {t("confirm_delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
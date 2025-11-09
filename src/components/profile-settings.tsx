// src/components/profile-settings.tsx - LOCALIZED & THEME AWARE VERSION

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguageContext } from "@/components/language-context";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Mail, MapPin, FolderOpen, Shield, LogOut, Crown, Sparkles, Zap, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProfileSettings() {
  const { user, profile, refreshProfile, signOut, loading: authLoading, supabase } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { t, language } = useLanguageContext(); // ← ÚJ HOOK HASZNÁLAT
  const [loading, setLoading] = useState(false);
  const [isHoveringLogout, setIsHoveringLogout] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    google_drive_folder_id: '',
  });

  useEffect(() => {
    setFormData({
      name: profile?.name || '',
      address: profile?.address || '',
      google_drive_folder_id: profile?.google_drive_folder_id || '',
    });
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t.error || 'Error',
        description: t.Profile?.noUser || 'No user logged in.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const isCreating = !profile;
    const method = isCreating ? 'POST' : 'PATCH';
    const url = isCreating ? '/api/profiles' : `/api/profiles/${profile.user_id}`;
    
    const bodyPayload = isCreating 
      ? { ...formData, user_id: user.id } 
      : formData;

    try {
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (isCreating ? t.Profile?.createFailed : t.Profile?.updateFailed) || 'Failed');
      }

      await refreshProfile();

      toast({
        title: `${isCreating ? (t.Profile?.createSuccessTitle || 'Created!') : (t.Profile?.saveSuccessTitle || 'Saved!')} ✅`,
        description: isCreating ? (t.Profile?.createSuccessDesc || 'Profile created.') : (t.Profile?.saveSuccessDesc || 'Profile updated.'),
      });
    } catch (error: any) {
      console.error('Profile save/create error:', error);
      toast({
        title: isCreating ? (t.Profile?.createErrorTitle || 'Creation Error') : (t.Profile?.saveErrorTitle || 'Update Error'),
        description: error.message || (isCreating ? t.Profile?.createFailed : t.Profile?.updateFailed) || 'Failed to save profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t.Profile?.logoutSuccessTitle || 'Signed out successfully',
        description: t.Profile?.logoutSuccessDesc || 'Goodbye! 👋',
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast({
        title: t.Profile?.logoutErrorTitle || 'Sign out error',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">{t.Profile?.loading || 'Loading profile...'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentProfile = profile || { email: user?.email };
  const isCreating = !profile;

  const hasChanges = 
    formData.name !== (currentProfile?.name || '') ||
    formData.address !== (currentProfile?.address || '') ||
    formData.google_drive_folder_id !== (currentProfile?.google_drive_folder_id || '');

  // ========================================
  // MODERN THEME RENDER
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="w-full space-y-6">
        {/* 🎨 OTIS KÉK GLASSMORPHISM PROFILE HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
          
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              {/* User Avatar & Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-60 animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                    {currentProfile?.name?.charAt(0)?.toUpperCase() || currentProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
                    {currentProfile?.role === 'admin' && (
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                    {currentProfile?.name || (isCreating ? (t.Profile?.createTitle || 'Create New Profile') : (t.Profile?.userRole || 'User'))}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Mail className="h-4 w-4" />
                    <span>{currentProfile?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={currentProfile?.role === 'admin' ? 'default' : 'secondary'}
                      className="gap-1 shadow-sm bg-gradient-to-r from-blue-500 to-sky-500 text-white border-0"
                    >
                      <Shield className="h-3 w-3" />
                      {currentProfile?.role || 'user'}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Sparkles className="h-3 w-3 text-cyan-500" />
                      <span>{isCreating ? (t.Profile?.statusNew || 'New profile') : (t.Profile?.statusActive || 'Active')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🎨 SPECTACULAR LOGOUT BUTTON */}
              <div className="relative">
                <button
                  onClick={handleSignOut}
                  onMouseEnter={() => setIsHoveringLogout(true)}
                  onMouseLeave={() => setIsHoveringLogout(false)}
                  className="relative overflow-hidden group"
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-500 ${isHoveringLogout ? 'animate-pulse' : ''}`}></div>
                  
                  <div className={`relative bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-2xl transition-all duration-300 ${isHoveringLogout ? 'scale-105' : 'scale-100'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-transform duration-700 ${isHoveringLogout ? 'translate-x-full' : '-translate-x-full'}`}></div>
                    
                    <div className="relative flex items-center gap-3 px-6 py-3">
                      <div className="relative">
                        <Power className={`h-5 w-5 text-white transition-all duration-300 ${isHoveringLogout ? 'rotate-180 scale-110' : 'rotate-0'}`} />
                        {isHoveringLogout && (
                          <>
                            <Zap className="absolute -top-2 -right-2 h-3 w-3 text-yellow-300 animate-ping" />
                            <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-pink-300 animate-pulse" />
                          </>
                        )}
                      </div>
                      
                      <span className={`text-white font-semibold transition-all duration-300 hidden sm:inline ${isHoveringLogout ? 'tracking-wider' : 'tracking-normal'}`}>
                        {t.Profile?.logout || 'Sign out'}
                      </span>
                    </div>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-300 ${isHoveringLogout ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN FORM CARD */}
        <Card className="w-full border-2 border-blue-100 dark:border-blue-900/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white">
                <User className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                {isCreating ? (t.Profile?.createTitle || 'Create Profile') : (t.Profile?.editTitle || 'Edit Profile')}
              </span>
            </CardTitle>
            <CardDescription>
              {isCreating 
                ? (t.Profile?.createDesc || 'Create your first profile by entering your details')
                : (t.Profile?.editDesc || 'Enter or update your profile details')
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 text-blue-600" />
                  {t.Profile?.nameLabel || 'Name'}
                </Label>
                <div className="relative group">
                  <Input
                    id="name"
                    data-testid="input-profile-name"
                    placeholder={t.Profile?.namePlaceholder || 'Your full name'}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pl-4 pr-10 group-hover:border-blue-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse transition-opacity"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {t.Profile?.addressLabel || 'Address'}
                </Label>
                <div className="relative group">
                  <Input
                    id="address"
                    data-testid="input-profile-address"
                    placeholder={t.Profile?.addressPlaceholder || 'Street, number, city'}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pl-4 pr-10 group-hover:border-blue-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse transition-opacity"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_drive_folder_id" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  {t.Profile?.driveLabel || 'Google Drive Folder ID'}
                </Label>
                <div className="relative group">
                  <Input
                    id="google_drive_folder_id"
                    data-testid="input-profile-drive-folder"
                    placeholder="1AbC2DeF3GhI4JkL5MnO6PqR..."
                    value={formData.google_drive_folder_id}
                    onChange={(e) => handleChange('google_drive_folder_id', e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 pl-4 pr-10 group-hover:border-blue-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse transition-opacity"></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-cyan-500" />
                  {t.Profile?.driveHelp || 'Folder ID where protocols will be uploaded (optional).'}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="relative">
              <Button
                data-testid="button-save-profile"
                onClick={handleSave}
                disabled={(!hasChanges && !isCreating) || loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-700 hover:via-sky-600 hover:to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isCreating ? (t.Profile?.creating || 'Creating...') : (t.Profile?.saving || 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isCreating ? (t.Profile?.createBtn || 'Create Profile') : (t.Profile?.saveBtn || 'Save Profile')}
                    </>
                  )}
                </span>
                
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
              </Button>
            </div>

            {/* Status indicator */}
            {hasChanges && !loading && !isCreating && (
              <div className="flex items-center justify-center gap-2">
                <div className="relative flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">{t.Profile?.unsavedChanges || 'Unsaved changes'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME RENDER
  // ========================================
  return (
    <div className="w-full space-y-6">
      {/* Classic Profile Header */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Simple avatar */}
              <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow">
                {currentProfile?.name?.charAt(0)?.toUpperCase() || currentProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              
              <div>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  {currentProfile?.name || (isCreating ? (t.Profile?.createTitle || 'Create New Profile') : (t.Profile?.userRole || 'User'))}
                  {currentProfile?.role === 'admin' && (
                    <Badge className="bg-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {currentProfile?.email || user?.email}
                </CardDescription>
              </div>
            </div>
            
            {/* Simple Logout Button */}
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.Profile?.logout || 'Sign out'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-classic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.Profile?.nameLabel || 'Name'}
            </Label>
            <Input
              id="name-classic"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t.Profile?.namePlaceholder || 'Your full name'}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-classic" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t.Profile?.addressLabel || 'Address'}
            </Label>
            <Input
              id="address-classic"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t.Profile?.addressPlaceholder || 'Street, number, city'}
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drive-classic" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              {t.Profile?.driveLabel || 'Google Drive Folder ID'}
            </Label>
            <Input
              id="drive-classic"
              value={formData.google_drive_folder_id}
              onChange={(e) => handleChange('google_drive_folder_id', e.target.value)}
              placeholder="1AbC2DeF3GhI4JkL5MnO6PqR..."
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">
              {t.Profile?.driveHelp || 'Folder ID where protocols will be uploaded (optional).'}
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={(!hasChanges && !isCreating) || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isCreating ? (t.Profile?.creating || 'Creating...') : (t.Profile?.saving || 'Saving...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? (t.Profile?.createBtn || 'Create Profile') : (t.Profile?.saveBtn || 'Save Profile')}
              </>
            )}
          </Button>

          {hasChanges && !loading && !isCreating && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ {t.Profile?.unsavedChanges || 'Unsaved changes'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
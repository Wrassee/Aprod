// src/components/profile-settings.tsx - OTIS KÉK ULTRA MODERN VERZIÓ

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Mail, MapPin, FolderOpen, Shield, LogOut, Crown, Sparkles, Zap, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProfileSettings() {
  const { user, profile, refreshProfile, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isHoveringLogout, setIsHoveringLogout] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    address: profile?.address || '',
    google_drive_folder_id: profile?.google_drive_folder_id || '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        address: profile.address || '',
        google_drive_folder_id: profile.google_drive_folder_id || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !profile) {
      toast({
        title: 'Hiba',
        description: 'Nincs bejelentkezett felhasználó.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      if (!session) throw new Error('Nincs aktív session');

      const response = await fetch(`/api/profiles/${profile.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sikertelen frissítés');
      }

      await refreshProfile();

      toast({
        title: 'Sikeres mentés! ✅',
        description: 'A profil adataid frissítve lettek.',
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Frissítési hiba',
        description: error.message || 'Nem sikerült frissíteni a profilt.',
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
        title: 'Sikeres kijelentkezés',
        description: 'Viszlát! 👋',
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast({
        title: 'Kijelentkezési hiba',
        variant: 'destructive',
      });
    }
  };

  const hasChanges = 
    formData.name !== (profile?.name || '') ||
    formData.address !== (profile?.address || '') ||
    formData.google_drive_folder_id !== (profile?.google_drive_folder_id || '');

  if (authLoading || !profile) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Profil betöltése...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 🎨 OTIS KÉK GLASSMORPHISM PROFILE HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
        
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            {/* User Avatar & Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                {/* Avatar with glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-60 animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                  {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                  {profile?.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                  {profile?.name || 'Felhasználó'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={profile?.role === 'admin' ? 'default' : 'secondary'}
                    className="gap-1 shadow-sm bg-gradient-to-r from-blue-500 to-sky-500 text-white border-0"
                  >
                    <Shield className="h-3 w-3" />
                    {profile?.role || 'user'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                    <span>Aktív</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎨 SPECTACULAR LOGOUT BUTTON - OTIS KÉK */}
            <div className="relative">
              <button
                onClick={handleSignOut}
                onMouseEnter={() => setIsHoveringLogout(true)}
                onMouseLeave={() => setIsHoveringLogout(false)}
                className="relative overflow-hidden group"
              >
                {/* Outer glow ring */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-500 ${isHoveringLogout ? 'animate-pulse' : ''}`}></div>
                
                {/* Main button background */}
                <div className={`relative bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-2xl transition-all duration-300 ${isHoveringLogout ? 'scale-105' : 'scale-100'}`}>
                  {/* Animated shine overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-transform duration-700 ${isHoveringLogout ? 'translate-x-full' : '-translate-x-full'}`}></div>
                  
                  {/* Button content */}
                  <div className="relative flex items-center gap-3 px-6 py-3">
                    {/* Icon with rotation effect */}
                    <div className="relative">
                      <Power className={`h-5 w-5 text-white transition-all duration-300 ${isHoveringLogout ? 'rotate-180 scale-110' : 'rotate-0'}`} />
                      
                      {/* Particle effects on hover */}
                      {isHoveringLogout && (
                        <>
                          <Zap className="absolute -top-2 -right-2 h-3 w-3 text-yellow-300 animate-ping" />
                          <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-pink-300 animate-pulse" />
                        </>
                      )}
                    </div>
                    
                    {/* Text with gradient on hover */}
                    <span className={`text-white font-semibold transition-all duration-300 hidden sm:inline ${isHoveringLogout ? 'tracking-wider' : 'tracking-normal'}`}>
                      Kijelentkezés
                    </span>
                  </div>
                  
                  {/* Bottom glow line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-300 ${isHoveringLogout ? 'opacity-100' : 'opacity-0'}`}></div>
                </div>

                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-2xl">
                  <div className={`absolute inset-0 bg-white rounded-2xl transition-opacity duration-150 ${isHoveringLogout ? 'opacity-0' : 'opacity-0'}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FORM CARD - OTIS KÉK */}
      <Card className="w-full border-2 border-blue-100 dark:border-blue-900/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white">
              <User className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
              Profil Szerkesztése
            </span>
          </CardTitle>
          <CardDescription>
            Add meg vagy frissítsd a profil adataidat
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-blue-600" />
                Név
              </Label>
              <div className="relative group">
                <Input
                  id="name"
                  data-testid="input-profile-name"
                  placeholder="Teljes neved"
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
                Cím
              </Label>
              <div className="relative group">
                <Input
                  id="address"
                  data-testid="input-profile-address"
                  placeholder="Utca, házszám, város"
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
                Google Drive Mappa ID
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
                Az a mappa ID, ahova a protokollokat feltöltjük (opcionális).
              </p>
            </div>
          </div>

          {/* Save Button with OTIS blue gradient */}
          <div className="relative">
            <Button
              data-testid="button-save-profile"
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-700 hover:via-sky-600 hover:to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mentés...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Profil Mentése
                  </>
                )}
              </span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
            </Button>
          </div>

          {/* Status indicator */}
          {hasChanges && !loading && (
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Van mentetlen változtatás</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
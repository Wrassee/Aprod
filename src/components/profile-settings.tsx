import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Mail, MapPin, FolderOpen, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProfileSettings() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    address: profile?.address || '',
    google_drive_folder_id: profile?.google_drive_folder_id || '',
  });

  // CRITICAL FIX: Re-sync form state when profile loads
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
      // Get current session for auth token
      const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Nincs aktív session');
      }

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

  const hasChanges = 
    formData.name !== (profile?.name || '') ||
    formData.address !== (profile?.address || '') ||
    formData.google_drive_folder_id !== (profile?.google_drive_folder_id || '');

  // Show loading state while profile is being fetched
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil Beállítások
        </CardTitle>
        <CardDescription>
          Szerkeszd a profilodat és add meg a szükséges adatokat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info Display */}
        <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
            </div>
            <span className="text-sm text-gray-900 dark:text-white">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</span>
            </div>
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
              {profile?.role || 'user'}
            </Badge>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Név
            </Label>
            <Input
              id="name"
              data-testid="input-profile-name"
              placeholder="Teljes neved"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cím
            </Label>
            <Input
              id="address"
              data-testid="input-profile-address"
              placeholder="Utca, házszám, város"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_drive_folder_id" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Google Drive Mappa ID
            </Label>
            <Input
              id="google_drive_folder_id"
              data-testid="input-profile-drive-folder"
              placeholder="1AbC2DeF3GhI4JkL5MnO6PqR..."
              value={formData.google_drive_folder_id}
              onChange={(e) => handleChange('google_drive_folder_id', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Az a mappa ID, ahova a protokollokat feltöltjük (opcionális).
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          data-testid="button-save-profile"
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mentés...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Profil Mentése
            </>
          )}
        </Button>

        {hasChanges && !loading && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Van mentetlen változtatás
          </p>
        )}
      </CardContent>
    </Card>
  );
}

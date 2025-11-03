// src/components/user-list.tsx - THEME AWARE VERSION
import React, { useState, useEffect } from 'react';
import { useLanguageContext } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, User, Loader2, AlertCircle, Users, Shield, Sparkles, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'user' | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export function UserList() {
  const { t, language } = useLanguageContext();
  const { toast } = useToast();
  const { supabase } = useAuth();
  const { theme } = useTheme(); // ← THEME HOOK
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (supabase) {
      fetchUsers();
    }
  }, [supabase]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching users from API...');
      
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error(t.Admin?.UserManagement?.errorAuth || 'Authentication required');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.Admin?.UserManagement?.errorFetch || 'Failed to fetch users');
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} users`);
      setUsers(data);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: t.error || 'Hiba',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    const confirmMessage = t.Admin?.UserManagement?.confirmDelete?.replace('{name}', userName || 'ezt a felhasználót') 
      || `Biztosan törölni szeretnéd: ${userName || 'ezt a felhasználót'}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingUserId(userId);
    
    try {
      console.log(`🗑️ Attempting to delete user: ${userId}`);
      
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error(t.Admin?.UserManagement?.errorAuth || 'Authentication required');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.Admin?.UserManagement?.errorDelete || 'Failed to delete user');
      }
      
      console.log(`✅ User ${userId} deleted successfully`);
      
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
      
      toast({
        title: t.success || 'Siker',
        description: result.message || t.Admin?.UserManagement?.deleteSuccess || 'Felhasználó sikeresen törölve.',
      });

    } catch (error: any) {
      console.error(`❌ Error deleting user ${userId}:`, error);
      toast({
        title: t.error || 'Hiba',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // ========================================
  // MODERN THEME - Loading State
  // ========================================
  if (loading && theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center items-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse" />
                <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
              </div>
              <p className="mt-4 text-gray-600">
                {language === 'hu' ? 'Betöltés...' : 'Loading...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Loading State
  // ========================================
  if (loading && theme === 'classic') {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========================================
  // MODERN THEME - Empty State
  // ========================================
  if (users.length === 0 && theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gray-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <AlertCircle className="relative h-16 w-16 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                {t.Admin?.UserManagement?.noUsers || 'Nincsenek felhasználók.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Empty State
  // ========================================
  if (users.length === 0 && theme === 'classic') {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p>{t.Admin?.UserManagement?.noUsers || 'Nincsenek felhasználók.'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========================================
  // MODERN THEME - Normal View
  // ========================================
  if (theme === 'modern') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
              </span>
              <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-base mt-2">
              {t.Admin?.UserManagement?.description || 'Az összes regisztrált felhasználó kezelése'}
              {' • '}
              <Badge className="bg-gradient-to-r from-blue-500 to-sky-500 text-white border-0 px-3 py-1">
                {users.length} {t.Admin?.UserManagement?.usersCount || 'felhasználó'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20 hover:bg-gradient-to-r hover:from-blue-50 hover:via-sky-50 hover:to-cyan-50">
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        {t.Admin?.UserManagement?.table?.name || 'Név'}
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      {t.Admin?.UserManagement?.table?.email || 'Email'}
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        {t.Admin?.UserManagement?.table?.role || 'Jogosultság'}
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {t.Admin?.UserManagement?.table?.created || 'Létrehozva'}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-bold text-gray-700">
                      {t.Admin?.UserManagement?.table?.actions || 'Műveletek'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow 
                      key={user.user_id}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-transparent hover:to-cyan-50/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {user.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0' 
                              : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white border-0'
                          } px-3 py-1 shadow-md`}
                        >
                          {user.role === 'admin' 
                            ? (t.Admin?.UserManagement?.roleAdmin || 'Admin')
                            : (t.Admin?.UserManagement?.roleUser || 'Felhasználó')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {(() => {
                          try {
                            const date = new Date(user.created_at);
                            if (isNaN(date.getTime())) {
                              return '-';
                            }
                            return formatDate(date, language);
                          } catch {
                            return '-';
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                            disabled={deletingUserId === user.user_id}
                            className="group relative px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t.Admin?.UserManagement?.buttons?.delete || 'Törlés'}
                          >
                            {deletingUserId === user.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME - Normal View
  // ========================================
  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          {t.Admin?.UserManagement?.title || 'Felhasználók Kezelése'}
        </CardTitle>
        <CardDescription>
          {t.Admin?.UserManagement?.description || 'Az összes regisztrált felhasználó kezelése'}
          {' • '}
          <span className="font-semibold">{users.length}</span>
          {' '}
          {t.Admin?.UserManagement?.usersCount || 'felhasználó'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.Admin?.UserManagement?.table?.name || 'Név'}</TableHead>
                <TableHead>{t.Admin?.UserManagement?.table?.email || 'Email'}</TableHead>
                <TableHead>{t.Admin?.UserManagement?.table?.role || 'Jogosultság'}</TableHead>
                <TableHead>{t.Admin?.UserManagement?.table?.created || 'Létrehozva'}</TableHead>
                <TableHead className="text-right">
                  {t.Admin?.UserManagement?.table?.actions || 'Műveletek'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {user.full_name || '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={user.role === 'admin' ? 'bg-blue-600' : ''}
                    >
                      {user.role === 'admin' 
                        ? (t.Admin?.UserManagement?.roleAdmin || 'Admin')
                        : (t.Admin?.UserManagement?.roleUser || 'Felhasználó')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {(() => {
                      try {
                        const date = new Date(user.created_at);
                        if (isNaN(date.getTime())) {
                          return '-';
                        }
                        return formatDate(date, language);
                      } catch {
                        return '-';
                      }
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                        disabled={deletingUserId === user.user_id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        title={t.Admin?.UserManagement?.buttons?.delete || 'Törlés'}
                      >
                        {deletingUserId === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
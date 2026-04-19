// src/contexts/auth-context.tsx - JAVÍTOTT (Mobil Profil Betöltés Fix)

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session, SupabaseClient, AuthError } from '@supabase/supabase-js';

// 🔥 ÚJ: API URL DEFINIÁLÁSA MOBILHOZ
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Ez a "Profile" objektum típusa, ahogy az adatbázisban van
interface Profile {
  user_id: string;
  email: string;
  role: string;
  name?: string;
  address?: string;
  google_drive_folder_id?: string;
  // Bármi más, ami a 'profiles' táblában van
}

interface AuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  profile: Profile | null; // ← VALÓDI PROFIL OBJEKTUM
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>; // ← VALÓDI FÜGGVÉNY
  role: string;
  emailConfirmed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ============================================
  // ✅ JAVÍTOTT PROFIL FRISSÍTŐ FÜGGVÉNY (FETCH-csel az API-ból)
  // ============================================
  const refreshProfile = async (currentUser: User | null = user, currentSession: Session | null = session) => {
    if (currentUser && currentSession) {
      console.log('🔄 AuthContext - Refreshing profile from API for user:', currentUser.id);
      try {
        // ✅ A backend /api/profiles/:userId végpontját hívjuk
        // 🔥 JAVÍTÁS: API_BASE_URL használata, hogy mobilon is megtalálja a szervert
        const response = await fetch(`${API_BASE_URL}/api/profiles/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('✅ AuthContext - Profile loaded from API:', profileData);
          setProfile(profileData);
        } else if (response.status === 404) {
           console.log('ℹ️ Profile not found in DB (user might need to create it).');
           setProfile(null);
        } else {
          console.warn(`⚠️ Error fetching profile (Status: ${response.status}). Setting profile to null for now.`);
          setProfile(null);
        }
      } catch (apiError) {
        console.error('❌ API Error fetching profile:', apiError);
        setProfile(null);
      }
    } else {
      console.log('ℹ️ No user, clearing profile.');
      setProfile(null);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔧 AuthContext - Initializing...');
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // ✅ Profil betöltése az API-n keresztül
          await refreshProfile(session.user, session); 
          console.log('✅ User authenticated:', {
            email: session.user.email,
            role: session.user.app_metadata?.role || 'user',
            emailConfirmed: session.user.email_confirmed_at !== null,
          });
        }
      } catch (error) {
        console.error("Error during initial auth check:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log('✅ AuthContext - Initialized!');
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);

      // ✅ JAVÍTVA: Profil frissítése be- és kijelentkezéskor
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'USER_UPDATED') {
        await refreshProfile(session?.user ?? null, session);
      }
      if (_event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================
  // BEJELENTKEZÉS
  // ============================================
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error.message, error);
      throw error;
    }
    
    console.log('✅ Sign in successful');
    if (!data.session) throw new Error('No session returned from sign in');

    // ✅ Profil betöltése bejelentkezés után az API-ból
    await refreshProfile(data.user, data.session);
    return data.session;
  };

  // ============================================
  // REGISZTRÁCIÓ
  // ============================================
  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for email:', email);
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: { email },
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error.message, error);
      throw error;
    }
    
    console.log('✅ Sign up response - session:', data.session ? 'exists' : 'missing', 'user:', data.user ? 'exists' : 'missing');
    
    if (!data.session) {
      throw new Error('Email confirmation required. Please check your inbox.');
    }

    // ✅ Profil betöltése regisztráció után (a backend middleware már létrehozta)
    await refreshProfile(data.user, data.session);
    return data.session;
  };

  // ============================================
  // KIJELENTKEZÉS
  // ============================================
  const signOut = async () => {
    console.log('👋 Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    setProfile(null); // Profil törlése
    console.log('✅ Sign out successful');
  };

  // ============================================
  // ELFELEJTETT JELSZÓ
  // ============================================
  const resetPasswordForEmail = async (email: string) => {
    try {
      // VITE_APP_URL env változó, vagy ha localhost-on fut, a szerver adja meg a valós URL-t
      const envUrl = import.meta.env.VITE_APP_URL;
      const origin = window.location.origin;
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const appUrl = envUrl || (isLocalhost ? '' : origin);
      
      console.log('📧 Sending password reset email to:', email, 'with redirect:', `${appUrl}/reset-password`);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) {
        console.error('❌ Reset password email error:', error);
      } else {
        console.log('✅ Password reset email sent to:', email);
      }
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  // ============================================
  // JELSZÓ FRISSÍTÉSE
  // ============================================
  const updatePassword = async (newPassword: string) => {
    try {
      console.log('🔐 Updating password for user');
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        console.error('❌ Update password error:', error);
      } else {
        console.log('✅ Password updated successfully');
      }
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as AuthError };
    }
  };

  // ============================================
  // ✅ COMPUTED VALUES - Elsődlegesen a profilból, fallback az auth
  // ============================================
  const role = profile?.role || user?.app_metadata?.role || 'user';
  const emailConfirmed = user?.email_confirmed_at !== null;

  const value = {
    supabase,
    user,
    session,
    profile: profile, // ✅ JAVÍTVA
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    refreshProfile: () => refreshProfile(user, session), // ✅ JAVÍTVA
    role,
    emailConfirmed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
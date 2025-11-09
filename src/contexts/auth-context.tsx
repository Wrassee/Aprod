// src/contexts/auth-context.tsx - SIMPLIFIED WITHOUT PROFILES TABLE

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session, SupabaseClient, AuthError } from '@supabase/supabase-js';

// ✅ EGYSZERŰSÍTETT: Nincs Profile tábla, csak Supabase Auth
interface AuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  profile: any | null; // ← Backward compatibility (mindig null lesz)
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>; // ← Backward compatibility (üres függvény)
  // ✅ Role és email_confirmed közvetlenül a User objektumból
  role: string;
  emailConfirmed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔧 AuthContext - Initializing...');
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
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
    
    if (!data.session) {
      throw new Error('No session returned from sign in');
    }

    return data.session;
  };

  // ============================================
  // REGISZTRÁCIÓ (Email Confirmation támogatással)
  // ============================================
  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for email:', email);
    
    // ✅ Automatikus URL detektálás
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
    
    // Ha nincs session, akkor email megerősítésre vár
    if (!data.session) {
      throw new Error('Email confirmation required. Please check your inbox.');
    }

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
    console.log('✅ Sign out successful');
  };

  // ============================================
  // ✅ ELFELEJTETT JELSZÓ - Email küldése
  // ============================================
  const resetPasswordForEmail = async (email: string) => {
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      
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
  // ✅ JELSZÓ FRISSÍTÉSE (Reset link után)
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
  // ✅ COMPUTED VALUES - közvetlenül a User objektumból
  // ============================================
  const role = user?.app_metadata?.role || user?.user_metadata?.role || 'user';
  const emailConfirmed = user?.email_confirmed_at !== null;

  // ✅ Backward compatibility: refreshProfile üres függvény
  const refreshProfile = async () => {
    console.log('ℹ️ refreshProfile called (no-op - no profiles table)');
  };

  const value = {
    supabase,
    user,
    session,
    profile: null, // ← Backward compatibility
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    refreshProfile, // ← Backward compatibility
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
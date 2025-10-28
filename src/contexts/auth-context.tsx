import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../../shared/schema';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile
  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      // Get current session to attach auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No session available to fetch profile');
        return;
      }

      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };

      const response = await fetch(`/api/profiles/${userId}`, {
        headers: authHeaders,
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        // Profile doesn't exist - create it
        console.log('📝 Creating new profile for user:', userEmail);
        const createResponse = await fetch('/api/profiles', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            user_id: userId,
            email: userEmail,
            role: 'user',
          }),
        });
        
        if (createResponse.ok) {
          const newProfile = await createResponse.json();
          setProfile(newProfile);
          console.log('✅ Profile created successfully');
        } else {
          const errorText = await createResponse.text();
          console.error('❌ Failed to create profile:', errorText);
        }
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
    }
  };

  // Initialize session on mount
  useEffect(() => {
  const checkAuthAndFetchProfile = async () => {
    try {
      // 1. Várjuk meg a session ellenőrzését
      const { data: { session } } = await supabase.auth.getSession();
      
      setSession(session);
      setUser(session?.user ?? null);

      // 2. Ha van session, VÁRJUK MEG a profil betöltését is
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email || '');
      }
    } catch (error) {
      console.error("Error during initial auth check:", error);
    } finally {
      // 3. CSAK MIUTÁN MINDEN BEFEJEZŐDÖTT, állítjuk a loading-ot false-ra
      setLoading(false);
    }
  };

  checkAuthAndFetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    
    console.log('✅ Sign in successful, session:', data.session ? 'exists' : 'missing');
    
    // SECURITY FIX: Only proceed if session exists
    if (!data.session) {
      throw new Error('No session returned from sign in');
    }
    
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
    }

    return data.session;
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { email },
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error.message, error);
      throw error;
    }
    
    console.log('✅ Sign up response - session:', data.session ? 'exists' : 'missing', 'user:', data.user ? 'exists' : 'missing');
    
    // SECURITY FIX: Only proceed if session exists (email confirmation not required)
    if (!data.session) {
      throw new Error('Email confirmation required. Please check your inbox.');
    }
    
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
    }

    return data.session;
  };

  const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
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

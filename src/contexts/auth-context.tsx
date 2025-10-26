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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
      
      setLoading(false);
    });

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { email },
      },
    });

    if (error) throw error;
    
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
    if (error) throw error;
    
    setUser(null);
    setSession(null);
    setProfile(null);
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

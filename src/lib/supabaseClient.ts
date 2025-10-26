import { createClient } from '@supabase/supabase-js';

// Környezetfüggő változók beolvasása
// A 'import.meta.env' csak a Vite kliensoldali környezetben létezik.
// A 'process.env' a Node.js szerveroldali környezetben létezik.
const supabaseUrl =
  typeof import.meta.env !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL;
    
const supabaseAnonKey =
  typeof import.meta.env !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
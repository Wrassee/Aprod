import { createClient } from '@supabase/supabase-js';

// A szerver CSAK a process.env-et használja
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// FONTOS: A szervernek a service key-t kell használnia admin műveletekhez!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Server-side Supabase configuration (URL or Service Key) is missing.');
}

// Létrehozzuk a klienst a service role kulccsal
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
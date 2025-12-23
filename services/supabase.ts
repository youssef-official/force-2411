import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval for browser environments
const getEnv = (key: string, fallback: string) => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL', 'https://ngjxtmzlcbvzselvfubc.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nanh0bXpsY2J2enNlbHZmdWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTE4MzgsImV4cCI6MjA4MTk4NzgzOH0.DuM6zuIIJkpa7BDbd2uL_sErZYnCkXllaBYxZ7-ONek');

export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any;
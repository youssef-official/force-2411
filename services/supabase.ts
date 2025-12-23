import { createClient } from '@supabase/supabase-js';

// Fallback values provided for the demo environment where process.env might not be populated
const supabaseUrl = process.env.SUPABASE_URL || 'https://ngjxtmzlcbvzselvfubc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nanh0bXpsY2J2enNlbHZmdWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTE4MzgsImV4cCI6MjA4MTk4NzgzOH0.DuM6zuIIJkpa7BDbd2uL_sErZYnCkXllaBYxZ7-ONek';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
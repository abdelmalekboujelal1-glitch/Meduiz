import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://blwhndecxzipsvrrifef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2huZGVjeHppcHN2cnJpZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzUxNDcsImV4cCI6MjA4Njk1MTE0N30.Xk_vBxdr-IG4Szs8I6-bEfb743WlWd8YoANwSqK61GI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

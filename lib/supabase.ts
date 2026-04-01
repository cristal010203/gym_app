import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://pccftuwkkuwyxxycqfkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjY2Z0dXdra3V3eXh4eWNxZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTc1ODYsImV4cCI6MjA4OTE5MzU4Nn0.wJ9NEOd5Hm-bF2k4PYDef3xfAB8oPJEQ8GEvu816TqM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
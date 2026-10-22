// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { PortfolioEntry } from '../types/database';

// Ensure environment variables are present at build/runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// We use the anon key here because this is strictly read-only data for the public portfolio
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function to fetch entries for the Ledger
export async function fetchPortfolioEntries(): Promise<PortfolioEntry[]> {
  const { data, error } = await supabase
    .from('portfolio_entries')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Query failed:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    // Gracefully degrade: return empty array to prevent UI crash
    return [];
  }
  
  return data as PortfolioEntry[];
}
// lib/types/database.ts
// Strict database types for Supabase schema

export interface PortfolioEntry {
  id: string;
  type: 'vitals' | 'system_ml' | 'certification' | 'archive';
  title: string;
  summary: string;
  tech_tags: string[]; // Note: snake_case from database
  year?: number; // Optional year field for display
  live_url?: string;
  github_url?: string;
  content?: string;
  updated_at?: string;
}

/**
 * Supabase API-URL und Anon-Key für das Frontend.
 * Standard: Supabase Cloud (Projekt tzfxbgxnjkthxwvoeyse). Keine .env nötig.
 * Optional: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local für lokales Supabase.
 */

const CLOUD_PROJECT_ID = "tzfxbgxnjkthxwvoeyse";
const CLOUD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZnhiZ3huamt0aHh3dm9leXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjMyNzksImV4cCI6MjA3NzkzOTI3OX0.ppdC65PkGV4rizRXujNYqU3BDwnAnRCzTvX7LFlmyUk";

/** API-Basis-URL (Standard: Cloud; optional .env für lokal) */
export const supabaseUrl: string =
  import.meta.env.VITE_SUPABASE_URL ?? `https://${CLOUD_PROJECT_ID}.supabase.co`;

/** Anon-Key (Standard: Cloud-Projekt; optional .env für lokal) */
export const publicAnonKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? CLOUD_ANON_KEY;

/** Projekt-ID (tzfxbgxnjkthxwvoeyse oder "local" bei VITE_SUPABASE_URL) */
export const projectId: string =
  import.meta.env.VITE_SUPABASE_URL != null && import.meta.env.VITE_SUPABASE_URL !== ""
    ? "local"
    : CLOUD_PROJECT_ID;

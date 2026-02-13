/**
 * Central dependency provider for visudev-server.
 * Infrastruktur-Abhängigkeiten (Supabase-Client) werden hier einmal erstellt
 * und an Route-Logik/Libs injiziert (Dependency Inversion).
 */
import { createClient, type SupabaseClient } from "@jsr/supabase__supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase === null) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

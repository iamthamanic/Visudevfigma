/**
 * Supabase client provider for visudev-server.
 * Single responsibility: create and provide Supabase client (Dependency Inversion).
 */
import { createClient, type SupabaseClient } from "@jsr/supabase__supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase === null) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

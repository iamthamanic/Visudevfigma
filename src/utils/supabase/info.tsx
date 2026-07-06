/**
 * Supabase API-URL und Anon-Key für das Frontend.
 * Cloud projectId ist öffentlich; anon key nur via VITE_SUPABASE_ANON_KEY (.env.local).
 */
/** Öffentliche Cloud-Projekt-ID (gleich config/supabase-cloud.json für Ops-Skripte) */
export const CLOUD_PROJECT_ID = "tzfxbgxnjkthxwvoeyse";

const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const CLOUD_SETUP_HINT =
  "Kopiere .env.cloud.example nach .env.local und trage VITE_SUPABASE_ANON_KEY aus dem Supabase Dashboard ein.";

function validateSupabaseUrl(url: string, label: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return url;
  } catch {
    throw new Error(`${label} ist ungültig. Erwartet http(s):// URL. ${CLOUD_SETUP_HINT}`);
  }
}

function resolvePublicAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    const hasLocalUrl = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim());
    if (hasLocalUrl) {
      throw new Error(`VITE_SUPABASE_ANON_KEY fehlt für lokales Supabase. ${CLOUD_SETUP_HINT}`);
    }
    throw new Error(`VITE_SUPABASE_ANON_KEY fehlt für Cloud-Modus. ${CLOUD_SETUP_HINT}`);
  }
  if (!JWT_PATTERN.test(key)) {
    throw new Error(`VITE_SUPABASE_ANON_KEY hat kein gültiges JWT-Format. ${CLOUD_SETUP_HINT}`);
  }
  return key;
}

/** API-Basis-URL (Cloud-Standard oder VITE_SUPABASE_URL für lokal) */
export const supabaseUrl: string = validateSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL?.trim() || `https://${CLOUD_PROJECT_ID}.supabase.co`,
  "VITE_SUPABASE_URL",
);

/** Anon-Key — Pflicht in .env.local (Cloud und lokal) */
export const publicAnonKey: string = resolvePublicAnonKey();

/** Projekt-ID (Cloud oder "local" bei VITE_SUPABASE_URL) */
export const projectId: string =
  import.meta.env.VITE_SUPABASE_URL != null && import.meta.env.VITE_SUPABASE_URL !== ""
    ? "local"
    : CLOUD_PROJECT_ID;

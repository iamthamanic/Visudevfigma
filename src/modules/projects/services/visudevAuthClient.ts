import { publicAnonKey, supabaseUrl } from "../../../utils/supabase/info";

const BASE_URL = `${supabaseUrl}/functions/v1/visudev-auth`;

/** Only send X-Supabase-URL for local Supabase (Edge Function needs it for Docker). Cloud ignores custom headers for CORS. */
function isLocalSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

export interface VisudevAuthRequestOptions extends RequestInit {
  accessToken?: string | null;
}

/**
 * Request visudev-auth with optional Bearer (user session).
 * For authorize and status use accessToken; for callback/session anon is fine.
 */
export async function requestVisudevAuth<T>(
  endpoint: string,
  options: VisudevAuthRequestOptions = {},
): Promise<T> {
  const { accessToken, ...fetchOptions } = options;
  const authHeader =
    accessToken != null && accessToken !== "" ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: authHeader,
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (isLocalSupabaseUrl(supabaseUrl)) {
    headers["X-Supabase-URL"] = supabaseUrl;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    if (payload && typeof payload === "object" && "error" in payload) {
      const errorValue = (payload as { error?: unknown }).error;
      if (typeof errorValue === "string") {
        errorMessage = errorValue;
      } else if (errorValue && typeof errorValue === "object" && "message" in errorValue) {
        errorMessage = String((errorValue as { message?: unknown }).message ?? response.statusText);
      }
    }
    throw new Error(errorMessage);
  }

  return (payload ?? {}) as T;
}

import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/visudev-auth`;

export async function requestVisudevAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
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

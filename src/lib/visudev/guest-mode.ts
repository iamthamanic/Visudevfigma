/**
 * Gastmodus für localhost: feste Gast-Identität ohne Supabase-Login.
 * Ort: src/lib/visudev/guest-mode.ts
 */

import type { User } from "@jsr/supabase__supabase-js";

/** Must match visudev-projects auth-helper VISUDEV_GUEST_OWNER_ID. */
export const VISUDEV_GUEST_USER_ID = "visudev-local-guest";

export function isLocalHostUI(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function shouldUseGuestMode(sessionUserId: string | undefined | null): boolean {
  return isLocalHostUI() && !sessionUserId;
}

export function createGuestUser(): User {
  const now = new Date().toISOString();
  return {
    id: VISUDEV_GUEST_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "guest@visudev.local",
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: "guest", providers: ["guest"] },
    user_metadata: { mode: "localhost-guest" },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  };
}

export function isGuestUser(user: User | null | undefined): boolean {
  return user?.id === VISUDEV_GUEST_USER_ID;
}

export function guestRequestHeader(): Record<string, string> {
  if (!isLocalHostUI()) return {};
  const token =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_VISUDEV_LOCAL_GUEST_TOKEN) || "";
  if (!token) return {};
  return {
    "X-VisuDev-Guest": "localhost",
    "X-VisuDev-Guest-Token": String(token),
  };
}

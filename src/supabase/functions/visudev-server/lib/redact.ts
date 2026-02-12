/**
 * Data redaction for visudev-server. Single responsibility: redact sensitive fields before client response.
 */
export function redactIntegrations(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const out = { ...(data as Record<string, unknown>) };
  if (out.github && typeof out.github === "object") {
    out.github = { ...(out.github as Record<string, unknown>) };
    (out.github as Record<string, unknown>).token = "***";
  }
  if (out.supabase && typeof out.supabase === "object") {
    out.supabase = { ...(out.supabase as Record<string, unknown>) };
    const s = out.supabase as Record<string, unknown>;
    s.anonKey = "***";
    s.serviceKey = "***";
  }
  return out;
}

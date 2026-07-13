/**
 * Path-based heuristics used by the Software Graph builder.
 */

export function normalizePath(filePath: string): string {
  return filePath.replace(/^\/+/, "");
}

export function detectDomain(filePath: string): string {
  const parts = normalizePath(filePath).split("/");
  if (parts.length >= 2 && parts[0] === "src") return parts[1] || "src";
  return parts[0] || "root";
}

export function detectModule(filePath: string, domain: string): string {
  const normalized = normalizePath(filePath);
  const prefix = domain === "src" ? "src/" : `src/${domain}/`;
  const rest = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) return domain;
  if (parts.length === 1) {
    const only = parts[0];
    return only.includes(".") ? domain : only;
  }
  return parts[0];
}

export function detectLayer(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/\/(pages|routes|screens|views)\//.test(normalized)) return "presentation";
  if (/\/(components|ui)\//.test(normalized)) return "ui";
  if (/\/(hooks|composables)\//.test(normalized)) return "hooks";
  if (/\/(services|use-cases|application)\//.test(normalized)) return "application";
  if (/\/(repositories|infra|database|db)\//.test(normalized)) return "data";
  if (/\/(lib|utils|shared|common|helpers)\//.test(normalized)) return "shared";
  if (/\/(config|types)\//.test(normalized)) return "config";
  return "unknown";
}

export function inferRuntime(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/\bsupabase\/functions\//.test(normalized)) return "edge";
  if (/\b(src\/supabase|src\/server|src\/api|src\/backend)\//.test(normalized)) return "server";
  if (/\b(src\/modules|src\/components|src\/pages|src\/app)\//.test(normalized)) return "browser";
  return "shared";
}

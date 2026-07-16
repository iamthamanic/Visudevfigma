/**
 * Path-based heuristics used by the Software Graph builder.
 */

export function normalizePath(filePath: string): string {
  return filePath.replace(/^\/+/, "");
}

export function detectDomain(filePath: string): string {
  const parts = normalizePath(filePath).split("/").filter(Boolean);
  if (parts.length === 0) return "root";

  // Monorepo: apps/<name>/… → apps/<name>, packages/<name>/… → packages/<name>
  if ((parts[0] === "apps" || parts[0] === "packages" || parts[0] === "ee") && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }

  if (parts.length >= 2 && parts[0] === "src") return parts[1] || "src";
  return parts[0] || "root";
}

export function detectModule(filePath: string, domain: string): string {
  const normalized = normalizePath(filePath);

  if (normalized.startsWith("src/")) {
    const prefix = domain === "src" ? "src/" : `src/${domain}/`;
    const rest = normalized.startsWith(prefix)
      ? normalized.slice(prefix.length)
      : normalized.slice(4);
    const parts = rest.split("/").filter(Boolean);
    if (parts.length === 0) return domain;
    if (parts.length === 1) {
      const only = parts[0];
      return only.includes(".") ? domain : only;
    }
    return parts[0];
  }

  const domainPrefix = `${domain}/`;
  const rest = normalized.startsWith(domainPrefix)
    ? normalized.slice(domainPrefix.length)
    : normalized;
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) {
    return domain.includes("/") ? domain.split("/")[1]! : domain;
  }
  if (parts.length === 1) {
    const only = parts[0]!;
    return only.includes(".") ? (domain.includes("/") ? domain.split("/")[1]! : domain) : only;
  }
  if (parts[0] === "app" && parts.length >= 2) {
    const next = parts[1]!;
    return next.includes(".") ? "app" : next;
  }
  return parts[0]!;
}

export function detectLayer(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();

  if (/\.prisma$/.test(normalized) || /\/(prisma|database|db)\//.test(normalized)) {
    return "data";
  }
  if (/\.py$/.test(normalized)) {
    if (/(?:^|\/)(urls|views|viewsets|serializers)\.py$/.test(normalized)) {
      return "presentation";
    }
    if (
      /(?:^|\/)(models|migrations)\//.test(normalized) ||
      /(?:^|\/)models\.py$/.test(normalized)
    ) {
      return "data";
    }
    if (/(?:^|\/)(permissions|auth|middleware)\.py$/.test(normalized)) {
      return "application";
    }
    if (/(?:^|\/)(settings|manage)\.py$/.test(normalized)) return "config";
    if (normalized.includes("/apps/api/") || normalized.includes("/api/")) {
      return "application";
    }
  }

  // Next.js App Router + API routes
  if (/(?:^|\/)app\/api\//.test(normalized) || /(?:^|\/)pages\/api\//.test(normalized)) {
    return "presentation";
  }
  if (/(?:^|\/)app\//.test(normalized) || /(?:^|\/)route\.(tsx?|jsx?)$/.test(normalized)) {
    return "presentation";
  }

  if (/\/(pages|routes|screens|views)\//.test(normalized)) return "presentation";
  if (/\/(components|ui|modules)\//.test(normalized)) return "ui";
  if (/\/(hooks|composables)\//.test(normalized)) return "hooks";
  if (/\/(services|use-cases|application|server)\//.test(normalized)) return "application";
  if (/\/(repositories|infra|database|db)\//.test(normalized)) return "data";
  if (/\/(lib|utils|shared|common|helpers)\//.test(normalized)) return "shared";
  if (/\/(config|types)\//.test(normalized)) return "config";
  return "unknown";
}

export function inferRuntime(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/\bsupabase\/functions\//.test(normalized)) return "edge";
  if (
    /\.py$/.test(normalized) ||
    /\b(apps\/api|src\/server|src\/api|src\/backend)\//.test(normalized)
  ) {
    return "server";
  }
  if (/\b(src\/supabase|src\/server|src\/api|src\/backend)\//.test(normalized)) return "server";
  if (
    /\b(src\/modules|src\/components|src\/pages|src\/app|apps\/web|apps\/meteor)\//.test(normalized)
  ) {
    return "browser";
  }
  if (/(?:^|\/)app\/api\//.test(normalized)) return "server";
  if (/(?:^|\/)app\//.test(normalized)) return "browser";
  return "shared";
}

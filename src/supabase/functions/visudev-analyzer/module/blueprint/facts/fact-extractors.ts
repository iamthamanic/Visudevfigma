/** Line-based fact extractors for Blueprint Engine v1 (Hono, Next, Express, Supabase, Zod, Auth). */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";

function makeFactId(filePath: string, line: number, kind: string): string {
  const safePath = filePath.replace(/[^a-zA-Z0-9]+/g, "-").replace(
    /^-|-$/g,
    "",
  );
  return `fact-${safePath}-${line}-${kind}`;
}

function trimSnippet(line: string, max = 120): string {
  const t = line.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function extractFactsFromFile(
  filePath: string,
  content: string,
): CodeFact[] {
  const facts: CodeFact[] = [];
  const routeKeys = new Set<string>();
  const routeFramework = resolveRouteFramework(filePath, content);
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    extractRouteFrameworkFacts(
      filePath,
      line,
      lineNum,
      facts,
      routeKeys,
      routeFramework,
    );
    extractNextRouteHandlers(filePath, line, lineNum, facts);
    extractRequestBody(filePath, line, lineNum, facts);
    extractValidation(filePath, line, lineNum, facts);
    extractAuth(filePath, line, lineNum, facts);
    extractSupabase(filePath, line, lineNum, facts);
    extractExternalApi(filePath, line, lineNum, facts);
    extractRateLimit(filePath, line, lineNum, facts);
    extractErrorStatus(filePath, line, lineNum, facts);
  });

  return facts;
}

function resolveRouteFramework(
  filePath: string,
  content: string,
): "hono" | "express" {
  if (/from\s+['"]hono['"]|from\s+['"]@hono\//.test(content)) return "hono";
  if (
    /from\s+['"]express['"]|require\(\s*['"]express['"]\s*\)/.test(content)
  ) return "express";
  if (/\basync\s*\(\s*c\s*\)|\bc\.req\.|\bc\.json\(/.test(content)) {
    return "hono";
  }
  if (isLikelyExpressRouteFile(filePath)) return "express";
  return "hono";
}

function extractRouteFrameworkFacts(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
  routeKeys: Set<string>,
  routeFramework: "hono" | "express",
): void {
  if (routeFramework === "express") {
    extractExpressRoutes(filePath, line, lineNum, facts, routeKeys);
    return;
  }
  extractHonoRoutes(filePath, line, lineNum, facts, routeKeys);
}

function extractHonoRoutes(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
  routeKeys: Set<string>,
): void {
  const honoRegex =
    /\bapp\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let m: RegExpExecArray | null;
  while ((m = honoRegex.exec(line)) !== null) {
    const method = m[1].toUpperCase();
    const path = m[2];
    const key = `${filePath}:${lineNum}:${method}:${path}`;
    if (routeKeys.has(key)) continue;
    routeKeys.add(key);
    facts.push({
      id: makeFactId(filePath, lineNum, "api-route"),
      kind: "api-route",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { method: m[1].toUpperCase(), path: m[2], framework: "hono" },
    });
  }
}

function extractExpressRoutes(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
  routeKeys: Set<string>,
): void {
  extractExpressRouteMatches(
    filePath,
    line,
    lineNum,
    facts,
    routeKeys,
    /\bapp\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  );
  if (!isLikelyExpressRouteFile(filePath)) return;
  extractExpressRouteMatches(
    filePath,
    line,
    lineNum,
    facts,
    routeKeys,
    /\brouter\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  );
}

function isLikelyExpressRouteFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/routes/") ||
    normalized.endsWith(".routes.ts") ||
    normalized.endsWith(".routes.js") ||
    normalized.endsWith(".routes.tsx") ||
    normalized.endsWith(".routes.jsx");
}

function extractExpressRouteMatches(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
  routeKeys: Set<string>,
  expressRegex: RegExp,
): void {
  let m: RegExpExecArray | null;
  while ((m = expressRegex.exec(line)) !== null) {
    const method = m[1].toUpperCase();
    const path = m[2];
    const key = `${filePath}:${lineNum}:${method}:${path}`;
    if (routeKeys.has(key)) continue;
    routeKeys.add(key);
    facts.push({
      id: makeFactId(filePath, lineNum, `api-route-express-${method}-${path}`),
      kind: "api-route",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: {
        method,
        path,
        framework: "express",
      },
    });
  }
}

function extractNextRouteHandlers(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (!filePath.includes("route.ts") && !filePath.includes("route.tsx")) {
    return;
  }
  const nextRegex =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const m = line.match(nextRegex);
  if (m) {
    const path = inferNextRoutePath(filePath);
    facts.push({
      id: makeFactId(filePath, lineNum, "api-route"),
      kind: "api-route",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { method: m[1], path, framework: "next-app-router" },
    });
  }
}

function inferNextRoutePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const appIdx = normalized.indexOf("/app/");
  if (appIdx >= 0) {
    let segment = normalized.slice(appIdx + 5);
    segment = segment.replace(/\/route\.(tsx?|jsx?)$/, "");
    return segment ? `/${segment}` : "/";
  }
  const pagesIdx = normalized.indexOf("/pages/api/");
  if (pagesIdx >= 0) {
    let segment = normalized.slice(pagesIdx + 11);
    segment = segment.replace(/\.(tsx?|jsx?)$/, "");
    return `/api/${segment}`;
  }
  return filePath;
}

function extractRequestBody(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (
    line.includes("req.json()") ||
    line.includes("request.json()") ||
    line.includes("c.req.json()") ||
    line.includes("await c.req.parseBody") ||
    line.match(/\bbody\s*=\s*await\s+/)
  ) {
    facts.push({
      id: makeFactId(filePath, lineNum, "request-body-read"),
      kind: "request-body-read",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: {},
    });
  }
}

function extractValidation(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (line.includes("safeParse(")) {
    facts.push({
      id: makeFactId(filePath, lineNum, "schema-safe-parse"),
      kind: "schema-safe-parse",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { library: "zod-like" },
    });
  } else if (
    line.match(/\.\s*parse\s*\(/) &&
    (line.includes("Schema") || line.includes("schema"))
  ) {
    facts.push({
      id: makeFactId(filePath, lineNum, "schema-parse"),
      kind: "schema-parse",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { library: "zod-like" },
    });
  }
}

function extractAuth(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  const authPatterns = [
    "getUser(",
    "auth.getUser",
    "getSession(",
    "requireAuth",
    "requireProjectOwner",
    "authenticateApiKey",
    "authorize(",
    "authorizeAny(",
    "Authorization",
  ];
  if (authPatterns.some((p) => line.includes(p))) {
    facts.push({
      id: makeFactId(filePath, lineNum, "auth-check"),
      kind: "auth-check",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: {},
    });
  }
}

function extractSupabase(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (!line.includes("supabase.from(") && !line.includes(".from(")) return;
  const dbMatch = line.match(/\.from\s*\(\s*["'`]([^"'`]+)["'`]/);
  if (!dbMatch) return;
  const table = dbMatch[1];
  let operation = "select";
  if (line.includes(".insert(")) operation = "insert";
  else if (line.includes(".update(")) operation = "update";
  else if (line.includes(".delete(")) operation = "delete";
  else if (line.includes(".upsert(")) operation = "upsert";

  facts.push({
    id: makeFactId(
      filePath,
      lineNum,
      operation === "select" ? "db-read" : "db-write",
    ),
    kind: operation === "select" ? "db-read" : "db-write",
    filePath,
    line: lineNum,
    snippet: trimSnippet(line),
    metadata: { table, operation },
  });
}

function extractExternalApi(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (line.includes("fetch(") || line.includes("axios.")) {
    facts.push({
      id: makeFactId(filePath, lineNum, "external-api-call"),
      kind: "external-api-call",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: {},
    });
  }
}

function extractRateLimit(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (
    line.toLowerCase().includes("ratelimit") ||
    line.includes("rate-limit") ||
    line.includes("rateLimit")
  ) {
    facts.push({
      id: makeFactId(filePath, lineNum, "rate-limit"),
      kind: "rate-limit",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: {},
    });
  }
}

function extractErrorStatus(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  if (line.includes("401") || line.match(/\b401\b/)) {
    facts.push({
      id: makeFactId(filePath, lineNum, "auth-deny-401"),
      kind: "auth-deny-401",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { status: 401 },
    });
  }
  if (line.includes("400") || line.match(/\b400\b/)) {
    facts.push({
      id: makeFactId(filePath, lineNum, "validation-deny-400"),
      kind: "validation-deny-400",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { status: 400 },
    });
  }
}

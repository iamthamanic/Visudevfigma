/** Line-based fact extractors for Blueprint Engine v1 (Hono, Next, Express, Supabase, Zod, Auth, Django, Prisma). */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractAstFactsFromFile } from "../graph/ast-call-graph.ts";
import type { FileIndexEntry } from "../graph/call-graph.builder.ts";

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

function isJsTsFile(filePath: string): boolean {
  return /\.(tsx?|jsx?|mts|cts)$/i.test(filePath);
}

function isPythonFile(filePath: string): boolean {
  return /\.py$/i.test(filePath);
}

function isPrismaFile(filePath: string): boolean {
  return /\.prisma$/i.test(filePath);
}

export function extractFactsFromFile(
  filePath: string,
  content: string,
  fileIndex?: ReadonlyMap<string, FileIndexEntry>,
): CodeFact[] {
  if (isPrismaFile(filePath)) {
    return extractPrismaFacts(filePath, content);
  }
  if (isPythonFile(filePath)) {
    return extractDjangoFacts(filePath, content);
  }

  const regexFacts = extractRegexFactsFromFile(filePath, content);
  const astFacts = isJsTsFile(filePath)
    ? extractAstFactsFromFile(filePath, content, fileIndex)
    : [];
  return mergeFacts(regexFacts, astFacts);
}

function extractRegexFactsFromFile(
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
    extractPrismaClient(filePath, line, lineNum, facts);
    extractExternalApi(filePath, line, lineNum, facts);
    extractRateLimit(filePath, line, lineNum, facts);
    extractErrorStatus(filePath, line, lineNum, facts);
  });

  return facts;
}

/** Prisma schema.prisma → table facts for Softort Formbricks DB visibility. */
function extractPrismaFacts(filePath: string, content: string): CodeFact[] {
  const facts: CodeFact[] = [];
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const modelMatch = line.match(/^\s*model\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/);
    if (!modelMatch) return;
    const table = modelMatch[1];
    facts.push({
      id: makeFactId(filePath, lineNum, "db-write"),
      kind: "db-write",
      filePath,
      line: lineNum,
      snippet: trimSnippet(line),
      metadata: { table, operation: "prisma-model", framework: "prisma" },
    });
  });
  return facts;
}

/** Django urls/views/permissions → api-route + auth facts for Softort Plane. */
function extractDjangoFacts(filePath: string, content: string): CodeFact[] {
  const facts: CodeFact[] = [];
  const routeKeys = new Set<string>();
  const lines = content.split("\n");
  const lowerPath = filePath.toLowerCase();

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // path("api/...", ...) / re_path(r"^api/...", ...)
    const pathMatch = trimmed.match(
      /(?:path|re_path)\s*\(\s*(?:r)?["'`]([^"'`]+)["'`]/,
    );
    if (pathMatch) {
      const routePath = pathMatch[1].startsWith("^")
        ? `/${pathMatch[1].replace(/^\^/, "").replace(/\$$/, "")}`
        : pathMatch[1].startsWith("/")
        ? pathMatch[1]
        : `/${pathMatch[1]}`;
      const key = `ALL:${routePath}`;
      if (!routeKeys.has(key)) {
        routeKeys.add(key);
        facts.push({
          id: makeFactId(filePath, lineNum, "api-route"),
          kind: "api-route",
          filePath,
          line: lineNum,
          snippet: trimSnippet(line),
          metadata: {
            method: "ALL",
            path: routePath,
            framework: "django",
          },
        });
      }
    }

    if (
      /@api_view\s*\(|class\s+\w+\s*\(.*APIView|class\s+\w+\s*\(.*ViewSet/.test(
        trimmed,
      )
    ) {
      facts.push({
        id: makeFactId(filePath, lineNum, "api-route"),
        kind: "api-route",
        filePath,
        line: lineNum,
        snippet: trimSnippet(line),
        metadata: {
          method: "ALL",
          path: `/${filePath.replace(/\\/g, "/")}`,
          framework: "django",
        },
      });
    }

    if (
      /permission_classes|has_permission|IsAuthenticated|DjangoModelPermissions|BasePermission/
        .test(trimmed)
    ) {
      facts.push({
        id: makeFactId(filePath, lineNum, "auth-check"),
        kind: "auth-check",
        filePath,
        line: lineNum,
        snippet: trimSnippet(line),
        metadata: { framework: "django" },
      });
    }

    if (
      /class\s+\w+\s*\(.*models\.Model/.test(trimmed) ||
      /models\.Model\)/.test(trimmed)
    ) {
      const modelName = trimmed.match(/class\s+(\w+)\s*\(/)?.[1];
      if (modelName) {
        facts.push({
          id: makeFactId(filePath, lineNum, "db-write"),
          kind: "db-write",
          filePath,
          line: lineNum,
          snippet: trimSnippet(line),
          metadata: {
            table: modelName,
            operation: "django-model",
            framework: "django",
          },
        });
      }
    }
  });

  if (
    lowerPath.endsWith("manage.py") &&
    /django|DJANGO_SETTINGS_MODULE/.test(content)
  ) {
    facts.push({
      id: makeFactId(filePath, 1, "api-route"),
      kind: "api-route",
      filePath,
      line: 1,
      snippet: "Django manage.py entrypoint",
      metadata: {
        method: "ALL",
        path: "/django",
        framework: "django",
      },
    });
  }

  return facts;
}

function mergeFacts(regexFacts: CodeFact[], astFacts: CodeFact[]): CodeFact[] {
  if (astFacts.length === 0) return regexFacts;
  const seen = new Set(regexFacts.map((fact) => fact.id));
  const merged = [...regexFacts];
  for (const fact of astFacts) {
    if (seen.has(fact.id)) continue;
    seen.add(fact.id);
    merged.push(fact);
  }
  return merged;
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

/** prisma.model.findMany / create / update → db facts (Formbricks client usage). */
function extractPrismaClient(
  filePath: string,
  line: string,
  lineNum: number,
  facts: CodeFact[],
): void {
  const match = line.match(
    /\bprisma\.(\w+)\.(findMany|findFirst|findUnique|create|createMany|update|updateMany|upsert|delete|deleteMany|count|aggregate)\s*\(/,
  );
  if (!match) return;
  const table = match[1];
  const op = match[2];
  const isRead = /^(find|count|aggregate)/.test(op);
  facts.push({
    id: makeFactId(filePath, lineNum, isRead ? "db-read" : "db-write"),
    kind: isRead ? "db-read" : "db-write",
    filePath,
    line: lineNum,
    snippet: trimSnippet(line),
    metadata: { table, operation: op, framework: "prisma" },
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

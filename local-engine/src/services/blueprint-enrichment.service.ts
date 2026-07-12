/**
 * Canonical enrichment pipeline: any `RawBlueprintScan` becomes a `BlueprintDocument`
 * with normalized routes, security matrix, and VisuDEV-specific findings.
 * Location: local-engine/src/services/blueprint-enrichment.service.ts
 */

import type {
  BlueprintDocument,
  RawBlueprintFact,
  RawBlueprintRoute,
  RawBlueprintScan,
} from "../types/api.types.js";

export type ProjectProfile = {
  appType: string;
  expectedUsers: string;
  dataSensitivity: string;
  deployment: string;
};

const DEFAULT_PROFILE: ProjectProfile = {
  appType: "saas",
  expectedUsers: "small",
  dataSensitivity: "low",
  deployment: "self-hosted",
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type NormalizedRoute = {
  id: string;
  method: string;
  path: string;
  filePath: string;
  line: number;
  pipeline: unknown[];
  concepts: Record<string, unknown>;
};

type NormalizedFact = {
  id: string;
  kind: string;
  filePath: string;
  line: number;
  snippet: string;
  metadata: Record<string, unknown>;
};

type SecurityMatrixRow = {
  routeId: string;
  method: string;
  path: string;
  auth: { state: string };
  role: { state: string };
  validation: { state: string };
  rateLimit: { state: string };
  db: { state: string };
  rls: { state: string };
  audit: { state: string };
  findingCount: number;
};

type BlueprintFinding = {
  id: string;
  ruleId: string;
  category: string;
  severity: string;
  scopeId: string;
  message: string;
  expectedState: string;
  actualState: string;
  evidenceFactIds: string[];
  confidence: number;
};

function normalizeRoute(raw: RawBlueprintRoute): NormalizedRoute {
  const safePath = raw.path.startsWith("/") ? raw.path : `/${raw.path}`;
  const method = (raw.method ?? "PAGE").toUpperCase();
  return {
    id: raw.id,
    method,
    path: safePath,
    filePath: raw.filePath,
    line: raw.line,
    pipeline: Array.isArray(raw.pipeline) ? raw.pipeline : [],
    concepts: raw.concepts && typeof raw.concepts === "object" ? raw.concepts : {},
  };
}

function normalizeFact(raw: RawBlueprintFact): NormalizedFact {
  return {
    id: raw.id,
    kind: raw.kind,
    filePath: raw.filePath,
    line: raw.line,
    snippet: raw.snippet,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

function buildSecurityMatrix(routes: NormalizedRoute[]): SecurityMatrixRow[] {
  return routes.map((route) => ({
    routeId: route.id,
    method: route.method,
    path: route.path,
    auth: { state: "unknown" },
    role: { state: "unknown" },
    validation: { state: "unknown" },
    rateLimit: { state: "n/a" },
    db: { state: "n/a" },
    rls: { state: "n/a" },
    audit: { state: "n/a" },
    findingCount: 0,
  }));
}

function relevantFacts(route: NormalizedRoute, facts: NormalizedFact[]): NormalizedFact[] {
  const dirPath = route.filePath.replace(/\/[^/]+$/, "");
  return facts.filter(
    (fact) => fact.filePath === route.filePath || fact.filePath.startsWith(dirPath),
  );
}

function inferAuthState(route: NormalizedRoute, facts: NormalizedFact[]): string {
  const factsNearRoute = relevantFacts(route, facts);
  const hasAuth = factsNearRoute.some((fact) =>
    /auth|middleware|protect|guard|session|jwt|oauth/i.test(fact.snippet),
  );
  if (hasAuth) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

function inferValidationState(route: NormalizedRoute, facts: NormalizedFact[]): string {
  const routeFacts = facts.filter((fact) => fact.filePath === route.filePath);
  const hasValidation = routeFacts.some((fact) =>
    /zod|joi|yup|validator|validate|schema|body\(|query\(|params\(/i.test(fact.snippet),
  );
  if (hasValidation) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

function buildFindings(routes: NormalizedRoute[], facts: NormalizedFact[]): BlueprintFinding[] {
  const findings: BlueprintFinding[] = [];

  for (const route of routes) {
    const routeFacts = facts.filter((fact) => fact.filePath === route.filePath);

    const authState = inferAuthState(route, facts);
    if (authState === "missing") {
      findings.push({
        id: `finding-auth-${route.id}`,
        ruleId: "visudev/missing-auth",
        category: "security",
        severity: "medium",
        scopeId: route.id,
        message: `Route ${route.method} ${route.path} appears to lack an auth guard.`,
        expectedState: "protected",
        actualState: "unprotected",
        evidenceFactIds: routeFacts.map((fact) => fact.id),
        confidence: 0.6,
      });
    }

    const validationState = inferValidationState(route, facts);
    if (validationState === "missing") {
      findings.push({
        id: `finding-validation-${route.id}`,
        ruleId: "visudev/missing-validation",
        category: "security",
        severity: "medium",
        scopeId: route.id,
        message: `Route ${route.method} ${route.path} has no visible input validation.`,
        expectedState: "validated",
        actualState: "unvalidated",
        evidenceFactIds: routeFacts.map((fact) => fact.id),
        confidence: 0.55,
      });
    }

    const ariaFacts = routeFacts.filter((fact) => fact.kind === "autoguide:missing-aria-label");
    for (const fact of ariaFacts) {
      findings.push({
        id: `finding-aria-${fact.id}`,
        ruleId: "visudev/missing-aria-label",
        category: "maintainability",
        severity: "low",
        scopeId: route.id,
        message: `Interactive element in ${fact.filePath} is missing an accessible label.`,
        expectedState: "labeled",
        actualState: "missing",
        evidenceFactIds: [fact.id],
        confidence: 0.8,
      });
    }
  }

  return findings;
}

function updateMatrixWithFindings(
  matrix: SecurityMatrixRow[],
  findings: BlueprintFinding[],
): SecurityMatrixRow[] {
  return matrix.map((row) => {
    const rowFindings = findings.filter((finding) => finding.scopeId === row.routeId);
    const authFinding = rowFindings.find((finding) => finding.ruleId === "visudev/missing-auth");
    const validationFinding = rowFindings.find(
      (finding) => finding.ruleId === "visudev/missing-validation",
    );
    return {
      ...row,
      auth: authFinding ? { state: "missing" } : row.auth,
      validation: validationFinding ? { state: "missing" } : row.validation,
      findingCount: rowFindings.length,
    };
  });
}

export function enrichBlueprint(scan: RawBlueprintScan): BlueprintDocument {
  const routes = scan.routes.map(normalizeRoute);
  const facts = scan.facts.map(normalizeFact);
  const matrix = buildSecurityMatrix(routes);
  const findings = buildFindings(routes, facts);
  const securityMatrix = updateMatrixWithFindings(matrix, findings);

  return {
    version: 1,
    projectId: scan.projectId,
    repo: scan.localPath,
    branch: "local",
    commitSha: "local",
    analyzedAt: scan.analyzedAt,
    projectProfile: DEFAULT_PROFILE,
    routes,
    securityMatrix,
    findings,
    facts,
    concepts: [],
    filesAnalyzed: scan.filesAnalyzed,
    frameworkHints: [scan.providerId],
    providerMetadata: scan.providerMetadata,
  };
}

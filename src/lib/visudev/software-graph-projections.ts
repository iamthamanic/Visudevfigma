import type {
  BlueprintFinding,
  CodeFact,
  RouteBlueprint,
  SecurityMatrixRow,
} from "./blueprint-types";
import type { SoftwareGraph } from "./software-graph-types";

type NormalizedRoute = Pick<RouteBlueprint, "id" | "method" | "path" | "filePath" | "line">;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function relevantFacts(route: NormalizedRoute, facts: CodeFact[]): CodeFact[] {
  const dirPath = route.filePath.replace(/\/[^/]+$/, "");
  return facts.filter(
    (fact) => fact.filePath === route.filePath || fact.filePath.startsWith(dirPath),
  );
}

function inferAuthState(
  route: NormalizedRoute,
  facts: CodeFact[],
): SecurityMatrixRow["auth"]["state"] {
  const factsNearRoute = relevantFacts(route, facts);
  const hasAuth = factsNearRoute.some((fact) =>
    /auth|middleware|protect|guard|session|jwt|oauth/i.test(fact.snippet),
  );
  if (hasAuth) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

function inferValidationState(
  route: NormalizedRoute,
  facts: CodeFact[],
): SecurityMatrixRow["validation"]["state"] {
  const routeFacts = facts.filter((fact) => fact.filePath === route.filePath);
  const hasValidation = routeFacts.some((fact) =>
    /zod|joi|yup|validator|validate|schema|body\(|query\(|params\(/i.test(fact.snippet),
  );
  if (hasValidation) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

export function deriveFactsFromGraph(graph: SoftwareGraph): CodeFact[] {
  return graph.evidence.map((ev) => ({
    id: ev.factId,
    kind: ev.kind,
    filePath: ev.filePath,
    line: ev.line,
    snippet: ev.excerpt,
    metadata: {},
  }));
}

export function deriveRoutesFromGraph(graph: SoftwareGraph): RouteBlueprint[] {
  const routes: RouteBlueprint[] = [];
  for (const node of graph.nodes) {
    if (node.kind !== "route") continue;
    const routeId =
      typeof node.metadata.routeId === "string" && node.metadata.routeId.length > 0
        ? node.metadata.routeId
        : node.id;
    const method = typeof node.metadata.method === "string" ? node.metadata.method : "PAGE";
    const path = typeof node.metadata.path === "string" ? node.metadata.path : "";
    if (!node.filePath || !node.line) continue;
    routes.push({
      id: routeId,
      method,
      path,
      filePath: node.filePath,
      line: node.line,
      pipeline: [],
      concepts: {},
    });
  }
  return routes;
}

export function deriveSecurityMatrixFromGraph(graph: SoftwareGraph): SecurityMatrixRow[] {
  const routes = deriveRoutesFromGraph(graph);
  const facts = deriveFactsFromGraph(graph);
  return routes
    .map(
      (route): SecurityMatrixRow => ({
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
      }),
    )
    .map((row) => {
      const route = routes.find((r) => r.id === row.routeId);
      if (!route) return row;
      const auth = inferAuthState(route, facts);
      const validation = inferValidationState(route, facts);
      return { ...row, auth: { state: auth }, validation: { state: validation } };
    });
}

export function deriveFindingsFromGraph(graph: SoftwareGraph): BlueprintFinding[] {
  const routes = deriveRoutesFromGraph(graph);
  const facts = deriveFactsFromGraph(graph);
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

export function deriveDiagnosticsFromGraph(graph: SoftwareGraph): {
  routes: RouteBlueprint[];
  securityMatrix: SecurityMatrixRow[];
  findings: BlueprintFinding[];
  facts: CodeFact[];
} {
  const facts = deriveFactsFromGraph(graph);
  const routes = deriveRoutesFromGraph(graph);

  const factsByFilePath = new Map<string, CodeFact[]>();
  for (const fact of facts) {
    const list = factsByFilePath.get(fact.filePath) ?? [];
    list.push(fact);
    factsByFilePath.set(fact.filePath, list);
  }

  const findings: BlueprintFinding[] = [];
  const findingCountByRoute = new Map<string, number>();
  const securityMatrix: SecurityMatrixRow[] = [];

  for (const route of routes) {
    const routeFacts = factsByFilePath.get(route.filePath) ?? [];
    const authState = inferAuthState(route, facts);
    const validationState = inferValidationState(route, facts);

    if (authState === "missing") {
      const finding: BlueprintFinding = {
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
      };
      findings.push(finding);
      findingCountByRoute.set(route.id, (findingCountByRoute.get(route.id) ?? 0) + 1);
    }

    if (validationState === "missing") {
      const finding: BlueprintFinding = {
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
      };
      findings.push(finding);
      findingCountByRoute.set(route.id, (findingCountByRoute.get(route.id) ?? 0) + 1);
    }

    for (const fact of routeFacts) {
      if (fact.kind !== "autoguide:missing-aria-label") continue;
      const finding: BlueprintFinding = {
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
      };
      findings.push(finding);
      findingCountByRoute.set(route.id, (findingCountByRoute.get(route.id) ?? 0) + 1);
    }

    securityMatrix.push({
      routeId: route.id,
      method: route.method,
      path: route.path,
      auth: { state: authState },
      role: { state: "unknown" },
      validation: { state: validationState },
      rateLimit: { state: "n/a" },
      db: { state: "n/a" },
      rls: { state: "n/a" },
      audit: { state: "n/a" },
      findingCount: findingCountByRoute.get(route.id) ?? 0,
    });
  }

  return { routes, securityMatrix, findings, facts };
}

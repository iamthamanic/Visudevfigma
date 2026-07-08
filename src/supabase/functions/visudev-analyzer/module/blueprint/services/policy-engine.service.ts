/** Versioned policy rules for Blueprint Engine v1. */

import type {
  BlueprintFinding,
  CodeFact,
  RouteBlueprint,
  TechnicalConcept,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import {
  buildRouteFactsIndex,
  indexConceptsByScope,
} from "../internal/fact-scope-index.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";

interface PolicyRule {
  id: string;
  category: BlueprintFinding["category"];
  baseSeverity: BlueprintFinding["severity"];
  message: string;
  remediation: string;
  evaluate: (
    route: RouteScope,
    routeConcepts: Map<string, TechnicalConcept>,
    scopeFacts: CodeFact[],
  ) => BlueprintFinding | null;
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function evaluatePolicies(
  routes: RouteScope[],
  concepts: TechnicalConcept[],
  facts: CodeFact[],
): BlueprintFinding[] {
  const findings: BlueprintFinding[] = [];
  let findingIdx = 0;
  const routeFactsIndex = buildRouteFactsIndex(routes, facts);
  const conceptsByScope = indexConceptsByScope(concepts);

  for (const route of routes) {
    const scopeFacts = routeFactsIndex.get(route.id) ?? [];
    const routeConcepts = conceptsByScope.get(route.id) ??
      new Map<string, TechnicalConcept>();

    for (const rule of CORE_POLICIES) {
      const result = rule.evaluate(route, routeConcepts, scopeFacts);
      if (result) {
        findingIdx += 1;
        findings.push({ ...result, id: `finding-${findingIdx}` });
      }
    }
  }

  return findings;
}

const CORE_POLICIES: PolicyRule[] = [
  {
    id: "web-api.validation-before-db-write",
    category: "security",
    baseSeverity: "high",
    message: "Runtime Validation fehlt vor DB Write.",
    remediation:
      "Schema (z. B. Zod) auf Request anwenden und validiertes Ergebnis für DB Write nutzen.",
    evaluate: (route, routeConcepts, scopeFacts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return null;
      const hasBody = scopeFacts.some((fact) =>
        fact.kind === "request-body-read"
      );
      const hasDbWrite = scopeFacts.some((fact) => fact.kind === "db-write");
      if (!hasBody || !hasDbWrite) return null;

      const validation = routeConcepts.get("validation-gate");
      if (!validation || validation.state === "confirmed") return null;

      return buildFinding(
        route,
        validation,
        scopeFacts,
        "web-api.validation-before-db-write",
        "security",
        "high",
        "Validation Gate confirmed vor DB Write",
        `Validation Gate ${validation.state}`,
        "Runtime Validation fehlt vor DB Write.",
        "Schema (z. B. Zod) auf Request anwenden und validiertes Ergebnis für DB Write nutzen.",
      );
    },
  },
  {
    id: "web-api.auth-before-write",
    category: "security",
    baseSeverity: "medium",
    message: "Auth Gate fehlt oder unvollständig vor schreibendem Endpoint.",
    remediation: "Session/JWT prüfen und bei Fehler 401 zurückgeben.",
    evaluate: (route, routeConcepts, scopeFacts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return null;
      const hasDbWrite = scopeFacts.some((fact) => fact.kind === "db-write");
      if (!hasDbWrite) return null;

      const auth = routeConcepts.get("auth-gate");
      if (!auth || auth.state === "confirmed") return null;

      return buildFinding(
        route,
        auth,
        scopeFacts,
        "web-api.auth-before-write",
        "security",
        "medium",
        "Auth Gate confirmed",
        `Auth Gate ${auth.state}`,
        "Auth Gate fehlt oder unvollständig vor schreibendem Endpoint.",
        "Session/JWT prüfen und bei Fehler 401 zurückgeben.",
      );
    },
  },
  {
    id: "web-api.rate-limit-public",
    category: "security",
    baseSeverity: "medium",
    message: "Rate Limit nicht erkannt auf potenziell öffentlicher Route.",
    remediation:
      "Rate Limiting für Login/Reset/Contact/Upload Endpoints hinzufügen.",
    evaluate: (route, routeConcepts, _scopeFacts) => {
      const pathLower = route.path.toLowerCase();
      const isPublicSensitive =
        /login|reset|contact|upload|sign-up|signup|register/
          .test(pathLower);
      if (!isPublicSensitive) return null;

      const rateLimit = routeConcepts.get("rate-limit");
      if (rateLimit?.state === "confirmed") return null;

      const evidenceIds = rateLimit?.evidenceFactIds ?? [];
      return {
        id: "",
        ruleId: "web-api.rate-limit-public",
        category: "security",
        severity: "medium",
        scopeId: route.id,
        message: "Rate Limit nicht erkannt auf potenziell öffentlicher Route.",
        expectedState: "Rate Limit confirmed",
        actualState: rateLimit?.state ?? "missing",
        evidenceFactIds: evidenceIds,
        confidence: rateLimit ? 65 : 72,
        remediation:
          "Rate Limiting für Login/Reset/Contact/Upload Endpoints hinzufügen.",
      };
    },
  },
];

function buildFinding(
  route: RouteScope,
  concept: TechnicalConcept,
  scopeFacts: CodeFact[],
  ruleId: string,
  category: BlueprintFinding["category"],
  severity: BlueprintFinding["severity"],
  expected: string,
  actual: string,
  message: string,
  remediation: string,
): BlueprintFinding {
  const dbFacts = scopeFacts.filter((fact) => fact.kind === "db-write");
  const bodyFacts = scopeFacts.filter((fact) =>
    fact.kind === "request-body-read"
  );
  const evidenceFactIds = [
    ...concept.evidenceFactIds,
    ...dbFacts.map((fact) => fact.id),
    ...bodyFacts.map((fact) => fact.id),
  ];
  return {
    id: "",
    ruleId,
    category,
    severity,
    scopeId: route.id,
    message,
    expectedState: expected,
    actualState: actual,
    evidenceFactIds: [...new Set(evidenceFactIds)],
    confidence: concept.confidence,
    remediation,
  };
}

export function buildRouteBlueprints(
  routes: RouteScope[],
  concepts: TechnicalConcept[],
): RouteBlueprint[] {
  const conceptsByScope = indexConceptsByScope(concepts);

  return routes.map((route) => {
    const routeConcepts = conceptsByScope.get(route.id) ??
      new Map<string, TechnicalConcept>();
    const conceptMap: RouteBlueprint["concepts"] = {};
    for (const concept of routeConcepts.values()) {
      conceptMap[concept.type] = concept.state;
    }

    const pipeline = buildPipeline(route, routeConcepts);

    return {
      id: route.id,
      method: route.method,
      path: route.path,
      filePath: route.filePath,
      line: route.line,
      pipeline,
      concepts: conceptMap,
    };
  });
}

function buildPipeline(
  route: RouteScope,
  routeConcepts: Map<string, TechnicalConcept>,
): RouteBlueprint["pipeline"] {
  const getConcept = (
    type: TechnicalConcept["type"],
  ): TechnicalConcept | undefined => routeConcepts.get(type);

  const nodes: RouteBlueprint["pipeline"] = [
    {
      id: `${route.id}:request`,
      type: "request",
      label: "Request",
      state: "confirmed",
    },
    nodeFromConcept(
      `${route.id}:auth`,
      "auth-gate",
      "Auth",
      getConcept("auth-gate"),
    ),
    nodeFromConcept(
      `${route.id}:role`,
      "role-gate",
      "Role",
      getConcept("role-gate"),
    ),
    nodeFromConcept(
      `${route.id}:validation`,
      "validation-gate",
      "Validation",
      getConcept("validation-gate"),
    ),
    {
      id: `${route.id}:handler`,
      type: "handler",
      label: "Handler",
      state: "confirmed",
      filePath: route.filePath,
      line: route.line,
    },
    nodeFromConcept(`${route.id}:db`, "db-write", "DB", getConcept("db-write")),
    nodeFromConcept(
      `${route.id}:external`,
      "external-api",
      "External",
      getConcept("external-api"),
    ),
  ];

  return nodes.filter((node) =>
    node.state !== "missing" || node.type !== "role-gate"
  );
}

function nodeFromConcept(
  id: string,
  type: TechnicalConcept["type"],
  label: string,
  concept?: TechnicalConcept,
): RouteBlueprint["pipeline"][number] {
  return {
    id,
    type,
    label,
    state: concept?.state ?? "missing",
    filePath: concept?.callPath?.[0],
  };
}

export function buildSecurityMatrix(
  routes: RouteBlueprint[],
  findings: BlueprintFinding[],
): import("../../dto/blueprint/blueprint-document.dto.ts").SecurityMatrixRow[] {
  const findingsByRoute = new Map<string, BlueprintFinding[]>();
  for (const finding of findings) {
    const routeFindings = findingsByRoute.get(finding.scopeId);
    if (routeFindings) {
      routeFindings.push(finding);
    } else {
      findingsByRoute.set(finding.scopeId, [finding]);
    }
  }

  return routes.map((route) => {
    const routeFindings = findingsByRoute.get(route.id) ?? [];
    return {
      routeId: route.id,
      method: route.method,
      path: route.path,
      auth: cell(route.concepts["auth-gate"]),
      role: cell(route.concepts["role-gate"]),
      validation: cell(route.concepts["validation-gate"]),
      rateLimit: cell(route.concepts["rate-limit"]),
      db: dbCell(route.concepts),
      rls: cell(route.concepts["rls-policy"]),
      audit: cell(route.concepts["audit-log"]),
      findingCount: routeFindings.length,
    };
  });
}

function cell(
  state?: import("../../dto/blueprint/blueprint-document.dto.ts").ConceptState,
): import("../../dto/blueprint/blueprint-document.dto.ts").SecurityMatrixCell {
  if (!state) return { state: "unknown" };
  return { state };
}

function dbCell(
  concepts: RouteBlueprint["concepts"],
): import("../../dto/blueprint/blueprint-document.dto.ts").SecurityMatrixCell {
  if (concepts["db-write"] === "confirmed") return { state: "confirmed" };
  if (concepts["db-read"] === "confirmed") return { state: "confirmed" };
  return { state: "unknown" };
}

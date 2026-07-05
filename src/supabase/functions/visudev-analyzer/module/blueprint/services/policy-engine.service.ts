/** Versioned policy rules for Blueprint Engine v1. */

import type {
  BlueprintFinding,
  CodeFact,
  RouteBlueprint,
  TechnicalConcept,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "./concept-engine.service.ts";

interface PolicyRule {
  id: string;
  category: BlueprintFinding["category"];
  baseSeverity: BlueprintFinding["severity"];
  message: string;
  remediation: string;
  evaluate: (
    route: RouteScope,
    concepts: TechnicalConcept[],
    facts: CodeFact[],
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

  for (const route of routes) {
    for (const rule of CORE_POLICIES) {
      const result = rule.evaluate(route, concepts, facts);
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
    evaluate: (route, concepts, facts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return null;
      const scopeFacts = facts.filter((f) =>
        route.relatedFiles.includes(f.filePath)
      );
      const hasBody = scopeFacts.some((f) => f.kind === "request-body-read");
      const hasDbWrite = scopeFacts.some((f) => f.kind === "db-write");
      if (!hasBody || !hasDbWrite) return null;

      const validation = concepts.find(
        (c) => c.scopeId === route.id && c.type === "validation-gate",
      );
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
    evaluate: (route, concepts, facts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return null;
      const scopeFacts = facts.filter((f) =>
        route.relatedFiles.includes(f.filePath)
      );
      const hasDbWrite = scopeFacts.some((f) => f.kind === "db-write");
      if (!hasDbWrite) return null;

      const auth = concepts.find(
        (c) => c.scopeId === route.id && c.type === "auth-gate",
      );
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
    evaluate: (route, concepts, _facts) => {
      const pathLower = route.path.toLowerCase();
      const isPublicSensitive =
        /login|reset|contact|upload|sign-up|signup|register/
          .test(pathLower);
      if (!isPublicSensitive) return null;

      const rate = concepts.find(
        (c) => c.scopeId === route.id && c.type === "rate-limit",
      );
      if (rate?.state === "confirmed") return null;

      const evidenceIds = rate?.evidenceFactIds ?? [];
      return {
        id: "",
        ruleId: "web-api.rate-limit-public",
        category: "security",
        severity: "medium",
        scopeId: route.id,
        message: "Rate Limit nicht erkannt auf potenziell öffentlicher Route.",
        expectedState: "Rate Limit confirmed",
        actualState: rate?.state ?? "missing",
        evidenceFactIds: evidenceIds,
        confidence: rate ? 65 : 72,
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
  const dbFacts = scopeFacts.filter((f) => f.kind === "db-write");
  const bodyFacts = scopeFacts.filter((f) => f.kind === "request-body-read");
  const evidenceFactIds = [
    ...concept.evidenceFactIds,
    ...dbFacts.map((f) => f.id),
    ...bodyFacts.map((f) => f.id),
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
  return routes.map((route) => {
    const routeConcepts = concepts.filter((c) => c.scopeId === route.id);
    const conceptMap: RouteBlueprint["concepts"] = {};
    for (const c of routeConcepts) {
      conceptMap[c.type] = c.state;
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
  concepts: TechnicalConcept[],
): RouteBlueprint["pipeline"] {
  const getState = (
    type: TechnicalConcept["type"],
  ): TechnicalConcept | undefined => concepts.find((c) => c.type === type);

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
      getState("auth-gate"),
    ),
    nodeFromConcept(
      `${route.id}:role`,
      "role-gate",
      "Role",
      getState("role-gate"),
    ),
    nodeFromConcept(
      `${route.id}:validation`,
      "validation-gate",
      "Validation",
      getState("validation-gate"),
    ),
    {
      id: `${route.id}:handler`,
      type: "handler",
      label: "Handler",
      state: "confirmed",
      filePath: route.filePath,
      line: route.line,
    },
    nodeFromConcept(`${route.id}:db`, "db-write", "DB", getState("db-write")),
    nodeFromConcept(
      `${route.id}:external`,
      "external-api",
      "External",
      getState("external-api"),
    ),
  ];

  return nodes.filter((n) => n.state !== "missing" || n.type !== "role-gate");
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
  return routes.map((route) => {
    const routeFindings = findings.filter((f) => f.scopeId === route.id);
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

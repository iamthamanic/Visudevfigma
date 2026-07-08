/** Populates VisuDevGraph.findings[] from policy results (missing vs not applicable). */

import type {
  BlueprintFinding,
  CodeFact,
  RouteBlueprint,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type {
  VisuDevControlKind,
  VisuDevFinding,
  VisuDevGraph,
  VisuDevNodeKind,
} from "../../dto/graph/visudev-graph.dto.ts";
import { buildRouteFactsIndex } from "../internal/fact-scope-index.ts";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface PolicySpec {
  ruleId: string;
  controlKind: VisuDevControlKind;
  expectedState: string;
  isApplicable: (route: RouteScope, scopeFacts: CodeFact[]) => boolean;
}

const POLICY_SPECS: PolicySpec[] = [
  {
    ruleId: "web-api.validation-before-db-write",
    controlKind: "validation",
    expectedState: "Validation Gate confirmed vor DB Write",
    isApplicable: (route, scopeFacts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return false;
      const hasBody = scopeFacts.some((fact) =>
        fact.kind === "request-body-read"
      );
      const hasDbWrite = scopeFacts.some((fact) => fact.kind === "db-write");
      return hasBody && hasDbWrite;
    },
  },
  {
    ruleId: "web-api.auth-before-write",
    controlKind: "auth",
    expectedState: "Auth Gate confirmed",
    isApplicable: (route, scopeFacts) => {
      if (!WRITE_METHODS.has(route.method.toUpperCase())) return false;
      return scopeFacts.some((fact) => fact.kind === "db-write");
    },
  },
  {
    ruleId: "web-api.rate-limit-public",
    controlKind: "rate-limit",
    expectedState: "Rate Limit confirmed",
    isApplicable: (route) => {
      const pathLower = route.path.toLowerCase();
      return /login|reset|contact|upload|sign-up|signup|register/.test(
        pathLower,
      );
    },
  },
];

const RULE_TO_NODE_KIND: Record<VisuDevControlKind, VisuDevNodeKind> = {
  auth: "auth",
  validation: "validation",
  "rate-limit": "rate-limit",
  "db-write": "table",
};

export function attachGraphFindings(
  graph: VisuDevGraph,
  routes: RouteBlueprint[],
  routeScopes: RouteScope[],
  facts: CodeFact[],
  blueprintFindings: BlueprintFinding[],
): VisuDevGraph {
  return {
    ...graph,
    findings: buildGraphFindings(
      graph,
      routes,
      routeScopes,
      facts,
      blueprintFindings,
    ),
  };
}

export function buildGraphFindings(
  graph: VisuDevGraph,
  routes: RouteBlueprint[],
  routeScopes: RouteScope[],
  facts: CodeFact[],
  blueprintFindings: BlueprintFinding[],
): VisuDevFinding[] {
  const routeFactsIndex = buildRouteFactsIndex(routeScopes, facts);
  const blueprintByKey = new Map<string, BlueprintFinding>();
  for (const finding of blueprintFindings) {
    blueprintByKey.set(`${finding.scopeId}:${finding.ruleId}`, finding);
  }

  const graphFindings: VisuDevFinding[] = [];
  let findingIndex = 0;

  for (const route of routes) {
    const scope = routeScopes.find((entry) => entry.id === route.id);
    if (!scope) continue;
    const scopeFacts = routeFactsIndex.get(route.id) ?? [];

    for (const spec of POLICY_SPECS) {
      const blueprintFinding = blueprintByKey.get(
        `${route.id}:${spec.ruleId}`,
      );
      if (!spec.isApplicable(scope, scopeFacts)) {
        findingIndex += 1;
        graphFindings.push({
          id: `graph-finding-${findingIndex}`,
          ruleId: spec.ruleId,
          scopeId: route.id,
          controlKind: spec.controlKind,
          outcome: "not_applicable",
          message: `${spec.controlKind} control not applicable for route`,
          expectedState: spec.expectedState,
          actualState: "n/a",
          evidenceIds: [],
        });
        continue;
      }

      if (!blueprintFinding) continue;

      const expectedControlNodeId = resolveControlNodeId(
        graph,
        route.id,
        spec.controlKind,
      );
      findingIndex += 1;
      graphFindings.push({
        id: `graph-finding-${findingIndex}`,
        ruleId: blueprintFinding.ruleId,
        scopeId: blueprintFinding.scopeId,
        controlKind: spec.controlKind,
        expectedControlNodeId,
        outcome: "missing",
        message: blueprintFinding.message,
        expectedState: blueprintFinding.expectedState,
        actualState: blueprintFinding.actualState,
        evidenceIds: collectEvidenceIds(
          graph,
          blueprintFinding,
          expectedControlNodeId,
        ),
        severity: blueprintFinding.severity,
      });
    }
  }

  return graphFindings;
}

function resolveControlNodeId(
  graph: VisuDevGraph,
  scopeId: string,
  controlKind: VisuDevControlKind,
): string | undefined {
  const scope = graph.scopes.find((entry) => entry.id === scopeId);
  if (!scope) return undefined;

  const scopeNodeIds = new Set(scope.nodeIds);
  const nodeKind = RULE_TO_NODE_KIND[controlKind];
  const controlNode = graph.nodes.find((node) =>
    scopeNodeIds.has(node.id) && node.kind === nodeKind
  );
  return controlNode?.id;
}

function collectEvidenceIds(
  graph: VisuDevGraph,
  finding: BlueprintFinding,
  controlNodeId?: string,
): string[] {
  const evidenceIds = new Set<string>();

  for (const factId of finding.evidenceFactIds) {
    for (const evidence of graph.evidence) {
      if (evidence.factId === factId) evidenceIds.add(evidence.id);
    }
  }

  if (controlNodeId) {
    const controlNode = graph.nodes.find((node) => node.id === controlNodeId);
    for (const evidenceId of controlNode?.evidenceIds ?? []) {
      evidenceIds.add(evidenceId);
    }
  }

  return [...evidenceIds];
}

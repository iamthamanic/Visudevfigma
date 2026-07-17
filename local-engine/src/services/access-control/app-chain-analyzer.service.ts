/**
 * Application chain analyzer — walks SoftwareGraph route → auth → service →
 * repository → data edges and emits stack-agnostic AccessControlFinding rows.
 */

import type {
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMechanismDetail,
  AccessControlStatus,
  EnforcementLayer,
} from "../../../../shared/access-control.types.js";
import type {
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphEvidence,
  SoftwareGraphNode,
} from "../../../../shared/software-graph.types.js";

const TENANT_RE = /\b(tenant[_-]?id|org[_-]?id|workspace[_-]?id|account[_-]?id)\b/i;
const OWNER_RE = /\b(owner[_-]?id|user[_-]?id|created[_-]?by|author[_-]?id)\b/i;
const ROLE_RE = /\b(role|permission|authorize|rbac|hasRole|requireRole)\b/i;
const UNSCOPED_DB_RE =
  /\.(find(?:One|Many)?|findUnique|findFirst|findMany|query|select)\s*\(\s*\{\s*\}\s*\)|\.find\(\s*\{\s*\}\s*\)|SELECT\s+\*\s+FROM\s+\w+\s*;?/i;

const CHAIN_EDGE_KINDS = new Set([
  "authenticates",
  "validates",
  "calls",
  "api",
  "data",
  "implements",
  "imports",
]);

export interface AppChainAnalyzerInput {
  graph: SoftwareGraph;
  /** Optional route ids to limit analysis; defaults to all route nodes. */
  routeIds?: string[];
}

function evidenceForNode(graph: SoftwareGraph, nodeId: string): SoftwareGraphEvidence[] {
  return graph.evidence.filter((e) => e.nodeId === nodeId);
}

function toAccessEvidence(items: SoftwareGraphEvidence[]): AccessControlEvidence[] {
  return items.slice(0, 8).map((e) => ({
    id: e.id,
    kind: e.kind,
    filePath: e.filePath,
    line: e.line,
    excerpt: e.excerpt,
    factId: e.factId,
  }));
}

function buildOutgoing(edges: SoftwareGraphEdge[]): Map<string, SoftwareGraphEdge[]> {
  const map = new Map<string, SoftwareGraphEdge[]>();
  for (const edge of edges) {
    if (!CHAIN_EDGE_KINDS.has(edge.kind)) continue;
    const list = map.get(edge.sourceId) ?? [];
    list.push(edge);
    map.set(edge.sourceId, list);
  }
  return map;
}

function collectReachable(
  routeId: string,
  outgoing: Map<string, SoftwareGraphEdge[]>,
  nodes: Map<string, SoftwareGraphNode>,
): { nodeIds: Set<string>; edgeKinds: Set<string>; nodesByKind: Map<string, SoftwareGraphNode[]> } {
  const nodeIds = new Set<string>([routeId]);
  const edgeKinds = new Set<string>();
  const nodesByKind = new Map<string, SoftwareGraphNode[]>();
  const queue = [routeId];
  let depth = 0;

  while (queue.length > 0 && depth < 12) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const sourceId = queue.shift()!;
      for (const edge of outgoing.get(sourceId) ?? []) {
        edgeKinds.add(edge.kind);
        if (nodeIds.has(edge.targetId)) continue;
        const target = nodes.get(edge.targetId);
        if (!target) continue;
        nodeIds.add(edge.targetId);
        queue.push(edge.targetId);
        const bucket = nodesByKind.get(target.kind) ?? [];
        bucket.push(target);
        nodesByKind.set(target.kind, bucket);
      }
    }
    depth += 1;
  }

  return { nodeIds, edgeKinds, nodesByKind };
}

function snippetBlob(evidence: SoftwareGraphEvidence[]): string {
  return evidence.map((e) => `${e.kind}\n${e.excerpt}`).join("\n");
}

function finding(
  partial: Omit<AccessControlFinding, "confidence"> & { confidence?: number },
): AccessControlFinding {
  return { confidence: 0.75, ...partial };
}

function statusFromBoolean(
  ok: boolean,
  whenMissing: AccessControlStatus = "missing",
): AccessControlStatus {
  return ok ? "protected" : whenMissing;
}

/**
 * Analyze application-layer enforcement along each route's graph neighborhood.
 */
export function analyzeApplicationChain(input: AppChainAnalyzerInput): AccessControlFinding[] {
  const { graph } = input;
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoing = buildOutgoing(graph.edges);
  const routes = graph.nodes.filter(
    (n) => n.kind === "route" && (!input.routeIds || input.routeIds.includes(n.id)),
  );

  const findings: AccessControlFinding[] = [];

  for (const route of routes) {
    // Prefer scan route id (metadata.routeId) so matrix join matches deriveRoutesFromGraph.
    const resourceId =
      typeof route.metadata.routeId === "string" && route.metadata.routeId.length > 0
        ? route.metadata.routeId
        : route.id;
    const { nodeIds, edgeKinds, nodesByKind } = collectReachable(route.id, outgoing, nodes);
    const chainEvidence = [...nodeIds].flatMap((id) => evidenceForNode(graph, id));
    const blob = snippetBlob(chainEvidence);
    const hasAuth = edgeKinds.has("authenticates");
    const hasValidation = edgeKinds.has("validates");
    const hasRepo = (nodesByKind.get("repository")?.length ?? 0) > 0;
    const hasTable = (nodesByKind.get("table")?.length ?? 0) > 0 || edgeKinds.has("data");
    const hasTenant = TENANT_RE.test(blob);
    const hasOwner = OWNER_RE.test(blob);
    const hasRole = ROLE_RE.test(blob);
    const hasUnscopedDb = UNSCOPED_DB_RE.test(blob);
    const touchesData = hasRepo || hasTable;

    const layers: EnforcementLayer[] = ["api"];
    if (hasRepo) layers.push("repository");
    if (hasTable) layers.push("database");

    const authMechanism: AccessControlMechanismDetail = {
      kind: "application-guard",
      label: "Auth Middleware",
      technology: "app",
    };
    const repoFilter: AccessControlMechanismDetail = {
      kind: "repository-filter",
      label: "Repository Query Filter",
      technology: "app",
    };
    const queryScope: AccessControlMechanismDetail = {
      kind: "query-scope",
      label: "Query Scope",
      technology: "app",
    };

    findings.push(
      finding({
        id: `ac-authn-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "authentication",
        status: statusFromBoolean(hasAuth, touchesData ? "missing" : "unverified"),
        mechanisms: hasAuth ? [authMechanism] : [],
        enforcementLayers: hasAuth ? ["api"] : [],
        evidence: toAccessEvidence(
          chainEvidence.filter((e) => /auth|session|middleware/i.test(e.kind + e.excerpt)),
        ),
        ruleId: "access-control.authentication",
      }),
    );

    findings.push(
      finding({
        id: `ac-authz-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "authorization",
        status: hasRole
          ? "protected"
          : hasAuth
            ? "unverified"
            : touchesData
              ? "missing"
              : "unverified",
        mechanisms: hasRole
          ? [{ kind: "service-authorization", label: "Role / Permission Check", technology: "app" }]
          : [],
        enforcementLayers: hasRole ? ["api", "service"] : [],
        evidence: toAccessEvidence(chainEvidence.filter((e) => ROLE_RE.test(e.kind + e.excerpt))),
        ruleId: "access-control.authorization",
      }),
    );

    findings.push(
      finding({
        id: `ac-validation-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "validation",
        status: statusFromBoolean(hasValidation, "unverified"),
        mechanisms: hasValidation
          ? [{ kind: "input-validation", label: "Input Validation", technology: "app" }]
          : [],
        enforcementLayers: hasValidation ? ["api"] : [],
        evidence: toAccessEvidence(
          chainEvidence.filter((e) => /valid|zod|schema/i.test(e.kind + e.excerpt)),
        ),
        ruleId: "access-control.validation",
      }),
    );

    let tenantStatus: AccessControlStatus = "not-applicable";
    let tenantWarning: string | undefined;
    if (touchesData) {
      if (hasTenant && !hasUnscopedDb) {
        tenantStatus = "protected";
      } else if (hasTenant && hasUnscopedDb) {
        tenantStatus = "partial";
        tenantWarning =
          "Tenant filter evidenced on some paths, but an unscoped DB query was also found.";
      } else if (hasUnscopedDb) {
        tenantStatus = "missing";
        tenantWarning =
          "Direct DB access without tenant/owner filter — possible bypass of tenant isolation.";
      } else {
        tenantStatus = "missing";
      }
    }

    findings.push(
      finding({
        id: `ac-tenant-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "tenant-isolation",
        status: tenantStatus,
        mechanisms: hasTenant
          ? [repoFilter, { kind: "tenant-filter", label: "Tenant Filter", technology: "app" }]
          : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(
          chainEvidence.filter((e) => TENANT_RE.test(e.excerpt) || UNSCOPED_DB_RE.test(e.excerpt)),
        ),
        warning: tenantWarning,
        ruleId: "access-control.tenant-isolation",
        confidence: touchesData ? 0.8 : 0.5,
      }),
    );

    let ownershipStatus: AccessControlStatus = "not-applicable";
    let ownershipWarning: string | undefined;
    if (touchesData) {
      if (hasOwner && !hasUnscopedDb) {
        ownershipStatus = "protected";
      } else if (hasOwner && hasUnscopedDb) {
        ownershipStatus = "partial";
        ownershipWarning = "Ownership filter evidenced, but an unscoped DB query bypass may exist.";
      } else if (hasUnscopedDb && !hasTenant) {
        ownershipStatus = "missing";
        ownershipWarning = "Unscoped DB query without ownership check.";
      } else {
        ownershipStatus = "unverified";
      }
    }

    findings.push(
      finding({
        id: `ac-ownership-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "ownership",
        status: ownershipStatus,
        mechanisms: hasOwner
          ? [{ kind: "ownership-check", label: "Ownership Check", technology: "app" }]
          : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(chainEvidence.filter((e) => OWNER_RE.test(e.excerpt))),
        warning: ownershipWarning,
        ruleId: "access-control.ownership",
      }),
    );

    const scopeProtected = hasTenant || hasOwner || (hasRepo && !hasUnscopedDb && touchesData);
    findings.push(
      finding({
        id: `ac-scope-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "resource-scope",
        status: !touchesData
          ? "not-applicable"
          : scopeProtected && !hasUnscopedDb
            ? "protected"
            : hasUnscopedDb
              ? "partial"
              : "missing",
        mechanisms: scopeProtected
          ? [queryScope, ...(hasTenant || hasOwner ? [repoFilter] : [])]
          : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(chainEvidence.slice(0, 4)),
        warning: hasUnscopedDb
          ? "Bypass: DB operation without tenant/owner scope filter."
          : undefined,
        ruleId: "access-control.resource-scope",
      }),
    );
  }

  return findings;
}

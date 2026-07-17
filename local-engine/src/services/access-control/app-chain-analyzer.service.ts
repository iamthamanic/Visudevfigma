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
  SoftwareGraphEvidence,
} from "../../../../shared/software-graph.types.js";
import { buildOutgoing, collectReachable } from "./app-chain-reachability.js";
import {
  OWNER_RE,
  ROLE_RE,
  TENANT_RE,
  UNSCOPED_DB_RE,
  collectChainEvidence,
  detectChainSignals,
  filterEvidence,
  indexEvidenceByNode,
} from "./app-chain-signals.js";

export interface AppChainAnalyzerInput {
  graph: SoftwareGraph;
  routeIds?: string[];
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

function resolveResourceScopeStatus(opts: {
  touchesData: boolean;
  hasTenant: boolean;
  hasOwner: boolean;
  hasUnscopedDb: boolean;
  truncated: boolean;
}): AccessControlStatus {
  const { touchesData, hasTenant, hasOwner, hasUnscopedDb, truncated } = opts;
  if (!touchesData) return "not-applicable";
  // Require an explicit scope filter — repo reachability alone must not imply protected.
  const hasScopeFilter = hasTenant || hasOwner;
  if (truncated && !hasScopeFilter) return "unverified";
  if (hasScopeFilter && !hasUnscopedDb) return "protected";
  if (hasScopeFilter && hasUnscopedDb) return "partial";
  if (hasUnscopedDb) return "partial";
  return "missing";
}

/**
 * Analyze application-layer enforcement along each route's graph neighborhood.
 */
export function analyzeApplicationChain(input: AppChainAnalyzerInput): AccessControlFinding[] {
  const { graph } = input;
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoing = buildOutgoing(graph.edges);
  const evidenceByNode = indexEvidenceByNode(graph.evidence);
  const routes = graph.nodes.filter(
    (n) => n.kind === "route" && (!input.routeIds || input.routeIds.includes(n.id)),
  );

  const findings: AccessControlFinding[] = [];

  for (const route of routes) {
    const resourceId =
      typeof route.metadata.routeId === "string" && route.metadata.routeId.length > 0
        ? route.metadata.routeId
        : route.id;
    const { nodeIds, edgeKinds, nodesByKind, truncated } = collectReachable(
      route.id,
      outgoing,
      nodes,
    );
    const chainEvidence = collectChainEvidence(nodeIds, evidenceByNode);
    const signals = detectChainSignals(chainEvidence);
    const hasAuth = edgeKinds.has("authenticates");
    const hasValidation = edgeKinds.has("validates");
    const hasRepo = (nodesByKind.get("repository")?.length ?? 0) > 0;
    const hasTable = (nodesByKind.get("table")?.length ?? 0) > 0 || edgeKinds.has("data");
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

    const truncateNote = truncated
      ? "Call chain truncated at depth limit; classification may be incomplete."
      : undefined;

    findings.push(
      finding({
        id: `ac-authn-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "authentication",
        status:
          truncated && !hasAuth
            ? "unverified"
            : statusFromBoolean(hasAuth, touchesData ? "missing" : "unverified"),
        mechanisms: hasAuth ? [authMechanism] : [],
        enforcementLayers: hasAuth ? ["api"] : [],
        evidence: toAccessEvidence(
          filterEvidence(chainEvidence, (e) => /auth|session|middleware/i.test(e.kind + e.excerpt)),
        ),
        warning: truncateNote,
        ruleId: "access-control.authentication",
      }),
    );

    findings.push(
      finding({
        id: `ac-authz-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "authorization",
        status: signals.hasRole
          ? "protected"
          : hasAuth
            ? "unverified"
            : touchesData
              ? "missing"
              : "unverified",
        mechanisms: signals.hasRole
          ? [{ kind: "service-authorization", label: "Role / Permission Check", technology: "app" }]
          : [],
        enforcementLayers: signals.hasRole ? ["api", "service"] : [],
        evidence: toAccessEvidence(
          filterEvidence(chainEvidence, (e) => ROLE_RE.test(e.kind + e.excerpt)),
        ),
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
          filterEvidence(chainEvidence, (e) => /valid|zod|schema/i.test(e.kind + e.excerpt)),
        ),
        ruleId: "access-control.validation",
      }),
    );

    let tenantStatus: AccessControlStatus = "not-applicable";
    let tenantWarning: string | undefined;
    if (touchesData) {
      if (signals.hasTenant && !signals.hasUnscopedDb) {
        tenantStatus = "protected";
      } else if (signals.hasTenant && signals.hasUnscopedDb) {
        tenantStatus = "partial";
        tenantWarning =
          "Tenant filter evidenced on some paths, but an unscoped DB query was also found.";
      } else if (signals.hasUnscopedDb) {
        tenantStatus = "missing";
        tenantWarning =
          "Direct DB access without tenant/owner filter — possible bypass of tenant isolation.";
      } else if (truncated) {
        tenantStatus = "unverified";
        tenantWarning = truncateNote;
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
        mechanisms: signals.hasTenant
          ? [repoFilter, { kind: "tenant-filter", label: "Tenant Filter", technology: "app" }]
          : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(
          filterEvidence(
            chainEvidence,
            (e) => TENANT_RE.test(e.excerpt) || UNSCOPED_DB_RE.test(e.excerpt),
          ),
        ),
        warning: tenantWarning,
        ruleId: "access-control.tenant-isolation",
        confidence: touchesData ? 0.8 : 0.5,
      }),
    );

    let ownershipStatus: AccessControlStatus = "not-applicable";
    let ownershipWarning: string | undefined;
    if (touchesData) {
      if (signals.hasOwner && !signals.hasUnscopedDb) {
        ownershipStatus = "protected";
      } else if (signals.hasOwner && signals.hasUnscopedDb) {
        ownershipStatus = "partial";
        ownershipWarning = "Ownership filter evidenced, but an unscoped DB query bypass may exist.";
      } else if (signals.hasUnscopedDb && !signals.hasTenant) {
        ownershipStatus = "missing";
        ownershipWarning = "Unscoped DB query without ownership check.";
      } else if (truncated) {
        ownershipStatus = "unverified";
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
        mechanisms: signals.hasOwner
          ? [{ kind: "ownership-check", label: "Ownership Check", technology: "app" }]
          : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(filterEvidence(chainEvidence, (e) => OWNER_RE.test(e.excerpt))),
        warning: ownershipWarning,
        ruleId: "access-control.ownership",
      }),
    );

    const scopeStatus = resolveResourceScopeStatus({
      touchesData,
      hasTenant: signals.hasTenant,
      hasOwner: signals.hasOwner,
      hasUnscopedDb: signals.hasUnscopedDb,
      truncated,
    });
    const hasScopeFilter = signals.hasTenant || signals.hasOwner;

    findings.push(
      finding({
        id: `ac-scope-${resourceId}`,
        resourceId,
        resourceKind: "route",
        control: "resource-scope",
        status: scopeStatus,
        mechanisms: hasScopeFilter ? [queryScope, repoFilter] : [],
        enforcementLayers: layers,
        evidence: toAccessEvidence(chainEvidence.slice(0, 4)),
        warning: signals.hasUnscopedDb
          ? "Bypass: DB operation without tenant/owner scope filter."
          : truncateNote,
        ruleId: "access-control.resource-scope",
      }),
    );
  }

  return findings;
}

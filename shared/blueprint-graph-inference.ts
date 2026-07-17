/**
 * Heuristic + graph-edge security inference for Diagnostics matrix.
 * visudev-gapclose P0-4: prefer authenticates/validates/data edges over snippet-only `?`.
 */

import type { SoftwareGraph } from "./software-graph.types.js";
import type {
  ProjectedCodeFact,
  ProjectedRoute,
  ProjectedSecurityMatrixRow,
} from "./blueprint-graph-types.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const AUTH_EVIDENCE_PATTERN = /auth|middleware|protect|guard|session|jwt|oauth|authorize/i;
const VALIDATION_EVIDENCE_PATTERN =
  /zod|joi|yup|validator|validate|schema|body\(|query\(|params\(|class-validator|IsString|IsEmail/i;
const ROLE_EVIDENCE_PATTERN =
  /permission_classes|has_permission|BasePermission|DjangoModelPermissions|IsAuthenticated|authorize(?:Any|OrSelf)?\s*\(/i;

type NormalizedRoute = Pick<ProjectedRoute, "id" | "method" | "path" | "filePath" | "line">;

export interface RouteFactsIndexes {
  routeFactsIndex: Map<string, ProjectedCodeFact[]>;
  factsByFilePath: Map<string, ProjectedCodeFact[]>;
  authByDirectory: Map<string, boolean>;
  validationByFile: Map<string, boolean>;
}

function dirnameOfFile(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash <= 0 ? "" : filePath.slice(0, lastSlash);
}

function isPathUnderDirectory(filePath: string, directory: string): boolean {
  if (!directory) return false;
  if (filePath === directory) return true;
  return filePath.startsWith(`${directory}/`);
}

function indexFactsByFilePath(facts: ProjectedCodeFact[]): Map<string, ProjectedCodeFact[]> {
  const factsByFilePath = new Map<string, ProjectedCodeFact[]>();
  for (const fact of facts) {
    const list = factsByFilePath.get(fact.filePath) ?? [];
    list.push(fact);
    factsByFilePath.set(fact.filePath, list);
  }
  return factsByFilePath;
}

function buildFactsByAncestorDirectory(
  facts: ProjectedCodeFact[],
): Map<string, ProjectedCodeFact[]> {
  const index = new Map<string, ProjectedCodeFact[]>();
  for (const fact of facts) {
    let directory = dirnameOfFile(fact.filePath);
    while (directory) {
      const list = index.get(directory) ?? [];
      list.push(fact);
      index.set(directory, list);
      const parent = dirnameOfFile(directory);
      if (!parent || parent === directory) break;
      directory = parent;
    }
  }
  return index;
}

function buildScopedDirectoryFacts(
  factsByDirectory: Map<string, ProjectedCodeFact[]>,
): Map<string, ProjectedCodeFact[]> {
  const scoped = new Map<string, ProjectedCodeFact[]>();
  for (const [directory, candidates] of factsByDirectory) {
    const seen = new Set<string>();
    const scopedFacts: ProjectedCodeFact[] = [];
    for (const fact of candidates) {
      if (seen.has(fact.id)) continue;
      if (!isPathUnderDirectory(fact.filePath, directory)) continue;
      seen.add(fact.id);
      scopedFacts.push(fact);
    }
    scoped.set(directory, scopedFacts);
  }
  return scoped;
}

function buildAuthByDirectory(
  scopedDirectoryFacts: Map<string, ProjectedCodeFact[]>,
): Map<string, boolean> {
  const authByDirectory = new Map<string, boolean>();
  for (const [directory, dirFacts] of scopedDirectoryFacts) {
    authByDirectory.set(
      directory,
      dirFacts.some((fact) => AUTH_EVIDENCE_PATTERN.test(fact.snippet)),
    );
  }
  return authByDirectory;
}

function buildValidationByFile(
  factsByFilePath: Map<string, ProjectedCodeFact[]>,
): Map<string, boolean> {
  const validationByFile = new Map<string, boolean>();
  for (const [filePath, fileFacts] of factsByFilePath) {
    validationByFile.set(
      filePath,
      fileFacts.some((fact) => VALIDATION_EVIDENCE_PATTERN.test(fact.snippet)),
    );
  }
  return validationByFile;
}

export function buildRouteFactsIndexes(
  routes: ProjectedRoute[],
  facts: ProjectedCodeFact[],
): RouteFactsIndexes {
  const factsByFilePath = indexFactsByFilePath(facts);
  const factsByDirectory = buildFactsByAncestorDirectory(facts);
  const scopedDirectoryFacts = buildScopedDirectoryFacts(factsByDirectory);
  const authByDirectory = buildAuthByDirectory(scopedDirectoryFacts);
  const validationByFile = buildValidationByFile(factsByFilePath);
  const routeFactsIndex = new Map<string, ProjectedCodeFact[]>();

  for (const route of routes) {
    const directory = dirnameOfFile(route.filePath);
    routeFactsIndex.set(route.id, scopedDirectoryFacts.get(directory) ?? []);
  }

  return {
    routeFactsIndex,
    factsByFilePath,
    authByDirectory,
    validationByFile,
  };
}

export function buildRouteFactsIndex(
  routes: ProjectedRoute[],
  facts: ProjectedCodeFact[],
): Map<string, ProjectedCodeFact[]> {
  return buildRouteFactsIndexes(routes, facts).routeFactsIndex;
}

function resolveAuthState(
  route: NormalizedRoute,
  hasAuthEvidence: boolean,
): ProjectedSecurityMatrixRow["auth"]["state"] {
  if (hasAuthEvidence) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

function resolveValidationState(
  route: NormalizedRoute,
  hasValidationEvidence: boolean,
): ProjectedSecurityMatrixRow["validation"]["state"] {
  if (hasValidationEvidence) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "missing";
  return "unknown";
}

export function inferAuthState(
  route: NormalizedRoute,
  routeFacts: ProjectedCodeFact[],
): ProjectedSecurityMatrixRow["auth"]["state"] {
  return resolveAuthState(
    route,
    routeFacts.some((fact) => AUTH_EVIDENCE_PATTERN.test(fact.snippet)),
  );
}

export function inferValidationState(
  route: NormalizedRoute,
  routeFacts: ProjectedCodeFact[],
): ProjectedSecurityMatrixRow["validation"]["state"] {
  return resolveValidationState(
    route,
    routeFacts.some(
      (fact) => fact.filePath === route.filePath && VALIDATION_EVIDENCE_PATTERN.test(fact.snippet),
    ),
  );
}

export interface RouteInference {
  auth: ProjectedSecurityMatrixRow["auth"]["state"];
  validation: ProjectedSecurityMatrixRow["validation"]["state"];
  role: ProjectedSecurityMatrixRow["role"]["state"];
  db: ProjectedSecurityMatrixRow["db"]["state"];
}

type MatrixState = ProjectedSecurityMatrixRow["auth"]["state"];

function preferConfirmed(a: MatrixState, b: MatrixState): MatrixState {
  if (a === "confirmed" || b === "confirmed") return "confirmed";
  if (a === "missing" || b === "missing") return "missing";
  if (a === "partial" || b === "partial") return "partial";
  return a !== "unknown" && a !== "n/a" ? a : b;
}

/** True when an execution group for this route includes a confirmed table node. */
export function routeExecutionHasTable(
  graph: SoftwareGraph,
  route: { id: string; filePath: string; line: number },
  nodeById?: Map<string, SoftwareGraph["nodes"][number]>,
): boolean {
  const nodesById = nodeById ?? new Map(graph.nodes.map((node) => [node.id, node] as const));
  const routeNodeIds = new Set(
    graph.nodes
      .filter((node) => {
        if (node.kind !== "route") return false;
        if (node.filePath !== route.filePath) return false;
        const metaId = typeof node.metadata.routeId === "string" ? node.metadata.routeId : "";
        return node.id === route.id || metaId === route.id || node.line === route.line;
      })
      .map((node) => node.id),
  );
  if (routeNodeIds.size === 0) return false;

  for (const group of graph.groups ?? []) {
    // Only execution pipeline groups — never invent db from unrelated route clusters.
    if (!String(group.id).startsWith("execution:")) continue;
    const hasRoute = group.nodeIds.some((id) => routeNodeIds.has(id));
    if (!hasRoute) continue;
    if (group.nodeIds.some((id) => nodesById.get(id)?.kind === "table")) return true;
  }
  return false;
}

export interface RouteEdgeSignals {
  hasAuth: boolean;
  hasValidation: boolean;
  hasDb: boolean;
  /** Evidence linked via applicable authenticates/validates/data edges (for AC v2 inspector). */
  evidence: SoftwareGraph["evidence"];
}

export interface RouteSnippetSignals {
  hasAuth: boolean;
  hasValidation: boolean;
  hasRole: boolean;
  evidence: SoftwareGraph["evidence"];
}

/**
 * Directory/file snippet signals — same heuristics as legacy securityMatrix
 * (authByDirectory / validationByFile / ROLE_EVIDENCE_PATTERN). Needed when the
 * graph has auth-check facts but no authenticates edges (common after condensation).
 */
export function collectRouteSnippetSignals(
  route: { id: string; filePath: string },
  indexes: RouteFactsIndexes,
): RouteSnippetSignals {
  const directory = dirnameOfFile(route.filePath);
  const routeFacts = indexes.routeFactsIndex.get(route.id) ?? [];
  const hasAuth = indexes.authByDirectory.get(directory) ?? false;
  const hasValidation = indexes.validationByFile.get(route.filePath) ?? false;
  const hasRole = routeFacts.some(
    (fact) =>
      (fact.filePath === route.filePath || isPathUnderDirectory(fact.filePath, directory)) &&
      ROLE_EVIDENCE_PATTERN.test(fact.snippet),
  );

  const evidence: SoftwareGraph["evidence"] = [];
  const seen = new Set<string>();
  for (const fact of routeFacts) {
    if (evidence.length >= 8) break;
    // Prefer auth-check / authorize / role / validation — not incidental "session" in DB snippets.
    const hit =
      /auth-check|authorize|requireAuth|middleware|permission_classes|IsAuthenticated/i.test(
        `${fact.kind}\n${fact.snippet}`,
      ) ||
      ROLE_EVIDENCE_PATTERN.test(fact.snippet) ||
      (fact.filePath === route.filePath && VALIDATION_EVIDENCE_PATTERN.test(fact.snippet));
    if (!hit || seen.has(fact.id)) continue;
    seen.add(fact.id);
    evidence.push({
      id: `ev-snippet-${fact.id}`,
      factId: fact.id,
      kind: fact.kind,
      filePath: fact.filePath,
      line: fact.line,
      excerpt: fact.snippet,
    });
  }

  return { hasAuth, hasValidation, hasRole, evidence };
}

/** Outgoing control/data edges scoped to a route via evidence line ownership. */
export function collectRouteEdgeSignals(
  graph: SoftwareGraph,
  route: { id?: string; filePath: string; line: number },
  siblingRoutes: Array<{ filePath: string; line: number }> = [],
  nodeById?: Map<string, SoftwareGraph["nodes"][number]>,
): RouteEdgeSignals {
  const nodesById = nodeById ?? new Map(graph.nodes.map((node) => [node.id, node] as const));
  const routeDir = dirnameOfFile(route.filePath);
  const routeFileNodeIds = new Set(
    graph.nodes
      .filter((node) => node.kind === "file" && node.filePath === route.filePath)
      .map((node) => node.id),
  );
  for (const node of graph.nodes) {
    if (node.kind === "route" && node.filePath === route.filePath) {
      routeFileNodeIds.add(node.id);
    }
  }

  const evidenceByFactId = new Map(graph.evidence.map((ev) => [ev.factId, ev] as const));
  const sameFileLines = siblingRoutes
    .filter((r) => r.filePath === route.filePath)
    .map((r) => r.line)
    .sort((a, b) => a - b);
  const routeIndex = sameFileLines.indexOf(route.line);
  const lineStart = route.line;
  const lineEnd =
    routeIndex >= 0 && routeIndex + 1 < sameFileLines.length
      ? sameFileLines[routeIndex + 1]!
      : Number.POSITIVE_INFINITY;
  const routesInFile = sameFileLines.length || 1;

  const lineOwnsEvidence = (line: number): boolean => line >= lineStart && line < lineEnd;

  let hasAuth = false;
  let hasValidation = false;
  let hasDb = false;
  const evidence: SoftwareGraph["evidence"] = [];
  const seenEvidence = new Set<string>();

  const pushEvidence = (item: SoftwareGraph["evidence"][number] | undefined): void => {
    if (!item || seenEvidence.has(item.id)) return;
    seenEvidence.add(item.id);
    evidence.push(item);
  };

  for (const edge of graph.edges) {
    if (edge.kind !== "authenticates" && edge.kind !== "validates" && edge.kind !== "data") {
      continue;
    }

    const sourceNode = nodesById.get(edge.sourceId);
    const fromRouteFile = routeFileNodeIds.has(edge.sourceId);
    const sourcePath = sourceNode?.filePath ?? "";
    const sameModuleData =
      edge.kind === "data" &&
      Boolean(sourcePath) &&
      dirnameOfFile(sourcePath) === routeDir &&
      /\.(service|repository|repo)\.[jt]sx?$/i.test(sourcePath);
    const leaveRouteDbFact =
      edge.kind === "data" && fromRouteFile && edge.metadata?.reason === "leave-route-db-fact";

    if (!fromRouteFile && !sameModuleData) continue;

    const evidenceFactId =
      typeof edge.metadata.evidenceFactId === "string" ? edge.metadata.evidenceFactId : "";
    const linkedEvidence = evidenceFactId ? evidenceByFactId.get(evidenceFactId) : undefined;

    let applies = false;
    if (sameModuleData || leaveRouteDbFact) {
      // Shared module service DB / leave→LeaveRequest edges apply to routes in the file.
      applies = true;
    } else if (routesInFile <= 1) {
      applies = true;
    } else if (linkedEvidence) {
      applies = linkedEvidence.filePath === route.filePath && lineOwnsEvidence(linkedEvidence.line);
    }

    if (!applies) continue;
    if (edge.kind === "authenticates") hasAuth = true;
    else if (edge.kind === "validates") hasValidation = true;
    else if (edge.kind === "data") hasDb = true;

    pushEvidence(linkedEvidence);
    if (leaveRouteDbFact && !linkedEvidence) {
      const table = nodesById.get(edge.targetId);
      pushEvidence({
        id: `ev-leave-db-${edge.id}`,
        factId: edge.id,
        kind: "leave-route-db-fact",
        filePath: route.filePath,
        line: route.line,
        excerpt: `data→${table?.label ?? "LeaveRequest"} (leave-route-db-fact)`,
      });
    }
  }

  if (
    !hasDb &&
    route.id &&
    routeExecutionHasTable(
      graph,
      { id: route.id, filePath: route.filePath, line: route.line },
      nodesById,
    )
  ) {
    hasDb = true;
  }

  return { hasAuth, hasValidation, hasDb, evidence };
}

function resolveRoleState(
  route: NormalizedRoute,
  hasRoleEvidence: boolean,
): ProjectedSecurityMatrixRow["role"]["state"] {
  if (hasRoleEvidence) return "confirmed";
  if (MUTATING_METHODS.has(route.method)) return "unknown";
  return "unknown";
}

function resolveDbState(hasDbEvidence: boolean): ProjectedSecurityMatrixRow["db"]["state"] {
  return hasDbEvidence ? "confirmed" : "unknown";
}

export function inferRouteStates(
  routes: ProjectedRoute[],
  indexes: RouteFactsIndexes,
  graph?: SoftwareGraph | null,
): Map<string, RouteInference> {
  const states = new Map<string, RouteInference>();
  const siblingRoutes = routes.map((r) => ({ filePath: r.filePath, line: r.line }));
  const nodeById = graph ? new Map(graph.nodes.map((node) => [node.id, node] as const)) : undefined;
  for (const route of routes) {
    const directory = dirnameOfFile(route.filePath);
    const routeFacts = indexes.routeFactsIndex.get(route.id) ?? [];
    const snippetAuth = indexes.authByDirectory.get(directory) ?? false;
    const snippetValidation = indexes.validationByFile.get(route.filePath) ?? false;
    const snippetRole = routeFacts.some(
      (fact) =>
        (fact.filePath === route.filePath || isPathUnderDirectory(fact.filePath, directory)) &&
        ROLE_EVIDENCE_PATTERN.test(fact.snippet),
    );

    const edgeSignals = graph
      ? collectRouteEdgeSignals(
          graph,
          { id: route.id, filePath: route.filePath, line: route.line },
          siblingRoutes,
          nodeById,
        )
      : { hasAuth: false, hasValidation: false, hasDb: false };

    const auth = preferConfirmed(
      resolveAuthState(route, snippetAuth),
      resolveAuthState(route, edgeSignals.hasAuth),
    );
    const validation = preferConfirmed(
      resolveValidationState(route, snippetValidation),
      resolveValidationState(route, edgeSignals.hasValidation),
    );
    // Role/Permission: only permission/authorize evidence — never invent from bare auth edges.
    const role = resolveRoleState(route, snippetRole);

    states.set(route.id, {
      auth,
      validation,
      role,
      db: resolveDbState(edgeSignals.hasDb),
    });
  }
  return states;
}

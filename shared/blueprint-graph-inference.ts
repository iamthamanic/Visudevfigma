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

/** File-node outgoing control/data edges for a route's source file. */
export function collectRouteEdgeSignals(
  graph: SoftwareGraph,
  routeFilePath: string,
): { hasAuth: boolean; hasValidation: boolean; hasDb: boolean } {
  const fileNodeIds = new Set(
    graph.nodes
      .filter((node) => node.kind === "file" && node.filePath === routeFilePath)
      .map((node) => node.id),
  );
  // Also accept edges sourced from the route node itself (analyzer-style graphs).
  for (const node of graph.nodes) {
    if (node.kind === "route" && node.filePath === routeFilePath) {
      fileNodeIds.add(node.id);
    }
  }

  let hasAuth = false;
  let hasValidation = false;
  let hasDb = false;
  for (const edge of graph.edges) {
    if (!fileNodeIds.has(edge.sourceId)) continue;
    if (edge.kind === "authenticates") hasAuth = true;
    else if (edge.kind === "validates") hasValidation = true;
    else if (edge.kind === "data") hasDb = true;
  }
  return { hasAuth, hasValidation, hasDb };
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
      ? collectRouteEdgeSignals(graph, route.filePath)
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
